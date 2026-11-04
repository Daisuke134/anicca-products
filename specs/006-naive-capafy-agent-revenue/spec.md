# Naive Capafy Cloud Research — Feature Specification

**Feature Branch**: `feat/naive-capafy-agent-revenue-20261105`  
**Status**: Draft  
**Owner**: Life Manager / Naive cloud agent

## Goal

Sell a useful, current report about Capafy’s public agent marketplace. A Naive-hosted agent must use its managed browser to inspect public pages and produce the report. An independent buyer pays with x402 on Base. The service settles the payment only after the agent completes successfully. A successful agent run is product execution evidence; only an independent settled buyer payment, matching provider receipt, and Base transaction proves revenue.

## User experience

1. The buyer opens the public product endpoint and sees an x402 price, USDC/Base network, description, and sample output without an account or Google login.
2. The buyer asks for a Capafy market report and pays using a wallet-supported x402 client.
3. After payment verification, the Naive cloud agent opens Capafy in its managed browser, reads public marketplace pages, and returns a short report with observed page URLs and retrieval time.
4. The facilitator settles the buyer-authorized payment only after the report succeeds. A provider error, timeout, invalid response, or unverified page evidence must not settle payment.
5. The operator can correlate endpoint request, Vetta session, x402 verify/settle response, payer, amount, and Base transaction without storing private wallet keys.

## Guardrails

- The agent may only read public Capafy pages (`capafy.ai` and its subdomains).
- No account creation, login, signup, form submission, purchases, content publication, CAPTCHA solving, or use of human credentials.
- Disable browser writes and CAPTCHA solving; do not enable saved login state or a proxy.
- Use only the Naive-managed cloud computer for the agent’s browser actions. Do not replace browser execution with a local scraper or static fixture in production.
- Do not claim that Naive, Life Manager, or the buyer earned money unless an independent buyer payment is settled and verified on Base.
- Price only after measuring a representative cloud run. The per-report price must exceed measured model, browser, facilitator, and hosting costs with a documented margin.
- Do not self-purchase or fabricate a sale. Demo recording follows a real independent sale and settlement.

## Product response

Return JSON with:

- `product`: stable product identifier
- `generated_at`: UTC report completion time
- `agent_session_id`: Naive session identifier
- `summary`: concise marketplace overview
- `findings`: observed listings/categories/trends, with each claim linked to a public source URL
- `limitations`: pages not reached or facts not independently verifiable

The response must distinguish page observations from agent inferences. If the agent cannot access Capafy or cannot cite supporting public pages, return an error and do not settle payment.

## Acceptance criteria

1. Unpaid requests return a valid x402 challenge and do not start a Vetta session.
2. An independently authorized, valid payment triggers one bounded Naive session with the browser tool as its only allowed tool and the Capafy domain allowlist.
3. The session uses the managed browser with writes, CAPTCHA solving, human login, and persistent context disabled.
4. A successful response contains nonempty findings and source URLs observed by the session; a failed or malformed run is not settled.
5. A successful paid request returns the facilitator settlement receipt and payment transaction reference; the matching transaction is independently readable on Base and matches recipient, payer, asset, and amount.
6. Measured cost and the public asking price are recorded before enabling paid production traffic.
7. Revenue is reported as proven only when a buyer other than the operator has paid and the facilitator settlement and Base transaction both verify.

## Out of scope

- Creating accounts or earning commission on Capafy or any other platform.
- KYC, payout accounts, bank details, wallets, or handling customer credentials.
- Automated posting, solicitation, or claims of guaranteed revenue.
- Self-replication across clouds or a $10K/$1M MRR claim.

## Evidence to keep

Record the branch/release SHA, Naive agent and session IDs, measured cloud cost, endpoint request ID, x402 verification and settlement receipt IDs, buyer/payer class (independent, with address redacted in public demo), Base transaction URL, and demo recording URL. Keep API keys and private keys out of logs, source, and recordings.
