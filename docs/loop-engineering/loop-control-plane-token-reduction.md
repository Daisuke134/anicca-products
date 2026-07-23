# Loop control plane and token reduction

## Verified current state

- The dominant 24-hour token source is interactive Codex work, not launchd: Desktop/CLI main sessions account for 68.7% of raw tokens and parallel subagents account for 29.0%.
- Instrumented launchd loops account for 11,821,975 tokens. Gig uses 10,858,220 of those tokens and is the first loop to optimize.
- The latest Gig request has an accepted v7 artifact, while the same buyer feedback remains pending and formal delivery is not observed. The current workflow can rebuild work that already exists.
- `ai.anicca.hf-gig-pass` is idle with last exit code 1. The Gig auditor and core healthcheck are idle with successful last exits.
- OpenClaw has zero enabled SQLite cron jobs. The launchd strategy updater is loaded and idle.
- Current Gig targeted tests pass: 19 pytest cases and 5 paid-work gate subtests.

## Architecture target

```text
launchd pollers (deterministic, every 30 minutes)
        |
        v
state delta + idempotency gate
        |
        +-- no material change ----------------> record + stop (0 model calls)
        |
        +-- real customer/work event
                  |
                  v
          bounded context packet
                  |
                  v
          Terra/Luna medium runner
                  |
                  +-- explicit escalation only --> Luna high / Sol
                  |
                  v
 telemetry: task label + model + tokens + cost + revenue + budget decision
                  |
                  v
          daily circuit breaker / CEO allocator
```

launchd is the scheduling source of truth. A checked-in registry describes every managed agent, its owner, schedule, model route, budget, state path, and retirement status. Repository-specific adapters remain thin; state detection, idempotency, runner invocation, telemetry, and budget enforcement are shared components.

## Remaining TODO (SSOT)

| Order | Work | Done evidence | Engineering estimate |
|---:|---|---|---:|
| 1 | [x] Add a Gig feedback-hash and artifact idempotency gate. The same feedback plus a valid accepted artifact must not enter `PAID_WORK` again. | `6898b2710554fbdd0261f148f19a0f66b71ab1ef`; `test_delivery_project_integration.py` 9 passed; `test_gig_paid_work_gate.sh` passed and asserts unchanged accepted feedback never logs `gig-PAID_WORK`. | 1.5–3 h |
| 2 | [x] Route a valid existing artifact to delivery reconciliation or await-buyer state instead of rebuilding it. | `6898b2710554fbdd0261f148f19a0f66b71ab1ef`; 4 focused state-transition tests passed and the paid-work recovery replay passed without rebuilding the existing artifact. | 1–2 h |
| 3 | [x] Make 30-minute launchd polling deterministic and invoke a model only on a material event. | `afc9776b0e65ddf63ef530721e60e66f136955ce`; checked-in launchd minutes are `[0,30]`; poll-control replay records new feedback=`1` call and unchanged/await/empty=`0` calls. | 2–4 h |
| 4 | Build bounded context packets instead of replaying full histories. | Fixtures prove stable field and byte/token ceilings. | 2–4 h |
| 5 | Enforce model routing: Terra medium for bounded composition/tool work, Luna medium for normal agent decisions, high/Sol only for explicit escalation. | Every invocation records route and escalation reason. | 1–2 h |
| 6 | Add per-pass and per-loop token budgets with a circuit breaker. | Over-budget fixtures stop further calls and emit a reason. | 2–3 h |
| 7 | Register or retire the remaining unregistered launchd agents one by one. Never bulk-mutate live runtime state. | Registry coverage is complete and each runtime label has an owner/status. | 4–8 h |
| 8 | Add OpenTelemetry-compatible task attribution for tokens, estimated cost, revenue, and outcomes. | A daily report reconciles runner ledgers to task labels. | 3–5 h |
| 9 | Canary the Claude fallback when availability returns. | One bounded fixture proves failover without duplicate customer action. | 0.5–1 h |
| 10 | Complete the Coconala state machine from listing and fast reply through application, delivery, acceptance, payout, and banked revenue. | A sandbox or controlled real transaction reaches `banked` with an audit trail. | 1–2 engineering days plus external buyer time |
| 11 | Revive the CEO allocator only after trustworthy cost/revenue telemetry exists. | At least seven days of observations drive bounded allocation decisions. | 3–5 h plus 7 days |
| 12 | Add gig-site adapters and consolidate shared components into the canonical monorepo incrementally. | Each adapter passes the same contract suite; old code becomes a thin shim or is retired. | 1–3 days per adapter; 2–4 days consolidation |
| 13 | Run zero-human soak tests. | Seven-day stabilization, then fourteen-day production observation, with no duplicate action or budget breach. | 21 calendar days |

