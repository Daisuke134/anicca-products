---
name: mau-tiktok
description: Automated viral hook scraping + CTA stitching pipeline for TikTok/YouTube/Instagram. Scrapes viral YouTube Shorts, trims first 3 seconds as hooks, stitches with pre-made CTA video, and posts to multiple platforms via Postiz CLI. Runs as cron 2x/day for EN and JA accounts.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# mau-tiktok: Viral Hook + CTA Video Automation

Source: Mau ([@maboroshi_app](https://x.com/maboroshi_app)) — 7M views, 61K subscribers, fully automated YouTube channel.
Core method: "Use familiar viral videos as hooks and then stitch a direct CTA to the video."

## When to use

Activate this skill when:
- Running the mau-tiktok cron job (2x/day)
- Creating batch viral hook + CTA videos for TikTok/YouTube Shorts/Instagram Reels
- Managing the hook scraping and stitching pipeline

## Pipeline Overview

```
STEP 1: Scrape → STEP 2: Trim 3s → STEP 3: Stitch CTA → STEP 4: Post via Postiz
```

## Workspace

```
~/.openclaw/workspace/mau-tiktok/
├── cta-en-v3.mp4           # Pre-made CTA video (English) — DO NOT regenerate
├── cta-ja-v3.mp4           # Pre-made CTA video (Japanese) — DO NOT regenerate
├── cta-video/              # Remotion source (for future CTA updates only)
│   └── public/bgm.mp3     # BGM (permanent)
├── hooks/
│   ├── raw/                # Downloaded full videos from YouTube
│   └── trimmed/            # First 3 seconds extracted
├── output/
│   ├── en/                 # Final stitched videos (EN)
│   └── ja/                 # Final stitched videos (JA)
├── used_hooks.json         # Track used video IDs to prevent duplicates
├── creators.json           # List of viral creators to scrape from
├── config.json             # Postiz integration IDs, posting config
└── scripts/
    ├── scrape-hooks.js     # STEP 1: yt-dlp scraper
    ├── trim-and-stitch.js  # STEP 2+3: ffmpeg trim + concat
    └── post-to-postiz.js   # STEP 4: Postiz CLI upload + post
```

## Posting Targets

| Lang | TikTok | YouTube | Instagram |
|------|--------|---------|-----------|
| EN | `anicca.en7` (`cmmtt62wq01lqn50yehk1f6dy`) | `@anicca-ai` (`cmmzukbkw04ulp30yfvijrwio`) | `anicca.ai` (`cmmzzg2es0539p30ycb94ayx0`) |
| JA | `aniccajp6` (`cmmytdj1101w1p30ytx8lj0fw`) | — | `anicca.jp` (`cmmzujxpa04ujp30yxqpg1vci`) |

## STEP 1: Scrape Viral Hooks

```bash
cd ~/.openclaw/workspace/mau-tiktok && node scripts/scrape-hooks.js --lang en --count 3
cd ~/.openclaw/workspace/mau-tiktok && node scripts/scrape-hooks.js --lang ja --count 3
```

1. Read `creators.json` — filter by `lang`
2. Use yt-dlp to download Shorts from filtered creators
3. Check each video ID against `used_hooks.json` — skip if already used
4. Save raw videos to `hooks/raw/`

### Creator Selection Criteria (from article)

- Consistently gets millions of views per post
- Target audience watches these videos regularly
- Video feels like "brainrot" — this is part of the shock that makes these effective

## STEP 2: Trim First 3 Seconds

```bash
ffmpeg -i hooks/raw/video.mp4 -t 3 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -c:a aac -y hooks/trimmed/video.mp4
```

Trim + normalize resolution in one pass. 3 seconds exactly.

## STEP 3: Stitch Hook + CTA

```bash
# EN
echo "file 'hooks/trimmed/video.mp4'" > /tmp/concat.txt
echo "file 'cta-en-v3.mp4'" >> /tmp/concat.txt
ffmpeg -f concat -safe 0 -i /tmp/concat.txt -c:v libx264 -c:a aac -y output/en/mau_en_{timestamp}_{index}.mp4

# JA
echo "file 'hooks/trimmed/video.mp4'" > /tmp/concat.txt
echo "file 'cta-ja-v3.mp4'" >> /tmp/concat.txt
ffmpeg -f concat -safe 0 -i /tmp/concat.txt -c:v libx264 -c:a aac -y output/ja/mau_ja_{timestamp}_{index}.mp4
```

## STEP 4: Post via Postiz

```bash
# Load API key
export POSTIZ_API_KEY=$(grep POSTIZ_API_KEY ~/.config/mobileapp-builder/.env | cut -d= -f2)

# EN: Upload + post to 3 platforms
MEDIA=$(postiz upload output/en/video.mp4)
postiz posts:create --integration cmmtt62wq01lqn50yehk1f6dy --integration cmmzukbkw04ulp30yfvijrwio --integration cmmzzg2es0539p30ycb94ayx0 --media $MEDIA

# JA: Upload + post to 2 platforms
MEDIA=$(postiz upload output/ja/video.mp4)
postiz posts:create --integration cmmytdj1101w1p30ytx8lj0fw --integration cmmzujxpa04ujp30yxqpg1vci --media $MEDIA
```

**Rate Limit:** 30 req/hour. 1 cron run = 12 req (6 uploads + 6 creates). 2x/day = 24 req ✅

## Cron Schedule

| Time (JST) | EN | JA | Total |
|------------|----|----|-------|
| 09:00 | 3本 → TikTok + YouTube + IG | 3本 → TikTok + IG | 6本 |
| 21:00 | 3本 → TikTok + YouTube + IG | 3本 → TikTok + IG | 6本 |
| **Daily** | 6本 × 3 = 18投稿 | 6本 × 2 = 12投稿 | **30投稿/日** |

## Critical Rules

1. **NEVER regenerate CTA videos** — `cta-en-v3.mp4` and `cta-ja-v3.mp4` are pre-made and reused
2. **ALWAYS check `used_hooks.json`** before downloading — no duplicate hooks
3. **ALWAYS normalize resolution** to 1080x1920 before stitching
4. **3 seconds exactly** for hook trim — not 2, not 4
5. **Minimum 30 min spacing** between posts on same platform
6. **Log everything** to `post-log.json` for analytics
7. **NEVER overwrite output files** — use timestamp + index naming
8. **Authorization header:** `Authorization: ${POSTIZ_API_KEY}` (NO Bearer prefix)
