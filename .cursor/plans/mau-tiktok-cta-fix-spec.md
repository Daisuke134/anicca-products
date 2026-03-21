# mau-tiktok CTA動画修正 + パイプライン完全仕様

**Status:** PLANNING（未実装）
**Date:** 2026-03-21
**Branch:** dev → feature/mau-tiktok-v3 (worktree)

---

## 開発環境

| 項目 | 値 |
|------|-----|
| Worktree | `../anicca-mau-tiktok` (未作成) |
| ブランチ | `feature/mau-tiktok-v3` |
| 対象ファイル | `~/.openclaw/workspace/mau-tiktok/` 配下 |
| Remotionソース | `~/.openclaw/workspace/mau-tiktok/cta-video/` |

---

## 1. 自己検査結果（Q1）

### 現状のCTA動画 (v2) の問題

| 検査項目 | EN | JA | 判定 |
|----------|----|----|------|
| Scene 1 (Hook テキスト 0-2.5s) | 白テキスト + blue glow 表示 | 表示 | ⚠️ テキスト小さい |
| Scene 2 (Demo 2.5-5.5s) | iPhone枠 + デモ動画再生 | 再生 | ⚠️ 画面小さすぎ |
| Scene 3 (CTA 5.5-7s) | **真っ黒** | **真っ黒** | 🔴 致命的 |
| BGM | 再生される | 再生される | ✅ |
| 最後0.7秒 (6.3-7s) | **真っ黒** | **真っ黒** | 🔴 致命的 |

### 🔴 根本原因: TransitionSeries の尺計算バグ

```
Scene 1:    Math.round(2.5 * 30) = 75f
Transition: Math.round(0.4 * 30) = 12f (overlap)
Scene 2:    Math.round(3.0 * 30) = 90f
Transition: Math.round(0.3 * 30) =  9f (overlap)
Scene 3:    Math.round(1.5 * 30) = 45f
─────────────────────────────────────────
TransitionSeries合計: 75 + 90 + 45 - 12 - 9 = 189f
Composition合計:                              210f
差分:                                          21f (0.7s) → 真っ黒
```

- Scene 3 は frame 144〜188 で描画
- Frame 189〜210 は**何も描画されない → 真っ黒**
- Scene 3 の実効時間は 45f 中 9f がfade transitionに食われ、**実質36f (1.2s)**

---

## 2. パイプライン構造理解（Q2）

CTAは最終出力ではない。最終投稿動画は hook + CTA のstitch。

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│  バズ Hook    │ +  │  CTA動画      │ =  │  最終投稿動画          │
│  (3秒)       │    │  (7秒)        │    │  (10秒)              │
│  YouTube由来  │    │  Remotion製    │    │  TikTok/YT/IG投稿    │
└──────────────┘    └──────────────┘    └──────────────────────┘
  ↑ 毎回変わる        ↑ 固定・再利用      ↑ これが視聴者に見える
