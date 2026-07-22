# PANEL-0 standalone release integration — Sol order

## Role and goal

You are the builder/executor/verifier. The manager session only plans and performs the final check.

Complete exactly one atomic: transplant the already reviewed PANEL-only delta onto the latest `origin/dev`, prove that unfinished CORE 8d is absent, run the product test stack, perform exactly one fresh substantive review, commit/push, and open a PR to `dev`.

Do not migrate, merge, deploy, change provider credentials, run Telegram/email/call side effects, or perform production/staging L3 in this order.

## Required context

- Repository: `/Users/anicca/anicca-project`
- Existing reviewed PANEL worktree: `/Users/anicca/anicca-project/.worktrees/lm-panel-control-center`
- Reviewed stacked parent: `c01057a0bfc0d5f1c0e1a308bd3c5de102d659fa`
- Reviewed PANEL code head: `a4c86991469419b8f775cfcb89776e89b832b5df`
- Stacked evidence head (do not transplant its obsolete parent-integration evidence commit): `900db6a2444cdced8cc2b0eea6028b20b8b6f0a8`
- PANEL-only source delta: `c01057a0bfc0d5f1c0e1a308bd3c5de102d659fa..a4c86991469419b8f775cfcb89776e89b832b5df`
- New branch: `feature/lm-panel-release`
- New worktree: `/Users/anicca/anicca-project/.worktrees/lm-panel-release`
- Canonical spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`; read §9, §9.5, §10, §10.0, §10.2 before acting. Do not edit the canonical spec in this release branch.

Read and follow the repository `AGENTS.md`, `spec-driven-development`, and the relevant TDD/verification skill. Use CodeGraph first for unfamiliar code.

## Ground truth and safety contract

1. `origin/dev` is moving. Fetch immediately before creating the branch and record its exact SHA.
2. PR #330 is unfinished CORE 8d and must not be merged or included.
3. Do not simply retarget PR #331 to `dev`: its common-base diff includes CORE 8d.
4. Create the release branch from the freshly fetched `origin/dev`, then apply only the cumulative PANEL delta from the exact range above. Preserve the old stacked branch/PR #331 as evidence; do not force-push or close it.
5. The source delta was independently proven to pass `git apply --check --3way` onto then-current dev. If current dev moved, recompute against the fresh SHA.
6. For overlapping runtime paths, keep current dev behavior and add PANEL behavior. In particular retain dev's `calendarProviderFilter` and current package/full-test baseline. Do not import `schedulerCohortFilter`, daily-preflight implementation/tests, or any `.vcsdd/features/life-manager-daily-preflight/**` paths from PR #330.
7. Preserve TDD provenance by recording source RED/GREEN/review SHAs in a new release evidence file. A squash/integration commit on the release branch is acceptable because the immutable stacked branch retains the original RED/GREEN history.
8. Ignore style/process/coverage nits. Exactly one fresh review is allowed, and it may fail the order only for reproducible important/critical product, security, tenant-isolation, runtime, or release-contamination blockers.

## Execution

1. Baseline:
   - `git fetch origin`
   - record `origin/dev`, PR #330/#331 topology, source range, clean source worktree, and exact source diff path list/hash.
   - if the release worktree or branch already exists, inspect it; reuse only if its base and scope match this order. Never delete unrelated/user work.
2. Create `feature/lm-panel-release` at the fresh `origin/dev` in the specified new worktree.
3. Apply only the cumulative binary diff `c01057...a4c869...` with a three-way-capable method. Exclude only the obsolete file `.vcsdd/features/life-manager-panel-control-center/evidence/panel-0-parent-rebase-integration.md`; replace it with a new standalone release evidence file after verification.
4. Resolve any current-dev overlaps semantically. No test deletion, assertion weakening, source-regex substitute for behavior, or unrelated cleanup.
5. Prove scope before commit:
   - no `.vcsdd/features/life-manager-daily-preflight/**` path
   - no daily-preflight product/test-support/script path
   - no canonical consolidation spec modification
   - cumulative release product delta matches the reviewed PANEL-only product delta, except intentional current-dev conflict resolutions documented line-by-line
   - `git diff --check` passes
6. Run from `apps/life-call` on the release worktree:
   - corrective4 logout test
   - corrective3 four-blocker test
   - permanent-session test
   - focused PANEL suite used by the prior gate
   - full `npm test`
   - `node --test evals/life-manager-panel.test.js` if present; otherwise locate and run the same 33-case panel eval command from existing evidence/package scripts
   - API and UI smoke fixture scripts
   Record exact totals, failures, and commands.
7. Run exactly one fresh-context, artifact-only review against the final code diff from the fresh `origin/dev`. Review only: stable/session/logout behavior, user/tenant isolation, panel↔chat state path, provider honesty, current-dev regression/contamination, and test weakening. Do not iterate on nits.
8. If the substantive review PASSes, add a concise evidence file under `.vcsdd/features/life-manager-panel-control-center/evidence/` with base SHA, source range/hash, conflict resolutions, exact verification totals, review verdict, zero side effects, and next gate `migration -> merge to dev -> staging smoke`.
9. Commit the release integration and evidence (one or two commits are fine), fetch/rebase onto latest `origin/dev` if it moved, rerun the substantive affected tests after any rebase, and push the new branch.
10. Open a new PR `feature/lm-panel-release -> dev`, with the PANEL-only provenance, verification totals, and explicit statement that PR #330 CORE 8d is excluded. Do not merge it.
11. Final report: release HEAD/upstream/remote/PR head equality, clean worktree, PR URL/state/checks, exact changed paths/scope proof, test totals, review result, and confirmation that migration/merge/deploy/provider/TG/email/call/L3 side effects are all zero.

## Stop conditions

- Stop only for a real destructive/schema/provider/broadcast authorization boundary or after three independent failed implementation methods for the same atomic.
- A moving branch, ordinary conflict, failing test, or missing optional tool is not a reason to wait; diagnose and continue.
- If a substantive blocker is found, reproduce it, record it in release evidence, push only safe evidence if appropriate, and report it. Do not broaden scope.

