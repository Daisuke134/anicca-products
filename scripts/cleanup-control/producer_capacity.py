#!/usr/bin/env python3
"""Shared capacity gate for disk-producing revenue loops."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


PRODUCERS = ("gig", "marketing", "clip", "video", "browser", "worktree")
REQUIRED_BUDGET_FIELDS = {
    "max_active_runs", "max_bytes_per_run", "keep_completed_runs"
}


def load_config(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("version") != 1:
        raise ValueError("unsupported producer budget version")
    reserve = data.get("reserve_bytes")
    if not isinstance(reserve, int) or isinstance(reserve, bool) or reserve < 0:
        raise ValueError("reserve_bytes must be a non-negative integer")
    budgets = data.get("producers")
    if not isinstance(budgets, dict) or set(budgets) != set(PRODUCERS):
        raise ValueError("every supported producer requires exactly one budget")
    for producer, budget in budgets.items():
        if not isinstance(budget, dict) or set(budget) != REQUIRED_BUDGET_FIELDS:
            raise ValueError(f"invalid budget schema: {producer}")
        for key in REQUIRED_BUDGET_FIELDS:
            value = budget[key]
            if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                raise ValueError(f"invalid {producer}.{key}")
        if budget["max_active_runs"] < 1:
            raise ValueError(f"{producer}.max_active_runs must be positive")
    return data


def _atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except BaseException:
        try:
            os.unlink(temporary)
        except OSError:
            pass
        raise


def _append_jsonl(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_APPEND | os.O_CREAT | os.O_WRONLY, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
        os.write(fd, (json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n").encode())
        os.fsync(fd)
    finally:
        try:
            fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)


def _validate_identity(producer: str, run_id: str) -> None:
    if producer not in PRODUCERS:
        raise ValueError(f"unsupported producer: {producer}")
    if not run_id or run_id in {".", ".."} or "/" in run_id or "\\" in run_id:
        raise ValueError("run_id must be one path component")


def _run_root(state_root: Path, producer: str, run_id: str) -> Path:
    return state_root / "runs" / producer / run_id


def _read_state(run_root: Path) -> dict[str, Any] | None:
    path = run_root / "state.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _active_count(state_root: Path, producer: str) -> int:
    producer_root = state_root / "runs" / producer
    if not producer_root.is_dir():
        return 0
    count = 0
    for child in producer_root.iterdir():
        if child.is_dir() and (_read_state(child) or {}).get("status") == "active":
            count += 1
    return count


def _result(status: str, reason: str | None, producer: str, run_id: str) -> dict[str, Any]:
    value: dict[str, Any] = {"status": status}
    if reason is not None:
        value["reason"] = reason
    value.update({"producer": producer, "run_id": run_id})
    return value


def preflight(
    config_path: Path,
    state_root: Path,
    producer: str,
    run_id: str,
    free_bytes: int,
    *,
    now: int | None = None,
) -> dict[str, Any]:
    _validate_identity(producer, run_id)
    config = load_config(config_path)
    observed = int(time.time()) if now is None else now
    if (state_root / "disk-pressure.alert").exists():
        return _result("blocked", "disk_pressure_alert", producer, run_id)
    if free_bytes < config["reserve_bytes"]:
        return _result("blocked", "reserve_space", producer, run_id)
    run_root = _run_root(state_root, producer, run_id)
    current = _read_state(run_root)
    if current and current.get("status") == "active":
        current["last_resumed_at"] = observed
        current["free_bytes_at_resume"] = free_bytes
        _atomic_json(run_root / "state.json", current)
        _append_jsonl(state_root / "capacity.jsonl", {
            "event": "resumed", "owner": producer, "run_id": run_id,
            "free_bytes": free_bytes, "timestamp": observed,
        })
        return _result("resumed", None, producer, run_id)
    budget = config["producers"][producer]
    if _active_count(state_root, producer) >= budget["max_active_runs"]:
        return _result("blocked", "active_run_quota", producer, run_id)
    run_root.mkdir(parents=True, exist_ok=False)
    _atomic_json(run_root / "state.json", {
        "producer": producer, "run_id": run_id, "status": "active",
        "started_at": observed, "free_bytes_at_start": free_bytes,
    })
    _append_jsonl(state_root / "capacity.jsonl", {
        "event": "started", "owner": producer, "run_id": run_id,
        "free_bytes": free_bytes, "timestamp": observed,
    })
    return _result("started", None, producer, run_id)


def complete(
    config_path: Path,
    state_root: Path,
    producer: str,
    run_id: str,
    bytes_written: int,
    free_bytes: int,
    *,
    now: int | None = None,
) -> dict[str, Any]:
    _validate_identity(producer, run_id)
    config = load_config(config_path)
    observed = int(time.time()) if now is None else now
    run_root = _run_root(state_root, producer, run_id)
    current = _read_state(run_root)
    if not current or current.get("status") != "active":
        return _result("failed", "run_not_active", producer, run_id)
    budget = config["producers"][producer]
    over_quota = bytes_written > budget["max_bytes_per_run"]
    current.update({
        "status": "failed" if over_quota else "completed",
        "finished_at": observed,
        "bytes_written": bytes_written,
        "free_bytes_at_finish": free_bytes,
    })
    if over_quota:
        current["reason"] = "run_byte_quota"
    _atomic_json(run_root / "state.json", current)
    _append_jsonl(state_root / "capacity.jsonl", {
        "event": "failed" if over_quota else "completed",
        "reason": "run_byte_quota" if over_quota else None,
        "owner": producer,
        "run_id": run_id,
        "bytes_written": bytes_written,
        "free_bytes": free_bytes,
        "timestamp": observed,
    })
    if over_quota:
        return _result("failed", "run_byte_quota", producer, run_id)
    return _result("completed", None, producer, run_id)


def rotate(
    config_path: Path,
    state_root: Path,
    producer: str,
    *,
    now: int | None = None,
) -> dict[str, Any]:
    _validate_identity(producer, "rotation")
    config = load_config(config_path)
    observed = int(time.time()) if now is None else now
    producer_root = state_root / "runs" / producer
    completed: list[tuple[int, Path]] = []
    if producer_root.is_dir():
        for child in producer_root.iterdir():
            current = _read_state(child) if child.is_dir() else None
            if current and current.get("status") in {"completed", "failed"}:
                completed.append((int(current.get("finished_at", 0)), child))
    completed.sort(reverse=True)
    keep = config["producers"][producer]["keep_completed_runs"]
    archive_root = state_root / "rotated" / producer
    rotated = 0
    for _, run_root in completed[keep:]:
        archive_root.mkdir(parents=True, exist_ok=True)
        destination = archive_root / run_root.name
        if destination.exists():
            shutil.rmtree(destination)
        os.replace(run_root, destination)
        rotated += 1
        _append_jsonl(state_root / "capacity.jsonl", {
            "event": "rotated", "owner": producer, "run_id": run_root.name,
            "archive_path": str(destination), "timestamp": observed,
        })
    return {"status": "ok", "producer": producer, "rotated": rotated}


def _free_bytes(path: Path) -> int:
    path.mkdir(parents=True, exist_ok=True)
    return shutil.disk_usage(path).free


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--state-root", type=Path, required=True)
    subparsers = parser.add_subparsers(dest="command", required=True)
    pre = subparsers.add_parser("preflight")
    pre.add_argument("--producer", choices=PRODUCERS, required=True)
    pre.add_argument("--run-id", required=True)
    done = subparsers.add_parser("complete")
    done.add_argument("--producer", choices=PRODUCERS, required=True)
    done.add_argument("--run-id", required=True)
    done.add_argument("--bytes-written", type=int, required=True)
    rot = subparsers.add_parser("rotate")
    rot.add_argument("--producer", choices=PRODUCERS, required=True)
    args = parser.parse_args()
    try:
        free = _free_bytes(args.state_root)
        if args.command == "preflight":
            result = preflight(args.config, args.state_root, args.producer, args.run_id, free)
        elif args.command == "complete":
            result = complete(
                args.config, args.state_root, args.producer, args.run_id,
                args.bytes_written, free,
            )
        else:
            result = rotate(args.config, args.state_root, args.producer)
        print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
        return 0 if result["status"] not in {"blocked", "failed"} else 1
    except Exception as error:
        print(json.dumps({"status": "failed", "reason": str(error)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

