# DeskStretch 改善計画（統合版）

**Date:** 2026-03-05
**Sources:**
- [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
- [RevenueCat Sandbox Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox)
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- Maestro UI Testing SKILL.md
- TDD Workflow SKILL.md

---

## 1. 現状の問題（コード監査結果 — 17件）

### 🔴 CRITICAL（7件 — アプリ壊れ / App Store リジェクト確定）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 1 | **RC API Key ハードコード** | `DeskStretchApp.swift:9` | `appl_OnzEebYgDRvFDkPgGmi...` 直接コード。xcconfig 必須 |
| 2 | **Paywall: Offerings ロード失敗時 UI 壊れ** | `PaywallView.swift:54` | `offerings == nil` → `ProgressView()` 永遠スピン。タイムアウトなし |
| 3 | **Paywall: 購入テスト未実装** | `PaywallView.swift` | E2E 決済フロー未テスト。Apple は決済テスト証拠を要求 |
| 4 | **「Upgrade to Premium」ボタン空** | `SettingsView.swift:49-51` | `Button("Upgrade to Premium") { // Handled via PaywallView }` — 何も起きない |
| 5 | **「AI-personalized routines」虚偽表示** | `PaywallView.swift:33` | 実際は静的フィルタリング。Rule 21 + Apple 虚偽広告違反 |
| 6 | **StretchLibrary.json ロード失敗 = 全機能停止** | `StretchLibraryService.swift:7-11` | サイレント失敗。エクササイズ 0 件でもエラー表示なし |
| 7 | **accessibilityIdentifier 不整合** | 複数ファイル | TEST_SPEC と実コードの ID が不一致（下記マッピング参照） |

### ⚠️ HIGH（6件 — UX 品質問題）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 8 | **Paywall がデフォルト感丸出し** | `PaywallView.swift` | RevenueCatUI 未使用。画像/グラデーション/ソーシャルプルーフなし |
| 9 | **デザインシステム未適用** | 全 View | `DESIGN_SYSTEM.md` トークン未使用。全部 `.accentColor` |
| 10 | **ProblemEmpathyView が弱い** | `ProblemEmpathyView.swift` | 「Sitting all day?」= 弱い Hook。UX_SPEC と異なる |
| 11 | **ProgressDashboard パフォーマンス** | `ProgressDashboardView.swift:102` | `ISO8601DateFormatter()` 毎フレーム生成 |
| 12 | **Timer 画面に設定導線なし** | `TimerView.swift` | インターバル変更は Settings まで行く必要 |
| 13 | **Onboarding 後に通知許可なし** | `OnboardingContainerView.swift` | 3ステップのみ。通知許可ステップなし |

### 📌 MEDIUM（4件 — コード品質）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 14 | **AppState が God Object** | `AppState.swift` | 全状態 + 全永続化ロジックが1ファイル |
| 15 | **Timer が UI スレッドで動作** | `TimerView.swift:86` | `Timer.scheduledTimer` メインスレッド。バックグラウンドで止まる |
| 16 | **SubscriptionService テスト不可** | `SubscriptionService.swift:5` | シングルトン + 直接 `Purchases.shared`。Protocol 化なし |
| 17 | **ローカライズファイル欠落** | 全 View | `String(localized:)` 使用だが `.strings` / `.xcstrings` なし |

---

## 2. accessibilityIdentifier 不整合マッピング

| TEST_SPEC / Maestro ID | 実コード ID | ファイル | 修正 |
|------------------------|------------|---------|------|
| `paywall_maybe_later` | `paywall_skip` | PaywallView.swift:72 | → `paywall_maybe_later` |
| `timer_stretch_now` | `stretch_now` | TimerView.swift:59 | → `timer_stretch_now` |
| `timer_countdown` | `timer_ring` | TimerView.swift:36 | → `timer_countdown` |
| `session_exercise_name` | なし | StretchSessionView.swift:56 | 追加必須 |
| `session_skip` | `stretch_skip` | StretchSessionView.swift:80 | → `session_skip` |
| `pain_area_neck` | なし | PainAreaCard.swift | `pain_area_\(painArea.rawValue)` 追加 |
| `onboarding_continue` | ✅ 一致 | PainAreaSelectionView.swift:47 | OK |
| `onboarding_get_started` | ✅ 一致 | ProblemEmpathyView.swift:31 | OK |

---

## 3. レシピ改善 TODO（34件）

### 3.1 Recipe Structure（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 1 | Skill references: 4 → 2 | 4スキル参照 | `/tdd-workflow` + `maestro-ui-testing` のみ |
| 2 | 変数セクション追加 | `<AppName>`, `$UDID` 未定義 | `APP_SCHEME=DeskStretch`, UDID 自動取得 |
| 3 | 依存チェック（Gate 0）追加 | チェックなし | `find` でソースファイル存在確認 |

### 3.2 Build Tools → Fastlane（7件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 4 | Quality Gate build | `xcodebuild -scheme` | `xcodegen generate && fastlane build` |
| 5 | Step 2 test | `xcodebuild test` | `fastlane test` |
| 6 | Step 5 all-test | `xcodebuild test` + `maestro test flows/` | `fastlane test` + `maestro test maestro/` |
| 7 | xcodegen generate 追加 | 未記載 | Quality Gate 最初に追加 |
| 8 | Fastfile テンプレート追加 | なし | `test`, `build`, `build_for_simulator` lanes |
| 9 | env vars 追加 | `FASTLANE_OPT_OUT_CRASH_REPORTING` 欠落 | 全 Fastlane コマンドに追加 |
| 10 | TestTarget Info.plist | 未記載 | `GENERATE_INFOPLIST_FILE: YES` |

### 3.3 StoreKit → RC Test Store（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 11 | StoreKit Configuration 削除 | Step 3: Products.storekit | 完全削除。RC Test Store で代替 |
| 12 | RC Test Store 手順追加 | なし | Test Store API Key + 切り替え手順 |
| 13 | AC から Products.storekit 削除 | 存在チェック | 「RC Test Store purchase flow verified」 |

### 3.4 TDD Workflow（6件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 14 | `/tdd-workflow` スキル参照 | TDD 未記載 | RED → GREEN → REFACTOR 明記 |
| 15 | Step 2 を 2a + 2b に分割 | Unit + Integration 混合 | 2a: Unit (7 files), 2b: Integration (5 files) |
| 16 | 実行順序指定 | 順序なし | Models → Services → Integration |
| 17 | Swift Testing framework | 未記載 | `@Test`, `#expect`, `@Suite` 使用 |
| 18 | Parameterized tests | 未記載 | `@Test(arguments:)` で enum 反復 |
| 19 | Coverage check 追加 | カバレッジ要件なし | `fastlane test` + 80%+ 目標 |

### 3.5 Maestro E2E（8件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 20 | ディレクトリ名 | `flows/` | `maestro/` |
| 21 | clearState + clearKeychain | なし | 全フロー先頭に追加 |
| 22 | extendedWaitUntil | なし（即タップ） | 30000ms（起動）, 10000ms（画面遷移） |
| 23 | takeScreenshot | なし | 各フロー末尾に追加 |
| 24 | id: selectors only | text/id 混在 | `id:` 主、`text:` はシステムダイアログのみ |
| 25 | tags 追加 | なし | `smokeTest`, `onboarding`, `timer`, `paywall` |
| 26 | Maestro 実行方法 | `maestro test flows/` | `maestro test maestro/`（CLI） |
| 27 | CI timeout ガイダンス | なし | 30000ms タイムアウト推奨 |

### 3.6 Rule 21 修正（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 28 | Edge Case #7 | Foundation Models fallback | 削除。AI なし（Rule 21） |
| 29 | Performance: AI generation | `< 3s` | `< 500ms`（静的フィルタリング） |
| 30 | AIStretchService テスト名 | `testFallback*` | `testGenerate*` |

### 3.7 AC 拡張 + その他（4件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 31 | AC 5 → 10 項目に拡張 | 5 items | TDD cycle, 80%+ coverage, id: selectors 等追加 |
| 32 | Edge Case → Test mapping | マッピングなし | Edge Case # → Test file + test name |
| 33 | Mock grep 精度 | `grep -r 'Mock'` | `grep -rw 'class Mock'` |
| 34 | セッション分割ドキュメント化 | 未定義フロー | 3 separate sessions with gates |

---

## 4. 決済 E2E テスト — RC Test Store + Maestro

### RC Test Store の仕組み

```
通常の購入フロー:
  ユーザー → 「Monthly $3.99」タップ → Apple StoreKit ダイアログ → Face ID → 購入完了

RC Test Store フロー（テスト用）:
  ユーザー → 「Monthly $3.99」タップ → RC モーダル表示:
      [Simulate Success]  ← 購入成功シミュレート
      [Simulate Failure]  ← 購入失敗シミュレート
      [Cancel]            ← キャンセル
```

### 前提条件

| 条件 | 値 |
|------|-----|
| RC SDK | >= 5.43.0 |
| API Key | Test Store API Key（Debug）/ Platform Key（Release） |
| RC Dashboard | Test Store に products + offerings 登録済み |

### Maestro 決済成功テスト

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
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 10000
- tapOn:
    id: "paywall_plan_monthly"
- extendedWaitUntil:
    visible: "Simulate Success"
    timeout: 10000
- tapOn: "Simulate Success"
- extendedWaitUntil:
    visible:
      id: "timer_ring"
    timeout: 10000
- takeScreenshot: "04-payment-success"
```

### Maestro 決済失敗テスト

```yaml
# maestro/05-payment-failure.yaml
appId: com.aniccafactory.deskstretch
tags:
  - payment
---
- clearState
- clearKeychain
- launchApp
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
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 10000
- tapOn:
    id: "paywall_plan_monthly"
- extendedWaitUntil:
    visible: "Simulate Failure"
    timeout: 10000
- tapOn: "Simulate Failure"
- extendedWaitUntil:
    visible:
      id: "paywall_plan_monthly"
    timeout: 5000
- takeScreenshot: "05-payment-failure"
```

---

## 5. フェーズ分割（3 → 9 セッション）

**根拠:** [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) / 核心の引用: 「Prompt chaining: ideal for situations where the task can be easily and cleanly decomposed into fixed subtasks. The main goal is to trade off latency for higher accuracy.」

### 現状の問題

```
US-004 = 7ドキュメント一括 → スキル未読み込み → 品質低下
US-006 = 33ファイル一括 → コンテキスト溢れ → ボタン壊れ → デザイン雑
US-007 = Unit+Integration+E2E一括 → テスト対象が壊れてる → テスト意味なし
```

### 9 セッション詳細

#### US-004 Spec Generation（2セッション）

| Session | 名前 | 成果物 | Gate | Skill |
|---------|------|--------|------|-------|
| **004a** | Core Specs | PRD.md, ARCHITECTURE.md, IMPLEMENTATION_GUIDE.md | codex-review ok: true | `mobileapp-builder` |
| **004b** | UX + Design + Test + Release | UX_SPEC.md, DESIGN_SYSTEM.md, TEST_SPEC.md, RELEASE_SPEC.md | codex-review ok: true | `mobileapp-builder` |

#### US-006 iOS Implementation（4セッション）

| Session | 名前 | 成果物 | Gate | Skill |
|---------|------|--------|------|-------|
| **006a** | Foundation | project.yml, Models, Services, StretchLibrary.json | fastlane build PASS | `mobileapp-builder` |
| **006b** | Onboarding + Paywall | AppState (MVVM), Onboarding (4 steps), PaywallView, ProblemEmpathyView | fastlane build PASS + Maestro onboarding PASS | `mobileapp-builder` |
| **006c** | Main Screens | TimerView, StretchSessionView, StretchLibraryView, ProgressDashboardView, SettingsView | fastlane build PASS + 全画面遷移確認 | `mobileapp-builder` |
| **006d** | Polish + Resources | DESIGN_SYSTEM トークン適用, accessibilityIdentifier 全修正, PrivacyInfo, App Icon, ローカライズ | fastlane build PASS + Maestro 全フロー PASS | `mobileapp-builder` |

#### US-007 Testing（3セッション）

| Session | 名前 | 成果物 | Gate | Skill |
|---------|------|--------|------|-------|
| **007a** | Unit Tests (TDD) | Models: PainArea, UserProgress, BreakSchedule, StretchExercise / Services: ProgressService, AIStretchService, NotificationService | fastlane test PASS + 80%+ coverage | `tdd-workflow` |
| **007b** | Integration Tests | SubscriptionIntegration (RC Test Store), ProgressPersistence, AppState, StretchLibrary | fastlane test PASS | `tdd-workflow` |
| **007c** | E2E + Payment Tests | 01-onboarding.yaml, 02-timer-stretch-flow.yaml, 03-paywall.yaml, 04-payment-success.yaml, 05-payment-failure.yaml | maestro test maestro/ PASS | `maestro-ui-testing` |

### 各セッションの修正内容

#### US-004a: Core Specs

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | PRD に Rule 21（AI 禁止）を明記 | 問題 #5 |
| 2 | ARCHITECTURE に SubscriptionService Protocol 化を設計 | 問題 #16 |
| 3 | ARCHITECTURE に AppState MVVM 分割を設計 | 問題 #14 |
| 4 | IMPLEMENTATION_GUIDE に xcconfig API Key 管理を記載 | 問題 #1 |

#### US-004b: UX + Design + Test + Release

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | UX_SPEC: ProblemEmpathyView の Hook を強化 | 問題 #10 |
| 2 | UX_SPEC: Onboarding に通知許可ステップ追加 | 問題 #13 |
| 3 | DESIGN_SYSTEM: トークン定義（色、フォント、スペーシング） | 問題 #9 |
| 4 | TEST_SPEC: accessibilityIdentifier 正規マッピング | 問題 #7 |
| 5 | TEST_SPEC: Edge Case #7 から AI 参照を削除 | TODO #28 |
| 6 | TEST_SPEC: 「AI generation < 3s」→「< 500ms」 | TODO #29 |

#### US-006a: Foundation

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | project.yml に xcconfig 参照（API Key 分離） | 問題 #1 |
| 2 | SubscriptionService を Protocol 化 | 問題 #16 |
| 3 | StretchLibraryService にエラーハンドリング追加 | 問題 #6 |
| 4 | Models に正しい accessibilityIdentifier 属性 | 問題 #7 |

#### US-006b: Onboarding + Paywall

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | AppState を MVVM に分割 | 問題 #14 |
| 2 | OnboardingContainerView に通知許可ステップ追加 | 問題 #13 |
| 3 | ProblemEmpathyView の Hook を UX_SPEC 準拠に | 問題 #10 |
| 4 | PaywallView: offerings ロード失敗時エラー表示 | 問題 #2 |
| 5 | PaywallView: 「AI-personalized」→ 正直な表現 | 問題 #5 |
| 6 | PaywallView: DESIGN_SYSTEM トークン適用 | 問題 #8, #9 |

#### US-006c: Main Screens

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | TimerView: バックグラウンドタイマー対応 | 問題 #15 |
| 2 | TimerView: 設定への導線追加 | 問題 #12 |
| 3 | SettingsView: Upgrade ボタンに PaywallView 遷移 | 問題 #4 |
| 4 | ProgressDashboardView: DateFormatter 最適化 | 問題 #11 |

#### US-006d: Polish + Resources

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | 全 View に DESIGN_SYSTEM トークン適用 | 問題 #9 |
| 2 | 全 accessibilityIdentifier を TEST_SPEC 準拠に修正 | 問題 #7 + マッピング表 |
| 3 | PrivacyInfo.xcprivacy 作成 | 問題 #17 |
| 4 | ローカライズファイル（.xcstrings）作成 | 問題 #17 |

#### US-007a: Unit Tests

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | Swift Testing framework 使用 | TODO #17 |
| 2 | `@Test(arguments:)` で PainArea.allCases 等 | TODO #18 |
| 3 | テスト名: `testGenerate*`（`testFallback*` 禁止） | TODO #30 |
| 4 | 実行順序: Models → Services | TODO #16 |
| 5 | Coverage 80%+ チェック | TODO #19 |

#### US-007b: Integration Tests

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | RC Test Store で SubscriptionIntegration テスト | TODO #11, #12 |
| 2 | UserDefaults roundtrip テスト | 問題 #14 関連 |
| 3 | StretchLibrary bundle ロード + カテゴリ検証 | 問題 #6 関連 |
| 4 | Mock は Production コードに含めない | TODO #33 |

#### US-007c: E2E + Payment Tests

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | clearState + clearKeychain 全フロー | TODO #21 |
| 2 | extendedWaitUntil 全タップ前 | TODO #22 |
| 3 | takeScreenshot 全フロー末尾 | TODO #23 |
| 4 | id: selectors のみ使用 | TODO #24 |
| 5 | tags: smokeTest, payment, onboarding, timer | TODO #25 |
| 6 | 04-payment-success.yaml（RC Test Store → Simulate Success） | 問題 #3 |
| 7 | 05-payment-failure.yaml（RC Test Store → Simulate Failure） | 問題 #3 |

---

## 6. サマリー

| US | 現状 | 改善 | サブタスク |
|----|------|------|-----------|
| US-004 | 1 session（7 docs 一括） | 2 sessions | 004a, 004b |
| US-006 | 1 session（33 files 一括） | 4 sessions | 006a, 006b, 006c, 006d |
| US-007 | 1 session（全テスト一括） | 3 sessions | 007a, 007b, 007c |
| **Total** | **3 sessions** | **9 sessions** | — |

| Session | Skill（1つのみ） | 理由 |
|---------|-----------------|------|
| 004a | `mobileapp-builder` | Spec 生成レシピ |
| 004b | `mobileapp-builder` | Spec 生成レシピ |
| 006a | `mobileapp-builder` | iOS 実装レシピ |
| 006b | `mobileapp-builder` | iOS 実装レシピ |
| 006c | `mobileapp-builder` | iOS 実装レシピ |
| 006d | `mobileapp-builder` | iOS 実装レシピ |
| 007a | `tdd-workflow` | TDD: RED → GREEN → REFACTOR |
| 007b | `tdd-workflow` | TDD: Integration テスト |
| 007c | `maestro-ui-testing` | Maestro E2E + 決済テスト |
