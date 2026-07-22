# PANEL 8g — outcome score semantics, production L3

You are the fresh Sol builder/executor/verifier. Complete only §10 row 8g. The manager owns the canonical planning spec and final verdict; do not edit that spec.

## Source of truth

- Repository: `/Users/anicca/anicca-project`
- Canonical spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`
- Read §9.9 score rules and §10 row 8g before acting.
- Accepted production base at dispatch: origin/main `d04c522f08161c69ff83e25335a0630d3940a84c`, Railway production deployment `ea570232-fd20-4614-b2c8-084cb9d3256c`, SUCCESS, health 200.
- Permanent personalized panel 8d.2 is done. Preserve exact canonical `/panel`, Telegram Mini App auth, browser device-code auth, tenant isolation, session behavior, connections, settings, and all existing contracts.

## Work isolation and process

1. Fetch origin. Create/reuse a dedicated worktree at `/Users/anicca/anicca-project/.worktrees/panel-8g-score-semantics` on a feature branch based on current `origin/main`. Never alter unrelated dirty worktrees or generated `.codegraph/`.
2. Use the repository's VCSDD artifacts as the lifecycle record. Reuse a matching score-semantics feature if one exists; otherwise create a narrowly scoped one. Keep the phase progression legal, but do not expand into cosmetic or unrelated adversarial work.
3. TDD is hard: fixed-dataset RED first and prove failure; minimal GREEN; refactor; fresh artifact-only review by a fresh `gpt-5.6-sol` context; then final verification.
4. Product commits, pushes, PRs, merge/release, exact-SHA deploy verification, production L3, private evidence, and cleanup are all your responsibility.

## Required score contract

All score computation is server-side, tenant-scoped, timezone-aware, and derived from source outcomes rather than activity/log counts. No Dais fixtures or magic numbers in production.

- DAILY, rolling 7 days: denominator = events needing any travel/call/late handling. Numerator = events for which every required handling succeeded or was proven unnecessary by context. Retries, API rows, calls, and notifications never add points.
- PHYSICAL, rolling 30 days: denominator = detected overdue needs. Numerator = needs resolved by confirmed booking or confirmed completion. Search/candidates/unconfirmed request never add points.
- MENTAL, rolling 7 days: denominator = deduplicated context triggers. Numerator = trigger satisfied by one of: valid intervention delivered within the 3/day cap; suppression correctly honored with zero send; user correction persisted to context. Duplicates/cap overflow never add points.
- FINANCIAL, the user's calendar month: denominator = verified external gross income in one minor currency unit. Numerator = `max(0, gross - realized loss - fee)`. User transfers are shown separately in reason/components and are not subtracted from numerator. Self-funding/deposits/internal wallet moves/unverified amounts count as neither gross nor user transfer.
- `value = round(numerator / denominator * 100)`, clamped 0–100.
- Denominator zero is exactly `status=insufficient_data`, `value=null`, `numerator=0`, `denominator=0`; never fake zero performance.
- Every organ returns and renders `status`, `value`, `period.kind/start_at/end_at`, `numerator`, `denominator`, plain-language `reason`, and tenant-scoped `source_outcome_ids` (or a privacy-safe reference form if raw IDs may not be exposed to the browser; preserve auditable server-side linkage).
- Period boundaries use the user's timezone and half-open `[start,end)`.
- UI shows the reason/components, not unexplained colors or a bare percentage.

## Verification layers

### L1 — fixed-dataset eval (100% required)

Write a closed fixture matrix before implementation. At minimum cover:

- all four organs: success, partial, denominator zero;
- duplicate/retry/activity inflation resistance;
- DAILY mixed required/optional handling and context-proven-unnecessary;
- PHYSICAL candidate/search/unconfirmed exclusion;
- MENTAL dedup, suppression, correction, 3/day cap and overflow exclusion;
- FINANCIAL external verified vs self/deposit/internal/unverified, realized loss/fee, user transfer separately displayed, negative net clamp;
- timezone/DST/month boundary and exact `[start,end)` edge rows;
- cross-tenant rows ignored;
- reason/source linkage agrees with numerator/denominator.

The fixed matrix must run as a deterministic command and finish 100%, with genuine RED and GREEN evidence.

### L2 — integration/regression

- Exercise the real panel score endpoint/query layer, not only a detached calculator.
- Prove every database/query path is tenant-scoped.
- Run focused panel/API/tenant tests, full Life Call tests, and all existing evals.
- Existing permanent panel auth and controls must remain green.
- Fresh review may block only material correctness/security/release issues; record non-blocking cosmetic observations without expanding scope.

### L3 — real production readback once

After feature→dev→main PR merge and exact-SHA Railway SUCCESS/health 200:

1. Open Dais's permanent personalized `/panel` through an already valid safe auth path; do not create a temporary panel URL.
2. Read the four rendered score cards and the authenticated score API.
3. Independently query the production source outcome rows for the same Dais tenant and period without printing PII. Recompute numerator/denominator/status/value and privacy-safe reason/source linkage.
4. Assert UI = API = independent production recomputation for each organ. If an organ has no source outcomes, it must visibly be `insufficient data`, not 0%.
5. Capture mobile and desktop evidence showing value/status and plain-language reasons. No raw DB row, secret, internal prompt, stack trace, or provider log may appear.
6. Mutations, provider calls, calls, emails, posts, wallet actions, and other-tenant effects must all be zero.

## Release/evidence

- Follow the repository's normal feature→dev→main PR flow. Never force-push or push directly to protected branches.
- Verify the final production deployment is the exact merged main commit and health is 200.
- Write a mode-0600 JSON artifact at `/Users/anicca/.codex/evidence/panel-8g-score-semantics-production-l3.json`, plus private screenshots if needed. Include RED/GREEN commands and counts, review verdict, commits/PRs, deployment, fixed-matrix results, regression results, per-organ production recomputation with privacy-safe refs, UI/API equality, zero side effects, and file hashes. Do not store credentials or raw PII.
- Leave the feature worktree clean except generated `.codegraph/`; remove temporary profiles/runners/logs containing auth material.
- Return a concise handoff with exact evidence paths/hashes/modes and no completion claim beyond what the artifact proves.

## Stop conditions

- Same atomic failure by three materially independent methods: restore exact state, write false hypotheses/evidence, and stop.
- Stop before any destructive production schema change, billing-route change, external transfer, or broadcast not authorized here.
- Do not modify §9.11 copy.
