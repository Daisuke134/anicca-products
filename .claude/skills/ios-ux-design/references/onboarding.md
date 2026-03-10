# iOS Onboarding Design Rules

Source: [Mau - Prayer Lock $25k/month](https://www.youtube.com/watch?v=mau_prayer_lock) — 8 rules for high-converting onboarding

## 8 Rules

| # | Rule | Detail |
|---|------|--------|
| 1 | **3-Act Structure** | Problem presentation -> App experience -> Paywall. "introduction -> climax -> conclusion" |
| 2 | **Questions = Self-Persuasion** | Ask questions not for data, but so users reflect on their own answers and convince themselves |
| 3 | **Answer Mirroring** | Mirror the user's answers back to them in subsequent screens to create personalization feeling |
| 4 | **Longer = Higher Conversion (if valuable)** | "the longer, the better it converts" — but every screen must provide value |
| 5 | **Let Users Experience Core Feature** | Don't just describe — let users actually USE the core feature during onboarding |
| 6 | **Review Modal After Core Experience** | Request App Store review RIGHT AFTER the user completes the core feature (peak satisfaction) |
| 7 | **Commitment Principle** | Users actively state they are committed BEFORE seeing the paywall |
| 8 | **10%+ DL-to-Trial Conversion** | Target at least 10% download-to-trial conversion rate |

## Implementation Pattern (SwiftUI)

```
OnboardingContainerView
  |-- Step 1: ProblemEmpathyView (Act 1: Problem)
  |     - Hook: "Do you struggle with X?"
  |     - Emotional connection
  |     - accessibilityIdentifier: "onboarding_get_started"
  |
  |-- Step 2: PersonalizationView (Act 1: Questions)
  |     - 2-3 questions for self-persuasion
  |     - Tap selections (not text input)
  |     - accessibilityIdentifier: "onboarding_continue"
  |
  |-- Step 3: CoreExperienceView (Act 2: Try It)
  |     - Let user USE the core feature
  |     - Brief, guided interaction
  |     - Review modal after completion (Rule 6)
  |
  |-- Step 4: CommitmentView (Act 2: Commit)
  |     - Mirror user's answers (Rule 3)
  |     - "Are you ready to commit?" (Rule 7)
  |
  |-- Step 5: PaywallView (Act 3: Soft Paywall)
  |     - Show plans (monthly + annual)
  |     - [Maybe Later] to dismiss (soft paywall)
  |     - accessibilityIdentifier: "paywall_plan_monthly", "paywall_plan_yearly", "paywall_maybe_later"
```

## Anti-Patterns

| Bad | Good |
|-----|------|
| Skip straight to paywall | 3-act structure with value delivery first |
| Ask questions without using answers | Mirror answers back in later screens |
| Describe features in text | Let users experience the core feature |
| Hard paywall (no skip) | Soft paywall with [Maybe Later] |
| Generic "Welcome to AppName" | Problem-focused hook that resonates |
| Request review on first launch | Request after core feature completion |

## Design Thinking for iOS Onboarding

Source: Adapted from [Anthropic frontend-design](frontend-design/SKILL.md)

Before designing, understand the context:
- **Purpose**: What problem does this onboarding solve? What's the user's emotional state?
- **Tone**: Warm and encouraging (health/wellness), Urgent and bold (productivity), Playful (entertainment)
- **Constraints**: iOS 15+ compatibility, VoiceOver, Dynamic Type, Dark Mode
- **Differentiation**: What's the one thing that makes this onboarding memorable?

Apply Apple HIG principles:
- Use SF Symbols, semantic colors, San Francisco font
- 44pt minimum touch targets
- Standard iOS navigation patterns
- Respect safe areas and Dynamic Island

## JP Localization Rules

Source: Calm JP / Meditopia JP / Apple HIG Localization

| # | Rule | Detail |
|---|------|--------|
| 1 | **直訳禁止** | 英語の直訳は冷たく響く。意味を汲み取り日本語の自然な表現に再構成する |
| 2 | **共感・寄り添い表現** | 「〜しませんか」より「〜できます」「〜していい」。命令形を避け、許可・安心の語調 |
| 3 | **大げさ表現回避** | 「旅」「journey」「自由」等は日本語では大仰。「毎日」「変化」等の身近な言葉を使う |
| 4 | **敬語レベル統一** | です/ます調で統一。タイトルのみ体言止めまたは「〜しよう」許可 |
| 5 | **改行で視認性確保** | 長い1行より適切な位置で `\n` を入れて読みやすくする |

## Social Proof Rules

Source: Jake Mor (Superwall CEO) — "Social proof must be verifiable"

| # | Rule | Detail |
|---|------|--------|
| 1 | **検証可能な数字のみ** | App Store レーティング、実測データのみ使用可。虚偽の数字は Apple Review ガイドライン違反リスク |
| 2 | **ユーザー数は事実ベース** | 「10,000+」等の誇張禁止。実際のダウンロード数が確認できない場合は使わない |
| 3 | **レーティング + リスク除去** | Social proof と "Cancel anytime" を組み合わせる（Calm パターン） |

## Paywall Design 7 Elements

Source: Adapty iOS Paywall Design Guide 2026 + Blinkist/Calm/Headspace patterns

| # | Element | Detail |
|---|---------|--------|
| 1 | **ベネフィット見出し** | 機能名ではなくユーザー価値（「プランを選択」→「あなたの可能性を解き放とう」） |
| 2 | **ベネフィットリスト** | 3項目、チェックマーク付き。機能ではなく成果を書く |
| 3 | **プラン選択** | 2-3プラン。年間に BEST VALUE バッジ。デフォルト選択は年間 |
| 4 | **Social Proof** | 検証可能な数字のみ（上記ルール参照） |
| 5 | **CTA** | アクション動詞 + "Free Trial"。ボタンは画面幅いっぱい、56pt高、角丸28 |
| 6 | **Risk Reversal** | 「いつでも解約OK」を2箇所以上（social proof行 + trust行） |
| 7 | **Soft Dismiss** | Maybe Later → Drawer 再オファー。ハードブロック禁止 |
