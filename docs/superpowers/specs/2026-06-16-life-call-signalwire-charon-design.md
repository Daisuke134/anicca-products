# B-call FIX #2 — SignalWire carrier for the Charon/Gemini bridge (real call to Dais +818046270314)

2026-06-16. Patches spec27 §2 WF-B **B-call** again. Both prior carriers are HARD-blocked from
dialing Dais's JP mobile `+818046270314` — VERIFIED LIVE this session, not assumed:

| carrier | live probe result | meaning |
|---|---|---|
| **Twilio** | `POST /Calls.json To=+818046270314` → `{code:21216,status:400, "Account not allowed to call +818046270314"}` (balance ¥3119 — NOT a funding issue) | destination-specific fraud block; lifts only via async Support ticket |
| **Telnyx** | `POST /v2/calls to=+81…` → `{code:10010, telnyx_error:"D60", "Can not make calls to non-verified numbers at this account level D60… upgrade their account"}` (balance $4.73) | account-level (D60 trial) block on non-verified intl destinations; lifts only via account-level upgrade, not self-serve API |

So a THIRD carrier is required. The Charon/Gemini audio bridge is carrier-agnostic; only the
carrier's media-WS field names + REST dial differ.

## §1 Carrier choice — SignalWire (cited)

Picked **SignalWire** over Plivo/Vonage. Reasons (firecrawl + ctx7 research this session):

| criterion | SignalWire | why it wins |
|---|---|---|
| Twilio drop-in | `<Connect><Stream>` cXML is **bidirectional** and frames are **base64 PCMU/μ-law 8kHz**, identical to Twilio Media Streams; REST create-call = `POST https://{space}.signalwire.com/api/laml/2010-04-01/Accounts/{ProjectId}/Calls` (same path as Twilio `/2010-04-01/.../Calls.json`) | the bridge is ALREADY written against the literal Twilio Media Streams wire format (`routeTwilioMessage`, `buildTwilioMediaFrame`, `buildConnectStreamTwiml`) → ~zero transcode/frame rework |
| JP mobile reach | self-serve account can dial international JP once funded ≥$5 + card | reaches +8180… (the whole point) |
| bidirectional send-back frame | `{"event":"media","streamSid":"…","media":{"payload":"<base64 μ-law>"}}` | byte-identical to our `buildTwilioMediaFrame` |
| signup | self-serve `/signup`; **trial blocks international dialing until a card is added + ≥$5 funded** | the only friction is the card+fund step (TIER A Pattern 2 + CapSolver autonomous) |

Source quotes:
- SignalWire Stream (`signalwire.com/docs/compatibility-api/cxml/reference/voice/stream.md`): *"To initialize a bidirectional stream, wrap the `<Stream>` instruction in `<Connect>` instead of `<Start>`."* / *"Default (PCMU/mulaw): audio/x-mulaw with 8000 Hz sample rate."*
- SignalWire create-call (`…/rest/calls/create-a-call.md`): `POST https://YOUR_SPACE.signalwire.com/api/laml/2010-04-01/Accounts/{AccountSid}/Calls`.
- SignalWire compat (`…/compatibility-api.md`): *"seamless migration path from Twilio… minimal code changes."*
- SignalWire trial (`…/platform/trial-mode.md`): *"To remove Trial Mode, simply add a credit card to your account and fund it with at least $5 of credit." / "No international calling or SMS."*

Plivo rejected NOT for reach (JP mobile $0.1398/min confirmed, $10 free credit) but because its
send-back is a **different envelope** (`{"event":"playAudio","media":{"contentType","sampleRate","payload"}}`)
and its dial XML differs (`<Stream bidirectional="true">`), forcing more bridge rework — and its
trial also gates intl dialing to verified sandbox numbers until funded. SignalWire's drop-in
compatibility makes it the lowest-risk path to a *ringing* call. If SignalWire's fund/verify gate
proves un-passable autonomously, Plivo is candidate #4 (already scoped, frame shapes captured).

## §2 The fix — SignalWire provider on the same bridge

The bridge already takes `--provider`. Add `signalwire`:
- inbound media frame = Twilio shape → reuse `routeTwilioMessage`.
- outbound (Charon → caller) = Twilio shape → reuse `buildTwilioMediaFrame`.
- dial = cXML `<Connect><Stream url=wss://…/ws/>` via REST `POST .../Calls` on the SignalWire space base URL with Basic auth (ProjectId:ApiToken). Record via `Record=true&RecordingTrack=both` (LaML-compatible).

Because SignalWire's media frames + cXML are Twilio-identical, the provider switch is just:
(1) a new runner `life-call-signalwire.mjs` that POSTs to the SignalWire space REST base instead of api.twilio.com, and (2) `provider: "signalwire"` mapping to the existing Twilio routing in call-bridge.cjs (alias, no new transcode).

## §3 Artifacts (MUST)

| file | role |
|---|---|
| `apps/landing/scripts/call-bridge.cjs` | accept `--provider signalwire` (alias of twilio routing/frames) |
| `apps/landing/scripts/life-call-signalwire.mjs` | runner: cloudflared tunnel → bridge → `POST {space}/api/laml/2010-04-01/Accounts/{proj}/Calls` cXML `<Connect><Stream>` + Record → poll → recording → print real CALL_SID + frame counts |
| `~/.openclaw/.env` | `SIGNALWIRE_SPACE_URL`, `SIGNALWIRE_PROJECT_ID`, `SIGNALWIRE_API_TOKEN`, `SIGNALWIRE_PHONE_NUMBER` (chmod 600, never commit) |
| `docs/verifications/2026-06-16-b-call-charon-dais-signalwire-e2e.md` | LIVE proof: real CALL_SID to +818046270314, status, frame counts, recording |

## §4 E2E acceptance (HARD 0.24/0.31 — no fake run)

1. SignalWire account provisioned (self-serve), funded, voice number bought, creds in `~/.openclaw/.env`.
2. Reachability proof: a real outbound call connects + Charon audio streams (self/controlled number) — bridge logs `start` + `gemini_audio frames>0`.
3. The REAL call to `+818046270314`: result JSON shows a real CALL_SID + final status; bridge `DOWNLINK_FRAMES>0` (Charon spoke).
4. If SignalWire ALSO blocks JP, capture the exact API error and fall to Plivo (candidate #4).

## §5 Boundaries
- New files only + the existing `--provider` switch. Secrets only in `~/.openclaw/.env`.
- Twilio + Telnyx paths stay wired (blocked, but kept). Branch off main; push, do NOT merge.
- No new npm deps beyond `ws` (already present).
