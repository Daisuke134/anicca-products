#!/usr/bin/env python3
"""Pull REAL RevenueCat overview metrics for anicca-ios and append to
~/.smtm/analytics/anicca-ios.jsonl (REQ-001/002/005(a)).

Fail-closed (REQ-001): any of {auth failure, network error, non-2xx response}
exits non-zero and writes NOTHING -- never substitutes a placeholder/zero for
a real read (HARD RULE 0.24, HONESTY Rule 4/5).

Dynamic project-id resolution (REQ-005(a), FIND-004): mirrors the existing
pattern in scripts/daily-metrics/revenuecat_client.py -- a hardcoded project
id would silently go stale if RevenueCat ever provisions a second project.
"""
import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.analytics_writer import append_metric  # noqa: E402

RC_BASE_URL = "https://api.revenuecat.com/v2"
SLUG = "anicca-ios"


def main() -> int:
    key = os.environ.get("REVENUECAT_V2_SECRET_KEY")
    if not key:
        print("ERROR: REVENUECAT_V2_SECRET_KEY not set", file=sys.stderr)
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
            project_id = projects[0]["id"]

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

    append_metric(str(out_path), slug=SLUG, source="revenuecat", metrics=metrics)
    print(f"OK: appended real RevenueCat metrics for {SLUG} to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
