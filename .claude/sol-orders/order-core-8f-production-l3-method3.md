# CORE 8f — production L3 method 3 (final safe method)

You are the fresh Sol builder/executor/verifier. Work only on CORE §10 row 8f's remaining production L3. The manager owns the planning spec and final verdict; do not edit the planning spec.

## Fixed context

- Product worktree: `/Users/anicca/anicca-project/.worktrees/core-8f-context-onboarding-discovery`
- Branch/head: `feature/core-8f-context-onboarding-discovery` / `771f996c953c15374ca5b387ef6c18d38902775c`
- Current `origin/main`: `d04c522f08161c69ff83e25335a0630d3940a84c`; it contains the 8f release.
- Current Railway production deployment: `ea570232-fd20-4614-b2c8-084cb9d3256c`, exact current main, SUCCESS, health 200.
- Existing focused verification is accepted: 8f tests 39/39, context eval 12/12, full Life Call 417/417 plus scheduler PASS, all organ evals PASS.
- Telethon interpreter: `/Users/anicca/.cache/telegram-user-venv/bin/python`
- Telegram user config: `/Users/anicca/.cloak/telegram-user.json` (never print secrets)
- Temporary runner from prior methods: `.core8f-l3-once.js`, untracked and mode 0600. It may be minimally reused, but must never be staged or committed and must be deleted before handoff.
- Generated `.codegraph/` is unrelated and must not be touched.

Do not read or replay the large prior log. Do not emit runner source, diffs, credentials, tokens, or environment values into stdout. Do not run broad filesystem searches.

## Prior safe-method record

Method 1 failed with `typed_message_binding_mismatch`: the false hypothesis was that the MTProto user-view message ID equals Bot API webhook `message_id`. Exact baseline restoration passed.

Method 2 reused the existing closed question and passed callback/replay/cross-tenant/dedup/locked-discovery stages, then failed `live_location_unlock` with `poll_timeout`. The false hypothesis was that the Telethon live-location send path used there would arrive/process as the current Bot API webhook location shape. Exact baseline restoration passed.

The platform terminated the previous Sol before method 3 for a false-positive safety classification. That termination is not a method failure. This order authorizes exactly one final independent safe method. If it fails, stop: produce failure evidence with all false hypotheses and restoration proof. Do not try a fourth method.

## Required sequence

1. Read-only preflight:
   - Verify the controlled 8f ask rows are absent/restored and the Dais user/location/discovery fields are at the current baseline.
   - Record unrelated-row aggregate/hash so exact restoration can be proved.
   - Inspect `getWebhookInfo` pending/error fields and the narrow Railway log window around the prior live-location event. Do not print sensitive payloads.
   - Inspect only the relevant live-location and restoration portions of the temporary runner and current production handler.

2. Execute one final materially independent method:
   - Use the existing Dais Telegram dialog and the installed Telethon environment.
   - Exercise a genuinely different live-location delivery path from method 2, preferably raw MTProto `messages.SendMediaRequest` with `InputMediaGeoLive`, or another independently justified API path.
   - Make only the minimum real Telegram side effects. Reuse visible chat artifacts when valid. If a controlled ask row must be reconstructed or one new closed question is unavoidable, keep it strictly scoped to Dais's own bot chat and restore it afterward.
   - Do not call any third party and do not broadcast beyond Dais's own Life Manager bot chat.

3. The evidence must prove the complete 8f contract, not just a location update:
   - one closed inline question and its real callback,
   - replay produces zero additional transition,
   - same event/series dedup produces zero duplicate discovery,
   - locked state emits discovery exactly once,
   - typed live location persists with `source=telegram_live_location`,
   - unlocked state emits zero discovery,
   - forbidden questions remain zero,
   - cross-tenant mutation remains zero,
   - exact baseline restoration for all controlled and unrelated state.

4. Produce one mode-0600 JSON artifact under `/Users/anicca/.codex/evidence/`:
   - success: `core-8f-production-l3.json`
   - final safe-method failure: `core-8f-production-l3-method3-failure.json`
   Include timestamp, deployed commit/deployment, Telegram chat/message identifiers safe for local evidence, stage measurements, before/after hashes, restoration result, and the three-method record. Do not store credentials.

5. Cleanup and handoff:
   - Delete `.core8f-l3-once.js` and any other temporary runner.
   - Leave no tracked product changes unless a production defect is found and fixed through RED → GREEN → fresh review → PR → main release → exact-SHA Railway deploy → rerun this one authorized method. A defect fix does not authorize extra live attempts.
   - Report only concise outcome, evidence path/hash/mode, production identifiers, exact real side-effect counts, restoration proof, and clean tracked worktree status.

## Hard stop

On method-3 failure, stop immediately after exact restoration and failure evidence. No fourth method, no claim that 8f is done, and no spec edit.
