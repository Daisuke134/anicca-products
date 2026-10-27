# Marketing funnel UTM attribution

## Goal and scope

Complete reassignment item 2: preserve the existing first-party funnel, add source/medium/campaign and `ct` attribution to the existing event aggregate, retain the `/go` click receipt, and run one clearly labeled test event. The canonical funnel event order from Sanbo is `onboarding_completed → paywall_shown → trial_started → purchase_completed`. Keep work on a dedicated branch from `origin/main`; do not change Capafy v1.0.3 upsell ownership or its copy.

## Evidence and implementation choice

- Google Analytics Help, [URL builder: Collect campaign data with custom URLs](https://support.google.com/analytics/answer/10917952?hl=ja), defines `utm_source` as the referrer, `utm_medium` as the marketing medium, and `utm_campaign` as the campaign. It says these URL parameters are sent to Analytics and shown in acquisition reports.
- Apple, [Campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/), says the campaign token `ct` identifies an individual campaign. Keep the existing App Store `ct` handoff.
- Sanbo's current reassignment message confirms the four canonical event names, existing Mixpanel/PostHog destinations, and a single staging or production test event with `ct=test_codex_1027`. Source inspection confirms Mixpanel receives the in-app funnel events; PostHog is the A/B event layer, and no PostHog funnel readback was verified.
- Existing source already has the named funnel events in `apps/landing/lib/site-hit.ts`, path attribution in `site-hit-store.js`, and a `/go` receipt written before redirect with fixed App Store `ct` or web UTM destinations. Preserve those contracts and avoid inventing new event names.
- The referenced `docs/team/metrics/PRODUCT-METRICS.md` and Sanbo `e2e.py` were absent from the checked repos; Sanbo has now directed creation of that metrics document. Keep the existing `/go` click receipt schema.

## Confirmed initial gap

The browser helper reads and sends `utm_source`, `utm_campaign`, `ref`, and `ct`, but not `utm_medium`. The event aggregator increments only global event counts, so the UTM and `ct` values sent with funnel actions are discarded. It also rejects the four canonical funnel event names. Pageviews aggregate source and campaign but not medium. `/go` already persists `marketing_click_receipts` before returning its redirect and its tests cover App Store `ct`, web UTM, storage failure, and privacy exclusions.

## Ordered work

- [x] Add failing tests for the four canonical event names, `ct` plus UTM attribution, and event aggregate readback while retaining legacy global totals.
- [x] Add the four events to the existing allowlist; carry `utm_medium`; add bounded event attribution aggregates for source/medium/campaign/`ct` while retaining legacy global totals.
- [x] Run focused client/store and `/go` receipt tests: 11/11 and 13/13 pass.
- [ ] Open the code PR; verify the exact PR head and CI.
- [ ] After the source is available in staging or production, send exactly one synthetic `paywall_shown` event with `ct=test_codex_1027`. Verify that the event and `ct` appear in the existing aggregate; label it as a test, not a sale or real campaign result.

## Completion

PR contains the four canonical funnel events with UTM/`ct` attribution, preserves `/go` click receipts and destinations, focused tests pass, and one synthetic `paywall_shown` event with `ct=test_codex_1027` is read back from the existing aggregate. No revenue, purchase, or conversion is inferred from the test event.

## Status

2026-10-27 12:42 JST: Source and focused tests are in the dedicated worktree. In-app events remain Mixpanel telemetry; the separate web `site-hit` aggregate captures campaign dimensions and does not create a verified user-level join to app installs or RevenueCat. The metrics SSOT is in Life Manager docs PR #9035. No live event has been sent yet.
