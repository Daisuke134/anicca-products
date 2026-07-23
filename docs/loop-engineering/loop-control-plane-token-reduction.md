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
| 7 | Register or retire the remaining unregistered launchd agents one by one. Never bulk-mutate live runtime state. | 8 agents complete; 62 unregistered Anicca labels remain. Each increment changes one exact runtime label and records its owner/status. | 4–8 h |
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

### TODO 7 progress — agent 4: retired legacy daily-driver watchdog

- Implementation commit: `71b2203ca94825a1cf7511dd604fe98a480c8fe0` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.dd-keepalive-healthcheck` was a five-minute legacy supervisor that relaunched `dd-keepalive.py` whenever CDP port 9222 was unreachable.
- Current Gig passes call the canonical `ensure_browser.sh` recovery path before browser work. That path launches Chromium with bounded caches, restores the session vault, and runs tab cleanup; the legacy path does none of those recovery steps.
- Measured incident evidence on the same day: the legacy watchdog reported five consecutive relaunch successes from 20:06 through 20:26, but CDP was unreachable again at every next five-minute tick. The canonical recovery ran at 20:27 and the browser remained healthy afterward.
- Focused RED failed on the missing retirement label. GREEN reports `1 passed`; the complete launchd inventory suite reports `15 passed`; JSON parse and `git diff --check` succeed.
- Only the legacy watchdog label was booted out and disabled; its plist remains on disk. The active CDP listener stayed on PID `47417` before and after the stop, and `/json/version` continued to return the same browser WebSocket endpoint.
- Post-change inventory reports `registered=true`, `desired_state=disabled`, and `actual_state=disabled`. Unregistered coverage moves from 87 total / 67 Anicca to 86 total / 66 Anicca.
- One canonical recovery owner avoids competing relaunch strategies under Apple's launchd management boundary. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 5: registered all-slots earning health monitor

- Implementation commit: `f3adc15f107f8a8a0d49443724d8c3341b505080` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.earning-health-allslots` is retained and registered as an enabled registry-driven revenue healthcheck owned by `anicca`.
- The five-minute deterministic path evaluates two instrumented earning traces with one shared pure predicate. Six non-instrumented slots are logged as explicit coverage gaps and never receive fabricated healthy or barren verdicts.
- A sustained same-cause mechanism failure can invoke `self-fix.sh` at most once per slot per 24-hour escalation window. The self-fix path delegates to the shared `high-value-agent` runner, so registry attribution exposes its `Luna medium → Claude Sonnet` route.
- Measured runtime evidence: loaded-idle, 33 runs, last exit code `0`, current sol-trade state recognized as an intentional freeze without escalation, and polymarket-trade recognized as healthy. The checked-in and installed plists have the same SHA-256 digest.
- Focused RED failed on the missing registry label. GREEN reports `1 passed`; the complete launchd inventory suite reports `16 passed`. The feature's own shell wiring suite reports `40 passed`, and its pure predicate suite reports `18 passed`.
- No live restart or forced run was needed. Post-change inventory reports `registered=true`, `desired_state=enabled`, and `actual_state=loaded-idle`. Unregistered coverage moves from 86 total / 66 Anicca to 85 total / 65 Anicca.
- The single registry-driven scheduler follows Apple's launchd management boundary and avoids creating another per-slot job. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 6: registered deterministic lateness heartbeat

