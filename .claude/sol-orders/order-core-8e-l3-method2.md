# CORE 8e production L3 method 2: verified forwarding recipient

You are a fresh `gpt-5.6-sol` executor/verifier. Resume §10 row 8e only after method 1 exact cleanup. This is a production L3 run against already accepted code; do not reopen broad review or change code unless a reproduced material blocker makes L3 impossible.

## Accepted and cleanup state

- `origin/main=85a68abaa22df0d9bd0d7fe2fcf7fee0ae796eaf`.
- Railway production deployment `450d523a-2c21-4632-826d-396a919b05c3` is exact SHA `SUCCESS`.
- Code gates: focused `89/89`, full `407/407`, eval `33/33`, fresh material review blocker 0.
- Method 1 false hypothesis: a plus alias was normalized by Google Calendar to `self=true, organizer=true`, so external attendee count was 0.
- Method 1 is fully cleaned: nonce event `1→0`; nonce-derived Travel, wake, late, email, TG, call all 0; unrelated calendar/tenant unchanged. Receipt `/Users/anicca/.codex/evidence/core-8e-orphan-cleanup.md`, mode 0600, SHA-256 `ea5f87244cb35b8cb85e44db36ac3c85eda9d420f1f41e43df4aeb6c547c1fa1`.
- Do not reuse the old nonce or old `state.l3`. Make a fresh 0600 state and cryptographic nonce. Never print PII, recipient, phone, address, coordinates, tokens, raw message/email bodies, or raw nonce.

## Recipient gate before calendar create (HARD)

Use the single existing Gmail forwarding recipient whose metadata status is `accepted` as the only controlled late-email recipient. It is Dais-owned via verified forwarding.

Before any calendar mutation, resolve it at runtime and output booleans/counts only:

1. exactly one forwarding candidate and `verificationStatus=accepted`;
2. normalized candidate differs from authenticated primary inbox identity;
3. differs from every Gmail send-as identity;
4. differs from primary Calendar ID/owner identity;
5. primary owner calendar is explicitly selected;
6. no value is written to argv/log/spec/evidence or persistent runner; pass it only inside the 0600 execution process.

If any gate is false or ambiguous, fail closed with calendar/email/TG/call=0 and stop method 2. Do not create another identity and do not use a third party.

After create, immediately metadata-readback the event. Continue only if organizer/self is the Dais primary and exactly one attendee equals the runtime candidate with `self=false` and `organizer=false`. If not, exact-delete the nonce event before its T-10 window and stop. Persist the event ID into the private state immediately after provider acceptance so cleanup is always possible even if later assertions fail.

## One real production scheduler journey

- Create one nonce timed event in an otherwise empty window on Dais's primary owner calendar. It must be far enough ahead for the deployed 30-minute travel loop to observe/create the block before both call windows. Read current production loop start/log timing; schedule T-10 at least 8 minutes after the next expected travel tick. Do not invoke travel/wake/late helpers manually as completion evidence.
- Set/refresh only the controlled Dais live-location row needed for the journey, preserving a 0600 exact baseline for restoration.
- Let the deployed production scheduler own all effects.
- Exactly one original event and one outbound `[Travel]` block. No duplicate on repeated ticks.
- Capture the on-time interval before lateness: original/readback + Travel present, late claim/email/late-TG deltas 0. The travel-autofill TG report is expected and must have a real message ID.
- Exactly two authorized calls to the existing Dais phone: actual T-10 firm and T-5 harsh attempts only. No setup/manual/third call.
- After the same event becomes late from the controlled fresh location, expect exactly one late claim, one Resend email to the verified forwarding recipient, one late TG report, and repeat-tick dedup.
- Read the forwarded message from the existing locally authenticated primary inbox and record its real RFC Message-ID as a safe hash/ref. Never print subject/body/address.
- Read TG with the proven local Telethon path (`/Users/anicca/.cache/telegram-user-venv/bin/python`, config `/Users/anicca/.cloak/telegram-user.json`, dialog `@LifeManagerBotbot`) and record travel/late message IDs plus semantic/hash assertions only.
- Link both `lm_wake_log` rows to exactly two Telnyx call-control IDs, then to two stored MP3s in `/Users/anicca/.openclaw/state/lm-video/recordings/manifest.jsonl`; record file SHA-256 and short Whisper semantic excerpts. If Dais does not answer and a recording is unavailable, record the honest failure; never place an extra call.

## Cleanup, evidence, and finish

After all readbacks, exact-delete only the nonce original event and its one derived `[Travel]` block; restore only the controlled location baseline. Keep DB proof receipts and recordings. Verify nonce calendar artifacts 0 and unrelated tenant/calendar hashes unchanged.

Evidence: `/Users/anicca/.codex/evidence/core-8e-daily-journey.md`, mode 0600. Include exact production SHA/deployment, safe event/Travel hashes, TG IDs, wake levels and call-control hashes, recording hashes/Whisper semantics, on-time zero deltas, late claim/email/TG counts, inbox Message-ID hash/ref, dedup counts, cleanup and unrelated-state checks, and authorized side-effect totals. No PII/raw recipient/raw content.

Stop after evidence. Do not edit the canonical spec; the manager performs final check and spec update. Return the evidence hash/mode and all safe counts/IDs.
