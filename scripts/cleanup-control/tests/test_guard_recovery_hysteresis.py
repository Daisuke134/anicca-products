from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).parents[3]
GUARD = ROOT / "scripts" / "emergency-disk-guard.sh"


def test_guard_clears_pressure_after_recovery_floor_not_preventive_threshold(
    tmp_path: Path,
) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    (state / "disk-pressure.block").write_text("old\n", encoding="utf-8")
    (state / "disk-pressure.alert").write_text("old\n", encoding="utf-8")

    environment = os.environ.copy()
    environment.update(
        {
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "12",
            "EMERGENCY_GUARD_THRESHOLD_GB": "20",
            "EMERGENCY_GUARD_RECOVERY_GB": "11",
            "CLEANUP_CONTROL_PATH": str(tmp_path / "missing-cleanup-control.py"),
        }
    )
    result = subprocess.run(
        ["/bin/bash", str(GUARD)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert not (state / "disk-pressure.block").exists()
    assert not (state / "disk-pressure.alert").exists()


def test_guard_keeps_pressure_below_recovery_floor(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    (state / "disk-pressure.block").write_text("old\n", encoding="utf-8")

    environment = os.environ.copy()
    environment.update(
        {
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "7",
            "EMERGENCY_GUARD_THRESHOLD_GB": "20",
            "EMERGENCY_GUARD_RECOVERY_GB": "11",
            "CLEANUP_CONTROL_PATH": str(tmp_path / "missing-cleanup-control.py"),
        }
    )
    result = subprocess.run(
        ["/bin/bash", str(GUARD)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 3
    assert (state / "disk-pressure.block").exists()


def test_guard_reports_sub_gib_free_space_instead_of_ambiguous_zero_gb(
    tmp_path: Path,
) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)

    environment = os.environ.copy()
    environment.update(
        {
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "0",
            "EMERGENCY_GUARD_TEST_FREE_KB": "552288",
            "EMERGENCY_GUARD_TEST_SWAP_USAGE": "total=16896M used=15300M free=1596M",
            "EMERGENCY_GUARD_THRESHOLD_GB": "20",
            "EMERGENCY_GUARD_RECOVERY_GB": "11",
            "CLEANUP_CONTROL_PATH": str(tmp_path / "missing-cleanup-control.py"),
        }
    )
    result = subprocess.run(
        ["/bin/bash", str(GUARD)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 3
    log = (home / ".openclaw" / "logs" / "emergency-disk-guard.log").read_text()
    alert = (state / "disk-pressure.alert").read_text()
    assert "539.3MiB" in log
    assert "539.3MiB" in alert
    assert "0GB free" not in log
    assert "0GB ->" not in log
    assert "swap=total=16896M used=15300M free=1596M" in log
    assert "swap=total=16896M used=15300M free=1596M" in alert


def test_disk_recovery_redispatches_only_machine_owned_disk_blocked_tasks(
    tmp_path: Path,
) -> None:
    calls = tmp_path / "calls.jsonl"
    fake_hermes = tmp_path / "hermes"
    fake_hermes.write_text(
        """#!/bin/bash
set -u
printf '%s\\n' "$*" >> "$CALLS"
case "$*" in
  *" list "*)
    printf '%s\\n' '{"tasks":[{"id":"t_disk_task","status":"blocked"},{"id":"t_human_task","status":"blocked"}]}'
    ;;
  *" show t_disk_task "*)
    printf '%s\\n' '{"task":{"id":"t_disk_task","status":"blocked"},"events":[{"kind":"blocked","payload":{"kind":"capability","reason":"Disk preflight blocked: stop flag present"}}]}'
    ;;
  *" show t_human_task "*)
    printf '%s\\n' '{"task":{"id":"t_human_task","status":"blocked"},"events":[{"kind":"blocked","payload":{"kind":"capability","reason":"buyer needs input"}}]}'
    ;;
  *" unblock t_disk_task "*) printf '%s\\n' '{"status":"ready"}' ;;
  *" dispatch "*) printf '%s\\n' '{"status":"ok"}' ;;
  *) exit 2 ;;
esac
""",
        encoding="utf-8",
    )
    fake_hermes.chmod(0o755)

    environment = os.environ.copy()
    environment.update(
        {
            "HERMES_BIN": str(fake_hermes),
            "DISK_RECOVERY_BOARD": "gig-revenue",
            "DISK_RECOVERY_LEDGER": str(tmp_path / "recovery.jsonl"),
            "CALLS": str(calls),
        }
    )
    script = ROOT / "scripts" / "disk-recovery-redispatch.sh"
    result = subprocess.run(
        ["/bin/bash", str(script)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    recorded = calls.read_text(encoding="utf-8").splitlines()
    assert any("unblock t_disk_task" in call for call in recorded)
    assert not any("unblock t_human_task" in call for call in recorded)
    assert any("dispatch" in call for call in recorded)
    rows = [json.loads(line) for line in (tmp_path / "recovery.jsonl").read_text().splitlines()]
    assert rows[-1]["unblocked"] == ["t_disk_task"]
