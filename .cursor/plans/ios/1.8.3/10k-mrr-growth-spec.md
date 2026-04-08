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

### PostHog Feature Flag 設定（2026-04-08 API確認済み）

```json
{
  "key": "paywall-ab-test",
  "active": true,
  "multivariate": {
    "variants": [
      { "key": "control", "name": "Variant A (soft paywall)", "rollout_percentage": 0 },
      { "key": "test", "name": "Variant B (hard paywall)", "rollout_percentage": 100 }
    ]
  },
  "groups": [{ "rollout_percentage": 100 }]
}
```

**現状: Variant B が 100%。A/Bテストは実質OFF。全ユーザーが Variant B を見ている。**
過去データの control=38 / test=93 の不均等は、**以前の weight 設定が 50/50 じゃなかった時期のデータ**。

### 方針

| 項目 | 決定 |
|------|------|
| A/Bテスト | **OFF** — Variant B 100%（現状維持） |
| ペイウォール | **Variant B ハード** — Xボタンなし、Maybe Later なし |
| トライアル | **なし** — App Store Connect でトライアル削除 |
| 価格 | **100%動的** — RevenueCat `localizedPriceString`。ハードコードゼロ |
| Superwall移行 | v1.9以降 |

### RevenueCat 製品（API確認済み）

| Product ID | Duration | Trial（現在） | Trial（修正後） |
|---|---|---|---|
| `ai.anicca.app.ios.annual` | P1Y | P3D (3日間) | **なし** |
| `ai.anicca.app.ios.monthly` | P1M | P3D (3日間) | **なし** |

### Primer画面修正（Localizable.strings — 再提出必要）

Source: ios-app-onboarding skill — Cravotta Method Step 1: 「NO price shown. Lower heart rate.」
Source: Apple Guideline 3.1.2(a) — `"risk-free"` / `"リスクなし"` は NG

| 言語 | キー | Before | After |
|------|------|--------|-------|
| EN | `paywall_primer_title` | `"We want you to try\nAnicca for free"` | `"Your personalized plan\nis ready"` |
| EN | `paywall_primer_subtitle` | `"...Experience the full journey risk-free."` | `"Start your journey and experience the full path."` |
| JA | `paywall_primer_title` | `"まずは無料で\nアニッチャを試してください"` | `"あなた専用プランの\n準備ができました"` |
| JA | `paywall_primer_subtitle` | `"...リスクなしで全ての旅を体験してください。"` | `"旅を始めて、全ての体験を味わってください。"` |
| ES | `paywall_primer_title` | ⚠️ ES にキー未存在 | 追加: `"Tu plan personalizado\nestá listo"` |
| ES | `paywall_primer_subtitle` | ⚠️ ES にキー未存在 | 追加: `"Comienza tu viaje y vive la experiencia completa."` |

**⚠️ トライアルなしなので「free trial」「無料トライアル」も書かない。**

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

### 現行フロー（8ステップ — 既に実装済み）

```
Welcome → Struggles → StruggleDepth → Goals → PersonalizedInsight → ValueProp → Notifications → Primer → Paywall
```

### 各画面テキスト（EXACT — Localizable.strings より）

#### STEP 1: Welcome
| | EN | JA |
|---|---|---|
| title | Kind words when you need them most | 一番つらいときに やさしい言葉を |
| subtitle | Daily cards with words chosen just for you. | あなたにあった言葉を 厳選してお届けします。 |
| CTA | Get Started | はじめる |

#### STEP 2: Struggles（複数選択）
| | EN | JA |
|---|---|---|
| title | What's holding you back? | どんなことに 悩んでいますか？ |
| subtitle | Select all that apply — we'll personalize your experience. | 当てはまるものを全て選んでください — あなた専用に調整します。 |

#### STEP 3: StruggleDepth（1タップ自動進行）
| | EN | JA |
|---|---|---|
| title | How often does this affect you? | どのくらいの頻度で 悩んでいますか？ |
| ○ daily | Every day | 毎日 |
| ○ several | Several times a week | 週に数回 |
| ○ weekly | Once a week | 週に1回 |
| ○ occasionally | Occasionally | たまに |

#### STEP 4: Goals（複数選択）
| | EN | JA |
|---|---|---|
| title | What does your best self look like? | 最高の自分は どんな姿ですか？ |
| subtitle | Choose what matters most to you. | 大切なものを選んでください。 |

