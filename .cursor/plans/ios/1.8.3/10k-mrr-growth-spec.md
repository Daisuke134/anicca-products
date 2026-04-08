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

## 1. Paywall テキスト修正

### 背景
- ASCでAnnual planトライアルを7日→3日に変更済み（2026-04-08）
- RevenueCatは `storeProduct.introductoryDiscount.subscriptionPeriod` から自動取得
- `%@` 変数のテキストは自動で "3 days" に反映済み → パッチ不要
- ハードコードされた「try for free」「risk-free」テキストのみ修正必要

### 何がハードコードで何が動的か

```
┌─ Primer Screen (PaywallPrimerStepView.swift) ──────────────┐
│  ❌ ハードコード（Localizable.strings直書き。PostHog制御外） │
│                                                            │
│  L1325: "We want you to try\nAnicca for free"    ← FIX    │
│  L1326: "...Experience the full journey risk-free" ← FIX   │
│  → 再提出必要                                              │
└────────────────────────────────────────────────────────────┘
         ↓
┌─ Pricing Screen (PaywallVariantBView.swift) ───────────────┐
│  ✅ PostHog制御（payload設定で即変更、再提出不要）           │
│  title, subtitle, feature1-5, cta, trust                   │
│                                                            │
│  ✅ 動的テキスト（RevenueCatから自動取得）                   │
│  L1361: "%@ free trial included"  → 自動で "3 days"        │
│  L1362: "Start %@ Free Trial"     → 自動で "3-Day"         │
│  → パッチ不要                                              │
│                                                            │
│  PostHogの仕組み:                                           │
│  paywallText("cta", fallback: "paywall_b_cta_trial")       │
│  → payload["cta_ja"] or payload["cta"] を探す               │
│  → なければ Localizable.strings の fallback を使う           │
└────────────────────────────────────────────────────────────┘
```

### パッチ（Localizable.strings — 再提出必要）

| ファイル | 行 | Before | After |
|---------|-----|--------|-------|
| `en.lproj/Localizable.strings` | 1325 | `"We want you to try\nAnicca for free"` | `"Start your\nAnicca journey"` |
| `en.lproj/Localizable.strings` | 1326 | `"...Experience the full journey risk-free."` | `"Your personalized plan is ready."` |
| `ja.lproj/Localizable.strings` | 対応行 | JA版 primer title | `"あなたのAniccaの\n旅を始めよう"` |
| `ja.lproj/Localizable.strings` | 対応行 | JA版 primer subtitle | `"あなた専用プランの準備ができました。"` |

### PostHog payload変更（再提出不要、curl即実行）

現在の状態: payload未設定 → fallback（Localizable.strings）を使用中

| Key | 現在のfallback（EN） | 変更後 |
|-----|---------------------|--------|
| `cta` | "Start 3-Day Free Trial"（%@自動） | "Start Your Journey Now" |
| `cta_ja` | "3日間無料トライアルを始める" | "今すぐ始めよう" |
| `trust` | "Free trial · Cancel anytime · No charge until trial ends" | "3-day free trial · Cancel anytime · Secure" |
| `trust_ja` | JA版 | "3日間無料 · いつでもキャンセル · 安心" |

### PostHogコマンド

```bash
PH_KEY=$(python3 -c "import json; d=json.load(open('$HOME/.claude.json')); args=d['mcpServers']['posthog']['args']; print(args[args.index('--posthogApiKey')+1])")

curl -s -X PATCH "https://us.posthog.com/api/projects/327882/feature_flags/628062" \
  -H "Authorization: Bearer $PH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "groups": [{"variant": "test", "properties": [], "rollout_percentage": 50}],
      "payloads": {
        "test": {
          "cta": "Start Your Journey Now",
          "cta_ja": "今すぐ始めよう",
          "trust": "3-day free trial · Cancel anytime · Secure",
          "trust_ja": "3日間無料 · いつでもキャンセル · 安心",
          "hard_paywall": true,
          "show_x_button": false
        }
      }
    }
  }'
```

