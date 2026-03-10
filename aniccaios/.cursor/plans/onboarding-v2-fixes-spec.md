# Onboarding v2.1 修正スペック (2026-03-11)

**ステータス: 承認待ち**
**ブランチ: release/1.7.0（今回のみ。今後は dev → worktree → dev → main → release）**
**新スキル参照: ios-app-onboarding（Cravotta 3-step paywall, Superwall bootcamp, RevenueCat 2025）**

## ソース

| # | ソース | 核心 |
|---|--------|------|
| S1 | Mau - Prayer Lock onboarding rules (既存スキル) | 3-Act Structure, Self-Persuasion, Answer Mirroring, Commitment Principle |
| S2 | Jake Mor (Superwall CEO) | 「Most important metric: Install → Paywall View」「Social proof must be verifiable」 |
| S3 | Adapty iOS Paywall Design Guide 2026 | 「2-3 products +44-61% conversion」「Benefit-driven headlines > feature lists」 |
| S4 | RevenueCat State of Subscription Apps 2025 | 「Top apps: 10%+ trial conversion」「Clear value prop before price」 |
| S5 | Blinkist/Calm/Headspace paywall patterns | Timeline + feature list + social proof + risk reversal |
| S6 | Apple HIG | 自然な日本語、ユーザーの言葉で語る |

---

## 現行フロー

```
Welcome → Struggles → StruggleDepth → Goals → PersonalizedInsight → ValueProp → LiveDemo → Notifications
    ↓ (onboarding complete)
PaywallPrimer → TrialTimeline → PlanSelection (→ Drawer if dismiss)
```

---

## 12 修正項目

### 1. Welcome画面: Apple Sign In 削除

| 項目 | 値 |
|------|-----|
| ファイル | `WelcomeStepView.swift` |
| 現状 | Apple Sign In ボタン + 「以前使っていた方はこちら」 |
| 修正 | Apple Sign In セクション全体を削除。復元は Settings から |
| 理由 | S1: Welcome は感情的フック。Sign In は認知負荷を増やしコンバージョンを下げる |

### 2. Welcome画面: 社会的証明フレーズ修正

| 項目 | 値 |
|------|-----|
| ファイル | `en.lproj/Localizable.strings`, `ja.lproj/Localizable.strings` |
| 現状 EN | `⭐ 4.9 · 10,000+ people finding inner peace` |
| 現状 JA | `⭐ 4.9 · 10,000人以上が内なる安らぎを実感` |
| 修正 EN | `⭐ 5.0 on the App Store` |
| 修正 JA | `⭐ App Store 評価 5.0` |
| 理由 | S2: 「Social proof must be verifiable」。10,000人は虚偽。5.0 は事実。シンプルに実績だけ示す |

### 3. PlanSelection画面: 社会的証明フレーズ修正

| 項目 | 値 |
|------|-----|
| ファイル | `en.lproj/Localizable.strings`, `ja.lproj/Localizable.strings` |
| 現状 EN | `⭐ 4.9 · Trusted by 10,000+ users` |
| 現状 JA | `⭐ 4.9 · 10,000人以上が利用中` |
| 修正 EN | `⭐ 5.0 on the App Store · Cancel anytime` |
| 修正 JA | `⭐ App Store 評価 5.0 · いつでも解約OK` |
| 理由 | S2+S5: 虚偽削除 + risk reversal を social proof と組み合わせる（Calm パターン） |

### 4. PlanSelection画面: ペイウォールデザイン改善

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift` |
| 現状 | タイトル + プランカード2つ + 社会的証明1行 + CTA |
| 修正 | 以下の要素を追加（S3+S5 Blinkist/Calm パターン）: |

**修正後のレイアウト（上→下）:**

```
[ヘッドライン] "Unlock your full potential" / "あなたの可能性を解き放とう"
[ベネフィットリスト] 3つの主要ベネフィット（チェックマークアイコン付き）
  ✓ Personalized nudges at key moments / つらい瞬間にパーソナルナッジ
  ✓ AI-guided self-reflection / AI ガイド付き内省セッション
  ✓ Track your progress / 変化の記録・可視化
