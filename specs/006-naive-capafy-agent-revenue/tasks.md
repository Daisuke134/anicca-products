# Naive Capafy Cloud Research — Remaining Tasks

## Ordered execution

- [x] T001 Verify Naive model/tool/API capabilities and provision a browser-only agent for public Capafy research. Readback: `agt_y3zd3mkztbr079xc7xsg7wq5c7`, DeepSeek V4.1 Flash is in the live model catalogue, tool defaults deny, and the only enabled tool is browser scoped to Capafy with writes, CAPTCHA, saved login, and proxy disabled.
- [x] T002 Run one bounded real cloud-browser session; verify session ID, browser/computer evidence, output sources, and actual spend. Evidence: `ses_tptexj8ctg0n3jw06j74ttr7h3`, browser tool completed three times, browser session opened/closed, source URLs point to Capafy, and Vetta reports `$0.016373` consumed under a `$0.15` session cap. Vetta returned no dedicated `computer_id`; the browser session is verified, while a separately addressable computer attachment is not.
- [ ] T003 Implement the x402 paid report handler: verify payment → invoke Naive session → validate source-backed output → settle only on success.
- [ ] T004 Add focused tests for unpaid requests, successful execution/settlement ordering, and no settlement on agent failure or malformed output.
- [ ] T005 Set a price from measured marginal cost and configure production with a least-privilege Naive API key and agent ID.
- [ ] T006 Deploy from merged main and verify the live challenge, a successful independent paid request, settlement receipt, and matching Base transaction.
- [ ] T007 Record and publish the demo only after T006 has a third-party revenue receipt; keep the recording free of secrets.

## Current cursor

T003. One live cloud browser report is verified, but no buyer request, settlement, Base transaction, or revenue has yet been verified for this product.
