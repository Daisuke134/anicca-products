# PR 941 sender blocking fixes

Scope: sender and its focused Vitest tests, based on b44b059600b97782c5a0a54338dcecea0a026790. Branch: codex/fix-sender-p1-2026-11-18. No merge, deployment, or production access.

Acceptance:
- Per-device atomic claims control sends; parent status is visibility only.
- Retry queued/due failed sends using validated saved manager-v1 decisions, never catalog or regenerated text.
- Use claimed for recoverable pre-APNs work; stale claimed can retry. sending means APNs may have been invoked: stale sending and transport exceptions become outcome_unknown without automatic replay. Explicit APNs rejection can retry with backoff; permanent token failures disable only that token.
- Manager failures expose config_missing, unreachable (including timeout/5xx), auth, invalid_response without logging secrets; return ok:false and failure counters.
- Focused tests cover normal sends, Manager errors, old catalog rejection, multiple devices, saved decision reuse, transient retry, stale recovery, and unknown-outcome replay suppression.

Implementation TODO: complete. Delivery: commit and push this change set to the named branch, then compare the local HEAD with the remote branch SHA; the delivery receipt is reported in the completion response.

Validation:
- Before implementation: focused sender tests reproduce 18 failures out of 29 tests.
- After implementation: `cd apps/api && npm test -- src/jobs/__tests__/problemNudgeApnsSenderJob.test.js` passes all 41 tests.
- Coverage includes both devices after success/permanent token rejection, due retry outside the slot, stale claimed recovery, stale sending/transport/receipt-write uncertainty, concurrent runners, claim failure before ownership, parent visibility update failure, global APNs auth backoff, malformed saved decisions, and APNs endpoint guards.
- `node --check apps/api/src/jobs/problemNudgeApnsSenderJob.js` and `git diff --check` pass.
- Supplemental API suite (`npm test -- --maxWorkers=2 --minWorkers=1`): 99 files pass, 1 fails; 626 tests pass, 3 fail. Run precedes the final global-auth counter regression test. All failures are in unchanged `src/modules/problem_nudges/__tests__/catalog.test.js`: expected schema/sizes (70 expected, 60 actual), unique hook/detail texts (60 expected, 20 unique), and sleep-focused deep-night text. The loader, catalogs, and catalog tests have no changes relative to the base commit; sender changes do not alter catalog data.

Operational boundary: `claimed` is recoverable before APNs; `sending` may already have called APNs. Stale sending and ambiguous transport/receipt failures are quarantined as `outcome_unknown`, with no automatic replay. No schema migration, new dependencies, merge, or production actions.

Root-cause evidence at base commit: apps/api/src/jobs/problemNudgeApnsSenderJob.js uses parent queued claim after device claim; failed rows have nextAttemptAt but no retry scan. apps/api/src/services/apns/apnsClient.js returns ApnsError only after an HTTP rejection; generic errors do not prove rejection. Schema status fields are strings, so no migration is required.