Goals: Better Sleep / Emotional Calm / Less Screen Time / More Discipline / Self-Acceptance / Deeper Focus / Healthier Habits / Inner Peace

#### STEP 5: PersonalizedInsight（アニメーション — 既存 `PersonalizedInsightStepView.swift`）
| | EN | JA |
|---|---|---|
| title | Based on your answers | あなたの回答に基づいて |
| stat | 81% of people with similar struggles improved within 30 days | 同じ悩みを持つ81%の人が 30日以内に改善しました |
| message | Anicca will create a personalized path for you. | アニッチャがあなた専用の道を作ります。 |
| CTA | See Your Plan | あなたのプランを見る |

#### STEP 6: ValueProp（7日間ジャーニー タイムライン — 既存 `ValuePropStepView.swift`）
| Day | EN | JA |
|-----|----|----|
| title | Your 7-Day Journey | あなたの7日間の旅 |
| 1 | Awareness — Notice your patterns | 気づき — パターンに気づく |
| 2 | Understanding — Learn your triggers | 理解 — トリガーを学ぶ |
| 3 | First Shift — Replace one habit | 最初の変化 — 1つの習慣を置き換える |
| 4 | Deepening — Mindful moments | 深化 — マインドフルな瞬間 |
| 5 | Strength — Handle urges differently | 強さ — 衝動に違う方法で対処する |
| 6 | Integration — New daily rhythm | 統合 — 新しい日々のリズム |
| 7 | Reflection — See how far you've come | 振り返り — どこまで来たか確認する |
| CTA | Start My Journey | 旅を始める |

#### STEP 7: Notifications
| | EN | JA |
|---|---|---|
| title | Don't miss your nudges | 毎日の通知を受け取る |
| description | Anicca sends gentle reminders exactly when you need them. | 必要な瞬間に、やさしいリマインダーを届けます。 |
| CTA | Allow notifications | 通知を許可 |

#### STEP 8: Primer（Trial教育 — ⚠️ 修正必要、上記参照）
| | EN | JA |
|---|---|---|
| title | We want you to try Anicca for free ⚠️ | まずは無料で アニッチャを試してください ⚠️ |
| subtitle | ...Experience the full journey risk-free. ⚠️ | ...リスクなしで全ての旅を体験 ⚠️ |
| feature1 | Full access to all features | 全機能にアクセス |
| feature2 | Personalized nudges | パーソナライズされたナッジ |
| feature3 | Cancel anytime | いつでもキャンセル可能 |

#### STEP 9: Paywall (Variant B — ハードペイウォール、トライアルなし)

Source: ios-app-onboarding skill — 「Hard paywall D35 Download→Paid: 12.11% vs Freemium 2.18%」
Source: Cravotta Method — 「Multi-step paywall で CVR 2倍」

| | EN | JA |
|---|---|---|
| title | Gentle words when you need them most | あなたが一番つらいとき、そっと届く言葉 |
| subtitle | Daily cards to help you through your struggles | あなたの悩みに寄り添うカードを毎日受け取ろう |
| features | ✓ Smart nudges ✓ AI guidance ✓ Adapts ✓ Learns ✓ Cancel anytime | ✓ スマートナッジ ✓ AIガイダンス ✓ 適応 ✓ 学習 ✓ キャンセル可 |
| Annual | (RevenueCat動的) BEST VALUE + daily price | (RevenueCat動的) おすすめ + 1日あたり価格 |
| Monthly | (RevenueCat動的) | (RevenueCat動的) |
| CTA | Start Your Journey Now | 今すぐ旅を始める |
| review | "Anicca helped me be kinder to myself." — A real user | 「アニッチャのおかげで自分に優しくなれました」— 実際のユーザー |
| trust | Cancel anytime · Satisfaction guaranteed | いつでもキャンセル · 満足保証 |
| ❌ Xボタン | なし | なし |
| ❌ Maybe Later | なし | なし |
| ❌ トライアル | なし（CTA・trust・badge 全てからtrial言及削除） | なし |

**⚠️ 価格は100% RevenueCat `localizedPriceString` から動的取得。ハードコードゼロ。**

### 変更点まとめ

```
フロー変更: なし（現行8ステップ維持）
Primer修正: risk-free/無料で試して → あなた専用プラン準備完了（trial言及なし）
Paywall修正: trial関連テキスト全削除、CTA変更
ASC修正: annual/monthly 両方のトライアル削除
```