- Implementation commit: `7f6aa6c971fdd0954bb93b4f7698c6a14651f3ab` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.lateness-heartbeat` is retained and registered as enabled safety infrastructure owned by `openclaw-runtime`.
- Every five minutes it runs bounded Python calendar/location logic, then arrival closure. It makes no model call; only a real late-risk decision can trigger the existing phone or arrival action paths.
- The old OpenClaw `anicca-lateness-heartbeat-shell` cron is present but disabled, so launchd is the sole active scheduler. The deployed `run.sh` is byte-identical to the tracked Anicca copy.
- Measured runtime evidence: 35 launchd runs, last exit code `0`, and current live rows consistently end with `no-location`, `exit=0`. No external call, email, or forced validation run was triggered.
- Focused RED failed on the missing registry label. GREEN reports `1 passed`; the complete launchd inventory suite reports `17 passed`; shell syntax and both Python entrypoints parse successfully.
- Post-change inventory reports `registered=true`, `desired_state=enabled`, and `actual_state=loaded-idle`. Unregistered coverage moves from 85 total / 65 Anicca to 84 total / 64 Anicca.
- A single active scheduler follows Apple's launchd management boundary and keeps the disabled duplicate cron out of the execution path. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 7: retired leaked rollback integration probe

- Implementation commit: `323d3633e6ce8126a5483d658981e27981fc6570` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.probe-rollback-1782857566-85245-proactive` matches the timestamp/PID naming generated by the Darwin installer test `test_bootstrap_failure_rolls_back_disk_plist`. That test's contract says the canonical plist must not remain after simulated bootstrap failure.
- The leaked probe had run every five minutes since July 1, selecting a zero-value `pending` item whose note says `menu.json malformed; investigate`. No production consumer or dependency references its exact slot.
- Investigation found 6,412 unconsumed probe task descriptors. Keeping the test label active adds another malformed-menu descriptor each tick and cannot perform production work.
- Focused RED failed on the missing retirement label. GREEN reports `1 passed`; the complete launchd inventory suite reports `18 passed`; JSON parse and `git diff --check` succeed.
- Only this exact probe label was booted out and disabled. Its plist, slot directory, and existing 6,412 descriptors remain untouched as evidence; task count stayed constant across the stop.
- Post-change inventory reports `registered=true`, `desired_state=disabled`, and `actual_state=disabled`. Unregistered coverage moves from 84 total / 64 Anicca to 83 total / 63 Anicca.
- Removing a leaked test scheduler from the active domain follows Apple's launchd management boundary. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

### TODO 7 progress — agent 8: retired stale runtime-loop watchdog

- Implementation commit: `19b6efe40759461bd7d4f75ce69050468a7c9abe` on `origin/deploy/gig-speedy-reply-cutover`.
- `ai.anicca.runtime-loop-healthcheck` ran every five minutes (`288` passes/day). Its tracked and installed plists are byte-identical, and launchd reported 35 runs with last exit code `0` before retirement.
- The script's active target list had drifted to two entries: the live `ai.anicca.franklin-loop` and the removed `ai.anicca.founder-loop`. The latter is absent from `launchctl list` and `launchctl print`, but the watchdog still classified it as a dead KeepAlive job and attempted a failed kickstart on every pass.
- The retained logs contain 3,385 paired false `DEAD` and `Could not find service "ai.anicca.founder-loop"` events. Franklin does not need this process-death fallback because its own plist is already `KeepAlive`; its PID remained `1450` before and after this exact-label cutover.
- Focused RED failed on the missing retirement label. GREEN reports `1 passed`; the complete launchd inventory suite reports `19 passed`; JSON parsing succeeds.
- Only `ai.anicca.runtime-loop-healthcheck` was booted out and disabled. Its installed plist and logs remain untouched as evidence.
- Post-change inventory reports `registered=true`, `desired_state=disabled`, and `actual_state=disabled`. Unregistered coverage moves from 83 total / 63 Anicca to 82 total / 62 Anicca.
- Removing the stale scheduler from the active domain follows Apple's launchd management boundary. Source: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

**Next unfinished item:** TODO 7 continues with `ai.anicca.sol-trade-earning-healthcheck`; 62 unregistered Anicca labels remain and runtime changes continue one label at a time.

## Current execution boundary

Items 1–6 and their live Gig cutover are complete. TODO 7 agents 1–8 are complete. The next work investigates `ai.anicca.sol-trade-earning-healthcheck` and changes only that exact label after its register-or-retire decision is verified; it does not bulk-mutate runtime state or force a customer-visible action merely for validation.

## Definition of done

- An unchanged poll with the same buyer feedback and a valid accepted artifact makes zero model calls.
- A new material event makes at most one bounded model call.
- Existing artifacts move through delivery reconciliation or await-buyer state without reconstruction.
- Every call records task label, route, token usage, and budget decision.
- Per-pass and daily budget breakers stop excess calls without duplicating external actions.
- Targeted behavioral tests, Gig integration tests, and launchd registry checks pass from a clean implementation commit.
- This document is updated with exact evidence and the next unfinished item.
