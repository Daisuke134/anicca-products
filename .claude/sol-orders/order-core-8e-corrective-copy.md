# CORE 8e corrective: keep on-time silent; report the travel autofill

You are the fresh `gpt-5.6-sol` builder/executor/verifier. Resume atomic §10 row 8e only. Read the canonical spec §9.5, §9.7, §9.11 DAILY, §10/8e, the original `order-core-8e-daily-journey.md`, and this corrective before acting.

## Accepted state

- Build worktree: `/Users/anicca/anicca-project/.worktrees/core-8e-daily-journey-20260722`
- Branch: `feature/core-8e-daily-journey-20260722`, base exact accepted dev `984a088e3ed59941dbb2c1015cef5017ba462d93`
- No commit, push, deploy, calendar write, Telegram send, email, or call occurred in the interrupted attempt.
- Baseline full test and eval passed; production Railway in-process loops are the observed single writer.
- The worktree intentionally contains an interrupted RED draft: modified `package.json`, new `test/daily-journey-contract.test.js`, and an unauthorized modification of `lib/late-notice.test.js`.

## Manager correction (HARD)

The interrupted draft invented this non-canonical on-time Telegram copy: `現在地から見て予定には間に合うため…`. Remove that draft completely. Do not implement it, commit it, or send it.

- Preserve the existing production contract: `location_missing` and `on_time` late-notice decisions perform zero claim, zero email, and zero Telegram I/O.
- §9.11 copy changes remain proposal-only. Do not add or alter copy in the canonical spec.
- Row 8e's Telegram after-report is the existing §9.11 **travel autofill report** after the real `[Travel]` calendar block is successfully created. Use that exact template, with event-specific values substituted. Late handling continues to use the existing §9.11 late-email success/failure report.
- Remove only the interrupted unauthorized `lib/late-notice.test.js` diff. Preserve user/unrelated changes everywhere else.

## TDD/build target

1. Make a genuine RED journey contract that drives the production functions, not a fake success harness:
   - calendar event is observed;
   - travel autofill creates exactly one block and emits exactly one §9.11 travel report only after provider acceptance;
   - repeated travel ticks create/report no duplicate;
   - the wake scheduler anchors to departure and, across repeated ticks, dials T-10 once and T-5 once, T-15 zero;
   - `on_time` produces email=0 and late Telegram=0 (the journey already has the travel report);
   - `late` produces email=1 and existing late Telegram report=1, deduped on repeat.
2. Add the smallest production change. Dependency injection is allowed only to exercise the same exported production path. No DB row fabrication and no direct helper call may masquerade as L3.
3. Ensure `npm test` actually includes the new journey test and the currently omitted core suites that protect this path: `lib/travel.test.js`, `lib/travel-routes.test.js`, `lib/wake-filter.test.js`, `lib/events.test.js`, and `lib/travel-return.test.js`. Do not widen scope beyond this path.
4. Fresh focused/full/eval must all pass; eval stays 33/33 or higher at 100%.

## Release and production L3

- Follow normal feature PR -> dev -> staging exact SHA -> dev-to-main promotion -> Railway production exact SHA. No direct main push.
- Do not run real side effects before the code is deployed if a production change is required.
- The only phone target is Dais's existing `lm_users.phone`. Exactly the actual T-10 and T-5 attempts are authorized; no setup/test/surprise third call.
- Email recipient is only the pre-existing Dais-owned controlled inbox/plus alias already authenticated locally. Never contact another person.
- Telegram MTProto readback uses the already proven local path without printing bodies or credentials:
  - interpreter `/Users/anicca/.cache/telegram-user-venv/bin/python`
  - config `/Users/anicca/.cloak/telegram-user.json`
  - existing dialog `@LifeManagerBotbot`
- A prior 0600 temporary baseline may exist at `/private/tmp/core-8e-state.8LEp1K`; verify ownership/mode/freshness before reuse or make a fresh 0600 state. Never print its PII.
- Use a cryptographic nonce. Create the real calendar event through Composio and let the deployed scheduler own travel/wake/late actions.
- Prove: original event + one real `[Travel]` block; travel TG message ID; T-10/T-5 wake rows; exactly two Telnyx call-control IDs; two stored MP3s with hashes and Whisper excerpts; an on-time observation with late email/TG/claim deltas zero; a controlled late observation with exactly one inbox Message-ID and one late-report TG ID; repeat-tick dedup; unrelated tenant/artifact deltas zero.
- Clean only exact nonce calendar artifacts after evidence. Do not delete proof receipts/recordings/production ledgers merely to make counts pretty.
- Evidence: `/Users/anicca/.codex/evidence/core-8e-daily-journey.md`, mode 0600, safe hashes/IDs only; no raw phone/email/address/coordinates/token/message body.

## Finish

Commit and push all implementation/release work. Do not edit the canonical consolidation spec; the manager performs final verification and spec update. Return exact commits, PR/merge URLs, staging/production deployment IDs and SHAs, test counts, L3 evidence path/hash, and authorized side-effect counts.
