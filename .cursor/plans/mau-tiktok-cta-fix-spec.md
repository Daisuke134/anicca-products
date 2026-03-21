# mau-tiktok CTA動画修正 + パイプライン完全仕様

**Status:** IN PROGRESS
**Date:** 2026-03-21
**Branch:** dev

---

## 確定事項

| 項目 | 確定値 |
|------|--------|
| TikTok EN | `anicca.en7` (ID: `cmmtt62wq01lqn50yehk1f6dy`) |
| TikTok JA | `aniccajp6` (ID: `cmmytdj1101w1p30ytx8lj0fw`) |
| YouTube EN | `@anicca-ai` (ID: `cmmzukbkw04ulp30yfvijrwio`) |
| YouTube JA | **不要** |
| Instagram EN | `anicca.ai` (ID: `cmmzzg2es0539p30ycb94ayx0`) |
| Instagram JA | `anicca.jp` (ID: `cmmzujxpa04ujp30yxqpg1vci`) |
| X (Twitter) | **不要** |
| Cron | **2回/日** (09:00 / 21:00 JST) |
| CTA構造 | **1クリップ**（TransitionSeries廃止） |
| Postiz Rate Limit | 30 req/hour → 2回/日で24 req ✅ |

---

## CTA動画 v3 仕様

### 記事準拠の2フェーズ構造

**原則:** "use familiar viral videos as hooks and then stitch **a direct CTA** to the video"
→ CTA clip は**1つの滑らかなクリップ**。3シーン分割禁止。TransitionSeries禁止。

```
最終投稿動画 (10秒):
┌──────────┐  ┌──────────────────┐
│ HOOK (3s) │ +│  CTA CLIP (7s)    │
│ バズ動画   │  │  1つの連続映像     │
└──────────┘  └──────────────────┘
```

### CTA clip 内部構造 (7秒 = 210f @ 30fps)

```
┌────────────────────────────────────┐
│  CTA CLIP (7秒・1クリップ)          │
│  1080×1920 (9:16) @ 30fps = 210f   │
│  1つの AbsoluteFill で全要素制御    │
│                                    │
│  frame 0-120 (0-4s): DEMO          │
│  ┌──────────────────────────────┐  │
│  │  青→シアン グラデーション背景   │  │
│  │                              │  │
│  │  "Anicca" / "アニッチャ"      │  │
│  │  (spring fade in)            │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  📱 iPhone画面 (大)     │  │  │
│  │  │  500×1080              │  │  │
│  │  │  startFrom=通知タップ   │  │  │
│  │  │  pauseWhenBuffering    │  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  │  ♪ BGM fade in              │  │
│  └──────────────────────────────┘  │
│                                    │
│  frame 120-210 (4-7s): CTA         │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │  "Anicca" / "アニッチャ"      │  │
│  │  (ロゴ大きく)                 │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  Download Free         │  │  │
│  │  │  / 無料で始める         │  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  │  Free · iOS / 無料 · iPhone  │  │
│  │                              │  │
│  │  ♪ BGM fade out             │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

### Green Zone テキスト配置 (ReelClaw準拠)

| プラットフォーム | 上部NG | 下部NG |
|---------------|--------|--------|
| TikTok | 上100px | 下280px |
| YouTube Shorts | 上80px | 下200px |
| Instagram Reels | 上60px | 下260px |
| **安全領域** | **上100px以下** | **下280px以上** |

→ テキスト・ボタンは Y: 100px 〜 1640px の範囲内に配置

### テキスト (v3)

| 項目 | EN | JA |
|------|----|----|
| アプリ名 | "Anicca" | "アニッチャ" |
| CTA | "Download Free" | "無料で始める" |
| Badge | "Free · iOS" | "無料 · iPhone" |
| フックテキスト | **なし（削除）** | **なし（削除）** |
| Font | Inter (700, 900) | NotoSansJP (700, 900) |

### デザイン (v3)

| 項目 | 値 |
|------|-----|
| 背景 | 青→シアン グラデーション (#1E3A8A → #06B6D4) |
| iPhone画面 | 500×1080px (46% of frame) |
| アプリ名 font size | 80px |
| CTA button font size | 52px |
| Badge font size | 36px |
| BGM | `staticFile("bgm.mp3")` fade in/out |

### Remotion BP チェック (v3 MUST)

| ルール | 対応 |
|--------|------|
| `useCurrentFrame()` のみ | ✅ |
| `extrapolateRight: "clamp"` 全interpolate | MUST |
| `<Video>` from `@remotion/media` | MUST |
| `pauseWhenBuffering` on Video | MUST |
| `startFrom` on demo Video | MUST |
| `staticFile()` for assets | MUST |
| No TransitionSeries | MUST (v2のバグ原因) |
| Font subset指定 | MUST |

---

## パイプライン仕様

### 投稿先マッピング

| 言語 | TikTok | YouTube | Instagram |
|------|--------|---------|-----------|
| EN | `anicca.en7` | `@anicca-ai` | `anicca.ai` |
| JA | `aniccajp6` | — | `anicca.jp` |

### Cron スケジュール (2回/日)

| Time (JST) | EN | JA | 合計 |
|------------|----|----|------|
| 09:00 | 3本 → TikTok + YouTube + IG | 3本 → TikTok + IG | 6本 |
| 21:00 | 3本 → TikTok + YouTube + IG | 3本 → TikTok + IG | 6本 |
| **日計** | 6本 × 3platform = 18投稿 | 6本 × 2platform = 12投稿 | **30投稿/日** |
| **月計** | | | **~900投稿/月** |

### Postiz API

| 項目 | 値 |
|------|-----|
| CLI | `/opt/homebrew/bin/postiz` v2.0.12 |
| API Key | `~/.config/mobileapp-builder/.env` → `POSTIZ_API_KEY` |
| Rate Limit | 30 req/hour |
| 認証 | `Authorization: ${POSTIZ_API_KEY}` (Bearer prefix不要) |
| 1回のcron消費 | upload 6 + create 6 = 12 req |

### creators.json

```json
{
  "creators": [
    { "name": "ZackD Films", "url": "https://www.youtube.com/@ZackDFilms/shorts", "lang": "en", "category": "brainrot-comedy" },
    { "name": "TakeAction", "url": "https://www.youtube.com/@takeaction1674/shorts", "lang": "ja", "category": "motivation" },
    { "name": "コーチジョージ", "url": "https://www.youtube.com/@coachjoji/shorts", "lang": "ja", "category": "self-improvement" },
    { "name": "樺沢紫苑", "url": "https://www.youtube.com/@kabachannel/shorts", "lang": "ja", "category": "mental-health" },
    { "name": "ユニグラ", "url": "https://www.youtube.com/@unitedgratitude/shorts", "lang": "ja", "category": "motivation" }
  ]
}
```

---

## 出力ルール

- **絶対に上書きしない。** v1, v2, v3 とバージョン付き
- CTA動画: `cta-en-v3.mp4`, `cta-ja-v3.mp4`
- stitched出力: `output/{lang}/mau_{lang}_{timestamp}_{index}.mp4`
