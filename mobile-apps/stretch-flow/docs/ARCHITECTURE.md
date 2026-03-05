# Technical Architecture: DeskStretch

> **Version:** 1.0 | **Date:** 2026-03-05

---

## 1. Overview

DeskStretch は SwiftUI ベースの iOS アプリ。ローカルファーストアーキテクチャで、バックエンド不要。痛みエリア＋履歴ベースの静的フィルタリングによるルーティン選択、RevenueCat によるサブスクリプション管理、UserDefaults + JSON によるデータ永続化。**AI API は使用禁止（Rule 21）。**

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **UI** | SwiftUI | iOS 15+ |
| **Routine Selection** | 静的フィルタリング（JSON ベース） | iOS 15+ |
| **Subscriptions** | RevenueCat Swift SDK | Latest |
| **Notifications** | UserNotifications | Native |
| **Storage** | UserDefaults + JSON files | Native |
| **Localization** | String Catalogs (.xcstrings) | Xcode 16+ |
| **Icons** | SF Symbols | Native |
| **Build** | Xcode 16+ / Fastlane | Latest |
| **Testing** | Swift Testing + XCTest + Maestro | Latest |

**NOT Used (Forbidden):**

| Technology | Rule |
|-----------|------|
| Mixpanel / any analytics SDK | Rule 17 |
| RevenueCatUI | Rule 20 |
| AppTrackingTransparency | Rule 20b |
| CoreData / SwiftData | Overkill for MVP |
| Backend / API | Not needed for MVP |
| AI API / Foundation Models | Rule 21: ゼロ AI API |

---

## 3. App Structure

```
DeskStretchios/
├── App/
│   ├── DeskStretchApp.swift              # @main entry + RevenueCat configure
│   ├── ContentView.swift                 # TabView: Timer | Library | Progress | Settings
│   └── AppState.swift                    # @Observable app-wide state
├── Views/
│   ├── Onboarding/
│   │   ├── OnboardingContainerView.swift # PageTabView for 3 screens
│   │   ├── ProblemEmpathyView.swift      # Screen 1
│   │   ├── PainAreaSelectionView.swift   # Screen 2
│   │   └── PaywallView.swift             # Screen 3 (self-built, Rule 20)
│   ├── Timer/
│   │   ├── TimerView.swift               # Countdown display + controls
│   │   └── TimerSettingsSheet.swift      # Interval picker (30/45/60/90 min)
│   ├── Stretch/
│   │   ├── StretchLibraryView.swift      # Categorized exercise list
│   │   ├── StretchSessionView.swift      # Guided session with countdown
│   │   └── StretchDetailView.swift       # Single exercise detail
│   ├── Progress/
│   │   └── ProgressDashboardView.swift   # Today's count, streak, totals
│   └── Settings/
│       └── SettingsView.swift            # All user preferences
├── Models/
│   ├── StretchExercise.swift             # id, name, category, instructions, sfSymbol, duration
│   ├── PainArea.swift                    # enum: neck, back, shoulders, wrists
│   ├── BreakSchedule.swift               # interval, workHoursStart, workHoursEnd
│   ├── UserProgress.swift                # todayCount, streak, totalSessions, lastActiveDate
│   └── StretchSession.swift              # exercises[], completedAt, duration
├── Services/
│   ├── StretchRoutineService.swift        # 静的フィルタリング（痛みエリア + 履歴ベース）
│   ├── NotificationService.swift         # Schedule/cancel local notifications
│   ├── SubscriptionService.swift         # SubscriptionServiceProtocol 準拠（DI + Mock 対応）
│   ├── ProgressService.swift             # UserDefaults CRUD for progress
│   └── StretchLibraryService.swift       # Load exercises from JSON
├── Resources/
│   ├── StretchLibrary.json               # 20+ exercises data
│   └── Localizable.xcstrings             # en + ja strings
└── Extensions/
    ├── Date+Extensions.swift             # isSameDay, workHoursCheck
    └── Notification+Extensions.swift     # Notification name constants
```

---

## 4. Data Flow

### State Management（MVVM 分割）

**AppState は God Object 化を防ぐため、ドメイン別 ViewModel に分割する。**

