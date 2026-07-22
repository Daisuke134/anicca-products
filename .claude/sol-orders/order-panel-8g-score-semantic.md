# PANEL 8g outcome score semantic fix

You are a fresh `gpt-5.6-sol` builder/executor/verifier for §10 row 8g only. Start only after manager confirms row 8f is done. Use a dedicated `.worktrees/panel-8g-score-semantic` branch from the then-current exact `origin/main`; never reuse another dirty worktree. Read planning SSOT `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` §9.9, §10.0, §10.2, and row 8g before editing.

## Known production gap

- `apps/life-call/lib/panel-api.js:scores` currently reports DAILY as answered call rows / call rows, PHYSICAL as hardcoded unimplemented, omits MENTAL, and reports FINANCIAL=100 for any ledger row.
- `apps/life-call/lib/panel-ui.js:renderScores` hardcodes three categories, clamps every value to `/100`, and says 準備中 instead of exact `insufficient data`.
- existing tests/smokes preserve the wrong behavior; no score dataset/runner exists.

## TDD RED first

Add a pure production projector, fixed JSONL dataset, runner wired into `npm run eval`, and actual API/DOM contract tests. Commit/push RED separately with production implementation unchanged. Dataset must cover at least:

1. DAILY 1/2 by completed required actions, and activity/call retry noise leaves it unchanged.
2. DAILY zero-data plus exact rolling-7d timezone boundaries.
3. PHYSICAL candidate-only=0 and booking/completion=1/2 over rolling 30d.
4. MENTAL delivered intervention, suppression honored with send 0, correction applied, duplicate and >3/day non-credit.
5. FINANCIAL verified gross/loss/fee ratio with actual user transfer shown separately; deposit/self-transfer/unverified excluded; exact calendar-month boundary.
6. all four zero-data results use `status=insufficient_data`, `value=null`, zero numerator/denominator, reason, and empty source IDs.
7. API returns all four categories and exact `value/status/period/numerator/denominator/reason/source_outcome_ids`, scopes every source row to authenticated uid, and leaks foreign outcome IDs 0.
8. actual rendered DOM displays all four categories, numerator/denominator/reason/source evidence and exact `insufficient data`; it never renders `0/100` or 準備中 for zero-data.

Prove genuine RED with the wrong current semantics. Tests that pass against fixtures disconnected from `scores()`/`renderScores()` do not count.

## Minimal GREEN

- Build one shared outcome-score projector used by production API; no parallel fixture formula.
- Query only canonical durable outcome records that prove completion. Activity logs, pre-send claims, candidate lists, API row counts, call retry rows, and unverified ledger entries cannot become outcomes.
- For an organ whose canonical outcome records do not yet exist in production, return honest `insufficient_data`; do not invent tables, synthetic rows, or proxy activity. The fixed dataset still specifies its future projector contract.
- Preserve session uid scope and existing API auth/cache behavior. Keep schema additive if an index/view is strictly needed; no destructive migration.
- Render all four categories from API data with human reason and outcome evidence. Broad timeline/privacy restyling belongs to 8h.
- Keep existing PANEL-0 permanent auth/personalization/connect controls unchanged.

## Review, release, L3

- Required GREEN: panel-score dataset 100%, new focused tests 100%, existing panel auth/API/UI/tenant tests, full Life Call test, full eval including calendar/late/context/score, API/UI smokes, `git diff --check`.
- Run exactly one fresh artifact-only read-only review, timeboxed to 10 minutes and limited to semantic correctness, tenant leakage, activity-as-outcome, and release safety. Ignore style/naming/general improvements; timeout without a concrete blocker is not a blocker.
- Commit/push GREEN, normal feature PR→dev→exact-SHA staging→dev-to-main→exact-SHA production. No direct main push.
- Production L3 is read-only: authenticated Dais panel/API, independently aggregate same uid+period durable outcome rows, and prove all four API/DOM values, numerator, denominator, reason, period, and source IDs match. Resolve every source ID to same tenant/period, foreign IDs 0. Zero-data organ must show exact `insufficient data`, not 0. Desktop/mobile semantic DOM assertions are required; screenshot alone is not evidence.
- Write redacted mode-0600 evidence under `/Users/anicca/.codex/evidence/`, record SHA-256, exact commits/PRs/deploy IDs and fresh counts. No calendar/call/email/TG/wallet/provider mutation is needed or allowed for 8g L3.
- Do not edit the planning spec; manager independently verifies and marks row 8g.