**Social Proof画面は追加しない**（実際のレビューがまだないため）
**Processing画面は既存（PersonalizedInsightStepView）をそのまま使用**

### 実装ファイル

| ファイル | 変更内容 |
|---------|---------|
| `en.lproj/Localizable.strings` L1325-1326 | Primer title/subtitle 修正 |
| `ja.lproj/Localizable.strings` L1325-1326 | Primer title/subtitle 修正 |
| `es.lproj/Localizable.strings` | Primerキー追加 |
| `en.lproj/Localizable.strings` L1362-1365 | paywall_b_cta_trial → cta_no_trial に統一、trust_trial 削除 |
| `ja.lproj/Localizable.strings` L1362-1365 | 同上 JA版 |
| `es.lproj/Localizable.strings` L1328-1331 | 同上 ES版 |
| `PaywallVariantBView.swift` | hasTrialEligibility 関連UI削除、CTA を no_trial 固定 |

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

### 見出しテキスト（競合 Playwright スクレイプ結果に基づく）

**競合スクショテキスト（Playwright で実際にスクレイプ済み）:**

| SS# | I Am (709K reviews) | Motivation (1M reviews) |
|-----|---------------------|------------------------|
| 1 | Daily reminders to stay positive | Get motivation throughout the day |
| 2 | Personalized affirmations | Change your thoughts, change your life |
| 3 | Customizable widgets | 1000s of options to customize widgets |
| 4 | 1000+ themes | Quotes for every situation |
| 5 | 75+ categories | Themes for every mood |
| 6 | Change your mindset | Change your mindset |

**共通パターン:** SS1=通知+ウィジェット訴求、SS3=ウィジェット推し、SS6=マインドセット変革

Source: app-store-screenshots skill — 「Screenshots are advertisements, not documentation. Every screenshot sells one idea.」
Source: aso best-practices.md — 「50%のユーザーは最初の3枚しか見ない」「60%のユーザーは3秒以内で離脱」

**Anicca スクショテキスト:**

| SS# | EN Headline | JA Headline | 競合との差別化 |
|-----|-------------|-------------|---------------|
| SS1 | Words that find you when you need them | あなたを見つける言葉がある | 競合は「reminders/motivation」→ Aniccaは「感情的つながり」 |
| SS2 | Be kinder to yourself today | 今日、自分にやさしく | 競合は「personalized」→ Aniccaは「具体的行動」 |
| SS3 | Done is better than perfect | 完璧より完了 | 競合は「widgets/themes」→ Aniccaは「行動促進カード」 |
| SS4 | Your personal growth path | あなた専用の成長の道 | 競合は「categories数」→ Aniccaは「パーソナライズ旅」 |
| SS5 | Made for what you're going through | あなたの悩みに寄り添うために | 競合にない：悩み選択画面 |

- A/Bテスト: ASC CLI でスクリーンショットセットのA/Bテスト実施

### 生成方法
- ParthJadhav/app-store-screenshots skill (Next.js) で生成
- iPhone mockup付き、4解像度出力（6.9", 6.5", 6.3", 6.1"）
- EN / JA / ES の3言語

---

## 5. ASO最適化（EN / JA / ES）

### Sources

| Source | 核心の引用 |
|--------|-----------|
| Eronred/aso-skills metadata-optimization | 「Lead with brand if well-known; lead with keyword if not」「Never repeat keywords across title, subtitle, and keyword field」 |
| Eronred/aso-skills keyword-research | 「Use singular forms — Apple indexes both」「No spaces after commas」「Don't include app name or category name in keyword field」 |
| aso-growth skill | 「Title = Keyword - App Name 形式。キーワードを前に」「スクショ1-2枚目は2-3秒で判断される」 |
| aso best-practices.md | 「50%のユーザーは最初の3枚しか見ない」「最適化されたスクショはCVRを30%以上改善」 |

### 現状（App Store Connect 取得済み）

| 項目 | EN (en-US) | JA (ja) | ES (es-ES) |
|------|-----------|---------|------------|
| **Name** | Daily Self Care - Anicca | 毎日のセルフケア - アニッチャ | Buddhist Nudges -- Anicca ⚠️ |
| **Subtitle** | Daily Cards for Self Care | セルフケア・アファメーション | Sigue los 5 Preceptos ⚠️ |
| **Keywords** | mindfulness,self care,behavior change,anxiety,stress,procrastination,wellness,meditation,habits,mood | マインドフルネス,セルフケア,メンタルヘルス,不安,集中,先延ばし,セルフヘルプ,考えすぎ,ストレス,習慣,あにっちゃ,アニッチャ | mindfulness,autocuidado,salud mental,ansiedad,enfoque,procrastinación,autoayuda,estrés,hábito |
| **Promo Text** | なし | なし | なし |
| **Description** | "Break free from the cycle of failed habits..." | "習慣化の失敗ループから抜け出そう..." | "Anicca es tu companero diario..." |

