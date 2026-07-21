# CORE 8d review6 GREEN rescue method 2

You are the fresh implementation Sol. Work only in `/Users/anicca/anicca-project/.worktrees/lm-p0-order8d` on `feature/lm33d-daily-preflight`. Do not delegate. Read the canonical spec §10 row 8d and §10.0 plus the prior rescue order before acting.

## Exact inherited state

- `HEAD == upstream == 09dbd5ef546cec6027ea760c41bfbb1d27a27305`.
- Exactly eight implementation/verifier/test-support paths are dirty; preserve and audit them. There are no commits after the RED base.
- Rescue method 1 proved the focused expanded group GREEN, but the coverage command is `149 total / 148 pass / 1 fail`: `poll: email inbox attempt 6 is the final allowed attempt` fails as `email_receipt_stale`.
- Root cause is a defective fixture at `apps/life-call/lib/daily-preflight-poll-boundaries.test.js`: `emailHarness` captures `const now = Date.now()` before collection and returns that pre-acceptance time at attempt 6. This contradicts the required production boundary after Resend acceptance.
- Never restore `Date.now()+1`, `receiptUsesQuery`, sentAt source rewriting, timer deletion, or any clock/receipt inference in the harness.

## Authorized minimal test-contract correction

1. Change only the `emailHarness` success receipt timestamp so it is captured when `findReceipt` returns the receipt, after the accepted send (for example a local `receivedAtMs = Date.now()` inside the successful return path). Do not alter the explicit one-millisecond-before-actual-send rejection test or any other RED assertion.
2. Commit this one test-file correction separately.
3. Prove in a temporary clean worktree at that test-contract commit, with RED-base production/verifiers, that the expanded suite remains exactly `142 total / 136 pass / 6 fail`, with the same TEST-102..107 failures. This proves the fixture repair does not weaken the six blockers. Remove only the temporary worktree you created after recording evidence.

## GREEN requirements

- Resume the eight inherited dirty paths. Production captures `sentAtMs` only after a truthy accepted Resend ID and before inbox polling.
- Harness must not rewrite time or receipt bounds. It may inject provider functions/nonces/sleep only.
- Same-run provenance rejects replay and arbitrary serialized runRef in-process; offline shape validation must not claim same-run provenance.
- Schema discovery honors injected plugin root and has no Dais-machine absolute path.
- Proof closure is exact and reproducible from tracked evidence; no wildcard evidence directory acceptance.
- Recursive privacy scan covers production/current artifacts and all five negative fixtures fail without leaking matched values; no concrete-value masking and no broad JS regex-literal masking.
- Do not edit any other test file. Do not use coverage ignore directives to manufacture threshold.

## Required verification before commits

- expanded suite: `142/142`.
- old selection `75/75`, focused `52/52`, full `372/372`, eval `33/33`, signal-aware deadline boundary `6/6`.
- exact coverage command from the prior order: `149/149`; all four production modules lines and functions each `>=90%`.
- VCSDD state/runtime/schema/trace, privacy positive and five negatives, tracked scope/coverage/final-artifact/controlled-L3 dry gates all exit as specified.
- `107` test beads GREEN, `17` findings RESOLVED, `state.currentPhase=2b`, `sprintCount=0`.
- no provider/network/TG/email/call/L3/final-report/deploy/merge side effect.

## Commit topology

1. test-contract commit: only `apps/life-call/lib/daily-preflight-poll-boundaries.test.js`.
2. implementation commit: only the inherited implementation/verifier/test-support paths.
3. state/evidence commit: only state/history, FIND-012..017 closure, and a new exact tracked evidence directory.

Fetch/rebase safely, push `feature/lm33d-daily-preflight`, verify `HEAD == upstream` and clean. End with `RESULT=REVIEW6-GREEN-RESCUE2` plus the three full commit SHAs and compact actual counts. If any invariant cannot be met, make no implementation/evidence commit, preserve the worktree, and end `RESULT=BLOCKED` with exact evidence.
