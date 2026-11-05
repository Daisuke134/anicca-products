# Naive Capafy Cloud Research — Feature Specification

**Feature Branch**: `feat/naive-capafy-agent-revenue-20261105`  
**Status**: Superseded / archival prototype — do not implement or deploy as Life Manager Cloud
**Owner**: Life Manager / Naive cloud agent

> このレポート販売試作はDaisの最新要件に合わないため終了する。現行の製品契約・部品選択・実行順・残TODOはLife Manager本体の `docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md`「Naïve browser company」現行契約だけを参照する。調査根拠は同repoの `docs/research/2026-11-05-cloud-runtime-lego.md`。以下は履歴であり、独自x402 endpoint・snapshot cache・決済サービスの追加開発を再開しない。既存の他x402製品はこの終了判断の対象外。

## Goal

Sell a useful, current report about Capafy’s public agent marketplace. A Naive-hosted agent must use Naive’s managed cloud browser to inspect public pages and produce the report. An independent buyer pays with x402 on Base. This is a report-selling pilot; it does not prove that the agent earns money on Capafy or that Life Manager is an autonomous company. Only an independent settled buyer payment, matching provider receipt, and Base transaction proves revenue.

## User experience

1. The buyer opens the public product endpoint and sees an x402 price, USDC/Base network, description, and sample output without an account or Google login.
2. The buyer asks for a Capafy market report and pays using a wallet-supported x402 client.
3. A bounded Naive cloud job generates a source-linked report before a buyer request and stores it as a time-stamped snapshot. A purchase is offered only while a valid fresh snapshot exists. The Computer and Browser Session IDs are distinct resources; this product does not claim the browser runs inside that Computer.
4. On a paid request, the server loads and validates the exact snapshot it will return, verifies the buyer’s signed payment, durably records the payment operation, then immediately settles that same authorization before returning the already-loaded report. It does not invoke Naive or perform other costly work between verification and settlement.
5. If settlement is pending or its response is lost, the server retains the exact payment payload, requirements, snapshot, and transaction evidence and retries/reconciles that same operation. It never asks the buyer to create a new authorization while the old operation is unresolved. A confirmed settlement returns the snapshot and facilitator receipt.
6. The operator can correlate endpoint request, Vetta session, x402 verify/settle response, payer, amount, and Base transaction without storing private wallet keys.

## Guardrails

- The agent may only read public Capafy pages (`capafy.ai` and its subdomains).
- No account creation, login, signup, form submission, purchases, content publication, CAPTCHA solving, or use of human credentials.
- Disable browser writes and CAPTCHA solving; do not enable saved login state or a proxy.
- Use only the Naive-managed cloud browser for research. Do not replace browser execution with a local scraper or static fixture in production. Do not describe the browser as running inside the agent Computer unless provider readback proves that link.
- Enable only `browser` and read-only `ls` alongside deny-by-default permissions. Call `ls` once on the home path returned by Computer inspect to provision the agent Computer; list names only and do not open files. Do not enable `bash`, `read`, `write`, `edit`, or `find`.
- Keep report generation outside the paid request path. Bound refresh cadence and per-run spend; a missing or stale report returns an unpaid unavailable response instead of charging a buyer.
- For exact EIP-3009 payments, `/verify` does not reserve funds. Settle immediately after verification and before paid work or delivery. Persist enough state to recover the same signed operation after `settlement_pending`, `duplicate_settlement`, or a lost response; do not infer payment success from HTTP status or a transaction hash alone.
- The payment recovery store contains the signed authorization temporarily. Do not log it, expose it to the browser, or retain it after terminal reconciliation; retain transaction and receipt evidence separately.
- Do not claim that Naive, Life Manager, or the buyer earned money unless an independent buyer payment is settled and verified on Base.
- A successful live Vetta report recorded `$0.014318` consumed under a `$0.10` session cap. The provisional `$0.15` price is not an all-in margin measurement: PayAI facilitator and Netlify marginal costs remain unmeasured. With cached snapshots, calculate contribution margin as price minus payment/delivery costs and the Vetta refresh cost allocated across paid deliveries of that snapshot. Do not describe the price as profitable until those costs and paid views are recorded.
- Do not self-purchase or fabricate a sale. Demo recording follows a real independent sale and settlement.

## Product response

Return JSON with:

- `product`: stable product identifier
- `generated_at`: UTC report completion time
- `agent_session_id`: Naive session identifier
- `agent_computer_id`: Naive session computer identifier
- `agent_browser_session_id`: Naive managed-browser session identifier
- `summary`: concise marketplace overview
- `findings`: observed listings/categories/trends, with each claim linked to a public source URL
- `limitations`: pages not reached or facts not independently verifiable

The response must distinguish page observations from agent inferences. If the agent cannot access Capafy or cannot cite supporting public pages, do not publish a paid snapshot.

## Acceptance criteria

