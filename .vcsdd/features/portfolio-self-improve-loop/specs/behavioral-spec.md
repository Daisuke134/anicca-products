# Behavioral Spec — Portfolio Self-Improvement Loop, Phase 0 (Instrumentation + one INNER/OUTER cycle)

Source design: `docs/superpowers/specs/2026-07-03-portfolio-self-improve-loop-design.md`.

**Scope of THIS spec** (per explicit task assignment, not the full daily loop): land real metric
instrumentation for a small number of real products, then run exactly ONE real INNER (apply a
tiny, verifiable, low-risk action) → OUTER (grade, synthesize a lesson, version-bump a skill, open
a PR) cycle end to end. The full 7-day/7-step daily loop, the multi-product SCORE+PICK ranking
across the whole portfolio, and the weekly `money-retro` rollup are explicitly OUT of scope for
this pass — they are follow-up work once this slice is proven.

## REQ-001 — Deterministic metric pull writes real numbers, never fabricated ones
WHEN the instrumentation tool for a given product is invoked, the system SHALL call the product's
real metrics API (RevenueCat MCP for App-Store apps, Stripe API for Stripe-billed products) and
SHALL NOT write any value that was not returned by that live call.
IF the live API call fails (auth error, network error, non-2xx response) THEN the system SHALL
exit non-zero and SHALL NOT write a line to the analytics file (fail-closed — no placeholder/zero
substituted for a real read, per HARD RULE 0.24 no-dry-run and HONESTY Rule 4/5).

## REQ-002 — Analytics write schema (spec's REPLACE item for show-me-the-money)
WHEN a metric pull succeeds, the system SHALL append exactly one JSON line to
`~/.smtm/analytics/<slug>.jsonl` with, at minimum, the fields: `ts` (ISO-8601 UTC), `slug` (product
identifier), `source` (`revenuecat` | `stripe`), and `metrics` (an object of the real values
returned by the API, field names preserved from the source API where practical).
The file SHALL be append-only; the tool SHALL NOT rewrite or truncate prior lines on a later run.

## REQ-003 — Idempotent, safe to re-run
WHEN the same instrumentation tool is invoked twice in a row, the system SHALL make two independent
live API calls and append two lines (one per call); no caching/memoization SHALL suppress a
genuine re-read, and no run SHALL corrupt or duplicate-merge a prior line.

## REQ-004 — Per-product routing (money-finance business-type branch, adapted)
WHILE resolving which API to call for a given product slug, the system SHALL read the product's
declared `source` (revenuecat|stripe) from a small per-product config (not hardcoded inline
per-script judgment about WHICH product uses WHICH billing rail — that mapping is a fact about the
product, recorded once, not re-derived).

## REQ-005 — First two real products instrumented in this pass
THE system SHALL instrument at minimum:
  (a) `anicca-ios` — the live Anicca App Store app, RevenueCat project resolved DYNAMICALLY at
      runtime via `GET /v2/projects` (the first/only project returned — matching the existing
      dynamic-resolution pattern already used by `scripts/daily-metrics/revenuecat_client.py:29-32`
      in this same repo; a hardcoded project id would silently go stale if RevenueCat ever
      provisions a second project), via `get-overview-metrics`.
  (b) `lm-stripe-5usd` — the real, currently-live Stripe $5 payment link for Life Manager
      (`NEXT_PUBLIC_STRIPE_LINK_5`), selected because it has real, verifiable, non-zero recent
      charge activity. NOTE (surfaced, not hidden): a live check during spec-writing found the 10
      most recent charges on this link are ALL `status=failed`, `outcome.reason=highest_risk_level`
      (Stripe Radar blocking, `network_status=not_sent_to_network`), from multiple different
      countries/card-funding-types in a pattern consistent with card-testing/fraud probing rather
      than genuine customer friction. The instrumentation SHALL record the real charge
      success/failure counts and failure reasons as-is; REQ-006's SCORE+PICK step SHALL NOT treat
      a Radar-blocked (`outcome.type=blocked`) charge as a genuine funnel/UX bottleneck signal
      (design spec Rule 6 weighted evidence + Rule 5 weak/conflicting signal = NO-OP) — this is
      exactly the kind of noisy signal the early-stage grader must not act on.
Further products are explicitly deferred to a later pass (spec's own portfolio-wide SCORE+PICK is
out of scope here).

