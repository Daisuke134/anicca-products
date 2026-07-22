# PANEL 8g — manager-approved corrective Phase 1c and full build

You are a fresh Sol builder/executor/verifier. Resume only §10 row 8g from product worktree `/Users/anicca/anicca-project/.worktrees/panel-8g-score-semantics`, branch `feature/panel-8g-score-semantics`, exact clean/upstream commit `0d62f9eade3614ee51caefbe9d444cf9d346f0d5`.

The manager is the Architect/adjudicator. The user explicitly requires no human approval in the loop. This order is the explicit Architect approval required by the VCSDD escalation for exactly one additional corrective Phase 1c cycle. Do not ask the user. Do not broaden review scope.

## Close exactly the four iteration-3 blockers

Read the iteration-3 verdict and FIND-001..004 only. Correct the behavioral and verification architecture contracts as follows, preserving all already-closed requirements:

1. **One RPC contract**: remove contradictory requirements that the HTTP request contain four direct PostgREST `uid/organ/gte/lt` filters. The endpoint makes one RPC call with exact authenticated `p_uid` and four exact period objects. The executable SQL/RPC tests must prove the function itself applies `uid = p_uid`, organ, inclusive start, and exclusive end for each period.
2. **Revision/idempotency**: replace status-based uniqueness with an explicit immutable revision/idempotency key. Exact retry of the same semantic write is idempotent, while legitimate status re-entry and same-status correction can append a new revision. Define the exact unique tuple, input validation, append-only rule, and deterministic winner order/tie-breaker.
3. **RPC security**: pin executable function security. Prefer `SECURITY INVOKER` with table SELECT available only to `service_role`; revoke all function privileges from `PUBLIC`, `anon`, and `authenticated`; grant EXECUTE only to `service_role`; set a safe fixed `search_path=public, pg_temp`; prove browser/authenticated roles cannot supply another tenant UID or execute/read the function/table. If a different security mode is justified, it must be at least as restrictive and explicitly tested.
4. **Real PostgreSQL harness**: name and implement an executable local/ephemeral PostgreSQL migration harness covering real roles, RLS/grants/function denial, service-role success, statement-snapshot membership under two concurrent sessions, complete 20,000-row response, and 20,001 overflow without partial score. Static SQL inspection or mocks alone are insufficient.

Run one fresh artifact-only review limited to these four closures. Material new correctness/security contradictions may block; cosmetic or unrelated observations are non-blocking notes. If the four are closed, record Architect approval and advance legally to Phase 2a.

## Then complete the original order

Continue the full requirements in `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/.claude/sol-orders/order-panel-8g-score-semantics.md`:

- fixed-dataset genuine RED first;
- minimal GREEN implementation and refactor;
- deterministic score eval 100%;
- real endpoint/query, panel/API/tenant regressions, full Life Call tests, existing evals;
- additive migration with real PostgreSQL contract evidence;
- fresh material artifact-only implementation review;
- normal feature→dev→main PR flow;
- exact-SHA Railway production deploy/SUCCESS/health 200;
- one read-only Dais permanent `/panel` L3 proving UI = API = independent DB recomputation for all four organs, correct `insufficient_data`, reasons/source linkage, mobile/desktop, and zero mutations/provider side effects;
- mode-0600 `/Users/anicca/.codex/evidence/panel-8g-score-semantics-production-l3.json` plus private screenshots/hashes;
- clean worktree and no temporary auth material.

The manager owns the canonical planning spec and final done verdict. Do not edit that planning spec. Product code, VCSDD artifacts, tests, commits, pushes, PRs, merges, deploy, production L3, and private evidence are your responsibility.

Stop only on the original hard stop conditions or if this focused corrective review still proves one of the same four blockers unresolved. Do not request human approval merely because the former three-iteration limit was reached; this order supplies that approval.
