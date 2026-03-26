# mau-tiktok パイプライン完全仕様 v5

**Status:** IN PROGRESS
**Date:** 2026-03-26
**Branch:** dev

---

## 概要

バイラル YouTube Shorts の最初3秒をフックとして使い、先延ばし防止 CTA 動画を結合して TikTok/YouTube/Instagram に自動投稿するパイプライン。

**原則:** Prayer Lock (mau-model.mov) を完全コピー。オリジナルゼロ。

```
最終投稿動画 (9秒):
┌──────────┐  ┌──────────────────┐
│ HOOK (3s) │ +│  CTA CLIP (6s)    │
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
| CTA構造 | Prayer Lock式 2フェーズ（質問→VALUE PROP）、白帯テキスト + カード画像 |
| CTA尺 | **6秒**（Phase A 2s + Phase B 4s） |
| BGM | phonk/ロックイン系（`bgm_phonk_trimmed.mp3` 約4.9秒、最後1秒カット） |
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
| JA | seeyou | `https://www.youtube.com/@seeyou_seeyou2/shorts` | brainrot-animation |

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

## CTA動画 v5 仕様（Prayer Lock 完全コピー）

### 参考元: Prayer Lock YouTube Shorts フレーム分析

```
Prayer Lock 実物 (2本DL分析、各11.4s):

0-3s     バズフック（バイラルアニメ映像 + 字幕テキスト）
3-4.5s   ┌─ 白帯（上部）─────────────────────────┐
         │  "did you pray today bro??"             │
         ├─────────────────────────────────────────┤
         │  Prayer Lock アイコン（中央）              │
         │  暗い映像背景                             │
         └─────────────────────────────────────────┘
4.5-7.5s ┌─ 白帯（上部）─────────────────────────┐
         │  "block your phone until you            │
         │   pray with 'prayer lock'               │
         │   (it's on the app store)"              │
         ├─────────────────────────────────────────┤
         │  Prayer Lock アイコン（中央）              │
         │  明るい金色映像背景                        │
         └─────────────────────────────────────────┘
7.5-11s  同上 + 下部 "amen if you believe"

核心パターン:
  1. テキストは常に上部白帯（白背景 + 黒テキスト）
  2. テキストだけが Phase A→B で切り替わる
  3. カード/画像はテキストの下に常時表示
  4. 背景は暗→明に変化（dramatic feel）
```

### Anicca CTA v5 構造 (6s = 180 frames @ 30fps)

**2バージョン作成:** v1（ロゴなし）+ v2（ロゴあり）

```
Phase A: 質問 (frame 0-60, 0-2s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌─ 白帯 (上部 450px) ─────────────────┐
  │  EN: "still procrastinating??"       │
  │  JA: "まだ先延ばし？"                  │
  │  テキスト: 黒、spring fade in (0-15f) │
  ├──────────────────────────────────────┤
  │  procrastination カード画像            │
  │  （白帯の下、全幅表示）                 │
  │  アプリの実際のUX/Nudge画面            │
  └──────────────────────────────────────┘
  音楽: frame 45-60 で phonk フェードイン

Phase B: VALUE PROP (frame 60-180, 2-6s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌─ 白帯 (上部 450px) ─────────────────┐
  │  EN: "stop procrastinating           │
  │       with 'anicca'                  │
  │       (it's on the app store)"       │
  │  JA: "アニッチャが                    │
  │       先延ばしを通知してくれる          │
  │       (App Storeで公開中)"            │
  │  テキスト切替: spring swap (60-75f)   │
  ├──────────────────────────────────────┤
  │  procrastination カード画像（同じ）     │
  │  [v2のみ] Aniccaアイコン オーバーレイ   │
  │           spring登場 (75-90f)         │
  └──────────────────────────────────────┘
  音楽: phonk フル → frame 150-180 フェードアウト
```

### CTA バージョン

| バージョン | Phase A | Phase B | ファイル名 |
|-----------|---------|---------|-----------|
| v1 (no logo) | 質問 + カード | バリュープロップ + カード | `cta_{lang}_v1_nologo.mp4` |
| v2 (with logo) | 質問 + カード | バリュープロップ + カード + アイコン | `cta_{lang}_v2_logo.mp4` |

### CTA テキスト（確定）

| 要素 | EN | JA |
|------|----|----|
| Phase A 質問 | "still procrastinating??" | "まだ先延ばし？" |
| Phase B VALUE PROP | "stop procrastinating\nwith 'anicca'\n(it's on the app store)" | "アニッチャが\n先延ばしを通知してくれる\n(App Storeで公開中)" |

### CTA アセット

| アセット | パス |
|---------|------|
| EN カード画像 | `/Users/anicca/anicca-project/assets/card-screenshots/en/procrastination_1.png` |
| JA カード画像 | `/Users/anicca/Desktop/mau-tiktok-preview/new-ja/procrastination-jp.png` |
| Anicca アイコン | `/Users/anicca/anicca-project/aniccaios/aniccaios/Assets.xcassets/AppIcon.appiconset/icon-1024.png` |
| BGM (元) | `/Users/anicca/Desktop/ja-creator-samples/bgm_phonk_final.mp3` (約5.9秒) |
| BGM (トリム済) | `bgm_phonk_trimmed.mp3` (約4.9秒、最後1秒カット) |

### CTA Remotion 設定

