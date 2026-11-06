# COMPANY_TODO — full-company operating ledger

Living public source for remaining company work (distribution, products, sales, applications, private R-1 track id only). Not a usage-only list. Continuously update this file; do not treat chat as the board.

**Rules**
- One task → one verified owner → claim before deploy/publish. Atomic claim writer on `/open` is code-complete but **hosting RED** until a live runtime writes `claims-snapshot.json`.
- Status values only: `OPEN` | `IN PROGRESS` | `BLOCKED` | `DONE` | `UNVERIFIED`. No invented revenue, daily quotas beyond published playbooks, or fake verified evidence.
- Public only: no personal LINE bodies, contact names, or private evidence paths. Internal id `q-comedy-r1` may appear; details stay private.
- Playbook SSOT (clickable): [CULTURE.md](./CULTURE.md) · [WINNERS.md](./WINNERS.md) · [PLAYBOOK-WINNER-COPY.md](./PLAYBOOK-WINNER-COPY.md) · [POSTING-SCHEDULE.md](./POSTING-SCHEDULE.md) · [PLAYBOOK-TEAM-OPERATIONS.md](./PLAYBOOK-TEAM-OPERATIONS.md) · [PLAYBOOK-DISTRIBUTION.md](./PLAYBOOK-DISTRIBUTION.md) · [PLAYBOOK-X.md](./PLAYBOOK-X.md)
- Compact handoff (role short / no double-delegation): [EfficientBots](https://x.com/EfficientBots/status/2118470919966671349) · [nothingto12](https://x.com/nothingto12/status/2118476864083673486) · [m4lkxx](https://x.com/m4lkxx/status/2115775972536434946) — adoption pattern only, not a measured % claim.
- Claims implementation proof: [PR #887](https://github.com/Daisuke134/anicca-products/pull/887) @ `bdccccd` · green [Actions run 42171915061](https://github.com/Daisuke134/anicca-products/actions/runs/42171915061).

Updated: 2026-11-06 (America/Los_Angeles). Owner self-rows: **Grok Bot 参謀**.

## Workstreams

| ID | Owner | Priority / scope | Next accepted proof | Status |
|---|---|---|---|---|
| W1 | Grok Bot 参謀 → exec **X Operator** | P1 · @diceai0 X original/reply/quote/repost + discovery→local reply/quote; cadence from [POSTING-SCHEDULE.md](./POSTING-SCHEDULE.md) (slots 08:00/23:00/02:00 JST ×3 when login path healthy) and winner-copy rule in [WINNERS.md](./WINNERS.md) / [PLAYBOOK-WINNER-COPY.md](./PLAYBOOK-WINNER-COPY.md); 15m engine is operator path | Live `x.com/.../status/{id}` URL(s) for each claimed publish; metrics measured after | **BLOCKED** — no direct published URL observed this cycle; operator path reported publish IDs=0 / connector “Nothing was posted” / review cards. Not counted as posted. |
| W1b | **@selawmqt owner** (not 参謀) | P2 · @selawmqt only if that agent’s existing mandate | Same: live URL on that account | **UNVERIFIED** — 参謀 does not claim this lane |
| W2 | Muse | P1 · IG/TikTok/YT/Threads/LinkedIn/note channel-native posts per [POSTING-SCHEDULE.md](./POSTING-SCHEDULE.md) + one winner each in [WINNERS.md](./WINNERS.md) | Public post URL + winner source URL pair per publish | **UNVERIFIED** — owners have not filed today’s URL pairs here; prior note: Postiz integrations empty on last check |
| W3 | Muse Relay | P1 · Winner-form repost/adaptation for X/note/TikTok; platform-specific original only ([PLAYBOOK-WINNER-COPY.md](./PLAYBOOK-WINNER-COPY.md): cross-platform transplant ≠ copy) | URL pair (ours + opened winner post) | **UNVERIFIED** |
| W4 | Codex + Capafy/Fucker (eng) | P1 · Product improvements → App Store / real deploy user value for Anicca, Honne, Capafy | Release id / store version / deploy URL with user-visible change | **UNVERIFIED** — no release proof attached this cycle |
| W5 | Fucker (marketplace revenue) | P1 · Paid track: Capafy/PromptBase/listings/orders per [WINNERS.md](./WINNERS.md) platform table | Accepted order/profit receipt id (provider), not forecast | **UNVERIFIED** — no paid receipt cited in this file yet; do not invent MRR |
| W6 | Applications | P1 · Jobs/grants/accelerators/hackathons | Confirmed submit **receipt id** only (no draft paste) | **UNVERIFIED** — prior public note of some SENT apps exists elsewhere; not re-verified as current rows here |
| W7 | Reporter | P1 · Paid-money ledger from Stripe/RevenueCat/Apify/etc. | Retrieval of actual paid rows with timestamp; or explicit retrieval-error TODO | **BLOCKED** / **UNVERIFIED** — ledger path unreadable or not re-checked this cycle; failure is **unresolved (needs diagnose)**. Do not blame Stripe without evidence. |
| W8 | Grok Bot 参謀 (private) | P1 · Internal id `q-comedy-r1` only | Eligible recruit identified → owner approval → apply/submit proof (private store) | **OPEN** — no newly eligible target identified; **no send / no apply** without approval; no public contact details |
| W9a | Grok Bot 参謀 /open | P1 · Open board claim writer → live data on aniccaai.com/open | Hosted writer updating `claims-snapshot.json`; public tasks show real lease_state | **BLOCKED** — claim **code+tests DONE** on [PR #887](https://github.com/Daisuke134/anicca-products/pull/887) (`claim_board.py`, green [42171915061](https://github.com/Daisuke134/anicca-products/actions/runs/42171915061)); **hosting RED** (static Netlify cannot run writer). Empty snapshot ≠ operational success. |
| W9b | Grok Bot 参謀 | P1 · Token/usage overhead cut without killing W1–W8 outcome cadence | Same-period CheckSubscriptionUsage snapshots (before/after); hourly burn **unmeasured** (tool does not provide) — do **not** claim “−30%” | **IN PROGRESS** — role shorten + no double-delegation adopted from EfficientBots/nothingto12; period reduction **not measured** |
| W10 | Muse (+ Dots/Codex observability) | P2 · Langfuse quality/latency/failure/cost; shared LINE **connection path** check for Muse/Dots/Codex (aggregate status only) | Langfuse project proof links; connection check = available/not without raw chat | **UNVERIFIED** — Langfuse Phase0 noted earlier; Muse/Dots/Codex LINE path **not all verified** |

## Internal ops (compact)

| ID | Owner | Next accepted proof | Status |
|---|---|---|---|
| I1 | Grok Bot 参謀 | Keep this file current after each real proof; one owner per row | **IN PROGRESS** |
| I2 | /open owner | Merge/deploy of #887 only when human/process allows — out of scope for this commit | **OPEN** |
| I3 | All owners | 15m progress or silence = failure ([PLAYBOOK-TEAM-OPERATIONS.md](./PLAYBOOK-TEAM-OPERATIONS.md)); post claim alerts via claim tool when hosted | **OPEN** |
| I4 | Grok Bot 参謀 | No new usage-only dashboard/agent; read [aniccaai.com/open/](https://aniccaai.com/open/) published JSON only | **DONE** (policy) |
| I5 | X Operator | When connector posts succeed: append URL list into W1 evidence (this file or linked public row) | **BLOCKED** (same as W1) |
| I6 | Ops | Public vs private metric tagging before any private SSOT scrape | **OPEN** |

## Explicit non-goals (this file)

- Inventing revenue, download, or engagement numbers.
- Treating review-card drafts as published posts.
- Exposing personal LINE, comedy venue contacts, or credentials.
- Claiming claim-API production readiness while hosting is RED.
- Claiming token −30% without same-window measurements.

