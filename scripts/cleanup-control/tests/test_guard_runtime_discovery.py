from __future__ import annotations

import json
import os
import subprocess
import time
from pathlib import Path

import pytest


ROOT = Path(__file__).parents[3]
GUARD = ROOT / "scripts" / "emergency-disk-guard.sh"


@pytest.mark.parametrize("candidate_count", [0, 1, 2])
def test_guard_passes_chromium_proof_only_for_one_regular_candidate(
    tmp_path: Path,
    candidate_count: int,
) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    candidates = []
    for index in range(candidate_count):
        proof = (
            home
            / ".cloakbrowser"
            / f"chromium-{index}"
            / "Chromium.app/Contents/MacOS/Chromium"
        )
        proof.parent.mkdir(parents=True)
        proof.write_bytes(b"chromium")
        candidates.append(proof)
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text(
        '{"policy_version":"cleanup-v1","artifacts":[]}\n',
        encoding="utf-8",
    )
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """
import json, os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print('{"status":"ok","discovered":0,"output":"runtime"}')
elif args[0] == "sweep":
    print('{"status":"ok","quarantined":0,"bytes_quarantined":0}')
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(state / "runtime.json"),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    runtime_call = json.loads(calls.read_text(encoding="utf-8").splitlines()[0])
    proof_args = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--chromium-code-sign-proof"
    ]
    assert proof_args == ([str(candidates[0])] if candidate_count == 1 else [])


def test_guard_builds_runtime_manifest_before_pressure_sweep(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    # This test covers the minute-level path after the hourly full pass.  The
    # expired/missing-marker path is exercised by the explicit full-pass test.
    (state / "cleanup-full-pass.at").write_text(str(int(time.time())) + "\n", encoding="utf-8")
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text(
        '{"policy_version":"cleanup-v1","artifacts":[]}\n',
        encoding="utf-8",
    )
    runtime_manifest = state / "cleanup-runtime-manifest.json"
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """\
import json
import os
import shutil
import sys

args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    source = args[args.index("--manifest") + 1]
    output = args[args.index("--output") + 1]
    shutil.copyfile(source, output)
    print(json.dumps({"status": "ok", "discovered": 0, "output": output}))
elif args[0] == "sweep":
    print(json.dumps({"status": "ok", "quarantined": 1, "bytes_quarantined": 8589934592}))
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )

    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(runtime_manifest),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    recorded = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    assert [call[0] for call in recorded] == ["runtime-manifest", "sweep"]
    runtime_call, sweep_call = recorded
    assert runtime_call[runtime_call.index("--output") + 1] == str(runtime_manifest)
    assert sweep_call[sweep_call.index("--manifest") + 1] == str(runtime_manifest)
    assert "--fast-pass" in sweep_call
    roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--root"
    ]
    assert roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
    ]
    cache_roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--cache-root"
    ]
    assert cache_roots == []
    published_run_roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--published-run-root"
    ]
    assert published_run_roots == [str(home / ".openclaw/workspace/runs")]
    code_sign_clone_roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--code-sign-clone-root"
    ]
    assert code_sign_clone_roots == [str(home / "X")]
    pnpm_store_roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--pnpm-store-root"
    ]
    assert pnpm_store_roots == [str(home / "Library/pnpm/store")]
    assert runtime_call[runtime_call.index("--pnpm-lease") + 1] == str(
        state / "pnpm-package.lease"
    )
    assert runtime_call[runtime_call.index("--min-cache-bytes") + 1] == "67108864"


