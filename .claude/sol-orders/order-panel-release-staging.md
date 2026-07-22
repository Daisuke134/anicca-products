# PANEL-0 schema + dev merge + staging smoke — Sol order

## One atomic only

Release the already reviewed standalone PANEL-0 PR #332 through the shared Supabase schema gate and the Railway `staging` environment. This order ends after an exact staging deployment and non-mutating staging smoke. Do not promote `dev` to `main` and do not run production authenticated PANEL L3 yet.

You are the sole builder/executor/verifier. The manager owns the canonical spec and final release decision. Do not ask for approval; all actions below are already authorized. Do not start another adversarial-review loop.

## Exact accepted input

- Repository: `/Users/anicca/anicca-project`
- Release worktree: `/Users/anicca/anicca-project/.worktrees/lm-panel-release`
- Branch: `feature/lm-panel-release`
- Accepted release HEAD/upstream/remote/PR head: `44d9cdf270a8293e42907c7c9f59331f7002d671`
- PR: `https://github.com/Daisuke134/anicca-products/pull/332`, base `dev`
- RED: `0dfa240988eb2fa44052674826b80ff7bdaac945`
- GREEN: `d8c497e87e65d47997809f43b025a89dfe043559`
- Supabase project: `cycgdwndgfgdbnndithc` (shared by staging and production)
- Migration order:
  1. `apps/life-call/migrations/2026-07-21-lm-panel-control-center.sql`
  2. `apps/life-call/migrations/2026-07-22-lm-panel-durable-sessions.sql`
  3. `NOTIFY pgrst, 'reload schema';`
- Railway project: `Anicca`; environment `staging`; service `life-call-staging`
- Staging URL: `https://life-call-staging-staging.up.railway.app`
- Expected migration SHA-256: control-center=`da763c54f19997015fbeda24415d70a2f77c71c8879f51537c39b206da0d8462`; durable-sessions=`7a812686cf9dfeadaa356c64ec280799df91536c8f032ac8209d1009edb5838e`
- Read-only manager preflight: target tables/functions absent, `lm_panel_sessions` has the legacy 5 columns with RLS on and aggregate row count `4`; current staging deployment `4072f42f-e320-4b34-a481-eab754a3a519` is SUCCESS at exact current `dev=5a4ec98e...`.

Read repository rules, canonical §9.5, §10 row 8d.1, §10.0, §10.2, and the two migration files before acting. Never print or persist secret values.

## Non-negotiable safety

1. Fetch and prove PR #332 is OPEN, non-draft, MERGEABLE/CLEAN, all checks successful, `headRefOid=44d9cdf...`, base=`dev`, and no CORE 8d / daily-preflight / canonical-spec path is in its diff.
2. If `origin/dev` moved after the accepted base, inspect the delta. If it touches PANEL runtime or migrations, update the release branch, rerun delegation 5/5 + focused PANEL 67/67 + full `npm test`, push, and wait for checks. If it is unrelated and GitHub reports CLEAN, do not churn the branch.
3. Schema preflight is read-only and reports only object names, signatures, grants, and aggregate session counts—never uid/chat/token/hash rows.
4. Apply schema before merging code. The two SQL files are the source of truth; do not hand-edit their semantics in an ad-hoc query.
5. Prefer one Management API transaction: `BEGIN;` + migration 1 + migration 2 + `NOTIFY pgrst, 'reload schema'; COMMIT;`. If the exact objects already exist, prove their shape/grants and treat the migration as idempotently satisfied. If a same-name object has an incompatible shape requiring destructive repair, stop before merge and report the exact schema mismatch without changing it.
6. Expected session effect: migration 2 marks legacy rows with `idle_expires_at IS NULL` revoked for the new runtime. Record aggregate before/after counts. Do not expose or delete session rows.
7. No provider mutation, OAuth, Telegram, email, call, wallet, calendar, or user-preference command in this order.

## Supabase execution path

