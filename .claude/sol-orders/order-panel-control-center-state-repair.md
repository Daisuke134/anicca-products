# PANEL-0 narrow VCSDD state repair

Fresh `gpt-5.6-sol` process-repair builder. Work only in `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center`, branch `feature/lm-panel-control-center`, exact start/head/upstream `84e1cebae1b62908e2967c66398f81c65cdf02a3`. Do not delegate. Read state first, current installed VCSDD state schema/API, canonical spec §10 row 8d.1/§10.0, root reviewer log, and the existing untracked sprint-1 verdict/findings.

Scope is process repair only. Do not edit product source, product tests, migration SQL, panel UI/API, contract criteria, behavioral/verification specs, or canonical product spec. Do not start the ten product blocker RED tests. No provider/network/OAuth/TG/email/call/deploy/merge/L3 side effect.

Observed blocker: official `recordGate()` refuses the tracked state because exactly `phaseHistory[5]`, `[6]`, `[7]` contain schema-disallowed `details`. Current schema permits `reason` with the same string semantics. No other phaseHistory entry is invalid.

Use TDD and a tracked, narrowly reusable migration tool under this feature's VCSDD `scripts/` plus tests under its `tests/`:

- RED first: fixture proves invalid `details` is rejected by current installed schema and the absent repair behavior fails.
- GREEN migration accepts only a state document with exactly the expected three `details` entries and no `reason` collision; renames each `details` key to `reason` byte-for-byte, preserves order/timestamps/from/to/sprint/all other JSON values, is idempotent, and fails closed on unknown shape, different count, or conflicting `reason`.
- Support `--check` and atomic `--write` via same-directory temp file + fsync + rename; no in-place partial write.
- Before applying, record SHA-256 and a redacted structural summary only. Apply once to the real feature state. Prove the semantic JSON diff is exactly three key renames and current schema accepts it.

Then, and only then, use installed official APIs to:

1. record the verified fresh implementation review as Phase 3 `FAIL` with source-log SHA `a0fc7e4f01e50c0019866ca09e9cfae4c46e91264a443d4db12e0c08c3d8920a`;
2. persist/track the already verified exact sprint-1 verdict, provenance, and FIND-001..010 without rewording;
3. create exactly ten open adversary-finding beads through traceability APIs if absent;
4. invoke official `routeFeedback(feature, "2a", ...)` so history records explicit `4→2a` and sprint count stays truthful;
5. leave the amended contract unapproved and do not create any PASS.

Run migration unit tests, installed state/runtime/schema validators, finding/verdict schema validation, trace-link/count assertions, `git diff --check`, and verify only state/history + the new repair script/tests + exact review artifacts changed. Commit, fetch/rebase safely, push, and prove clean `HEAD==upstream`. End `RESULT=STATE-REPAIRED` with full commit SHA and exact state/counts, or `RESULT=BLOCKED` without hand-editing around a failure.
