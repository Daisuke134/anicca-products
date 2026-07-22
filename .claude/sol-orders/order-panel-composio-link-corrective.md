# PANEL-0 Composio `/link` corrective — Sol order

## One atomic only

Fix the production Calendar OAuth start path for Composio's enforced managed-OAuth `/link` contract. Build with TDD, review only this product contract, verify, commit/push, and open a PR to `dev`. Do not merge, deploy, change environment variables, call a real provider, or run production L3. The manager owns the final verdict and next release order.

## Exact base and workspace

- Repository: `/Users/anicca/anicca-project`
- Base: exact `origin/dev=835e28a5b668802899b946d56963b4be3366d980`
- Create/reuse isolated worktree: `/Users/anicca/anicca-project/.worktrees/lm-panel-composio-link`
- Branch: `feature/lm-panel-composio-link`
- Product source: `apps/life-call/lib/user-command.js`, especially `startCalendarOAuth`
- Primary focused test: `apps/life-call/lib/panel-control-center.test.js`
- Regression surface: PANEL focused tests, full `npm test`, `npm run eval`, panel API/UI fixture smokes
- Canonical spec and the dirty root checkout are read-only.

Fetch first and prove the exact base. If the named worktree/branch exists, require it clean and exact-base or safely fast-forward/reset only that dedicated branch to the exact base; never touch another user's worktree or changes.

## Verified external contract

Use these pinned primary sources and preserve their URLs in the evidence:

1. Composio migration notice at commit `89b0ad24cdcaeeb2fa5638d56d00cbdd5d677217`:
   `https://github.com/ComposioHQ/composio/blob/89b0ad24cdcaeeb2fa5638d56d00cbdd5d677217/docs/content/changelog/04-24-26-link-auth-migration.mdx`
   It states that all remaining Composio-managed OAuth integrations moved on July 3, 2026; legacy `POST /api/v3/connected_accounts` returns `400 BadRequest`; replacement is `POST /api/v3/connected_accounts/link`.
2. Official authentication example at the same commit:
   `https://github.com/ComposioHQ/composio/blob/89b0ad24cdcaeeb2fa5638d56d00cbdd5d677217/docs/content/docs/tools-direct/authenticating-tools.mdx`
   It passes `user_id`, `auth_config_id`, and `callback_url` to the link operation and consumes the returned `redirect_url`.

Current production code still POSTs the legacy endpoint, sends the legacy nested body, and overwrites the provider redirect's `state` query parameter. This is a real acceptance blocker, not an advisory review nit.

## RED — separate commit

Write production-path tests first and run them to genuine failure before changing implementation. Cover at least:

1. `startCalendarOAuth` POSTs exactly `https://backend.composio.dev/api/v3/connected_accounts/link`.
2. JSON body contains `auth_config_id`, scoped `user_id`, and exact `callback_url=<panelBaseUrl>/panel/oauth/calendar?state=<opaque stateToken>`; it does not contain legacy `auth_config` or `connection` wrappers.
3. Returned provider `redirect_url` is passed through without overwriting or synthesizing its `state` or other query parameters.
4. HTTP 400/other non-2xx is fail-closed as `provider_failed`; there is no fallback request to the legacy endpoint and only one provider call occurs.
5. Missing/malformed redirect data is fail-closed.
6. `connection.start` still creates/claims a tenant-scoped OAuth state before redirect and the callback claim remains one-time and tenant-scoped; no cross-tenant acceptance.

Commit only the RED test/evidence with a clear `test(life-call): ...` commit. Record the exact failing test names/count and show that production source is byte-identical to the base at this commit.

## GREEN — minimal product fix

Change only the smallest production code needed:

- use `POST /api/v3/connected_accounts/link`;
- send `{ auth_config_id, user_id, callback_url }`;
- keep existing header/auth handling and fail-closed behavior;
- validate a usable returned `redirect_url` and return it unchanged;
- do not edit the provider URL's `state`;
- preserve Dais's existing ACTIVE-account reuse path so an already connected account is not disconnected/relinked;
- do not change public copy, §9.11, unrelated panel behavior, schema, session semantics, or provider ownership.

Run RED tests to GREEN, then focused PANEL suites, full `npm test`, `npm run eval`, `node scripts/smoke-panel-api-fixture.js`, and `node scripts/smoke-panel-ui-fixture.js`. Review the exact base diff for legacy endpoint use, callback/state integrity, tenant scoping, and accidental unrelated changes. Do not start a broad adversarial-review loop.

## Delivery

Commit GREEN separately, fetch/rebase safely if `dev` moved, rerun all verification after any rebase, push the named branch, and open a non-draft PR to `dev`. Do not merge it. Persist sanitized evidence at `/Users/anicca/.codex/evidence/panel-0-composio-link-corrective.md` mode 0600 and print only its SHA-256.

Evidence must include exact base/head commits, RED and GREEN commands/counts, changed paths, primary-source URLs, review result, PR URL/number/state/checks, and a zero-side-effect ledger: provider API calls=0, OAuth=0, environment changes=0, TG/email/phone/wallet/calendar mutations=0, deploy/merge=0.

## Stop

Stop only if the exact base is unavailable, a destructive/provider mutation becomes necessary, or three independent implementation methods fail this same contract. A test assertion error, worktree setup issue, or branch movement is not a wait point: diagnose safely and continue without asking for approval.
