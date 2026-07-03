# Verification Architecture — Portfolio Self-Improvement Loop, Phase 0

## Purity boundary map

| Layer | Purity | Rationale |
|---|---|---|
| `scripts/self-improve/pull_revenuecat.py` | IMPURE (I/O: network call to RevenueCat API) | REQ-001/002 — deterministic tool, no judgment. Adapts the existing `scripts/daily-metrics/revenuecat_client.py` dynamic-project-resolution pattern rather than re-deriving it |
| `scripts/self-improve/pull_stripe.py` | IMPURE (I/O: network call to Stripe API) | REQ-001/002 — deterministic tool, no judgment |
| `scripts/self-improve/products.json` (config) | PURE (static data) | REQ-004 — per-product routing fact table |
| analytics writer (shared helper, both pull scripts) | IMPURE (file append) | REQ-002/003 |
| SCORE+PICK (agent turn, reads ONLY the analytics file) | IMPURE (judgment, non-deterministic by design) | REQ-006 — per building-effective-ai-agents.md, judgment belongs to the model; the PULL step is the deterministic tool, SCORE+PICK is agent judgment reading the tool's real output. Explicitly excludes any signal REQ-005(b) flags as noise (Radar-blocked charges) |
| INNER apply (agent turn + real side effect) | IMPURE | REQ-007 |
| OUTER grade/synthesize/version-bump/PR (agent turn + git/gh CLI) | IMPURE (judgment + side effects) | REQ-008/009/010 |

Per spec P5 (self-heal's own building-effective-agents rule, reused here): the boundary is drawn
at "which product/action to pick and why" (agent judges) vs "what number did the API actually
return" (tool fetches, deterministically, no interpretation).

## Proof obligations

| ID | REQ | Verification tier | How verified |
|---|---|---|---|
| PROP-001 | REQ-001 | Tier 1 (real API call, both success AND failure paths) | Run each pull script live against the real API (success path); separately confirm a live auth failure (temporarily-invalid key) OR a live network-error simulation (unreachable host) causes non-zero exit + zero bytes appended to the analytics file — not just the auth-failure case alone |
| PROP-002 | REQ-002 | Tier 1 (schema check on real output) | `jq` validate the appended line has `ts`/`slug`/`source`/`metrics` after a real run, for BOTH products |
| PROP-003 | REQ-003 | Tier 1 (real re-run) | Run the same script twice, confirm 2 new lines, confirm line count grows monotonically, confirm no line is overwritten (diff old vs new file, old lines byte-identical) |
| PROP-004 | REQ-004 | Tier 0 (static config read) | `products.json` has a `source` field per slug; a script errors clearly if asked to route an undeclared slug rather than guessing |
| PROP-005 | REQ-005 | Tier 1 (real live data) | `anicca-ios` pull returns real RevenueCat numbers already observed in this session (mrr=$17, active_subscriptions=4, active_trials=0, new_customers=269/28d) via the DYNAMICALLY-resolved project id (not the hardcoded literal); `lm-stripe-5usd` pull returns the real charge data (10/10 recent = failed/blocked) already observed |
| PROP-006 | REQ-006 | Tier 1 (real data, documented reasoning) | The SCORE+PICK write-up cites the specific real instrumentation-file numbers used, names which funnel stage they map to, and explicitly states why the Stripe Radar-blocked charges were excluded as evidence (not silently ignored) |
| PROP-007 | REQ-007 | Tier 2 (real side effect + trace) | The INNER action's real side effect is independently confirmed by a method appropriate to the ACTUAL action taken (e.g. if it's a deployed content/copy change: `curl` the live deployed URL and see the actual change; if it's a config/data change: read the real config/data post-change) — not hardwired to assume the action is always a web page; trace line schema-validated |
| PROP-008 | REQ-008 | Tier 2 (real PR, real diff) | `gh pr view` (or equivalent) shows a real, open PR against `dev` with the skill-version-bump diff; confirm no direct push to `dev`/`main` happened (git log check). REQUIRED for this pass (not deferrable — see spec REQ-008's own text) |
| PROP-009 | REQ-009 | Tier 0 (documentation only, this pass) | Confirm the regression-guard rule is written into the persisted skill/lesson artifact so a FUTURE cycle's tooling can act on it; not exercisable as a live test in this pass (no prior version exists yet) |
| PROP-010 | REQ-010 | Tier 1 (real instrumentation absence check) | If no non-noise signal exists, confirm the recorded outer-cycle result literally says NO-OP with the evidence considered, not a silently-skipped run |
| PROP-011 | REQ-011 | Tier 3 (fresh-context adversary + independent E2E) | Spawn `vcsdd:vcsdd-adversary` against the diff; separately, the builder (me) independently re-verifies the real side effect via a live check, not trusting the adversary's disk-only view for the "did it actually deploy" question (same TIER-0/1/2 lesson from the sibling self-heal work this session: adversary judges from disk, the builder verifies the live/rendered outcome) |

## Verification tiers legend
- Tier 0: static/config check, no live call.
- Tier 1: single real live call/read, no external side effect caused.
- Tier 2: real side effect caused + independently confirmed.
- Tier 3: fresh-context adversarial review of the diff, in addition to Tier 1/2 evidence.

## Required proof obligations for THIS pass (lean mode)
Required, no exceptions: PROP-001 through PROP-006 (instrumentation + SCORE+PICK — the spec's
primary explicit ask) AND PROP-007/008/010/011 if REQ-007's INNER action is safely actionable within
this pass's guardrails (REQ-007's own text: if the top SCORE+PICK candidate is out of scope for
autonomous action — e.g. it's the Stripe-fraud or paywall-configuration finding — the system falls
through to the next safely-actionable candidate rather than skipping the cycle). PROP-009 is
documentation-only in this pass (no prior version exists to test reversion against). If, after
falling through all safely-actionable candidates, none exists, the pass is reported honestly as a
partial checkpoint (per REQ-008's own text) — never silently marked complete.
