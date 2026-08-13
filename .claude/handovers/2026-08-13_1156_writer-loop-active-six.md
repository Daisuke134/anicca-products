# Writer Loop active-four handover

## Read first

- Spec and executable queue: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813/docs/writer-agent/WRITER-AGENT-SSOT.md`, §9.0 `Current atomic remaining queue`.
- This handover supersedes the deleted exact-eight handover and the original active-six contract. The owner changed the current contract to active-four: Note JA, Substack JA, Substack EN, and X Article JA. Zenn JA, Dev.to EN, X Article EN, and X Post JA are dormant and must not receive new daily work.

## Verified state

- Spec workspace: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813`, branch/upstream `docs/writer-handover-20260813`. The Life Manager monorepo is the target canonical source, but migration remains Order 6 and was not combined with recovery.
- Runtime shared checkout: `/Users/anicca/profitable-claude`, branch `fix/reply-collector-empty-coverage`, HEAD observed `bf5bdfe681406cc2e3d769b808f081f816da2c3b`, upstream `4ee4e4f4d7e2457b8f78a739cc52a32c486c4fab`, dirty with unrelated gig/config work. Do not edit, stage, switch, clean, or publish from it.
- `ai.anicca.article-daily`: loaded once, `ARTICLE_AUTOPUBLISH=1`, 06:00, last exit 0, idle.
- `ai.anicca.article-resume`: loaded once every 300 seconds and idle. Its latest natural tick exited 1 honestly after selecting only old Substack JA/EN intents and producing no external effect; it did not select dormant Dev.to or Zenn. `ai.anicca.article-zenn-retry` is unloaded.
- Both loaded jobs run tested code from `/Users/anicca/profitable-claude/.worktrees/fix-writer-active-six/skills/writer-agent` and share `/Users/anicca/profitable-claude/skills/writer-agent/state`. Runtime commit `e9ab21ea303c70b0f201c5b8bb8ec13c4303a47b` is pushed and clean.
- `daily-2026-08-12` is complete under active-four with four publisher-native URLs and duplicate zero. Historical Dev.to and Zenn records are preserved but are not required.
- `daily-2026-08-13` is complete under active-four with four publisher-native URLs, owner/content/media/identity readback, four dormant skip receipts, and duplicate zero.
- Verified received writing revenue remains zero.

## First safe action

Start SSOT Order 6 only: migrate portable source/tests/installers into the Life Manager monorepo while the current installed loop keeps serving. Do not cut production over in the same slice. Preserve current launchd owners, schedules, tested runtime entry points, explicit live state root, stable IDs, ledger, receipts, dormant destinations, and exact rollback.

## Done for this continuation

Orders 1–5 are complete under the owner-selected active-four contract. The existing installed Writer Loop remains armed; 8月12日 and 8月13日 each validate with four publisher-native public URLs without duplicates; bounded quality feedback freezes a safe version and reaches dispatch; one destination failure does not cancel the other three; same-target resume exits honestly; and a safe same-day kickstart produces no second run or ledger target. Foreground agents did not manually publish. Order 6, the no-downtime Life Manager monorepo source migration, is next and remains separate from recovery/cutover.

The validated user-sendable `/goal` is stored beside this file as `2026-08-13_1156_writer-loop-active-six.goal.txt`. The user must paste it into a fresh Codex session because it names `spawn_agent`.