1. Detect credentials without displaying them. Prefer `SUPABASE_ACCESS_TOKEN` and the Management API endpoint `POST https://api.supabase.com/v1/projects/cycgdwndgfgdbnndithc/database/query`. The read-only release-ops check found the token in `~/.openclaw/.env`; load only that named value without echoing it and keep it out of argv/logs (for example use `curl --config -`).
2. If that named credential is unexpectedly absent/invalid, use the existing authenticated browser through CloakBrowser/CDP `:9222` and the project SQL editor. Reuse the logged-in Google session if needed; use the repository `tier-a-bypass` skill only if an OAuth/CAPTCHA/2FA gate appears. Do not ask the user.
3. A browser fallback must execute the same transaction text derived verbatim from the two migration files, not a rewritten SQL summary. Capture a screenshot/path plus the SQL editor success response, with secrets and row data absent.
4. After apply, verify through Management API or SQL editor:
   - `lm_panel_preferences`, `lm_panel_command_receipts`, `lm_panel_oauth_states` exist and RLS is enabled;
   - `lm_panel_sessions` has `family_id`, `idle_expires_at`, `absolute_expires_at`, `rotated_at`, `revoked_at`, `pending_child_hash`, `pending_child_seed`, `rotation_grace_until`;
   - exact callable functions exist: `claim_lm_panel_oauth_state(text,text,text)`, `resolve_lm_panel_session(text,text,text)`, `revoke_lm_panel_session(text)`, `revoke_lm_panel_sessions_for_tenant(text,text)`, `mutate_lm_panel_preferences(text,text,jsonb)`, `mutate_lm_panel_user(text,text,jsonb)`;
   - obsolete `resolve_lm_panel_session(text,text)` is absent;
   - PUBLIC/anon/authenticated execute is false and service_role execute is true for the protected functions;
   - service-role PostgREST requests to the three new tables with `limit=0` return HTTP 200 after schema reload.

Do not merge PR #332 unless every post-migration check above passes.

## Merge and staging deployment

1. Merge PR #332 to `dev` with a normal GitHub merge commit. Do not use squash/rebase, do not merge PR #330/#331, do not delete the release branch, and do not use admin bypass unless GitHub unexpectedly requires it after all required checks are successful.
2. Fetch and record the exact new `origin/dev` merge SHA. Prove PR #332 is MERGED and its merge commit is an ancestor/equal of `origin/dev`.
3. Railway currently auto-deploys `life-call-staging` from branch `dev`. Poll with both:
   - `railway service status --service life-call-staging --environment staging --json`
   - `railway deployment list --service life-call-staging --environment staging --json`
   Require a SUCCESS deployment whose `meta.commitHash` equals the exact merged `origin/dev` SHA.
4. If no exact auto-deployment appears within 10 minutes, use the established fallback from a clean checkout of the merged `origin/dev`:
   `railway up --path-as-root /Users/anicca/anicca-project -e staging -s life-call-staging`
   Never deploy production. After fallback, still require SUCCESS and prove the deployed source is the merged PANEL code by deployment metadata/logs plus endpoint behavior.

## Non-mutating staging smoke

Run against `https://life-call-staging-staging.up.railway.app` and record status/body markers/headers without cookies or secrets:

- `GET /health` -> HTTP 200 and JSON `ok=true`;
- `scripts/lm-staging-smoke.sh <url>` -> exit 0;
- unauthenticated `GET /panel` -> HTTP 200 login/expired-link page, never `Forbidden`, with `cache-control: no-store`;
- invalid bootstrap `GET /panel?t=invalid` -> HTTP 403 honest expired-link page;
- unauthenticated `GET /api/panel/control-center` -> HTTP 401 JSON `unauthorized`;
- unauthenticated `GET /api/panel/timeline` -> HTTP 401 JSON `unauthorized`;
- unauthenticated `POST /api/panel/commands` with a harmless delegation-shaped body -> HTTP 401 before validation, and no DB receipt/preference mutation; prove aggregate command-receipt/preference counts are unchanged across this request.

Staging intentionally lacks Telegram and Composio credentials, so do not attempt authenticated TG login, OAuth, provider connection, or real toggle here. That is not a failure; production L3 is the next atomic.

## Final evidence/report

Do not edit product code or the canonical spec. Do not open a new review PR. Leave all worktrees clean. Final report and persistent log must include:

- schema preflight/apply/postflight method and sanitized result;
- before/after aggregate legacy-session counts and exact applied migration hashes;
- PR #332 merged state and merge SHA;
- `origin/dev` SHA;
- Railway deployment ID/status/commit hash;
- every staging smoke command/status/body marker;
- command-receipt/preferences count before/after the unauthenticated POST;
- confirmation that production promotion and authenticated/provider/TG/email/call/wallet/calendar side effects are 0;
- next gate: manager final check, then `dev -> main` promotion and controlled production PANEL L3.

## Stop

Stop only if schema repair would require destructive/incompatible mutation, if credentials remain unavailable after Management API + authenticated browser + tier-a safe fallback, or after three independent methods fail the same atomic. A moving branch, normal CLI issue, deploy delay, or one failed smoke is not a wait point: diagnose, retry safely, and continue. Never ask for approval.
