# SCORE+PICK — Cycle 1 (REQ-006)

Real instrumentation, pulled live 2026-07-03T23:23-24Z (re-pulled after Phase 3 adversary
review added real charge-outcome enrichment — see FIND-002 note below):
- `anicca-ios` (RevenueCat): `active_trials=0`, `active_subscriptions=4`, `mrr=$17`,
  `revenue(28d)=$0`, `new_customers(28d)=269`, `active_users(28d)=314`.
- `lm-stripe-5usd` (Stripe, real live payment link `plink_1TgOluEeDsUAcaLSqXWXjUz7`,
  30-day window): `total_checkout_sessions=112`, `paid_sessions=0`, `success_rate=0.0`,
  `charge_outcome_types={"blocked": 8}`, `charge_outcome_reasons={"highest_risk_level": 8}`,
  `charge_failure_codes={"card_declined": 8}` (out of 50 sampled checkout sessions with a
  resolvable payment_intent, ALL 8 that reached a real charge attempt were Stripe-Radar-
  blocked as highest fraud risk — this is now durably captured in the instrumentation file
  itself, not just prose; see `~/.smtm/analytics/lm-stripe-5usd.jsonl`).

## Candidate list (funnel-lever priority: 0 Instrumentation → 1 Activation → 2 Retention → 3 Revenue/Paywall → 4 Acquisition → 5 Referral)

| # | Product | Stage | Evidence | Candidate action | Safely actionable? |
|---|---|---|---|---|---|
| 1 | `lm-stripe-5usd` | 3 Revenue/Paywall | 112/112 checkout sessions unpaid over 30d, **0% success** | Investigate/rotate the payment link or tighten Stripe Radar | **EXCLUDED as noise** — see below |
| 2 | `anicca-ios` | 1 Activation | `active_trials=0` while a 3-day trial IS configured (Annual/Weekly packages of the current live offering `anicca_variant_b`) and 269 new customers arrived in 28d | Investigate whether the current paywall/offering is actually presenting the trial-eligible packages, or whether trial starts are silently failing to register | **Flagged — needs deeper investigation before a safe INNER action can be chosen; see below** |
| 3 | `anicca-ios` | 1 Activation | `active_users(314) / new_customers(269)` over the same 28d window is a plausible, but unverified without Mixpanel, onboarding-completion signal | (would need Mixpanel onboarding funnel data, not yet pulled this pass) | Deferred — out of scope for this pass's 2-product instrumentation |

### Why candidate #1 is excluded (REQ-005(b)'s NOTE, REQ-006)
This claim is now grounded in the instrumentation file itself, not just prose (Phase 3
adversary review FIND-002 fix): `pull_stripe.py` fetches the real charge for every
checkout session that reached a payment attempt. Of 50 sessions sampled this run, 8 had
a resolvable charge, and ALL 8 show `outcome.type=blocked`, `outcome.reason=
highest_risk_level`, `failure_code=card_declined` — Stripe's own fraud engine rejecting
these before they reach a card network. (An earlier ad-hoc manual sample taken during
spec-writing, across multiple different countries and card-funding types, showed the
same pattern; that sample is no longer the evidence of record — this file's own
`charge_outcome_types`/`charge_outcome_reasons` fields are.) This is a card-testing/
fraud pattern, not genuine customer friction. Per design spec Rule 5 (weak/conflicting
signal = NO-OP) and Rule 6 (weighted evidence — a Radar block is not a UX signal), this
is NOT scored as a Revenue/Paywall funnel bug. It IS, however, a genuinely serious
finding in its own right (a live, active payment link with a 100% attack rate and zero
legitimate throughput for
at least 30 days) — flagged for Dais/team-lead awareness, not silently dropped, and NOT
something this pass will act on autonomously: any real fix here (rotating the link,
tightening Radar rules, investigating whether genuine customers are also being
collaterally blocked) touches live financial/security infrastructure directly, which is
out of scope for an autonomous first cycle per REQ-007's own exclusion list.

