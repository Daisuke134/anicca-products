# 10K MRR Growth Spec — Anicca iOS + Honne AI

> **Goal**: 10K MRR by end of April 2026
> **Date**: 2026-04-08
> **Branch**: feature/10k-mrr-growth (worktree from dev)
> **Status**: PLANNING

---

## 開発環境

| 項目 | 値 |
|------|-----|
| ワークツリー | `../anicca-10k-mrr` |
| ブランチ | `feature/10k-mrr-growth` |
| ベース | `dev` |

---

## 1. PostHog A/B Test — 現状と方針

### 実データ（2026-04-01〜04-08、PostHog API取得）

| | control (Variant A) | test (Variant B) |
|---|---|---|
| 画面 | PlanSelectionStepView | PaywallVariantBView |
| 表示回数 | 38 | 93 |
| 購入数 | 6 (annual 3 + monthly 3) | 9 (annual 6 + monthly 3) |
| CVR | 15.8% | 9.7% |

サンプル数不足（n=131）で統計的有意差なし。データ収集継続。

### 方針: PostHogそのまま + Localizable修正のみ

- PostHog A/Bテスト（デザインAかBか）はそのまま稼働継続
- テキスト変更はLocalizable.strings修正 → 再提出
- PostHog payloadによるテキスト動的変更は使わない
- 価格は**100%動的**（RevenueCat `localizedPriceString` から取得。ハードコードなし）
- Superwall/RC Paywalls移行は v1.9以降

### Primer画面修正（Localizable.strings — 再提出必要）

| ファイル | Before | After |
|---------|--------|-------|
| `en.lproj` L1325 | "We want you to try\nAnicca for free" | "Start your\nAnicca journey" |
| `en.lproj` L1326 | "...Experience the full journey risk-free." | "Your personalized plan is ready." |
| `ja.lproj` 対応行 | JA版 primer title | "あなたのAniccaの\n旅を始めよう" |
| `ja.lproj` 対応行 | JA版 primer subtitle | "あなた専用プランの準備ができました。" |
| `es.lproj` 対応行 | ES版 primer title | "Comienza tu\nviaje con Anicca" |
| `es.lproj` 対応行 | ES版 primer subtitle | "Tu plan personalizado está listo." |

---

## 2. Widget Extension（バイラル機能 #1）

### 仕様

| 項目 | 値 |
|------|-----|
| Widget種類 | Home Screen (systemSmall, systemMedium) + Lock Screen (accessoryRectangular) |
| 表示内容 | ユーザーの選択した悩み（problem）に関連するNudgeテキスト |
| 更新頻度 | 毎日（TimelineReloadPolicy: `.atEnd`, 24h間隔） |
| Premium限定 | **いいえ — 全ユーザーに開放** |
| データ共有 | App Groups (`group.com.anicca.shared`) 経由 |
| 実装 | CC が全ファイル作成 + .pbxproj + entitlement も CC が実施（ダイス許可済み） |

### 実装ファイル

| ファイル | 内容 |
|---------|------|
| `AniccaWidget/AniccaWidget.swift` | Widget Entry Point |
| `AniccaWidget/NudgeWidgetProvider.swift` | TimelineProvider（24h更新） |
| `AniccaWidget/NudgeWidgetEntryView.swift` | Small/Medium/LockScreen View |
| `AniccaWidget/Info.plist` | Widget Extension config |

---

## 3. Onboarding改善

Source: github.com/adamlyttleapps/claude-skill-app-onboarding-questionnaire（14画面フレームワーク）
Core Principle: "The user must DO something, not just watch. And they must get something back."

### 新フロー

```
現行: Welcome → Notifications → Struggles → Paywall
新:   Welcome → Struggles → [Processing] → [App Demo] → Notifications → Paywall
```

**Social Proof画面は追加しない**（実際のレビューがまだないため）

### 追加画面詳細（EN / JA）

**Screen: Processing Moment（既存画面があれば置き換え、なければ新規）**

EN:
```
━━━━━━━━━━━━━━ 3/6 ━━━━━━━━━━━━━━

              🔄
         (spinning animation)

     Creating your personalized
     plan...

     ✅ Analyzing your struggles
     ✅ Setting optimal timing
     🔄 Personalizing...

     (auto-advance in 1-3 seconds)
```

