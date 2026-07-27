#!/usr/bin/env python3
"""Generate the fail-closed TODO #6 workload queue inventory."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import defaultdict
from io import StringIO
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
DEFAULT_PARENT = REPO / "docs/reference/cloud-agent-loop-inventory.tsv"
DEFAULT_EFFECTS = REPO / "docs/reference/cloud-agent-external-effect-inventory.tsv"
DEFAULT_OUTPUT = REPO / "docs/reference/cloud-agent-workload-class-inventory.tsv"
FIELDS = (
    "loop_ref",
    "parent_metadata_digest",
    "workload_queue",
    "isolation_mode",
    "concurrency_key",
    "classification_status",
    "classification_basis",
)
REQUIRED_PARENT_FIELDS = frozenset(
    {
        "inventory_id",
        "source_type",
        "owner",
        "scope",
        "current_location",
        "trigger",
        "entrypoint",
        "state",
        "migration_target",
        "evidence",
    }
)
REQUIRED_EFFECT_FIELDS = frozenset(
    {
        "effect_edge_id",
        "loop_ref",
        "effect_object_id",
        "effect_role",
        "effect_category",
        "coverage_resolution",
        "policy_status",
        "evidence_kind",
        "evidence_locator",
        "review_mode",
        "parent_metadata_digest",
        "discovery_manifest_digest",
    }
)
QUEUE_CONTRACT = {
    "life-events": ("shared_deterministic_worker", "tenant_id"),
    "personal-ceo": ("isolated_agent_session", "tenant_id"),
    "media-cpu": ("ephemeral_container", "tenant_id"),
    "browser-action": (
        "steel_session_and_general_planner",
        "tenant_id+account_id",
    ),
    "financial-read": ("read_only_worker", "tenant_id"),
}
EFFECT_QUEUE = {
    "call": "life-events",
    "mail": "life-events",
    "post": "browser-action",
    "render": "media-cpu",
}
REQUIRED_EFFECT_CATEGORIES = frozenset({"call", "mail", "post", "render", "wallet"})
FINANCIAL_LEDGER_PARENT_ID = "launchd:ai.anicca.life-manager-x402-ledger"


def canonical_digest(value: object) -> str:
    digest = hashlib.sha256(
        json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    ).hexdigest()
    return "sha256:" + ":".join(
        digest[index:index + 8] for index in range(0, 64, 8)
    )


def parent_metadata_digest(parent: dict[str, str]) -> str:
    return canonical_digest({key: parent[key] for key in sorted(parent)})


def loop_ref(parent: dict[str, str]) -> str:
    digest = hashlib.sha256(parent_metadata_digest(parent).encode()).hexdigest()
    return f"loop-{int(digest[:12], 16):015d}"


def read_tsv(path: Path, expected_fields: frozenset[str], label: str) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter="\t"))
    if not rows or set(rows[0]) != expected_fields:
        raise SystemExit(f"{label} schema mismatch")
    return rows


def read_parents(path: Path) -> list[dict[str, str]]:
    parents = read_tsv(path, REQUIRED_PARENT_FIELDS, "parent inventory")
    parent_ids = [parent.get("inventory_id", "") for parent in parents]
    if not all(parent_ids):
        raise SystemExit("empty parent inventory id")
    if len(parent_ids) != len(set(parent_ids)):
        raise SystemExit("duplicate parent inventory id")
    refs = [loop_ref(parent) for parent in parents]
    if len(refs) != len(set(refs)):
        raise SystemExit("duplicate opaque loop reference")
    return parents


def reviewed_effect_queues(
    effects_path: Path, parent_by_ref: dict[str, dict[str, str]]
) -> dict[str, tuple[str, str]]:
    effects = read_tsv(effects_path, REQUIRED_EFFECT_FIELDS, "external-effect inventory")
    edge_ids = [effect.get("effect_edge_id", "") for effect in effects]
    if not all(edge_ids) or len(edge_ids) != len(set(edge_ids)):
        raise SystemExit("duplicate or empty external-effect edge id")
    queues_by_ref: dict[str, set[tuple[str, str]]] = defaultdict(set)
    coverage_by_ref: dict[str, set[str]] = defaultdict(set)
    for effect in effects:
        ref = effect["loop_ref"]
        parent = parent_by_ref.get(ref)
        if parent is None:
            raise SystemExit("unknown effect loop reference")
        if effect["parent_metadata_digest"] != parent_metadata_digest(parent):
            raise SystemExit("external-effect parent revision mismatch")
        if effect["review_mode"] != "independent_review_approved":
            raise SystemExit("external-effect inventory is not independently reviewed")
        if effect["effect_role"] == "category_coverage":
            category = effect["effect_category"]
            if category not in REQUIRED_EFFECT_CATEGORIES:
                raise SystemExit("unsupported effect coverage category")
            if category in coverage_by_ref[ref]:
                raise SystemExit("duplicate effect coverage category")
            coverage_by_ref[ref].add(category)
            continue
        if effect["effect_role"] != "effect_binding":
            raise SystemExit("unsupported external-effect role")
        if (
            effect["coverage_resolution"] != "discovered"
        ):
            raise SystemExit("external-effect binding is not independently reviewed")
        category = effect["effect_category"]
        queue = EFFECT_QUEUE.get(category)
        if queue is None:
            raise SystemExit(f"unsupported specialized effect category: {category}")
        queues_by_ref[ref].add((queue, category))
    resolved: dict[str, tuple[str, str]] = {}
    for ref, queue_categories in queues_by_ref.items():
        queues = {queue for queue, _ in queue_categories}
        if len(queues) != 1:
            raise SystemExit("conflicting specialized workload evidence")
        queue = next(iter(queues))
        categories = sorted(
            category for candidate_queue, category in queue_categories
            if candidate_queue == queue
        )
        if len(categories) != 1:
            raise SystemExit("ambiguous specialized workload evidence")
        resolved[ref] = (queue, categories[0])
    if set(coverage_by_ref) != set(parent_by_ref):
        raise SystemExit("external-effect coverage parent mismatch")
    if any(categories != REQUIRED_EFFECT_CATEGORIES for categories in coverage_by_ref.values()):
        raise SystemExit("external-effect category coverage mismatch")
    return resolved


def classify(
    parent: dict[str, str], effect_queues: dict[str, tuple[str, str]]
) -> dict[str, str]:
    ref = loop_ref(parent)
    if ref in effect_queues:
        queue, category = effect_queues[ref]
        status = "reviewed_effect_binding"
        basis = f"external_effect:{category}"
    elif parent["inventory_id"] == FINANCIAL_LEDGER_PARENT_ID:
        queue = "financial-read"
        status = "reviewed_parent_role"
        basis = "revenue_cost_ledger"
    else:
        queue = "personal-ceo"
        status = "conservative_isolated_default"
        basis = "no_reviewed_specialized_workload_evidence"
    isolation_mode, concurrency_key = QUEUE_CONTRACT[queue]
    return {
        "loop_ref": ref,
        "parent_metadata_digest": parent_metadata_digest(parent),
        "workload_queue": queue,
        "isolation_mode": isolation_mode,
        "concurrency_key": concurrency_key,
        "classification_status": status,
        "classification_basis": basis,
    }


def build_inventory(
    parents: list[dict[str, str]], effects_path: Path
) -> list[dict[str, str]]:
    parent_by_ref = {loop_ref(parent): parent for parent in parents}
    effect_queues = reviewed_effect_queues(effects_path, parent_by_ref)
    rows = sorted(
        (classify(parent, effect_queues) for parent in parents),
        key=lambda row: row["loop_ref"],
    )
    if len(rows) != len(parents) or len(rows) != len(
        {row["loop_ref"] for row in rows}
    ):
        raise SystemExit("workload classification coverage mismatch")
    return rows


def render(rows: list[dict[str, str]]) -> str:
    output = StringIO()
    writer = csv.DictWriter(
        output, fieldnames=FIELDS, delimiter="\t", lineterminator="\n"
    )
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parent", type=Path, default=DEFAULT_PARENT)
    parser.add_argument("--effects", type=Path, default=DEFAULT_EFFECTS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    parents = read_parents(args.parent)
    rendered = render(build_inventory(parents, args.effects))
    args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
