# Loop control plane and token reduction

## Verified current state

- The dominant 24-hour token source is interactive Codex work, not launchd: Desktop/CLI main sessions account for 68.7% of raw tokens and parallel subagents account for 29.0%.
- Instrumented launchd loops account for 11,821,975 tokens. Gig uses 10,858,220 of those tokens and is the first loop to optimize.
- The latest Gig request has an accepted v7 artifact, while the same buyer feedback remains pending and formal delivery is not observed. The current workflow can rebuild work that already exists.
- `ai.anicca.hf-gig-pass` is loaded and idle on minutes `0` and `30`; its post-cutover state is not running with no forced run. The Gig auditor is loaded and idle on minute `45`.
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
| 4 | [x] Build bounded context packets instead of replaying full histories. | `4afda9d16cc49aa0d23ca6abc15b49e9e38f975e`; PAID_WORK, formal delivery, and reply composition use allowlisted packets capped at 8,192 bytes with exact byte/token-ceiling metrics; huge-history fixtures pass. | 2–4 h |
| 5 | [x] Enforce model routing: Terra medium for bounded composition/tool work, Luna medium for normal agent decisions, high/Sol only for explicit escalation. | `7ed12558dd97004832edf5fcad3247d4ccf35e5c`; every attempt, usage event, and summary records route/escalation fields; missing-reason escalation exits before provider invocation. | 1–2 h |
| 6 | [x] Add per-pass and per-loop token budgets with a circuit breaker. | `4080a5c2046b1e9c1ced6db5970f57c013f4aa27`; reservation/settlement ledger fixtures stop the next provider call with exit 75 and distinguish pass from loop-daily exhaustion. | 2–3 h |
| 7 | Register or retire the remaining unregistered launchd agents one by one. Never bulk-mutate live runtime state. | 3 agents complete; 67 unregistered Anicca labels remain. Registry coverage is complete and each runtime label has an owner/status. | 4–8 h |
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

### TODO 4 — bounded context packets

- Implementation commit: `4afda9d16cc49aa0d23ca6abc15b49e9e38f975e` on `origin/deploy/gig-speedy-reply-cutover`.
- A shared deterministic packet builder enforces at most 8,192 encoded bytes, 24 top-level fields, 512 bytes per string, 8 list items, 24 map items, and depth 4. Each serialized packet records its exact byte count and a provider-independent conservative token ceiling.
- Thin Gig allowlists now cover all production model inputs: `gig_paid_work`, `gig_paid_delivery`, and `gig_reply_composition`. Buyer/title fields, raw message histories, and stable artifact paths do not enter paid-work or delivery packets.
- Reply composition retains only the latest eight conversation rows and truncates each body through the shared packet contract; a 101-row oversized-history fixture proves the earliest rows never enter the prompt.
- Focused RED initially reported 3 failures for the missing delivery/reply packet functions and full-history reply prompt; GREEN reports `8 passed, 2 subtests passed`.
- All `skills/gig-work/tests/test_gig_*.sh` fixtures pass. The paid-work and formal-delivery wiring fixtures assert the packet kind and `max_bytes=8192` inside the actual runner prompt.
- `python3 -m pytest -q skills/gig-work/tests` reports `244 passed, 116 subtests passed`.
- `python3 -m py_compile`, `bash -n`, and `git diff --check` exit successfully.
- Remote verification: implementation HEAD and `origin/deploy/gig-speedy-reply-cutover` both resolve to `4afda9d16cc49aa0d23ca6abc15b49e9e38f975e`.
- The live LaunchAgent remains unchanged until TODO 1–6 pass together.

### TODO 5 — explicit model routing

