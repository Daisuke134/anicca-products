# Writer Agent daily exact-eight handover

## Read first

- Spec/TODO SSOT: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813/docs/writer-agent/WRITER-AGENT-SSOT.md`
- Binding remaining queue: §9 → `Current atomic remaining queue`
- Runtime state: `/Users/anicca/profitable-claude/skills/writer-agent/state`

## Verified production state

- `ai.anicca.article-daily` is loaded with `ARTICLE_AUTOPUBLISH=1`, calendar 06:00, runs `5`, last exit `0`, currently not running.
- `ai.anicca.article-resume` is loaded every 300 seconds, runs `1061`, last exit `2`, currently not running.
- `daily-2026-08-12` is partially published: Note JA is publicly readable at `https://note.com/anicca123/n/nc660f8bd5f2d`, with the matching title, 2026-08-12 06:20 JST timestamp, and ¥500 paywall. Internal state still marks it `ambiguous`/`canonical-content-readback-failed`. Substack JA/EN, Dev.to EN, X Article JA, and Zenn JA remain draft/intended without verified public readback; X Article EN and X Post JA are explicit `dormant-destination` skips.
- `daily-2026-08-13` is not published. It has frozen JA/EN articles, media, and `x-post-ja.txt`, but no platform dispatch result or public URL. Its publication state contains only the two dormant X skips and stores `x_post.path`/`sha256` as null.
- Root cause 1: new states use `publication_contract: active-six`; `publication_resume.py` intentionally persists X-post bytes only for `legacy-exact8` and intentionally skips X Article EN/X Post JA. This contradicts Dais's current exact-eight daily contract.
- Root cause 2: the generated daily prompt instructs the model to run the Python file `publication-guard.py` with `bash`. The production log records `from: command not found` and a shell syntax error, so target registration and dispatch stop.
- Latest public pages are inconsistent: Note 2026-08-12, Dev.to and Substack 2026-08-10, X Article 2026-08-09 JST, Zenn 2026-08-06, X Post 2026-08-02. The internal reporting ledger misses some of these newer public pages. `crwl` reads the latest X Article; the historical X Post URL returns not found anonymously. Authenticated X search could not run because no logged-in `x.com` daily-driver tab exists.
- Verified writing revenue remains zero.

## First safe resume action

Read the two root-cause code paths and create the smallest RED contracts proving that a new daily state contains eight destinations plus the frozen X-post hash, that existing 2026-08-12/13 active-six states migrate atomically and idempotently to exact8 without changing stable IDs or artifact hashes, and that the generated prompt never invokes a Python file through `bash`. Do not publish or mutate production state until RED→GREEN, focused regression, and review pass. Then let the existing installed loop own the real recovery/publication E2E.

## Repository routing

- Spec/handover worktree: `/Users/anicca/anicca-project/.worktrees/writer-handover-20260813`; branch `docs/writer-handover-20260813`; base `99a089dc2`; push target `origin/docs/writer-handover-20260813`.
- Runtime shared checkout: `/Users/anicca/profitable-claude`; branch `fix/reply-collector-empty-coverage`; HEAD observed `bf5bdfe6`, upstream `4ee4e4f4`; dirty with unrelated gig/config files. **Do not edit, stage, switch, or clean it.**
- Runtime implementation workspace does not exist yet. The next primary must create `/Users/anicca/profitable-claude/.worktrees/fix-writer-daily-exact8` on new branch `fix/writer-daily-exact8`, based on the runtime repo's pushed commit `4ee4e4f4d7e2457b8f78a739cc52a32c486c4fab`, before spawning the implementer.
- `/Users/anicca/anicca-project` is also a shared dirty checkout on `docs/affiliate-agent-architecture`; do not touch it.

## Exact restart goal

The validated user-sendable `/goal` is stored beside this file as `2026-08-13_1114_writer-daily-exact8.goal.txt`. The user must paste that line in a fresh Codex session; doing so is what authorizes the named `spawn_agent` worker/reviewer flow.