### 修正不要

| テキスト | 理由 |
|---------|------|
| `"Your 7-Day Journey"` (L1311) | トライアルではなく体験の説明 |
| `"Start %@ Free Trial"` (L1362) | %@がASCから3-dayを自動取得 |
| `"%@ free trial included"` (L1361) | 同上 |

---

## 2. Widget Extension（バイラル機能 #1）

### 背景
Source: App Store "I Am - Daily Affirmations"（709Kレビュー、4.8星）
> レビュー: "when I got the widget I looked at my phone everyday reading these words and I feel like I have a lot of energy"

Source: App Store "Motivation - Daily quotes"（1Mレビュー、4.8星）
> "install the widget in your home screen and customize it from the app"

### 仕様

| 項目 | 値 |
|------|-----|
| Widget種類 | Home Screen (systemSmall, systemMedium) + Lock Screen (accessoryRectangular) |
| 表示内容 | ユーザーの選択した悩み（problem）に関連するNudgeテキスト |
| 更新頻度 | 毎日変わる（TimelineReloadPolicy: `.atEnd`, 24h間隔） |
| ロジック | QuoteProvider.swiftと同じ — day-of-yearベースで決定的ローテーション |
| Premium限定 | **いいえ — 全ユーザーに開放**（バイラル係数最大化） |
| データ共有 | App Groups経由でUserDefaults共有（selected problems読み取り） |
| デザイン | NudgeCardContentのミニ版 — アイコン + hook text + アプリロゴ |

### 実装ファイル

| ファイル | 内容 |
|---------|------|
| `AniccaWidget/AniccaWidget.swift` | Widget Entry Point |
| `AniccaWidget/NudgeWidgetProvider.swift` | TimelineProvider（24h更新） |
| `AniccaWidget/NudgeWidgetEntryView.swift` | Small/Medium/LockScreen View |
| `AniccaWidget/Info.plist` | Widget Extension config |

### 実装手順

1. Claude CodeがSwiftファイル全部作成
2. Xcode で手動で Widget Extension target 追加（.pbxproj 編集禁止）
3. App Groups entitlement 追加（メインアプリ + Widget）
4. 再提出必要（release/1.8.3）

### 注意
- Widget Extension は新 target → Xcode で手動追加（.pbxproj 編集禁止）
- demo動画はWidget実装完了後にダイスが撮影

---

## 3. Onboarding改善

Source: github.com/adamlyttleapps/claude-skill-app-onboarding-questionnaire（14画面）

### 最重要追加画面

**Screen: App Demo（Paywall直前に挿入）**
```
┌─ App Demo Screen ──────────────────────────┐
│                                            │
│  ユーザーの選択した悩みに対して              │
│  AIがNudgeカードを即生成                    │
│                                            │
│  ┌────────────────────────┐                │
│  │  🌙 Bedtime Nudge       │                │
│  │  "明日の自分を守ろう"    │                │
│  │  [Protect Tomorrow]     │                │
│  └────────────────────────┘                │
│                                            │
│  → 実際のカードを見せて aha moment          │
│  → 30秒以内で完了                           │
│  → [Continue to Plans]                     │
└────────────────────────────────────────────┘
```

**Screen: Social Proof（Struggles選択後に挿入）**
```
┌─ Social Proof Screen ──────────────────────┐
│                                            │
│  "12,847人が同じ悩みを選んでいます"          │
│                                            │
│  ⭐⭐⭐⭐⭐ "このアプリ、頭の中読まれてる"  │
│  ⭐⭐⭐⭐⭐ "tried 50 apps, kept this one"  │
│                                            │
│  [Continue]                                │
└────────────────────────────────────────────┘
```

### 実装
- `OnboardingFlowView.swift` の step 配列に2画面追加
- 新ファイル: `AppDemoStepView.swift`, `SocialProofStepView.swift`
- 再提出必要

---

## 4. App Store スクリーンショット

