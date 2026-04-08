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

## 1. Paywall Primer テキスト修正

### 背景
- Annual planのトライアルを7日→3日に変更済み（ASC）
- Primer画面の「try for free」テキストがハードコード
- 動的テキスト（%@変数）はASCから3日を自動反映 → パッチ不要

### 画面構成

```
┌─ Primer Screen (PaywallPrimerStepView.swift) ─┐
│                                                │
│   "We want you to try Anicca for free"  ← FIX │
│   "...risk-free."                       ← FIX │
│   ✅ Feature 1                                 │
│   🔔 Feature 2                                 │
│   ✕ Feature 3                                  │
│   [Continue]                                   │
└────────────────────────────────────────────────┘
         ↓
┌─ Pricing Screen (PaywallVariantBView.swift) ───┐
│   Title (PostHog制御)                           │
│   Features 1-5 (PostHog制御)                    │
│   Annual $49.99/yr — "3 days free trial" ← 自動 │
│   Monthly $9.99/mo — no trial                   │
│   CTA: "Start 3-Day Free Trial"         ← 自動 │
│   Trust text (PostHog制御)                      │
└────────────────────────────────────────────────┘
```

### パッチ

| ファイル | 行 | Before | After |
|---------|-----|--------|-------|
| `aniccaios/Resources/en.lproj/Localizable.strings` | 1325 | `"We want you to try\nAnicca for free"` | `"Start your\nAnicca journey"` |
| `aniccaios/Resources/en.lproj/Localizable.strings` | 1326 | `"Your personalized plan is ready. Experience the full journey risk-free."` | `"Your personalized plan is ready."` |
| `aniccaios/Resources/ja.lproj/Localizable.strings` | 対応行 | JA版の primer title | `"あなたのAniccaの\n旅を始めよう"` |
| `aniccaios/Resources/ja.lproj/Localizable.strings` | 対応行 | JA版の primer subtitle | `"あなた専用プランの準備ができました。"` |

### 修正不要

| テキスト | 理由 |
|---------|------|
| `"Your 7-Day Journey"` (L1311) | トライアルではなく体験の説明 |
| `"Start %@ Free Trial"` (L1362) | %@がASCから3-dayを自動取得 |
| `"%@ free trial included"` (L1361) | 同上 |

### PostHogで即変更（再提出不要）

| Key | 現在 | 変更推奨 |
|-----|------|---------|
| `cta` | fallback to hardcoded | `"Start Your Journey Now"` |
| `trust` | `"Free trial · Cancel anytime..."` | `"3-day free trial · Cancel anytime · Secure"` |

---

## 2. Widget Extension（バイラル機能 #1）

### 背景
Source: App Store "I Am - Daily Affirmations"（709Kレビュー、4.8星）
> レビュー: "when I got the widget I looked at my phone everyday reading these words and I feel like I have a lot of energy"

Source: App Store "Motivation - Daily quotes"（1Mレビュー、4.8星）
> "install the widget in your home screen and customize it from the app. You can have as many widgets as you want!"
> "I enjoy having affirmations cycle through different themes throughout the day in my notifications bar and widgets"

### 仕様

| 項目 | 値 |
|------|-----|
| Widget種類 | Home Screen (systemSmall, systemMedium) + Lock Screen (accessoryRectangular) |
| 表示内容 | ユーザーの選択した悩み（problem）に関連するNudgeテキスト |
| 更新頻度 | 毎日変わる（TimelineReloadPolicy: `.atEnd`, 24h間隔） |
| ロジック | QuoteProvider.swiftと同じ — day-of-yearベースで決定的ローテーション |
| Premium限定 | **いいえ — 全ユーザーに開放**（バイラル係数最大化のため） |
| データ共有 | App Groups経由でUserDefaults共有（selected problems読み取り） |
| デザイン | NudgeCardContentのミニ版 — アイコン + hook text + アプリロゴ |

### 実装ファイル

| ファイル | 内容 |
|---------|------|
| `AniccaWidget/AniccaWidget.swift` | Widget Entry Point |
| `AniccaWidget/NudgeWidgetProvider.swift` | TimelineProvider（24h更新） |
| `AniccaWidget/NudgeWidgetEntryView.swift` | Small/Medium/LockScreen View |
| `AniccaWidget/Info.plist` | Widget Extension config |
| 既存 `NudgeCardContent.swift` | 参考デザイン |
| 既存 `QuoteProvider.swift` | ロジック参考 |

