# Writer Loop active-six handover

## Read first

- Spec and executable queue: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813/docs/writer-agent/WRITER-AGENT-SSOT.md`, §9.0 `Current atomic remaining queue`.
- This handover supersedes the deleted exact-eight handover. The current contract is active-six: Note JA, Zenn JA, Dev.to EN, Substack JA, Substack EN, and X Article JA. X Article EN and X Post JA stay dormant.

## Verified state

- Spec workspace: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813`, branch/upstream `docs/writer-handover-20260813`, spec commit `8f34d875152f29996baba4a33611e3fa5de75db0`, pushed. The Life Manager monorepo is the target canonical source, but cutover is Order 6/7 and must not precede live active-six recovery.
- Runtime shared checkout: `/Users/anicca/profitable-claude`, branch `fix/reply-collector-empty-coverage`, HEAD observed `bf5bdfe681406cc2e3d769b808f081f816da2c3b`, upstream `4ee4e4f4d7e2457b8f78a739cc52a32c486c4fab`, dirty with unrelated gig/config work. Do not edit, stage, switch, clean, or publish from it.
- `ai.anicca.article-daily`: loaded, `ARTICLE_AUTOPUBLISH=1`, 06:00, runs 5, last exit 0, currently idle.
- `ai.anicca.article-resume`: loaded every 300 seconds, runs 1069, last exit 2, currently idle. Loaded and idle is normal; exit 2 is the open failure.
- Both launchd labels currently execute the shared runtime tree under `/Users/anicca/profitable-claude/skills/writer-agent`; an isolated worktree commit alone cannot change production behavior. `article-daily.sh` also hardcodes that tree for state and child scripts, while the resume wrapper already accepts `ARTICLE_ROOT` and `ARTICLE_STATE_DIR`. Runtime-root/state-root separation is therefore part of Order 1, not the later monorepo migration.
- `daily-2026-08-12`: Note JA is public at `https://note.com/anicca123/n/nc660f8bd5f2d`, with matching owner/content, 2026-08-12 06:20 JST, and ¥500. Internal state still calls it ambiguous; the other five active destinations are not verified live.
- `daily-2026-08-13`: article artifacts and active-six state exist, but no platform public URL exists. The generated prompt invokes Python `publication-guard.py` through bash; production recorded `from: command not found` and shell syntax failure. Its two dormant X skips and null X-post hash are correct.
- Verified received writing revenue remains zero.

## First safe action

Fetch the runtime remote, confirm commit `4ee4e4f4d7e2457b8f78a739cc52a32c486c4fab` still contains the observed Writer runtime, and create isolated worktree `/Users/anicca/profitable-claude/.worktrees/fix-writer-active-six` on branch `fix/writer-active-six`. Write the smallest RED contracts for the Python-guard invocation and for creator/recovery resolving all code from `ARTICLE_ROOT` while both use an explicit `ARTICLE_STATE_DIR`. Do not manually publish, change active-six, migrate dormant destinations, or touch production state before GREEN and review. After GREEN/push/review, announce the production mutation and verify both jobs plus publication lock are idle. Permit one short measured zero-owner window to bootout/bootstrap the same two labels with ProgramArguments and `ARTICLE_ROOT` pointing at the tested immutable worktree/release and `ARTICLE_STATE_DIR` pointing at the existing live state. Verify schedules/environment are unchanged and exactly one creator plus one recovery owner returns. Keep an exact rollback to the original two `/Users/anicca/profitable-claude/skills/writer-agent` entry points; never arm old and new copies simultaneously.

## Done for this continuation

Orders 1–5 are complete: the existing installed Writer Loop remains armed; 8月12日 and 8月13日 each reconcile to six publisher-native public URLs without duplicates; bounded quality feedback cannot cancel shipment; one destination failure does not cancel the other five; resume exits honestly; and the next safely kickstarted or scheduled daily run completes active-six without foreground manual publication. Update and push the SSOT after every observed state change. Only then hand off Order 6, the no-downtime Life Manager monorepo migration.

The validated user-sendable `/goal` is stored beside this file as `2026-08-13_1156_writer-loop-active-six.goal.txt`. The user must paste it into a fresh Codex session because it names `spawn_agent`.