### 現在のスクリーンショット
- EN/JA各4枚: `~/Desktop/anicca-screenshots/` にコピー済み
- 追加素材: `/Users/anicca/anicca-project/assets/raw-screenshots/self-hatred2-en.png`

### 新スクリーンショット構成（5枚）

```
┌─ SS1: メインカード ─────────────────────┐
│ EN: "Kind Words When You Need Them Most" │
│ JA: "一番辛い時に優しい言葉を"            │
│ → Self-Compassionカード表示              │
└─────────────────────────────────────────┘

┌─ SS2: Self-Hatred カード ───────────────┐
│ EN: "Words That Fight Back For You"      │
│ JA: "あなたの代わりに戦う言葉"            │
│ → self-hatred2-en.png 使用              │
└─────────────────────────────────────────┘

┌─ SS3: Bedtime カード ──────────────────┐
│ EN: "Protecting Tomorrow's You"         │
│ JA: "明日のあなたを守る"                │
│ → Bedtimeカード「Protect Tomorrow」     │
└─────────────────────────────────────────┘

┌─ SS4: My Path リスト ──────────────────┐
│ EN: "Your Path. Your Pace."             │
│ JA: "あなたのペースで、あなたの道を"     │
│ → My Path画面のリスト表示               │
└─────────────────────────────────────────┘

┌─ SS5: 悩み選択 ────────────────────────┐
│ EN: "We Start Where You Hurt"           │
│ JA: "あなたの痛みから始める"             │
│ → Struggles選択画面                     │
└─────────────────────────────────────────┘
```

### パイプライン
- `docs/screenshots/config/screenshots.yaml` 更新
- EN/JA各5枚生成 → ASCにアップロード

---

## 5. Reelclaw Cron（Anicca iOS）

### 現行cron

| cron名 | 時間(JST) | 方式 | 状態 |
|--------|----------|------|------|
| reelclaw-ja-1 | 12:00 | larryスライド + demo動画 | ✅（error: usage exhausted → model切替で復旧予定） |
| reelclaw-ja-2 | 21:00 | 同上 | ✅ |
| reelclaw-en-1 | 12:30 | 同上 | ✅ |
| reelclaw-en-2 | 21:30 | 同上 | ✅ |

### 追加cron（Widget demo用 — Widget実装後に有効化）

| cron名 | 時間(JST) | 対象 | フック |
|--------|----------|------|--------|
| reelclaw-ja-3 | 07:00 | JA（通勤前） | Widget系フック |
| reelclaw-ja-4 | 18:00 | JA（帰宅後） | Widget系フック |
| reelclaw-en-3 | 16:30 | EN（US 03:30 EST） | Widget系フック |
| reelclaw-en-4 | 01:30 | EN（US 12:30 EST） | Widget系フック |

**結果: 毎日8投稿（JA 4 + EN 4）**
- 既存4 = スライドショー形式（hooks-en/ja.json のプールから）
- 新4 = Widget demo形式（新フック、ダイス撮影のWidget録画）

### Title/Caption設定（全cron共通）

| App | Platform | EN | JA |
|-----|----------|----|----|
| Anicca | TikTok title | "personalized self-care, right on your lock screen" | "ロック画面にあなた専用のセルフケア" |
| Anicca | IG/YT | 同上 | 同上 |
| Anicca | caption | "#selfcare #mentalhealth #affirmations #lockscreen #healing #fyp" | "#メンタルヘルス #自己肯定感 #ロック画面 #アファメーション #fyp" |

### demo部分のテキストオーバーレイ削除

**現行**: demo部分に "try Anicca — words like these, every day" 等のテキストがオーバーレイされる
**変更**: demo部分にテキストオーバーレイなし。hook部分のみテキストあり。

パッチ対象: `/Users/anicca/.openclaw/cron/jobs.json`

各reelclaw cronのmessageに以下を追加:
```
## DEMO OVERLAY RULE
DO NOT overlay any text on the demo video section.
Text overlay is ONLY for the hook section (Step 3d).
The demo video plays clean with no text/CTA overlay.
```