- Implementation commit: `7ed12558dd97004832edf5fcad3247d4ccf35e5c` on `origin/deploy/gig-speedy-reply-cutover`.
- `composition-agent` and `tool-agent` resolve to `terra-medium-bounded`; `repeatable-agent`, `diagnostic-agent`, `marketing-agent`, and `high-value-agent` resolve to `luna-medium-decision`.
- `gpt-5.6-sol` and every `effort=high` candidate exist only in `escalation-agent`. The runner rejects that route before provider invocation unless a nonempty `--escalation-reason` is present, and rejects escalation reasons on normal routes.
- Every attempt row, usage-ledger event, and run summary records `route`, `escalated`, and `escalation_reason`. The escalation fixture proves the rejected run never invokes Codex and the accepted run persists the same reason in all three records.
- `python3 -m pytest -q skills/gig-work/tests/test_agent_runner.py skills/gig-work/tests/test_telegram_reporting.py` reports `44 passed, 49 subtests passed`.
- `python3 -m pytest -q skills/agent-runner/tests` reports `9 passed, 18 subtests passed`.
- `python3 -m pytest -q skills/gig-work/tests` reports `245 passed, 119 subtests passed`.
- `bash skills/gig-work/tests/test_gig_pass_launchagent.sh` passes and verifies the checked-in Gig registry route map and explicit-escalation contract.
- JSON parse, Python compile, and `git diff --check` succeed.
- Remote verification: implementation HEAD and `origin/deploy/gig-speedy-reply-cutover` both resolve to `7ed12558dd97004832edf5fcad3247d4ccf35e5c`.
- The live LaunchAgent remains unchanged until TODO 1–6 pass together.

### TODO 6 — pass and loop token circuit breakers

- Implementation commit: `4080a5c2046b1e9c1ced6db5970f57c013f4aa27` on `origin/deploy/gig-speedy-reply-cutover`.
- The shared runner reserves a task-class token allowance under a file lock before each provider attempt, then replaces the reservation with provider-reported usage. Missing usage or a crash remains charged at the reservation amount, so failure cannot reopen budget.
- Gig production policy is 65,536 tokens per pass and 262,144 tokens per UTC day. The six-hour reality auditor uses a 32,768-token pass cap and shares the same Gig daily ledger.
- Task reservations are 16,384 for bounded composition, 24,576 for bounded tools, 32,768 for routine Luna decisions/diagnostics, 49,152 for marketing, and 65,536 for high-value or explicit escalation work.
- A blocked reservation exits `75` before another provider process starts. Summary and reservation-ledger evidence distinguish `pass_token_budget_exceeded` from `loop_daily_token_budget_exceeded`; the reality auditor records `budget_blocked` without misclassifying the circuit break as a judge crash.
- RED reported 3 focused failures before the budget module and runner breaker existed. GREEN reports `3 passed` for reservation/settlement, crash retention, same-pass blocking, and next-pass daily blocking; the provider-call fixture remains at exactly one invocation.
- `python3 -m pytest -q skills/agent-runner/tests` reports `11 passed, 18 subtests passed`.
- `python3 -m pytest -q skills/gig-work/tests` reports `246 passed, 119 subtests passed`.
- All 17 `skills/gig-work/tests/test_gig_*.sh` fixtures pass; `node --test skills/gig-work/__tests__/gig-reality-verify.test.mjs` reports `22 passed`.
- Both launchd plists lint; JSON parse, Python compile, shell syntax, and `git diff --check` succeed.
- Remote verification: implementation HEAD and `origin/deploy/gig-speedy-reply-cutover` both resolve to `4080a5c2046b1e9c1ced6db5970f57c013f4aa27`.
- The live implementation checkout is fast-forwarded to the same commit without touching the existing Writer queue deletion or in-progress untracked file.
- The installed Gig pass and auditor plists are byte-identical to their checked-in sources. `launchctl print` reports pass triggers at minutes `0` and `30` with call limit `1`, legacy maintenance off, pass budget `65536`, and daily budget `262144`; the auditor remains at minute `45` with budget `32768` and the same daily cap.
- Neither agent is force-started during cutover. Both are loaded, not running, and show zero runs since bootstrap, so validation causes no customer-visible action.
- Fresh post-cutover verification from the live checkout reports `257 passed, 137 subtests passed` across Gig and shared runner tests; all 17 Gig shell fixtures and all 22 reality-verifier Node tests pass.

### TODO 7 progress — agent 1: retired Slack metrics poller