### 注意
- Widget Extension は新 target → Xcode で手動追加（.pbxproj 編集禁止）
- App Groups entitlement 追加必須

---

## 3. カード共有機能

### 仕様

| 項目 | 値 |
|------|-----|
| 場所 | NudgeCardView.swift のフィードバックボタン横にShareボタン追加 |
| 方式 | ShareLink（iOS 16+）or UIActivityViewController（iOS 15互換） |
| 共有物 | NudgeCardContentのスナップショット画像（ImageRenderer） + テキスト + App Storeリンク |
| デザイン | カード下部に share icon（square.and.arrow.up） |

---

## 4. App Store スクリーンショット再生成

### 現在のスクリーンショット

| # | EN | JA |
|---|----|----|
| 01 | "Gentle Words For Your Hardest Moments" + Self-Compassionカード | "一番辛い時に優しい言葉を" + 自分を許せカード |
| 02 | "What weighs on you? We'll be there." + Struggle選択 | "何が苦しい？そばにいるよ" + 苦しみ選択 |
| 03 | "Your pain. We get it." + My Path画面 | "一人で抱え込まなくていい" + マイパス |
| 04 | "Protecting tomorrow's you." + Bedtimeカード | "明日のあなたを守る" + 大丈夫カード |

### 改善案（全部カードベース）

| # | EN見出し | JA見出し | カード内容 |
|---|---------|---------|----------|
| 01 | "Kind Words When You Need Them Most" | "一番辛い時に優しい言葉を" | Self-Compassionカード（現01ベース） |
| 02 | "AI That Fights Back When You Can't" | "あなたが戦えない時、AIが戦う" | Bedtimeカード「Protect Tomorrow / Hurt Myself」 |
| 03 | "A Nudge On Your Lock Screen, Every Day" | "ロック画面に、毎日のひと言" | Widget表示のモックアップ（Widget実装後） |
| 04 | "Break The Loop. Start Today." | "ループを断ち切れ。今日から。" | 夜更かし or 先延ばしカード |

### ファイルパス
- EN: `.cursor/plans/ios/1.6.3/AppScreens-Anicca-1771826223384.render/apple/English (en-US)/iPhones  6.9/`
- JA: `.cursor/plans/ios/1.6.3/AppScreens-Anicca-1771826223384.render/apple/Japanese (ja)/iPhones  6.9/`
- Pipeline config: `docs/screenshots/config/screenshots.yaml`
- デスクトップコピー: `~/Desktop/anicca-screenshots/`

---

## 5. Onboarding改善（app-onboarding-questionnaire Framework）

Source: github.com/adamlyttleapps/claude-skill-app-onboarding-questionnaire（14画面フレームワーク）

### 現在 vs 改善

| # | Playbook画面 | Aniccaの現状 | アクション |
|---|-------------|-------------|----------|
| 1 | Welcome | ✅ あり | テキスト改善 |
| 2 | Goal Question | ❌ なし | **追加** |
| 3 | Pain Points | ✅ Struggles | OK |
| 4 | Social Proof | ❌ なし | **追加** |
| 5 | Tinder Cards（スワイプ共感） | ❌ なし | **追加** |
| 6 | Personalized Solution | ✅ PersonalizedInsight | OK |
| 7 | Comparison Table | ❌ なし | Optional |
| 8 | Preferences | ❌ なし | Optional |
| 9 | Permission Priming | ✅ Notifications | テキスト改善 |
| 10 | Processing Moment | ❌ なし | **追加** |
| 11 | **App Demo** | ❌ **なし** | **必須追加** |
| 12 | **Value Delivery + Viral Moment** | ❌ **なし** | **必須追加** |
| 13 | Account Gate | ❌ なし | Skip |
| 14 | Paywall | ✅ あり | テキスト改善（Section 1） |

### 最重要追加画面

**Screen 11: App Demo**
- ユーザーの選択した悩みに対してAIがNudgeカードを即生成
- 実際にカードを見せて「aha moment」を体験させる
- 30秒以内で完了

**Screen 12: Viral Moment**
- 生成されたカードをシェア可能にする
- ShareLink + "Send to a friend who needs this"
- **これがオーガニック拡散のフック**

---