### フックローテーション方法

既存cron: `hooks-en.json` / `hooks-ja.json` の100+個プールからランダム選択（lastUsed追跡で重複回避）
新cron: 新Widget hookプール（下記Section 8）から選択。`demos-mapping.json` に `widget_hooks_en` / `widget_hooks_ja` セクション追加。

---

## 6. Reelclaw Cron（Honne AI）

### 現行cron（ffmpeg手動 → reelclaw形式に移行）

| cron名 | 時間(JST) | Before | After |
|--------|----------|--------|-------|
| honne-ja-morning | 09:00 | ffmpeg手動オーバーレイ | reelclaw SKILL.md形式 |
| honne-ja-afternoon | 15:00 | 同上 | 同上 |
| honne-ja-evening | 20:00 | 同上 | 同上 |

### パッチ（jobs.json — 3 cronのmessage書換え）

```
Execute ReelClaw skill.
Read ~/.agents/skills/reelclaw/SKILL.md and follow it.
TikTok integration: cmnit95mg015rrm0ye5vm8dhl
Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc
App Name: 本音AI
Language: ja
Music: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3
Demo videos: ~/.openclaw/workspace/honne-ai/demos/

## MANDATORY OVERRIDES
### TITLE & CAPTION
- TikTok settings.title: "LINEの本音をAIが翻訳する"
- ALL platforms content: "#本音翻訳 #LINE #恋愛 #人間関係 #fyp"

### DEMO OVERLAY RULE
DO NOT overlay any text on the demo video section.
Text overlay is ONLY for the hook section.

### HOOK POOL
Use these hooks in rotation:
- "彼氏の「大丈夫」をAIに本音翻訳させた結果 😳"
- "既読スルーされた。AIに理由聞いたら覚悟できてなかった 💔"
- "母の「好きにしなさい」をAIに翻訳したら全然違った"
- "「大丈夫」って言うけど絶対大丈夫じゃない人、拍手して 👏"
- "上司のメールの本音をAIに暴かれた"
- "AIが好きな人への完璧な返信を教えてくれた"
- "なんで誰もこのアプリ教えてくれなかったの..."
- "付き合って3年目でこれ見つけたんだけど！？"
- "元カレの最後のLINEをAIに見せた。本音がエグかった。"
- "「了解」の本音をAIに聞いたら終わった 💀"

### POSTING RULES
1. 3 SEPARATE API calls: TikTok, Instagram, YouTube.
2. TikTok: privacy_level: SELF_ONLY, content_posting_method: UPLOAD
3. Do NOT report to Slack yourself.

Report to Slack #metrics.
```

### Honne AI EN cron追加

| cron名 | 時間(JST) | US East | US West |
|--------|----------|---------|---------|
| honne-en-morning | 08:30 | 19:30前日 | 16:30前日 |
| honne-en-afternoon | 13:30 | 00:30 | 21:30前日 |
| honne-en-evening | 22:30 | 09:30 | 06:30 |

### Title/Caption（Honne AI）

| Platform | EN | JA |
|----------|----|----|
| TikTok title | "AI that reads between the lines of your texts" | "LINEの本音をAIが翻訳する" |
| caption | "#honneai #texttranslator #relationshipadvice #airedflags #fyp" | "#本音翻訳 #LINE #恋愛 #人間関係 #fyp" |

### 必要な準備（ダイス手動）
1. 新TikTok ENアカウント作成
2. Postiz接続 → integration ID取得
3. EN用デモ動画撮影 or JA動画流用

---

## 7. Reelclaw Skill フロー（End-to-End）

### 現行フロー

