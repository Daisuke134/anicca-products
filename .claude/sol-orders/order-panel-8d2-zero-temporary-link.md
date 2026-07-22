# PANEL 8d.2 — zero-temporary-link permanent personalized panel

You are a fresh `gpt-5.6-sol` builder/executor/verifier for §10 row 8d.2 only. Build, execute, verify, release, run controlled production L3, commit, and push. Work in a dedicated `.worktrees/panel-8d2-zero-temporary-link` branch from the fresh exact `origin/main`; never edit another worktree. Planning SSOT is `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` §9.9, §10 row 8d.2, and U5.

Dais explicitly rejects the current five-minute `?t=` panel link. The visible panel URL must always be the same canonical `/panel` for every person. Personalization comes only from verified Telegram identity + rotating HttpOnly session, never a user-specific/permanent bearer URL.

Official Telegram contract: `https://core.telegram.org/bots/webapps` says an inline `web_app` button opens a Mini App from its specified URL, `Telegram.WebApp.initData` must be validated on the bot server, and stale `auth_date` must be rejected. Use the official HMAC procedure; never trust `initDataUnsafe`.

## RED first

Write production-path tests and prove they fail against exact base before implementation:

1. `/panel` Telegram command currently inserts `lm_panel_tokens` and sends a URL containing `?t=`; required result is one `web_app` button whose URL is exact `${panelBase}/panel`, with query/fragment/user id/token 0 and no token-table mutation.
2. Actual `POST /api/panel/session/telegram` (or equally narrow endpoint) must reject missing/forged/stale/wrong-bot/wrong-user/replayed `initData` with session/DB/provider mutation 0; valid signed data bound to exactly one `lm_users.telegram_chat_id` creates/rotates a session and returns canonical `/panel` only.
3. Fresh normal browser `GET /panel` must stay HTTP 200 on the same URL, create a hash-only short-lived device challenge, and render a code—not a link containing auth material. Actual TG `/panel <code>` actor confirmation binds only that exact browser challenge/tenant once; poll/exchange sets the existing secure panel cookie. Expired/replayed/cross-user code mutation 0.
4. Legacy `/panel?t=<token>` must not call the old claim RPC or create a session; it strips/redirects to canonical `/panel` login.
5. Existing authenticated direct `/panel`, rotation, logout/rebind/revoke, CSRF, tenant isolation, personalized controls, and API behavior remain GREEN.

Commit and push genuine RED separately with product implementation unchanged.

## Minimal GREEN

- Replace `sendPanelLink` production behavior with a Telegram `web_app` inline button to exact canonical `/panel`. No fallback containing a temporary panel URL.
- Add strict Telegram Mini App initData verification following the official algorithm: constant-time HMAC, bounded auth_date, expected bot, exact actor/chat→one tenant, one-time replay claim. Raw initData/hash/user JSON must not enter logs/evidence.
- Add the ordinary-browser device-code path on the same canonical page. Store only code/challenge hashes; bind to a secure same-site browser challenge cookie; short TTL; atomic claim; one-time; RLS/service-role only. The user types the code in their own bot chat. Do not encode it in any URL/deep link.
- Reuse current rotating `__Host-lm_panel_session`, personalization, CSRF, and user-scoped command backend. Additive migration only. Old token schema may remain inert for rollback/audit, but no production request may create or claim it.
- `GET /panel` unauthenticated remains human login UI, not raw 401/403. It must explain the two stable entry methods without claiming the dashboard itself expires.
- Do not broaden into score/timeline work (8g/8h) or unrelated typecheck failures.

## Verify/review/release/L3

- Required local GREEN: new zero-link/auth/replay/device tests, existing permanent-session/auth/API/UI/control/tenant suites, full Life Call `npm test`, full eval, source scan proving auth URL material 0 in production responses, and `git diff --check`.
- Exactly one fresh artifact-only review, timeboxed to 10 minutes, limited to auth correctness, replay, tenant isolation, URL leakage, and release safety. Ignore style/naming/general improvements; timeout without a concrete blocker is not a blocker.
- Normal feature PR→dev→exact-SHA staging→dev-to-main→exact-SHA production. Apply only additive migration and verify RLS/grants/indexes.
- Controlled production L3 uses Dais's existing Telegram identity/session and `@LifeManagerBotbot` only. Send `/panel`; read back one bot `web_app` button and prove its URL is exact `https://life-call-production.up.railway.app/panel` with query/fragment 0. Use real MTProto `RequestWebViewRequest`/Telegram WebView data to open it, verify personalized Dais panel, query stays empty, and restart/revisit direct `/panel` succeeds from the same persistent browser.
- Also exercise one fresh ordinary browser: same `/panel` shows device code; send `/panel <code>` in Dais's bot chat; same unchanged browser URL becomes authenticated. Restore/expire the challenge and prove replay 0. No other person/identity is contacted or created.
- Evidence: redacted mode 0600 under `/Users/anicca/.codex/evidence/`, SHA-256, exact commits/PR/deploy IDs, TG message/button refs, URL assertions, session/personalization booleans, cross-tenant/replay counts. Raw code/initData/token/cookie/PII 0. Provider/email/call/calendar/wallet mutation 0.
- Do not edit the planning spec; manager independently final-checks and marks row 8d.2.
