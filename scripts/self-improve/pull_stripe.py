#!/usr/bin/env python3
"""Pull REAL Stripe checkout-session + charge-outcome data for the LM $5
payment link and append to ~/.smtm/analytics/lm-stripe-5usd.jsonl
(REQ-001/002/004/005(b)).

Fail-closed (REQ-001): any of {auth failure, network error, non-2xx response}
exits non-zero and writes NOTHING.

Payment link resolution note: the repo's NEXT_PUBLIC_STRIPE_LINK_5 env var
points at a TEST-mode URL (buy.stripe.com/test_...) and is NOT the live link
real customers hit. The real, live, active $5 link was identified by tracing
a real recent charge -> payment_intent -> checkout session -> payment_link
(plink_1TgOluEeDsUAcaLSqXWXjUz7, confirmed unit_amount=500 usd, active=true).
Hardcoded here (not resolved dynamically like RevenueCat's project id) because
Stripe has no "list payment links for this product line" single-call
equivalent to RevenueCat's /v2/projects — if this ever needs to change, update
LM_5USD_PAYMENT_LINK_ID below, in ONE place.

Charge-outcome enrichment (adversary finding, Phase 3 review): a prior version
of this script recorded only checkout_sessions.payment_status, which cannot
distinguish "Stripe Radar blocked this as fraud" from "a genuine customer's
card was declined" — the SCORE+PICK reasoning in evidence/score-pick-cycle-1.md
claimed the former based on an ad-hoc manual check during spec-writing that
was never captured durably in the instrumentation itself. This version pulls
the real charge.outcome for each checkout session that reached the charge
stage (has a payment_intent), so that distinction is now grounded in this
script's own re-runnable output, not unarchived prose.
"""
import os
import sys
import time
from collections import Counter
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.analytics_writer import append_metric  # noqa: E402
from lib.product_router import resolve_source  # noqa: E402

LM_5USD_PAYMENT_LINK_ID = "plink_1TgOluEeDsUAcaLSqXWXjUz7"
SLUG = "lm-stripe-5usd"
WINDOW_DAYS = 30
MAX_CHARGE_LOOKUPS = 50  # bounded — this link's real volume (~100-120/30d) fits well within this


def main() -> int:
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        print("ERROR: STRIPE_SECRET_KEY not set", file=sys.stderr)
        return 1

    products_path = Path(__file__).resolve().parent / "products.json"
    try:
        declared_source = resolve_source(str(products_path), SLUG)
    except (KeyError, FileNotFoundError) as e:
        print(f"ERROR: product routing failed for slug '{SLUG}': {e}", file=sys.stderr)
        return 1
    if declared_source != "stripe":
        print(f"ERROR: products.json declares source='{declared_source}' for {SLUG}, this script is stripe-only", file=sys.stderr)
        return 1

    analytics_dir = Path(os.environ.get("SMTM_ANALYTICS_DIR", str(Path.home() / ".smtm" / "analytics")))
    analytics_dir.mkdir(parents=True, exist_ok=True)
    out_path = analytics_dir / f"{SLUG}.jsonl"

    since = int(time.time()) - WINDOW_DAYS * 86400
    sessions = []
    starting_after = None
    try:
        with httpx.Client(timeout=30.0) as client:
            for _ in range(10):  # bounded pagination — this link's volume is low, 10 pages is ample
                params = {
                    "payment_link": LM_5USD_PAYMENT_LINK_ID,
                    "limit": 100,
                    "created[gte]": since,
                }
                if starting_after:
                    params["starting_after"] = starting_after
                resp = client.get(
                    "https://api.stripe.com/v1/checkout/sessions",
                    params=params,
                    auth=(key, ""),
                )
                resp.raise_for_status()
                page = resp.json()
                sessions.extend(page.get("data", []))
                if not page.get("has_more"):
                    break
                starting_after = page["data"][-1]["id"]

            # Real charge-outcome enrichment: for sessions that reached the charge
            # stage (payment_intent present), fetch the real outcome — this is
            # what actually distinguishes "Stripe blocked this as fraud" from a
            # genuine customer decline, and is what SCORE+PICK must ground its
            # noise/no-noise call in (adversary finding, Phase 3).
            outcome_types: Counter = Counter()
            outcome_reasons: Counter = Counter()
            failure_codes: Counter = Counter()
            lookups_done = 0
            for s in sessions:
                pi = s.get("payment_intent")
                if not pi or lookups_done >= MAX_CHARGE_LOOKUPS:
                    continue
                lookups_done += 1
                charge_resp = client.get(
                    "https://api.stripe.com/v1/charges",
                    params={"payment_intent": pi, "limit": 1},
                    auth=(key, ""),
                )
                charge_resp.raise_for_status()
                charges = charge_resp.json().get("data", [])
                if not charges:
                    continue
                charge = charges[0]
                outcome = charge.get("outcome") or {}
                if outcome.get("type"):
                    outcome_types[outcome["type"]] += 1
                if outcome.get("reason"):
                    outcome_reasons[outcome["reason"]] += 1
                if charge.get("failure_code"):
                    failure_codes[charge["failure_code"]] += 1
    except httpx.HTTPStatusError as e:
        print(f"ERROR: Stripe API returned {e.response.status_code}: {e}", file=sys.stderr)
        return 1
    except httpx.RequestError as e:
        print(f"ERROR: Stripe API network error: {e}", file=sys.stderr)
        return 1

    paid = sum(1 for s in sessions if s.get("payment_status") == "paid")
    total = len(sessions)
    metrics = {
        "window_days": WINDOW_DAYS,
        "total_checkout_sessions": total,
        "paid_sessions": paid,
        "unpaid_or_expired_sessions": total - paid,
        "success_rate": round(paid / total, 4) if total else None,
        "payment_link_id": LM_5USD_PAYMENT_LINK_ID,
        "charge_outcome_lookups_sampled": lookups_done,
        "charge_outcome_types": dict(outcome_types),
        "charge_outcome_reasons": dict(outcome_reasons),
        "charge_failure_codes": dict(failure_codes),
    }

    append_metric(str(out_path), slug=SLUG, source=declared_source, metrics=metrics)
    print(f"OK: appended real Stripe metrics for {SLUG} to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