```
┌─ Cron起動 ─────────────────────────────────────────┐
│                                                     │
│  1. SKILL.md を読む                                  │
│  2. Hook選択（hookプールからランダム、lastUsed回避）   │
│  3. Hook動画を選択 or 購入（UGCクリップ）             │
│     ├─ Step 3a: 予算あれば新しいhook動画を購入        │
│     └─ Step 3b: なければ既存ローカル12本から選択      │
│  4. Demo動画を選択（rotation順）                     │
│  5. ffmpegで結合:                                    │
│     ├─ Hook部分: hook動画 + テキストオーバーレイ      │
│     └─ Demo部分: demo動画（テキストなし ← NEW）       │
│  6. BGM追加（bgm-cta.mp3）                           │
│  7. Postiz APIで投稿（TT + IG + YT 3回）             │
│  8. demos-mapping.json 更新（lastUsed）              │
│  9. Slack #metrics にレポート                         │
└─────────────────────────────────────────────────────┘
```

### Hook動画購入の復活

**現行**: `新規クリップ購入禁止。ローカルの12本だけ使う。` がcron messageにある
**変更**: 予算が許す限り新しいhook動画を購入可能にする

パッチ: 各reelclaw cronのmessageから以下を削除:
```diff
- 7. 新規クリップ購入禁止。ローカルの12本だけ使う。
+ 7. 予算が許す場合は新しいhook動画を購入してよい。購入失敗 or 良いものがない場合はローカルの既存クリップを使う。
```

### Hook/動画/Demoの整合性

```
フックテキスト → フック動画 → デモ動画
全て同じ感情トーンで揃える

例:
Hook: "深夜2時にスマホ見たら「一人じゃないよ」って書いてあった"
 → Hook動画: 夜、暗い部屋、スマホを見る女性（sad/emotional）
 → Demo動画: Anicca Widget ロック画面（夜のテーマ）

Hook: "彼氏の「大丈夫」をAIに本音翻訳させた結果 😳"
 → Hook動画: 驚いた顔の女性、スマホを見てる（surprise/drama）
 → Demo動画: Honne AI メッセージ分析→本音reveal
```

SKILL.md のStep 3dでhook選択時に「テーマ/感情タグ」でマッチングする。

---

## 8. バイラルフック完全リスト

### SGE調査結果（全引用付き）