```

- 現在のstitched出力: `mau_en_1774081944387_0.mp4` = 10.1秒 (3s hook + 7s CTA) ✅
- Scene 3が真っ黒 → **最終投稿動画の最後1.5秒も真っ黒**

---

## 3. BGM保存場所（Q3）

| ファイル | パス | サイズ | 状態 |
|---------|------|--------|------|
| bgm.mp3 | `~/.openclaw/workspace/mau-tiktok/cta-video/public/bgm.mp3` | 419KB | ✅ 永続保存済み |

- Remotionの `staticFile("bgm.mp3")` で参照
- CTA動画にベイク済み
- Hook部分にはBGMなし（元のYouTube音声がそのまま）

---

## 4. Remotion BP違反チェックリスト（Q4）

### 致命的 (🔴)

| # | ルール (Remotion Skill Rule) | 現状 | 修正 |
|---|-----|------|------|
| T3 | TransitionSeries合計尺 = scenes - transitions = Composition尺 | 189f ≠ 210f → 21f黒画面 | Scene 3 を 45f → 66f に拡大、または Composition を 189f に |
| V-new | Video に `pauseWhenBuffering` 付与 | なし → レンダリング時バッファリングで黒フレーム可能性 | `<Video pauseWhenBuffering />` 追加 |
| Demo | Demo動画に `startFrom` 指定 | なし → 冒頭から再生、通知→タップ→カード表示シーンが映らない | `startFrom={適切なフレーム}` でジャンプ |
| Demo-dur | demo-en.mp4 = 23.6s vs Scene 2 = 3s | 20.6秒無駄。見せたい場面が映らない可能性大 | `startFrom` + 必要ならデモ動画を再トリミング |

### 警告 (⚠️)

| # | ルール | 現状 | 修正 |
|---|--------|------|------|
| F2 | fonts: `weights`と`subsets`指定でサイズ削減 | `loadFont()` 引数なし → 全weight/subset読み込み | `loadFont("normal", { weights: ["700", "900"], subsets: ["japanese"] })` |

### 合格 (✅)

| # | ルール | 判定 |
|---|--------|------|
| A1 | `useCurrentFrame()` のみ（CSS animation禁止） | ✅ |
| TI2 | 全`interpolate`に`extrapolateRight:"clamp"` | ✅ |
| V1 | `<Video>` は `@remotion/media` から import | ✅ |
| AU1 | `<Audio>` は `@remotion/media` から import | ✅ |
| AS1 | `staticFile()` でアセット参照 | ✅ |
| C4 | props は `type` 宣言 (`interface` 禁止) | ✅ |
| AU4 | volume callback `f` は Audio開始時 0 始まり | ✅ |
| S1 | TransitionSeries使用なので `premountFor` 不要 | ✅ |

---

## 5. JA版テキスト・デザイン修正（Q5）

### テキスト修正

| 項目 | 現状 (v2) | v3修正案 |
|------|-----------|---------|
| アプリ名 | "Anicca" (英語) | **"アニッチャ"** (日本語読み) |
| Hook テキスト (headline) | "何度も同じ習慣に負けていませんか？" | **"また同じこと、繰り返してない？"** |
| Subline | "崩れる瞬間にAniccaが介入します" | **"崩れそうな瞬間、アニッチャが止める"** |
| CTA | "無料ダウンロード" | **"無料で始める"** |
| Badge | "無料 · iOS" | **"無料 · iPhone"** |

**"同じ習慣に負ける"が意味不明な理由:** 日本語で「習慣に負ける」は不自然。「誘惑に負ける」「自分に負ける」なら通じるが「習慣に負ける」は意味が通らない。TikTok/Shortsのフックは**口語+問いかけ**が鉄則。

### デザイン修正

| 項目 | 現状 (v2) | v3修正案 |
|------|-----------|---------|
| headline size (JA) | 100px | **120px** |
| subline size (JA) | 44px | **52px** |
| CTA size (JA) | 48px | **52px** |
| headline size (EN) | 120px | 120px (変更なし) |
| subline size (EN) | 48px | **56px** |
| iPhone画面 width | 380px | **500px** |
| iPhone画面 height | 820px | **1080px** |
| iPhone画面比率 | 35% of frame | **46% of frame** |

### Demo動画

| 項目 | 現状 | v3 |
|------|------|-----|
| demo-en.mp4 | 23.6秒、冒頭から再生 | `startFrom` で通知タップ→カード表示シーンにジャンプ |
| demo-ja.mp4 | 10.1秒、冒頭から再生 | `startFrom` で通知タップ→カード表示シーンにジャンプ |
| pauseWhenBuffering | なし | `<Video pauseWhenBuffering />` |

---

## 6. JA用クリエイター候補（Q6）

### 現状

- `creators.json` に ZackD Films のみ (EN用)
- JA用クリエイター: 0
- JA output フォルダ: 空（JA動画0本）

### 追加候補

| 優先度 | チャンネル | URL | カテゴリ | フック適性 |
|--------|-----------|-----|---------|-----------|
| **S** | TakeAction | `@takeaction1674/shorts` | モチベーション | ZackDと同一フォーマット。映像+ナレーション。2.6M再生 |
| **S** | メンズコーチ ジョージ / 危機感ニキ | `@coachjoji/shorts` | 男磨き・自己変革 | TikTok 5.6M再生。「お前このままでいいの？」系叱咤フック |
| **A** | 精神科医・樺沢紫苑 | `@kabachannel/shorts` | メンタルヘルス | 33万人。「○○な人は危険」系フック。Aniccaと親和性最高 |
| **A** | United Gratitude ユニグラ | `@unitedgratitude/shorts` | モチベーション | 23万人。ZackDに最も近い映画的映像+ナレーション |
| **B** | フェルミ漫画大学 | `@fermi/shorts` | 書籍要約 | 64万人。漫画形式「○○する人は損してる」フック |
| **B** | 鴨頭嘉人 | `@kamogashira/shorts` | 講演 | 「皆さん○○って知ってますか？」問いかけフック |

### creators.json 更新案

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

## 7. 完全ビジュアルフロー（Q7）

### 全体パイプライン

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CRON 1日3回 (09:00 / 15:00 / 21:00 JST)  × EN + JA = 18本/日
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  STEP 1: SCRAPE                STEP 2: TRIM
  ┌─────────────────┐           ┌─────────────────┐
  │ YouTube Shorts   │──yt-dlp──▶│ hooks/raw/*.mp4  │──ffmpeg -t 3──▶
  │ (creators.json)  │           │ (フル動画)        │
  │ × skip used_hooks│           └─────────────────┘
  └─────────────────┘
                                ┌─────────────────┐
                           ──▶  │ hooks/trimmed/   │
                                │ *.mp4 (3秒)      │
                                └────────┬────────┘
                                         │
  STEP 3: STITCH                         │
  ┌─────────────────┐           ┌────────▼────────┐
  │ cta-en.mp4 (7s)  │──concat──▶│ output/en/*.mp4  │
  │ cta-ja.mp4 (7s)  │           │ (10秒 = 3s+7s)  │
  │ (Remotion製/固定) │           └────────┬────────┘
  └─────────────────┘                    │
                                         │
  STEP 4: POST                           │
  ┌─────────────────┐           ┌────────▼────────┐
  │ Postiz API       │◀─upload──│ 最終動画 (10秒)   │
  │ • TikTok         │           │ EN 3本 + JA 3本  │
  │ • YouTube Shorts │           └─────────────────┘
  │ • Instagram Reels│
  └─────────────────┘
```