def test_guard_full_pass_includes_large_gig_tree(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text(
        '{"policy_version":"cleanup-v1","artifacts":[]}\n',
        encoding="utf-8",
    )
    runtime_manifest = state / "cleanup-runtime-manifest.json"
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """
import json, os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print(json.dumps({"status": "ok", "discovered": 0, "output": args[args.index("--output") + 1]}))
elif args[0] == "sweep":
    print(json.dumps({"status": "ok", "quarantined": 0, "bytes_quarantined": 0}))
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_FULL_PASS": "1",
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(runtime_manifest),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    runtime_call = json.loads(calls.read_text(encoding="utf-8").splitlines()[0])
    roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--root"
    ]
    assert roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
        str(home / "gig"),
    ]


@pytest.mark.parametrize("cooldown", ["300", "invalid"], ids=["valid", "invalid"])
def test_guard_defers_repeated_critical_full_pass_during_cooldown(
    tmp_path: Path,
    cooldown: str,
) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    (state / "cleanup-full-pass.at").write_text(str(int(time.time())) + "\n", encoding="utf-8")
    (state / "cleanup-critical-full-pass.at").write_text(
        str(int(time.time())) + "\n",
        encoding="utf-8",
    )
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text(
        '{"policy_version":"cleanup-v1","artifacts":[]}\n',
        encoding="utf-8",
    )
    runtime_manifest = state / "cleanup-runtime-manifest.json"
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """
import json, os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print(json.dumps({"status": "ok", "discovered": 0, "output": args[args.index("--output") + 1]}))
elif args[0] == "sweep":
    print(json.dumps({"status": "ok", "quarantined": 0, "bytes_quarantined": 0}))
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_TEST_FREE_KB": str(2 * 1024 * 1024),
            "EMERGENCY_GUARD_CRITICAL_FULL_PASS_COOLDOWN_SECONDS": cooldown,
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(runtime_manifest),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    recorded = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    runtime_call, sweep_call = recorded
    assert "--fast-pass" in sweep_call
    roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--root"
    ]
    assert roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
    ]
    marker = state / "cleanup-full-pass.at"
    assert int(marker.read_text(encoding="utf-8").strip()) >= int(time.time()) - 5

    if cooldown == "invalid":
        second = subprocess.run(
            ["/bin/bash", str(GUARD)],
            env=environment,
            text=True,
            capture_output=True,
            check=False,
        )
        assert second.returncode == 3
        second_recorded = [
            json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()
        ]
        assert len(second_recorded) == 4
        assert "--fast-pass" in second_recorded[-1]


@pytest.mark.parametrize(
    ("critical_marker_offset", "cooldown"),
    [(3600, "300")],
    ids=["future-marker"],
)
def test_guard_promotes_critical_pressure_to_full_pass_even_with_fresh_marker(
    tmp_path: Path,
    critical_marker_offset: int,
    cooldown: str,
) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    (state / "cleanup-full-pass.at").write_text(str(int(time.time())) + "\n", encoding="utf-8")
    (state / "cleanup-critical-full-pass.at").write_text(
        str(int(time.time()) + critical_marker_offset) + "\n",
        encoding="utf-8",
    )
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text(
        '{"policy_version":"cleanup-v1","artifacts":[]}\n',
        encoding="utf-8",
    )
    runtime_manifest = state / "cleanup-runtime-manifest.json"
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """
import json, os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print(json.dumps({"status": "ok", "discovered": 0, "output": args[args.index("--output") + 1]}))
elif args[0] == "sweep":
    print(json.dumps({"status": "ok", "quarantined": 0, "bytes_quarantined": 0}))
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_TEST_FREE_KB": str(2 * 1024 * 1024),
            "EMERGENCY_GUARD_CRITICAL_FULL_PASS_COOLDOWN_SECONDS": cooldown,
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(runtime_manifest),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    recorded = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    runtime_call, sweep_call = recorded
    assert "--fast-pass" not in sweep_call
    roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--root"
    ]
    assert roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
        str(home / "gig"),
    ]
    critical_marker = state / "cleanup-critical-full-pass.at"
    assert int(critical_marker.read_text(encoding="utf-8").strip()) >= int(time.time()) - 5


def test_guard_does_not_advance_full_marker_after_sweep_failure(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text('{"policy_version":"cleanup-v1","artifacts":[]}\n', encoding="utf-8")
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """\
import os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    import json
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print('{"status":"ok"}')
elif args[0] == "sweep":
    raise SystemExit(7)
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_TEST_FREE_KB": str(2 * 1024 * 1024),
            "EMERGENCY_GUARD_FULL_PASS": "1",
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(state / "cleanup-runtime-manifest.json"),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    first_calls = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    assert [call[0] for call in first_calls] == ["runtime-manifest", "sweep"]
    assert not (state / "cleanup-full-pass.at").exists()

    second = subprocess.run(
        ["/bin/bash", str(GUARD)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )
    assert second.returncode == 3
    recorded = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    assert [call[0] for call in recorded] == [
        "runtime-manifest",
        "sweep",
        "runtime-manifest",
        "sweep",
    ]
    assert (state / "cleanup-critical-full-pass.at").exists()
    first_runtime, _, second_runtime, second_sweep = recorded
    assert "--fast-pass" in second_sweep
    second_roots = [
        second_runtime[index + 1]
        for index, value in enumerate(second_runtime)
        if value == "--root"
    ]
    assert second_roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
    ]
    first_roots = [
        first_runtime[index + 1]
        for index, value in enumerate(first_runtime)
        if value == "--root"
    ]
    assert first_roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
        str(home / "gig"),
    ]