JA:
```
━━━━━━━━━━━━━━ 3/6 ━━━━━━━━━━━━━━

              🔄
         (回転アニメーション)

     あなた専用のプランを
     作成しています...

     ✅ 悩みの分析
     ✅ 最適なタイミング設定
     🔄 パーソナライズ中...

     (1-3秒で自動遷移)
```

**Screen: App Demo（Paywall直前）**

EN:
```
━━━━━━━━━━━━━━ 4/6 ━━━━━━━━━━━━━━

     Your first Nudge is ready

  ┌──────────────────────────────┐
  │        🤍                    │
  │    FORGIVE YOURSELF          │
  │                              │
  │  "Your worth isn't measured  │
  │   by productivity."          │
  │                              │
  │  You are not your            │
  │  productivity. You are       │
  │  worthy of love and rest     │
  │  just by existing.           │
  │                              │
  │  [Forgive Myself]   [Skip]   │
  │       👍        👎           │
  └──────────────────────────────┘

  → Actual NudgeCard component
  → Based on user's selected struggles

        [ See Your Plan → ]
```

JA:
```
━━━━━━━━━━━━━━ 4/6 ━━━━━━━━━━━━━━

     あなた専用のNudgeが完成しました

  ┌──────────────────────────────┐
  │        🤍                    │
  │      自分を許せ               │
  │                              │
  │  あなたの価値は生産性で       │
  │  測れない。                   │
  │                              │
  │  あなたは生産性じゃない。     │
  │  存在するだけで愛と休息に     │
  │  値する。                     │
  │                              │
  │  [自分を許す 🤍]   [スキップ] │
  │       👍        👎           │
  └──────────────────────────────┘

  → 実際のNudgeCardコンポーネント使用
  → ユーザーが選んだ悩みに基づく

        [ プランを見る → ]
```

### 実装ファイル
- `ProcessingStepView.swift` — 新規（既存あれば置き換え）
- `AppDemoStepView.swift` — 新規
- `OnboardingFlowView.swift` — step配列修正

---

## 4. App Store スクリーンショット

### 使う素材（raw-screenshots/）