## 6. TikTokクリエイティブ & バイラルフック

### Anicca iOS — 4つのクリエイティブ

#### Creative 1: Widget Setup動画
| 項目 | 値 |
|------|-----|
| フック(EN) | "How to put affirmations on your lock screen 🥺" |
| フック(JA) | "ロック画面に毎日変わる言葉を設定する方法 🥺" |
| 撮影 | iPhoneウィジェット追加を画面録画。設定→ホーム画面→ロック画面→完成 |
| ソース | "I Am" app（709Kレビュー）: レビューで「widget」が最多言及機能。"when I got the widget I looked at my phone everyday" |
| 音楽 | トレンドBGM（sad/emotional系） |
| 配信 | reelclaw-ja-1, reelclaw-en-1 |

#### Creative 2: Nudge通知デモ
| 項目 | 値 |
|------|-----|
| フック(EN) | "POV: You unlock your phone and AI already knows what you need to hear" |
| フック(JA) | "POV: スマホ開いたらAIが今必要な言葉をくれた" |
| 撮影 | ロック画面にwidget表示→タップ→カード全画面→感動 |
| ソース | "Motivation" app（1Mレビュー）レビュー: "getting a positive or thoughtful quote a few times a day has a way of recentering me" |
| 音楽 | トレンドBGM |
| 配信 | reelclaw-ja-2, reelclaw-en-2 |

#### Creative 3: Bedtime Nudge
| 項目 | 値 |
|------|-----|
| フック(EN) | "My phone just told me I'll regret staying up. It's right." |
| フック(JA) | "スマホに「明日後悔するよ」って言われた。正解。" |
| 撮影 | 夜のBedtimeカード→「Protect Tomorrow」ボタン→タップ |
| ソース | Playbook: "show the 'aha moment' in a single visual" — Bedtimeカードの二択（Protect Tomorrow / Hurt Myself）はvisual reveal |
| 音楽 | night/chill系BGM |

#### Creative 4: カード共有
| 項目 | 値 |
|------|-----|
| フック(EN) | "Send this to someone who needs to hear it today 💙" |
| フック(JA) | "今日これが必要な人に送って 💙" |
| 撮影 | 美しいカード→ShareLink→Instagram/LINEに共有 |
| ソース | "Motivation" appレビュー: "share the uplifting message of the day with your friends, or use the image for Instagram" |
| 音楽 | uplifting系BGM |

### Honne AI — 5つのクリエイティブ

#### Creative 1: 彼氏のLINE解読
| 項目 | 値 |
|------|-----|
| フック(EN) | "I asked AI what my boyfriend ACTUALLY meant by 'I'm fine' 😳" |
| フック(JA) | "彼氏の「大丈夫」をAIに本音翻訳させた結果 😳" |
| 撮影 | メッセージ貼り付け→AI分析ローディング→結果reveal（本音テキスト） |
| ソース | Playbook: "Face ratings, height predictors, food scanners all have a 'reveal' moment" — Honne AIの本音revealはこのパターン |
| 音楽 | suspense→reveal系BGM |

#### Creative 2: 上司の本音
| 項目 | 値 |
|------|-----|
| フック(EN) | "POV: AI decoded what your boss REALLY thinks of you" |
| フック(JA) | "POV: 上司のメールの本音をAIに暴かれた" |
| 撮影 | 上司メール貼り付け→分析→衝撃の結果reveal |
| 音楽 | dramatic reveal系 |

#### Creative 3: 既読スルー解読
| 項目 | 値 |
|------|-----|
| フック(EN) | "He left me on read. AI told me why. I wasn't ready 💔" |
| フック(JA) | "既読スルーされた。AIに理由聞いたら…準備できてなかった 💔" |
| 撮影 | 既読スルー画面→AI分析→本音reveal |
| 音楽 | sad/emotional系 |

#### Creative 4: 母親の本音
| 項目 | 値 |
|------|-----|
| フック(EN) | "My mom said 'do whatever you want.' AI said that's NOT what she meant" |
| フック(JA) | "母の「好きにしなさい」AIに訳したら全然違った" |
| 撮影 | 母のLINE→分析→本音reveal（心配してるのに…） |
| 音楽 | emotional/touching系 |

