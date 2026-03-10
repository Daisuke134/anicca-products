# Daily Dhamma Onboarding v2 — 8スライド + 3ステップPaywall

## 開発環境

| 項目 | 値 |
|------|-----|
| ブランチ | release/1.7.0（直接作業、ユーザー承認済み） |
| 対象ファイル | `mobile-apps/daily-dhamma-app/app/onboarding.tsx`, `locales/*.json`, `providers/AppProvider.tsx`（回答保存用） |
| 触らないファイル | `app/paywall.tsx`（実装済み）、`utils/notifications.ts`（実装済み） |
| 状態 | SPEC REVIEW |

---

## 背景

現状のオンボーディングは3スライド（Welcome → Feature → Notification）で、パーソナライゼーション・価値証明・結果表示が全て欠落。スキルBP（Vara Framework / Superwall / Clear 30 / PaywallScreens）によれば、$500K+/月アプリはほぼ全て「質問 → 価値証明 → パーソナライズ結果 → Paywall」パターンを採用。

---

## フロー図

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│1.Hook   │→│2.Q1     │→│3.Value  │→│4.Q2     │
│感情フック│  │目的質問  │  │権威証明  │  │頻度質問  │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
      ↓
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐
│5.Build  │→│6.Result │→│7.Notif  │→│ 3-Step Paywall   │
│プラン生成│  │結果表示  │  │通知許可  │  │ (実装済み)        │
└─────────┘  └─────────┘  └─────────┘  └──────────────────┘
```

---

## スライド詳細

### Slide 1: 感情フック（Welcome + Hook）

| 要素 | EN | JA |
|------|----|----|
| Icon | 🌸 | 🌸 |
| Title | "Find peace in\njust 30 seconds a day" | "1日たった30秒で\n心の安らぎを" |
| Subtitle | "2,500 years of wisdom, delivered to you each morning" | "2,500年の智慧が、毎朝届きます" |
| CTA | "Continue" | "次へ" |

**BP:** Scott Belsky (Adobe CPO): 「最初の15秒で lazy, vain, selfish」。Superwall Value Equation: Dream Outcome 最大化 + Time Delay 最小化。

---

### Slide 2: パーソナライゼーション質問 1（目的）

| 要素 | EN | JA |
|------|----|----|
| Title | "What brings you to\nDaily Dhamma?" | "デイリーダンマを\n使う目的は？" |
| Option A | 🧘 Inner peace | 🧘 心の安らぎ |
| Option B | 📚 Daily wisdom | 📚 毎日の智慧 |
| Option C | 🌅 Morning routine | 🌅 朝のルーティン |
| Option D | 💭 Mindfulness practice | 💭 マインドフルネスの実践 |
| CTA | "Continue" | "次へ" |
| 保存先 | `onboardingGoal: 'peace' \| 'wisdom' \| 'routine' \| 'mindfulness'` | AsyncStorage |

**BP:** Vara Framework 原則1: 「Personalize immediately」。Superwall: Endowment effect CVR +20-40%。

---

### Slide 3: Value Proposition（権威証明）

| 要素 | EN | JA |
|------|----|----|
| Title | "The Dhammapada has guided\nmillions for 2,500 years" | "法句経は2,500年にわたり\n数百万人を導いてきました" |
| Stat 1 | 📖 423 verses of timeless wisdom | 📖 423の普遍の教え |
| Stat 2 | 🌍 Translated into 50+ languages | 🌍 50以上の言語に翻訳 |
| Stat 3 | 🧘 Practiced by monks and modern minds alike | 🧘 僧侶から現代人まで実践 |
| CTA | "Continue" | "次へ" |

**BP:** Superwall Bootcamp: 「質問間にvalue propositionを挟む」。NN/Group Authority Principle。Social Proof Phase 1 戦略。

---

### Slide 4: パーソナライゼーション質問 2（頻度）

| 要素 | EN | JA |
|------|----|----|
| Title | "When would you like\nyour daily wisdom?" | "毎日の智慧を\nいつ受け取りたいですか？" |
| Option A | 🌅 Morning (recommended) | 🌅 朝（おすすめ） |
| Option B | ☀️ Midday | ☀️ 昼 |
| Option C | 🌙 Evening | 🌙 夜 |
| CTA | "Continue" | "次へ" |
| 保存先 | `onboardingTime: 'morning' \| 'midday' \| 'evening'` | AsyncStorage |

**BP:** Purchasely 2026: 「Personalize early」。Answer Mirroring: 回答を後続画面に反映。

---

### Slide 5: Building Your Plan（ローディング）

| 要素 | EN | JA |
|------|----|----|
| Title | "Creating your\npersonal practice..." | "あなた専用の\n修行プランを作成中..." |
| Animated item 1 (0.5s) | ✅ Selecting verses for you | ✅ あなたに合った法句経を選定中 |
| Animated item 2 (1.0s) | ✅ Setting your schedule | ✅ スケジュールを設定中 |
| Animated item 3 (1.5s) | ✅ Personalizing your journey | ✅ あなたの旅をパーソナライズ中 |
| 自動遷移 | 2.5秒後に自動で Slide 6 へ | 同左 |

**BP:** Clear 30: 「Building your plan moment → anticipation」。RISE: questions → loading → paywall。IKEA Effect 応用。

---

### Slide 6: パーソナライズ結果

| 要素 | EN | JA |
|------|----|----|
| Title | "Your practice is ready" | "あなたの修行プランが\n完成しました" |
| Result 1 | 🎯 Goal: {Slide 2の回答反映} | 🎯 目標: {Slide 2の回答反映} |
| Result 2 | ⏰ Schedule: {Slide 4の回答反映} | ⏰ スケジュール: {Slide 4の回答反映} |
| Result 3 | 📖 423 verses selected for you | 📖 423の教えがあなたを待っています |
| CTA | "Start my journey" | "旅を始める" |

**Goal の Answer Mirroring マッピング:**

| Slide 2 回答 | EN 表示 | JA 表示 |
|-------------|---------|---------|
| peace | Inner peace & calm | 心の安らぎ |
| wisdom | Daily wisdom & growth | 毎日の智慧と成長 |
| routine | Mindful morning routine | マインドフルな朝のルーティン |
| mindfulness | Mindfulness practice | マインドフルネスの実践 |

**Schedule の Answer Mirroring マッピング:**

| Slide 4 回答 | EN 表示 | JA 表示 |
|-------------|---------|---------|
| morning | Every morning | 毎朝 |
| midday | Every midday | 毎日お昼 |
| evening | Every evening | 毎晩 |

**BP:** Vara Framework 原則3: 「Max perceived value before paywall」。PaywallScreens: $500K+/月パターン。Prayer Lock: Answer Mirroring。

---

### Slide 7: 通知許可（Value-framed）

| 要素 | EN | JA |
|------|----|----|
| Icon | 🔔 | 🔔 |
| Title | "Never miss your\nmorning wisdom" | "毎朝の智慧を\n逃さないように" |
| Subtitle | "Get your personalized verse delivered {Slide 4回答反映}" | "{Slide 4回答反映}に、あなた専用の法句経をお届けします" |
| CTA | "Enable Notifications" | "通知を有効にする" |
| Skip | "Not now" | "あとで" |

**BP:** Purchasely 2026: 「Teach in context」。Answer Mirroring で通知の価値を具体化。

---

### → 3-Step Paywall（変更なし、実装済み）

`router.replace('/paywall?source=onboarding')` でそのまま遷移。

---

## UI仕様

| 項目 | 値 | BP |
|------|-----|-----|
| Progress bar | 全スライドに表示。`0.2 + 0.8 × (currentStep / 7)` | Endowed Progress Effect（20%スタート） |
| Skip ボタン | 右上、全スライドに表示（薄いテキスト） | Apple ガイドライン必須 |
| 遷移アニメーション | スライド左→右、500ms ease-in-out | スキルBP: smooth animation |
| Haptic | CTA タップ時に Light impact | スキルBP: haptic on button tap |
| 質問スライド | 選択肢はカード型。タップ→ハイライト→次へ（1タップ遷移） | Fastic: 1-tap response |
| Building plan | 自動遷移（CTAなし） | Clear 30 |
| 背景色 | `Colors.light.background` (#FAF8F5) | 既存踏襲 |

---

## データ保存

| Key | Type | 保存場所 |
|-----|------|---------|
| `onboardingGoal` | `'peace' \| 'wisdom' \| 'routine' \| 'mindfulness'` | AppProvider (AsyncStorage) |
| `onboardingTime` | `'morning' \| 'midday' \| 'evening'` | AppProvider (AsyncStorage) |

Paywall の Step 3 タイトルは変更なし（現状のまま）。将来的に `onboardingGoal` に基づくパーソナライズヘッドラインをA/Bテスト可能。

---

## i18n キー追加一覧

| Key | EN | JA |
|-----|----|----|
| `onboarding.slide1.title` | "Find peace in\njust 30 seconds a day" | "1日たった30秒で\n心の安らぎを" |
| `onboarding.slide1.subtitle` | "2,500 years of wisdom, delivered to you each morning" | "2,500年の智慧が、毎朝届きます" |
| `onboarding.slide2.title` | "What brings you to\nDaily Dhamma?" | "デイリーダンマを\n使う目的は？" |
| `onboarding.slide2.option.peace` | "Inner peace" | "心の安らぎ" |
| `onboarding.slide2.option.wisdom` | "Daily wisdom" | "毎日の智慧" |
| `onboarding.slide2.option.routine` | "Morning routine" | "朝のルーティン" |
| `onboarding.slide2.option.mindfulness` | "Mindfulness practice" | "マインドフルネスの実践" |
| `onboarding.slide3.title` | "The Dhammapada has guided\nmillions for 2,500 years" | "法句経は2,500年にわたり\n数百万人を導いてきました" |
| `onboarding.slide3.stat1` | "423 verses of timeless wisdom" | "423の普遍の教え" |
| `onboarding.slide3.stat2` | "Translated into 50+ languages" | "50以上の言語に翻訳" |
| `onboarding.slide3.stat3` | "Practiced by monks and modern minds alike" | "僧侶から現代人まで実践" |
| `onboarding.slide4.title` | "When would you like\nyour daily wisdom?" | "毎日の智慧を\nいつ受け取りたいですか？" |
| `onboarding.slide4.option.morning` | "Morning" | "朝" |
| `onboarding.slide4.option.morningRec` | "recommended" | "おすすめ" |
| `onboarding.slide4.option.midday` | "Midday" | "昼" |
| `onboarding.slide4.option.evening` | "Evening" | "夜" |
| `onboarding.slide5.title` | "Creating your\npersonal practice..." | "あなた専用の\n修行プランを作成中..." |
| `onboarding.slide5.item1` | "Selecting verses for you" | "あなたに合った法句経を選定中" |
| `onboarding.slide5.item2` | "Setting your schedule" | "スケジュールを設定中" |
| `onboarding.slide5.item3` | "Personalizing your journey" | "あなたの旅をパーソナライズ中" |
| `onboarding.slide6.title` | "Your practice is ready" | "あなたの修行プランが\n完成しました" |
| `onboarding.slide6.goal` | "Goal" | "目標" |
| `onboarding.slide6.schedule` | "Schedule" | "スケジュール" |
| `onboarding.slide6.verses` | "423 verses selected for you" | "423の教えがあなたを待っています" |
| `onboarding.slide6.cta` | "Start my journey" | "旅を始める" |
| `onboarding.slide7.title` | "Never miss your\nmorning wisdom" | "毎朝の智慧を\n逃さないように" |
| `onboarding.slide7.subtitle.morning` | "Get your personalized verse delivered every morning" | "毎朝、あなた専用の法句経をお届けします" |
| `onboarding.slide7.subtitle.midday` | "Get your personalized verse delivered every midday" | "毎日お昼に、あなた専用の法句経をお届けします" |
| `onboarding.slide7.subtitle.evening` | "Get your personalized verse delivered every evening" | "毎晩、あなた専用の法句経をお届けします" |
| `onboarding.notNow` | "Not now" | "あとで" |
| `onboarding.result.peace` | "Inner peace & calm" | "心の安らぎ" |
| `onboarding.result.wisdom` | "Daily wisdom & growth" | "毎日の智慧と成長" |
| `onboarding.result.routine` | "Mindful morning routine" | "マインドフルな朝のルーティン" |
| `onboarding.result.mindfulness` | "Mindfulness practice" | "マインドフルネスの実践" |
| `onboarding.result.morning` | "Every morning" | "毎朝" |
| `onboarding.result.midday` | "Every midday" | "毎日お昼" |
| `onboarding.result.evening` | "Every evening" | "毎晩" |

**削除キー:** `onboarding.slide2.*`（旧Feature）、`onboarding.slide3.*`（旧Notification）は新キーで上書き。

---

## 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/onboarding.tsx` | 3スライド→8スライド。質問UI、ローディングアニメ、結果表示、プログレスバー追加 |
| `locales/en.json` | 上記i18nキー全追加 |
| `locales/ja.json` | 上記i18nキー全追加（JA列） |
| `providers/AppProvider.tsx` | `onboardingGoal` / `onboardingTime` を state + AsyncStorage に追加 |
| `__tests__/i18n.test.ts` | キーカウント更新 |

