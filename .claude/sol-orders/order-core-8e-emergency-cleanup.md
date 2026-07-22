# CORE 8e emergency: exact nonce cleanup before any call

You are a fresh `gpt-5.6-sol` executor/verifier. This is an emergency bounded cleanup, not a review or build task.

## Facts

- Production accepted SHA: `85a68abaa22df0d9bd0d7fe2fcf7fee0ae796eaf`, Railway deployment `450d523a-2c21-4632-826d-396a919b05c3` SUCCESS.
- Private state: `/private/tmp/core-8e-state.8LEp1K`, owner Dais local user, mode 0600. Never print its PII, nonce, phone, email, address, coordinates, tokens, or message bodies.
- Cleanup runner: `/private/tmp/core-8e-l3.mjs`, mode 0600.
- The first L3 create made exactly one nonce calendar event, then failed because Google normalized the controlled attendee as `self=true, organizer=true`; external attendee count was 0.
- The prior Sol recovered that exact nonce event into `state.l3`. At manager check it was about 39 minutes from start, route 18 minutes, T-10 about 6 minutes away. No call/email/TG had occurred yet.
- Continuing or retrying before cleanup can create unauthorized extra calls. Therefore cleanup is the only permitted action until verified.

## Execute now

1. Read only the safe structural fields needed to confirm `state.l3.original.id` exists; do not print values.
2. Immediately run the existing exact cleanup through production env:

   `CORE8E_STATE=/private/tmp/core-8e-state.8LEp1K CORE8E_LIFE_CALL_ROOT=/Users/anicca/anicca-project/.worktrees/core-8e-daily-journey-20260722/apps/life-call railway run --service life-call --environment production --no-local node /private/tmp/core-8e-l3.mjs cleanup`

3. Verify by provider readback that nonce calendar event count=0 and any nonce-derived `[Travel]` event count=0. Verify DB deltas for this recovered event: `lm_wake_log=0`, call-control attempts=0, `lm_late_notice_log=0`, email=0, TG=0. Report only safe counts/hashes.
4. If cleanup command fails, use the stored exact `state.l3.original.id` with `GOOGLECALENDAR_DELETE_EVENT`, after confirming its description contains the same state nonce. Then repeat the zero-count readback. Do not delete by broad query or touch another event.
5. Stop after cleanup proof. Do not create a replacement event, do not call, do not send email/TG, do not edit code/spec, do not merge/deploy, and do not search for another recipient in this emergency run.

Write a short safe receipt to `/Users/anicca/.codex/evidence/core-8e-orphan-cleanup.md`, mode 0600, with deployment SHA/id, event-id salted hash, nonce-event before/after counts, nonce-travel after count, call/email/TG/late counts, cleanup method, and timestamp. No PII/raw nonce.