```
@Observable TimerViewModel
    ├── breakSchedule: BreakSchedule
    ├── remainingTime: TimeInterval
    └── isRunning: Bool

@Observable StretchViewModel
    ├── currentSession: StretchSession?
    ├── selectedPainAreas: Set<PainArea>
    └── sessionHistory: [StretchSession]

@Observable ProgressViewModel
    ├── userProgress: UserProgress
    ├── todayCount: Int
    └── currentStreak: Int

@Observable AppState（薄いコーディネーター）
    ├── isPremium: Bool
    ├── hasCompletedOnboarding: Bool
    └── timerVM / stretchVM / progressVM への参照
```

**各 ViewModel は対応する Service を DI で受け取り、View は ViewModel のみを参照する。**

```
View → ViewModel → Service → UserDefaults / JSON
         ↑ DI
    Protocol-based injection（テスト時は Mock 差し替え）
```

### Data Persistence

| Data | Storage | Format |
|------|---------|--------|
| Pain areas | UserDefaults | `Set<String>` (codable) |
| Break schedule | UserDefaults | `BreakSchedule` (codable) |
| Progress | UserDefaults | `UserProgress` (codable) |
| Onboarding flag | UserDefaults | `Bool` |
| Stretch library | Bundle JSON | `[StretchExercise]` |
| Subscription status | RevenueCat (cached) | `CustomerInfo` |

### Routine Selection Data Flow（静的フィルタリング）

```
User's pain areas + session history
    ↓
StretchRoutineService.selectRoutine(painAreas:, history:)
    ↓
StretchLibrary.json から痛みエリアでフィルタ
    ↓
3日以内の重複を除外（バリエーション確保）
    ↓
StretchSession with 3-5 exercises
    ↓
StretchSessionView renders step-by-step
```

---

## 5. Security & Privacy

| Concern | Approach |
|---------|----------|
| **Data Collection** | Zero. No analytics, no tracking, no server-side data |
| **Routine Selection** | 100% ローカル（JSON 静的フィルタリング）。ネットワーク通信なし |
| **Subscription** | RevenueCat handles. Only anonymous App User ID |
| **PrivacyInfo.xcprivacy** | NSPrivacyAccessedAPICategoryUserDefaults (CA92.1) |
| **ATT** | NOT used (Rule 20b) |
| **Network** | RevenueCat SDK only. No other network calls |
| **Keychain** | Not used in MVP |

---

## 6. Performance

| Metric | Target | Approach |
|--------|--------|----------|
| Cold start | < 2s | Minimal dependencies, no heavy init |
| Routine selection | < 500ms | 静的フィルタリング（JSON ベース、ネットワーク不要） |
| Memory | < 50 MB | No images/videos, SF Symbols only |
| Battery | Negligible | Scheduled notifications, no background processing |
| App size | < 30 MB | Text + SF Symbols + JSON data |

### Timer Implementation

```
NOT: Background timer (kills battery, unreliable)
YES: Scheduled UNNotificationRequest at exact intervals

User sets 60-min interval → schedule notification for T+60min
Notification fires → user taps → app opens → start session
After session → reschedule next notification for T+60min
```

---

## 7. Testing Strategy

| Layer | Coverage | Tool |
|-------|----------|------|
| Unit | 70% | Swift Testing |
| Integration | 20% | XCTest |
| E2E | 10% | Maestro |

**Key Test Targets:**

| Component | Test Type | Priority |
|-----------|-----------|----------|
| StretchRoutineService (フィルタリングロジック) | Unit | P0 |
| ProgressService (streak calculation) | Unit | P0 |
| NotificationService (scheduling) | Unit | P0 |
| SubscriptionService (entitlement) | Integration | P0 |
| Onboarding flow | E2E (Maestro) | P0 |
| Break → Stretch → Complete flow | E2E (Maestro) | P0 |

---

## 8. Deployment

| Stage | Tool | Target |
|-------|------|--------|
| Build | Fastlane `build` | IPA |
| Test | Fastlane `test` | Simulator |
| Device | Fastlane `build_for_device` | iPhone |
| Upload | Fastlane `upload` | App Store Connect |
| Submit | Fastlane `full_release` | App Store Review |