## REQ-006 — SCORE+PICK: rank candidate actions from real data, not just the single top pick
WHEN REQ-005's instrumentation has run at least once for both products, the system SHALL apply the
design spec's funnel-lever priority (0 Instrumentation → 1 Activation → 2 Retention → 3
Revenue/Paywall → 4 Acquisition → 5 Referral) to the REAL data just pulled, and SHALL produce an
ORDERED list of candidate (product, stage, evidence, action, is-safely-actionable) tuples — not
just a single "exactly one" pick — so that REQ-007's fallback (skip an out-of-scope top candidate,
try the next) has a real list to fall through, rather than nothing. Any signal REQ-005(b)'s NOTE
disqualifies as noise SHALL be excluded from the list entirely (not ranked low — excluded, so it
can never be silently "picked" as a fallback either). This ranking SHALL be recorded (all
candidates, not just the winner) BEFORE the INNER step executes — REQ-006 (SCORE+PICK) and REQ-007
(INNER apply) are sequential, not circular: SCORE+PICK reads only the instrumentation file
(REQ-002's real numbers), never a prior INNER trace. If the resulting list is empty, REQ-010's
NO-OP applies.

## REQ-007 — ONE real INNER cycle: apply → real side effect → traced
WHEN REQ-006 has produced a non-empty ranked candidate list, the system SHALL walk the list in
order and apply the FIRST candidate that is safely actionable (see below), producing a REAL,
externally-observable side effect (e.g. a committed+pushed+deployed content change, NOT a
draft/dry-run/simulation), and SHALL record one trace line stamped `skill:<name> v:<N>
run_id:<uuid>` to the trace log alongside the analytics stream.
"Safely actionable" excludes: App Store Connect submission/pricing/metadata, Stripe Radar/fraud
rules, or any other security/financial-infrastructure configuration (all of those require Dais's
own review per HARD RULE 0.27/0.20's "substantive concern" carve-out — out of scope for this first
cycle). Any candidate excluded this way SHALL be surfaced as a flagged finding for human/team-lead
awareness rather than silently dropped. The applied action SHALL be scoped to something
independently reversible via git revert. If every candidate in REQ-006's list is excluded this way,
the outer cycle SHALL still report the flagged findings and fall to REQ-010's NO-OP for the
action-application step specifically (not a silent skip).

## REQ-008 — ONE real OUTER cycle: grade, synthesize, version-bump, PR (never push main)
WHEN REQ-007's INNER trace exists, the system SHALL: (a) read the trace + the real
before/after-window instrumentation delta (or, at $0-MRR/low-N per the design spec's "early-stage
grader", the relevant LEADING indicator, since MRR-delta is noise at this stage) (b) synthesize at
most a small number of GENERALIZABLE lessons (not "fix this one bug") (c) write/diff a versioned
`SKILL.md` bump reflecting the lesson (d) open a pull request — the system SHALL NOT push directly
to `dev` or `main`. This requirement is REQUIRED for this pass to be considered complete per the
task's own scope ("land Instrumentation + one real INNER/OUTER cycle... verified end to end") — it
is not optional/deferrable busywork; if it cannot be reached with real evidence within this pass,
the pass SHALL be reported as a partial checkpoint (instrumentation + SCORE+PICK done, INNER/OUTER
pending), never silently marked complete without it.

## REQ-009 — Regression guard (design spec Rule 7, carried forward explicitly)
IF a future cycle's version bump is later found to correlate with a WORSE metric than the version
it replaced, THEN the system SHALL revert to the prior skill version rather than stack a further
change on top of a regression. (Not exercisable in THIS pass, which produces only the first-ever
version bump with no prior version to regress from — explicitly acknowledged as deferred to the
second cycle, matching the treatment given to every other narrowed-scope item in this spec.)

## REQ-010 — Weak/absent signal is a valid NO-OP, not a forced action
IF, after REQ-006's SCORE+PICK, no non-noise leading-indicator signal exists to justify an action
(design spec Rule 5 + "Early-stage grader" section) THEN the system SHALL record a NO-OP
outer-cycle result rather than fabricate a lesson or apply a speculative fix. A recorded, evidenced
NO-OP is a valid, successful completion of REQ-008 for that cycle.

## REQ-011 — No-human-review gate via fresh-context adversary, not a human confirm prompt
WHEN the OUTER cycle's diff (skill bump + PR) is ready, the system SHALL be verifiable by a
fresh-context `vcsdd-adversary` review of the diff PLUS a real (not mocked) confirmation of the
INNER action's side effect (e.g. curl the deployed page, confirm the analytics/trace file
contains the real line) — per the design spec's REPLACE item ("swap human-confirm gates for
adversary + browser E2E").

## Non-functional / anti-pattern guards (design spec §"Anti-patterns", Project Vend)
- The system SHALL NOT autonomously discount pricing or make a financial commitment.
- The system SHALL NOT claim a metric improved without an instrumentation-file-backed before/after
  read.
- The system SHALL NOT post to X (design spec explicitly bans X for this loop).
