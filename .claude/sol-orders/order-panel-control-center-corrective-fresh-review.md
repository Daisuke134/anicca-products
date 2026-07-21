# PANEL-0 corrective fresh artifact-only review

Fresh `gpt-5.6-sol` reviewer. Work read-only in `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center` after the corrective builder has ended, pushed, and left the worktree clean. Do not delegate. Do not modify source/tests/spec/VCSDD, commit, push, merge, deploy, call providers, open real OAuth, send Telegram/email/calls, or mutate Dais accounts. Builder reports and builder evidence are untrusted claims.

Read state first, then the latest sprint verdict summary, exactly its named findings, the contract, behavioral/verification specs, canonical spec §9.5/§9.9/§10 row 8d.1/§10.0/§10.2-10.3, PR #331 diff, and the corrective commit topology. Independently run the exact commands recorded in tracked RED/GREEN evidence.

Freshly reproduce all ten prior blockers:

1. OFF/ON controls reach actual user-scoped call/notification/DAILY/delegation runtime paths, or unsupported controls are honestly unavailable; no cross-user effect.
2. concurrent duplicate `uid+chat_id+idempotency_key` causes one mutation; pending duplicate causes zero.
3. every read/action revalidates current `uid+chat_id`; rebind invalidates old session.
4. receipt schema/RLS/read/finish isolate by `uid+chat_id+key`, including same uid across two chats.
5. Calendar provider selection rejects zero/ambiguous/foreign/missing/mixed accounts and accepts exactly one owned Google Calendar account.
6. disable/reconnect verifies the same account; failed verification rolls it back and verifies restoration, otherwise reports rollback failure honestly.
7. OAuth callback is replay-safe and requires exact owned ACTIVE provider readback before success.
8. UI distinguishes Connect/Reconnect/Disconnect and every visible control is keyboard/click actionable on mobile and desktop.
9. >32 KiB request buffering stops at the limit, settles once, and executes zero mutation despite later chunks.
10. strict VCSDD transition/history/RED/GREEN/contract state is legal; no self-authored PASS.

Also run regression tenant/CSRF/origin/content-type/OAuth/UI tests, full `npm test`, eval, both panel smokes, focused coverage, diff-check, secret/PII scan, installed VCSDD state/runtime/schema validation, `git status`, local/upstream equality, and PR base/head. Inspect production call paths rather than accepting test names.

Return only an evidence-backed `VERDICT: PASS|FAIL`, `BLOCKERS: n`, per-dimension findings with file/line and executable reproduction, actual counts, exact HEAD/upstream/PR hashes, and confirmation of zero external side effects. PASS requires all ten closed, clean reproducible tracked artifacts, and no new blocker. Do not persist the verdict; the manager will adjudicate and issue a separate state order.