Source: [Social Growth Engineers](https://socialgrowthengineers.com) — 2026年4月8日時点

| フォーマット | 実績 | ソース |
|------------|------|--------|
| **Sound-first** | Omnira: 50M views, 1.8M top | [SGE: One Sound Format](https://socialgrowthengineers.com/one-sound-format-took-this-app-past-50m-views) |
| **Relationship drama** | Sherlock: 21.8M views 1動画 | [SGE: Relationship Drama](https://socialgrowthengineers.com/how-apps-are-hijacking-relationship-drama-right-now) |
| **Faceless multi-account** | Macaron AI: 163M views, 500K DL | [SGE: Copied Videos = 500K DL](https://socialgrowthengineers.com/they-copied-viral-app-videos-and-turned-them-into-500k-downloads) |
| **AI Chat call-style** | Juicy Chat AI: 32.1M views | [SGE: Juicy Chat AI](https://socialgrowthengineers.com/the-call-style-formula-behind-juicy-chat-ais-32-1m-views) |
| **Heartwarming "when..."** | 30M views in 3 videos | [SGE: Heartwarming trend](https://socialgrowthengineers.com/this-heartwarming-trend-generated-30m-views-in-3-videos) |
| **"Clap if you're against it"** | 9M views | [SGE: Trend Radar 108M](https://socialgrowthengineers.com/trend-radar-108m-views) |

### SGE核心引用

> "Relationship drama is dominating TikTok... **If your app fits inside a breakup story, it can spread.**" — SGE Relationship Drama記事

> "Instead of trying to invent original concepts, **take viral videos already proven for other apps and swap in your app as the demo**." — SGE Macaron AI記事（163M views, 500K DL）

> "**The app only gets a brief mention and is never pushed with a hard CPA angle.**" — SGE Juicy Chat AI記事（32.1M views）

---

### Anicca iOS — Widget系フック

| # | EN | JA |
|---|----|----|
| W1 | "You're telling me I never knew you could put affirmations on your lockscreen?" | "ロック画面にアファメーション置けるの知らなかったんだけど？" |
| W2 | "Since you're always on your phone" | "どうせずっとスマホ見てるんだから" |
| W3 | "You're telling me I could've been watching affirmations this whole time?" | "え、ずっとアファメーション見れたってこと？" |
| W4 | "How to put affirmation words on your lockscreen (it changes everyday)" | "ロック画面にアファメーションを設定する方法（毎日変わる）" |
| W5 | "How to add positive affirmations on ur lockscreen (it changes everyday)" | "ポジティブなアファメーションをロック画面に追加する方法（毎日変わる）" |
| W6 | "POV: you need those affirmations on your lockscreen bc you don't chase, you attract" | "POV: ロック画面にアファメーション必要。追いかけない、引き寄せる" |
| W7 | "POV: you found an app that gives you new affirmations every hour" | "POV: 毎時間新しいアファメーションくれるアプリ見つけた" |
| W8 | "How to put affirmations on your lock screen 🥺" | "ロック画面にアファメーションを設定する方法 🥺" |
| W9 | "POV: your phone reminds you to be grateful" | "POV: スマホが感謝を思い出させてくれた" |
| W10 | "The first thing I see every morning" | "毎朝、最初に目に入る言葉" |
| W11 | "Why did nobody tell me about this..." | "なんで誰も教えてくれなかったの..." |
| W12 | "4 years dealing with anxiety and I just find this!?" | "4年間不安と戦ってて今これ見つけたんだけど！？" |

### Anicca iOS — 共感系フック

| # | EN | JA |
|---|----|----|
| E1 | "tried 50 mental health apps. deleted 49. kept this one" | "メンタルアプリ50個試した。49個消した。これだけ残った" |
| E2 | "my therapist asked what changed. i showed her my phone" | "セラピストに「何が変わった？」って聞かれてスマホ見せた" |
| E3 | "Send this to someone who needs to hear it today 💙" | "今日これが必要な人に送って 💙" |
| E4 | "when i open my phone at 2am and it says 'you're not alone'" | "深夜2時にスマホ見たら「一人じゃないよ」って書いてあった" |
| E5 | "My phone just told me I'll regret staying up. It's right." | "スマホに「明日後悔するよ」って言われた。正解。" |

### Honne AI フック

| # | EN | JA |
|---|----|----|
| H1 | "I asked AI what my boyfriend ACTUALLY meant by 'I'm fine' 😳" | "彼氏の「大丈夫」をAIに本音翻訳させた結果 😳" |
| H2 | "He left me on read. AI told me why. I wasn't ready 💔" | "既読スルーされた。AIに理由聞いたら覚悟できてなかった 💔" |
| H3 | "My mom said 'do whatever you want.' AI said that's NOT what she meant" | "母の「好きにしなさい」をAIに翻訳したら全然違った" |
| H4 | "Clap if you're against people who say 'I'm fine' when they're NOT 👏" | "「大丈夫」って言うけど絶対大丈夫じゃない人、拍手して 👏" |
| H5 | "POV: AI decoded what your boss REALLY thinks of you" | "POV: 上司のメールの本音をAIに暴かれた" |
| H6 | "AI wrote the PERFECT reply to my crush's confusing text" | "AIが好きな人への完璧な返信を教えてくれた" |
| H7 | "Why did nobody tell me about this app..." | "なんで誰もこのアプリ教えてくれなかったの..." |
| H8 | "3 years into my relationship and I just found this!?" | "付き合って3年目でこれ見つけたんだけど！？" |
| H9 | "I showed AI my ex's last text. The truth hit different." | "元カレの最後のLINEをAIに見せた。本音がエグかった。" |
| H10 | "AI told me what 'k' really means and I'm DONE 💀" | "「了解」の本音をAIに聞いたら終わった 💀" |

### Anicca Larry既存フック（hooks-ja.json 140+個、hooks-en.json 100+個）

既存のlarryスライドショー用フックは別ファイルで管理済み:
- EN: `~/.openclaw/workspace/tiktok-marketing/hooks-en.json`
- JA: `~/.openclaw/workspace/tiktok-marketing/hooks-ja.json`

---

## 9. PostHog Paywall最適化（再提出不要）

Section 1 のPostHogコマンド参照。

---

## 10. 実行順序

| # | タスク | 所要時間 | 再提出 | 誰 |
|---|--------|---------|--------|-----|
| T1 | PostHog payload変更（curl） | 10分 | ❌ | CC |
| T2 | Honne JA 3 cron → reelclaw形式 | 30分 | ❌ | CC |
| T3 | Anicca reelclaw 4 cron追加 | 30分 | ❌ | CC |
| T4 | Reelclaw demo テキストオーバーレイ削除 | 15分 | ❌ | CC |
| T5 | Hook動画購入制限解除 | 10分 | ❌ | CC |
| T6 | openclaw gateway restart | 1分 | ❌ | CC |
| T7 | Primer Localizable.strings修正 | 15分 | ✅ | CC |
| T8 | Widget Extension開発 | 3-4h | ✅ | CC+ダイスXcode |
| T9 | Onboarding改善（Demo+SocialProof画面） | 4-6h | ✅ | CC |
| T10 | App Storeスクリーンショット再生成（5枚×2言語） | 1-2h | ✅(ASC) | CC |
| T11 | ビルド+提出 | 30分 | ✅ | CC+ダイス |
| T12 | ダイスがWidget demo動画撮影 | 30分 | ❌ | ダイス |
| T13 | ダイスが新TT ENアカウント作成（Honne） | 15分 | ❌ | ダイス |
| T14 | Postiz接続+integration ID取得 | 15分 | ❌ | ダイス |
| T15 | Honne EN cron 3つ追加 | 30分 | ❌ | CC |
| T16 | Singular Dashboard確認 | 15分 | ❌ | ダイス |
| T17 | TikTok viral music DL | 30分 | ❌ | CC/ダイス |
| T18+ | Factory毎日1アプリ | 4h/日 | ✅ | CC |

### 実行順

```
TODAY NOW   → T1 (PostHog), T2+T3+T4+T5 (cron全部), T6 (restart)
TODAY       → T7 (Primer fix)
TOMORROW    → T8 (Widget Extension)
DAY 3       → T9 (Onboarding), T10 (Screenshots)
DAY 3       → T11 (Build+Submit)
AFTER T8    → T12 (ダイスWidget動画撮影)
PARALLEL    → T13+T14+T15 (Honne EN)
DAILY       → T18+ (Factory)
```

**T7-T11 をまとめて1回の再提出（release/1.8.3）。**
**T1-T6 は即実行可能（再提出不要）。**

---

## 11. 10K MRR ロードマップ（22日間）

```
現在: ~$40 MRR → 目標: $10,000 MRR（250倍）
期限: 2026年4月30日（残り22日）
```

### 4本柱

| 柱 | 戦略 | MRR貢献目標 |
|----|------|------------|
| Anicca iOS | TT広告+3-day trial+Widget+Onboarding改善+スクショ | $4,000 |
| Honne AI | EN展開+TT JA/EN 6投稿/日+drama hook | $2,000 |
| Factory新アプリ | 毎日1アプリ（Quote Widget/Sleep Sound等） | $3,000 |
| 最適化 | PostHog A/B+Singular ROAS+ASO | $1,000 |

### 週次

| 週 | Anicca iOS | Honne AI | Factory |
|----|-----------|----------|---------|
| W1 (4/8-14) | Widget+Primer+cron8投稿開始 | EN版+cron開始 | 3アプリ |
| W2 (4/15-21) | Onboarding+スクショ+resubmit | Faceless3垢 | 4アプリ |
| W3 (4/22-28) | A/B test最適化+TT Scale | drama hookフル回転 | best appにfocus |
| W4 (4/29-30) | 全チャネル最大化 | 全チャネル最大化 | 全チャネル最大化 |
