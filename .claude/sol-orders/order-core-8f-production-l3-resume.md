# CORE 8f production L3 — fresh bounded continuation

You are the fresh `gpt-5.6-sol` builder/executor/verifier for §10 row 8f only. Work from `/Users/anicca/anicca-project/.worktrees/core-8f-context-onboarding-discovery` on `feature/core-8f-context-onboarding-discovery`. Planning SSOT is `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md`, especially §9.5, §9.6, §9.7, §9.11, §10.0, §10.2, row 8f, and the CORE 8f ship-run notes.

This is a continuation, not a rebuild or broad review. The prior process ended while inspecting Telethon live-location/callback APIs and produced no final evidence. Its log is `/Users/anicca/anicca-project/.claude/sol-orders/logs/core-8f-release-l3-continuation.log`. Do not trust its self-report; reuse only the release identifiers that fresh checks reproduce.

## Accepted release state to re-resolve

- feature GREEN=`771f996c953c15374ca5b387ef6c18d38902775c`
- row-8f release merge=`47d0f143e33fa6301d141ccc95529002fa9feb59`
- original exact production deployment=`b0e75e9f-c48e-46dd-9ed7-2fde96323651`, SUCCESS when released
- current `origin/main` and production have advanced through accepted PANEL work. Require the current deployed main to contain `771f996c9`; do not roll back or redeploy merely to recreate the historical deployment.
- migration was already applied. Never reapply destructively; perform read-only schema/RLS/index/grant postflight.
- fixed context/onboarding/discovery eval=`12/12 (100%)`; full Life Call test/eval previously fail 0.
- worktree is tracked-clean with generated untracked `.codegraph/`. Never stage, edit, or delete `.codegraph/`.
- existing authorized Telethon user config=`/Users/anicca/.cloak/telegram-user.json` mode 0600. Never print or serialize its contents.

## Execute one bounded build→verify→L3 path

1. Resolve HEAD/upstream/origin refs, current Railway production deployment exact SHA/status/health, and prove feature GREEN is an ancestor of current `origin/main`. Confirm tracked-clean and migration postflight. If release is not present/current production is not the exact current main SHA, stop with the concrete blocker; do not invent a release.
2. Run only the fresh focused row-8f tests, fixed `12/12` context/onboarding/discovery eval, related full Life Call `npm test` and `npm run eval`. No new adversarial/nested review. Do not fix unrelated failures unless they directly invalidate row 8f.
3. Before any L3 mutation, inspect the exact production callback/question/discovery code path and existing row-8f tests. Snapshot only the Dais actor's bounded baseline fields/rows needed for exact restoration plus unrelated-tenant aggregate counts. Do not output PII, raw actor IDs, callback data, tokens, or secrets.
4. Using the already-authorized Dais MTProto session and the existing Life Manager bot dialog only, run one controlled production journey:
   - establish the exact Dais actor↔tenant mapping (count 1, identifiers hashed in evidence),
   - make the controlled state require one §9.11 closed inline question without contacting any other human,
   - trigger the real production path that sends exactly one closed question,
   - read the real Telegram message and inline button structure,
   - click exactly one real MTProto callback,
   - read back the resulting typed DB/context provenance,
   - replay the same callback and prove mutation delta 0,
   - prove cross-tenant/unauthorized mutation 0 without creating a second identity,
   - prove the same event repeated and a later-series semantic duplicate send 0,
   - prove locked discovery is sent once, controlled location unlock has typed provenance, and unlocked discovery sends 0,
   - prove forbidden questions 0 and unrelated tenant/unauthorized sends 0.
5. Restore every bounded Dais baseline field/row changed only for the proof. Read back exact restoration and unchanged unrelated-tenant aggregates. If exact restoration cannot be proven, do not report done.
6. The only allowed external communication is the harmless controlled messages/callback in Dais's own existing Life Manager bot chat. No call, email, wallet, calendar event, other person, broadcast, payment, schema destruction, or new identity. Report every side-effect count.
7. Use three independent safe methods at most for the same L3 atomic. After three method failures, record all false hypotheses and stop that atomic. Do not wait indefinitely.
8. Write one concise redacted mode-0600 JSON evidence file under `/Users/anicca/.codex/evidence/` containing exact commits/deploy, fresh test/eval counts, hashed Telegram message/callback refs, typed provenance truth values, replay/dedup/discovery/forbidden-question results, restoration proof, side-effect counts, remaining blocker, and SHA-256. Raw PII/initData/callback/code/token/cookie/credentials must be absent. Remove task temp files/profiles.
9. Return a concise report. Do not edit planning spec; manager independently verifies and records §10.

Stop only for destructive schema risk, unapproved contact/broadcast/call/email/payment, inability to restore the controlled Dais baseline, or the three-method stop rule. Otherwise finish the bounded L3.
