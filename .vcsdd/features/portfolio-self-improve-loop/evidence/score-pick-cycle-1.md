# SCORE+PICK — Cycle 1 (REQ-006)

Real instrumentation, pulled live 2026-07-03T23:11Z:
- `anicca-ios` (RevenueCat): `active_trials=0`, `active_subscriptions=4`, `mrr=$17`,
  `revenue(28d)=$0`, `new_customers(28d)=269`, `active_users(28d)=314`.
- `lm-stripe-5usd` (Stripe, real live payment link `plink_1TgOluEeDsUAcaLSqXWXjUz7`,
  30-day window): `total_checkout_sessions=112`, `paid_sessions=0`,
  `success_rate=0.0`.

## Candidate list (funnel-lever priority: 0 Instrumentation → 1 Activation → 2 Retention → 3 Revenue/Paywall → 4 Acquisition → 5 Referral)

| # | Product | Stage | Evidence | Candidate action | Safely actionable? |
|---|---|---|---|---|---|
| 1 | `lm-stripe-5usd` | 3 Revenue/Paywall | 112/112 checkout sessions unpaid over 30d, **0% success** | Investigate/rotate the payment link or tighten Stripe Radar | **EXCLUDED as noise** — see below |
| 2 | `anicca-ios` | 1 Activation | `active_trials=0` while a 3-day trial IS configured (Annual/Weekly packages of the current live offering `anicca_variant_b`) and 269 new customers arrived in 28d | Investigate whether the current paywall/offering is actually presenting the trial-eligible packages, or whether trial starts are silently failing to register | **Flagged — needs deeper investigation before a safe INNER action can be chosen; see below** |
| 3 | `anicca-ios` | 1 Activation | `active_users(314) / new_customers(269)` over the same 28d window is a plausible, but unverified without Mixpanel, onboarding-completion signal | (would need Mixpanel onboarding funnel data, not yet pulled this pass) | Deferred — out of scope for this pass's 2-product instrumentation |

### Why candidate #1 is excluded (REQ-005(b)'s NOTE, REQ-006)
All 10 charges independently sampled during spec-writing showed `outcome.type=blocked`,
`outcome.reason=highest_risk_level`, `network_status=not_sent_to_network` — Stripe's own
fraud engine rejecting these BEFORE they reach a card network, from many different
countries and card-funding types. This is a card-testing/fraud pattern, not genuine
customer friction. Per design spec Rule 5 (weak/conflicting signal = NO-OP) and Rule 6
(weighted evidence — a Radar block is not a UX signal), this is NOT scored as an
Revenue/Paywall funnel bug. It IS, however, a genuinely serious finding in its own right
(a live, active payment link with a 100% attack rate and zero legitimate throughput for
at least 30 days) — flagged for Dais/team-lead awareness, not silently dropped, and NOT
something this pass will act on autonomously: any real fix here (rotating the link,
tightening Radar rules, investigating whether genuine customers are also being
collaterally blocked) touches live financial/security infrastructure directly, which is
out of scope for an autonomous first cycle per REQ-007's own exclusion list.

### Why candidate #2 (0 active trials) is flagged rather than auto-actioned this cycle
A genuine investigation is needed before choosing a specific INNER action: is the
`anicca_variant_b` offering's paywall actually surfacing the Annual/Weekly packages (the
ones with `trial_duration: P3D`) to new users, or are most conversions landing on the
no-trial Monthly/Lifetime packages? Answering this requires reading the live paywall
config/App Store Connect screenshots or RevenueCat's paywall data, which this pass's
2-product instrumentation slice doesn't yet pull. Applying a blind "fix" (e.g. editing
paywall copy) without first confirming WHICH package the paywall actually presents risks
either a no-op change or, worse, a regression on the app's live monetization surface —
exactly the kind of "vanity action" the design spec's Anti-patterns section (Project
Vend) warns against ("unverified done").

## Outcome for Cycle 1 (REQ-010(b): SIGNAL-BLOCKED NO-OP)
Both real candidates found this cycle are excluded from autonomous action for this
pass — #1 because the underlying evidence is noise (fraud, not a funnel bug) and
partly because a real fix would touch financial/security infra out of scope; #2 because
it requires additional real investigation (paywall/RevenueCat offering-assignment data)
before ANY specific action can be chosen safely and honestly. Per REQ-010(b), this is
recorded as a NO-OP for the action-application step, WITH both flagged findings
preserved here (not silently dropped) for human/team-lead review and as the starting
point for Cycle 2's investigation once that additional data is available.