**⚠️ ES メタデータが完全に間違っている（古い設定が残存）— 即修正必須**

### 競合比較（Playwright スクレイプ済み）

| アプリ | Name 構造 | Subtitle 戦略 | ★ | Reviews |
|--------|----------|-------------|---|---------|
| **I am** | `I am - Daily Affirmations` (KW - Brand) | `Positive widgets & motivation` (KW+KW) | 4.8 | 709K |
| **Motivation** | `Motivation - Daily quotes` (KW - KW) | `Inspirational positive widgets` (KW+KW) | 4.8 | 1M |
| **Anicca** | `Daily Self Care - Anicca` (KW - Brand) | `Daily Cards for Self Care` (重複KW) | 4.9 | 少数 |

### 現状の問題点（metadata-optimization skill ルール適用）

| 問題 | ルール違反 | Source |
|------|----------|--------|
| Title に「affirmation」がない | 「#1 target keyword を Title に含める」 | metadata-optimization |
| Subtitle が Title と「Self Care」「Daily」重複 | 「Never repeat keywords from the title」 | metadata-optimization |
| Keywords に Title/Subtitle のワード重複 | 「Never repeat words from title or subtitle」 | metadata-optimization |
| Keywords にスペース後のカンマなし（OK）だが「behavior change」は検索されない | 「Prioritize by: volume × relevance」 | keyword-research |
| Promo Text 未設定 | 「Timely messaging that doesn't require app review」 | metadata-optimization |
| ES が完全に別アプリの設定 | — | — |

### 修正提案（3オプション + character count）

#### EN Title (30 chars)

| Option | Text | Chars | Keywords |
|--------|------|-------|----------|
| **推奨** | `Affirmations - Anicca` | 21/30 | affirmations ✓ |
| Alt A | `Anicca: Daily Affirmations` | 27/30 | daily ✓ affirmations ✓ |
| Alt B | `Self Care - Anicca` | 19/30 | self care ✓ |

**決定: Alt A `Anicca: Daily Affirmations` (27/30)** — ブランド + #1 KW + #2 KW

#### EN Subtitle (30 chars)

| Option | Text | Chars | Keywords (Title未使用) |
|--------|------|-------|----------------------|
| **推奨** | `Self Care & Positive Mindset` | 29/30 | self care ✓ positive ✓ mindset ✓ |
| Alt A | `Mindful Self Care & Wellness` | 29/30 | mindful ✓ self care ✓ wellness ✓ |
| Alt B | `Gentle Words for Self Care` | 27/30 | gentle ✓ self care ✓ |

**決定: 推奨 `Self Care & Positive Mindset` (29/30)** — 競合が「positive」「widgets」使用、「mindset」は Change your mindset（競合SS6共通）

#### EN Keywords (100 chars)

```
self love,mental health,anxiety,stress,wellness,mindfulness,mood,calm,quote,meditation,habit,healing
Characters: 99/100
```

ルール適用:
- ❌ Title の「daily」「affirmations」「anicca」除外（metadata-optimization: 重複禁止）
- ❌ Subtitle の「self care」「positive」「mindset」除外（同上）
- ✓ singular form のみ（keyword-research: Apple indexes both）
- ✓ スペースなし（keyword-research）
- ❌ 「app」「free」除外（keyword-research: Don't include）

#### JA Title (30 chars)

| Option | Text | Chars |
|--------|------|-------|
| **決定** | `アニッチャ: 毎日のアファメーション` | 16/30 |

#### JA Subtitle (30 chars)

| Option | Text | Chars | Keywords (Title未使用) |
|--------|------|-------|----------------------|
| **決定** | `セルフケア・メンタルヘルス` | 13/30 |

#### JA Keywords (100 chars)

```
自己肯定感,不安,先延ばし,考えすぎ,ストレス,瞑想,自分を好きになる,習慣,名言,心の平和,あにっちゃ,マインドフルネス
Characters: 56/100（残り44文字 — 追加KW調査必要）
```