---

## テスト計画

| # | テスト | 期待結果 |
|---|--------|---------|
| 1 | シミュレーター JA: アプリ削除→再インストール | オンボーディング Slide 1 から開始 |
| 2 | Slide 1→2→3→4→5→6→7 遷移 | プログレスバーが20%→100%に進む |
| 3 | Slide 2: 「心の安らぎ」選択 | Slide 6 に「🎯 目標: 心の安らぎ」表示 |
| 4 | Slide 4: 「朝」選択 | Slide 6 に「⏰ 毎朝」、Slide 7 に「毎朝、あなた専用の法句経を〜」表示 |
| 5 | Slide 5 | 2.5秒のローディング後、自動で Slide 6 へ |
| 6 | Slide 7: 「通知を有効にする」タップ | 通知許可ダイアログ表示 |
| 7 | Slide 7 完了後 | Paywall Step 1（Risk-Free Primer）表示 |
| 8 | Skip ボタン（任意のスライド） | メイン画面に遷移（paywall スキップ） |
| 9 | `npm test` | 全テストパス |
| 10 | EN切替テスト | 全テキストが英語で表示 |

---

## E2E判定

Maestro E2E テストは次バージョン（v1.2.0）で追加。本リリースはシミュレーター手動テストで確認。

---

## 最終更新

2026-03-11