- Implementation commit: `92e3b8cd87b8db17a0a861d1f83acf710732d5fd` on `origin/deploy/gig-speedy-reply-cutover`.
- Before retirement, `ai.anicca.slack-metrics-poller` was an unregistered, loaded-idle one-minute job with 1,440 scheduled runs per day. `launchctl print` reported 159 runs and last exit code `1`; its latest 40 log rows all reported `API not ok: account_inactive`.
- Slack documents `account_inactive` as: “Authentication token is for a deleted user or workspace when using a bot token.” Because another one-minute retry cannot repair that account state or produce a task, this agent is explicitly retired rather than registered as enabled. Source: [Slack `conversations.history`](https://docs.slack.dev/reference/methods/conversations.history).
- The fragmented registry records owner `openclaw-runtime`, role `retired-slack-metrics-poller`, desired state `disabled`, no task classes, and the measured retirement reason. Focused RED failed on the missing registry label; GREEN reports `1 passed`, and the complete launchd inventory suite reports `12 passed`.
- The live checkout is fast-forwarded to the implementation commit without touching the existing Writer queue deletion or in-progress file. Only this exact launchd label was booted out and disabled; its plist remains on disk for reversible recovery.
- Post-change inventory reports `registered=true`, `desired_state=disabled`, and `actual_state=disabled`. Unregistered coverage moves from 90 total / 70 Anicca to 89 total / 69 Anicca.
- Apple describes `launchd` as improving “the ability of administrators to manage the daemons running on a given system”; the one-label registry/runtime reconciliation follows that management boundary. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 2: registered bounty core healthcheck

- Implementation commit: `73f36b5ed1e25a55344e0960f1eeda33614eb0d6` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.bounty-core-healthcheck` is retained and registered as an enabled deterministic recovery guard owned by `profitable-claude`, with no direct model task class.
- Its five-minute path checks the bounded daily pass lock and heartbeat, then exits without a model call while the heartbeat is younger than 1,560 minutes. Only a stale heartbeat delegates recovery by kickstarting the already-registered `ai.anicca.hf-bounty-daily`; it does not create another resident provider process.
- Measured runtime evidence before registration: loaded-idle, 32 runs, last exit code `0`, and consecutive fresh-heartbeat log rows. The checked-in and installed plists have the same SHA-256 digest. The daily bounded driver is loaded and idle; validation does not force-start either label.
- Focused RED failed on the missing registry label. GREEN reports `1 passed`; the combined launchd inventory and legacy revenue-core suite reports `20 passed, 10 subtests passed`; JSON parse and plist lint succeed.
- Post-change inventory reports `registered=true`, `desired_state=enabled`, and `actual_state=loaded-idle`. Unregistered coverage moves from 89 total / 69 Anicca to 88 total / 68 Anicca.
- The implementation follows Apple's launchd management model while retaining one explicit scheduler label and one bounded recovery label. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 3: retired orphaned bounty proactive queue

- Implementation commit: `97bb57a7a46dc5fde5f098b27480fae9da1ae000` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.bounty-proactive` was a separate five-minute legacy dispatcher outside the current bounded bounty daily driver and deterministic healthcheck.
- The dispatcher selected `submit-bounty` on every measured tick and appended another descriptor under `~/loops/bounty/tasks`. Repository searches found the producer and tests but no bounty task consumer. The pending directory contained 3,675 unconsumed descriptors during investigation and 3,676 immediately before retirement.
- This path is retired instead of enabled because continued production grows an orphan queue, and a later consumer activation could duplicate bounty work already owned by the bounded daily driver.
- Focused RED failed on the missing retirement label. GREEN reports `1 passed`; the complete launchd inventory suite reports `14 passed`; JSON parse and `git diff --check` succeed.
- Only this label was booted out and disabled. Its plist and the existing task descriptors remain untouched for evidence and reversible recovery. The task count stayed at 3,676 across the live stop operation.
- Post-change inventory reports `registered=true`, `desired_state=disabled`, and `actual_state=disabled`. Unregistered coverage moves from 88 total / 68 Anicca to 87 total / 67 Anicca.
- The one-label retirement keeps scheduling ownership explicit under Apple's launchd management boundary. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

**Next unfinished item:** TODO 7 continues with `ai.anicca.dd-keepalive-healthcheck`; 67 unregistered Anicca labels remain and runtime changes continue one label at a time.

## Current execution boundary

Items 1–6 and their live Gig cutover are complete. TODO 7 agents 1–3 are complete. The next work investigates `ai.anicca.dd-keepalive-healthcheck` and changes only that exact label after its register-or-retire decision is verified; it does not bulk-mutate runtime state or force a customer-visible action merely for validation.

## Definition of done

- An unchanged poll with the same buyer feedback and a valid accepted artifact makes zero model calls.
- A new material event makes at most one bounded model call.
- Existing artifacts move through delivery reconciliation or await-buyer state without reconstruction.
- Every call records task label, route, token usage, and budget decision.
- Per-pass and daily budget breakers stop excess calls without duplicating external actions.
- Targeted behavioral tests, Gig integration tests, and launchd registry checks pass from a clean implementation commit.
- This document is updated with exact evidence and the next unfinished item.
