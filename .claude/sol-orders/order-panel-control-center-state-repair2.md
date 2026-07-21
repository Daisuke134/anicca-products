# PANEL-0 VCSDD state + finding metadata repair — method 3

Fresh `gpt-5.6-sol` process-repair builder. Work only in `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center`, exact clean tracked HEAD/upstream `84e1cebae1b62908e2967c66398f81c65cdf02a3` plus the existing untracked exact sprint-1 review artifacts. Do not delegate. This is the third and final independent repair method before the attempt-limit route.

Scope is VCSDD process artifacts only. Do not edit product source/tests, SQL, panel UI/API, contract/spec criteria, or canonical product spec. Do not start product blocker tests. No provider/network/OAuth/TG/email/call/deploy/merge/L3 side effect.

Use TDD to build one narrow atomic migration tool under this feature's `scripts/` and fixture tests under its `tests/`. It must fail closed unless the input matches the exact observed invalid topology, support `--check` and atomic `--write` with same-directory temp+fsync+rename, be idempotent after a successful migration, and prove all non-authorized JSON fields are deep-equal.

Authorized transformations only:

1. State `phaseHistory[5..7]`: rename each `details` key to `reason`, preserving the three strings and every other value/order. Reject different count/index/from/to/timestamp/sprint, existing `reason`, or any additional invalid field.
2. Review FIND metadata: preserve each file's description, severity, evidence, recommendation, routeToPhase, findingId, dimension and every other field byte-for-byte at JSON value level; change only these `category` values:
   - FIND-001 `test_coverage → requirement_mismatch`
   - FIND-003 `test_coverage → code_structure`
   - FIND-004..007 `test_coverage → implementation_bug`
   - FIND-008 `test_coverage → requirement_mismatch`
   - FIND-010 `test_coverage → proof_gap`
   - FIND-002 and FIND-009 remain `test_coverage`.

RED evidence must prove current state fails installed schema and exactly 8 findings fail semantic validation. GREEN fixtures must cover valid repair, idempotency, unknown shape/count, category/dimension mismatch, and value preservation. Before real write record hashes and structural counts; after write prove semantic diff is exactly 3 state key renames + 8 category replacements. Validate state, verdict, and all 10 findings with the installed schema.

Only after all validation is GREEN, use installed official APIs to record Phase 3 adversary FAIL with root log SHA `a0fc7e4f01e50c0019866ca09e9cfae4c46e91264a443d4db12e0c08c3d8920a`, create exactly ten open adversary-finding beads if absent, and call official `routeFeedback(feature, "2a", ...)`. Require explicit history ending `4→2a`, truthful sprintCount=1, gate3 FAIL, 10 open beads, amended contract still unapproved, and no PASS artifact.

Run migration tests, installed state/runtime validators, installed schema validation for state/verdict/FIND-001..010, routing/trace count assertions, `git diff --check`, and exact path-scope check. Allowed changed/tracked paths: feature state, global `.vcsdd/history.jsonl`, exact sprint-1 review artifacts, and the new repair script/tests only. Commit, fetch/rebase safely, push, and prove clean `HEAD==upstream`. End `RESULT=STATE-REPAIRED` with full SHA/counts or `RESULT=BLOCKED` with no workaround.
