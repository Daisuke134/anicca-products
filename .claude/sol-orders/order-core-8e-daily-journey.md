# Fresh Sol order — §10 row 8e CORE-b DAILY user journey

You are the builder/executor/verifier. The manager owns planning, canonical spec edits, and final adjudication. Do not delegate. Work from `/Users/anicca/anicca-project`; keep the dirty root checkout untouched and use a dedicated worktree for every tracked change.

## Accepted state

- Canonical spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`
- Read §9.1, §9.5, §9.6, §9.7, §9.11, §10 row 8e, §10.0, §10.2 before action.
- Accepted production source / `origin/main`: `b25437f053c51b604e2c0eda36e3a6251a28ab98`.
- Accepted `origin/dev`: `984a088e3ed59941dbb2c1015cef5017ba462d93`.
- Railway production current deployment: `62493fc4-7603-499f-b01f-594b62396f83`, exact production source SHA, `SUCCESS` on both service-status and deployment-list surfaces.
- PANEL-0 production evidence: `/Users/anicca/.codex/evidence/panel-0-production-l3.md`, SHA-256 `dd49a41415210803908236e1bd17752d19d117bcc9dd854dd9bc2735375a0326`, mode 0600.
- Do not merge or reuse the still-open CORE-8d branches/PRs (#330/#331/#322) or their unreviewed code.

## Outcome

Close only §10 row 8e with a real, bounded, reversible production journey:

1. create a uniquely named real Google Calendar event for Dais;
2. prove the existing production loop resolves/fills the location and inserts the correct `[Travel]` block;
3. prove both real T-10 and T-5 calls are attempted by production and collect recording/audio plus transcription evidence for each successful audio artifact;
4. drive the live-location decision through the real Telegram webhook path;
5. prove one late case sends exactly one real email to a Dais-owned controlled inbox/plus-alias and read it back with provider Message-ID;
6. prove one on-time/no-late case sends no email;
7. read back the exact Telegram after-report(s) with message-id hashes;
8. restore all reversible settings and remove only the uniquely named controlled test calendar artifacts after evidence capture.

No third-party phone call is permitted. Calls may target Dais himself only. The late-email recipient must be a pre-existing Dais-owned controlled address already present in production-safe configuration/evidence; never invent or print an address. Do not contact an unrelated attendee.

## Workflow

### 1. Read-only preflight

- Fresh-fetch and prove the accepted refs and current Railway deployment. Abort on source drift until you independently classify it.
- Use CodeGraph first, then targeted reads, to map the real production path. At minimum inspect the symbols around `travelUserOnce`/`fillTravel`, `wakeUserOnce`/`WAKE_LEVELS`, `runLateNoticeForUser`/`evaluateLateArrival`, `sendLateNotice`, calendar transport, Telegram location ingestion, wake/late ledgers, call recording/answered webhook, and Telegram after-report.
- Identify the real scheduler trigger. Gateway cron remains the SSOT; do not create a second loop or launchd job.
- Read-only confirm required provider/config presence as booleans only. Never print tokens, phone, email, coordinates, raw calendar titles, chat IDs, user IDs, or message bodies.
- Record aggregate baseline counts and hashes only for the scoped ledgers/artifacts you will touch.

### 2. Eval/RED before build

- Before any product implementation, add or identify a deterministic journey contract that covers at least:
  - travel block anchored before departure;
  - exactly T-10 and T-5, no T-15;
  - live-location on-time => no email + honest TG report/no-op reason;
  - live-location late => one email + one TG after-report;
  - missing/expired location => feature off, no question and no email;
  - dedup on repeated scheduler ticks;
  - one tenant failure cannot affect another.
- If the exact behavior already has genuine production-path tests and the full required contract is GREEN, do not manufacture a RED or refactor. Save the commands/results and proceed to L3.
- If there is a real gap, create a dedicated branch/worktree from accepted `origin/dev`, write a genuine failing production-path test first, verify RED, implement the smallest GREEN, then run focused/full/eval. No source-regex pseudo-tests, line compression, broad refactor, or coverage gaming.
- For any tracked change: commit RED separately, commit GREEN separately, push a feature branch, create a normal PR to `dev`, obtain fresh review limited to shipping/security/side-effect blockers, merge normally, prove exact-SHA staging SUCCESS and non-mutating staging smoke, then create/merge normal `dev→main` promotion and prove exact-SHA production SUCCESS before L3. Do not use squash/rebase/admin bypass, and do not delete `dev`.

### 3. Controlled production L3

- Use a unique nonce, timestamps, and Dais-owned test resources only. Keep all identifiers and PII in process memory or a mode-0600 temporary file; evidence retains only hashes/booleans/provider refs that are safe.
- Build an explicit timeline from the real computed departure so the production scheduler, not a direct helper call, owns both T-10 and T-5. A test-only direct function call is not L3 evidence.
- Use existing calendar/Telegram/provider transports. Do not insert synthetic DB success rows, manually mark claims, call internal functions to bypass the scheduler, or treat flags/self-report as evidence.
- The Telegram live-location update must enter through the real webhook parser. If a controlled coordinate must be reused, label it as a controlled route test; do not claim it is Dais's physical current location. Restore/expire only the test location state after evidence capture without destroying unrelated history.
- Late case: only a Dais-owned controlled inbox/plus-alias; read back the exact nonce and provider Message-ID. One send only. If a safe recipient cannot be proven, do not send and record the exact blocker.
- On-time case: capture pre/post email-provider query and DB/ledger delta proving zero send, plus the real location decision.
- Calls: allow only Dais's own number. Capture Telnyx call-control IDs as salted hashes, status progression, recording artifact/audio decode, and transcription. Never print the number or recording URL. If Dais does not answer, retain honest attempt/ring/no-answer evidence; do not fabricate conversation. Use the natural T-10 and T-5 sequence as the two allowed attempts—no extra surprise calls.
- Telegram: read Dais's own LM bot dialog with Telethon, correlate nonce/time/receipts, and persist only message-id hashes plus semantic booleans. No raw message text or chat identifiers.
- Never call external humans, disconnect Calendar, alter wallet/billing, create a new account, or broaden broadcast scope.

### 4. Cleanup and final state

- Capture provider/DB/TG evidence first, then delete only calendar event(s)/travel helper event(s) containing the exact nonce created by this run. Verify nonce artifacts absent afterward. Do not delete production ledgers/receipts; they are evidence.
- Restore every temporarily changed user setting to its exact baseline and verify panel/API/DB where applicable.
- Prove no unrelated calendar event, preference, connection, or tenant row changed using scoped hashes/aggregate deltas.
- Run fresh focused/full/eval on the exact deployed source. Recheck production health and exact Railway SHA after L3.

## Evidence and return

Write `/Users/anicca/.codex/evidence/core-8e-daily-journey.md`, mode 0600. Include:

- exact source/deployment/PR SHAs and test/eval totals;
- event/travel/call/email/TG/provider references only as salted hashes except the email provider Message-ID, which the row explicitly requires;
- a timestamped journey table showing production scheduler ownership of each step;
- call artifact decode/transcription status for T-10 and T-5;
- late email Message-ID and inbox readback boolean;
- on-time zero-email proof;
- final settings/calendar cleanup and cross-tenant deltas;
- all non-executed or failed steps stated honestly;
- full side-effect ledger.

Scan the evidence for PII/secrets/bootstrap/session material, chmod 0600, and return only its SHA-256. Do not edit the canonical spec; the manager does that after independent final verification.

## Stop rules

- Three independent failed methods for the same atomic: stop, preserve evidence, and name each false hypothesis.
- Stop before prod schema destruction, billing/charge changes, Dais-wallet transfer, provider disconnect, unrelated broadcast, or any phone call to someone other than Dais.
- Absence of a safe Dais-owned late-email recipient is a true blocker for the late-send substep; do not substitute an unrelated address.
- A normal wait for the computed T-10/T-5 timestamps is not a blocker. Use it to prepare verification/cleanup and keep output progressing; do not ask the user for approval.