[プランカード] 年間（BEST VALUE バッジ） + 月間
[社会的証明] ⭐ 5.0 on the App Store · Cancel anytime
[CTA] Start Free Trial / 無料トライアルを始める
[Trust] No commitment. Cancel anytime. / いつでも解約OK。
[Maybe Later] [Restore]
```

| 理由 | S3: 「Benefit-driven headlines convert 2x better than feature lists」。S5: Calm/Headspace は必ず3つのベネフィットを paywall に表示 |

### 5. PlanSelection: 購入フロー修正（無料トライアル押しても何も起こらない）

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift` |
| 現状 | `purchase()` → `Purchases.shared.purchase(package:)` → entitlement チェック → `onPurchaseSuccess` だが、シミュレータでは StoreKit Sandbox が正しく動作しない可能性 |
| 調査 | 1. `result.customerInfo.entitlements` が nil/empty → `onPurchaseSuccess` が呼ばれない 2. `ErrorCode.purchaseCancelledError` で静かに失敗 |
| 修正 | purchase 結果のハンドリングを改善: `userCancelled` フラグチェック + entitlement なしでも transaction 成功なら進む |

```swift
let result = try await Purchases.shared.purchase(package: package)
if !result.userCancelled {
    // 購入成功（entitlementの反映は非同期の場合がある）
    AnalyticsManager.shared.track(.onboardingPaywallPurchased)
    await MainActor.run {
        isPurchasing = false
        onPurchaseSuccess(result.customerInfo)
    }
}
```

| 理由 | RevenueCat SDK: `userCancelled` が false なら transaction 成功。entitlement の同期は遅延する場合がある |

### 6. 日本語: Welcome タイトル

| 項目 | 値 |
|------|-----|
| 現状 | `あなたを縛る\nパターンから\n自由になろう` |
| 修正 | `もう、ひとりで\n抱えなくていい` |
| 理由 | 「縛る」「パターン」「自由」= 直訳的で冷たい。瞑想/ウェルネスアプリのJP版（Calm日本語、Meditopia日本語）は共感・寄り添い表現が主流。「ひとりで抱えなくていい」は即座に感情に刺さる |

### 7. 日本語: Struggles タイトル

| 項目 | 値 |
|------|-----|
| 現状 | `何があなたを止めていますか？` |
| 修正 | `今、何に悩んでいますか？` |
| 理由 | 「何があなたを止めている」= 英語 "What's holding you back?" の直訳。日本語では「悩んでいる」が自然 |

### 8. 日本語: ValueProp のタイトル/内容

| 項目 | 値 |
|------|-----|
| ファイル | `ja.lproj/Localizable.strings` |
| 確認対象 | `onboarding_valueprop_title` = `あなたの7日間の旅` |
| 修正 | `7日間で変わる、あなたの毎日` |
| 他 | day1-7 の「軌道を外さないために」等は ValueProp にはない（GoalsStepView を確認要） |
| 理由 | 「旅」は英語圏では journey で一般的だが、日本語では大げさ。「変わる毎日」の方が具体的で身近 |

### 9. 日本語: TrialTimeline タイトル改行

| 項目 | 値 |
|------|-----|
| 現状 | `無料トライアルのタイムライン` (1行) |
| 修正 | `無料トライアルの\nタイムライン` |
| 理由 | 1行だと詰まって見える。改行で視認性向上 |

### 10. 日本語: ペイウォール全体の文言

| 項目 | 値 |
|------|-----|
| `paywall_primer_title` 現状 | `まずは無料で\nアニッチャを試してください` |
| `paywall_primer_title` 修正 | `まずは無料で\n体験してみてください` |
| `paywall_primer_subtitle` 現状 | `あなた専用プランの準備ができました。リスクなしで全ての旅を体験してください。` |
| `paywall_primer_subtitle` 修正 | `あなた専用のプランができました。7日間、すべての機能を無料でお試しいただけます。` |
| `paywall_plan_title` 現状 | `プランを選択` |
| `paywall_plan_title` 修正 | `あなたの可能性を\n解き放とう` |
| 理由 | 「旅を体験」→ 大げさ。「お試しいただけます」→ 丁寧で自然。「プランを選択」→ 機能的すぎる。ベネフィット見出しに変更 (S3) |

### 11. ローカライズ完全性チェック

| 項目 | 確認 |
|------|------|
| 全オンボーディング画面 | en + ja で String(localized:) を使用 → OK |
| StruggleDepth | 確認要 |
| Goals | 確認要 |
| DrawerOfferView | 確認要 |
| NotificationPermission | 確認要 |

### 12. オンボーディングスキル改善

| 項目 | 値 |
|------|-----|
| ファイル | `.claude/skills/ios-ux-design/references/onboarding.md` |
| 追加セクション 1 | **日本語ローカライズ原則**: 直訳禁止、共感・寄り添い表現、「〜しませんか」より「〜できます」 |
| 追加セクション 2 | **Social Proof ルール**: 検証不可能な数字禁止。App Store レーティング、実測データのみ。虚偽は Apple Review ガイドライン違反リスク |
| 追加セクション 3 | **Paywall デザイン 7要素** (S3+S5): |