def test_guard_fails_closed_when_critical_marker_cannot_be_written(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    marker_parent = state / "marker-parent"
    marker_parent.write_text("not-a-directory\n", encoding="utf-8")
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text('{"policy_version":"cleanup-v1","artifacts":[]}\n', encoding="utf-8")
    calls = tmp_path / "calls.jsonl"
    fake_control = tmp_path / "fake_cleanup_control.py"
    fake_control.write_text(
        """\
import json, os, shutil, sys
args = sys.argv[1:]
with open(os.environ["CALLS"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps(args) + "\\n")
if args[0] == "runtime-manifest":
    shutil.copyfile(args[args.index("--manifest") + 1], args[args.index("--output") + 1])
    print('{"status":"ok"}')
elif args[0] == "sweep":
    print('{"status":"ok","quarantined":0,"bytes_quarantined":0}')
else:
    raise SystemExit(2)
""",
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update(
        {
            "CALLS": str(calls),
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_TEST_FREE_KB": str(2 * 1024 * 1024),
            "EMERGENCY_GUARD_CRITICAL_FULL_PASS_MARKER": str(marker_parent / "marker"),
            "CLEANUP_CONTROL_PATH": str(fake_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(state / "cleanup-runtime-manifest.json"),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    recorded = [json.loads(line) for line in calls.read_text(encoding="utf-8").splitlines()]
    runtime_call, sweep_call = recorded
    assert "--fast-pass" in sweep_call
    roots = [
        runtime_call[index + 1]
        for index, value in enumerate(runtime_call)
        if value == "--root"
    ]
    assert roots == [
        str(home / "anicca-project/work"),
        str(home / ".openclaw/external"),
    ]
    assert "critical disk pressure: marker write failed" in result.stderr or "critical disk pressure: marker write failed" in (
        home / ".openclaw" / "logs" / "emergency-disk-guard.log"
    ).read_text(encoding="utf-8")


def test_guard_bounds_full_pass_commands_and_preserves_marker_on_timeout(tmp_path: Path) -> None:
    home = tmp_path / "home"
    state = home / ".openclaw" / "state"
    state.mkdir(parents=True)
    base_manifest = tmp_path / "base.json"
    base_manifest.write_text('{"policy_version":"cleanup-v1","artifacts":[]}\n', encoding="utf-8")
    cleanup_control = tmp_path / "cleanup_control.py"
    cleanup_control.write_text("# never reached: timeout wrapper exits first\n", encoding="utf-8")
    timeout_bin = tmp_path / "timeout-wrapper"
    timeout_calls = tmp_path / "timeout-calls.txt"
    timeout_bin.write_text(
        "#!/bin/bash\nprintf '%s\\n' \"$*\" >> \"$TIMEOUT_CALLS\"\nexit 124\n",
        encoding="utf-8",
    )
    timeout_bin.chmod(0o755)
    environment = os.environ.copy()
    environment.update(
        {
            "TIMEOUT_CALLS": str(timeout_calls),
            "CLEANUP_TIMEOUT_BIN": str(timeout_bin),
            "CLEANUP_PASS_TIMEOUT_SECONDS": "1",
            "CLEANUP_PASS_KILL_AFTER_SECONDS": "1",
            "EMERGENCY_GUARD_TEST_HOME": str(home),
            "EMERGENCY_GUARD_TEST_FREE_GB": "4",
            "EMERGENCY_GUARD_TEST_FREE_KB": str(2 * 1024 * 1024),
            "EMERGENCY_GUARD_FULL_PASS": "1",
            "EMERGENCY_GUARD_COLIMA_BIN": str(tmp_path / "missing-colima"),
            "EMERGENCY_GUARD_DOCKER_BIN": str(tmp_path / "missing-docker"),
            "CLEANUP_CONTROL_PATH": str(cleanup_control),
            "CLEANUP_CONTROL_MANIFEST": str(base_manifest),
            "CLEANUP_CONTROL_LEDGER": str(tmp_path / "ledger.jsonl"),
            "CLEANUP_CONTROL_RUNTIME_MANIFEST": str(state / "runtime-manifest.json"),
            "CLEANUP_CONTROL_QUARANTINE_ROOT": str(tmp_path / "quarantine"),
            "EMERGENCY_GUARD_TEST_TEMP_ROOT": str(home / "tmp"),
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
    timeout_args = timeout_calls.read_text(encoding="utf-8").splitlines()
    assert len(timeout_args) == 2
    assert all("--kill-after=1 1 python3" in line for line in timeout_args)
    assert not (state / "cleanup-full-pass.at").exists()

    second = subprocess.run(
        ["/bin/bash", str(GUARD)],
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )
    assert second.returncode == 3
    timeout_args = timeout_calls.read_text(encoding="utf-8").splitlines()
    assert len(timeout_args) == 4
    assert "--fast-pass" in timeout_args[-1]
    assert (state / "cleanup-critical-full-pass.at").exists()
