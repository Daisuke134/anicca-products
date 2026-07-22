# PANEL 8d.2 recovery after stalled builder

You are a fresh `gpt-5.6-sol` builder/executor/verifier. Resume and finish only PANEL 8d.2.

Read and obey the full original order first:
`/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/.claude/sol-orders/order-panel-8d2-zero-temporary-link.md`

The previous builder stopped without a GREEN commit. Its dedicated worktree is:
`/Users/anicca/anicca-project/.worktrees/panel-8d2-zero-temporary-link`

Known durable state:

- Branch: `feature/panel-8d2-zero-temporary-link`
- Exact base: `47d0f143e33fa6301d141ccc95529002fa9feb59`
- Genuine RED commit pushed: `52a5d60e6`
- Uncommitted GREEN attempt exists in `panel-auth.js`, `panel-auth.test.js`, `server.js`, and the new additive migration.
- `.codegraph/` is generated and must never be staged, edited, or deleted.

Recovery rules:

1. Inspect the uncommitted diff and test it; do not discard or blindly trust it.
2. Preserve the genuine RED commit. Fix only material auth/replay/tenant/URL/release defects.
3. Obtain focused GREEN first, then existing panel suites, full `npm test`, full eval, scan, and `git diff --check`.
4. Commit and push GREEN separately.
5. Run exactly one fresh artifact-only material review, maximum 10 minutes. Address only concrete blockers.
6. Complete feature PR -> dev staging exact SHA -> main production exact SHA, additive migration, and controlled Dais Telegram + ordinary-browser L3 exactly as the original order requires.
7. Never expose raw initData, device code, cookies, tokens, Telegram PII, or credentials in logs or evidence.
8. Do not edit the planning spec. Return exact commits, PRs, deployments, test commands/results, redacted evidence paths/hashes, and any honest blocker.

Do not stop after local GREEN or after opening a PR. The terminal condition is production L3 evidence or a true stop condition from the canonical spec.