#### ES Title / Subtitle / Keywords

| 項目 | Before ⚠️ | After |
|------|----------|-------|
| **Name** | `Buddhist Nudges -- Anicca` | `Anicca: Afirmaciones Diarias` (29/30) |
| **Subtitle** | `Sigue los 5 Preceptos` | `Autocuidado y bienestar mental` (30/30) |
| **Keywords** | 現行 | `autoestima,ansiedad,estrés,meditación,frases positiva,motivación,calma,hábito,bienestar,salud` (91/100) |

#### Promo Text（全言語 — トライアルなし版）

| 言語 | Text |
|------|------|
| EN | `Gentle words when you need them most. Cancel anytime.` |
| JA | `あなたが一番つらいとき、そっと届く言葉。いつでもキャンセル可能。` |
| ES | `Palabras que llegan cuando más las necesitas. Cancela cuando quieras.` |

**⚠️ トライアルなしなので Promo Text に「free trial」「無料トライアル」は書かない。**

### Keyword Coverage Matrix（EN）

| Keyword | Title | Subtitle | Keyword Field | 配置 |
|---------|-------|----------|---------------|------|
| affirmations | ✓ | | | Title |
| daily | ✓ | | | Title |
| self care | | ✓ | | Subtitle |
| positive | | ✓ | | Subtitle |
| mindset | | ✓ | | Subtitle |
| self love | | | ✓ | KW Field |
| mental health | | | ✓ | KW Field |
| anxiety | | | ✓ | KW Field |
| stress | | | ✓ | KW Field |
| wellness | | | ✓ | KW Field |
| mindfulness | | | ✓ | KW Field |
| meditation | | | ✓ | KW Field |
| calm | | | ✓ | KW Field |
| quote | | | ✓ | KW Field |
| mood | | | ✓ | KW Field |
| habit | | | ✓ | KW Field |
| healing | | | ✓ | KW Field |

**重複ゼロ。17キーワードカバー。**

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

| # | タスク | 担当 | 再提出 | 状態 |
|---|--------|------|--------|------|
| **T1** | **App Storeスクリーンショット生成（EN/JA/ES）** | **CC** | ✅(ASC) | 🔜 FIRST |
| T2 | Primer + Paywall Localizable.strings修正（EN/JA/ES — trial全削除） | CC | ✅ | 🔜 |
| T3 | PaywallVariantBView.swift — trial UI削除、CTA固定 | CC | ✅ | 🔜 |
| T4 | ASO metadata 更新（EN/JA/ES — title+subtitle+keywords+promo） | CC | ✅(ASC) | 🔜 |
| T5 | Honne JA 3 cron → reelclaw形式 | CC | ❌ | 🔜 |
| T6 | 既存Anicca 4 cron修正（overlay削除+購入解除） | CC | ❌ | 🔜 |
| T7 | SKILL.md購入制限解除 | CC | ❌ | 🔜 |
| T8 | `openclaw gateway restart` | CC | ❌ | 🔜 |
| T9 | Widget Extension開発 | CC | ✅ | 🔜 |
| T10 | ビルド+提出 release/1.8.3 | CC | ✅ | 🔜 |
| **T11** | **App Store Connect でトライアル削除（annual+monthly）** | **ダイス** | **✅** | ⏳ |
| **T12** | **Widget demo動画撮影（EN+JA）** | **ダイス** | ❌ | ⏳ |
| **T13** | **Honne EN TikTokアカウント作成** | **ダイス** | ❌ | ⏳ |
| **T14** | **Postiz接続+integration ID** | **ダイス** | ❌ | ⏳ |
| T15 | Honne EN cron 3つ追加 | CC | ❌ | 🔜 |
| T16 | Anicca Widget cron 4つ追加 | CC | ❌ | 🔜 |

### 実行順

```
NOW         → T1 (Screenshots FIRST!)
TODAY       → T2+T3 (Primer+Paywall fix) → T4 (ASO) → T5-T8 (cron+restart)
TOMORROW    → T9 (Widget)
DAY 3       → T10 (Build+Submit)
PARALLEL    → T11 (ダイス trial削除) + T12-T14 (ダイスタスク)
AFTER T9    → T12 (ダイスWidget動画) → T16 (Widget cron)
AFTER T13+14→ T15 (Honne EN cron)
```

**T1〜T4+T9 をまとめて1回の再提出（release/1.8.3）。**
**T5-T8 は即実行可能（再提出不要）。**

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
