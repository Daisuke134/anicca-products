from __future__ import annotations

import importlib.util
import json
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "producer_capacity.py"
SPEC = importlib.util.spec_from_file_location("producer_capacity", MODULE_PATH)
assert SPEC and SPEC.loader
producer_capacity = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(producer_capacity)


def config(path: Path, *, reserve: int = 100, max_active: int = 1) -> Path:
    path.write_text(
        json.dumps(
            {
                "version": 1,
                "reserve_bytes": reserve,
                "producers": {
                    name: {
                        "max_active_runs": max_active,
                        "max_bytes_per_run": 1_000,
                        "keep_completed_runs": 1,
                    }
                    for name in producer_capacity.PRODUCERS
                },
            }
        ),
        encoding="utf-8",
    )
    return path


def test_all_revenue_producers_have_explicit_budgets(tmp_path: Path) -> None:
    loaded = producer_capacity.load_config(config(tmp_path / "config.json"))
    assert set(loaded["producers"]) == {
        "gig", "marketing", "clip", "video", "browser", "worktree"
    }


def test_low_reserve_blocks_new_run_and_preserves_active_checkpoint(tmp_path: Path) -> None:
    state = tmp_path / "state"
    cfg = config(tmp_path / "config.json")
    active = producer_capacity.preflight(cfg, state, "gig", "active-1", 200, now=10)
    checkpoint = state / "runs/gig/active-1/checkpoint.json"
    checkpoint.write_text("keep", encoding="utf-8")

    blocked = producer_capacity.preflight(cfg, state, "gig", "new-2", 99, now=20)

    assert active["status"] == "started"
    assert blocked == {"status": "blocked", "reason": "reserve_space", "producer": "gig", "run_id": "new-2"}
    assert checkpoint.read_text(encoding="utf-8") == "keep"
    assert not (state / "runs/gig/new-2").exists()


def test_quota_blocks_second_active_run(tmp_path: Path) -> None:
    state = tmp_path / "state"
    cfg = config(tmp_path / "config.json", max_active=1)
    producer_capacity.preflight(cfg, state, "video", "run-1", 500, now=10)
    result = producer_capacity.preflight(cfg, state, "video", "run-2", 500, now=11)
    assert result["status"] == "blocked"
    assert result["reason"] == "active_run_quota"


def test_recovery_resumes_same_run_and_completion_records_growth(tmp_path: Path) -> None:
    state = tmp_path / "state"
    cfg = config(tmp_path / "config.json")
    producer_capacity.preflight(cfg, state, "marketing", "run-1", 500, now=10)
    blocked = producer_capacity.preflight(cfg, state, "marketing", "run-1", 50, now=11)
    resumed = producer_capacity.preflight(cfg, state, "marketing", "run-1", 500, now=12)
    completed = producer_capacity.complete(cfg, state, "marketing", "run-1", 321, 450, now=13)

    assert blocked["status"] == "blocked"
    assert resumed["status"] == "resumed"
    assert completed["status"] == "completed"
    rows = [json.loads(line) for line in (state / "capacity.jsonl").read_text().splitlines()]
    assert rows[-1]["owner"] == "marketing"
    assert rows[-1]["bytes_written"] == 321
    assert rows[-1]["free_bytes"] == 450


def test_run_byte_quota_fails_completion(tmp_path: Path) -> None:
    state = tmp_path / "state"
    cfg = config(tmp_path / "config.json")
    producer_capacity.preflight(cfg, state, "clip", "run-1", 500, now=10)
    result = producer_capacity.complete(cfg, state, "clip", "run-1", 1_001, 400, now=11)
    assert result["status"] == "failed"
    assert result["reason"] == "run_byte_quota"


def test_rotation_preserves_active_and_keeps_latest_completed_checkpoint(tmp_path: Path) -> None:
    state = tmp_path / "state"
    cfg = config(tmp_path / "config.json")
    for index in range(3):
        run_id = f"done-{index}"
        producer_capacity.preflight(cfg, state, "browser", run_id, 500, now=10 + index * 2)
        run_dir = state / "runs/browser" / run_id
        (run_dir / "checkpoint.json").write_text(run_id, encoding="utf-8")
        producer_capacity.complete(cfg, state, "browser", run_id, 10, 490, now=11 + index * 2)
    producer_capacity.preflight(cfg, state, "browser", "active", 500, now=20)
    active_checkpoint = state / "runs/browser/active/checkpoint.json"
    active_checkpoint.write_text("active", encoding="utf-8")

    result = producer_capacity.rotate(cfg, state, "browser", now=30)

    assert result["rotated"] == 2
    assert active_checkpoint.read_text(encoding="utf-8") == "active"
    assert (state / "runs/browser/done-2").exists()
    assert not (state / "runs/browser/done-0").exists()
    assert not (state / "runs/browser/done-1").exists()


def test_disk_pressure_alert_blocks_even_above_reserve(tmp_path: Path) -> None:
    state = tmp_path / "state"
    state.mkdir()
    (state / "disk-pressure.alert").write_text("zero-reclaim", encoding="utf-8")
    result = producer_capacity.preflight(
        config(tmp_path / "config.json"), state, "worktree", "run-1", 500, now=10
    )
    assert result["status"] == "blocked"
    assert result["reason"] == "disk_pressure_alert"

