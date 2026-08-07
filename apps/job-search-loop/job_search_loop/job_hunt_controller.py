from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Callable, Iterable


TERMINAL_CANDIDATE_STATUSES = frozenset(
    {"pre_click_failed", "submit_unknown", "submitted"}
)


def run_campaign(
    *,
    requests: Iterable[dict[str, Any]],
    evidence_root: Path,
    execute: Callable[[dict[str, Any], Path], dict[str, Any]],
    on_attempt: Callable[[dict[str, Any], dict[str, Any], Path], None] | None = None,
) -> dict[str, Any]:
    root = Path(evidence_root)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    attempts: list[dict[str, Any]] = []
    submitted: list[str] = []
    submit_unknown: list[str] = []

    for index, request in enumerate(requests, start=1):
        attempt_root = root / f"attempt-{index:02d}"
        attempt_root.mkdir(mode=0o700)
        outcome = execute(request, attempt_root)
        status = str(outcome.get("status") or "")
        if status not in TERMINAL_CANDIDATE_STATUSES:
            raise ValueError(f"invalid candidate outcome: {status or 'missing'}")
        application_id = str(outcome.get("application_id") or "")
        attempts.append({
            "index": index,
            "company": str(request.get("company") or ""),
            "title": str(request.get("title") or ""),
            "status": status,
            "application_id": application_id or None,
            "evidence_dir": str(attempt_root),
            "reason": outcome.get("reason"),
        })
        if on_attempt is not None:
            on_attempt(request, attempts[-1], attempt_root)
        if status == "submit_unknown":
            if application_id:
                submit_unknown.append(application_id)
            continue
        if status == "submitted":
            if not application_id:
                raise ValueError("submitted outcome requires application_id")
            submitted.append(application_id)
            return {
                "version": 1,
                "status": "submitted",
                "attempt_count": len(attempts),
                "submitted": submitted,
                "submit_unknown": submit_unknown,
                "attempts": attempts,
            }

    return {
        "version": 1,
        "status": "exhausted_without_submission",
        "attempt_count": len(attempts),
        "submitted": submitted,
        "submit_unknown": submit_unknown,
        "attempts": attempts,
    }


