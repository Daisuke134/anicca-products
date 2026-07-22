# CORE 8e production L3 method 2b — safe recipient, exact target, complete cleanup

You are a fresh `gpt-5.6-sol` builder/executor/verifier. Work only on canonical §10 row 8e. This is a production L3 run against accepted code. Do not reopen broad review and do not edit application code unless a reproduced material blocker makes the L3 impossible.

## Accepted state

- `origin/main=85a68abaa22df0d9bd0d7fe2fcf7fee0ae796eaf`.
- Railway production deployment `450d523a-2c21-4632-826d-396a919b05c3` is exact SHA `SUCCESS`.
- Code gates: focused/full/eval=`89/407/33`; fresh material review blocker 0.
- Method 1 false hypothesis and exact cleanup are recorded in the canonical spec. Its evidence is `/Users/anicca/.codex/evidence/core-8e-orphan-cleanup.md`, mode 0600, SHA-256 `ea5f87244cb35b8cb85e44db36ac3c85eda9d420f1f41e43df4aeb6c547c1fa1`.
- Method 2 was stopped before provider mutation. It only read production SHA/loop timing/required-env booleans. Calendar/email/TG/call/location mutation count is 0.

## Material corrections from method 2 (HARD)

1. Recipient/attendee PII must never appear in shell argv, process listings, Codex/tool logs, stdout/stderr, spec, evidence, or runner source. Resolve and consume it only in memory inside one private mode-0600 process. The process may capture a child command's stdout privately, but must suppress/redact child stdout/stderr and emit only booleans, counts, opaque IDs/hashes, and semantic assertions. Do not invoke a logged `gog ... --attendees=<value>` or equivalent.
2. Production late selection is not automatically bound to the nonce: it selects the first located non-helper event in its fetched six-hour horizon. Before calendar create, require that the same production query/order has no competing located non-helper event that could be selected. After create and again immediately before controlled late-location mutation, execute the exact production selection semantics and require the selected provider ID hash equals the nonce event hash. If false, exact-cleanup before any T-10/late side effect and stop.
3. An accepted forwarding destination is distinct from the authenticated primary inbox. Do not assume a message sent there appears in the source inbox. Before any provider mutation, prove a locally authenticated read-only path to the actual target mailbox, or prove an existing reverse-forwarding path back to a locally authenticated inbox. The proof must be metadata-only and emit booleans/counts/hashes. If neither exists, fail closed with all side effects 0. Resend acceptance/delivery alone is not real receipt evidence.
4. Production travel can create outbound and return helpers. Persist every nonce-derived helper provider ID immediately when observed. Prove outbound helper count=1 and outbound TG report count=1, but exact-delete all nonce-derived helpers including any return helper. Never assume total helper count=1.

## Single 0600 runtime

- Create a fresh cryptographic nonce and fresh private state; do not reuse `/private/tmp/core-8e-state.8LEp1K`, its nonce, or prior `state.l3`.
- Use one fresh private runtime directory and runner, both mode 0700/0600. Source contains no PII. Persist provider IDs/hashes and baselines immediately after each accepted mutation so recovery is possible.
- Runtime recipient gate before any mutation: exactly one Gmail forwarding candidate; status accepted; differs from authenticated primary identity, all send-as identities, primary Calendar owner/ID; primary owner calendar explicitly selected; actual target-mailbox readback path proven.
- Preflight exact production calendar horizon/order and late selector. Continue only if no current event can become an unrelated target after the controlled location update.
- Output only safe structured fields. Run an explicit PII/secret scan over runner stdout, evidence, and the Codex log before completion.

## One real production-scheduler journey

1. Read current production loop start/log timing. Schedule one nonce timed event far enough ahead that the deployed 30-minute travel loop creates the outbound block before both call windows; T-10 must be at least 8 minutes after the next expected travel tick. Do not invoke travel/wake/late helpers manually as completion evidence.
2. Create on Dais's primary owner calendar through an in-process HTTP/API call whose JSON body never enters argv/log. Persist event ID immediately. Metadata-readback must prove organizer/self is primary and exactly one attendee equals the private runtime candidate with `self=false`, `organizer=false`.
3. If any post-create gate fails, exact-delete the nonce event before T-10 and stop.
4. Preserve a private exact baseline, then set/refresh only Dais's controlled live-location row needed for the journey. Let deployed production scheduler own every effect.
5. Observe exactly one outbound `[Travel]` block, no duplicate outbound on repeated tick, and one real travel TG message ID. Also discover/persist any return helper ID without treating it as an outbound duplicate.
6. Capture the on-time interval: original/readback and outbound Travel present; late claim/email/late-TG deltas all 0.
7. Observe exactly two authorized real calls to the existing Dais phone: T-10 firm and T-5 harsh only. No setup/manual/third call.
8. Immediately before lateness, re-run exact production late selector and require the selected provider ID hash is the nonce. Only then set the controlled fresh location that makes the same event late.
9. Observe exactly one late claim, one Resend email to the private verified recipient, one late TG report, and repeat-tick dedup.
10. Read the actual target mailbox (or pre-proven reverse-forwarded local mailbox) and capture the received RFC Message-ID as a hash/ref. Verify recipient/nonce correspondence privately. Do not print address, subject, body, or raw Message-ID.
11. Read TG via `/Users/anicca/.cache/telegram-user-venv/bin/python`, config `/Users/anicca/.cloak/telegram-user.json`, dialog `@LifeManagerBotbot`; record travel/late message IDs and semantic/hash assertions only.
12. Link two `lm_wake_log` rows to exactly two Telnyx call-control IDs, then two MP3 entries in `/Users/anicca/.openclaw/state/lm-video/recordings/manifest.jsonl`; record file SHA-256 and short Whisper semantics. If Dais does not answer and recording is unavailable, record honest failure; never place an extra call.

## Exact cleanup and evidence

- Exact-delete only the nonce original plus every persisted nonce-derived helper provider ID. Guard each deletion by nonce relationship/type/timing metadata. Restore only the controlled location baseline.
- Verify nonce original/helper artifacts 0; unrelated calendar fingerprint and other-tenant hashes unchanged. Keep DB proof receipts and authorized recordings.
- Evidence path: `/Users/anicca/.codex/evidence/core-8e-daily-journey.md`, mode 0600. Include exact production SHA/deployment, safe event/outbound/return hashes, TG IDs, wake levels and call-control hashes, recording hashes/Whisper semantics, on-time zero deltas, late claim/email/TG counts, target-inbox Message-ID hash/ref, dedup counts, cleanup/unrelated-state checks, and total authorized side effects.
- Stop after evidence. Do not edit the canonical spec; manager does final check/spec update. Return the evidence SHA-256/mode and safe counts/IDs.

## Stop behavior

- Any ambiguous identity, target inbox, late selector, cleanup target, or evidence path: fail closed before mutation, or exact-cleanup immediately if an event already exists.
- No raw PII/secret/content in any output. No extra call, test email, test TG, or substitute recipient.
- Do not wait on user approval. Do not claim done from DB flags, provider acceptance, or self-report alone.