1. When no recent, validated Naive snapshot is available, requests return an unpaid unavailable response; they do not issue a payment challenge or start a Vetta session.
2. A snapshot is generated by a bounded Naive session with only the managed browser and read-only `ls` enabled; the browser is scoped to Capafy domains. The agent lists names only in its inspected home directory to start its Computer, then researches with the managed browser. The stored snapshot includes the session Computer ID and managed Browser Session ID as separate audit fields.
3. Browser writes, CAPTCHA solving, human login, and persistent context are disabled. A successful `browser.session.opened` and `browser.session.closed` pair must share a nonempty browser session ID. The Browser event's `computer_id` may be empty and is not returned by the current handler; never infer that it equals the session Computer ID. Current Naive readback shows the agent Computer has `browser: null`, and its managed-browser tool opens a separate session.
4. A publishable snapshot contains nonempty findings. For every finding, its canonical source URL must equal the canonical URL requested by a successful browser `goto` and the URL returned in that call's completion output, then have a later successful `observe` or `extract` call in the same page state. A redirect or URL merely returned by `links` is not source evidence. Pair `tool.started` and `tool.completed` by `tool_call_id`, require the completed calls to be non-error, and require the opened and closed browser session IDs to match. Require Vetta's reported spend to be a finite nonnegative number no greater than the per-session cap. An invalid or malformed run is not published.
5. A paid request loads and validates its response snapshot before payment verification, verifies the fixed network, asset, recipient, amount, and resource, durably stores a recovery record, then immediately settles before delivery. No Naive session or other costly operation runs after verification.
6. For `settlement_pending`, `duplicate_settlement`, or a lost/ambiguous response, the endpoint preserves the original payment payload and requirements and retries the same settlement operation. A retry with that same payload returns the stored snapshot after confirmed settlement without regenerating it or asking for another authorization. HTTP status alone, a transaction hash alone, or an empty transaction field does not prove settlement.
7. A successful paid request returns the facilitator settlement receipt and payment transaction reference; the matching transaction is independently readable on Base and matches recipient, payer, asset, and amount.
8. The `$0.15` asking price remains provisional until Vetta snapshot-refresh cost, paid-delivery count, facilitator cost, and Netlify marginal delivery cost are recorded. Gross receipts and net profit are separate metrics.
9. Revenue is reported as proven only when a buyer other than the operator has paid and the facilitator settlement and Base transaction both verify.

## Out of scope

- Creating accounts or earning commission on Capafy or any other platform.
- KYC, payout accounts, bank details, wallets, or handling customer credentials.
- Automated posting, solicitation, or claims of guaranteed revenue.
- Self-replication across clouds or a $10K/$1M MRR claim.
- The report-selling pilot does not demonstrate that an agent independently earns money on Capafy or another marketplace.

## Evidence to keep

Record the branch/release SHA, Naive agent and session IDs, measured cloud cost, endpoint request ID, x402 verification and settlement receipt IDs, buyer/payer class (independent, with address redacted in public demo), Base transaction URL, and demo recording URL. Keep API keys and private keys out of logs, source, and recordings.

## Naive Computer and Browser evidence

Naive exposes a session Browser tool and an agent Computer, but current provider evidence shows they are separate. Version-5 session `ses_anq4yrf8wqt2paqkzbsbje4qe9` used `ls` successfully and the managed Browser successfully; it ended `idle/end_turn`, used `14318` micro-USD of its `100000` micro-USD cap, returned two structured findings, and had Computer `cmp_01a1a8f268e9758098a55b78f69a0abb` plus Browser Session `brw_zqba5ngyntadqfm83g7bk14nfq`. The browser-open event's `computer_id` was empty. `GET /v1/agents/{id}/computer` returned that Computer with `browser: null`, and its Browser Sessions list was empty. A paused `inspect` returned home `/home/tenki` with `probe: null`; the first `/home/user` attempt failed, and the corrected `/home/tenki` `ls` completed successfully. A later browser-only session `ses_vm5zz6qehhvmv5tdqqdyhh2mjw` did not call `ls`, had no Computer ID, consumed `14076` micro-USD, and produced no structured report. This confirms that a filesystem tool call is needed to provision the Computer for this task.

Current SDK/API shapes do not expose an attachment route: `SessionCreate` has no `computer_id`, `ComputerCreate` has no `agent_id`, and the agent Computer route is read-only. The standalone Computer Browser API is a separate route. The product therefore uses Naive's managed cloud browser, preserves both IDs for audit, and makes no same-VM browser claim. Revisit only if Naive adds a supported attachment path.

Sources: [Naive Tools](https://vetta.sh/docs/capabilities/tools.md), [Naive Sessions](https://vetta.sh/docs/api/sessions.md), [Naive Computers](https://vetta.sh/docs/api/computers.md), [Naive Browser API](https://vetta.sh/docs/api/browser.md), [Naive Browser SDK](https://vetta.sh/docs/sdk/browser.md), [Naive Filesystem](https://vetta.sh/docs/computer/filesystem.md).

## Payment settlement evidence

PayAI's current exact-payment guidance says verification does not reserve funds, advises settling before costly inference or streaming, and directs servers to preserve and reconcile the original operation for `settlement_pending`, `duplicate_settlement`, or a lost response. The current implementation in this branch instead invokes Naive between verify and settle; it is therefore a prototype and does not yet meet this acceptance contract. Sources: [PayAI Payment Safety for Servers](https://docs.payai.network/x402/servers/payment-safety), [PayAI Capacity & Limits](https://docs.payai.network/x402/facilitators/capacity-and-limits), [PayAI facilitator developer portal](https://payai.network/developers).
