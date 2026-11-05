# Naive Capafy Cloud Research — Remaining Tasks

## Ordered execution

- [x] T001 Verify Naive model/tool/API capabilities and provision the scoped Capafy agent. Readback: `agt_y3zd3mkztbr079xc7xsg7wq5c7`, DeepSeek V4.1 Flash, deny-by-default, browser scoped to Capafy with writes, CAPTCHA, saved login, and proxy disabled.
- [x] T002 Run bounded real cloud-browser sessions and verify session IDs, browser evidence, output sources, and spend. Version-5 session `ses_anq4yrf8wqt2paqkzbsbje4qe9` used `14318` micro-USD, returned two findings, and successfully called `ls` and `browser`; Computer ID `cmp_01a1a8f268e9758098a55b78f69a0abb`; Browser Session ID `brw_zqba5ngyntadqfm83g7bk14nfq`; browser event Computer ID empty; Computer `browser: null`. Browser-only comparison `ses_vm5zz6qehhvmv5tdqqdyhh2mjw` did not call `ls`, had no Computer ID, consumed `14076` micro-USD, and produced no structured output. Do not claim same-VM execution.
- [ ] T003 Generate bounded Naive reports outside the paid request path and persist validated snapshots in the existing Netlify Blobs store. Set freshness and refresh cadence from buyer value and measured spend; return unavailable without a payment challenge if no fresh snapshot exists.
- [ ] T004 Replace the current `verify -> Naive session -> settle` request path. Load and validate a snapshot first, verify the fixed payment terms, persist a recovery record, settle immediately, then return the already-loaded snapshot. Recovery must retry the exact original signed payment and requirements after `settlement_pending`, `duplicate_settlement`, or a lost response; it must not regenerate the report or request a new authorization while the original operation is unresolved.
- [ ] T005 Replace the old 15-test contract with focused tests for no charge when no snapshot exists, verify-before-settle with no costly work between them, durable recovery of the same signed operation, duplicate/replayed requests, successful receipt delivery, and no false revenue evidence. The earlier 15/15 run covered the superseded settle-after-agent design and is not acceptance for this revised flow.
- [ ] T006 Configure the minimum Vetta scopes (`agents:read`, `sessions:read`, `sessions:write`) and agent ID, then measure Vetta snapshot-refresh cost, paid-delivery count, PayAI fees, and Netlify marginal delivery cost to set a positive-contribution price. A fresh reviewer identified the pending/ambiguous-settlement gap; no production key has been created. After code is accepted, store any issued Vetta secret only in Credential SSOT and install it through an authorized repository/runtime secret route.
- [ ] T007 Deploy from merged main, publish the endpoint where x402 buyers can find it, and verify one independent paid request, facilitator receipt, and matching Base transaction. Record any settled-charge/report-delivery failure and refund handling.
- [ ] T008 Record and publish the demo only after T007 has a third-party revenue receipt; keep the recording free of secrets.

## Current cursor

T003. Two successful bounded Naive sessions prove cloud-browser report generation, not sales. No independent buyer, settled payment, Base transaction, or revenue has been verified. The current endpoint implementation performs costly Naive work between `/verify` and `/settle`, contrary to PayAI's current exact-payment guidance, and has no durable recovery path for an ambiguous settlement. No production Vetta key is configured.

## Order change

Previous sequence: implement `verify -> Naive -> settle`, test that ordering, run a cloud session, configure production, sell, and record. New sequence: first preserve the completed cloud-session evidence, generate and validate a bounded snapshot outside the paid path, then `verify -> immediate settle -> deliver cached snapshot`, reconcile the same exact authorization after ambiguous settlement, test, configure production, sell, and record. Reason: PayAI says verification does not reserve funds and recommends settling exact payments before costly inference; its recovery guidance requires preserving and reconciling the original operation rather than treating a lost response as payment failure. Current cursor: T003.

## Evidence boundary

The successful Naive run cost `14318` micro-USD (about `$0.014318`) before PayAI and Netlify costs. The `$0.15` price remains provisional. The current code is an unmerged prototype; the earlier focused tests passed for the superseded payment order. No independent sale or profit is proven. This report-selling pilot does not show an agent earning money on Capafy itself.
