#!/usr/bin/env python3
"""Contract tests for TODO #6 workload queue classification."""

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
EFFECTS = REPO / "docs/reference/cloud-agent-external-effect-inventory.tsv"
GENERATOR = REPO / "scripts/generate-cloud-agent-workload-class-inventory.py"
TRACKED = REPO / "docs/reference/cloud-agent-workload-class-inventory.tsv"
DOCUMENTATION = REPO / "docs/reference/cloud-agent-workload-class-inventory.md"
FIELDS = [
    "loop_ref",
    "parent_metadata_digest",
    "workload_queue",
    "isolation_mode",
    "concurrency_key",
    "classification_status",
    "classification_basis",
]
QUEUE_CONTRACT = {
    "life-events": ("shared_deterministic_worker", "tenant_id"),
    "personal-ceo": ("isolated_agent_session", "tenant_id"),
    "media-cpu": ("ephemeral_container", "tenant_id"),
    "browser-action": ("steel_session_and_general_planner", "tenant_id+account_id"),
    "financial-read": ("read_only_worker", "tenant_id"),
}
EFFECT_QUEUE = {
    "call": "life-events",
    "mail": "life-events",
    "post": "browser-action",
    "render": "media-cpu",
}


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def write_tsv(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=list(rows[0]),
            delimiter="\t",
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def canonical_digest(value: object) -> str:
    digest = hashlib.sha256(
        json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    ).hexdigest()
    return "sha256:" + ":".join(
        digest[index:index + 8] for index in range(0, 64, 8)
    )


def parent_metadata_digest(parent: dict[str, str]) -> str:
    return canonical_digest({key: parent[key] for key in sorted(parent)})


def opaque_loop_ref(parent: dict[str, str]) -> str:
    digest = hashlib.sha256(parent_metadata_digest(parent).encode()).hexdigest()
    return f"loop-{int(digest[:12], 16):015d}"


class WorkloadClassInventoryContractTests(unittest.TestCase):
    def run_generator(
        self, parent: Path, effects: Path, output: Path
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                "python3",
                str(GENERATOR),
                "--parent",
                str(parent),
                "--effects",
                str(effects),
                "--output",
                str(output),
            ],
            cwd=REPO,
            capture_output=True,
            text=True,
        )

    def test_every_current_parent_has_exactly_one_queue_contract(self) -> None:
        self.assertTrue(GENERATOR.is_file())
        self.assertTrue(TRACKED.is_file())
        self.assertTrue(DOCUMENTATION.is_file())
        parents = read_tsv(PARENT)
        rows = read_tsv(TRACKED)
        self.assertEqual(393, len(parents))
        self.assertEqual(393, len(rows))
        self.assertEqual(FIELDS, list(rows[0]))
        self.assertEqual(393, len({row["loop_ref"] for row in rows}))
        self.assertEqual(
            {opaque_loop_ref(parent) for parent in parents},
            {row["loop_ref"] for row in rows},
        )
        self.assertEqual(set(QUEUE_CONTRACT), {row["workload_queue"] for row in rows})
        for row in rows:
            self.assertEqual(
                QUEUE_CONTRACT[row["workload_queue"]],
                (row["isolation_mode"], row["concurrency_key"]),
            )

    def test_reviewed_effects_and_financial_ledger_route_to_specialized_queues(self) -> None:
        parents = read_tsv(PARENT)
        effects = read_tsv(EFFECTS)
        rows = read_tsv(TRACKED)
        row_by_ref = {row["loop_ref"]: row for row in rows}
        bindings = [row for row in effects if row["effect_role"] == "effect_binding"]
        self.assertEqual(6, len(bindings))
        for binding in bindings:
            expected_queue = EFFECT_QUEUE[binding["effect_category"]]
            classified = row_by_ref[binding["loop_ref"]]
            self.assertEqual(expected_queue, classified["workload_queue"])
            self.assertEqual("reviewed_effect_binding", classified["classification_status"])
            self.assertEqual(
                f"external_effect:{binding['effect_category']}",
                classified["classification_basis"],
            )
        financial_parent = next(
            parent
            for parent in parents
            if parent["inventory_id"] == "launchd:ai.anicca.life-manager-x402-ledger"
        )
        financial = row_by_ref[opaque_loop_ref(financial_parent)]
        self.assertEqual("financial-read", financial["workload_queue"])
        self.assertEqual("reviewed_parent_role", financial["classification_status"])
        self.assertEqual("revenue_cost_ledger", financial["classification_basis"])

    def test_unverified_loops_use_conservative_isolated_default(self) -> None:
        counts = Counter(row["workload_queue"] for row in read_tsv(TRACKED))
        self.assertEqual(
            {
                "browser-action": 3,
                "financial-read": 1,
                "life-events": 2,
                "media-cpu": 1,
                "personal-ceo": 386,
            },
            dict(sorted(counts.items())),
        )
        for row in read_tsv(TRACKED):
            if row["workload_queue"] == "personal-ceo":
                self.assertEqual(
                    "conservative_isolated_default", row["classification_status"]
                )
                self.assertEqual(
                    "no_reviewed_specialized_workload_evidence",
                    row["classification_basis"],
                )

    def test_output_is_deterministic_private_and_parent_revision_bound(self) -> None:
        parents = read_tsv(PARENT)
        tracked = TRACKED.read_bytes()
        with tempfile.TemporaryDirectory() as temp_dir:
            first = Path(temp_dir) / "first.tsv"
            second = Path(temp_dir) / "second.tsv"
            for output in (first, second):
                completed = self.run_generator(PARENT, EFFECTS, output)
                self.assertEqual(0, completed.returncode, completed.stderr)
                self.assertEqual("", completed.stdout)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(tracked, first.read_bytes())
        serialized = tracked.decode()
        for parent in parents:
            self.assertNotIn(parent["inventory_id"], serialized)
            self.assertIn(parent_metadata_digest(parent), serialized)

    def test_conflicting_specialized_bindings_fail_closed_without_output(self) -> None:
        effects = read_tsv(EFFECTS)
        call_binding = next(
            row
            for row in effects
            if row["effect_role"] == "effect_binding"
            and row["effect_category"] == "call"
        )
        conflict = dict(call_binding)
        conflict["effect_edge_id"] = "effect-edge-999999999999999"
        conflict["effect_category"] = "render"
        with tempfile.TemporaryDirectory() as temp_dir:
            conflict_path = Path(temp_dir) / "conflict.tsv"
            output = Path(temp_dir) / "must-not-exist.tsv"
            write_tsv(conflict_path, [*effects, conflict])
            completed = self.run_generator(PARENT, conflict_path, output)
            self.assertNotEqual(0, completed.returncode)
            self.assertEqual("", completed.stdout)
            self.assertFalse(output.exists())
            self.assertIn("conflicting specialized workload evidence", completed.stderr)

    def test_unknown_effect_loop_fails_closed_without_output(self) -> None:
        effects = read_tsv(EFFECTS)
        unknown = dict(
            next(row for row in effects if row["effect_role"] == "effect_binding")
        )
        unknown["effect_edge_id"] = "effect-edge-999999999999998"
        unknown["loop_ref"] = "loop-999999999999999"
        with tempfile.TemporaryDirectory() as temp_dir:
            effects_path = Path(temp_dir) / "unknown.tsv"
            output = Path(temp_dir) / "must-not-exist.tsv"
            write_tsv(effects_path, [*effects, unknown])
            completed = self.run_generator(PARENT, effects_path, output)
            self.assertNotEqual(0, completed.returncode)
            self.assertEqual("", completed.stdout)
            self.assertFalse(output.exists())
            self.assertIn("unknown effect loop reference", completed.stderr)

    def test_stale_category_coverage_fails_closed_without_output(self) -> None:
        effects = read_tsv(EFFECTS)
        stale = [dict(row) for row in effects]
        coverage = next(
            row for row in stale if row["effect_role"] == "category_coverage"
        )
        coverage["parent_metadata_digest"] = (
            "sha256:00000000:00000000:00000000:00000000:"
            "00000000:00000000:00000000:00000000"
        )
        with tempfile.TemporaryDirectory() as temp_dir:
            effects_path = Path(temp_dir) / "stale.tsv"
            output = Path(temp_dir) / "must-not-exist.tsv"
            write_tsv(effects_path, stale)
            completed = self.run_generator(PARENT, effects_path, output)
            self.assertNotEqual(0, completed.returncode)
            self.assertEqual("", completed.stdout)
            self.assertFalse(output.exists())
            self.assertIn("external-effect parent revision mismatch", completed.stderr)


if __name__ == "__main__":
    unittest.main()
