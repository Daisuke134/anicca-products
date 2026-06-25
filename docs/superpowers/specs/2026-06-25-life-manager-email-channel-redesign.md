# Life Manager — Email channel redesign (drop Unipile → own-domain reply-by-email) — 2026-06-25

## Why (emergency)
Unipile free trial ended → Gmail connect + ask/late-notice email are DEAD. Unipile is per-account
(€5.50/user/mo, €49 min) = unsustainable as users grow. Composio/Klavis are free but Gmail **read** =
Google RESTRICTED scope = CASA assessment ($1k–15k/yr + weeks). Dais: "we want lowest cost, do the most."

## Decision (researched, cited — 3 connector agents + 1 reply-by-email agent)
The ONLY thing that creates per-user cost / CASA is **reading the user's Gmail inbox**. We don't need to.
The full ask→reply→act loop runs on **our own domain** (aniccaai.com), never touching the user's Gmail:
- We already know the user's email (Google sign-in).
- **Send** asks + late-notices via **Resend** (already our mail stack: `RESEND_API_KEY`, `LmClient.tsx:15`
  "Anicca sends all wake/report/stakeholder mail itself via Resend").
- **Receive** replies on our domain via **Cloudflare Email Routing** (inbound = **Unlimited + Free**,
  Cloudflare pricing.md verbatim) catch-all → Email Worker → POST our webhook.
- Disambiguate users with a **per-message HMAC-signed token** in the Reply-To local-part (mailbox-hash /
  plus-addressing / VERP) — ONE domain, infinite users (Postmark MailboxHash; SendGrid Inbound Parse
  "parses all email messages sent to the receiving domain"; Rails Action Mailbox). NOT per-user mailboxes.

Cost: ~$0, flat, **independent of user count**. No CASA. No Gmail scope. No per-account fee.

## Channel design
| Channel | Email? | ask / reply / act |
|---|---|---|
| **Telegram** | NONE | Telegram is the channel (already coded: `ask.js` `opts.telegramChatId` branch; replies via `/telegram` webhook). Onboarding: SKIP the gmail stage. |
| **Web** (no Telegram) | OUR domain | Resend send + Cloudflare inbound + signed token (below). NO user Gmail connect. |

## REQ
- REQ-E1: Onboarding (web `LmClient` + `telegram-onboard.js computeStage`) NO LONGER requires `gmail_account_id`.
  Web: name → calendar → phone → pay (gmail step removed). TG: name → calendar → phone → pay.
- REQ-E2: We persist the user's email (from Google sign-in / Supabase session) on `lm_users.email` so the
  scheduler can send to it without Unipile. Migration adds `email` (nullable text).
- REQ-E3: `lib/reply-token.js` — `makeReplyToken(uid, eventId, nowMs)` → `<payload>.<sig>` and
  `verifyReplyToken(token, nowMs, maxAgeMs)` → `{uid, eventId} | null`. payload = base64url(`uid|eventId|ts`);
  sig = base64url(HMAC_SHA256(LM_REPLY_SECRET, payload))[:16]; constant-time compare; reject if ts older than
  maxAgeMs (default 30 days). Pure, unit-tested (forge, tamper, expiry, round-trip).
- REQ-E4: `lib/mail-resend.js` — `sendAsk({to, userName, event, replyToken})` and
  `sendLateNotice({toAttendees, userName, event, eta, replyToken})` via Resend API. From:
  `Life Manager <hello@aniccaai.com>`; Reply-To: `reply+<replyToken>@reply.aniccaai.com`. Fail-closed if no
  `RESEND_API_KEY`.
- REQ-E5: `ask.js` — replace the Unipile send (the `else if (accountId && unipileToken)` branch) with
  `sendAsk` (email users = those with `lm_users.email` and NO telegram_chat_id). REMOVE the Unipile
  inbox-read block entirely (replies now arrive via the inbound webhook, not polled).
- REQ-E6: `notify.js` (late-notice) — send via `sendLateNotice` (Resend), Reply-To = the user's real email
  (so attendee replies reach the user), From "Life Manager on behalf of <userName>". Drop Unipile.
- REQ-E7: NEW endpoint `POST /inbound-email` on life-call — accepts the Cloudflare Email Worker payload
  (from, to, subject, text). Verify a shared `LM_INBOUND_SECRET` header (the Worker signs the POST). Parse
  the `reply+<token>@` recipient → `verifyReplyToken` → resolve uid+event → if it's a "where is X" reply,
  agent-match the location → `patchEvent` (Composio) + `rememberPlace`. Idempotent per (uid,eventId).
- REQ-E8: Cloudflare Email Routing — catch-all on `reply.aniccaai.com` → Email Worker → `fetch()` POST
  `https://life-call-production.up.railway.app/inbound-email` with `LM_INBOUND_SECRET`. (MX + worker setup.)
- REQ-E9: Remove `UNIPILE_TOKEN`/`UNIPILE_DSN` usage from `server.js`, `scheduler.js`, `ask.js`, `notify.js`,
  `SKILL.md`. `unipileEmail()` → replaced by `lm_users.email`.
- REQ-E10 (optional, later): true "from the user's own Gmail" for late-notice = add Composio BYO-OAuth
  `gmail.send` (SENSITIVE scope, no CASA). NOT needed for launch.

## Security
- Token HMAC-signed (`LM_REPLY_SECRET`, 256-bit) — forged `reply+<other-uid>` rejected (Django signing rule).
- Inbound webhook authenticated by `LM_INBOUND_SECRET` (the Worker → life-call POST) — spoofed POST rejected.
- ts in token → reject stale replies (> 30 days).

## E2E (no-mock)
Test user (web, no TG) with a real email → create a calendar event with no location → ask cron sends a real
Resend email (From hello@, Reply-To reply+token@) → reply to it → Cloudflare Worker → /inbound-email →
calendar location patched (verify via Composio) + place remembered. Late-notice: event you'll be late for →
attendee gets the Resend mail. Confirm ZERO Unipile calls.

## Out of scope
Telegram path unchanged (works). Calendar stays Composio. Gmail READ never implemented (no CASA).
