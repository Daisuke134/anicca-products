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

| 言語 | キー | Before | After |
|------|------|--------|-------|
| EN | `paywall_primer_title` | `"We want you to try\nAnicca for free"` | `"Your personalized plan\nis ready"` |
| EN | `paywall_primer_subtitle` | `"...Experience the full journey risk-free."` | `"Start with a free trial and experience the full journey."` |
| JA | `paywall_primer_title` | `"まずは無料で\nアニッチャを試してください"` | `"あなた専用プランの\n準備ができました"` |
| JA | `paywall_primer_subtitle` | `"...リスクなしで全ての旅を体験してください。"` | `"無料トライアルから始めて、全ての旅を体験してください。"` |
| ES | `paywall_primer_title` | ⚠️ ES にキー未存在 | 追加: `"Tu plan personalizado\nestá listo"` |
| ES | `paywall_primer_subtitle` | ⚠️ ES にキー未存在 | 追加: `"Comienza con una prueba gratuita y vive la experiencia completa."` |

**修正理由:** `"risk-free"` / `"リスクなし"` / `"try for free"` は Apple 審査ガイドライン 3.1.2(a) で NG

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

#### STEP 9: Paywall (Variant B — ハードペイウォール)
| | EN | JA |
|---|---|---|
| title | Gentle words when you need them most | あなたが一番つらいとき、そっと届く言葉 |
| subtitle | Daily cards to help you through your struggles | あなたの悩みに寄り添うカードを毎日受け取ろう |
| features | ✓ Smart nudges ✓ AI guidance ✓ Adapts ✓ Learns ✓ Cancel anytime | ✓ スマートナッジ ✓ AIガイダンス ✓ 適応 ✓ 学習 ✓ キャンセル可 |
| Annual | $49.99/yr BEST VALUE (Just $0.14/day, 7 Days trial) | ¥7,900/年 おすすめ (1日¥22, 7日間トライアル) |
| Monthly | $9.99/mo | ¥1,500/月 |
| CTA trial | Start 7 Days Free Trial | 7日間無料トライアルを始める |
| review | "Anicca helped me be kinder to myself." | 「アニッチャのおかげで自分に優しくなれました」 |
| trust | Free trial · Cancel anytime · No charge until trial ends | 無料トライアル · いつでもキャンセル · トライアル中は課金なし |

**⚠️ 価格は RevenueCat から動的取得。上記は参考値。**

### 新フロー変更点

```
現行: Welcome → Struggles → StruggleDepth → Goals → PersonalizedInsight → ValueProp → Notifications → Primer → Paywall
修正: 追加画面なし。Primer テキスト修正のみ（risk-free → free trial）
```

**Social Proof画面は追加しない**（実際のレビューがまだないため）
**Processing画面は既存（PersonalizedInsightStepView）をそのまま使用**

### 実装ファイル
- `en.lproj/Localizable.strings` L1325-1326 — Primer修正
- `ja.lproj/Localizable.strings` L1325-1326 — Primer修正
- `es.lproj/Localizable.strings` — Primerキー追加

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

| SS# | EN Headline | JA Headline |
|-----|-------------|-------------|
| SS1 | Words That Heal You From Within | 心の奥から癒す言葉 |
| SS2 | Be Kinder to Yourself Today | 今日、自分にやさしく |
| SS3 | Done Is Better Than Perfect | 完璧より完了 |
| SS4 | Your Personal Growth Path | あなた専用の成長の道 |
| SS5 | Personalized For Your Struggles | あなたの悩みに合わせて |

**競合分析結果:** I Am / Motivation はスクショテキストが画像埋め込みのためWeb版からテキスト抽出不可。ThinkUp / Shine は App Store ページ削除済み。競合 subtitle から学んだこと: "widgets" と "positive" が高頻度キーワード。

- A/Bテスト: ASC CLI でスクリーンショットセットのA/Bテスト実施

### 生成方法
- ParthJadhav/app-store-screenshots skill (Next.js) で生成
- iPhone mockup付き、4解像度出力（6.9", 6.5", 6.3", 6.1"）
- EN / JA / ES の3言語

---

## 5. ASO最適化（EN / JA / ES）

### 現状（App Store Connect 取得済み）

| 項目 | EN (en-US) | JA (ja) | ES (es-ES) |
|------|-----------|---------|------------|
| **Name** | Daily Self Care - Anicca | 毎日のセルフケア - アニッチャ | Buddhist Nudges -- Anicca ⚠️ |
| **Subtitle** | Daily Cards for Self Care | セルフケア・アファメーション | Sigue los 5 Preceptos ⚠️ |
| **Keywords** | mindfulness,self care,behavior change,anxiety,stress,procrastination,wellness,meditation,habits,mood | マインドフルネス,セルフケア,メンタルヘルス,不安,集中,先延ばし,セルフヘルプ,考えすぎ,ストレス,習慣,あにっちゃ,アニッチャ | mindfulness,autocuidado,salud mental,ansiedad,enfoque,procrastinación,autoayuda,estrés,hábito |
| **Promo Text** | なし | なし | なし |

**⚠️ ES メタデータが完全に間違っている（古い設定が残存）**

### 競合比較

| アプリ | Name | Subtitle | ★ | Reviews |
|--------|------|----------|---|---------|
| **I am** | I am - Daily Affirmations | Positive widgets & motivation | 4.8 | 709K |
| **Motivation** | Motivation - Daily quotes | Inspirational positive widgets | 4.8 | 1M |
| **Anicca** | Daily Self Care - Anicca | Daily Cards for Self Care | 4.9 | 少数 |

### 修正提案

| 項目 | EN Before → After | JA Before → After | ES Before → After |
|------|-------------------|-------------------|-------------------|
| **Name** | `Daily Self Care - Anicca` → `Anicca: Daily Affirmations` | `毎日のセルフケア - アニッチャ` → `アニッチャ: 毎日のアファメーション` | `Buddhist Nudges -- Anicca` → `Anicca: Afirmaciones Diarias` |
| **Subtitle** | `Daily Cards for Self Care` → `Self Care & Positive Mindset` | `セルフケア・アファメーション` → `セルフケア・メンタルヘルス` | `Sigue los 5 Preceptos` → `Autocuidado y bienestar mental` |
| **Keywords** | 現行 → `affirmations,self care,mental health,anxiety,stress,self love,wellness,mindfulness,daily quotes,positive` | 現行 → `アファメーション,セルフケア,メンタルヘルス,不安,自己肯定感,先延ばし,マインドフルネス,ストレス,瞑想,自分を好きになる` | 現行 → `afirmaciones,autocuidado,salud mental,ansiedad,autoestima,bienestar,meditación,estrés,frases positivas,motivación` |
| **Promo Text** | なし → `Start your free trial. Gentle words when you need them most.` | なし → `無料トライアル実施中。あなたが一番つらいとき、そっと届く言葉。` | なし → `Prueba gratuita disponible. Palabras que llegan cuando más las necesitas.` |

**根拠:**
- Source: [AppFollow ASO Guide](https://appfollow.io/aso) — 「Title + Subtitle に最重要キーワードを含める」
- 競合 I Am (709K reviews) / Motivation (1M reviews) は "Daily Affirmations" / "Daily quotes" をタイトルに使用
- 「affirmations」はカテゴリ最重要キーワード → タイトルに入れる
- ES は古い "Buddhist Nudges" が残っており即修正必須

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
