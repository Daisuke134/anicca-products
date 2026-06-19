# Larry distribution — coverage/wiring fix + fixed model chain (session 2)

**Date**: 2026-06-19
**Owner**: Claude Code (dev IDE) on behalf of Dais
**Runtime**: `~/.openclaw/` (anicca-dais)
**Trigger**: Dais — "(1) Larry slideshows still not posted to each TikTok account; IG
reaches only 4-5 accounts, not all — post to the RIGHT place every day. (2) Make every
OpenClaw cron use deepseek as default + gpt-5.4-mini as backup, fixed, so it never
moves to another model."

Follows up `2026-06-18-larry-reelclaw-distribution-not-posting-design.md` (RC1 fallback
共倒れ + RC2 TikTok >1080p slideshow ERROR — both fixed + live).

## ★ Real dominant root cause found (2026-06-19 afternoon)

After Dais "still not posted", pulled current error for all 21 failing larry/reelclaw
crons: **ENOSPC 10 · "LLM request failed" 9 · codex-harness 1**.

- **RC3 (the killer): `openai/gpt-5.4-mini` fallback was 100% broken.** It routes via the
  **codex** agent harness (ChatGPT-OAuth path), but the `@openclaw/codex` plugin was NOT
  installed → `MissingAgentHarnessError: agent harness "codex" is not registered`. So
  whenever deepseek-flash hung, the fallback also died → `LLM request failed`. **Fix:
  `openclaw plugins install @openclaw/codex` + `openclaw gateway restart`.** Verified:
  pre-install a forced gpt-5.4-mini run → harness error; post-install → model call
  succeeds (test cron only failed on its own Telegram-delivery config, not the LLM).
- **RC4: disk ENOSPC.** Sessions dir held 14,466 files (710M); data volume briefly hit
  0 free in the morning → crons died in 244 ms (couldn't write session file). No
  session-janitor cron exists. Freed ~500M (sessions 710→329M) + removed 11-day-old
  stale `state/locks/cron-*.lock`. Recurrence guard (janitor) still TODO.
- **RC5: wiring bugs** (see Ask 2): `--tt` holding an Instagram id; buddha-reel pointing
  at a disabled channel.

## Ask 1 — fixed model chain (DONE)

`openclaw models set deepseek/deepseek-v4-flash` + `fallbacks clear` +
`fallbacks add openai/gpt-5.4-mini`. Result: Default `deepseek/deepseek-v4-flash`,
Fallbacks `[openai/gpt-5.4-mini]` only (blockrun removed, per Dais "never move to
another model").

- `openai/gpt-5.4-mini` resolves via the **OAuth ChatGPT-Plus** profile
  (keiodaisuke@gmail.com), which is funded. The raw `OPENAI_API_KEY` in `.env` is
  `insufficient_quota` (dead) — not used by this model id.
- ⚠️ Reliability caveat: deepseek-v4-flash still intermittently idle-times-out on
  large-context cron runs; the OAuth openai path can `rate_limit` under load. With
  only these two, a simultaneous deepseek-hang + openai-cooldown = run fails. This is
  Dais's explicit chosen config; flagged for awareness.

## Incidental — CLI was bricked, fixed

`openclaw cron edit` refused with `Invalid config … plugins.entries.hivemind:
extension entry not found: dist/index.js`. hivemind was `{enabled:false}` but its
entry still failed strict validation, blocking ALL CLI commands. Removed the disabled
`plugins.entries.hivemind` key → CLI back to warnings-only. Gateway (live crons) was
unaffected throughout (in-memory config).

## Ask 2 — Larry must hit each account on TikTok + IG

### Exact wiring audit (full integration-id match vs live Postiz /integrations/list)

| cron family | TT target | IG target | bug |
|---|---|---|---|
| larry-anicca-en-1/-am/-noon | Anicca TT (aniccaen2) | en-1-am/noon → `--ig` = "Anicca" (=anicca.jp1, JP!) | wrong IG; en-1/en-v* no IG |
| larry-anicca-en-v2/v3/v4 | (resolved internally) | none | no IG cross-post |
| larry-anicca-ja-1/-am/-noon | アニッチャ TT | `--ig` アニッチャ | needs pair check |
| larry-anicca-ja-v2/-noon/-evening | anicca.he TT | none | no IG pair |
| larry-anicca-ja-v3 | (internal) | none | — |
| **larry-anicca-ja-v4** | `--tt` = **IG** アニッチャ id | none | **--tt is an IG id (wrong)** |
| **larry-en-female-reel-replace-1/2/3** | `--tt` = **IG** anicca.affirmation id | none | **--tt is an IG id (wrong)** → FIXED |
| larry-ja-male-cta-1/2 | anicca.jp4 TT | none | no IG pair |
| **larry-ja-male-buddha-reel-replace-1/2** | `--tt` = **DISABLED** channel | none | **posts to disabled channel** |
| larry-jp-sunset-1/2/3 | anicca.jp (アニッチャ iOS) TT | none | no IG pair |

### Registry confirmed TT→IG pairs (paired_with_id, active)
aniccaen2→anicca.encards · aniccaaffirmation→anicca.affirmation · aniccajp→anicca.jp1
· obou_anicca→obou.anicca. The 5 JP larry TT accounts (anicca.jpx, anicca.he,
anicca.jp4, anicca.jp, アニッチャ) have **no IG pair** in the registry.

### Fixes applied this session
1. **Auto-pair IG (code, `post-to-tiktok.js`)**: when `--ig` absent, derive the paired
   IG from registry `paired_with_id` (active only). Auto-fixes aniccaen2 + aniccaaffirmation
   cross-post without per-cron rewiring. Verified the lookup resolves the correct IG.
2. **female-reel-replace 1/2/3 `--tt` fix**: `cmp9pedr7…` (anicca.affirmation IG) →
   `cmp93bkpu…` (aniccaaffirmation TikTok). Now posts to TikTok + auto-pairs IG.
   E2E verification: (pending live fire result).

### Still open — needs Dais brand decision (NOT guessed, to avoid wrong-brand posting)
- **larry-anicca-ja-v4**: `--tt` points to an Instagram id; correct TikTok channel unknown.
- **larry-ja-male-buddha-reel-replace-1/2**: target TikTok channel is disabled; no active
  replacement identified.
- **5 JP TT accounts unpaired to IG**: anicca.jpx / anicca.he / anicca.jp4 / anicca.jp /
  アニッチャ. To post each to IG, assign a `paired_with_id` to an available IG channel
  (anicca.jp1, anicca.bochi, anicca.video, anicca.jp.videos, IG アニッチャ). Which IG per
  TT is a branding choice → confirm with Dais, then set in registry (auto-pair handles rest).
- **TikTok daily-post-limit**: live error "TikTok says your daily post limit reached" on
  some channels → enforce ≥4–6h spacing per channel (shadow-ban guard, Dais).

## Verification protocol (HARD 0.31)
Postiz state must reach PUBLISHED + releaseURL per platform (internal login →
`/posts/<id>` → state/error/releaseURL). post_id alone ≠ published.
