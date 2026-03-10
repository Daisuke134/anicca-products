# Test Specification: SomaticFlow

Source: [Martin Fowler: Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) — 「Have many small unit tests, fewer integration tests, and even fewer UI tests.」
Source: [Apple Developer: Testing Best Practices](https://developer.apple.com/documentation/xcode/testing-your-apps-in-xcode) — 「Write tests that are fast, isolated, and repeatable.」
Source: [Maestro Mobile Testing](https://maestro.mobile.dev/) — 「Maestro makes it easy to write and maintain UI tests for mobile apps.」

---

## 1. Test Strategy

### Test Pyramid

```
             /\
            /E2E\        ← 10%: Maestro フロー（6+）
           /──────\
          /  Integ  \    ← 20%: Service 間結合テスト
         /────────────\
        /   Unit Tests  \ ← 70%: Models / ViewModels / Services
       /──────────────────\
```

| 種別 | カバレッジ目標 | ツール | 実行頻度 |
|------|------------|-------|---------|
| Unit | 70%+ | XCTest | 毎コミット |
| Integration | Service間のみ | XCTest | PR時 |
| E2E | 主要ユーザーフロー | Maestro | PR前 + TestFlight前 |

### 禁止パターン

| 禁止 | 理由 |
|------|------|
| ProductionコードにMock/Stub埋め込み | テスト汚染 |
| ハードコードされた sleep() | フレーキー |
| ネットワーク実通信 (RC SDK以外) | 外部依存 |
| UserDefaults をテスト間で共有 | 状態汚染 |

---

## 2. Unit Tests

### Models（10テスト）

| Test Name | Target | What It Verifies |
|-----------|--------|-----------------|
| `test_exercise_codable_round_trip` | Exercise | JSON encode → decode 一致 |
| `test_exercise_isPremium_default_false` | Exercise | Day 1-3 は isPremium = false |
| `test_exercise_category_rawvalue` | ExerciseCategory | .grounding / .nervous / .release |
| `test_program_codable_round_trip` | Program | JSON encode → decode 一致 |
| `test_program_7day_exercise_count` | Program | 7-day: exerciseIds.count == 7 |
| `test_program_30day_isPremium_true` | Program | 30-day: isPremium == true |
| `test_userProgress_default_values` | UserProgress | streak=0, sessions=0, onboarding=false |
| `test_userProgress_streak_increment` | UserProgress | streak + 1 後の値確認 |
| `test_userProgress_codable` | UserProgress | encode → decode 一致 |
| `test_userProgress_hasPresentedPaywall` | UserProgress | デフォルト false |

### ViewModels（14テスト）

| Test Name | Target | What It Verifies |
|-----------|--------|-----------------|
| `test_onboardingVM_initialStep_isZero` | OnboardingViewModel | initialStep == 0 |
| `test_onboardingVM_next_increments` | OnboardingViewModel | next() で step + 1 |
| `test_onboardingVM_step5_isPaywall` | OnboardingViewModel | step == 5 = paywall表示 |
| `test_paywallVM_purchase_calls_service` | PaywallViewModel | purchase() → SubscriptionServiceProtocol.purchase() 呼び出し |
| `test_paywallVM_isPurchasing_true_during_purchase` | PaywallViewModel | purchase中 isPurchasing == true |
| `test_paywallVM_dismiss_on_success` | PaywallViewModel | 購入成功 → isDismissed = true |
| `test_programVM_loads_exercises_from_json` | ProgramViewModel | exercises.json から 7+ エクサイズ読み込み |
| `test_programVM_free_exercises_count` | ProgramViewModel | Free tier: isPremium=false が 3 件 |
| `test_exerciseVM_timer_counts_down` | ExerciseViewModel | start() → 1秒後 remainingSeconds - 1 |
| `test_exerciseVM_complete_updates_progress` | ExerciseViewModel | complete() → UserProgress.totalSessionCount + 1 |
| `test_progressVM_streak_from_userdefaults` | ProgressViewModel | UserDefaults streak を正しく読み込み |
| `test_progressVM_streak_breaks_on_missed_day` | ProgressViewModel | 1日空いた場合 streak = 0 |
| `test_settingsVM_default_notification_time` | SettingsViewModel | hour=9, minute=0 |
| `test_settingsVM_update_notification_schedules` | SettingsViewModel | 時刻変更 → NotificationService.scheduleDailyReminder 呼び出し |

### Services（8テスト）

| Test Name | Target | What It Verifies |
|-----------|--------|-----------------|
| `test_subscriptionService_isPremium_false_default` | SubscriptionService (mock RC) | 未購入時 isPremium = false |
| `test_subscriptionService_protocol_conformance` | SubscriptionService | SubscriptionServiceProtocol に準拠 |
| `test_notificationService_authorization_request` | NotificationService | requestAuthorization() → Bool 返却 |
| `test_notificationService_schedule_creates_request` | NotificationService | scheduleDailyReminder() → UNNotificationRequest 生成 |
| `test_notificationService_cancel_removes_all` | NotificationService | cancelAllReminders() → pending = 0 |
| `test_userdefaults_progress_save_and_load` | UserDefaults | streak を save → load で一致 |
| `test_userdefaults_settings_save_and_load` | UserDefaults | notifHour を save → load で一致 |
| `test_exercises_json_loads_25plus` | exercises.json | Bundle から 25+ エクサイズ読み込み |

---

## 3. Integration Tests

| Test Name | Services | What It Verifies |
|-----------|---------|-----------------|
| `test_onboarding_to_paywall_flow` | OnboardingVM + PaywallVM | オンボーディング完了 → ペイウォール表示トリガー |
| `test_exercise_complete_updates_streak` | ExerciseVM + ProgressVM | セッション完了 → streak + 1 |
| `test_notification_permission_then_schedule` | OnboardingVM + NotificationService | 許可取得 → scheduleDailyReminder 呼び出し |
| `test_paywall_purchase_unlocks_premium` | PaywallVM + SubscriptionService | 購入後 isPremium = true → LibraryView 全表示 |
| `test_settings_notification_time_change` | SettingsVM + NotificationService | 時刻変更 → 旧スケジュール削除 + 新スケジュール登録 |

---

## 4. E2E Tests (Maestro)

Source: [Maestro Docs: Writing Tests](https://maestro.mobile.dev/getting-started/writing-a-flow) — 「Use id: selectors for stable targeting. Avoid point-based selectors.」

### Maestro フロー一覧

| File | Scenario | Key Assertions | smokeTest |
|------|---------|---------------|-----------|
| `maestro/01_onboarding.yaml` | 初回オンボーディング完了 | stress_slider, goal_chip_0, paywall_close が存在 | ✅ |
| `maestro/02_timer.yaml` | エクサイズタイマー実行 | exercise_timer > 0、exercise_complete_button が表示 | ✅ |
| `maestro/03_settings.yaml` | 設定画面操作 | settings_upgrade_button タップ → paywall_close 表示 | — |
| `maestro/04_payment_monthly.yaml` | 月額サブスク購入フロー | paywall_monthly_card 選択 → paywall_cta_button タップ | — |
| `maestro/05_payment_annual.yaml` | 年額サブスク購入フロー | paywall_annual_card 選択 → paywall_cta_button タップ | — |
| `maestro/06_payment_failure.yaml` | 購入キャンセル / 失敗 | paywall_cta_button タップ → paywall_close でフォールバック | — |

### Maestroルール（全フロー共通）

| ルール | 詳細 |
|--------|------|
| セレクター | 全 `id:` セレクター使用。`point:` 禁止 |
| 状態リセット | 各フロー先頭に `clearState: true` |
| スクショ | 各フロー末尾に `takeScreenshot: result_{flow_name}` |
| タグ | `01_onboarding` と `02_timer` に `tags: [smokeTest]` |
| タイムアウト | `timeout: 5000` (デフォルト) |

### accessibilityIdentifier → UX_SPEC.md §7 との対応確認

| Maestro id | UX_SPEC §7 定義 | 一致 |
|-----------|----------------|------|
| `paywall_close` | ✅ | ✅ |
| `paywall_cta_button` | ✅ | ✅ |
| `paywall_monthly_card` | ✅ | ✅ |
| `paywall_annual_card` | ✅ | ✅ |
| `exercise_timer` | ✅ | ✅ |
| `exercise_complete_button` | ✅ | ✅ |
| `streak_badge` | ✅ | ✅ |
| `settings_upgrade_button` | ✅ | ✅ |

---

## 5. Greenlight Checks

Source: [mobileapp-builder CLAUDE.md](CLAUDE.md) — 「Greenlight: CRITICAL=0確認してから提出」

### 必須グリーンライトチェック（全PASS必須）

| Check | Command | Pass Criteria | Rule |
|-------|---------|--------------|------|
| Rule 17: 行動トラッキングSDK禁止 | `grep -rE "Mix[p]anel\|Fire[b]ase\|Amplitu[d]e\|Segmen[t]" SomaticFlowios/ --include="*.swift" \| grep -v Test` | 0件 | Rule 17 |
| Rule 20: RC-UI library禁止 | `grep -r "Revenue[C]atUI" SomaticFlowios/ --include="*.swift"` | 0件 | Rule 20 |
| Rule 20b: ATT禁止 | `grep -r "ATTracking[M]anager\|requestTrackingAuthorization" SomaticFlowios/` | 0件 | Rule 20b |
| Rule 23: AI API禁止 | `grep -rE "Open[A]I\|anthr[o]pic\|Google[G]enerativeAI\|Foundation[M]odels" SomaticFlowios/ --include="*.swift"` | 0件 | Rule 23 |
| No Mock in Prod | `grep -rw "class Mock" SomaticFlowios/SomaticFlow --include="*.swift"` | 0件 | 品質 |
| PrivacyInfo存在 | `test -f SomaticFlowios/SomaticFlow/PrivacyInfo.xcprivacy` | PASS | ITMS-91053 |
| Encryption設定 | `grep -q "ITSAppUsesNonExemptEncryption" SomaticFlowios/SomaticFlow/Info.plist` | PASS | App Review |
| Greenlight preflight | `greenlight preflight SomaticFlowios/` | CRITICAL=0 | Submission |

---

## 6. Performance Targets

Source: [Apple Developer: App Performance](https://developer.apple.com/documentation/xcode/improving-your-app-s-performance) — 「Target launch times under 400ms for the best user experience.」

| Metric | Target | 計測方法 |
|--------|--------|---------|
| 初回起動時間 | < 1.5秒（cold launch） | Xcode Instruments: Launch Time |
| エクサイズJSON読み込み | < 100ms | XCTMeasure block |
| 画面遷移アニメーション | 60fps（16.7ms/frame） | Xcode Instruments: Core Animation |
| メモリ使用量 (通常使用) | < 80MB | Instruments: Allocations |
| メモリ使用量 (セッション中) | < 120MB | Instruments: Allocations |
| バッテリー (30分使用) | < 3% drain | Instruments: Energy Log |
| UserDefaults write | < 10ms | XCTMeasure block |

---

## 7. Test Commands

| タスク | コマンド | 期待結果 |
|--------|---------|---------|
| Unit Tests 実行 | `cd SomaticFlowios && fastlane test` | 全テストGREEN |
| E2E Tests 実行 | `maestro test maestro/` | 全フローPASS |
| smokeTest のみ | `maestro test maestro/ --tags smokeTest` | 01 + 02 PASS |
| Greenlight チェック | `greenlight preflight SomaticFlowios/` | CRITICAL=0 |
| ビルド検証 | `cd SomaticFlowios && fastlane build` | BUILD_SUCCESS |
| カバレッジ確認 | `cd SomaticFlowios && fastlane test_with_coverage` | ≥70% |
