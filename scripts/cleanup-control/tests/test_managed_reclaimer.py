from __future__ import annotations

import importlib.util
import json
from pathlib import Path


MODULE = Path(__file__).parents[1] / "cleanup_control.py"
SPEC = importlib.util.spec_from_file_location("cleanup_control_managed", MODULE)
assert SPEC and SPEC.loader
cleanup_control = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cleanup_control)


def _manifest(path: Path) -> Path:
    manifest = path / "manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "policy_version": "cleanup-v1",
                "artifacts": [
                    {
                        "id": "gig-evidence",
                        "path": str(path / "gig" / "evidence"),
                        "owner": "gig-revenue-loop",
                        "class": "managed_regenerable",
                        "ttl_seconds": None,
                        "quota_bytes": 0,
                        "lease": None,
                        "finalizer": {
                            "kind": "managed_reclaimer",
                            "reclaimer": "gig_evidence_gc",
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    return manifest


def test_manifest_declares_a_lifecycle_managed_reclaimer(tmp_path: Path) -> None:
    _, _, entries = cleanup_control.load_manifest(_manifest(tmp_path))
    assert entries[0]["class"] == "managed_regenerable"
    assert entries[0]["finalizer"] == {
        "kind": "managed_reclaimer",
        "reclaimer": "gig_evidence_gc",
    }


def test_sweep_runs_declared_reclaimer_and_accounts_bytes(tmp_path: Path, monkeypatch) -> None:
    evidence = tmp_path / "gig" / "evidence"
    evidence.mkdir(parents=True)
    payload = evidence / "old-browse.png"
    payload.write_bytes(b"x" * 4096)
    marker = tmp_path / "reclaimer.marker"
    reclaimer = tmp_path / "reclaimer.py"
    reclaimer.write_text(
        """
import os
import sys
from pathlib import Path

target = Path(sys.argv[sys.argv.index('--evidence-root') + 1])
Path(os.environ['RECLAIMER_MARKER']).write_text(str(target), encoding='utf-8')
(target / 'old-browse.png').unlink()
""",
        encoding="utf-8",
    )
    monkeypatch.setenv("GIG_EVIDENCE_GC_SCRIPT", str(reclaimer))
    monkeypatch.setenv("RECLAIMER_MARKER", str(marker))

    result = cleanup_control.sweep(
        manifest_path=_manifest(tmp_path),
        quarantine_root=tmp_path / "quarantine",
        ledger_path=tmp_path / "ledger.jsonl",
        candidates=[evidence],
    )

    assert result["status"] == "ok"
    assert result["quarantined"] == 1
    assert result["bytes_quarantined"] == 4096
    assert not payload.exists()
    assert marker.read_text(encoding="utf-8") == str(evidence)
    row = json.loads((tmp_path / "ledger.jsonl").read_text(encoding="utf-8"))
    assert row["event"] == "removed"
    assert row["reason"] == "managed_reclaimer"
    assert row["reclaimer"] == "gig_evidence_gc"
