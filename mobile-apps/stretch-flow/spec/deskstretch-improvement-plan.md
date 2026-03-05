# DeskStretch 改善計画（統合版）

**Date:** 2026-03-05（v4 — SDD/TDD フロー確定 + 1スキル/フェーズ + 9セッション）
**Sources:**
- [Martin Fowler - Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) — 「Write a test → Write code → Refactor」
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — 「Prompt chaining with programmatic gates」
- [HubSpot - Automated Code Review](https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution) — 「Internal agent > external tool」
- [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
- [Quash - TDD Guide for Mobile-App QA](https://quashbugs.com/blog/test-driven-development-tdd-guide)
- [Martin Fowler - RefinementCodeReview](https://martinfowler.com/bliki/RefinementCodeReview.html) — 「code reviews = an explicit step in workflow」
- [Anthropic Skills Guide](https://www.anthropic.com/engineering/claude-code-best-practices) — 「Keep SKILL.md focused on core instructions」
- [Mau - Prayer Lock $25k/month](mau.md) — オンボーディング8ルール

---

## 全体フロー（Phase A → B → C → D → E）

```
Phase A: SDD Spec（修正仕様書を書く — 3セッション）
    ↓
Phase B: TDD Fix（仕様に従って修正する — 6セッション）
    ↓
Phase C: レシピ更新（学びを references/us-*.md + validate.sh + SKILL.md に反映）
    ↓
Phase D: 新アプリで検証（US-001〜009 フル実行）
    ↓
Phase E: Cron テスト（15:00 JST 自動実行）
```

### スキル割り当て（1フェーズ = 1スキルのみ）

| フェーズ | スキル | 根拠 |
|---------|--------|------|
| 004a (Core Spec) | `implementation-spec` | マスターオーケストレーター |
| 004b (UX Spec) | `frontend-design` | デザイン思考 + 美学 |
| 006a-d (TDD実装) | `ios-ux-design` | iOS HIG 準拠 |
| 006-R (レビュー) | code-quality-reviewer | 内部サブエージェント |
| 007 (E2E) | `maestro-ui-testing` | Maestro 専門 |
| 008 (Release) | `asc-release-flow` | ASC リリースワークフロー |
| 009 (Submit) | `asc-submission-health` | 提出前コンプライアンス |

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

## 2. 正規 accessibilityIdentifier 辞書（全ID）

### 全 a11y ID 一覧（Maestro YAML + コード共通）

| ID | ファイル | 現状 | 修正 |
|----|---------|------|------|
| `onboarding_get_started` | ProblemEmpathyView.swift:31 | ✅ 一致 | — |
| `onboarding_continue` | PainAreaSelectionView.swift:47 | ✅ 一致 | — |
| `pain_area_neck` | PainAreaCard.swift | ❌ なし | `pain_area_\(painArea.rawValue)` 追加 |
| `pain_area_shoulders` | PainAreaCard.swift | ❌ なし | 同上 |
| `pain_area_back` | PainAreaCard.swift | ❌ なし | 同上 |
| `pain_area_wrists` | PainAreaCard.swift | ❌ なし | 同上 |
| `paywall_plan_monthly` | PaywallView.swift | ✅ 一致 | — |
| `paywall_plan_yearly` | PaywallView.swift | ✅ 一致 | — |
| `paywall_maybe_later` | PaywallView.swift:72 | ❌ `paywall_skip` | → `paywall_maybe_later` |
| `timer_stretch_now` | TimerView.swift:59 | ❌ `stretch_now` | → `timer_stretch_now` |
| `timer_countdown` | TimerView.swift:36 | ❌ `timer_ring` | → `timer_countdown` |
| `session_exercise_name` | StretchSessionView.swift:56 | ❌ なし | 追加必須 |
| `session_skip` | StretchSessionView.swift:80 | ❌ `stretch_skip` | → `session_skip` |
| `settings_upgrade` | SettingsView.swift:49 | ✅ 一致 | — |
| `progress_dashboard` | ProgressDashboardView.swift | ✅ 一致 | — |

### 辞書 ↔ Maestro YAML 双方向突合検証

```bash
# 検証コマンド（差分0=PASS、不足/余剰の両方を検出）
# 正規辞書: 上記テーブルの全ID（アルファベット順）
DICT=$(cat <<'IDS'
onboarding_continue
onboarding_get_started
pain_area_back
pain_area_neck
pain_area_shoulders
pain_area_wrists
paywall_maybe_later
paywall_plan_monthly
paywall_plan_yearly
progress_dashboard
session_exercise_name
session_skip
settings_upgrade
timer_countdown
timer_stretch_now
IDS
)
# maestro/*.yaml から全 id: を抽出
YAML_IDS=$(grep 'id:' maestro/*.yaml | sed 's/.*id: *"\(.*\)".*/\1/' | sort -u)
# 双方向比較（不足 = 辞書にあるがYAMLにない、余剰 = YAMLにあるが辞書にない）
diff <(echo "$YAML_IDS") <(echo "$DICT") && echo "PASS" || echo "FAIL: 上記の差分を修正せよ"
```

**注:** `maestro/*.yaml` は Phase B 007 で作成予定。作成後に本コマンドで突合する。

---

## 3. Phase A: SDD Spec（3セッション）

### 004a: Core Spec

**Skill:** `implementation-spec`

| # | 成果物 | 修正する問題 | 内容 |
|---|--------|-------------|------|
| 1 | PRD.md（修正版） | #4 | Rule 21（AI 禁止）を明記 |
| 2 | ARCHITECTURE.md | #13 | SubscriptionService Protocol 化を設計 |
| 3 | ARCHITECTURE.md | #17 | AppState → MVVM 分割を設計 |
| 4 | IMPLEMENTATION_GUIDE.md | #1 | xcconfig で API Key 管理 |

**Gate:** fastlane build PASS

### 004b: UX Spec

**Skill:** `frontend-design`

| # | 成果物 | 修正する問題 | 内容 |
|---|--------|-------------|------|
| 1 | UX_SPEC.md | #7 | Onboarding Hook 強化（mau.md 3幕構成） |
| 2 | UX_SPEC.md | #8 | 通知許可ステップ追加 |
| 3 | UX_SPEC.md | #9 | 無効ボタン理由表示 |
| 4 | DESIGN_SYSTEM.md | #19 | トークン定義（色、フォント、スペーシング） |
| 5 | TEST_SPEC.md | #12 | accessibilityIdentifier 正規マッピング |
| 6 | TEST_SPEC.md | TODO #28,#29 | AI 参照削除 + 性能基準修正 |
| 7 | RELEASE_SPEC.md | — | リリース設定 |

**Gate:** Spec 整合性確認

### 004-R: REVIEW（004a + 004b 両方）

**Tool:** code-quality-reviewer サブエージェント

**Gate:** CRITICAL=0

---

## 4. Phase B: TDD Fix（6セッション）

### TDD サイクル（006a-d 共通）

```
機能 N を実装:
  1. [RED]      テストを書く → fastlane test → FAIL 確認
  2. [GREEN]    最小コードで通す → fastlane test → PASS 確認
  3. [REFACTOR] クリーンアップ → fastlane test → PASS 維持
  4. 次の機能へ
```

### 006a: TDD Data Layer

**Skill:** `ios-ux-design`

| # | 修正内容 | 問題# | テスト |
|---|---------|-------|--------|
| 1 | xcconfig で API Key 分離 | #1 | Unit: config から読み込み確認 |
| 2 | SubscriptionService Protocol 化 | #13 | Unit: Mock で購入フロー |
| 3 | StretchLibraryService エラーハンドリング | #14 | Unit: JSON 失敗時の挙動 |
| 4 | Models に正しい accessibilityIdentifier | #12 | Unit: ID 存在確認 |
| 5 | ProgressService 入力バリデーション | #20 | Unit: 負数/巨大値ガード |

**Gate:** fastlane test PASS

### 006b: TDD Onboarding + Monetization

**Skill:** `ios-ux-design`

| # | 修正内容 | 問題# | テスト |
|---|---------|-------|--------|
| 1 | AppState → MVVM 分割 | #17 | Unit: ViewModel 状態遷移 |
| 2 | Onboarding 通知許可ステップ追加 | #8 | Unit: フロー遷移 |
| 3 | Onboarding Hook を UX_SPEC 準拠に | #7 | Unit: Hook テキスト |
| 4 | PaywallView: offerings エラー表示 | #5 | Integration: offerings 読み込み |
| 5 | PaywallView: 「AI-personalized」削除 | #4 | Unit: テキスト確認 |
| 6 | PaywallView: DESIGN_SYSTEM トークン適用 | #19 | Unit: トークン使用 |
| 7 | URL force-unwrap → optional binding | #2, #3 | Unit: nil URL ハンドリング |

**Gate:** fastlane test PASS

### 006c: TDD Core Screens

**Skill:** `ios-ux-design`

| # | 修正内容 | 問題# | テスト |
|---|---------|-------|--------|
| 1 | Timer: バックグラウンドタイマー対応 | #18 | Unit: バックグラウンド復帰 |
| 2 | Timer: ゼロ除算ガード | #10 | Unit: intervalMinutes=0 |
| 3 | Timer: StretchLibraryService 二重初期化修正 | #11 | Unit: singleton 確認 |
| 4 | Settings: Upgrade → PaywallView 遷移 | #6 | Unit: 遷移確認 |
| 5 | ProgressDashboard: DateFormatter 最適化 | #15 | Unit: 性能 |
| 6 | ProgressDashboard: 曜日ラベル "Tu"/"Th" | #16 | Unit: 表示確認 |

**Gate:** fastlane test PASS

### 006d: TDD Polish + Resources

**Skill:** `ios-ux-design`

| # | 修正内容 | 問題# | テスト |
|---|---------|-------|--------|
| 1 | 全 View に DESIGN_SYSTEM トークン適用 | #19 | Integration: トークン一貫性 |
| 2 | 全 a11y ID を TEST_SPEC 準拠に修正 | #12 | Integration: ID 存在確認 |
| 3 | PrivacyInfo.xcprivacy 作成 | #21 | Integration: ファイル存在 |
| 4 | ローカライズファイル（.xcstrings）作成 | #21 | Integration: ファイル存在 |
| 5 | PainAreaSelectionView: 無効ボタン理由表示 | #9 | Unit: ヘルパーテキスト |

**Gate:** fastlane test PASS + fastlane build PASS

### 006-R: REVIEW

**Tool:** code-quality-reviewer サブエージェント（006a-d 全体を対象）

**Gate:** CRITICAL=0

### 007: E2E Maestro + Payment

**Skill:** `maestro-ui-testing`

| # | フロー | 内容 |
|---|--------|------|
| 1 | 01-onboarding.yaml | 全オンボーディングフロー |
| 2 | 02-timer.yaml | タイマー起動→ストレッチ |
| 3 | 03-settings.yaml | 設定画面遷移 |
| 4 | 04-payment-success.yaml | RC Test Store → Simulate Success |
| 5 | 05-payment-failure.yaml | RC Test Store → Simulate Failure |

**Gate:** maestro test maestro/ PASS

---

## 5. 決済 E2E テスト — RC Test Store + Maestro

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
      id: "timer_countdown"
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

## 6. Phase C: レシピ更新（学びの反映 — 34件 + α）

### 更新対象ファイル

| # | ファイル | 更新内容 | 件数 |
|---|---------|---------|------|
| 1 | `references/us-004-specs.md` | フェーズ分割（004a/004b/004-R）、mau.md ルール、スキル: `implementation-spec` → `frontend-design` | 5件 |
| 2 | `references/us-006-implement.md` | TDD 統合、006a-d 分割、Fastlane 必須化、スキル: `ios-ux-design` のみ | 8件 |
| 3 | `references/us-007-testing.md` | E2E のみ（Unit/Integration は 006 完了）、Maestro BP、RC Test Store | 11件 |
| 4 | `references/us-005b-monetization.md` | StoreKit Configuration 削除、RC Test Store 手順追加 | 3件 |
| 5 | `validate.sh` | 新フェーズ構成に合わせたゲート更新 | 全面 |
| 6 | `SKILL.md` | スキル割り当てテーブル更新、Rule 21 強化 | 3件 |
| 7 | `CLAUDE.md` | セッション分割の反映 | 2件 |
| 8 | `prd.json` | US-004/006/007 の分割反映 | 構造変更 |
| 9 | `references/best-practices-audit.md` | DeskStretch 修正で発見した新パターン | 追記 |

### レシピ改善 TODO 詳細（34件）

#### Recipe Structure（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 1 | Skill references: 複数 → 1/phase | 4スキル参照 | 1フェーズ1スキル |
| 2 | 変数セクション追加 | `<AppName>`, `$UDID` 未定義 | `APP_SCHEME=DeskStretch`, UDID 自動取得 |
| 3 | 依存チェック（Gate 0）追加 | チェックなし | `find` でソースファイル存在確認 |

#### Build Tools → Fastlane（7件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 4 | Quality Gate build | `xcodebuild -scheme` | `xcodegen generate && fastlane build` |
| 5 | Step 2 test | `xcodebuild test` | `fastlane test` |
| 6 | Step 5 all-test | `xcodebuild test` + `maestro test flows/` | `fastlane test` + `maestro test maestro/` |
| 7 | xcodegen generate 追加 | 未記載 | Quality Gate 最初に追加 |
| 8 | Fastfile テンプレート追加 | なし | `test`, `build`, `build_for_simulator` lanes |
| 9 | env vars 追加 | `FASTLANE_OPT_OUT_CRASH_REPORTING` 欠落 | 全 Fastlane コマンドに追加 |
| 10 | TestTarget Info.plist | 未記載 | `GENERATE_INFOPLIST_FILE: YES` |

#### StoreKit → RC Test Store（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 11 | StoreKit Configuration 削除 | Step 3: Products.storekit | 完全削除。RC Test Store で代替 |
| 12 | RC Test Store 手順追加 | なし | Test Store API Key + 切り替え手順 |
| 13 | AC から Products.storekit 削除 | 存在チェック | 「RC Test Store purchase flow verified」 |

#### TDD → 実装フェーズ統合（6件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 14 | TDD を 006 に統合 | 007 で後付け | 006a-d 内で RED → GREEN → REFACTOR |
| 15 | Unit/Integration を実装中に書く | 別フェーズ | 各機能の実装直前に書く |
| 16 | 実行順序指定 | 順序なし | Models → Services → Integration |
| 17 | Swift Testing framework | 未記載 | `@Test`, `#expect`, `@Suite` 使用 |
| 18 | Parameterized tests | 未記載 | `@Test(arguments:)` で enum 反復 |
| 19 | Coverage check 追加 | カバレッジ要件なし | `fastlane test` + 80%+ 目標 |

#### Maestro E2E（8件）

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

#### Rule 21 修正（3件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 28 | Edge Case #7 | Foundation Models fallback | 削除。AI なし（Rule 21） |
| 29 | Performance: AI generation | `< 3s` | `< 500ms`（静的フィルタリング） |
| 30 | AIStretchService テスト名 | `testFallback*` | `testGenerate*` |

#### レビューゲート + その他（4件）

| # | TODO | 現状 | 修正後 |
|---|------|------|--------|
| 31 | code-quality-reviewer を独立フェーズに | codex-review（外部） | サブエージェント（内部）、004-R + 006-R |
| 32 | Edge Case → Test mapping | マッピングなし | Edge Case # → Test file + test name |
| 33 | Mock grep 精度 | `grep -r 'Mock'` | `grep -rw 'class Mock'` |
| 34 | セッション分割ドキュメント化 | 未定義フロー | 9 sessions with gates |

### トレーサビリティ・マトリックス（TODO #1-34 → 完了判定）

**検証ルール:** 各コマンドは `0=PASS, 非0=FAIL`。`&&` で複合条件を連結。

| # | 対象ファイル | 完了条件 | 検証コマンド（0=PASS, 非0=FAIL） |
|---|-------------|---------|-------------------------------|
| 1 | `SKILL.md` | 各フェーズに1スキルのみ参照 | `rg -q 'Skill:' SKILL.md` |
| 2 | `references/us-006-implement.md` | `APP_SCHEME`, `UDID` 変数定義あり | `rg -q 'APP_SCHEME' references/us-006-implement.md && rg -q 'UDID' references/us-006-implement.md` |
| 3 | `validate.sh` | Gate 0 でソースファイル存在チェック | `rg -q 'find.*\.swift' validate.sh` |
| 4 | `references/us-006-implement.md` | `xcodebuild` なし + `fastlane build` あり | `! rg -q 'xcodebuild' references/us-006-implement.md && rg -q 'fastlane build' references/us-006-implement.md` |
| 5 | `references/us-007-testing.md` | `xcodebuild test` なし + `fastlane test` あり | `! rg -q 'xcodebuild test' references/us-007-testing.md && rg -q 'fastlane test' references/us-007-testing.md` |
| 6 | `references/us-007-testing.md` | `flows/` なし + `maestro/` あり | `! rg -q 'maestro test flows/' references/us-007-testing.md && rg -q 'maestro test maestro/' references/us-007-testing.md` |
| 7 | `references/us-006-implement.md` | `xcodegen generate` がビルド前に記載 | `rg -q 'xcodegen generate' references/us-006-implement.md` |
| 8 | `templates/Fastfile` | `test`, `build`, `build_for_simulator` lanes 存在 | `rg -q 'lane :test' templates/Fastfile && rg -q 'lane :build' templates/Fastfile && rg -q 'lane :build_for_simulator' templates/Fastfile` |
| 9 | `references/us-006-implement.md` | 全 fastlane コマンドに env vars 付き | `rg -q 'FASTLANE_OPT_OUT' references/us-006-implement.md` |
| 10 | `references/us-006-implement.md` | `GENERATE_INFOPLIST_FILE` 記載 | `rg -q 'GENERATE_INFOPLIST_FILE' references/us-006-implement.md` |
| 11 | `references/us-005b-monetization.md` | `Products.storekit` 参照なし | `! rg -q 'Products.storekit' references/us-005b-monetization.md` |
| 12 | `references/us-005b-monetization.md` | RC Test Store 手順あり | `rg -q 'Test Store' references/us-005b-monetization.md` |
| 13 | `validate.sh` | `Products.storekit` チェック削除済み | `! rg -q 'Products.storekit' validate.sh` |
| 14 | `references/us-006-implement.md` | TDD サイクル記載 | `rg -q 'RED' references/us-006-implement.md && rg -q 'GREEN' references/us-006-implement.md && rg -q 'REFACTOR' references/us-006-implement.md` |
| 15 | `references/us-006-implement.md` | テストファースト指示あり | `rg -qi 'test.*first\|before.*implement\|write.*test' references/us-006-implement.md` |
| 16 | `references/us-006-implement.md` | 実行順序記載 | `rg -q 'Models' references/us-006-implement.md && rg -q 'Services' references/us-006-implement.md && rg -q 'Integration' references/us-006-implement.md` |
| 17 | `references/us-006-implement.md` | Swift Testing 記載 | `rg -q '@Test' references/us-006-implement.md && rg -q '#expect' references/us-006-implement.md` |
| 18 | `references/us-006-implement.md` | Parameterized tests 記載 | `rg -q '@Test(arguments' references/us-006-implement.md` |
| 19 | `references/us-006-implement.md` | 80%+ カバレッジ目標 | `rg -q '80%' references/us-006-implement.md` |
| 20 | `references/us-007-testing.md` | `flows/` ディレクトリ名なし | `! rg -q 'flows/' references/us-007-testing.md` |
| 21 | `references/us-007-testing.md` | `clearState` + `clearKeychain` 記載 | `rg -q 'clearState' references/us-007-testing.md && rg -q 'clearKeychain' references/us-007-testing.md` |
| 22 | `references/us-007-testing.md` | `extendedWaitUntil` 記載 | `rg -q 'extendedWaitUntil' references/us-007-testing.md` |
| 23 | `references/us-007-testing.md` | `takeScreenshot` 記載 | `rg -q 'takeScreenshot' references/us-007-testing.md` |
| 24 | `references/us-007-testing.md` | `id:` セレクタ優先指示 | `rg -q 'id:' references/us-007-testing.md` |
| 25 | `references/us-007-testing.md` | tags 記載 | `rg -q 'smokeTest' references/us-007-testing.md` |
| 26 | `references/us-007-testing.md` | `maestro test maestro/` 記載 | `rg -q 'maestro test maestro/' references/us-007-testing.md` |
| 27 | `references/us-007-testing.md` | timeout ガイダンス | `rg -q '30000' references/us-007-testing.md` |
| 28 | `references/us-007-testing.md` | Foundation Models 参照なし | `! rg -q 'Foundation Models' references/us-007-testing.md` |
| 29 | `references/us-007-testing.md` | `500ms` 性能基準 | `rg -q '500ms' references/us-007-testing.md` |
| 30 | `references/us-007-testing.md` | `testFallback` なし | `! rg -q 'testFallback' references/us-007-testing.md` |
| 31 | `SKILL.md` | code-quality-reviewer 記載 | `rg -q 'code-quality-reviewer' SKILL.md` |
| 32 | `references/us-007-testing.md` | Edge Case → Test マッピング表 | `rg -q 'Edge Case' references/us-007-testing.md` |
| 33 | `validate.sh` | `grep -rw 'class Mock'` 使用 | `rg -q "grep -rw 'class Mock'" validate.sh` |
| 34 | `CLAUDE.md` | 9セッション分割記載 | `rg -q 'セッション' CLAUDE.md` |

### 一括検証コマンド（全34項目 → 終了コード 0=ALL PASS）

```bash
#!/bin/bash
# validate_traceability.sh — Phase C 完了後に実行
# 終了コード: 0=全PASS, 1=1件以上FAIL
FAIL=0
check() { eval "$2" 2>/dev/null || { echo "FAIL #$1: $3"; FAIL=1; }; }
check 1  "rg -q 'Skill:' SKILL.md" "SKILL.md にスキル参照なし"
check 2  "rg -q 'APP_SCHEME' references/us-006-implement.md && rg -q 'UDID' references/us-006-implement.md" "変数定義なし"
check 3  "rg -q 'find.*\.swift' validate.sh" "Gate 0 なし"
check 4  "! rg -q 'xcodebuild' references/us-006-implement.md && rg -q 'fastlane build' references/us-006-implement.md" "xcodebuild残存 or fastlane未記載"
check 5  "! rg -q 'xcodebuild test' references/us-007-testing.md && rg -q 'fastlane test' references/us-007-testing.md" "xcodebuild test残存"
check 6  "! rg -q 'maestro test flows/' references/us-007-testing.md && rg -q 'maestro test maestro/' references/us-007-testing.md" "flows/残存"
check 7  "rg -q 'xcodegen generate' references/us-006-implement.md" "xcodegen未記載"
check 8  "rg -q 'lane :test' templates/Fastfile && rg -q 'lane :build' templates/Fastfile && rg -q 'lane :build_for_simulator' templates/Fastfile" "Fastfile lanes不足"
check 9  "rg -q 'FASTLANE_OPT_OUT' references/us-006-implement.md" "env vars未記載"
check 10 "rg -q 'GENERATE_INFOPLIST_FILE' references/us-006-implement.md" "Info.plist設定未記載"
check 11 "! rg -q 'Products.storekit' references/us-005b-monetization.md" "StoreKit残存"
check 12 "rg -q 'Test Store' references/us-005b-monetization.md" "RC Test Store未記載"
check 13 "! rg -q 'Products.storekit' validate.sh" "validate.shにStoreKit残存"
check 14 "rg -q 'RED' references/us-006-implement.md && rg -q 'GREEN' references/us-006-implement.md && rg -q 'REFACTOR' references/us-006-implement.md" "TDDサイクル未記載"
check 15 "rg -qi 'test.*first\|before.*implement\|write.*test' references/us-006-implement.md" "テストファースト未記載"
check 16 "rg -q 'Models' references/us-006-implement.md && rg -q 'Services' references/us-006-implement.md && rg -q 'Integration' references/us-006-implement.md" "実行順序未記載"
check 17 "rg -q '@Test' references/us-006-implement.md && rg -q '#expect' references/us-006-implement.md" "Swift Testing未記載"
check 18 "rg -q '@Test(arguments' references/us-006-implement.md" "Parameterized tests未記載"
check 19 "rg -q '80%' references/us-006-implement.md" "カバレッジ目標未記載"
check 20 "! rg -q 'flows/' references/us-007-testing.md" "flows/残存"
check 21 "rg -q 'clearState' references/us-007-testing.md && rg -q 'clearKeychain' references/us-007-testing.md" "clearState/Keychain未記載"
check 22 "rg -q 'extendedWaitUntil' references/us-007-testing.md" "extendedWaitUntil未記載"
check 23 "rg -q 'takeScreenshot' references/us-007-testing.md" "takeScreenshot未記載"
check 24 "rg -q 'id:' references/us-007-testing.md" "id:セレクタ未記載"
check 25 "rg -q 'smokeTest' references/us-007-testing.md" "tags未記載"
check 26 "rg -q 'maestro test maestro/' references/us-007-testing.md" "maestroコマンド未記載"
check 27 "rg -q '30000' references/us-007-testing.md" "timeout未記載"
check 28 "! rg -q 'Foundation Models' references/us-007-testing.md" "Foundation Models残存"
check 29 "rg -q '500ms' references/us-007-testing.md" "500ms未記載"
check 30 "! rg -q 'testFallback' references/us-007-testing.md" "testFallback残存"
check 31 "rg -q 'code-quality-reviewer' SKILL.md" "code-quality-reviewer未記載"
check 32 "rg -q 'Edge Case' references/us-007-testing.md" "Edge Caseマッピング未記載"
check 33 "rg -q \"grep -rw 'class Mock'\" validate.sh" "Mock grep未修正"
check 34 "rg -q 'セッション' CLAUDE.md" "セッション分割未記載"
[ $FAIL -eq 0 ] && echo "ALL 34 PASS" || echo "FAILED: see above"
exit $FAIL
```

---

## 7. レビューゲート設計

ソース: [HubSpot Engineering](https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution) / 核心の引用: 「Internal agent framework... reducing cycle time and ensuring high quality feedback as fast as possible.」

ソース: [Qodo - AI Code Review 2026](https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/) / 核心の引用: 「Severity-Driven Review: Every finding gets assigned a severity level.」

### フェーズ内レビュー: code-quality-reviewer サブエージェント

| 観点 | Codex CLI（外部） | code-quality-reviewer（内部 — 採用） |
|------|-------------------|-------------------------------------|
| コンテキスト | 白紙スタート | CLAUDE.md + Serena メモリ参照 |
| レイテンシ | 高（外部プロセス） | **低（同一セッション）** |
| 反復回数 | 多い（コンテキスト不足） | **少ない（プロジェクト知識）** |
| Blocking 精度 | 低（汎用） | **高（カスタムルール）** |

### codex-review は存続

リリース前最終ゲート・大規模リファクタ時に使用。Phase B の各セッションでは使わない。

### レビュー発動ルール（リスク優先 — 行数は二次判定）

| 優先度 | 条件 | レビュー | ブロッキング |
|--------|------|---------|-------------|
| 1（最高） | セキュリティ / 決済コード（行数不問） | **人間レビュー（必須）** | 人間 OK |
| 2 | 公開 API 変更（行数不問） | **code-quality-reviewer（必須）** | CRITICAL=0 |
| 3 | 50行〜 / 複数ファイル | **code-quality-reviewer** | CRITICAL=0 |
| 4 | 5〜50行 | 軽量チェック | テスト PASS |
| 5 | 5行以下 | なし（テストのみ） | テスト PASS |

---

## 8. Phase D: 新アプリで検証

| # | ステップ | 内容 |
|---|---------|------|
| 1 | `ralph.sh` 実行 | 改善済みレシピで US-001〜009 を1本通す |
| 2 | `validate.sh` 確認 | 全 US が passes: true |
| 3 | 問題記録 | 新たな問題を best-practices-audit.md に追記 |

---

## 9. Phase E: Cron テスト

| # | ステップ | 内容 |
|---|---------|------|
| 1 | cron 設定確認 | `mobileapp-factory-morning` 15:00 JST |
| 2 | 無人実行 | ralph.sh が全 US を自動走行 |
| 3 | Slack 報告確認 | #metrics に完了報告 |

---

## 10. OSS 計画 — `https://github.com/Daisuke134/mobileapp-builder`

### リポジトリ構成

```
mobileapp-builder/
├── SKILL.md                    ← エントリーポイント（npx skills add で配布）
├── CLAUDE.md                   ← CC セッション用テンプレート
├── ralph.sh                    ← Loop executor（1 US = 1 CC session）
├── validate.sh                 ← External quality gate
├── prd.json                    ← Backlog テンプレート
├── SETUP.md                    ← 初回セットアップ手順
├── README.md                   ← OSS ドキュメント
├── references/
│   ├── us-001-trend.md
│   ├── us-002-planning.md
│   ├── us-003-research.md
│   ├── us-004-specs.md
│   ├── us-005a-infra.md
│   ├── us-005b-monetization.md
│   ├── us-006-implement.md
│   ├── us-007-testing.md
│   ├── us-008-release.md
│   ├── us-009-submit.md
│   ├── best-practices-audit.md
│   └── submission-checklist.md
└── templates/
    ├── Fastfile
    ├── project.yml
    └── .env.example
```

### OSS 公開フロー

| # | ステップ | 内容 |
|---|---------|------|
| 1 | Phase A-E 完了 | DeskStretch + 新アプリで全レシピ検証済み |
| 2 | 秘密情報の除去 | Webhook URL, API Key, Slack Token → プレースホルダ |
| 3 | README.md 作成 | セットアップ手順、前提条件 |
| 4 | SETUP.md 更新 | `npx skills add Daisuke134/mobileapp-builder` |
| 5 | templates/ 作成 | Fastfile, project.yml, .env.example |
| 6 | GitHub Release | v1.0.0 タグ |
| 7 | skills.sh 登録 | `npx skills add` で配布可能に |

### 依存スキル（ユーザーが別途インストール — 全 Phase 1対1対応）

| Phase | スキル | ソース |
|-------|--------|--------|
| 004a (Core Spec) | `implementation-spec` | skills.sh |
| 004b (UX Spec) | `frontend-design` | Anthropic 公式 |
| 004-R (Spec Review) | code-quality-reviewer | 内蔵サブエージェント |
| 006a (TDD Data Layer) | `ios-ux-design` | 自作 |
| 006b (TDD Onboarding) | `ios-ux-design` | 自作 |
| 006c (TDD Core Screens) | `ios-ux-design` | 自作 |
| 006d (TDD Polish) | `ios-ux-design` | 自作 |
| 006-R (Code Review) | code-quality-reviewer | 内蔵サブエージェント |
| 007 (E2E) | `maestro-ui-testing` | skills.sh |
| 008 (Release) | `asc-release-flow` | rshankras/claude-code-apple-skills |
| 009 (Submit) | `asc-submission-health` | rshankras/claude-code-apple-skills |

---

## 11. オンボーディング設計ルール（mau.md — Prayer Lock $25k/月の実例）

| # | ルール | ソース引用 |
|---|--------|-----------|
| 1 | **3幕構成**: 問題提示 → アプリ体験 → Paywall | 「introduction → climax → conclusion」 |
| 2 | **質問 = ユーザーの自己説得** | 「the real purpose is to reflect on their own answers」 |
| 3 | **回答のミラーリング** | 「mirror the user's answers back to them」 |
| 4 | **長いほど変換率UP（価値がある限り）** | 「the longer, the better it converts」 |
| 5 | **コア機能を体験させる** | 「let the user actually use your core feature」 |
| 6 | **レビューモーダル = コア体験直後** | 「right after the user completes your core feature」 |
| 7 | **コミットメント原則** | 「actively state they are committed before paywall」 |
| 8 | **10%+ DL→Trial 変換率** | 「at least 10% download to trial conversion rate」 |

---

## 12. サマリー

| 項目 | 値 |
|------|-----|
| 問題数 | 21件（CRITICAL 1, HIGH 12, MEDIUM 8） |
| レシピ改善 TODO | 34件 + デザインスキル統合 + mau.md ルール |
| Phase A（SDD Spec） | 3セッション（004a, 004b, 004-R） |
| Phase B（TDD Fix） | 6セッション（006a, 006b, 006c, 006d, 006-R, 007） |
| Phase C（レシピ更新） | 9ファイル更新 |
| Phase D（検証） | ralph.sh フル実行 |
| Phase E（Cron） | 15:00 JST 自動実行 |
| **合計セッション** | **9** |

| 変更 | 理由 | ソース |
|------|------|--------|
| TDD を 006 に統合 | TDD = 実装そのもの | Martin Fowler TDD |
| 007 を E2E のみに | Unit/Integration は 006 で完了 | Quash TDD Guide |
| レビューを独立フェーズに（004-R, 006-R） | 「explicit step in workflow」 | Martin Fowler RefinementCodeReview |
| 004a-R 削除 → 004-R に統合 | Spec は 004b 完了後にまとめてレビュー | Anthropic teams workflow |
| 1フェーズ = 1スキル | 複数スキル = 混乱 | Anthropic Skills Guide |
| codex-review は存続 | リリース前最終ゲート | — |
