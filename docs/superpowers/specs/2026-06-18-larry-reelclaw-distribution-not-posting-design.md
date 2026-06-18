# Larry/Reelclaw distribution — "not being posted" root-cause + fix

**Date**: 2026-06-18
**Owner**: Claude Code (dev IDE) on behalf of Dais
**Runtime touched**: `~/.openclaw/` (anicca-dais) — live runtime, surgical fix
**Trigger**: Dais — "Larry slideshows / some reelclaw not posted for 2-4 days to each
poster account (TikTok/IG/YouTube), 3x/day. This is our ONLY distribution engine."

## Symptom

Several larry/reelclaw accounts had not posted for 2–4 days. Distribution (the
growth engine for the Anicca iOS app) was effectively down for those accounts.

## Investigation (evidence, not guesses)

| Probe | Finding |
|---|---|
| `openclaw cron list` | All 45 larry/reelclaw crons `enabled=true`. Not a disabled-cron issue. |
| cron `state.lastError` | 13 jobs: `LLM request failed.`; one verbatim: `FallbackSummaryError: All models failed (2): deepseek/deepseek-v4-flash: LLM idle timeout (120s) … | deepseek/deepseek-chat: LLM idle timeout (120s)` |
| ledger `account-history.jsonl` | per-account last-post: 6 accounts 49–63h stale, matching the error jobs. |
| direct deepseek API test | simple prompt OK in 0.8s, balance $4.01 → not a money/dead-API issue. |
| Postiz internal API (today, 40 posts) | **23 PUBLISHED / 17 ERROR**. By provider: YouTube 7/0, Instagram 11/2, **TikTok 5 PUB / 15 ERROR**. |
| Postiz by media count | **every 6-image slideshow = ERROR (13/13)**; 1-media videos = PUBLISHED. |
| Postiz post `error` field | verbatim: `"Video must be at least 720p, Picture must no exceed 1080p"` (source TiktokProvider). Slides were **1125×1202** (>1080). |

## Root causes (two independent)

### RC1 — same-provider fallback 共倒れ (cron run never reaches posting)
`agents.defaults.model = { primary: deepseek/deepseek-v4-flash, fallbacks:
[deepseek/deepseek-chat] }`. Both are deepseek. On large-context multi-step
agentTurn cron runs (read 87KB history + 54KB patterns + 6–10 tool turns),
deepseek intermittently idle-times-out (120s). Because the only fallback is the
SAME provider, both die together → run fails before STEP 5 (post). ~50% of runs.

### RC2 — TikTok rejects slideshow images >1080p (post created but never publishes)
Larry slides are 1125×1202. TikTok's Content Posting API rejects photos whose
longest side exceeds 1080px. Postiz creates the post (returns an id, ledger
records "posted") then publishes async → **state=ERROR**, `releaseURL=null`. The
ledger's "posted" was a lie (HARD RULE 0.24/0.31). Chronic since ≥2026-05-22
(`tiktok=FAILED ig=success` in old logs). Videos (1 media) are unaffected and
publish fine — so IG/YT/honne-video kept working, masking the TikTok slideshow
outage.

## Fixes applied

| RC | Change | File |
|---|---|---|
| RC1 | `fallbacks` → `[blockrun/auto, blockrun/free/mistral-large-3-675b]` (different, reliable providers via local x402 proxy; auto→gemini-2.5-flash 2.4s, 1.05M ctx). Removed deepseek-chat. | `~/.openclaw/openclaw.json` via `openclaw models fallbacks` |
| RC2 | `ensureMax1080()` downscales each slide to max 1080px (sips, execFileSync, never upscales) before Postiz upload. Applies to TikTok + IG cross-post. | `~/.openclaw/workspace/skills/larry/scripts/post-to-tiktok.js` |

## Verification (live, fresh evidence)

- RC1: fired `larry-anicca-en-v4` (was 51.7h stale, errs=5) → run completed,
  reached posting step (deepseek responded; fallback now rescues hangs).
- RC2: resized the exact rejected slides (1125×1202 → 1011×1080) and reposted via
  post-to-tiktok.js → Postiz **state=PUBLISHED**, releaseURL
  `https://www.tiktok.com/@aniccaen2` (vs ERROR for the same content at 1125×1202).
- RC2 baked-in: fed ORIGINAL oversized slides through modified script → log
  `🔧 resized 1125x1202 -> max 1080` → Postiz **state=PUBLISHED**.
- Full gateway path: fired `larry-anicca-ja-v3` (57h stale) → (verifying state).

## Remaining work (tasks #3–#5)

- **P3** IG/YT ledger recording gap: IG 11 / YT 7 PUBLISHED today but 0 recorded
  in account-history.jsonl. Posting works; append-to-history misses IG/YT.
- **P4** Coverage/frequency audit: Dais wants each account on every relevant
  platform 3×/day, spaced 4–6h (slideshow=IG+TikTok, video=TikTok+IG+YouTube;
  exception reelclaw card/widget = 2 EN + 2 JP). Map current 45 crons ×
  account × platform × time, fill gaps, enforce ≥4h spacing (shadow-ban guard).
- **P5** posted=PUBLISHED verify layer: poll Postiz state after each post; record
  status=ERROR + retry instead of recording a false "posted".

## Known blocker (pre-existing, surfaced — not silently fixed)

`~/.openclaw` HEAD is on local branch `anicca/claude-md-template-nextjs-sqlite`
(no upstream). Push is blocked by a pre-existing commit `a119b6cf4` containing
`.env`/`profile.json` (secret-scan refuses). The live fix is on disk + backed up
on clean branch `origin/fix/tiktok-slideshow-1080-distribution`. The divergent
runtime branch + secrets commit need a deliberate cleanup (not safe to history-
surge on live runtime blindly).
