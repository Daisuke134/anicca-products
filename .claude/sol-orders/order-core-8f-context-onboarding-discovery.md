# CORE 8f: context / onboarding / discovery production journey

You are the fresh `gpt-5.6-sol` builder/executor/verifier for the next independent atomic §10 row, **8f CORE-c only**. The manager confirms row 8e remains pending after three production-L3 methods failed closed with their false hypotheses recorded; §10 Stop discipline now requires moving to 8f rather than waiting for new mailbox auth. Accepted `origin/main=85a68abaa22df0d9bd0d7fe2fcf7fee0ae796eaf`. Create an isolated worktree and branch from that exact SHA. The accepted code SHA intentionally predates row 8f, so its checked-out spec is stale and is not the planning SSOT. Read the current canonical spec only from absolute path `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`; specifically §9.5, §9.6 feature discovery, §9.7, §9.11 DAILY/FEATURE DISCOVERY, §10 row 8f, plus this order, before acting. Never substitute the isolated implementation worktree's older spec for that file.

An isolated worktree may already exist at `/Users/anicca/anicca-project/.worktrees/core-8f-context-onboarding-discovery` on the exact accepted SHA. A manager-stopped read-only discovery run created only untracked `.codegraph/` there; it made no source/provider mutation. Reuse that worktree if this is still the only dirt, never stage/delete `.codegraph/`, and keep all feature commits scoped to 8f files.

## Outcome and hard behavior

Prove the production path for four states: first-time user, existing user, location locked, and location unlocked.

- Ask only a material preference the user alone can know. It must be one closed question with 2–3 inline choices and the exact applicable §9.11 copy.
- Persist the answer as context provenance and never ask the same semantic question again, including a later event in the same series/context. `uid + event_id` dedup alone is insufficient.
- Questions about current behavior/state such as `出た？`, `まだ？`, or equivalents are permanently forbidden. Location locked means late automation stays OFF and discovery may explain how to unlock it; it never asks for a manual status substitute.
- Discovery is at most weekly, one locked gate per message, and never advertises an already unlocked location gate.
- REPORT-DON'T-ASK remains the policy. Do not add speculative copy or change §9.11; copy changes are proposal-only.

## Known material gaps to verify first

Treat these as hypotheses and reproduce them through current production exports before implementing:

1. Calendar L2 eval exercises `calendar-interpreter`, while production `askTick` mainly follows `needsLocation()` and may not consume persistent interpreter/context answers.
2. The real `askTick` send path may still send plain free text rather than the existing 2–3 choice inline closed-question contract.
3. Current ask dedup may be only `uid + event_id`; semantic/series answer provenance is not necessarily wired back into later decisions.
4. Existing discovery/onboarding unit tests do not form one production-path eval and real TG callback → DB/context provenance journey.
5. The historical `scripts/e2e-ask.js` is not completion evidence if it bypasses the current Composio/TG callback/runtime path.

If current accepted main already closes any hypothesis, keep its behavior and write the missing regression proof instead of rebuilding it.

## TDD and L2 eval

Write genuine RED before production changes. The smallest acceptable contract drives the same exported functions/routes used by `POST /telegram`, scheduler ask/discovery, onboarding, and context persistence.

Required cases:

- new user begins with no fabricated context and reaches the expected onboarding/context state;
- existing user context is read without repeating onboarding work;
- one ambiguous calendar item emits exactly one §9.11 closed Q with 2–3 inline choices;
- callback answer is persisted with typed provenance and changes subsequent interpretation;
- same semantic question on the same event, a repeated tick, and a later same-series/context event emits zero additional question;
- location locked: discovery exactly one when due, late action zero, forbidden realtime-status questions zero;
- repeated locked tick inside the throttle: discovery zero;
- location callback/update persists the real location gate provenance;
- location unlocked: location discovery zero and manual-status substitute question zero;
- unrelated user/context rows remain unchanged.

Add a fixed `context/onboarding/discovery` eval dataset and runner (or extend the existing fixed eval architecture cleanly). Wire it into `npm run eval` and the existing Life Manager eval CI. Acceptance is every applicable calendar/late/context/discovery case at **100%**. Keep focused tests and `npm test` green. Do not build a separate fake engine merely to satisfy eval.

Use an additive migration only if the accepted schema cannot durably store semantic question/answer provenance. No destructive schema change, no global context, no Dais-hardcoded values, and no cross-tenant access.

## Review and release

- Review only material shipping, privacy, tenant-isolation, forbidden-question, dedup, and real-side-effect blockers. Do not spend cycles on style or speculative architecture.
- Commit RED separately, then minimal GREEN. Push through normal feature PR → dev → exact-SHA staging → normal dev-to-main promotion → exact-SHA production. No direct main push.
- A fresh review must be artifact-only and limited to the material gates above. Builder self-report is not completion evidence.

## Production L3

Use only Dais's existing Life Manager Telegram identity/dialog and existing production records. Do not create another person's identity or touch another tenant. Use the proven Telethon path without printing credentials or raw private messages:

- interpreter `/Users/anicca/.cache/telegram-user-venv/bin/python`
- config `/Users/anicca/.cloak/telegram-user.json`
- dialog `@LifeManagerBotbot`

Create a cryptographic nonce and prove through the deployed production path:

1. one real inline closed Q and its Telegram message ID;
2. Dais taps one real callback choice through MTProto; callback receipt is observed;
3. the corresponding DB/context answer has typed provenance tied to the nonce without raw PII in evidence;
4. repeated tick plus an equivalent later event/context emits zero duplicate question;
5. locked-location state produces the due discovery callback/message and no late action or forbidden question;
6. the controlled location update unlocks the gate, persists provenance, and subsequent discovery emits zero location-gate message;
7. first-user and existing-user production contracts are proven without inventing a second real human identity; if a production-safe isolated identity does not already exist, use deployed-source tenant-isolation tests for the synthetic first-user branch and clearly label that bounded substitution rather than fabricating an account;
8. unrelated tenant mutations, forbidden-question matches, and unauthorized outbound sends are all zero.

Restore only controlled preference/location baselines that this run intentionally changed. Clean only exact nonce calendar/test artifacts; keep proof receipts. Do not expose raw phone, email, address, coordinates, tokens, message bodies, or user text.

Evidence: `/Users/anicca/.codex/evidence/core-8f-context-onboarding-discovery.md`, mode 0600, safe IDs/hashes/counts only.

## Finish

Commit and push all implementation/release work. Do not edit the canonical consolidation spec; the manager performs final verification and spec update. Return exact RED/GREEN commits, PR/merge URLs, staging/production deployment IDs and SHAs, eval/focused/full counts, evidence path/hash/mode, real TG message/callback safe IDs, DB/context provenance refs, and authorized side-effect counts.
