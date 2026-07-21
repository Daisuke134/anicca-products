# PANEL-0 product corrective build — ten real blockers

Fresh `gpt-5.6-sol` builder, low reasoning effort. Work only in `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center`, branch `feature/lm-panel-control-center`, exact clean HEAD/upstream `ef2673ab078f9e74f3660fe86f6e8d5dd383a6c6`. Do not delegate.

The feature SSOT is `.vcsdd/features/life-manager-panel-control-center/state.json`: Phase `2a`, sprint `2`, gate3 FAIL, ten open FIND-001..010. The global index has a stale phase display; do not spend this build on process metadata and do not treat it as product truth. Read the ten finding descriptions, current panel behavioral/verification specs, canonical spec §9.5/§9.9/§10 row 8d.1, and the product requirements under `Mandatory RED-before-GREEN` in `/Users/anicca/anicca-project/.claude/sol-orders/order-panel-control-center-corrective-10.md`. Ignore that older order's obsolete start SHA/process-persistence section.

Goal: close the ten substantive product defects, not to polish review paperwork. No merge/deploy, production panel probe, provider call, real OAuth, Telegram/email/phone send, Dais account disconnect/mutation, schema-destructive operation, or L3. Local/fixture TDD only.

## Build sequence

1. Trace each cited production path and write deterministic failing tests first. Every FIND-001..010 must map to at least one genuine RED assertion; keep existing tests separately GREEN. Commit RED tests/evidence first without product implementation changes.
2. Implement the smallest production changes that make all ten RED cases GREEN:
   - real per-user runtime OFF/ON wiring for supported call/notification/DAILY/delegation controls; honestly unavailable where no safe runtime surface exists;
   - pending/concurrent idempotency executes one mutation and duplicate pending executes zero;
   - current `uid+chat_id` rebinding validation on every read/action;
   - receipt schema/RLS/read/finish tenant key includes `uid+chat_id+idempotency_key`;
   - exact owned Google Calendar account selection, ambiguity/foreign fail-close;
   - same-account disable/readback plus verified rollback and honest rollback failure;
   - OAuth callback requires replay-safe exact owned ACTIVE readback;
   - Connect/Reconnect/Disconnect states and accessible clickable actions;
   - hard 32 KiB request body bound, settle once, no mutation after excess chunks;
   - keep VCSDD/product evidence truthful; no self-authored PASS.
3. Keep finding beads open until a fresh reviewer independently closes them. Link RED/GREEN tests/evidence through official trace APIs if they accept the current state; a non-product bookkeeping refusal must be reported but must not erase verified product work.

## Verification and delivery

Run focused panel tests, tenant/CSRF/origin/content-type/idempotency/OAuth/Composio/UI/mobile tests, full `npm test`, eval 33/33, both panel smokes, changed-module line/function coverage >=90%, `git diff --check`, secret/PII scan, and exact no-external-side-effect assertion. Inspect actual runtime call sites for toggle use; test names alone are not proof.

Make a separate GREEN implementation/evidence commit, fetch/rebase safely, push, and prove clean `HEAD==upstream` plus PR #331 head equality. Do not merge. End `RESULT=PRODUCT-LOCAL-GREEN` with RED/GREEN counts, per-finding test mapping, full commit SHAs, runtime/tenant/provider proof summaries, or `RESULT=BLOCKED` with exact remaining product blocker. Keep spec row pending for manager adjudication.
