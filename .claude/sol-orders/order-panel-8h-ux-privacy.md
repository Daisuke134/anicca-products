# Sol order: §10 row 8h PANEL-b — panel UX / privacy

## Role and source of truth

- You are the Sol executor: build, execute, verify, write scoped VCSDD artifacts, commit, and push.
- The root/main session is planner, adjudicator, spec writer, and final verifier. Do not ask it to implement.
- Canonical product repo: `/Users/anicca/anicca-project`.
- Canonical spec: `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`.
- Read §9.9, §9.5, §10 row 8h, §10.0, and §10.2 before acting. §10 is the only live state.
- Work from current `origin/main` in a dedicated branch/worktree. Preserve all unrelated user work; never reset or clean another worktree.

## Scope

Complete only row 8h:

1. The authenticated personalized `/panel` timeline shows human events, never raw DB rows, JSON dumps, table names, stack traces, secret fragments, internal prompts, or provider logs.
2. A timeline item states, in one concise human sentence, what happened or could not happen and what happens next. Do not hide honest failures.
3. The five panel areas remain usable and understandable on mobile and desktop: timeline, four-organ score surface, financial ledger, context gates, and settings/connections/control center.
4. Preserve the permanent canonical `/panel`, tenant isolation, personalization, and all working controls from rows 8d.1/8d.2/8g. No hardcoded Dais data and no cross-user fallback.
5. Do not change §9.11 copy directly. If wording outside the already-approved contract is necessary, record a proposal only.

Out of scope: score formula changes, connector/provider mutations, new features, marketing, organ work, production data mutation, and cosmetic adversarial nits.

## VCSDD / TDD execution

1. Create the smallest scoped VCSDD feature for `panel-8h-ux-privacy` and move through the legal phases. Reviews must be fresh-context and artifact-only.
2. Write the deterministic privacy/semantic eval and executable tests first. Prove RED before implementation. Include benign real-shaped fixtures and malicious/private-shaped fixtures: raw JSON, DB/table/internal field names, stack traces, provider payload/log text, secret-like values, prompt text, HTML/script injection, malformed/null fields, and honest failure/next-action cases.
3. Implement the smallest presentation DTO/sanitization and rendering changes. Never use `JSON.stringify` or raw-object fallback in the UI.
4. Prove GREEN with focused tests, full `apps/life-call` regression, existing evals including score semantics, tenant/auth/control tests, privacy scan, semantic assertions, and local authenticated-browser-equivalent rendering at mobile and desktop widths.
5. Run a fresh implementation review focused only on material privacy, semantic, runtime, tenant, and regression failures. Route real findings through RED→GREEN; do not expand into style review.
6. Commit and push the isolated feature branch with explicit scoped staging. Report exact commit/upstream SHA and all commands/results to the manager.

## Release boundary

- Row 8g is merged but its Railway production deployment/L3 is externally blocked at order creation time.
- Therefore this order authorizes isolated spec/eval/RED/build/GREEN/review/commit/push only.
- Do **not** open a merge PR, merge, deploy, migrate production, send TG/email/call, mutate providers, or run production L3 until the manager explicitly reports row 8g production L3 PASS and releases this gate.

## Acceptance evidence to hand back

- Genuine RED and GREEN counts, full regression/eval counts, and fresh review verdict with zero material findings.
- Exact list of changed files and branch/upstream commit SHA.
- Privacy scan proving zero raw log/secret/internal prompt/table/stack/provider leakage in rendered surfaces.
- Semantic assertions for all five areas and mobile/desktop screenshots from the isolated environment, with private artifacts mode `0600`.
- Explicit proof that tenant scoping, permanent `/panel`, controls, and the 8g score contract remain green.
- Provider/production/external-message side effects must remain zero under this order.

## Monitoring

- Append concise progress lines to `/Users/anicca/anicca-project/.claude/sol-orders/logs/panel-8h-collab-progress.log` (mode `0600`) at every phase transition, RED, GREEN, review, commit, and blocker.
- A self-report is not completion evidence. The manager will independently inspect the heartbeat, worktree, tests, artifacts, and pushed SHA.
- If the same atomic approach fails three independent methods, record each false hypothesis and stop that atomic cleanly; do not conceal the blocker.