```json
{
  "en": {
    "phaseA": { "text": "still procrastinating??" },
    "phaseB": { "text": "stop procrastinating\nwith 'anicca'\n(it's on the app store)" },
    "cardImage": "procrastination_1_en.png",
    "font": "Inter"
  },
  "ja": {
    "phaseA": { "text": "まだ先延ばし？" },
    "phaseB": { "text": "アニッチャが\n先延ばしを通知してくれる\n(App Storeで公開中)" },
    "cardImage": "procrastination-jp.png",
    "font": "Noto Sans JP"
  },
  "common": {
    "fps": 30,
    "width": 1080,
    "height": 1920,
    "durationFrames": 180,
    "durationSeconds": 6,
    "whiteBand": {
      "height": 450,
      "bgColor": "#FFFFFF",
      "textColor": "#000000"
    },
    "bgm": "bgm_phonk_trimmed.mp3",
    "bgmFadeIn": { "startFrame": 45, "endFrame": 60 },
    "bgmFadeOut": { "startFrame": 150, "endFrame": 180 },
    "icon": "anicca-icon.png",
    "phases": {
      "A": { "startFrame": 0, "endFrame": 60 },
      "B": { "startFrame": 60, "endFrame": 180 }
    },
    "versions": ["v1_nologo", "v2_logo"]
  }
}
```

### アニメーション詳細

| アニメーション | フレーム | 手法 | 設定 |
|-------------|---------|------|------|
| Phase A テキスト登場 | 0-15 | `spring()` fade in | `{ damping: 200 }` |
| カード画像 | 0-180 | static | 白帯下に常時表示 |
| BGM フェードイン | 45-60 | `<Audio>` volume callback | `interpolate(f, [45,60], [0,0.3])` |
| テキスト A→B 切替 | 60-75 | `spring()` swap | `{ damping: 20, stiffness: 200 }` snappy |
| BGM フル | 60-150 | volume 1.0 | — |
| [v2] アイコン登場 | 75-90 | `spring()` scale | `{ damping: 8 }` bouncy |
| BGM フェードアウト | 150-180 | `<Audio>` volume callback | `interpolate(f, [150,180], [1,0])` |

### Remotion BP チェック (MUST)

| ルール | 対応 |
|--------|------|
| `useCurrentFrame()` のみ | MUST — CSS animation/transition 禁止 |
| `extrapolateRight: "clamp"` 全interpolate | MUST |
| `staticFile()` for assets | MUST |
| `<Img>` for images | MUST — native `<img>` 禁止 |
| `<Audio>` from `@remotion/media` | MUST — volume callback でフェード |
| `<Sequence>` + `premountFor` | MUST — Phase B 要素に適用 |
| `<Series>` for Phase A→B | MUST — overlap なし |
| Font: `@remotion/google-fonts` | MUST — Inter (EN), Noto Sans JP (JA)、subset指定 |
| No `<Video>` | MUST — 静止画 + テキスト + オーディオのみ |
| `spring()` config | `{ damping: 200 }` smooth / `{ damping: 20, stiffness: 200 }` snappy / `{ damping: 8 }` bouncy |

### Green Zone テキスト配置

| プラットフォーム | 上部NG | 下部NG |
|---------------|--------|--------|
| TikTok | 上100px | 下280px |
| YouTube Shorts | 上80px | 下200px |
| Instagram Reels | 上60px | 下260px |
| **安全領域** | **上100px以下** | **下280px以上** |

白帯テキストは上100px〜450pxに配置（安全領域内）。カード画像は450px〜1640px（下280px確保）。

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
4. 出力: `output/{lang}/mau_{lang}_{timestamp}.mp4` (9秒 = hook 3s + CTA 6s)

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
│   ├── en/cta_en_v1_nologo.mp4          ← v1 ロゴなし
│   ├── en/cta_en_v2_logo.mp4           ← v2 ロゴあり
│   ├── ja/cta_ja_v1_nologo.mp4
│   ├── ja/cta_ja_v2_logo.mp4
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
    { "name": "seeyou", "url": "https://www.youtube.com/@seeyou_seeyou2/shorts", "lang": "ja", "category": "brainrot-animation" }
  ]
}
```

**JA クリエイター: seeyou 確定済み。**

---

## 出力ルール

- **絶対に上書きしない。** バージョン付き
- CTA動画: `cta_{lang}_v1_nologo.mp4`, `cta_{lang}_v2_logo.mp4`
- stitched出力: `output/{lang}/mau_{lang}_{timestamp}.mp4`
- CTA動画は1回作ったら全動画で再利用（毎回レンダリングしない）
- ダイスがv1/v2を確認後、採用バージョンを確定

---

## To-Do

| # | タスク | 状態 |
|---|--------|------|
| 1 | BGM最終カット（bgm_phonk_00002 → last 1s削除 → bgm_phonk_final.mp3） | 完了 |
| 2 | JA クリエイター確定（seeyou） | 完了 |
| 3 | Prayer Lock Shorts 分析 → CTA v5 構造確定 | 完了 |
| 4 | BGM トリム（bgm_phonk_final → 最後1秒カット → bgm_phonk_trimmed.mp3） | 未着手 |
| 5 | CTA v5 動画作成（EN v1 + EN v2 + JA v1 + JA v2 = 4本） | 未着手 |
| 6 | ダイスが v1/v2 確認 → 採用バージョン確定 | 未着手 |
| 7 | creators.json 作成 | 未着手 |
| 8 | used_hooks.json 初期化 | 未着手 |
| 9 | scrape-hooks.js 更新（seeyou確定反映） | 未着手 |
| 10 | trim-and-stitch.js 更新（v5 CTA 6秒 + phonk BGM） | 未着手 |
| 11 | post-to-postiz.js 新規作成 | 未着手 |
| 12 | SKILL.md 更新（4 cron + seeyou確定） | 未着手 |
| 13 | jobs.json に 4 cron 追加 | 未着手 |
| 14 | `openclaw gateway restart` | 未着手 |
| 15 | E2E テスト（手動1回実行） | 未着手 |
