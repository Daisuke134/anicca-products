from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

import pytest


CONTROL = Path(__file__).parents[1] / "cleanup_control.py"


@pytest.mark.skipif(shutil.which("hdiutil") is None, reason="macOS hdiutil is required")
def test_real_off_volume_quarantine_and_restore(tmp_path: Path) -> None:
    evidence_dir = Path(os.environ.get("CLEANUP_E2E_EVIDENCE_DIR", tmp_path / "evidence"))
    evidence_dir.mkdir(parents=True, exist_ok=False)
    image = evidence_dir / "quarantine.dmg"
    mountpoint = evidence_dir / "mounted-volume"
    mountpoint.mkdir()
    subprocess.run(
        [
            "hdiutil",
            "create",
            "-quiet",
            "-size",
            "16m",
            "-fs",
            "HFS+",
            "-volname",
            "CleanupControlE2E",
            str(image),
        ],
        check=True,
    )
    subprocess.run(
        ["hdiutil", "attach", "-quiet", "-nobrowse", "-mountpoint", str(mountpoint), str(image)],
        check=True,
    )
    try:
        quarantine = mountpoint / "quarantine"
        quarantine.mkdir()
        source = evidence_dir / "expired-ephemeral"
        source.mkdir()
        payload = source / "payload.bin"
        original_bytes = b"cleanup-control-real-off-volume-round-trip\n"
        payload.write_bytes(original_bytes)
        old = int(time.time()) - 3600
        os.utime(payload, (old, old))
        os.utime(source, (old, old))
        manifest = evidence_dir / "manifest.json"
        manifest.write_text(
            json.dumps(
                {
                    "policy_version": "e2e-v1",
                    "artifacts": [
                        {
                            "id": "expired-e2e",
                            "path": str(source),
                            "owner": "cleanup-e2e",
                            "class": "ephemeral",
                            "ttl_seconds": 60,
                            "quota_bytes": 0,
                            "lease": None,
                            "finalizer": {"kind": "off_volume_quarantine"},
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        ledger = evidence_dir / "delete-ledger.jsonl"
        assert os.stat(source).st_dev != os.stat(quarantine).st_dev
        swept = subprocess.run(
            [
                "python3",
                str(CONTROL),
                "sweep",
                "--manifest",
                str(manifest),
                "--quarantine-root",
                str(quarantine),
                "--ledger",
                str(ledger),
            ],
            check=True,
            text=True,
            capture_output=True,
        )
        sweep_result = json.loads(swept.stdout)
        assert sweep_result["quarantined"] == 1
        assert not source.exists()
        events = [json.loads(line) for line in ledger.read_text().splitlines()]
        transaction = next(event for event in events if event["event"] == "quarantined")
        restored = subprocess.run(
            [
                "python3",
                str(CONTROL),
                "restore",
                "--transaction-id",
                transaction["transaction_id"],
                "--quarantine-root",
                str(quarantine),
                "--ledger",
                str(ledger),
            ],
            check=True,
            text=True,
            capture_output=True,
        )
        restore_result = json.loads(restored.stdout)
        assert restore_result["status"] == "restored"
        assert payload.read_bytes() == original_bytes
        summary = {
            "source_device": os.stat(source).st_dev,
            "quarantine_device": os.stat(quarantine).st_dev,
            "different_device": os.stat(source).st_dev != os.stat(quarantine).st_dev,
            "sweep": sweep_result,
            "restore": restore_result,
            "restored_sha256": hashlib.sha256(payload.read_bytes()).hexdigest(),
            "ledger_events": [json.loads(line)["event"] for line in ledger.read_text().splitlines()],
        }
        (evidence_dir / "e2e-summary.json").write_text(
            json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
    finally:
        subprocess.run(["hdiutil", "detach", "-quiet", str(mountpoint)], check=True)