#### Creative 5: 返信提案
| 項目 | 値 |
|------|-----|
| フック(EN) | "AI wrote the PERFECT reply to my crush's confusing text" |
| フック(JA) | "AIが片思い相手への完璧な返信を教えてくれた" |
| 撮影 | メッセージ→分析→返信提案→コピー |
| 音楽 | upbeat/confident系 |

### Honne AIバイラル機能

Source: Playbook "YOUR APP MUST HAVE A VIRAL FEATURE: If you can screen record someone using your app, or show the 'aha moment' in a single visual, you have a winner."

**Honne AIのreveal moment = メッセージ分析結果画面**
- ユーザーがメッセージ貼る → AIが分析 → **本音が表示される瞬間** = reveal moment
- これは既に実装済み。追加開発不要。
- TikTokクリエイティブでこのrevealを最大限活かす。

**追加バイラル機能候補:**

| # | 機能 | 理由 |
|---|------|------|
| 1 | **分析結果シェアカード** | revealの結果を美しいカードでシェア→オーガニック拡散 |
| 2 | **感情スコア表示**（1-5の感情レベルを大きくビジュアル化） | 数値reveal = TikTokで映える |
| 3 | **「返信コーチ」モード** | Playbook: dating reply apps are trending |

---

## 7. Honne AI Cron → Reelclaw移行

### 現状

| cron名 | 時間(JST) | 方式 | 問題 |
|--------|----------|------|------|
| honne-ja-morning | 09:00 | ffmpeg手動オーバーレイ | 独自実装、reelclaw未使用 |
| honne-ja-afternoon | 15:00 | ffmpeg手動オーバーレイ | 同上 |
| honne-ja-evening | 20:00 | ffmpeg手動オーバーレイ | 同上 |

### 修正

3つのcronのmessageをreelclaw形式に変更:

**パッチ先**: `/Users/anicca/.openclaw/cron/jobs.json`

**新message形式（honne-ja-morning例）:**
```
Execute ReelClaw skill.
Read ~/.agents/skills/reelclaw/SKILL.md Steps 1-4.
TikTok integration: cmnit95mg015rrm0ye5vm8dhl
Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc
App: Honne AI (本音翻訳AI)
Demo videos: ~/.openclaw/workspace/honne-ai/demos/
Hook pool: Use hooks from honne-mapping.json
Language: ja
DIRECT_POST. PUBLIC_TO_EVERYONE.
Report to Slack #metrics.
```

### Honne AI EN cron追加

| cron名 | 時間(JST) | US East | US West |
|--------|----------|---------|---------|
| honne-en-morning | 08:30 | 19:30前日 | 16:30前日 |
| honne-en-afternoon | 13:30 | 00:30 | 21:30前日 |
| honne-en-evening | 22:30 | 09:30 | 06:30 |

**必要な準備:**
1. 新TikTok ENアカウント作成
2. Postiz integration ID取得
3. EN用hookテキスト作成（Section 6のHonne AIフック参照）
4. EN用デモ動画（既存JA動画流用 or EN字幕新規作成）

---

## 8. PostHog Paywall最適化（再提出不要）

PostHog Dashboard で `paywall-ab-test` feature flag の payload を変更:

| Key | 変更後 |
|-----|--------|
| `cta` | `"Start Your Journey Now"` |
| `cta_ja` | `"旅を始めよう"` |
| `trust` | `"3-day free trial · Cancel anytime · Secure"` |
| `trust_ja` | `"3日間無料 · いつでもキャンセル · 安心"` |

---

## 実行順序

| # | タスク | 所要時間 | 再提出 |
|---|--------|---------|--------|
| 1 | Primer Localizable.strings修正 | 15分 | ✅ |
| 2 | Widget Extension開発 | 3-4h | ✅ |
| 3 | カード共有機能（ShareLink） | 1h | ✅ |
| 4 | PostHog payload変更 | 10分 | ❌ |
| 5 | App Storeスクリーンショット再生成 | 1-2h | ✅(ASC) |
| 6 | TikTokクリエイティブ撮影 | 1h | ❌ |
| 7 | Honne AI cron → reelclaw | 30分 | ❌ |
| 8 | Honne AI EN TikTok + cron | 30分 | ❌ |
| 9 | Onboarding改善 | 4-6h | ✅ |
| 10 | Singular確認 | 15分 | ❌ |

**#1-3 をまとめて1回の再提出（release/1.8.3）。**
**#4,7,8 は即実行可能（再提出不要）。**
