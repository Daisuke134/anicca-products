# PANEL-0 VCSDD state + finding metadata repair — method 3

Fresh `gpt-5.6-sol` process-repair builder. Work only in `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center`, exact clean tracked HEAD/upstream `84e1cebae1b62908e2967c66398f81c65cdf02a3` plus the existing untracked exact sprint-1 review artifacts. Do not delegate. This is the third and final independent repair method before the attempt-limit route.

Scope is VCSDD process artifacts only. Do not edit product source/tests, SQL, panel UI/API, contract/spec criteria, or canonical product spec. Do not start product blocker tests. No provider/network/OAuth/TG/email/call/deploy/merge/L3 side effect.

Do not build a migration framework or add migration source/tests. This metadata repair is not product behavior. Use guarded read-only assertions first, then `apply_patch` for the exact authorized JSON fields, then deep-equality/schema assertions. Abort before official API calls if the observed topology differs.

Authorized transformations only:

1. State `phaseHistory[5..7]`: rename each `details` key to `reason`, preserving the three strings and every other value/order. Reject different count/index/from/to/timestamp/sprint, existing `reason`, or any additional invalid field.
2. Review FIND metadata: preserve each file's description, severity, evidence, recommendation, routeToPhase, findingId, dimension and every other field byte-for-byte at JSON value level; change only these `category` values:
   - FIND-001 `test_coverage → requirement_mismatch`
   - FIND-003 `test_coverage → code_structure`
   - FIND-004..007 `test_coverage → implementation_bug`
   - FIND-008 `test_coverage → requirement_mismatch`
   - FIND-010 `test_coverage → proof_gap`
   - FIND-002 and FIND-009 remain `test_coverage`.

Before editing, prove current state fails installed schema and exactly 8 findings fail semantic validation; record hashes and structural counts. After editing, prove the semantic diff is exactly 3 state key renames + 8 category replacements and all other JSON values are deep-equal. Validate state, verdict, and all 10 findings with the installed schema.

Only after all validation is GREEN, use installed official APIs to record Phase 3 adversary FAIL with root log SHA `a0fc7e4f01e50c0019866ca09e9cfae4c46e91264a443d4db12e0c08c3d8920a`, create exactly ten open adversary-finding beads if absent, and call official `routeFeedback(feature, "2a", ...)`. Require explicit history ending `4→2a`, truthful feedback-loop `sprintCount=2`, gate3 FAIL, 10 open beads, amended contract still unapproved, and no PASS artifact.

Run installed state/runtime validators, installed schema validation for state/verdict/FIND-001..010, routing/trace count assertions, `git diff --check`, and exact path-scope check. Allowed changed/tracked paths: feature state, global `.vcsdd/history.jsonl`, exact sprint-1 review artifacts, and one compact evidence summary only. Commit, fetch/rebase safely, push, and prove clean `HEAD==upstream`. End `RESULT=STATE-REPAIRED` with full SHA/counts or `RESULT=BLOCKED` with no workaround.