## Incremental completion evidence

### TODO 1 — feedback/artifact idempotency

- Implementation commit: `6898b2710554fbdd0261f148f19a0f66b71ab1ef` on `origin/deploy/gig-speedy-reply-cutover`.
- RED: the replay initially failed because `resolve_workflow_action` did not exist and the unchanged accepted-artifact pass re-entered `PAID_WORK`.
- GREEN: `python3 -m pytest -q skills/gig-work/tests/test_delivery_project_integration.py` reports `9 passed`.
- GREEN: `bash skills/gig-work/tests/test_gig_paid_work_gate.sh` reports `PASS`; its unchanged-artifact replay asserts the runner log contains no `gig-PAID_WORK` entry.
- Static verification: `python3 -m py_compile`, `bash -n`, and `git diff --check` exit successfully.
- Remote verification: the implementation HEAD and `origin/deploy/gig-speedy-reply-cutover` both resolve to `6898b2710554fbdd0261f148f19a0f66b71ab1ef`.

### TODO 2 — existing artifact reconciliation

- Implementation commit: `6898b2710554fbdd0261f148f19a0f66b71ab1ef` on `origin/deploy/gig-speedy-reply-cutover`.
- `python3 -m pytest -q skills/gig-work/tests/test_delivery_project_integration.py -k 'accepted_artifact_bootstraps_feedback_idempotency_without_rebuilding or delivered_artifact_with_unchanged_feedback_awaits_buyer or new_buyer_revision_reopens_accepted_artifact_project_once or valid_pending_browser_delivery_is_reused_without_rebuilding'` reports `4 passed`.
- Artifact-present routes to `deliver_existing`; an already buyer-visible artifact routes to `await_buyer`; a different feedback hash routes to `act`.
- `bash skills/gig-work/tests/test_gig_paid_work_gate.sh` passes its recovery replay: the browser retry reuses the stable artifact/hash/acceptance bundle, does not invoke `gig-PAID_WORK`, reconciles buyer visibility, and then waits for buyer feedback.

### TODO 3 — deterministic poll and material-event call gate

- Implementation commit: `afc9776b0e65ddf63ef530721e60e66f136955ce` on `origin/deploy/gig-speedy-reply-cutover`.
- The canonical Gig launchd source uses `StartCalendarInterval` at minutes `0` and `30`; the checked-in registry records the same schedule and `model_call_limit_per_pass=1`.
- `poll-control.json` replay evidence records `material_event_handled` with `model_calls=1` and label `gig-PAID_WORK` for new feedback.
- The next identical accepted-artifact poll records `no_change`, `model_calls=0`, and an empty label list. Await-buyer and empty-queue fixtures also complete without a runner invocation.
- Reply processing accepts at most one composition per poll and defers additional pending threads.
- All `skills/gig-work/tests/test_gig_*.sh` fixtures pass.
- `python3 -m pytest -q skills/gig-work/tests` reports `239 passed, 116 subtests passed`.
- Related launchd tests report `30 passed`; plist lint, JSON parse, shell syntax, and `git diff --check` succeed.
- The live LaunchAgent remains unchanged until the single reversible final cutover after TODO 1–6 pass together.

**Next unfinished item:** TODO 4 — bounded context packets with stable field and byte/token ceilings.

## Immediate execution boundary

The next session completes items 1–6 for Gig before expanding to other loops. It does not force a customer-visible message or formal delivery merely to validate code. It preserves the current buyer state and uses replay fixtures for verification.

## Definition of done

- An unchanged poll with the same buyer feedback and a valid accepted artifact makes zero model calls.
- A new material event makes at most one bounded model call.
- Existing artifacts move through delivery reconciliation or await-buyer state without reconstruction.
- Every call records task label, route, token usage, and budget decision.
- Per-pass and daily budget breakers stop excess calls without duplicating external actions.
- Targeted behavioral tests, Gig integration tests, and launchd registry checks pass from a clean implementation commit.
- This document is updated with exact evidence and the next unfinished item.