| SS# | EN素材 | JA素材 |
|-----|--------|--------|
| SS1 | `selfhatred-en.png` (FORGIVE YOURSELF / "Your worth isn't measured by productivity") | `self-hatred-ja.png` (自分を許せ / "あなたの価値は生産性で測れない") |
| SS2 | `self-hatred2-en.png` (SELF-COMPASSION / "You're a much better person than you think") | `ja_01.png`相当 (自分を許せ / "自分を責めないで") |
| SS3 | `procrastination-en.png` (DO IT NOW / "Done is better than perfect") | `procrastinatino-ja.png` (今すぐやれ / "完璧より完了") |
| SS4 | `mypath-en.png` (My Path リスト) | `my-path-ja.png` (マイパス リスト) |
| SS5 | `struffle-en.png` (What's holding you back?) | `ja-struggle.png` (どんなことに悩んでいますか？) |

### 見出しテキスト

**要調査: App Storeの競合アファメーションアプリのスクショテキストをスクレイプして、実績のあるコピーを参考にする。**

- `asc` CLI + app-store-scraper skill でI Am, Motivation, ThinkUp等の競合スクショテキストを取得
- A/Bテスト: ASC CLI でスクリーンショットセットのA/Bテスト実施

### 生成方法
- ParthJadhav/app-store-screenshots skill (Next.js) で生成
- iPhone mockup付き、4解像度出力（6.9", 6.5", 6.3", 6.1"）
- EN / JA / ES の3言語

---

## 5. ASO最適化（EN / JA / ES）

**要調査: asc CLI で現在のtitle, subtitle, keywords, promotion textを取得 → ASO skill でbefore/after最適化**

対象キーワード領域:
- affirmation, quotes, manifestation, self-care, mental health, meditation
- アファメーション, 名言, 自己肯定感, メンタルヘルス, セルフケア
- afirmaciones, citas, autocuidado, salud mental

---

## 6. Reelclaw Cron — 全詳細

### OLD: Anicca カードdemo 4 cron（変更なし）

| cron | 時間(JST) | 言語 | フック元 | Hook動画 | Demo動画 | 投稿先 |
|------|----------|------|---------|---------|---------|--------|
| reelclaw-ja-1 | 12:00 | JA | hooks-ja.json (140+) | ローカル12本 or DanSUGC購入（感情マッチ） | `assets/demos/ja/trimmed/{theme}.mp4` | TT+IG+YT (JA) |
| reelclaw-ja-2 | 21:00 | JA | hooks-ja.json (別) | 同上（別クリップ） | 同上（次テーマ） | 同上 |
| reelclaw-en-1 | 12:30 | EN | hooks-en.json (100+) | 同上 | `assets/demos/en/trimmed/{theme}.mp4` | TT+IG+YT (EN) |
| reelclaw-en-2 | 21:30 | EN | hooks-en.json (別) | 同上（別クリップ） | 同上（次テーマ） | 同上 |

Title EN: "try anicca — words like these, every day"
Title JA: "アニッチャ試してみて — こんな言葉が毎日届く"

### NEW: Anicca Widget demo 4 cron（T6完了後に有効化）

| cron | 時間(JST) | 言語 | フック元 | Hook動画 | Demo動画 | 投稿先 |
|------|----------|------|---------|---------|---------|--------|
| reelclaw-ja-3 | 07:00 | JA | Widget hooks W1-W12 JA | 感情マッチ | `assets/demos/ja/widget-demo.mp4`（ダイス撮影） | TT+IG+YT (JA) |
| reelclaw-ja-4 | 18:00 | JA | Widget hooks W1-W12 JA (別) | 同上（別クリップ） | 同上 | 同上 |
| reelclaw-en-3 | 16:30 | EN | Widget hooks W1-W12 EN | 感情マッチ | `assets/demos/en/widget-demo.mp4`（ダイス撮影） | TT+IG+YT (EN) |
| reelclaw-en-4 | 01:30 | EN | Widget hooks W1-W12 EN (別) | 同上（別クリップ） | 同上 | 同上 |

Title EN: "how to put affirmations on your lockscreen"
Title JA: "ロック画面にアファメーションを設定する方法"

### Honne AI JA 3 cron（reelclaw形式に移行）

| cron | 時間(JST) | フック元 | Title（3候補ローテーション） |
|------|----------|---------|--------------------------|
| honne-ja-morning | 09:00 | H1-H10 JA | ①LINEの本音をAIが翻訳する ②もう返信で悩まない ③あの人の本音、AIが教えてくれた |
| honne-ja-afternoon | 15:00 | H1-H10 JA (別) | 同上 |
| honne-ja-evening | 20:00 | H1-H10 JA (別) | 同上 |

投稿先: TT: cmnit95mg015rrm0ye5vm8dhl のみ

### Honne AI EN 3 cron（T11+T12完了後に追加）

| cron | 時間(JST) | フック元 | Title（3候補ローテーション） |
|------|----------|---------|--------------------------|
| honne-en-morning | 08:30 | H1-H10 EN | ①AI that reads between the lines ②stop overthinking their texts ③what they actually meant by that text |
| honne-en-afternoon | 13:30 | H1-H10 EN (別) | 同上 |
| honne-en-evening | 22:30 | H1-H10 EN (別) | 同上 |

### 全cron修正点

1. **Demo overlay削除**: 全cronに `## DEMO OVERLAY RULE: DO NOT overlay text on demo section` 追加
2. **購入制限解除**: `新規クリップ購入禁止` → `予算が許す場合は新規購入可` に変更（SKILL.md + 4 cron）

### 1日の投稿タイムテーブル（全14投稿）

```
01:30  reelclaw-en-4    Anicca EN Widget
07:00  reelclaw-ja-3    Anicca JA Widget
08:30  honne-en-morning Honne  EN reelclaw
09:00  honne-ja-morning Honne  JA reelclaw
12:00  reelclaw-ja-1    Anicca JA カード
12:30  reelclaw-en-1    Anicca EN カード
13:30  honne-en-afternoon Honne EN reelclaw
15:00  honne-ja-afternoon Honne JA reelclaw
16:30  reelclaw-en-3    Anicca EN Widget
18:00  reelclaw-ja-4    Anicca JA Widget
20:00  honne-ja-evening Honne  JA reelclaw
21:00  reelclaw-ja-2    Anicca JA カード
21:30  reelclaw-en-2    Anicca EN カード
22:30  honne-en-evening Honne  EN reelclaw
```

---

## 7. バイラルフック完全リスト

### Anicca Widget Hooks EN (W1-W12)

| # | Hook |
|---|------|
| W1 | "You're telling me I never knew you could put affirmations on your lockscreen?" |
| W2 | "Since you're always on your phone" |
| W3 | "You're telling me I could've been watching affirmations this whole time?" |
| W4 | "How to put affirmation words on your lockscreen (it changes everyday)" |
| W5 | "How to add positive affirmations on ur lockscreen (it changes everyday)" |
| W6 | "POV: you need those affirmations on your lockscreen bc you don't chase, you attract" |
| W7 | "POV: you found an app that gives you new affirmations every hour" |
| W8 | "How to put affirmations on your lock screen 🥺" |
| W9 | "POV: your phone reminds you to be grateful" |
| W10 | "The first thing I see every morning" |
| W11 | "Why did nobody tell me about this..." |
| W12 | "4 years dealing with anxiety and I just find this!?" |

### Anicca Widget Hooks JA (W1-W12)

| # | Hook |
|---|------|
| W1 | "ロック画面にアファメーション置けるの知らなかったんだけど？" |
| W2 | "どうせずっとスマホ見てるんだから" |
| W3 | "え、ずっとアファメーション見れたってこと？" |
| W4 | "ロック画面にアファメーションを設定する方法（毎日変わる）" |
| W5 | "ポジティブなアファメーションをロック画面に追加する方法（毎日変わる）" |
| W6 | "POV: ロック画面にアファメーション必要。追いかけない、引き寄せる" |
| W7 | "POV: 毎時間新しいアファメーションくれるアプリ見つけた" |
| W8 | "ロック画面にアファメーションを設定する方法 🥺" |
| W9 | "POV: スマホが感謝を思い出させてくれた" |
| W10 | "毎朝、最初に目に入る言葉" |
| W11 | "なんで誰も教えてくれなかったの..." |
| W12 | "4年間不安と戦ってて今これ見つけたんだけど！？" |

### Anicca 共感系 Hooks (E1-E5)

| # | EN | JA |
|---|----|----|
| E1 | "tried 50 mental health apps. deleted 49. kept this one" | "メンタルアプリ50個試した。49個消した。これだけ残った" |
| E2 | "my therapist asked what changed. i showed her my phone" | "セラピストに「何が変わった？」って聞かれてスマホ見せた" |
| E3 | "Send this to someone who needs to hear it today 💙" | "今日これが必要な人に送って 💙" |
| E4 | "when i open my phone at 2am and it says 'you're not alone'" | "深夜2時にスマホ見たら「一人じゃないよ」って書いてあった" |
| E5 | "My phone just told me I'll regret staying up. It's right." | "スマホに「明日後悔するよ」って言われた。正解。" |

### Honne AI Hooks (H1-H10)

| # | EN | JA |
|---|----|----|
| H1 | "I asked AI what my boyfriend ACTUALLY meant by 'I'm fine' 😳" | "彼氏の「大丈夫」をAIに本音翻訳させた結果 😳" |
| H2 | "He left me on read. AI told me why. I wasn't ready 💔" | "既読スルーされた。AIに理由聞いたら覚悟できてなかった 💔" |
| H3 | "My mom said 'do whatever you want.' AI said that's NOT what she meant" | "母の「好きにしなさい」をAIに翻訳したら全然違った" |
| H4 | "Clap if you're against people who say 'I'm fine' when they're NOT 👏" | "「大丈夫」って言うけど絶対大丈夫じゃない人、拍手して 👏" |
| H5 | "POV: AI decoded what your boss REALLY thinks of you" | "上司のメールの本音をAIに暴かれた" |
| H6 | "AI wrote the PERFECT reply to my crush's confusing text" | "AIが好きな人への完璧な返信を教えてくれた" |
| H7 | "Why did nobody tell me about this app..." | "なんで誰もこのアプリ教えてくれなかったの..." |
| H8 | "3 years into my relationship and I just found this!?" | "付き合って3年目でこれ見つけたんだけど！？" |
| H9 | "I showed AI my ex's last text. The truth hit different." | "元カレの最後のLINEをAIに見せた。本音がエグかった。" |
| H10 | "AI told me what 'k' really means and I'm DONE 💀" | "「了解」の本音をAIに聞いたら終わった 💀" |

### 既存Larry Hooks（別ファイル管理）

- EN: `~/.openclaw/workspace/tiktok-marketing/hooks-en.json` (100+)
- JA: `~/.openclaw/workspace/tiktok-marketing/hooks-ja.json` (140+)

---

## 8. BGM

| ファイル | 内容 | 長さ |
|---------|------|------|
| `music/bgm-cta.mp3` | 現行BGM | 15s |
| `~/Desktop/tiktok-bgm-options/bgm-01-omnira-8d.mp3` | Omnira 8D bilateral stimulation | 15s |
| `~/Desktop/tiktok-bgm-options/bgm-02-sad-emotional.mp3` | 感情的ピアノ | 15s |
| `~/Desktop/tiktok-bgm-options/bgm-03-crying-piano.mp3` | 泣けるピアノソロ | 15s |
| `~/Desktop/tiktok-bgm-options/bgm-04-purity-piano.mp3` | 美しいピアノ曲 | 15s |

ダイスが聴いて選択 → 選んだものを `music/` にコピー。

---

## 9. 実行順序

| # | タスク | 担当 | 手動 | 再提出 |
|---|--------|------|------|--------|
| T1 | Primer Localizable.strings修正（EN/JA/ES） | CC | ❌ | ✅ |
| T2 | Honne JA 3 cron → reelclaw形式 | CC | ❌ | ❌ |
| T3 | 既存Anicca 4 cron修正（overlay削除+購入解除） | CC | ❌ | ❌ |
| T4 | SKILL.md購入制限解除 | CC | ❌ | ❌ |
| T5 | `openclaw gateway restart` | CC | ❌ | ❌ |
| T6 | Widget Extension開発（全ファイル+.pbxproj+entitlement） | CC | ❌ | ✅ |
| T7 | Onboarding改善（Processing+AppDemo） | CC | ❌ | ✅ |
| T8 | ASO最適化（EN/JA/ES title+subtitle+keywords） | CC | ❌ | ✅(ASC) |
| T9 | App Storeスクリーンショット生成+A/Bテスト | CC | ❌ | ✅(ASC) |
| T10 | ビルド+提出 release/1.8.3 | CC | ❌ | ✅ |
| **T11** | **Widget demo動画撮影（EN+JA）** | **ダイス** | **✅** | ❌ |
| **T12** | **Honne EN TikTokアカウント作成** | **ダイス** | **✅** | ❌ |
| **T13** | **Postiz接続+integration ID** | **ダイス** | **✅** | ❌ |
| T14 | Honne EN cron 3つ追加 | CC | ❌ | ❌ |
| T15 | Anicca Widget cron 4つ追加 | CC | ❌ | ❌ |

### 実行順

```
NOW         → T2+T3+T4 (cron修正) → T5 (restart)
TODAY       → T1 (Primer fix), T8 (ASO)
TOMORROW    → T6 (Widget)
DAY 3       → T7 (Onboarding), T9 (Screenshots) → T10 (Build+Submit)
AFTER T6    → T11 (ダイスWidget動画) → T15 (Widget cron)
PARALLEL    → T12+T13 (ダイスHonne EN) → T14 (Honne EN cron)
```

**T1+T6+T7+T8+T9 をまとめて1回の再提出（release/1.8.3）。**
**T2-T5 は即実行可能（再提出不要）。**

---

## 10. 10K MRR ロードマップ（22日間）

```
現在: ~$40 MRR → 目標: $10,000 MRR（250倍）
期限: 2026年4月30日（残り22日）
```

### 4本柱

| 柱 | 戦略 | MRR貢献目標 |
|----|------|------------|
| Anicca iOS | Widget+Onboarding+ASO+スクショA/B+14投稿/日 | $4,000 |
| Honne AI | EN展開+TT JA/EN 6投稿/日+drama hook | $2,000 |
| Factory新アプリ | 毎日1アプリ | $3,000 |
| 最適化 | PostHog A/B+Singular ROAS+ASO反復 | $1,000 |

### 週次

| 週 | Anicca iOS | Honne AI | Factory |
|----|-----------|----------|---------|
| W1 (4/8-14) | Widget+Primer+cron14投稿開始+ASO | EN版+cron開始 | 3アプリ |
| W2 (4/15-21) | Onboarding+スクショA/B+resubmit | Faceless3垢 | 4アプリ |
| W3 (4/22-28) | A/B最適化+TT Scale | drama hookフル回転 | best appにfocus |
| W4 (4/29-30) | 全チャネル最大化 | 全チャネル最大化 | 全チャネル最大化 |
