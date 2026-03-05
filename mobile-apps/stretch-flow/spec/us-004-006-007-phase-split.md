# DeskStretch US-004/006/007 — 現状の問題 + フェーズ分割

**Date:** 2026-03-05
**Sources:**
- [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store) — "presents a modal with buttons to simulate a successful purchase, a failed purchase, or cancel"
- [RevenueCat Sandbox Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox) — "Recommended Testing Workflow: Start with Test Store → Platform Sandboxes → Production"
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — "Prompt chaining: trade off latency for higher accuracy by making each LLM call an easier task"
- Maestro UI Testing SKILL.md — "clearState + id: selectors + extendedWaitUntil"
- TDD Workflow SKILL.md — "ALWAYS write tests first"

---

## 1. 現状の問題（コード読了結果）

### 🔴 CRITICAL（アプリが壊れている / App Store リジェクト確定）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 1 | **RC API Key がハードコード** | `DeskStretchApp.swift:9` | `appl_OnzEebYgDRvFDkPgGmi...` が直接コードに。本番キーが公開リポに露出。環境変数 or xcconfig 必須 |
| 2 | **Paywall: Offerings ロード失敗時 UI が壊れる** | `PaywallView.swift:54` | `offerings == nil` 時に `ProgressView()` が永遠にスピン。タイムアウト/エラー表示なし。RC 未設定なら白画面 |
| 3 | **Paywall: 購入テスト未実装** | `PaywallView.swift` | E2E で決済フローが一切テストされていない。購入ボタンが動くか不明。Apple は決済テスト証拠を要求する |
| 4 | **「Upgrade to Premium」ボタンが何もしない** | `SettingsView.swift:49-51` | `Button("Upgrade to Premium") { // Handled via PaywallView }` — 空のアクション。タップしても何も起きない |
| 5 | **「AI-personalized routines」は嘘** | `PaywallView.swift:33` | BenefitRow に「AI-personalized routines」表示。実際は `AIStretchService` = 静的フィルタリングのみ。Rule 21 + Apple 虚偽広告ポリシー違反 |
| 6 | **StretchLibrary.json ロード失敗 = 何も動かない** | `StretchLibraryService.swift:7-11` | `loadFromBundle()` がサイレントに失敗。エクササイズ 0 件でも UI にエラー表示なし。「Stretch Now」タップ → 何も起きない |
| 7 | **accessibilityIdentifier 不整合** | 複数ファイル | TEST_SPEC の `paywall_maybe_later` ≠ 実コードの `paywall_skip`。`timer_stretch_now` ≠ 実コードの `stretch_now`。`timer_countdown` ≠ 実コードの `timer_ring` |

### ⚠️ HIGH（UX 品質問題 — デザインがしょぼい）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 8 | **Paywall がデフォルト感丸出し** | `PaywallView.swift` | RC の `RevenueCatUI` PaywallView を使っていない。自前実装だがチェックマーク + テキストのみ。画像・グラデーション・ソーシャルプルーフなし |
| 9 | **デザインシステム未適用** | 全 View | `DESIGN_SYSTEM.md` に定義したトークン（色、フォント、スペーシング）が一切使われていない。全部 `.accentColor` と `Color(.systemGray6)` |
| 10 | **ProblemEmpathyView が弱い** | `ProblemEmpathyView.swift` | 「Sitting all day?」= 弱い Hook。UX_SPEC.md の「Back pain from sitting all day?」と異なる。ペルソナの痛みに刺さらない |
| 11 | **ProgressDashboardView の WeekHistory** | `ProgressDashboardView.swift:102` | `ISO8601DateFormatter()` を毎フレーム生成。パフォーマンス問題。また日付キーのフォーマットが保存時と不一致の可能性 |
| 12 | **Timer 画面にタイマー設定への導線なし** | `TimerView.swift` | タイマー画面から直接インターバル変更できない。Settings まで行く必要あり |
| 13 | **Onboarding 後に通知許可を求めていない** | `OnboardingContainerView.swift` | 3ステップ（共感 → 痛み選択 → Paywall）のみ。通知許可ステップなし。タイマーアプリなのに通知なしで使わせる |

### 📌 MEDIUM（コード品質）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 14 | **AppState が God Object** | `AppState.swift` | 全状態 + 全永続化ロジックが1ファイル。MVVM でもないし Service 層との責務が不明確 |
| 15 | **Timer が UI スレッドで動作** | `TimerView.swift:86` | `Timer.scheduledTimer` はメインスレッド。バックグラウンド移行時に止まる |
| 16 | **SubscriptionService.shared = テスト不可** | `SubscriptionService.swift:5` | シングルトン + 直接 `Purchases.shared` 呼び出し。Protocol 化されていないのでモック不可 |
| 17 | **Localization: `String(localized:)` は良い** | 全 View | ローカライズ対応は OK。ただし `.strings` / `.xcstrings` ファイルが Resources に見つからない |

