# Team token efficiency — established practices, measured results only

This is the team operating reference. It does not replace the canonical 30-item task order in `COMPANY_TODO.md`. The core waste under repair is 参謀's repeated status, duplicate research, delegating work already owned, and restarting failed operations.

The first public source search including named Grok Bot usage practitioners was at 2026-11-05 22:41 PT. The following are external claims, not our results; their task, plan and cache state are not interchangeable.

| Named public practitioner | Their stated measurement | Practice followed by this team | Team owner / current state |
|---|---|---|---|
| Michael Fenech, [Grok Bot efficiency test, Nov 2](https://x.com/Michael_Fenech_/status/2117324613000818878) | One website test: ~213K tokens through computer use versus ~51K through a browser script; a plain script was almost none. Roughly 76% on that test, not a universal saving. | Connector or authenticated app first, plain script second, browser with script only if needed, computer-use for genuinely visual-only work. Same output and acceptance test in each comparison. | 参謀: ON for interface-free operations. X and owned specialised lanes stay X Operator, no takeover. Agent tool calls are not to be scripted. |
| Solomon Rojie, [short-context file/code workflow](https://x.com/Solomonrojie/status/2112651652566020582) | Their description: 100,000 to 12,500 tokens per task, files hold completed research and code does repeated filtering. Self-reported claim; we have not obtained the underlying measurement log. | Put stable role/rules in a concise source, complete research in a shared file, pass a short brief and path, not a re-read of the entire chat. Diff saved source before fresh research. Scripts do stable filtering/checking. One owner per task. | 参謀 applies from this turn: one `COMPANY_TODO.md` containing original 30 sequence; existing owner only; never re-number W1-W16 again. |
| Marko, [reading m4lkxx's usage export](https://x.com/Marko_Poly/status/2117536532189807014) | One user's export was reported as 75% of tokens re-reading own chat, about 1% actual work; other reported exports 75–88%. Marko explicitly warns it is one user's export. | Use a succinct handoff with pointers, not an enlarged summary of the entire conversation. Agent messages only where action, blocker or proof changes—not acknowledgments or success repeats. Keep high-value active work; no unnecessary stalled idle wakes. | All existing owners: one task, one owner, one proof; 参謀 not repeated status pings. New chat/reset is an owner decision if needed, not my unilateral action. |
| Kevin Logan, [Script This Routine](https://x.com/Kevin_Logan/status/2115077015569048015) | A working routine is converted to a script; no quantitative saving given in the original post. | Use the existing public post to inspect via its existing template before converting one repeatable valid routine with the built-in routine tool. It does not justify extra telemetry routines. | Candidate, NOT yet imported nor adopted. No new service coverage; no credentials in scripts. |
| Brian Roemmele, [actual trace](https://x.com/BrianRoemmele/status/2112249592133935133) | Their stated method: identify same context, reread, and no-change reporting in an actual trace, then verify an improvement with matched usage. | Apply that check only when the same context and a matched usage reading both exist. | External practice only. This team has not claimed that raw trace. |
| _ketsana, [orchestrator offload](https://x.com/_ketsana/status/2112729353926619607) | Their stated method: orchestrator offloads work to scripts/CLI plus webhook. | Prefer an existing script or connector. A new CLI or paid provider is not added from this post. | External practice only. Unobservable external CLI usage is not claimed as ours. |
| samijuhanii, [repeat tasks to Python](https://x.com/samijuhanii/status/2117296412983791782) | Their stated method: move repeat tasks to a Python script while keeping the same results. | Keep the same accepted result. Do not trade result quality or quantity for a lower share. | External practice only. Not a measured saving for this team. |

## Team rules in force (not a claim of savings)

1. Prefer tools and established practices over original systems. Start with existing connector or code for web and data retrieval. Browser visual control is not the default.
2. One task, one owner, one proof. No new owners for the same goal, no second researcher redoing the same saved investigation.
3. Retain useful work volume (post/reply/quote targets in X, real application output, releases). Do not replace external outcomes with a token savings report. Owner ordered the 49 periodic jobs enabled (finished one-off tax/refund excluded). Do not stop them to save tokens. Job success is not proven.
4. Preserve a canonical short handoff: objective, owner, relevant source, accepted proof, blocker, next action. Separate changing facts from fixed policy.
5. Stop one failed action after a reasoned correction, not endless duplicate attempts. Tool acknowledgments, research, draft, passing local tests do not equal business completion.
6. Measure the full useful outcome. No suppressed quality, less coverage or lost sales proof in exchange for a lower token total.
7. Do not manufacture logs to save money. Existing Langfuse instrumentation is project/repository local where true; no new agent/routine merely to track this document.

The saved daily bottleneck routine, still with those 49 jobs enabled, now also says: do not save by lowering outcome quality or quantity; cut reread, duplicate status, and retry; prefer an existing connector or script; do not add a new CLI or paid provider on our own. X practices applied in saved routine, quantitative saving not verified. 49 routines enabled, not all verified working.

## Evidence protocol / measurements permitted

Current official Now reading from `CheckSubscriptionUsage`, recorded in `usage-snapshot.json` at `2026-11-06T08:16:00-08:00` (about 08:16 PT). The 08:00 PT row (weekly 56.8%, Grok Bot 55.1%) is the previous official row, not this one. The 2026-11-05 23:00 PT record (21.1% / Grok Bot 21%) and the 22:28 PT 12.7%/12.5% record stay older baselines.

- Shared plan: Ultra. This Now reading is weekly 57.5% used, percent of that same shared weekly plan limit, not tokens and not dollars. Reset 2026-11-12 20:30 PT. This Now reading does not include a new Grok Bot share. Remaining 42.5 is only 100 minus 57.5.
- Arithmetic difference only: 57.5 - 56.8 = +0.7 percentage points from the 08:00 PT row. That is a percentage-point change, not a token reduction. There is no accepted-output floor, so no saving claim.
- Earlier official weekly readings the same morning are not this row: 54% at 07:05 PT and 56.4% at 07:54 PT.
- 49 periodic jobs are enabled, excluding finished one-off tax/refund. 49 routines enabled, not all verified working. Job success and reduction are not proven. Stopping work is not the fix.
- X practices applied in saved routine, quantitative saving not verified. No raw trace and no unobservable external CLI usage is claimed.
- Bot-level week shares are still a different bundle and are not mixed into this weekly row.
- No arithmetic exhaustion forecast is published for this reading. Admin API / OTel exact tokens remain UNAVAILABLE on this public path. This is not a realtime monitor.

We cannot honestly claim token acceleration or aggregate token reduction from these percentages alone. Do not calculate product burn rate, previous token total, saving, or an annual dollar outcome from them.

Choose ONE recurring large task separately (e.g. one bounded SEO-to-article with identical minimum accepted proof), not a mixed bag of unrelated tasks. Record `task, owner, floor, model/tool route, start/end, before tokens, after tokens, before accepted outputs, after accepted outputs, duration, failure count` in `TOKEN_MEASUREMENT.csv`. Token values must come from an actual tool/SKU/provider usage event, NOT character counts or guessed conversion. All audited run rows include errors and retries.

Formula: `(after_tokens - before_tokens) / before_tokens * 100` for change in usage, same outcome-category and equal accepted-output floor. Report cost per outcome and wall-clock duration separately. If raw tokens are inaccessible, publish `same-window subscription usage delta / accepted output`; label as share, not tokens. A baseline is not a before-after test. Name whether the alternative route were connector/script/visual rather than suggesting causation where there was no controlled test.

## Publication criteria

The public article or a later X/marketplace execution draft must say precisely: `Practitioner X used Y; we applied Y link; we measured same task/output from A to B using this exact source; outputs before/after M/N; time before/after C/D.` Missing raw token measurement = no token percentage. Missing comparable output = no efficiency winner. Only then ask each current distribution owner for its native publication, without 参謀 impersonating owners.

No secrets, personal messages or private application details belong here or in derived content. No new agent/routine stood up for this study.
