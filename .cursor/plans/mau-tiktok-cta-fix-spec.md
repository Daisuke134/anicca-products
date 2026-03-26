# mau-tiktok パイプライン完全仕様 v4

**Status:** IN PROGRESS
**Date:** 2026-03-26
**Branch:** dev

---

## 概要

バイラル YouTube Shorts の最初3秒をフックとして使い、先延ばし防止 CTA 動画を結合して TikTok/YouTube/Instagram に自動投稿するパイプライン。

**原則:** Prayer Lock (mau-model.mov) を完全コピー。オリジナルゼロ。

```
最終投稿動画 (10秒):
┌──────────┐  ┌──────────────────┐
│ HOOK (3s) │ +│  CTA CLIP (7s)    │
│ バズ動画   │  │  Prayer Lock式    │
│ yt-dlp取得 │  │  Remotionレンダリング│
└──────────┘  └──────────────────┘
```

---

## 確定事項

| 項目 | 確定値 |
|------|--------|
| TikTok EN | `anicca.en7` (ID: `cmmtt62wq01lqn50yehk1f6dy`) |
| TikTok JA | `aniccajp6` (ID: `cmmytdj1101w1p30ytx8lj0fw`) |
| YouTube EN/JA共用 | `@anicca-ai` (ID: `cmmzukbkw04ulp30yfvijrwio`) |
| Instagram EN | `anicca.ai` (ID: `cmmzzg2es0539p30ycb94ayx0`) |
| Instagram JA | `anicca.jp` (ID: `cmmzujxpa04ujp30yxqpg1vci`) |
| Cron | **4回/日** (06:00 / 06:15 / 17:00 / 17:15 JST) |
| 動画数 | **1本/cron** → 同じ1本を全プラットフォームに投稿 |
| CTA構造 | Prayer Lock式 3フェーズ（問いかけ→遷移→VALUE PROP） |
| BGM | phonk/ロックイン系（`bgm_phonk_final.mp3` 約6秒） |
| CTA再利用 | CTA動画は1回作ったら全動画で再利用。毎回作らない |

---

## Cron スケジュール（4回/日、既存cronと重複回避）

```
06:00  mau-tiktok-ja    ← TT aniccajp6 + IG anicca.jp + YT @anicca-ai
06:15  mau-tiktok-en    ← TT anicca.en7 + IG anicca.ai + YT @anicca-ai
      --- 2時間45分空き ---
09:00  slideshow-ja-1   ← (既存) TT @anicca.jp2 + IG JA
12:00  reelclaw-ja-1    ← (既存)
12:30  reelclaw-en-1    ← (既存)
15:00  slideshow-ja-2   ← (既存)
15:30  slideshow-en-2   ← (既存)
17:00  mau-tiktok-ja    ← TT aniccajp6 + IG anicca.jp + YT @anicca-ai
17:15  mau-tiktok-en    ← TT anicca.en7 + IG anicca.ai + YT @anicca-ai
18:00  slideshow-ja-3   ← (既存)
21:00  reelclaw-ja-2    ← (既存)
21:30  reelclaw-en-2    ← (既存)
```

### 投稿マトリクス

| Cron | 時間 | 動画 | TikTok | YouTube | Instagram | 投稿数 |
|------|------|------|--------|---------|-----------|--------|
| mau-ja morning | 06:00 | 1本 | aniccajp6 | @anicca-ai | anicca.jp | 3 |
| mau-en morning | 06:15 | 1本 | anicca.en7 | @anicca-ai | anicca.ai | 3 |
| mau-ja evening | 17:00 | 1本 | aniccajp6 | @anicca-ai | anicca.jp | 3 |
| mau-en evening | 17:15 | 1本 | anicca.en7 | @anicca-ai | anicca.ai | 3 |
| **日計** | | **4本** | | | | **12投稿/日** |

---

## フック取得

### クリエイター（確定）

| 言語 | クリエイター | URL | カテゴリ |
|------|-----------|-----|---------|
| EN | ZackD Films | `https://www.youtube.com/@ZackDFilms/shorts` | brainrot-comedy |
| JA候補1 | Frorav | `https://www.youtube.com/@Froravofficial/shorts` | brainrot-animation |
| JA候補2 | seeyou | `https://www.youtube.com/@seeyou_seeyou2/shorts` | brainrot-animation |

**JA クリエイターは候補2名をダイスが動画確認後に確定。**

### スクレイプフロー

```
scrape-hooks.js --lang en --count 1
  → creators.json の EN クリエイター URL
  → yt-dlp で最新 Shorts をリスト
  → used_hooks.json にないものを1本 DL
  → hooks/raw/en/{creator}_{videoId}.mp4
  → used_hooks.json に追加
```

毎 cron で新しい1本。1日4本（EN 2 + JA 2）。

---

## CTA動画 v4 仕様（Prayer Lock 完全コピー）

### 参考元: mau-model.mov フレーム分析