---

## 2. 決済 E2E テスト — 自動化の方法

**Source:** [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
**核心の引用:** 「your app will present a modal with metadata about the product being purchased, along with buttons to simulate a successful purchase, a failed purchase, or cancel the purchase entirely. Use these options to manually test how your code responds to different in-app purchase outcomes, or to **write automated integration tests** without interacting with real store flows.」

### RC Test Store の仕組み

```
通常の購入フロー:
  ユーザー → 「Monthly $3.99」タップ → Apple StoreKit ダイアログ → Face ID → 購入完了

RC Test Store フロー（テスト用）:
  ユーザー → 「Monthly $3.99」タップ → RC モーダル表示:
      [✅ Simulate Success]  ← 購入成功をシミュレート
      [❌ Simulate Failure]  ← 購入失敗をシミュレート
      [Cancel]              ← キャンセル
```

### Maestro で E2E 決済テストする方法

```yaml
# maestro/04-payment-success.yaml
appId: com.aniccafactory.deskstretch
tags:
  - payment
  - smokeTest
---
- clearState
- clearKeychain
- launchApp

# Onboarding → Paywall
- extendedWaitUntil:
    visible:
      id: "onboarding_get_started"
    timeout: 30000
- tapOn:
    id: "onboarding_get_started"
- tapOn:
    id: "pain_area_neck"
- tapOn:
    id: "onboarding_continue"

# Paywall: tap Monthly
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 10000
- tapOn:
    id: "paywall_plan_monthly"

# RC Test Store modal → Simulate Success
- extendedWaitUntil:
    visible: "Simulate Success"
    timeout: 10000
- tapOn: "Simulate Success"

# Verify: premium unlocked → main screen shown
- extendedWaitUntil:
    visible:
      id: "timer_ring"
    timeout: 10000
- takeScreenshot: "04-payment-success"
```

```yaml
# maestro/05-payment-failure.yaml
appId: com.aniccafactory.deskstretch
tags:
  - payment
---
- clearState
- clearKeychain
- launchApp

# Navigate to paywall (same as above)
- extendedWaitUntil:
    visible:
      id: "onboarding_get_started"
    timeout: 30000
- tapOn:
    id: "onboarding_get_started"
- tapOn:
    id: "pain_area_neck"
- tapOn:
    id: "onboarding_continue"

# Paywall: tap Monthly
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 10000
- tapOn:
    id: "paywall_plan_monthly"

# RC Test Store modal → Simulate Failure
- extendedWaitUntil:
    visible: "Simulate Failure"
    timeout: 10000
- tapOn: "Simulate Failure"

# Verify: error message shown, still on paywall
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 5000
- takeScreenshot: "05-payment-failure"
```

### 前提条件

| 条件 | 値 |
|------|-----|
| RC SDK バージョン | >= 5.43.0（Test Store 対応） |
| API Key | **Test Store API Key**（Debug ビルドで使用） |
| 本番キー | 環境変数 or xcconfig で切り替え（Release ビルド） |
| RC ダッシュボード | Test Store に products + offerings 登録済み |

---

## 3. フェーズ分割

**Source:** [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) / 核心: 「Prompt chaining: ideal for situations where the task can be easily and cleanly decomposed into fixed subtasks. The main goal is to trade off latency for higher accuracy.」

### 現状の問題: US-004/006/007 が1セッションに詰め込みすぎ

```
現状（失敗パターン）:
US-004 = 7ドキュメント一括生成 → スキル未読み込み → 品質低下
US-006 = 33ファイル一括生成 → コンテキスト溢れ → ボタン壊れ → デザイン雑
US-007 = テスト + E2E → テスト対象が壊れてる → テスト意味なし
```

### 改善版: 各 US を 2-3 サブタスクに分割

```
US-004 Spec Generation（2セッション）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
US-004a: Core Specs
├── PRD.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_GUIDE.md
└── Gate: codex-review ok: true

US-004b: UX + Design + Test + Release Specs
├── UX_SPEC.md（ASCII ワイヤーフレーム全画面）
├── DESIGN_SYSTEM.md（トークン + コンポーネント）
├── TEST_SPEC.md
├── RELEASE_SPEC.md
└── Gate: codex-review ok: true
```

```
US-006 iOS Implementation（4セッション）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
US-006a: Foundation（xcodegen + Models + Services）
├── project.yml
├── Models: PainArea, StretchExercise, UserProgress, BreakSchedule, StretchSession
├── Services: StretchLibraryService, ProgressService, SubscriptionService (Protocol化)
├── StretchLibrary.json
├── Gate: fastlane build PASS

US-006b: Onboarding + Paywall
├── AppState.swift (MVVM リファクタ)
├── OnboardingContainerView (4ステップ: 共感→痛み→通知許可→Paywall)
├── ProblemEmpathyView (UX_SPEC の Hook に合わせる)
├── PainAreaSelectionView
├── PaywallView (DESIGN_SYSTEM 適用 + RC offerings ロード + エラー処理)
├── Gate: fastlane build PASS + Maestro onboarding フロー PASS

US-006c: Main Screens（Timer + Stretch + Progress + Settings）
├── TimerView (背景タイマー対応)
├── StretchSessionView
├── StretchLibraryView + StretchDetailView
├── ProgressDashboardView (パフォーマンス修正)
├── SettingsView (Upgrade ボタン動作)
├── Gate: fastlane build PASS + 全画面遷移確認

US-006d: Polish + AccessibilityID + Resources
├── DESIGN_SYSTEM.md のトークン全適用
├── 全 View に正しい accessibilityIdentifier 設定
├── PrivacyInfo.xcprivacy
├── App Icon 確認
├── ローカライズファイル作成
├── Gate: fastlane build PASS + Maestro 全フロー PASS
```

```
US-007 Testing（3セッション）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
US-007a: Unit Tests（/tdd-workflow）
├── Models: PainArea, UserProgress, BreakSchedule, StretchExercise
├── Services: ProgressService, AIStretchService, NotificationService
├── Gate: fastlane test PASS + coverage 80%+

US-007b: Integration Tests
├── SubscriptionIntegration (RC Test Store)
├── ProgressPersistence (UserDefaults roundtrip)
├── AppState (onboarding flag + pain areas persist)
├── StretchLibrary (bundle load + category coverage)
├── Gate: fastlane test PASS

US-007c: E2E + Payment Tests（Maestro CLI）
├── 01-onboarding.yaml
├── 02-timer-stretch-flow.yaml
├── 03-paywall.yaml
├── 04-payment-success.yaml (RC Test Store → Simulate Success)
├── 05-payment-failure.yaml (RC Test Store → Simulate Failure)
├── Gate: maestro test maestro/ PASS
```

### サマリー

| US | 現状 | 改善 | サブタスク数 |
|----|------|------|-------------|
| US-004 | 1セッション（7ドキュメント一括） | 2セッション | 004a, 004b |
| US-006 | 1セッション（33ファイル一括） | 4セッション | 006a, 006b, 006c, 006d |
| US-007 | 1セッション（Unit+Integration+E2E一括） | 3セッション | 007a, 007b, 007c |
| **合計** | 3セッション | **9セッション** | — |

### なぜ 9 セッションが正しいか

| 根拠 | ソース |
|------|--------|
| 「タスクは固定サブタスクに分解」 | Anthropic: Prompt Chaining |
| 「各ステップに Gate を入れる」 | Anthropic: "add programmatic checks on any intermediate steps" |
| 「50% コンテキスト以内で完了」 | CLAUDE.md ルール 0.8 |
| 「精度 > 速度」 | Anthropic: "trade off latency for higher accuracy" |
| 「US-006 の 33 ファイル一括 = 品質崩壊」 | 今回の実体験（ボタン壊れ、デザイン雑、キー露出） |

---

## 4. accessibilityIdentifier 不整合マッピング

| TEST_SPEC / Maestro の ID | 実コードの ID | ファイル | 修正先 |
|--------------------------|--------------|---------|--------|
| `paywall_maybe_later` | `paywall_skip` | PaywallView.swift:72 | コードを `paywall_maybe_later` に変更 |
| `timer_stretch_now` | `stretch_now` | TimerView.swift:59 | コードを `timer_stretch_now` に変更 |
| `timer_countdown` | `timer_ring` | TimerView.swift:36 | コードを `timer_countdown` に変更 |
| `session_exercise_name` | なし | StretchSessionView.swift:56 | `.accessibilityIdentifier("session_exercise_name")` 追加 |
| `session_skip` | `stretch_skip` | StretchSessionView.swift:80 | コードを `session_skip` に変更 |
| `onboarding_continue` | 存在する | PainAreaSelectionView.swift:47 | OK（一致） |
| `onboarding_get_started` | 存在する | ProblemEmpathyView.swift:31 | OK（一致） |
| `pain_area_neck` | なし | PainAreaCard.swift | `.accessibilityIdentifier("pain_area_\(painArea.rawValue)")` 追加必要 |
