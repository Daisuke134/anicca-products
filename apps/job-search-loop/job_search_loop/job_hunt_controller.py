from __future__ import annotations

import argparse
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
        })
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
    path.write_text(
        json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    os.chmod(path, 0o600)


def run_ashby_campaign(
    *,
    request_path: Path,
    evidence_root: Path,
    transaction_script: Path,
    environment: dict[str, str] | None = None,
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

    base_environment = dict(os.environ if environment is None else environment)

    def execute(request: dict[str, Any], attempt_root: Path) -> dict[str, Any]:
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
        submit_result = _read_object(submit_result_path) if submit_result_path.is_file() else {}
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
        return {
            "status": status,
            "application_id": application_id,
            "transaction_exit_code": completed.returncode,
        }

    return run_campaign(
        requests=candidates,
        evidence_root=evidence_root,
        execute=execute,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--evidence-root", type=Path, required=True)
    parser.add_argument("--transaction-script", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    result = run_ashby_campaign(
        request_path=args.request,
        evidence_root=args.evidence_root,
        transaction_script=args.transaction_script,
    )
    _write_private_json(args.output, result)
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0 if result["status"] == "submitted" else 75


if __name__ == "__main__":
    raise SystemExit(main())