```
Prayer Lock (mau-model.mov, 13.8s):
0-3s:   バイラルフック（ハゲ男 "If you went blind" + 脳映像）
4-5s:   突然切り替え → 白画面 "did you pray today bro??" + Prayer Lockアイコン
5-6s:   白 → 炎映像に遷移、アイコン残る
7-10s:  "block your phone until you pray with 'prayer lock' (it's on the app store)"
        + Jesus炎映像 + アイコン中央
```

### Anicca CTA v4 構造 (7s = 210 frames @ 30fps)

```
Phase 1: 問いかけ (frame 0-60, 0-2s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  背景: 黒
  中央: procrastination カード画像（実機スクショ）
  アニメーション: spring fade in (frame 0-15)
  音楽: 無音

Phase 2: ドラマチック遷移 (frame 60-90, 2-3s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カード → フェードアウト
  ロックイン phonk 音楽 → フェードイン（ドドドドーン）
  背景: 黒のまま

Phase 3: VALUE PROP (frame 90-210, 3-7s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  背景: 黒
  上部: VALUE PROP テキスト（白文字）
  中央: Anicca アプリアイコン
  音楽: phonk フル → フェードアウト (frame 180-210)
```

### CTA テキスト（確定）

| 要素 | EN | JA |
|------|----|----|
| Phase 1 カード | `procrastination_1.png` — "Breaking another promise to yourself?" | `procrastination-jp.png` — 「やらない理由は全部言い訳。」(実機スクショ) |
| Phase 3 VALUE PROP | "stop procrastinating with 'anicca'" | "アニッチャが先延ばしを通知してくれる" |
| Phase 3 ストアライン | "(it's on the app store)" | "(App Storeで公開中)" |
| Phase 3 下部テキスト | **なし** | **なし** |

### CTA アセット

| アセット | パス |
|---------|------|
| EN カード画像 | `/Users/anicca/anicca-project/assets/card-screenshots/en/procrastination_1.png` |
| JA カード画像 | `/Users/anicca/Desktop/mau-tiktok-preview/new-ja/procrastination-jp.png` |
| Anicca アイコン | `/Users/anicca/anicca-project/aniccaios/aniccaios/Assets.xcassets/AppIcon.appiconset/icon-1024.png` |
| BGM | `/Users/anicca/Desktop/ja-creator-samples/bgm_phonk_final.mp3` (約6秒、phonk/ロックイン系) |

### CTA Remotion 設定

```json
{
  "en": {
    "cardImage": "procrastination_1_en.png",
    "valueProp": "stop procrastinating\nwith 'anicca'",
    "storeLine": "(it's on the app store)",
    "font": "Inter"
  },
  "ja": {
    "cardImage": "procrastination-jp.png",
    "valueProp": "アニッチャが\n先延ばしを通知してくれる",
    "storeLine": "(App Storeで公開中)",
    "font": "NotoSansJP"
  },
  "common": {
    "fps": 30,
    "width": 1080,
    "height": 1920,
    "durationFrames": 210,
    "bg": "#000000",
    "textColor": "#FFFFFF",
    "icon": "anicca-icon.png",
    "bgm": "bgm_phonk_final.mp3",
    "phases": {
      "question":   { "startFrame": 0,  "endFrame": 60  },
      "transition": { "startFrame": 60, "endFrame": 90  },
      "valueProp":  { "startFrame": 90, "endFrame": 210 }
    }
  }
}
```

### Remotion BP チェック (MUST)

| ルール | 対応 |
|--------|------|
| `useCurrentFrame()` のみ | MUST |
| `extrapolateRight: "clamp"` 全interpolate | MUST |
| `staticFile()` for assets | MUST |
| No TransitionSeries | MUST |
| Font subset指定 | MUST |
| No `<Video>` (静止画のみ) | MUST (v4はカード画像+アイコン+テキスト) |

### Green Zone テキスト配置

| プラットフォーム | 上部NG | 下部NG |
|---------------|--------|--------|
| TikTok | 上100px | 下280px |
| YouTube Shorts | 上80px | 下200px |
| Instagram Reels | 上60px | 下260px |
| **安全領域** | **上100px以下** | **下280px以上** |

---

## パイプライン 4ステップ

### STEP 1: scrape-hooks.js

```bash
node scripts/scrape-hooks.js --lang en --count 1
node scripts/scrape-hooks.js --lang ja --count 1
```

- creators.json のクリエイター URL → yt-dlp で最新 Shorts 1本 DL
- used_hooks.json で重複防止
- 出力: `hooks/raw/{lang}/{creator}_{videoId}.mp4`

### STEP 2: trim-and-stitch.js

```bash
node scripts/trim-and-stitch.js --lang en --count 1
node scripts/trim-and-stitch.js --lang ja --count 1
```

1. フック動画を3秒にトリム (ffmpeg, 1080x1920)
2. CTA動画と結合 (ffmpeg concat)
3. フック音声は3秒で終了、CTA部分は phonk BGM が流れる
4. 出力: `output/{lang}/mau_{lang}_{timestamp}.mp4` (10秒)

