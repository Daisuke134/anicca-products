# CORE 8f corrective RED → minimal GREEN → release/L3

You are a fresh `gpt-5.6-sol` builder/executor/verifier for §10 row 8f only. Do not repeat broad discovery. Work in `/Users/anicca/anicca-project/.worktrees/core-8f-context-onboarding-discovery` on exact clean RED commit `90933cbb9` (upstream `origin/feature/core-8f-context-onboarding-discovery` must match). The only allowed unrelated dirt is generated untracked `.codegraph/`; never stage/delete it.

Current planning SSOT is `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` §9.5, §9.6, §9.7, §9.11 and row 8f. The isolated worktree's older spec is not SSOT.

## Accepted RED and existing passes

- Existing 12-case production-export journey eval is `7/12`; exact five failures are closed inline question, TG callback typed provenance, later-series semantic dedup, location source provenance, and additive tenant-scoped unique schema.
- RED/head/upstream=`90933cbb9` contains only dataset, runner, focused contract, and npm eval/test wiring. No production JS/SQL change.
- Existing calendar eval=`21/21`, late eval=`12/12`, related focused tests=`60/60`.
- Existing weekly discovery, locked/unlocked gate selection, §9.11 discovery copy, throttle, and how/later callback are accepted. Do not rebuild them.

## Corrective RED first (two material gaps only)

Before production changes, add executable behavior tests for these two fresh audit blockers. Do not use source-regex as their main proof.

1. **User-scoped onboarding resume**: production onboarding endpoint + actual client state derivation must prove:
   - first user starts from server truth with no fabricated name/context;
   - existing user opening a fresh browser resumes from durable server state and does not re-ask completed name/calendar/context;
   - a different user in the same browser cannot inherit prior user's onboarding step, calendar-connected flag, name, or context;
   - non-2xx save/link responses do not advance or erase valid binding state.
2. **Signed Calendar connect tenant binding**: drive the real `calendar-connect` handler. Missing/invalid/replayed/mismatched `sig` must perform status/OAuth/provider mutation 0. A valid signature bound to exact uid/purpose/expiry may proceed. Never trust client uid alone.

Verify these fail for the intended production behavior while the original 12-case result stays `7/12`. Commit and push this corrective RED separately. Do not touch providers.

## Minimal GREEN scope

Fix only the original five failures plus the two corrective blockers:

- Integrate `calendar-interpreter` decision into production `askTick`; send exact §9.11 closed Q with 2 inline choices, never the English free-text location question for this ambiguity.
- Claim/store the semantic question atomically before send. Use a tenant-scoped hashed semantic key preferring recurring series identity/context over instance event ID. Repeated tick, same event, and later series instance must send 0 duplicates.
- Route the real Telegram inline callback through `POST /telegram`; bind callback actor/chat to the claimed uid, consume once, save typed answer/provenance, and feed later interpretation. Replays/cross-tenant callbacks mutate 0.
- Add only additive migration/store fields or a dedicated table necessary for `uid + semantic_key` unique provenance. Enable RLS and restrict service-role access consistently with existing migrations. No destructive schema.
- Persist live-location provenance source=`telegram_live_location` with TG message ID through the actual upsert.
- Make onboarding resume derive from durable, user-scoped server state. Browser storage may cache only under a uid-bound key and cannot override server truth. Failed writes do not advance.
- Verify Calendar connect signature server-side with existing signing primitives; exact uid/purpose/expiry, constant-time compare, replay protection if one-time state is used. No new secret if an accepted signing secret already exists.
- Keep discovery behavior unchanged except integration into the combined eval.

Likely files are limited to `apps/life-call/lib/ask.js`, Telegram reply/callback/context modules, `server.js`, additive migration, 8f eval/tests/package wiring, plus the actual landing onboarding endpoint/client/calendar-connect files and focused tests. Widen only when an exact call path requires it.

## Verification and release

- Required local GREEN: corrective behavior tests, 12/12 context eval, calendar 21/21, late 12/12, all focused tests, full `npm test`, full `npm run eval`, forbidden question scan 0, unrelated tenant mutation 0.
- Commit minimal production GREEN separately and push. Fresh review is artifact-only and only shipping/privacy/tenant/forbidden/dedup/side-effect blockers; no style/adversarial churn.
- Normal feature PR→dev→exact-SHA staging→dev-to-main→exact-SHA production. No direct main push.
- Production L3 uses only Dais's existing TG identity/dialog and production records. Prove one real inline closed Q, one MTProto callback, typed DB/context provenance, repeat + later-series duplicate 0, locked discovery once, controlled location unlock provenance, unlocked discovery 0, forbidden questions 0, unrelated tenant/unauthorized sends 0. Synthetic first-user branch may use deployed-source tenant-isolation tests only if no safe second identity exists; label honestly.
- Evidence `/Users/anicca/.codex/evidence/core-8f-context-onboarding-discovery.md`, mode 0600, safe IDs/hashes/counts only. Restore exact controlled baselines/artifacts.
- Do not edit canonical spec; manager final-checks and updates it. Return RED/GREEN commits, PR/merge URLs, deploy IDs/SHAs, all counts, evidence hash/mode, TG/callback safe IDs, DB provenance refs, and side-effect totals.