**CI Requirements:**
- Xcode 16+
- `FASTLANE_SKIP_UPDATE_CHECK=1`
- `FASTLANE_OPT_OUT_CRASH_REPORTING=1`
- RevenueCat API Key in environment

---

## 9. Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| StretchLibrary.json の内容不足 | Low | Medium | 20+ エクササイズで4カテゴリ網羅 |
| RevenueCat SDK breaking changes | Low | High | Pin SDK version, test before updates |
| Notification permission denied | Medium | High | In-app timer fallback, re-prompt strategy |
| UserDefaults data loss | Low | Medium | Minimal critical data, streak reset is acceptable |
| App Store rejection (4.3 spam) | Low | High | 痛みエリアターゲティング + ブレイクタイマー統合で差別化 |

---

## 10. Future Architecture (v1.1+)

| Feature | Architecture Impact |
|---------|-------------------|
| Apple Watch | WatchKit extension, shared data via WatchConnectivity |
| HealthKit | HealthKit framework, permission flow, stand hours integration |
| Video exercises | AVFoundation, bundled or streaming video assets |
| Backend | REST API (Node.js/Express), user accounts, cloud sync |
| Widget | WidgetKit extension, next-break countdown |

---

## 11. Dependencies

| Dependency | Type | Version | Purpose |
|-----------|------|---------|---------|
| RevenueCat | SPM | Latest | Subscription management |
| StretchLibrary.json | Bundle | N/A | 静的エクササイズデータ |
| UserNotifications | System | iOS 15+ | Break reminders |
| SF Symbols | System | iOS 15+ | Exercise icons |

---

## 12. Architecture Decision Records

### ADR-001: UserDefaults over CoreData

**Decision:** Use UserDefaults for all data persistence.
**Rationale:** MVP data is simple (progress counters, preferences, pain areas). CoreData adds complexity without benefit. Migrate to CoreData/SwiftData if data model grows in v2.0.

### ADR-002: Static Filtering Only（Rule 21: AI API 禁止）

**Decision:** 静的フィルタリングのみ使用。AI API（Foundation Models 含む）は使用禁止。
**Rationale:** Rule 21 により AI API はゼロ。StretchLibrary.json から痛みエリア + 履歴ベースでフィルタリングし、ルーティンを選択する。iOS 15+ で100%動作。

### ADR-003: Scheduled Notifications over Background Timer

**Decision:** Use UNNotificationRequest for break reminders instead of background timer.
**Rationale:** Background timers are unreliable (iOS kills background tasks), drain battery, and trigger App Store review flags. Scheduled notifications are reliable and battery-friendly.

### ADR-004: Self-built PaywallView over RevenueCatUI

**Decision:** Build PaywallView in SwiftUI from scratch.
**Rationale:** Rule 20 (factory constraint). RevenueCatUI is forbidden. Use `Purchases.shared.purchase(package:)` directly.

### ADR-005: SubscriptionService Protocol 化（テスタビリティ）

**Decision:** `SubscriptionServiceProtocol` を定義し、DI でテスト時に Mock 差し替え可能にする。
**Rationale:** RevenueCat SDK はシミュレータ/ユニットテストで動作しない。Protocol 化により `MockSubscriptionService` でオフラインテスト可能。PaywallView、ContentView 等で `isPremium` の分岐テストが確実になる。

```swift
protocol SubscriptionServiceProtocol {
    var isPremium: Bool { get async }
    func configure(apiKey: String)
    func checkPremiumStatus() async -> Bool
    func getOfferings() async -> Offerings?
    func purchase(package: Package) async throws -> Bool
    func restorePurchases() async throws -> Bool
}
```

### ADR-006: AppState → MVVM 分割（God Object 防止）

**Decision:** AppState をドメイン別 ViewModel（TimerViewModel, StretchViewModel, ProgressViewModel）に分割し、AppState は薄いコーディネーターに留める。
**Rationale:** 全状態を1つの AppState に集約すると God Object 化し、テスト困難・変更影響範囲が広がる。MVVM 分割により各 ViewModel が独立してテスト可能になる。