### STEP 3: post-to-postiz.js

```bash
node scripts/post-to-postiz.js --lang en
node scripts/post-to-postiz.js --lang ja
```

- output/{lang}/ の最新1本を Postiz API で投稿
- EN: 3プラットフォーム (TikTok + YouTube + Instagram)
- JA: 3プラットフォーム (TikTok + YouTube + Instagram)
- Postiz API: `Authorization: ${POSTIZ_API_KEY}` (Bearer prefix不要)
- Rate Limit: 30 req/hour → 1 cron で upload 1 + create 1 = 2 req

### STEP 4: cleanup

- used_hooks.json に URL 追加
- post-log.json に投稿記録
- output/ のファイルはオプションで削除（再投稿防止）

---

## Postiz API

| 項目 | 値 |
|------|-----|
| CLI | `/opt/homebrew/bin/postiz` v2.0.12 |
| API Key | `~/.config/mobileapp-builder/.env` → `POSTIZ_API_KEY` |
| Rate Limit | 30 req/hour |
| 認証 | `Authorization: ${POSTIZ_API_KEY}` (Bearer prefix不要) |
| 1回のcron消費 | upload 1 + create 1 = 2 req |

---

## スキル構造

```
~/.openclaw/skills/mau-tiktok/           ← OSS配布用
├── SKILL.md
├── scripts/
│   ├── scrape-hooks.js                   ← STEP 1
│   ├── trim-and-stitch.js                ← STEP 2
│   └── post-to-postiz.js                ← STEP 3
├── templates/
│   └── cta-video/                        ← Remotionプロジェクト
│       ├── src/Root.tsx
│       ├── src/compositions/CtaVideo.tsx
│       ├── public/
│       │   ├── anicca-icon.png
│       │   ├── procrastination_1_en.png
│       │   ├── procrastination-jp.png
│       │   └── bgm_phonk_final.mp3
│       └── package.json
├── config/
│   ├── creators-example.json
│   └── cta-props.json
└── references/
    ├── posting-targets.md
    └── creator-selection.md

~/.openclaw/workspace/mau-tiktok/         ← ランタイム（gitignore）
├── creators.json                         ← 実際のクリエイター設定
├── used_hooks.json                       ← 使用済みURL
├── post-log.json                         ← 投稿記録
├── config.json                           ← Postiz設定
├── cta/
│   ├── en/cta-en-v4.mp4                 ← レンダリング済みCTA（再利用）
│   ├── ja/cta-ja-v4.mp4
│   └── *.norm.mp4                        ← 正規化済み
├── hooks/
│   ├── raw/{lang}/                       ← yt-dlp DL先
│   └── trimmed/{lang}/                   ← 3秒トリム済み
└── output/
    ├── en/mau_en_{ts}.mp4               ← 最終動画
    └── ja/mau_ja_{ts}.mp4
```

---

## creators.json（確定）

```json
{
  "creators": [
    { "name": "ZackD Films", "url": "https://www.youtube.com/@ZackDFilms/shorts", "lang": "en", "category": "brainrot-comedy" },
    { "name": "Frorav", "url": "https://www.youtube.com/@Froravofficial/shorts", "lang": "ja", "category": "brainrot-animation" },
    { "name": "seeyou", "url": "https://www.youtube.com/@seeyou_seeyou2/shorts", "lang": "ja", "category": "brainrot-animation" }
  ]
}
```

**JA クリエイターはダイスがサンプル確認後に最終確定。**

---

## 出力ルール

- **絶対に上書きしない。** v1, v2, v3, v4 とバージョン付き
- CTA動画: `cta-en-v4.mp4`, `cta-ja-v4.mp4`
- stitched出力: `output/{lang}/mau_{lang}_{timestamp}.mp4`
- CTA動画は1回作ったら全動画で再利用（毎回レンダリングしない）

---

## To-Do

| # | タスク | 状態 |
|---|--------|------|
| 1 | BGM最終カット（bgm_phonk_00002 → last 1s削除 → bgm_phonk_final.mp3） | 完了 |
| 2 | JA クリエイター候補DL（Frorav + seeyou）→ ダイス確認 | 進行中 |
| 3 | CTA v4 Remotion リライト（CtaVideo.tsx） | 未着手 |
| 4 | Remotion public/ にアセット配置 | 未着手 |
| 5 | CTA v4 レンダリング（EN + JA） | 未着手 |
| 6 | post-to-postiz.js 実装 | 未着手 |
| 7 | trim-and-stitch.js 修正（v4 CTA + phonk BGM） | 未着手 |
| 8 | creators.json 更新 | 未着手 |
| 9 | E2E 手動テスト | 未着手 |
| 10 | jobs.json に 4 cron 定義 | 未着手 |
| 11 | openclaw gateway restart | 未着手 |
