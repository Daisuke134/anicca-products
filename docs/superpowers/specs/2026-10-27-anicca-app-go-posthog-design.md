# Anicca App Store redirect and PostHog event

Status: implementation complete; exact-head CI and production readback pending. Owner: Codex.

## Goal

Make `GET /go/anicca?ct=X` record one anonymous `app_store_click` event in the existing PostHog project before redirecting to the Anicca App Store page. Preserve the supplied `ct` and configured `pt`, and keep `mt=8`.

## Contract

| Input | Result |
|---|---|
| `GET /go/anicca?ct=X` with a non-empty `ct` | POST an anonymous PostHog `app_store_click` event containing `ct`, then return `302` to app `6755129214` with the configured provider token, the same `ct`, and `mt=8`. |
| Missing or blank `ct` | Return `400`; do not capture or redirect. |
| PostHog capture fails or is non-2xx | Return `503`; do not redirect without the requested event. |
| Existing `/go/{campaign-token}` route | Preserve its receipt and redirect behavior. |

The event uses a random anonymous `distinct_id` and `$process_person_profile: false`; it does not identify an app user. The test uses one synthetic campaign value, does not follow the redirect, and does not initiate an install or purchase.

The PostHog project token comes from the existing iOS project configuration, with a deployment environment override. It is not logged or included in event properties.

## Evidence and design sources

- PostHog, [Capture and batch API endpoints](https://posthog.com/docs/api/capture): “Every event request must contain an `api_key`, `distinct_id`, and `event` field.” The US capture endpoint is `/i/v0/e/`; anonymous capture uses a random ID and `$process_person_profile: false`.
- Apple, [Campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/): campaign links use `ct` for campaign, `pt` for provider, and `mt` for media type.
- Existing Anicca `/app` route contract: `apps/landing/test/anicca-app-store-routing.test.mjs` asserts app ID `6755129214`, provider token `93486075`, and `mt=8`.

## Execution checklist

1. [x] Add a focused failing test for app slug, `ct`/`pt` preservation, PostHog event properties, ordering, and capture failure; RED confirmed with the existing 404.
2. [x] Implement the handler extension while preserving existing token-based routes.
3. [x] Focused `marketing-go.test.js` passes 19/19 and `git diff --check` passes. The broader telemetry script is blocked by an absent local `stripe` dependency in unrelated Factory tests.
4. Push a PR, wait for exact-head CI, merge through GitHub, and verify the deployed redirect plus one PostHog event carrying the synthetic `ct`.