### 最終投稿動画の構造

```
  ┌────────────────────────────────────────────────────┐
  │                  10秒の動画                         │
  │                                                    │
  │  ┌──────────┐  ┌────────────────────────────────┐  │
  │  │ HOOK (3s) │  │         CTA VIDEO (7s)          │  │
  │  │           │  │                                  │  │
  │  │ バズ動画の │  │ Scene1   Scene2      Scene3     │  │
  │  │ 冒頭3秒   │  │ Hook     Demo        CTA        │  │
  │  │           │  │ テキスト  iPhone画面  ロゴ+ボタン  │  │
  │  │ (YouTube  │  │ (2.5s)   (3s)       (1.5s)     │  │
  │  │  から借用) │  │                                  │  │
  │  └──────────┘  └────────────────────────────────┘  │
  │                                                    │
  │  ↑ 注意引き     ↑ これは何？→ 欲しい！→ DL！       │
  └────────────────────────────────────────────────────┘
```

### ファイル構造（現在の状態）

```
~/.openclaw/workspace/mau-tiktok/
├── cta-en.mp4              ✅ 7s, 1080×1920 (Scene3真っ黒🔴)
├── cta-ja.mp4              ✅ 7s, 1080×1920 (Scene3真っ黒🔴)
├── cta-en-norm.mp4         ✅ ffmpeg正規化済み
├── cta-video/              ✅ Remotionソース
│   ├── src/compositions/CtaVideo.tsx
│   └── public/bgm.mp3     ✅ BGM永続保存
├── hooks/
│   ├── raw/      (3本: ZackD Films)  ✅
│   └── trimmed/  (3本: 3秒)          ✅
├── output/
│   ├── en/       (1本: 10.1秒)       ✅ (Scene3黒い🔴)
│   └── ja/       (0本)               🔴 JA未生成
├── creators.json (ZackDのみ)         🔴 JA未設定
├── used_hooks.json                   ✅
└── config.json                       ⚠️ Postiz未設定
```

---

## 修正パッチリスト（優先度順）

| Patch # | 修正内容 | 対象ファイル | 深刻度 | 工数 |
|---------|---------|-------------|--------|------|
| P1 | TransitionSeries尺修正 (Scene3: 45f→66f) | CtaVideo.tsx | 🔴 致命的 | 1行 |
| P2 | Video `pauseWhenBuffering` 追加 | CtaVideo.tsx | 🔴 | 1行 |
| P3 | Demo動画 `startFrom` 指定 | CtaVideo.tsx | 🔴 | 1行 |
| P4 | iPhone画面サイズ拡大 (380×820 → 500×1080) | CtaVideo.tsx | 🟡 | 2行 |
| P5 | テキストサイズ拡大 (headline/subline/cta) | CtaVideo.tsx | 🟡 | 8行 |
| P6 | JA テキスト全面改稿 (アニッチャ + 口語) | CtaVideo.tsx | 🟡 | 10行 |
| P7 | Font weights/subsets 指定 | CtaVideo.tsx | ⚪ | 2行 |
| P8 | creators.json にJAクリエイター追加 | creators.json | 🟡 | JSON |
| P9 | scrape-hooks.js に lang フィルタ追加 | scrape-hooks.js | 🟡 | 10行 |
| P10 | Postiz API 接続 + post-to-postiz.js | post-to-postiz.js | 🟡 | 新規 |
| P11 | OpenClaw cron 設定 (3x/day) | jobs.json | 🟡 | JSON |

---

## 出力ルール

- **絶対に上書きしない。** v1, v2, v3 とバージョン付き
- CTA動画レンダリング後: `cta-en-v3.mp4`, `cta-ja-v3.mp4`
- stitched出力: `output/en/mau_en_{timestamp}_{index}.mp4`
