# PANEL-0 Composio `/link` merge + staging — Sol order

## One atomic only

Merge the manager-accepted corrective PR #333 to `dev`, require an exact-SHA Railway staging deployment, and run non-mutating staging verification. You are the sole executor/verifier. Do not promote to `main`, change environment variables, call Composio, start OAuth, or mutate Telegram/user/provider data. The manager owns the canonical spec and final release verdict. Do not ask for approval or start a broad adversarial-review loop.

## Exact accepted input

- Repository: `/Users/anicca/anicca-project`
- PR: `https://github.com/Daisuke134/anicca-products/pull/333`, base `dev`, head `feature/lm-panel-composio-link`
- Accepted PR head: `50f63a20c80ca84136febd27a0b463519e15386b`
- RED commit: `0c3f3df62f46bfb97a4094b75e119a0b85f48452`
- Accepted current `origin/dev`: `835e28a5b668802899b946d56963b4be3366d980`
- Accepted changed paths: only `apps/life-call/lib/panel-control-center.test.js` and `apps/life-call/lib/user-command.js`
- Corrective evidence: `/Users/anicca/.codex/evidence/panel-0-composio-link-corrective.md`, SHA-256 `98ff6588572a0b1eb3f1424674cb8e8dad7599f0b558679da300cec7187c65a1`
- Railway project/environment/service: `Anicca` / `staging` / `life-call-staging`
- Staging URL: `https://life-call-staging-staging.up.railway.app`
- Existing schema and staging PANEL release are already accepted; no migration is part of this atomic.

Read repository rules, canonical §9.5, §10 row 8d.1, §10.0, §10.2, this order, and the exact PR diff before acting. Never print or persist secrets, tokens, cookies, uid/chat id, email, account IDs, or user data.

## Pre-merge gate

1. Fetch and prove PR #333 remains OPEN, non-draft, base=`dev`, head OID exact accepted head, MERGEABLE/CLEAN, and all required checks successful.
2. Prove the PR diff still contains exactly the two accepted paths and `git diff --check` is clean.
3. If `origin/dev` moved, inspect only the delta. If it touches PANEL runtime/tests or creates a conflict, rebase/update the dedicated PR branch, rerun all verification, push, and wait for checks. If unrelated and GitHub remains CLEAN, continue without branch churn.
4. From the exact accepted head, freshly run:
   - `node --test lib/panel-control-center.test.js`;
   - the repository-defined focused PANEL suites;
   - full `npm test`;
   - `npm run eval`;
   - `node scripts/smoke-panel-api-fixture.js`;
   - `node scripts/smoke-panel-ui-fixture.js`.
5. Require the contract: only `POST /api/v3/connected_accounts/link`; body `{auth_config_id,user_id,callback_url}`; provider `redirect_url` returned unchanged; failures closed with no legacy retry; tenant-scoped one-time state remains passing; `panel-api.js` remains byte-identical to the base.

## Merge and exact staging deployment

1. Merge PR #333 to `dev` with a normal GitHub merge commit. Do not squash/rebase, delete the branch, admin-bypass checks, or merge another PR.
2. Fetch and record the new exact `origin/dev` SHA. Prove PR #333 is MERGED and its merge commit is ancestor/equal to `origin/dev`.
3. Poll both Railway service status and deployment list. Require `life-call-staging` SUCCESS with `meta.commitHash` exactly equal to the new `origin/dev` SHA. An older healthy deployment is not acceptance.
4. If no exact auto-deployment appears within 10 minutes, use the established `railway up` fallback from a clean checkout of the exact merged `origin/dev`, staging only. Still require SUCCESS and exact-source proof. Never deploy production.

## Non-mutating staging verification

Against the staging URL, record sanitized status/header/body markers only:

- `/health` -> HTTP 200 and `ok=true`;
- repository staging smoke script -> exit 0;
- `/panel` unauthenticated -> HTTP 200 login/expired-link UI, `cache-control: no-store`, not `Forbidden`;
- `/panel?t=invalid` -> HTTP 403 honest expired-link UI;
- `/api/panel/control-center` and `/api/panel/timeline` unauthenticated -> HTTP 401 `unauthorized`;
- harmless unauthenticated command POST -> HTTP 401 before validation, with aggregate receipt/preference counts unchanged;
- fresh exact-source tests/evals/smokes from a clean checkout of merged `origin/dev` remain green.

Staging lacks production Telegram/Composio credentials. Do not attempt authenticated login, OAuth, provider connection, real settings toggle, or any external side effect here.

## Delivery

Persist a sanitized report at `/Users/anicca/.codex/evidence/panel-0-composio-link-staging.md` mode 0600 and print only its SHA-256. Include exact accepted/head/merge/dev SHAs, PR state/checks, all fresh test totals, Railway deployment ID/status/commit, each staging HTTP result, aggregate before/after counts, and zero-side-effect ledger: production deploy=0, provider API/OAuth=0, environment=0, TG/email/phone/wallet/calendar/user-preference=0.

Do not edit product code or canonical spec in this release atomic. Stop only for an unsafe/destructive repair or three independent failures of the same atomic. A normal deployment delay, one CLI error, or stale deployment is not a wait point: diagnose safely and continue.
