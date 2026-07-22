# PANEL 8d.2 — verify, review, release, and production L3

You are a fresh `gpt-5.6-sol` release executor/verifier for PANEL 8d.2 only.

Read the canonical original order:
`/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/.claude/sol-orders/order-panel-8d2-zero-temporary-link.md`

Work only in:
`/Users/anicca/anicca-project/.worktrees/panel-8d2-zero-temporary-link`

Current durable state:

- branch `feature/panel-8d2-zero-temporary-link`
- RED commit `52a5d60e6` pushed
- GREEN candidate commit `60d8bf564` pushed
- worktree clean except generated untracked `.codegraph/`; never stage/edit/delete it
- there is no PR yet and nothing from PANEL 8d.2 is deployed

Do not rewrite the implementation unless a reproducible material blocker requires it. Execute the remaining terminal path:

1. Independently inspect the exact `52a5d60e6..60d8bf564` artifacts for auth correctness, replay, exact tenant binding, zero auth material in URLs/logs, migration safety, and actual server wiring.
2. Run focused zero-link tests, existing panel/session/API/UI/control/tenant suites, full Life Call `npm test`, full eval, source leak scan, and `git diff --check`. Record exact commands/results without secrets.
3. Run exactly one fresh artifact-only material review, hard maximum 10 minutes. Fix only concrete auth/replay/tenant/URL/release blockers; commit and push any fix.
4. Open the normal feature PR to `dev`, get its checks green, merge it, deploy and verify the exact staging SHA. Then open/merge the normal `dev` to `main` release PR, deploy and verify the exact production SHA. Apply only the additive migration and verify its grants/RLS/indexes.
5. Perform the controlled production L3 with Dais's existing Telegram session and `@LifeManagerBotbot`: `/panel` returns one `web_app` button whose exact URL is `https://life-call-production.up.railway.app/panel` with no query/fragment; real WebView initData authenticates the personalized Dais panel; direct revisit persists. Then use one fresh ordinary browser at the same unchanged URL, confirm its displayed device code via Dais's own bot chat, authenticate, and prove replay has zero effect.
6. Store only redacted mode-0600 evidence under `/Users/anicca/.codex/evidence/`. No raw initData, code, token, cookie, credentials, Telegram PII, or unrelated provider mutation.

Do not stop at tests, review, PR creation, or merge. Stop only at production L3 Success or a true canonical stop condition. Return exact commits, PRs, deploy IDs/SHAs, verification results, evidence paths/SHA-256, and any honest blocker. Do not edit the planning spec.
