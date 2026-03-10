# Onboarding v2.1 — 12項目修正プラン

## Context

Onboarding v2 をシミュレータで確認した結果、12個の問題を発見。虚偽の社会的証明、不自然な日本語、壊れた購入フロー、不足するペイウォールデザイン要素を修正し、App Store 提出可能な状態にする。

**ブランチ:** release/1.7.0（今回のみ例外。今後は dev → worktree → dev → main → release）
**スペック:** `aniccaios/.cursor/plans/onboarding-v2-fixes-spec.md`

## 実装順序

### Step 1: ローカライズ文字列修正（#2, #3, #6, #7, #8, #9, #10）

| ファイル | 変更 |
|---------|------|
| `Resources/en.lproj/Localizable.strings` | social proof 2箇所、paywall_plan_title |
| `Resources/ja.lproj/Localizable.strings` | welcome title, struggles title, valueprop title, timeline改行, primer title/subtitle, plan title/social_proof |

### Step 2: WelcomeStepView — Apple Sign In 削除（#1）

| ファイル | 変更 |
|---------|------|
| `Onboarding/WelcomeStepView.swift` | Apple Sign In セクション全体削除（lines 56-95付近） |

### Step 3: PlanSelectionStepView — デザイン改善（#4）

| ファイル | 変更 |
|---------|------|
| `Onboarding/PlanSelectionStepView.swift` | ベネフィット見出し + 3項目チェックリスト追加 |
| `Resources/en.lproj/Localizable.strings` | 新キー: paywall_benefit_1/2/3 |
| `Resources/ja.lproj/Localizable.strings` | 新キー: paywall_benefit_1/2/3 |

### Step 4: PlanSelectionStepView — 購入フロー修正（#5）

| ファイル | 変更 |
|---------|------|
| `Onboarding/PlanSelectionStepView.swift` | `result.userCancelled` チェックに変更 |

### Step 5: ローカライズ完全性チェック（#11）

全オンボーディング画面で en + ja の String(localized:) キーが揃っているか確認。

### Step 6: オンボーディングスキル更新（#12）

| ファイル | 変更 |
|---------|------|
| `.claude/skills/ios-ux-design/references/onboarding.md` | 3セクション追加: JP Localization Rules, Social Proof Rules, Paywall Design 7 Elements |

### Step 7: ビルド → シミュレータ確認 → 提出

1. `cd aniccaios && fastlane build`
2. シミュレータにインストール → 動作確認
3. `fastlane upload` → App Store Connect
4. 提出 → WAITING_FOR_REVIEW

## 検証

1. シミュレータでオンボーディング全画面を EN/JA 両方確認
2. Apple Sign In が Welcome から消えていること
3. 社会的証明が "5.0" に変更されていること
4. PlanSelection にベネフィットリストが表示されること
5. Free Trial ボタンが動作すること（Sandbox環境）
6. 日本語が自然であること
