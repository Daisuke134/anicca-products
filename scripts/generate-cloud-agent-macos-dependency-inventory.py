#!/usr/bin/env python3
"""Generate an opaque, parent-revision-bound macOS migration inventory."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
DEFAULT_PARENT = REPO / "docs/reference/cloud-agent-loop-inventory.tsv"
DEFAULT_OUTPUT = REPO / "docs/reference/cloud-agent-macos-dependency-inventory.tsv"
FIELDS = (
    "loop_ref",
    "parent_metadata_digest",
    "migration_class",
    "scheduler_dependency",
    "payload_portability",
    "replacement_target",
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


def read_parent(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter="\t"))
    if not rows or set(rows[0]) != REQUIRED_PARENT_FIELDS:
        raise SystemExit("parent inventory schema mismatch")
    parent_ids = [row.get("inventory_id", "") for row in rows]
    if not all(parent_ids):
        raise SystemExit("empty parent inventory id")
    if len(parent_ids) != len(set(parent_ids)):
        raise SystemExit("duplicate parent inventory id")
    return rows


def classify(parent: dict[str, str]) -> dict[str, str]:
    source_type = parent["source_type"]
    parse_error = parent["state"].startswith("parse_error")
    if source_type == "launchd":
        values = (
            "replacement_required",
            "macos_launchd",
            "unverified",
            "cloud_scheduler",
            "launchd_is_macos_scheduler_payload_requires_separate_verification",
        )
    elif source_type == "openclaw_cron":
        values = (
            "replacement_required",
            "mac_mini_openclaw_gateway",
            "unverified",
            "cloud_openclaw_gateway",
            "openclaw_cron_is_still_hosted_by_mac_mini_gateway",
        )
    elif source_type == "railway_entrypoint":
        values = (
            "linux_ready",
            "managed_cloud",
            "unverified" if parse_error else "portable",
            "none",
            "already_managed_by_linux_cloud_runtime",
        )
    elif source_type == "repository_entrypoint":
        values = (
            "replacement_required",
            "not_deployed",
            "unverified",
            "cloud_runtime",
            "repository_definition_requires_runtime_binding",
        )
    else:
        raise SystemExit(f"unsupported parent source type: {source_type}")
    (
        migration_class,
        scheduler_dependency,
        payload_portability,
        replacement_target,
        classification_basis,
    ) = values
    return {
        "loop_ref": loop_ref(parent),
        "parent_metadata_digest": parent_metadata_digest(parent),
        "migration_class": migration_class,
        "scheduler_dependency": scheduler_dependency,
        "payload_portability": payload_portability,
        "replacement_target": replacement_target,
        "classification_basis": classification_basis,
    }


def build_inventory(parents: list[dict[str, str]]) -> list[dict[str, str]]:
    rows = sorted((classify(parent) for parent in parents), key=lambda row: row["loop_ref"])
    if len(rows) != len({row["loop_ref"] for row in rows}):
        raise SystemExit("duplicate opaque loop reference")
    return rows


def render(rows: list[dict[str, str]]) -> str:
    from io import StringIO

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
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    rendered = render(build_inventory(read_parent(args.parent)))
    args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
