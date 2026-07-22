# CORE 8f staged GREEN → commit/release → production L3

You are a fresh `gpt-5.6-sol` builder/executor/verifier for §10 row 8f only. Work in `/Users/anicca/anicca-project/.worktrees/core-8f-context-onboarding-discovery` on branch `feature/core-8f-context-onboarding-discovery`. Planning SSOT is `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` §9.5/§9.6/§9.7/§9.11 and row 8f.

The prior builder was intentionally stopped because its one bounded fresh review produced no finding after 10 minutes and flooded execution output. Do **not** start another broad/adversarial review. Review the staged artifact yourself only for release-blocking correctness/security/tenant/side-effect defects; style, naming, theoretical improvements, and unrelated baseline failures are out of scope.

## Accepted state

- accepted production base=`85a68abaa22df0d9bd0d7fe2fcf7fee0ae796eaf`
- journey RED=`90933cbb9f258639c6ddbe28a2d4573eb01c5158`
- corrective endpoint/UI RED and current HEAD/upstream=`0fc4535272528de61f6d8a330ea07f2892edd5b6`
- staged GREEN changes are already present across landing onboarding/calendar-connect and Life Call ask/callback/provenance/dedup/migration/tests. Preserve them.
- generated untracked `.codegraph/` is unrelated; never stage, edit, or delete it.
- local results already observed: context eval `12/12`, corrective production callback/replay/cross-tenant tests pass, full Life Call test/eval fail 0. Landing full typecheck has exactly two known unrelated baseline errors in dashboard declaration and income wallet props; do not fix them.
- provider/network side effect so far=`0`.

## Execute one bounded path

1. Resolve HEAD/upstream/status and inspect `git diff --cached 0fc453527` plus `git diff --check`. If changes are unexpectedly unstaged, recover only the listed CORE 8f files from the worktree; do not broaden scope.
2. Re-run the exact focused corrective tests, fixed context eval, related calendar/late tests/evals, full Life Call `npm test`, and full `npm run eval`. Run the landing focused contracts. A known unrelated full-typecheck baseline is not a blocker if the same two errors remain and changed files add no new error.
3. If and only if a material release blocker is reproduced, TDD-fix that blocker and rerun. Otherwise commit the staged production GREEN as one commit and push. Do not perform another nested Codex review.
4. Open the normal feature PR to `dev`, wait only required checks, merge normally, and prove `origin/dev` exact merge SHA. Deploy staging at exact SHA and run non-mutating HTTP/behavior smoke.
5. Open normal `dev→main` PR containing only accepted CORE 8f changes plus already accepted dev history, merge normally, and prove `origin/main` and Railway production exact SHA SUCCESS. Apply the additive migration using the repository's established migration path and verify columns/index/RLS without exposing identifiers or secrets.
6. Run one controlled production L3 with Dais's existing Telegram identity/dialog only. Send one real §9.11 closed inline question, invoke one real MTProto callback, and read back typed DB/context provenance. Prove callback replay and cross-tenant mutation 0, repeated same event and later-series duplicate sends 0, locked discovery once, controlled location unlock provenance, unlocked discovery 0, forbidden questions 0, and unrelated tenant/unauthorized sends 0. Restore any harmless baseline changed for the proof. Do not create another identity or contact another human.
7. Write a redacted mode-0600 evidence artifact under `/Users/anicca/.codex/evidence/`, record its SHA-256, exact commits/PRs/deploy IDs, test counts, Telegram message/callback references, DB provenance references, migration verification, and side-effect counts. Never print raw PII, tokens, callback data, or secrets.
8. Return a concise completion report. Do not edit the planning spec; the manager will independently verify and update it.

Stop only for a real destructive schema issue, unapproved broadcast/call/email/contact, a required external spend, or three independent safe methods failing the same atomic. Do not wait indefinitely: use waiting time to inspect exact release state and evidence gates.