def _read_object(path: Path) -> dict[str, Any]:
    value = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def _write_private_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    path.write_text(
        json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    os.chmod(path, 0o600)


def _answer_lines(attempt_root: Path) -> list[str]:
    answer_path = attempt_root / "ashby-answers.json"
    if not answer_path.is_file():
        return []
    try:
        answers = _read_object(answer_path).get("answers")
    except (OSError, ValueError, json.JSONDecodeError):
        return []
    if not isinstance(answers, dict):
        return []
    lines = ["Questions and answers:"]
    for question, payload in answers.items():
        answer = payload.get("answer") if isinstance(payload, dict) else payload
        lines.extend((f"Q: {question}", f"A: {answer}"))
    return lines


def _report_attempt(
    *, outbox_path: Path, request: dict[str, Any], attempt: dict[str, Any],
    attempt_root: Path,
) -> None:
    from .telegram import send_once

    url = str(request.get("official_url") or "")
    identity = hashlib.sha256(
        f"{url}|{attempt['status']}|{attempt['index']}".encode()
    ).hexdigest()[:20]
    lines = [
        "Codex::: Job Hunter application attempt",
        f"Company: {attempt['company']}",
        f"Role: {attempt['title']}",
        f"URL: {url}",
        f"Outcome: {attempt['status']}",
        f"Reason: {attempt.get('reason') or 'authoritative ATS result'}",
        f"Application ID: {attempt.get('application_id') or 'not created'}",
        f"Resume: {request.get('resume_path') or 'unavailable'}",
        *_answer_lines(attempt_root),
    ]
    chunks: list[str] = []
    current = ""
    for line in lines:
        candidate = f"{current}\n{line}".strip()
        if len(candidate) > 3500 and current:
            chunks.append(current)
            current = line
        else:
            current = candidate
    if current:
        chunks.append(current)
    for index, message in enumerate(chunks, start=1):
        send_once(
            database=outbox_path,
            event_key=f"job-hunt-attempt:{identity}:{index}",
            message=message,
        )


def _report_campaign_event(
    *, outbox_path: Path, event: str, request: dict[str, Any] | None = None,
    result: dict[str, Any] | None = None,
) -> None:
    from .telegram import send_once

    payload = request or result or {}
    identity = hashlib.sha256(
        json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()
    ).hexdigest()[:20]
    if event == "started":
        message = "\n".join((
            "Codex::: Job Hunter application started",
            f"Company: {payload.get('company') or ''}",
            f"Role: {payload.get('title') or ''}",
            f"URL: {payload.get('official_url') or ''}",
            f"Resume: {payload.get('resume_path') or 'unavailable'}",
        ))
    else:
        message = "\n".join((
            "Codex::: Job Hunter campaign completed",
            f"Outcome: {payload.get('status') or 'unknown'}",
            f"Attempts: {payload.get('attempt_count') or 0}",
            f"Submitted: {', '.join(payload.get('submitted') or []) or 'none'}",
            f"Submit unknown: {', '.join(payload.get('submit_unknown') or []) or 'none'}",
        ))
    send_once(
        database=outbox_path,
        event_key=f"job-hunt-campaign:{event}:{identity}",
        message=message,
    )


def run_ashby_campaign(
    *,
    request_path: Path,
    evidence_root: Path,
    transaction_script: Path,
    environment: dict[str, str] | None = None,
    checkpoint_path: Path | None = None,
    telegram_outbox: Path | None = None,
) -> dict[str, Any]:
    campaign = _read_object(request_path)
    raw_candidates = campaign.get("candidates")
    if raw_candidates is None:
        candidates = [campaign]
    elif isinstance(raw_candidates, list) and all(
        isinstance(candidate, dict) for candidate in raw_candidates
    ):
        candidates = raw_candidates
    else:
        raise ValueError("campaign candidates must be an array of objects")

    checkpoint: dict[str, Any] = {}
    terminal_urls: set[str] = set()
    if checkpoint_path is not None and checkpoint_path.is_file():
        try:
            checkpoint = _read_object(checkpoint_path)
            terminal_urls = {
                str(value) for value in checkpoint.get("terminal_urls", []) if value
            }
        except (OSError, ValueError, json.JSONDecodeError):
            checkpoint = {}
    candidates = [
        candidate
        for candidate in candidates
        if str(candidate.get("official_url") or "") not in terminal_urls
    ]
    base_environment = dict(os.environ if environment is None else environment)

    def execute(request: dict[str, Any], attempt_root: Path) -> dict[str, Any]:
        if telegram_outbox is not None:
            try:
                _report_campaign_event(
                    outbox_path=telegram_outbox,
                    event="started",
                    request=request,
                )
            except Exception as error:
                _write_private_json(
                    attempt_root / "telegram-start-error.json",
                    {"status": "delivery_failed", "error_type": type(error).__name__},
                )
        candidate_request = attempt_root / "request.json"
        _write_private_json(candidate_request, request)
        attempt_environment = {
            **base_environment,
            "JOB_SEARCH_EVIDENCE_DIR": str(attempt_root),
            "JOB_SEARCH_ASHBY_APPLY_RESULT": str(attempt_root / "ashby-apply-result.json"),
        }
        completed = subprocess.run(
            [str(transaction_script), str(candidate_request)],
            env=attempt_environment,
            text=True,
            capture_output=True,
            check=False,
        )
        (attempt_root / "transaction.stdout.log").write_text(
            completed.stdout, encoding="utf-8"
        )
        (attempt_root / "transaction.stderr.log").write_text(
            completed.stderr, encoding="utf-8"
        )
        submit_result_path = attempt_root / "ashby-submit-result.json"
        try:
            submit_result = _read_object(submit_result_path) if submit_result_path.is_file() else {}
        except (OSError, ValueError, json.JSONDecodeError):
            submit_result = {}
        prepare_path = attempt_root / "submission-prepare.json"
        prepare = _read_object(prepare_path) if prepare_path.is_file() else {}
        application_id = str(
            prepare.get("application_id") or request.get("application_id") or ""
        )
        ats_status = submit_result.get("status")
        if ats_status == "applied_ats":
            status = "submitted"
        elif ats_status == "ats_unconfirmed":
            status = "submit_unknown"
        else:
            status = "pre_click_failed"
        fill_result_path = attempt_root / "ashby-apply-result.json"
        try:
            fill_result = _read_object(fill_result_path) if fill_result_path.is_file() else {}
        except (OSError, ValueError, json.JSONDecodeError):
            fill_result = {}
        detail = fill_result.get("missing") or fill_result.get("repair")
        reason = (
            json.dumps(detail, ensure_ascii=False)
            if detail
            else next(
                (
                    line.strip()
                    for line in reversed(completed.stderr.splitlines())
                    if line.strip()
                ),
                str(ats_status or "transaction stopped before authoritative receipt"),
            )
        )
        return {
            "status": status,
            "application_id": application_id,
            "transaction_exit_code": completed.returncode,
            "reason": reason[-1200:],
        }

    def record_attempt(
        request: dict[str, Any], attempt: dict[str, Any], attempt_root: Path
    ) -> None:
        if checkpoint_path is not None:
            if attempt["status"] in {"submit_unknown", "submitted"}:
                terminal_urls.add(str(request.get("official_url") or ""))
            _write_private_json(
                checkpoint_path,
                {
                    "version": 1,
                    "last_candidate_url": request.get("official_url"),
                    "last_status": attempt["status"],
                    "last_application_id": attempt.get("application_id"),
                    "attempt_index": attempt["index"],
                    "terminal_urls": sorted(value for value in terminal_urls if value),
                },
            )
        if telegram_outbox is not None:
            try:
                _report_attempt(
                    outbox_path=telegram_outbox,
                    request=request,
                    attempt=attempt,
                    attempt_root=attempt_root,
                )
            except Exception as error:
                _write_private_json(
                    attempt_root / "telegram-delivery-error.json",
                    {"status": "delivery_failed", "error_type": type(error).__name__},
                )

    result = run_campaign(
        requests=candidates,
        evidence_root=evidence_root,
        execute=execute,
        on_attempt=record_attempt,
    )
    if telegram_outbox is not None:
        try:
            _report_campaign_event(
                outbox_path=telegram_outbox,
                event="completed",
                result=result,
            )
        except Exception as error:
            _write_private_json(
                evidence_root / "telegram-completion-error.json",
                {"status": "delivery_failed", "error_type": type(error).__name__},
            )
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--evidence-root", type=Path, required=True)
    parser.add_argument("--transaction-script", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--telegram-outbox", type=Path)
    args = parser.parse_args(argv)
    result = run_ashby_campaign(
        request_path=args.request,
        evidence_root=args.evidence_root,
        transaction_script=args.transaction_script,
        checkpoint_path=args.checkpoint,
        telegram_outbox=args.telegram_outbox,
    )
    _write_private_json(args.output, result)
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0 if result["status"] == "submitted" else 75


if __name__ == "__main__":
    raise SystemExit(main())