```
1. ベネフィット見出し（機能名ではなくユーザー価値）
2. ベネフィットリスト（3項目、チェックマーク付き）
3. プラン選択（2-3プラン、年間にBEST VALUEバッジ）
4. Social Proof（検証可能な数字のみ）
5. CTA（アクション動詞 + "Free Trial"）
6. Risk Reversal（「いつでも解約OK」を2箇所以上）
7. Soft Dismiss（Maybe Later → Drawer 再オファー）
```

---

## 修正後フロー

### EN (English)

| Step | 画面 | ヘッドライン | サブ/内容 |
|------|------|------------|---------|
| 1 | Welcome | Break free from the patterns that hold you back | Anicca reaches out at the moments you struggle most. |
| | | `⭐ 5.0 on the App Store` | |
| | | [Get Started] | _(Apple Sign In 削除)_ |
| 2 | Struggles | What's holding you back? | Select all that apply |
| 3 | StruggleDepth | (深掘り質問) | 選択肢 |
| 4 | Goals | What does your best self look like? | Choose what matters most |
| 5 | PersonalizedInsight | Based on your answers | 81% improved within 30 days → [See Your Plan] |
| 6 | ValueProp | Your 7-Day Journey | Day 1-7 タイムライン |
| 7 | LiveDemo | (デモナッジ体験) | 実際のナッジを体験 |
| 8 | Notifications | (通知許可) | 許可 → ペイウォールへ |
| P1 | PaywallPrimer | We want you to try Anicca for free | 3つの機能リスト → [Continue] |
| P2 | TrialTimeline | Your free trial\ntimeline | Today/Day5/Day7 → [Continue] |
| P3 | PlanSelection | Unlock your full potential | ベネフィット3つ + 年間/月間 + `⭐ 5.0 · Cancel anytime` + [Start Free Trial] |

### JA (日本語)

| Step | 画面 | ヘッドライン | サブ/内容 |
|------|------|------------|---------|
| 1 | Welcome | もう、ひとりで抱えなくていい | 一番つらい瞬間に、アニッチャが寄り添います。 |
| | | `⭐ App Store 評価 5.0` | |
| | | [はじめる] | _(Apple Sign In 削除)_ |
| 2 | Struggles | 今、何に悩んでいますか？ | 当てはまるものを全て選んでください |
| 3 | StruggleDepth | (深掘り質問) | 選択肢 |
| 4 | Goals | 最高の自分は、どんな姿ですか？ | 大切なものを選んでください |
| 5 | PersonalizedInsight | あなたの回答に基づいて | 同じ悩みを持つ81%の人が30日以内に改善 → [あなたのプランを見る] |
| 6 | ValueProp | 7日間で変わる、あなたの毎日 | Day 1-7 タイムライン |
| 7 | LiveDemo | (デモナッジ体験) | 実際のナッジを体験 |
| 8 | Notifications | (通知許可) | 許可 → ペイウォールへ |
| P1 | PaywallPrimer | まずは無料で体験してみてください | あなた専用のプランができました。7日間、すべての機能を無料でお試しいただけます。 → [続ける] |
| P2 | TrialTimeline | 無料トライアルの\nタイムライン | 今日/5日目/7日目 → [続ける] |
| P3 | PlanSelection | あなたの可能性を解き放とう | ベネフィット3つ + 年間/月間 + `⭐ App Store 評価 5.0 · いつでも解約OK` + [無料トライアルを始める] |

---

## PlanSelection ベネフィットリスト（新規追加）

| # | EN | JA |
|---|----|----|
| 1 | Personalized nudges at key moments | つらい瞬間にパーソナルナッジ |
| 2 | AI-guided self-reflection sessions | AIガイド付き内省セッション |
| 3 | Track and visualize your progress | 変化の記録・可視化 |

---

## 実装順序

1. ローカライズ文字列修正（#2, #3, #6, #7, #8, #9, #10）
2. WelcomeStepView: Apple Sign In 削除（#1）
3. PlanSelectionStepView: デザイン改善 + ベネフィットリスト追加（#4）
4. PlanSelectionStepView: 購入フロー修正（#5）
5. ローカライズ完全性チェック（#11）
6. オンボーディングスキル更新（#12）
7. ビルド → シミュレータ確認 → 提出
