#!/usr/bin/env python3
"""Pull REAL RevenueCat overview metrics for anicca-ios and append to
~/.smtm/analytics/anicca-ios.jsonl (REQ-001/002/004/005(a)).

Fail-closed (REQ-001): any of {auth failure, network error, non-2xx response}
exits non-zero and writes NOTHING -- never substitutes a placeholder/zero for
a real read (HARD RULE 0.24, HONESTY Rule 4/5).

Dynamic project-id resolution (REQ-005(a), FIND-004): mirrors the existing
pattern in scripts/daily-metrics/revenuecat_client.py -- a hardcoded project
id would silently go stale if RevenueCat ever provisions a second project.
If the key's account has MORE than one project, this refuses to silently
guess [0] -- it matches by name ("anicca") and fails closed if that match is
ambiguous or absent (adversary finding, Phase 3 review: "don't guess" applies
here exactly as it does to REQ-004's per-product routing).
"""
import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.analytics_writer import append_metric  # noqa: E402
from lib.product_router import resolve_source  # noqa: E402

RC_BASE_URL = "https://api.revenuecat.com/v2"
SLUG = "anicca-ios"


def _resolve_project_id(projects: list) -> str | None:
    if len(projects) == 1:
        return projects[0]["id"]
    matches = [p for p in projects if "anicca" in (p.get("name") or "").lower()]
    if len(matches) == 1:
        return matches[0]["id"]
    return None  # ambiguous or no match — caller fails closed rather than guessing


def main() -> int:
    key = os.environ.get("REVENUECAT_V2_SECRET_KEY")
    if not key:
        print("ERROR: REVENUECAT_V2_SECRET_KEY not set", file=sys.stderr)
        return 1

    products_path = Path(__file__).resolve().parent / "products.json"
    try:
        declared_source = resolve_source(str(products_path), SLUG)
    except (KeyError, FileNotFoundError) as e:
        print(f"ERROR: product routing failed for slug '{SLUG}': {e}", file=sys.stderr)
        return 1
    if declared_source != "revenuecat":
        print(f"ERROR: products.json declares source='{declared_source}' for {SLUG}, this script is revenuecat-only", file=sys.stderr)
        return 1

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    analytics_dir = Path(os.environ.get("SMTM_ANALYTICS_DIR", str(Path.home() / ".smtm" / "analytics")))
    analytics_dir.mkdir(parents=True, exist_ok=True)
    out_path = analytics_dir / f"{SLUG}.jsonl"

    try:
        with httpx.Client(timeout=30.0) as client:
            projects_resp = client.get(f"{RC_BASE_URL}/projects", headers=headers)
            projects_resp.raise_for_status()
            projects = projects_resp.json().get("items", [])
            if not projects:
                print("ERROR: RevenueCat returned zero projects for this key", file=sys.stderr)
                return 1
            project_id = _resolve_project_id(projects)
            if project_id is None:
                names = [p.get("name") for p in projects]
                print(
                    f"ERROR: RevenueCat key has {len(projects)} projects ({names}); "
                    "cannot unambiguously identify the anicca-ios one — refusing to guess",
                    file=sys.stderr,
                )
                return 1

            overview_resp = client.get(
                f"{RC_BASE_URL}/projects/{project_id}/metrics/overview", headers=headers
            )
            overview_resp.raise_for_status()
            data = overview_resp.json()
    except httpx.HTTPStatusError as e:
        print(f"ERROR: RevenueCat API returned {e.response.status_code}: {e}", file=sys.stderr)
        return 1
    except httpx.RequestError as e:
        print(f"ERROR: RevenueCat API network error: {e}", file=sys.stderr)
        return 1

    metrics = {}
    for m in data.get("metrics", []):
        mid = m.get("id")
        if mid:
            metrics[mid] = m.get("value")

    if not metrics:
        print("ERROR: RevenueCat overview returned zero metrics — refusing to write an empty record", file=sys.stderr)
        return 1

    append_metric(str(out_path), slug=SLUG, source=declared_source, metrics=metrics)
    print(f"OK: appended real RevenueCat metrics for {SLUG} to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