### Why candidate #2 (0 active trials) is flagged rather than auto-actioned this cycle
**UPDATE (real investigation completed, RevenueCat Charts API, 2026-07-03 post-checkpoint)**:
this candidate is CONFIRMED severely broken, not merely anomalous, and is now the
clearest highest-leverage broken funnel stage found this cycle:
  - Paywall config IS correct: the current live offering's paywall (`pw528706a38fc841ca`,
    `anicca_variant_b`) only references `rc_annual`/`rc_weekly` package identifiers —
    i.e. it DOES surface exactly the trial-eligible packages, not the no-trial
    Monthly/Lifetime ones. This rules out "wrong packages shown" as the cause.
  - `trials_new` chart (2026-06-04 to 2026-07-03, real RevenueCat data): **0 new trials
    started in the entire 30-day window.**
  - `initial_conversion` chart (7-day cohort window, 2026-06-01 to 2026-07-03, real data):
    **268 new customers, 0 initial conversions (trial OR direct purchase) within 7 days —
    a literal 0% conversion rate.**
  - No experiment is running (`list-experiments status=running` returned empty) — this
    isn't an A/B test artifact.
This is a genuinely severe Revenue/Paywall-stage failure: essentially no one converts at
all despite real installs, and the paywall's own configuration looks correct — meaning
the root cause is most likely upstream of the paywall's package config (e.g. the paywall
failing to display/load at all for most users, a StoreKit/purchase-flow bug in the
shipped app build, or an offering-assignment mismatch between what RevenueCat's dashboard
shows as "current" and what the live app actually requests). Diagnosing which of these it
is requires inspecting the live iOS app's paywall-presentation code or a real
device/simulator run — beyond a config-level fix, and beyond this pass's "read-only on
Stripe/billing, one small INNER action" scope. Recommending this as the target for the
NEXT cycle's INNER action (a real code investigation + fix), not something to guess at
now. Applying a blind "fix" without confirming the actual failure point would risk
exactly the "vanity action"/"unverified done" anti-pattern the design spec's Anti-patterns
section (Project Vend) warns against.

**Follow-up code trace (read-only, `aniccaios/` source, same session):**
- `Services/SubscriptionManager.swift:140-151` (`refreshOfferings()`) correctly calls
  RevenueCat's `getOfferings()` and uses `result.current` -- it does NOT hardcode a
  stale offering identifier. This rules out "app requests the wrong offering" as the
  cause; the code asks RevenueCat for whatever IS marked current server-side.
- `Onboarding/PaywallVariantBView.swift:59-79`: when `packages.isEmpty` (i.e. offerings
  failed to load, or loaded with zero packages), the view shows a spinner, then after a
  timeout a "paywall_b_load_failed" message + retry/restore buttons -- it does NOT
  silently skip the paywall or let the user through for free. So if THIS is the failure
  mode, it should present as users getting VISIBLY STUCK on a loading/retry screen, not
  a silent bypass -- plausible given 0% conversion, but not yet confirmed live.
- The repo already has a Maestro E2E flow for exactly this: `aniccaios/maestro/v1.8.0/
  04-paywall_variant_b_en.yaml` (+ variant_a and ja/es locale versions). This is the
  concrete, scoped next step to CONFIRM (not guess) the failure mode: run that flow on
  a real simulator and observe whether the paywall actually loads packages, hangs on
  the empty-state spinner, or something else entirely. This was not run in this pass
  (would require Xcode/simulator setup beyond this pass's investigation scope) --
  recorded here as the concrete, ready-to-execute next step for whoever picks this up.

## Outcome for Cycle 1 (REQ-010(b): SIGNAL-BLOCKED NO-OP)
Both real candidates found this cycle are excluded from autonomous action for this
pass — #1 because the underlying evidence is noise (fraud, not a funnel bug) and
partly because a real fix would touch financial/security infra out of scope; #2 because
it requires additional real investigation (paywall/RevenueCat offering-assignment data)
before ANY specific action can be chosen safely and honestly. Per REQ-010(b), this is
recorded as a NO-OP for the action-application step, WITH both flagged findings
preserved here (not silently dropped) for human/team-lead review and as the starting
point for Cycle 2's investigation once that additional data is available.
