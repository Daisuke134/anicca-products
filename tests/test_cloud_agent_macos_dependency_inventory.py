#!/usr/bin/env python3
"""Contract tests for TODO #5 macOS dependency classification."""

from __future__ import annotations

import csv
import hashlib
import json
import subprocess
import tempfile
import unittest
from collections import Counter
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
PARENT = REPO / "docs/reference/cloud-agent-loop-inventory.tsv"
GENERATOR = REPO / "scripts/generate-cloud-agent-macos-dependency-inventory.py"
TRACKED = REPO / "docs/reference/cloud-agent-macos-dependency-inventory.tsv"
DOCUMENTATION = REPO / "docs/reference/cloud-agent-macos-dependency-inventory.md"
FIELDS = [
    "loop_ref",
    "parent_metadata_digest",
    "migration_class",
    "scheduler_dependency",
    "payload_portability",
    "replacement_target",
    "classification_basis",
]


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def canonical_digest(value: object) -> str:
    digest = hashlib.sha256(
        json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    ).hexdigest()
    return "sha256:" + ":".join(digest[index:index + 8] for index in range(0, 64, 8))


def parent_metadata_digest(parent: dict[str, str]) -> str:
    return canonical_digest({key: parent[key] for key in sorted(parent)})


def opaque_loop_ref(parent: dict[str, str]) -> str:
    digest = hashlib.sha256(parent_metadata_digest(parent).encode()).hexdigest()
    return f"loop-{int(digest[:12], 16):015d}"


class MacOSDependencyInventoryContractTests(unittest.TestCase):
    def test_every_current_parent_has_one_opaque_classification(self) -> None:
        self.assertTrue(GENERATOR.is_file())
        self.assertTrue(TRACKED.is_file())
        self.assertTrue(DOCUMENTATION.is_file())
        parents = read_tsv(PARENT)
        rows = read_tsv(TRACKED)
        self.assertEqual(396, len(parents))
        self.assertEqual(396, len(rows))
        self.assertEqual(FIELDS, list(rows[0]))
        self.assertEqual(396, len({row["loop_ref"] for row in rows}))
        expected_refs = {
            opaque_loop_ref(parent) for parent in parents
        }
        self.assertEqual(expected_refs, {row["loop_ref"] for row in rows})
        self.assertEqual(
            {"linux_ready", "replacement_required", "retire"},
            {row["migration_class"] for row in rows} | {"retire"},
        )

    def test_classification_is_conservative_and_scheduler_specific(self) -> None:
        parents = read_tsv(PARENT)
        rows = read_tsv(TRACKED)
        row_by_ref = {row["loop_ref"]: row for row in rows}
        counts = Counter(row["migration_class"] for row in rows)
        self.assertEqual(
            {"linux_ready": 1, "replacement_required": 395},
            dict(sorted(counts.items())),
        )
        for parent in parents:
            row = row_by_ref[opaque_loop_ref(parent)]
            if parent["source_type"] == "launchd":
                self.assertEqual("replacement_required", row["migration_class"])
                self.assertEqual("macos_launchd", row["scheduler_dependency"])
                self.assertEqual("cloud_scheduler", row["replacement_target"])
            elif parent["source_type"] == "openclaw_cron":
                self.assertEqual("replacement_required", row["migration_class"])
                self.assertEqual("mac_mini_openclaw_gateway", row["scheduler_dependency"])
                self.assertEqual("unverified", row["payload_portability"])
                self.assertEqual("cloud_openclaw_gateway", row["replacement_target"])
            elif parent["source_type"] == "railway_entrypoint":
                self.assertEqual("linux_ready", row["migration_class"])
                self.assertEqual("managed_cloud", row["scheduler_dependency"])
                self.assertEqual("none", row["replacement_target"])
            else:
                self.assertEqual("repository_entrypoint", parent["source_type"])
                self.assertEqual("replacement_required", row["migration_class"])
                self.assertEqual("not_deployed", row["scheduler_dependency"])
                self.assertEqual("cloud_runtime", row["replacement_target"])

    def test_unverified_payload_is_not_misclassified_as_retired(self) -> None:
        parents = read_tsv(PARENT)
        rows = read_tsv(TRACKED)
        row_by_ref = {row["loop_ref"]: row for row in rows}
        for parent in parents:
            row = row_by_ref[opaque_loop_ref(parent)]
            if parent["state"].startswith("parse_error") or parent["source_type"] == "repository_entrypoint":
                self.assertEqual("unverified", row["payload_portability"])
                self.assertNotEqual("retire", row["migration_class"])

    def test_output_is_deterministic_private_and_parent_revision_bound(self) -> None:
        parents = read_tsv(PARENT)
        tracked = TRACKED.read_bytes()
        with tempfile.TemporaryDirectory() as temp_dir:
            first = Path(temp_dir) / "first.tsv"
            second = Path(temp_dir) / "second.tsv"
            for output in (first, second):
                completed = subprocess.run(
                    ["python3", str(GENERATOR), "--parent", str(PARENT), "--output", str(output)],
                    cwd=REPO,
                    capture_output=True,
                    text=True,
                )
                self.assertEqual(0, completed.returncode, completed.stderr)
                self.assertEqual("", completed.stdout)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(tracked, first.read_bytes())
        serialized = tracked.decode()
        for parent in parents:
            self.assertNotIn(parent["inventory_id"], serialized)
            self.assertIn(parent_metadata_digest(parent), serialized)

    def test_duplicate_parent_fails_closed_without_output(self) -> None:
        rows = read_tsv(PARENT)
        with tempfile.TemporaryDirectory() as temp_dir:
            duplicate_parent = Path(temp_dir) / "duplicate.tsv"
            output = Path(temp_dir) / "must-not-exist.tsv"
            with duplicate_parent.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=list(rows[0]),
                    delimiter="\t",
                    lineterminator="\n",
                )
                writer.writeheader()
                writer.writerows([*rows, rows[0]])
            completed = subprocess.run(
                ["python3", str(GENERATOR), "--parent", str(duplicate_parent), "--output", str(output)],
                cwd=REPO,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(0, completed.returncode)
            self.assertEqual("", completed.stdout)
            self.assertFalse(output.exists())
            self.assertIn("duplicate parent", completed.stderr)


if __name__ == "__main__":
    unittest.main()
