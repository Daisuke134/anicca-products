# PANEL-0 production promotion + controlled L3 — Sol order

## One atomic

Promote the already reviewed PANEL-0 release from `dev` to `main`, require an exact-SHA Railway production deployment, then run the controlled authenticated production L3 for Dais's own Life Manager panel. You are the sole executor/verifier. The manager owns the canonical spec and final verdict. Do not ask for approval and do not start another broad adversarial-review loop.

## Accepted input

- Repository: `/Users/anicca/anicca-project`
- Accepted `origin/dev`: `835e28a5b668802899b946d56963b4be3366d980`
- Accepted `origin/main`: `d4efde694a0ad2fd323348a61aa16c005cccba21`
- PR #332: MERGED to `dev`; merge SHA `835e28a5b668802899b946d56963b4be3366d980`
- Staging deployment: `6fa417c6-3d0d-4ff0-93ca-48dca1788b0e`, SUCCESS at the exact accepted `dev` SHA
- Staging/schema evidence: `/Users/anicca/.codex/evidence/panel-0-staging-release.md`, SHA-256 `962f43f375625c63c2757420f87219647a3d8d57c49e53c7c2882922be71038d`
- Railway production: project `Anicca`, environment `production`, service `life-call`; it tracks `main` and uses root `apps/life-call`
- Production URL: derive from Railway service metadata; never guess or print secret query parameters
- Supabase project: `cycgdwndgfgdbnndithc`; shared schema is already applied
- Canonical spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`, especially §9.5, §9.9, §10 row 8d.1, §10.0, §10.2
- Telegram user tool: `/Users/anicca/.cache/telegram-user-venv/bin/python /Users/anicca/anicca/skills/tools/telegram-user/tg_user.py`; its config is mode 0600. Use only Dais's own Life Manager bot dialog.

Before mutation, fetch and prove these accepted refs still match. Read the repository rules and relevant source/tests. Never print or persist a token, cookie, secret, raw uid/chat id, email address, connected-account id, or another user's data.

## Release topology gate

1. Prove `main..dev` contains no unfinished CORE 8d runtime and no open PR #330/#331/#322 head. The accepted audit found 54 PANEL paths plus one runtime-inert writer-loop document only. If new runtime code appeared, stop before merge and report the exact path delta.
2. Create a normal GitHub PR from `dev` to `main`, wait for required checks, and merge normally. Do not squash/rebase, delete `dev`, admin-bypass checks, or merge PR #330/#331/#322.
3. Fetch and record the exact merge SHA now at `origin/main`.
4. Poll Railway using both service status and deployment list. Require `life-call` production deployment `SUCCESS` with `meta.commitHash` exactly equal to the new `origin/main` SHA. A healthy old deployment is not acceptance.
5. Fresh unauthenticated smoke: `/health` HTTP 200 `ok=true`; `/panel` is HTTP 200 login/expired-link UI with `cache-control: no-store`, never `Forbidden`; invalid bootstrap token is HTTP 403; protected APIs are HTTP 401; unauthenticated command POST is HTTP 401 and changes aggregate receipt/preference counts by 0.

## Production config gate

1. Production currently has `COMPOSIO_API_KEY` but lacks `COMPOSIO_GCAL_AUTH_CONFIG`. Copy the existing enabled Google Calendar OAuth2 auth-config from the Netlify `anicca2` production environment to Railway production secret-to-secret without showing its value. Before setting it, use the Composio v3 API read-only to prove toolkit=`googlecalendar`, auth scheme=`OAUTH2`, disabled=false, and exactly one ACTIVE connected account is owned by Dais's scoped LM user. Do not create a new config.
2. If setting the variable triggers a second Railway deployment, require SUCCESS and the same exact production source SHA before authenticated L3.
3. Do not rotate or print Supabase, Telegram, Composio, Telnyx, Gemini, Resend, or session secrets. Do not change provider ownership.

## Controlled authenticated L3

Use an isolated persistent browser profile/session so normal user tabs are untouched. Snapshot before each interaction and after every page-changing action. Do not capture a HAR.

1. With the Telethon venv, send `/panel` once in Dais's existing Life Manager bot chat. Store only sanitized message-id hashes. Poll the following bot response with a bounded timeout. Keep the bootstrap URL/token in process memory or a mode-0600 temporary file only; logs may contain only the production host and path `/panel`.
2. Open the single-use URL in the isolated persistent browser. After exchange, prove final HTTP 200 path=`/panel`, query empty, bootstrap token absent, HttpOnly session present, and the rendered dashboard/control-center data is personalized to the same scoped Dais tenant. Compare only hashes/booleans/aggregate counts—no PII.
3. Bookmark/directly retain the clean `/panel` URL, fully close that isolated browser process, reopen the same persistent profile, and visit `/panel` directly. Require authenticated HTTP 200 without a new TG link.
4. Prove desktop and mobile viewports expose clickable controls and no dead connection/settings card. Click only safe read-only instructions plus the harmless notification toggle below; do not click phone, email, wallet, calendar-disconnect, delegation, physical, mental, or financial actions.
5. Preserve the initial `notifications_enabled` value. Through the real panel click, invert it once; prove authenticated control-center API and scoped DB readback show the new value and another tenant's aggregate/state is unchanged. In the same Dais TG chat, send the exact inverse notification intent, receive the bot acknowledgment, reload the panel, and prove it reflects the chat mutation. Then restore the original value through TG and prove panel/API/DB all equal the original. Record receipts and message IDs only as hashes.
6. The current bot message for a setting mutation is generic `Setting updated`; do not falsely call it a value-bearing chat readback. Report TG acknowledgment plus panel/API/DB state proof separately. Do not change §9.11/public copy in this order.
7. Prove tenant isolation with production-safe evidence. Never inspect or mutate another real user's PII. If a pre-existing dedicated test Telegram identity and test Google identity are demonstrably available, use only those. Otherwise run the exact production tenant-isolation contract against the deployed source plus aggregate cross-tenant mutation count=0, and honestly mark real second-identity L3 as not executed; do not admin-insert a synthetic session merely to create a green claim.
8. Calendar: Dais already has exactly one owned ACTIVE connection. Prove the personalized panel reports it without disconnecting/deleting it. Execute OAuth start+callback only with a pre-existing dedicated test Google identity and test tenant. If no such identity is available, record owner/status readback PASS and fresh callback not executed; do not disturb Dais's active account and do not create an external identity.
9. Every unsupported connector/control must render honest `unavailable` and perform zero mutation.
10. Logout/revoke is not required on Dais's persistent panel session because the acceptance criterion is permanence. Leave the session usable; delete only temporary bootstrap material.

## Verification and evidence

Run fresh focused PANEL tests, full `npm test`, `npm run eval`, and production source smoke from a clean exact checkout of the promoted source. Persist a sanitized report outside the repo at `/Users/anicca/.codex/evidence/panel-0-production-l3.md` mode 0600 and print only its SHA-256. Include:

- promotion PR URL/number, merged state, merge SHA, exact `origin/main`;
- Railway deployment ID/status/commit hash and any config-triggered replacement deployment;
- all unauthenticated HTTP statuses and before/after aggregate counts;
- TG request/reply message-id hashes, never the URL/token;
- first login and browser-restart stable `/panel` results;
- personalized/desktop/mobile/clickability assertions;
- toggle baseline→panel mutation→TG mutation→restored baseline evidence;
- owned Calendar ACTIVE readback and exact OAuth callback disposition;
- tenant-isolation evidence and exact second-identity disposition;
- focused/full/eval/smoke totals;
- explicit side-effect ledger: TG to Dais only; notification preference restored; email=0, phone=0, wallet=0, calendar mutation=0, third-party broadcast=0.

Do not edit the canonical spec. Do not edit product code in this release order. If production exposes a product defect, preserve the exact sanitized reproducer and stop this atomic before claiming L3 PASS; the manager will issue one narrow TDD corrective order.

## Stop

Stop only for a destructive schema/config repair, a required new external identity, an unauthorized broadcast/charge/provider disconnect, or after three independent methods fail the same atomic. A normal deployment delay, expired bootstrap link, CLI hiccup, or one browser failure is not a wait point: diagnose, use a fresh single-use link/profile as needed, and continue without asking for approval.
