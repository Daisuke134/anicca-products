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
| 1 | Add a Gig feedback-hash and artifact idempotency gate. The same feedback plus a valid accepted artifact must not enter `PAID_WORK` again. | A replay fixture invokes the high-value runner zero times. | 1.5–3 h |
| 2 | Route a valid existing artifact to delivery reconciliation or await-buyer state instead of rebuilding it. | State-transition tests cover artifact-present, delivered, and buyer-revision cases. | 1–2 h |
| 3 | Make 30-minute launchd polling deterministic and invoke a model only on a material event. | No-change polls record zero model calls; a new event records one bounded call. | 2–4 h |
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
