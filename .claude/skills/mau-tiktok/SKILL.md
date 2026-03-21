---
name: mau-tiktok
description: Automated viral hook scraping + CTA stitching pipeline for TikTok/YouTube/Instagram. Scrapes viral YouTube Shorts, trims first 3 seconds as hooks, stitches with pre-made CTA video, and posts to multiple platforms via Postiz API. Runs as cron 3x/day for EN and JA accounts.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# mau-tiktok: Viral Hook + CTA Video Automation

Source: Mau ([@maboroshi_app](https://x.com/maboroshi_app)) — 7M views, 61K subscribers, fully automated YouTube channel.
Core method: "Use familiar viral videos as hooks and then stitch a direct CTA to the video."

## When to use

Activate this skill when:
- Running the mau-tiktok cron job (3x/day)
- Creating batch viral hook + CTA videos for TikTok/YouTube Shorts/Instagram Reels
- Managing the hook scraping and stitching pipeline

## Pipeline Overview

```
STEP 1: Scrape → STEP 2: Trim 3s → STEP 3: Stitch CTA → STEP 4: Post via Postiz
```

## Workspace

```
~/.openclaw/workspace/mau-tiktok/
├── cta-en.mp4              # Pre-made CTA video (English) — DO NOT regenerate
├── cta-ja.mp4              # Pre-made CTA video (Japanese) — DO NOT regenerate
├── cta-video/              # Remotion source (for future CTA updates only)
├── hooks/
│   ├── raw/                # Downloaded full videos from YouTube
│   └── trimmed/            # First 3 seconds extracted
├── output/
│   ├── en/                 # Final stitched videos (EN)
│   └── ja/                 # Final stitched videos (JA)
├── used_hooks.json         # Track used video IDs to prevent duplicates
├── creators.json           # List of viral creators to scrape from
└── config.json             # Postiz API config, account mappings
```

## STEP 1: Scrape Viral Hooks

To scrape hooks from a YouTube creator's Shorts page:

1. Read `creators.json` to get the list of target creator URLs
2. Use Playwright (headless browser) to navigate to the creator's YouTube Shorts page
3. Scroll and download 10 videos per creator
4. Check each video ID against `used_hooks.json` — skip if already used
5. Save raw videos to `hooks/raw/`

```bash
cd ~/.openclaw/workspace/mau-tiktok && node scripts/scrape-hooks.js
```

### Creator Selection Criteria (from article)

- Consistently gets millions of views per post
- Target audience watches these videos regularly
- Video feels like "brainrot" — this is part of the shock that makes these effective

## STEP 2: Trim First 3 Seconds

To extract the hook portion from each downloaded video:

```bash
ffmpeg -i hooks/raw/video.mp4 -t 3 -c:v libx264 -c:a aac -y hooks/trimmed/video.mp4
```

Run for all raw videos not yet trimmed. The 3-second mark is critical — this is the attention-grabbing hook.

## STEP 3: Stitch Hook + CTA

To combine each 3-second hook with the CTA video:

```bash
# Create concat list
echo "file 'hooks/trimmed/video.mp4'" > concat.txt
echo "file 'cta-en.mp4'" >> concat.txt

# Stitch
ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -c:a aac -y output/en/final_001.mp4
```

Repeat for each hook video. For JA, use `cta-ja.mp4` instead.

### Resolution Normalization

Before stitching, ensure all videos match 1080x1920 (9:16 vertical):

```bash
ffmpeg -i input.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:a aac output.mp4
```

## STEP 4: Post via Postiz

To schedule posts to TikTok, YouTube Shorts, and Instagram Reels:

1. Read `config.json` for Postiz API credentials and account mappings
2. Upload each video from `output/en/` and `output/ja/`
3. Schedule with time spacing (minimum 30 minutes between posts per platform)
4. Log results to `post-log.json`

```bash
node scripts/post-to-postiz.js --lang en --count 3
node scripts/post-to-postiz.js --lang ja --count 3
```

## Cron Schedule

| Time (JST) | Action | Videos |
|------------|--------|--------|
| 09:00 | Scrape + Trim + Stitch + Post | EN 3 + JA 3 = 6 |
| 15:00 | Scrape + Trim + Stitch + Post | EN 3 + JA 3 = 6 |
| 21:00 | Scrape + Trim + Stitch + Post | EN 3 + JA 3 = 6 |
| **Total** | | **18 videos/day** |

## Critical Rules

1. **NEVER regenerate CTA videos** — `cta-en.mp4` and `cta-ja.mp4` are pre-made and reused
2. **ALWAYS check `used_hooks.json`** before downloading — no duplicate hooks
3. **ALWAYS normalize resolution** to 1080x1920 before stitching
4. **3 seconds exactly** for hook trim — not 2, not 4
5. **Minimum 30 min spacing** between posts on same platform
6. **Log everything** to `post-log.json` for analytics
