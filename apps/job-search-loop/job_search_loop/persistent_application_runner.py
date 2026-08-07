from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path
from typing import Any

from .codex_app_server import CodexAppServer, JsonLineProcessTransport
from .thread_registry import ThreadRegistry


class PersistentApplicationError(RuntimeError):
    pass


RUNTIME_ENVIRONMENT_NAMES = frozenset({
    "PYTHONPATH",
    "JOB_SEARCH_APP_ROOT", "JOB_SEARCH_REPO_ROOT", "JOB_SEARCH_STATE_ROOT",
    "JOB_SEARCH_PROFILE", "JOB_SEARCH_PYTHON", "JOB_SEARCH_JQ",
    "JOB_SEARCH_EVIDENCE_DIR", "JOB_SEARCH_BROWSER_OWNER_EVIDENCE",
    "JOB_SEARCH_CANDIDATE_QUEUE", "JOB_SEARCH_PREFILTER_RESULT",
    "JOB_SEARCH_SUBMIT_ENABLED", "JOB_SEARCH_NO_SUBMIT_CANARY",
    "JOB_SEARCH_FILL_CANARY_REQUEST",
    "JOB_SEARCH_ASHBY_APPLY_MODULE", "JOB_SEARCH_ASHBY_APPLY_RESULT",
    "CAPSOLVER_API_KEY",
})


def runtime_environment() -> dict[str, str]:
    return {
        name: value for name, value in os.environ.items()
        if name in RUNTIME_ENVIRONMENT_NAMES
    }


def _atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    except BaseException:
        Path(temporary).unlink(missing_ok=True)
        raise


def _latest_agent_text(thread: dict[str, Any]) -> str:
    turns = thread.get("thread", {}).get("turns", [])
    for turn in reversed(turns if isinstance(turns, list) else []):
        items = turn.get("items", []) if isinstance(turn, dict) else []
        for item in reversed(items if isinstance(items, list) else []):
            if isinstance(item, dict) and item.get("type") == "agentMessage":
                text = item.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()
    raise PersistentApplicationError("completed turn has no agentMessage")


def _validate(value: Any, schema: dict[str, Any]) -> None:
    if schema.get("type") == "object" and not isinstance(value, dict):
        raise PersistentApplicationError("result must be an object")
    if isinstance(value, dict):
        missing = [key for key in schema.get("required", []) if key not in value]
        if missing:
            raise PersistentApplicationError(f"missing required result field: {missing[0]}")


def run_application_turn(
    *,
    client: CodexAppServer,
    registry: ThreadRegistry,
    work_id: str,
    prompt: str,
    schema: dict[str, Any],
    result_path: Path,
    cwd: Path,
    model: str,
    runtime_release_sha: str,
    run_id: str,
) -> dict[str, Any]:
    client.initialize(name="job-hunter", version="1")
    environment = runtime_environment()
    try:
        binding = registry.active("job_application", work_id)
    except KeyError:
        started = client.thread_start(
            cwd=str(cwd), model=model, capability_profile="job-hunter",
            runtime_environment=environment,
        )
        thread_id = started.get("thread", {}).get("id")
        if not isinstance(thread_id, str) or not thread_id:
            raise PersistentApplicationError("thread/start returned no thread id")
    else:
        thread_id = str(binding["thread_id"])
        client.thread_resume(
            thread_id, cwd=str(cwd), model=model, capability_profile="job-hunter",
            runtime_environment=environment,
        )
    binding = registry.bind(
        work_type="job_application",
        work_id=work_id,
        thread_id=thread_id,
        runtime_release_sha=runtime_release_sha,
        run_id=run_id,
    )
    turn = client.turn_start(thread_id, prompt, output_schema=schema)
    turn_id = turn.get("turn", {}).get("id")
    completed = client.wait_for_event("turn/completed")
    status = completed.get("params", {}).get("turn", {}).get("status")
    if status != "completed":
        raise PersistentApplicationError(f"turn did not complete: {status}")
    raw = _latest_agent_text(client.thread_read(thread_id))
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as error:
        raise PersistentApplicationError("agent result is not JSON") from error
    _validate(value, schema)
    _atomic_json(result_path, value)
    return {
        "value": value,
        "thread_id": thread_id,
        "turn_id": turn_id,
        "generation": binding["generation"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-id", required=True)
    parser.add_argument("--prompt-file", required=True, type=Path)
    parser.add_argument("--schema", required=True, type=Path)
    parser.add_argument("--evidence-dir", required=True, type=Path)
    parser.add_argument("--workdir", required=True, type=Path)
    parser.add_argument("--registry", required=True, type=Path)
    parser.add_argument("--runtime-release-sha", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--model", default="gpt-5.6-terra")
    args = parser.parse_args()

    args.evidence_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    result_path = args.evidence_dir / "attempt-01.result.json"
    events_path = args.evidence_dir / "app-server-events.jsonl"
    events = events_path.open("a", encoding="utf-8")

    def record(event: dict[str, Any]) -> None:
        events.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")
        events.flush()

    registry = ThreadRegistry(args.registry)
    client = CodexAppServer(JsonLineProcessTransport.stdio(), on_event=record)
    try:
        outcome = run_application_turn(
            client=client,
            registry=registry,
            work_id=args.work_id,
            prompt=args.prompt_file.read_text(encoding="utf-8"),
            schema=json.loads(args.schema.read_text(encoding="utf-8")),
            result_path=result_path,
            cwd=args.workdir,
            model=args.model,
            runtime_release_sha=args.runtime_release_sha,
            run_id=args.run_id,
        )
        receipt_path = args.evidence_dir / "app-server-thread.json"
        _atomic_json(receipt_path, {key: value for key, value in outcome.items() if key != "value"})
        summary = {
            "version": 1,
            "status": "success",
            "selected_provider": "codex-app-server",
            "selected_model": args.model,
            "attempt_count": 1,
            "result_path": str(result_path),
            "thread_receipt_path": str(receipt_path),
        }
        print(json.dumps(summary, ensure_ascii=False, separators=(",", ":")))
        return 0
    finally:
        client.close()
        registry.close()
        events.close()
        if events_path.exists():
            os.chmod(events_path, 0o600)


if __name__ == "__main__":
    raise SystemExit(main())
