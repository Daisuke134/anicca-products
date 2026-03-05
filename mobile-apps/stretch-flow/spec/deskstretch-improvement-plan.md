# DeskStretch 改善計画（統合版）

**Date:** 2026-03-05（v2 — TDD統合 + レビューゲート追加）
**Sources:**
- [Martin Fowler - Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) — 「Write a test → Write code → Refactor」
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — 「Prompt chaining with programmatic gates」
- [HubSpot - Automated Code Review](https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution) — 「Internal agent > external tool」
- [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
- [Quash - TDD Guide for Mobile-App QA](https://quashbugs.com/blog/test-driven-development-tdd-guide)

---

## 1. 現状の問題（コード監査結果 — 21件）

### 🔴 CRITICAL（1件）

| # | 問題 | ファイル | 詳細 |
|---|------|---------|------|
| 1 | **RC API Key ハードコード** | `DeskStretchApp.swift:9` | `appl_OnzEebYgDRvFDkPgGmi...` 直接コード。xcconfig / Info.plist 必須 |

### 🔴 HIGH（12件）

| # | 問題 | カテゴリ | ファイル | 詳細 |
|---|------|---------|---------|------|
| 2 | **URL force-unwrap → クラッシュ** | Security | `SettingsView.swift:66` | `URL(string: "...")!` — nil 時クラッシュ |
| 3 | **URL force-unwrap → クラッシュ** | Security | `PaywallView.swift:84` | Terms リンク同上 |
| 4 | **「AI-personalized」虚偽表示** | UI/UX | `PaywallView.swift:33` | Rule 21 + Apple 虚偽広告違反 |
| 5 | **Offerings ロード失敗 → 永遠スピナー** | UI/UX | `PaywallView.swift:54` | タイムアウト/エラー表示なし |
| 6 | **「Upgrade」ボタン空** | UI/UX | `SettingsView.swift:49-51` | タップしても何も起きない |
| 7 | **ProblemEmpathy Hook 弱い** | UI/UX | `ProblemEmpathyView.swift` | UX_SPEC と不一致 |
| 8 | **通知許可ステップなし** | UI/UX | `OnboardingContainerView.swift` | 3ステップのみ |
| 9 | **無効ボタンの理由非表示** | UI/UX | `PainAreaSelectionView.swift:45` | ヘルパーテキストなし |
| 10 | **intervalMinutes=0 → ゼロ除算** | UI/UX | `TimerView.swift:86` | `totalSeconds = 0` でクラッシュ |
| 11 | **StretchLibraryService 二重初期化** | Code | `TimerView.swift:11-16` | メモリ浪費 + 状態不整合 |
| 12 | **accessibilityIdentifier 不整合** | Accessibility | 複数ファイル | 6箇所で TEST_SPEC と不一致 |
| 13 | **SubscriptionService テスト不可** | Code | `SubscriptionService.swift:5` | Protocol 化なし |

### 📌 MEDIUM（8件）

| # | 問題 | カテゴリ | ファイル | 詳細 |
|---|------|---------|---------|------|
| 14 | **JSON ロード失敗 = サイレント** | UI/UX | `StretchLibraryService.swift:7-11` | エクササイズ 0 件でもエラー表示なし |
| 15 | **ISO8601DateFormatter 毎フレーム生成** | Performance | `ProgressDashboardView.swift:102` | ループ外に移動必須 |
| 16 | **曜日ラベル "T"/"T" 区別不能** | UI/UX | `ProgressDashboardView.swift` | "Tu"/"Th" に変更 |
| 17 | **AppState が God Object** | Code | `AppState.swift` | 全状態 + 全永続化が1ファイル |
| 18 | **メインスレッドタイマー** | Code | `TimerView.swift:86` | バックグラウンドで停止 |
| 19 | **DESIGN_SYSTEM トークン未適用** | UI/UX | 全 View | `.accentColor` のみ使用 |
| 20 | **duration 入力バリデーションなし** | Security | `ProgressService` | 負数/巨大値でクラッシュ |
| 21 | **ローカライズファイル欠落** | i18n | 全 View | `.xcstrings` なし |

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
| 1 | Skill references: 4 → 1 | 4スキル参照 | `mobileapp-builder`（TDD は 006 内蔵） |
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

### 3.4 TDD → 実装フェーズ統合（6件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 14 | TDD を 006 に統合 | 007 で後付け | 006a-d 内で RED → GREEN → REFACTOR |
| 15 | Unit/Integration を実装中に書く | 別フェーズ | 各機能の実装直前に書く |
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

### 3.7 レビューゲート + その他（4件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 31 | code-quality-reviewer を各セッション末尾に追加 | codex-review（外部、遅い） | サブエージェント（内部、速い） |
| 32 | Edge Case → Test mapping | マッピングなし | Edge Case # → Test file + test name |
| 33 | Mock grep 精度 | `grep -r 'Mock'` | `grep -rw 'class Mock'` |
| 34 | セッション分割ドキュメント化 | 未定義フロー | 7 sessions with gates |

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

## 5. フェーズ分割（3 → 7 セッション — TDD 実装統合版）

### 根拠

ソース: [Martin Fowler - TDD](https://martinfowler.com/bliki/TestDrivenDevelopment.html) / 核心の引用: 「Write a test for the next bit of functionality. Write the functional code until the test passes. Refactor.」

ソース: [Anthropic - Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) / 核心の引用: 「Prompt chaining: trade off latency for higher accuracy. Add programmatic checks on intermediate steps.」

ソース: [HubSpot - Automated Code Review](https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution) / 核心の引用: 「Internal agent framework gave operational freedom... reducing cycle time.」

### なぜ 9 → 7 に圧縮したか

```
旧（9 sessions — 間違い）:
  006a-d = 実装のみ（テストなし）
  007a   = Unit Tests（後付け）     ← TDD ではない
  007b   = Integration Tests（後付け）← TDD ではない
  007c   = E2E（Maestro）

新（7 sessions — 正しい）:
  006a-d = TDD 実装（RED→GREEN→REFACTOR 内蔵）
  007    = E2E（Maestro — UI 完成後のみ）
```

### 全体フロー

```
004a: Core Spec
  └→ [REVIEW] code-quality-reviewer
004b: UX Spec
  └→ [REVIEW] code-quality-reviewer
006a: TDD Data Layer
  └→ [REVIEW] code-quality-reviewer
006b: TDD Onboarding + Monetization
  └→ [REVIEW] code-quality-reviewer
006c: TDD Core Screens
  └→ [REVIEW] code-quality-reviewer
006d: TDD Polish + Resources
  └→ [REVIEW] code-quality-reviewer
007:  E2E Maestro + Payment
  └→ [REVIEW] code-quality-reviewer
```

### 7 セッション詳細（汎用名 — アプリ固有名なし）

| Session | 名前（汎用） | 成果物 | Gate | Skill | Review |
|---------|-------------|--------|------|-------|--------|
| **004a** | Core Spec: PRD + Arch + Impl Guide | PRD.md, ARCHITECTURE.md, IMPLEMENTATION_GUIDE.md | fastlane build PASS | `mobileapp-builder` | code-quality-reviewer |
| **004b** | UX Spec: UX + Design + Test + Release | UX_SPEC.md, DESIGN_SYSTEM.md, TEST_SPEC.md, RELEASE_SPEC.md | Spec 整合性確認 | `mobileapp-builder` | code-quality-reviewer |
| **006a** | TDD: Data Layer（Models + Services + Tests） | Models, Services, Unit Tests | fastlane test PASS | `mobileapp-builder` | code-quality-reviewer |
| **006b** | TDD: Onboarding + Monetization（+ Tests） | Onboarding, Paywall, Integration Tests | fastlane test PASS | `mobileapp-builder` | code-quality-reviewer |
| **006c** | TDD: Core Screens（+ Tests） | Main screens, Unit Tests | fastlane test PASS | `mobileapp-builder` | code-quality-reviewer |
| **006d** | TDD: Polish + Accessibility（+ Integration Tests） | Design tokens, a11y IDs, PrivacyInfo, i18n | fastlane test PASS + fastlane build PASS | `mobileapp-builder` | code-quality-reviewer |
| **007** | E2E: Maestro + Payment Verification | Maestro YAML (5 flows) | maestro test maestro/ PASS | `maestro-ui-testing` | code-quality-reviewer |

### 各セッション内の TDD サイクル（006a-d 共通）

```
機能 N を実装:
  1. [RED]      テストを書く → fastlane test → FAIL 確認
  2. [GREEN]    最小コードで通す → fastlane test → PASS 確認
  3. [REFACTOR] クリーンアップ → fastlane test → PASS 維持
  4. 次の機能へ
```

### 各セッションの修正内容

#### 004a: Core Spec

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | PRD に Rule 21（AI 禁止）を明記 | 問題 #4 |
| 2 | ARCHITECTURE に SubscriptionService Protocol 化を設計 | 問題 #13 |
| 3 | ARCHITECTURE に AppState MVVM 分割を設計 | 問題 #17 |
| 4 | IMPLEMENTATION_GUIDE に xcconfig API Key 管理を記載 | 問題 #1 |

#### 004b: UX Spec

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | UX_SPEC: Onboarding Hook を強化 | 問題 #7 |
| 2 | UX_SPEC: Onboarding に通知許可ステップ追加 | 問題 #8 |
| 3 | DESIGN_SYSTEM: トークン定義（色、フォント、スペーシング） | 問題 #19 |
| 4 | TEST_SPEC: accessibilityIdentifier 正規マッピング | 問題 #12 |
| 5 | TEST_SPEC: Edge Case #7 から AI 参照を削除 | TODO #28 |
| 6 | TEST_SPEC: 「AI generation < 3s」→「< 500ms」 | TODO #29 |

#### 006a: TDD Data Layer

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | project.yml に xcconfig 参照（API Key 分離） | 問題 #1 |
| 2 | SubscriptionService を Protocol 化 + Unit Test | 問題 #13 |
| 3 | StretchLibraryService にエラーハンドリング + Unit Test | 問題 #14 |
| 4 | Models に正しい accessibilityIdentifier 属性 | 問題 #12 |
| 5 | ProgressService に入力バリデーション + Unit Test | 問題 #20 |

#### 006b: TDD Onboarding + Monetization

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | AppState を MVVM に分割 + Unit Test | 問題 #17 |
| 2 | Onboarding に通知許可ステップ追加 | 問題 #8 |
| 3 | Onboarding Hook を UX_SPEC 準拠に | 問題 #7 |
| 4 | PaywallView: offerings エラー表示 + Integration Test | 問題 #5 |
| 5 | PaywallView: 「AI-personalized」→ 正直な表現 | 問題 #4 |
| 6 | PaywallView: DESIGN_SYSTEM トークン適用 | 問題 #19 |
| 7 | URL force-unwrap を安全な optional binding に | 問題 #2, #3 |

#### 006c: TDD Core Screens

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | Timer: バックグラウンドタイマー対応 + Unit Test | 問題 #18 |
| 2 | Timer: 設定への導線追加 | — |
| 3 | Timer: ゼロ除算ガード + Unit Test | 問題 #10 |
| 4 | Timer: StretchLibraryService 二重初期化修正 | 問題 #11 |
| 5 | Settings: Upgrade ボタンに PaywallView 遷移 | 問題 #6 |
| 6 | ProgressDashboard: DateFormatter 最適化 | 問題 #15 |
| 7 | ProgressDashboard: 曜日ラベル修正 | 問題 #16 |

#### 006d: TDD Polish + Resources

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | 全 View に DESIGN_SYSTEM トークン適用 | 問題 #19 |
| 2 | 全 accessibilityIdentifier を TEST_SPEC 準拠に修正 | 問題 #12 + マッピング表 |
| 3 | PrivacyInfo.xcprivacy 作成 | 問題 #21 |
| 4 | ローカライズファイル（.xcstrings）作成 | 問題 #21 |
| 5 | PainAreaSelectionView: 無効ボタン理由表示 | 問題 #9 |

#### 007: E2E Maestro + Payment

| # | 修正 | 対応する問題 |
|---|------|-------------|
| 1 | clearState + clearKeychain 全フロー | TODO #21 |
| 2 | extendedWaitUntil 全タップ前 | TODO #22 |
| 3 | takeScreenshot 全フロー末尾 | TODO #23 |
| 4 | id: selectors のみ使用 | TODO #24 |
| 5 | tags: smokeTest, payment, onboarding, timer | TODO #25 |
| 6 | 04-payment-success.yaml（RC Test Store → Simulate Success） | — |
| 7 | 05-payment-failure.yaml（RC Test Store → Simulate Failure） | — |

---

## 6. レビューゲート設計

ソース: [HubSpot Engineering](https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution) / 核心の引用: 「Internal agent framework... reducing cycle time and ensuring high quality feedback as fast as possible.」

ソース: [Qodo - AI Code Review 2026](https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/) / 核心の引用: 「Severity-Driven Review: Every finding gets assigned a severity level.」

### Codex CLI → code-quality-reviewer サブエージェント

| 観点 | Codex CLI（外部 — 廃止） | code-quality-reviewer（内部 — 採用） |
|------|--------------------------|-------------------------------------|
| コンテキスト | 白紙スタート | CLAUDE.md + Serena メモリ参照 |
| レイテンシ | 高（外部プロセス） | **低（同一セッション）** |
| 反復回数 | 多い（コンテキスト不足） | **少ない（プロジェクト知識）** |
| コスト | 高 | **中** |
| Blocking 精度 | 低（汎用） | **高（カスタムルール）** |

### レビュー発動ルール

| 変更規模 | レビュー | ブロッキング |
|---------|---------|-------------|
| 5行以下 | なし（テストのみ） | テスト PASS |
| 5〜50行 | 軽量チェック | テスト PASS |
| 50行〜 / 複数ファイル | **code-quality-reviewer** | CRITICAL=0 |
| 公開 API 変更 | **code-quality-reviewer（必須）** | CRITICAL=0 |
| セキュリティ / 決済コード | **人間レビュー（必須）** | 人間 OK |

---

## 7. サマリー

| US | 旧 | 新 | セッション |
|----|-----|-----|-----------|
| US-004 | 1 session | 2 sessions | 004a, 004b |
| US-006 | 1 session | 4 sessions（TDD 内蔵） | 006a, 006b, 006c, 006d |
| US-007 | 3 sessions | 1 session（E2E のみ） | 007 |
| **Total** | **5** → **9（旧）** | **7（新）** | — |

| 変更 | 理由 |
|------|------|
| TDD を 006 に統合 | TDD = 実装そのもの。分離 = TDD ではない |
| 007 を E2E のみに | Unit/Integration は 006 で完了済み |
| codex-review → code-quality-reviewer | 内部サブエージェントの方が速い・安い・精度高い |
| セッション名を汎用化 | アプリ固有名なし → 全アプリに適用可能 |
