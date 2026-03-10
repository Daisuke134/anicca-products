# Architecture: SomaticFlow

Source: [Apple Developer: App Architecture](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app) — 「Use the MVVM pattern to separate concerns between your UI and data model.」
Source: [SwiftUI MVVM Best Practices](https://www.hackingwithswift.com/books/ios-swiftui/introducing-mvvm-into-your-swiftui-project) — 「ViewModels bridge the gap between Views and Models.」
Source: [RevenueCat iOS SDK](https://docs.revenuecat.com/docs/ios-installation) — 「Add RevenueCat as a package dependency in Xcode.」

---

## 1. Platform Requirements

| 項目 | 値 |
|------|-----|
| **iOS Minimum** | iOS 17.0 |
| **Xcode Version** | Xcode 16.0+ |
| **Swift Version** | Swift 5.10+ |
| **SwiftUI** | iOS 17 native APIs（no UIKit fallback） |
| **Deployment Target** | arm64（iPhone only） |

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                  App Layer                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │Onboarding│ │  Main    │ │  Exercise   │ │
│  │  Views   │ │ TabView  │ │   Session   │ │
│  └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       │            │               │        │
│  ┌────▼─────────────▼───────────────▼──────┐│
│  │            ViewModel Layer              ││
│  │ OnboardingVM ProgramVM ExerciseVM       ││
│  │ PaywallVM    ProgressVM SettingsVM      ││
│  └────┬──────────────────────────┬─────────┘│
└───────┼──────────────────────────┼──────────┘
        │                          │
┌───────▼──────────────────────────▼──────────┐
│               Service Layer                  │
│  ┌─────────────────┐  ┌───────────────────┐ │
│  │SubscriptionSvc  │  │ NotificationSvc   │ │
│  │(Protocol + DI)  │  │(UNUserNotif..Ctr) │ │
│  └────────┬────────┘  └─────────┬─────────┘ │
└───────────┼──────────────────────┼───────────┘
            │                      │
┌───────────▼──────────────────────▼───────────┐
│               Data Layer                      │
│  ┌──────────────┐  ┌────────────────────────┐ │
│  │  UserDefaults│  │ exercises.json (static)│ │
│  │ (progress,   │  │ 25+ exercises, programs│ │
│  │  settings)   │  │ bundled in Resources/  │ │
│  └──────────────┘  └────────────────────────┘ │
└───────────────────────────────────────────────┘
            │
┌───────────▼───────────────────────────────────┐
│           External SDK Layer                   │
│  RevenueCat SDK (SPM) — subscription only     │
│  NO: tracking SDKs, cloud AI APIs│
└───────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
SomaticFlowios/
├── SomaticFlow.xcodeproj/
├── SomaticFlow/
│   ├── SomaticFlowApp.swift          # @main, RC configure
│   ├── Config/
│   │   └── SomaticFlow.xcconfig      # RC_API_KEY (not hardcoded)
│   ├── Models/
│   │   ├── Exercise.swift            # Codable exercise model (F-003, F-008)
│   │   ├── Program.swift             # 7-day / 30-day program (F-002, F-009)
│   │   └── UserProgress.swift        # Streak, completed days (F-005)
│   ├── ViewModels/
│   │   ├── OnboardingViewModel.swift  # Onboarding state machine (F-001)
│   │   ├── ProgramViewModel.swift    # Current program / session (F-002)
│   │   ├── ExerciseViewModel.swift   # Timer, haptics (F-003)
│   │   ├── PaywallViewModel.swift    # RC purchase logic (F-006)
│   │   ├── ProgressViewModel.swift   # Streak + badges (F-005)
│   │   └── SettingsViewModel.swift   # Notification time, subscription (F-010)
│   ├── Views/
│   │   ├── Onboarding/               # 5-step flow (F-001)
│   │   │   ├── OnboardingContainerView.swift
│   │   │   ├── StressLevelView.swift
│   │   │   ├── GoalSelectionView.swift
│   │   │   ├── PainPointView.swift
│   │   │   └── NotificationPermissionView.swift
│   │   ├── Main/                     # TabView (F-002, F-008, F-005, F-010)
│   │   │   ├── MainTabView.swift
│   │   │   ├── ProgramView.swift
│   │   │   ├── LibraryView.swift
│   │   │   └── ProgressView.swift
│   │   ├── Exercise/                 # Animation + Timer (F-003)
│   │   │   ├── ExerciseSessionView.swift
│   │   │   ├── ExerciseAnimationView.swift
│   │   │   └── TimerView.swift
│   │   ├── Progress/                 # Streak dashboard (F-005)
│   │   │   └── StreakDashboardView.swift
│   │   ├── Paywall/                  # Soft paywall (F-006)
│   │   │   └── PaywallView.swift     # self-built SwiftUI, NO RC-UI library (Rule 20)
│   │   └── Settings/                 # Settings (F-010)
│   │       └── SettingsView.swift
│   ├── Services/
│   │   ├── SubscriptionService.swift # Protocol + DI (RC)
│   │   └── NotificationService.swift # UNUserNotificationCenter (F-004)
│   ├── Resources/
│   │   ├── Content/
│   │   │   └── exercises.json        # 25+ exercises (static, F-008)
│   │   ├── Localizable.xcstrings     # en-US + ja
│   │   └── Assets.xcassets
│   └── PrivacyInfo.xcprivacy         # UserDefaults CA92.1
└── SomaticFlowTests/
    ├── Models/                        # Model unit tests
    ├── ViewModels/                    # ViewModel unit tests
    └── Services/                      # Service unit tests
```

---

## 4. Dependencies

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| RevenueCat | 5.x (latest) | Subscription management | SPM: `https://github.com/RevenueCat/purchases-ios` |

**🔴 禁止パッケージ（追加しないこと）:**

| 禁止 | 理由 | Rule |
|------|------|------|
| RC-UI library | 自前 PaywallView 使用 | Rule 20 |
| behavioral tracking SDKs | tracking SDK 禁止 | Rule 17 |
| third-party event tracking | tracking SDK 禁止 | Rule 17 |
| cloud AI SDKs (GPT系) | AI API コスト禁止 | Rule 23 |
| cloud AI SDKs (Gemini系) | AI API コスト禁止 | Rule 23 |
| on-device ML framework (iOS 26+) | ユーザー基盤なし | Rule 23 |
| AppTrackingTransparency | ATT 禁止 | Rule 20b |

Source: [RevenueCat: SPM Installation](https://docs.revenuecat.com/docs/ios-installation) — 「Add the RevenueCat iOS SDK via Swift Package Manager.」

---

## 5. Data Models

### Exercise.swift

```swift
// F-003, F-008
struct Exercise: Codable, Identifiable {
    let id: String                    // e.g. "sf-001"
    let title: String
    let titleJa: String
    let description: String
    let descriptionJa: String
    let durationSeconds: Int          // e.g. 300 (5 min)
    let category: ExerciseCategory    // .grounding, .nervous, .release
    let difficulty: Difficulty        // .beginner, .intermediate
    let hapticPattern: HapticPattern  // .pulse, .wave, .staccato
    let animationType: AnimationType  // .breathe, .shake, .ground
    let isPremium: Bool               // false = F-007 (Day 1-3 free)
    let programDay: Int?              // 1-7 for 7-day, 1-30 for 30-day
}

enum ExerciseCategory: String, Codable { case grounding, nervous, release }
enum Difficulty: String, Codable { case beginner, intermediate }
enum HapticPattern: String, Codable { case pulse, wave, staccato }
enum AnimationType: String, Codable { case breathe, shake, ground }
```

### Program.swift

```swift
// F-002, F-009
struct Program: Codable, Identifiable {
    let id: String                    // "7day" or "30day"
    let title: String
    let titleJa: String
    let totalDays: Int                // 7 or 30
    let exerciseIds: [String]         // ordered list
    let isPremium: Bool
}
```

### UserProgress.swift

```swift
// F-005
struct UserProgress: Codable {
    var currentStreak: Int
    var longestStreak: Int
    var completedExerciseIds: Set<String>
    var lastCompletedDate: Date?
    var totalSessionCount: Int
    var onboardingCompleted: Bool
    var hasPresentedPaywall: Bool
}
```

---

## 6. Services

### SubscriptionService (Protocol + DI)

```swift
// Protocol for DI and testability
protocol SubscriptionServiceProtocol {
    var isPremium: Bool { get }
    func purchase(package: Package) async throws -> CustomerInfo
    func restorePurchases() async throws -> CustomerInfo
    func fetchOfferings() async throws -> Offerings
}

// Production implementation
class SubscriptionService: SubscriptionServiceProtocol {
    static let shared = SubscriptionService()
    func purchase(package: Package) async throws -> CustomerInfo {
        // Purchases.shared.purchase(package:) — Rule 20
    }
    // ...
}
```

### NotificationService

```swift
class NotificationService {
    static let shared = NotificationService()
    func requestAuthorization() async -> Bool
    func scheduleDailyReminder(at time: DateComponents) async
    func cancelAllReminders()
}
```

---

## 7. Storage (UserDefaults)

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `sf.progress.streak` | Int | 0 | 現在の連続日数 |
| `sf.progress.longestStreak` | Int | 0 | 最長ストリーク |
| `sf.progress.completedIds` | [String] | [] | 完了エクサイズIDリスト |
| `sf.progress.lastCompleted` | Date? | nil | 最後の完了日 |
| `sf.progress.totalSessions` | Int | 0 | 総セッション数 |
| `sf.onboarding.completed` | Bool | false | オンボーディング完了フラグ |
| `sf.onboarding.paywallPresented` | Bool | false | ペイウォール表示済みフラグ |
| `sf.settings.notifHour` | Int | 9 | 通知時刻（時） |
| `sf.settings.notifMinute` | Int | 0 | 通知時刻（分） |
| `sf.settings.stressLevel` | Int | 0 | オンボーディング: ストレスレベル |
| `sf.settings.goal` | String | "" | オンボーディング: 目標 |

**Privacy Manifest Required Reason:** CA92.1（UserDefaults）— PrivacyInfo.xcprivacy に申告必須

---

## 8. AI Integration

**🔴 Rule 23: AI API / AI モデル / 外部 AI サービス完全禁止**

| 禁止サービス | 理由 |
|------------|------|
| cloud AI API (GPT系) | コスト: 月収 $29 vs API $300+ |
| cloud AI API (Claude系) | コスト: 月収 $29 vs API $300+ |
| cloud AI API (Gemini系) | コスト: 月収 $29 vs API $300+ |
| on-device ML framework (iOS 26+) | iOS 26+ のみ = ユーザー基盤皆無 |

**代替:** 静的コンテンツ（exercises.json）に 25+ エクサイズをキュレーション済みで収録。バックエンドゼロ。

---

## 9. Networking

**バックエンドなし。外部 API コールなし。**

| 通信 | 用途 | 実装 |
|------|------|------|
| RevenueCat SDK | サブスク検証 | SDK 内部 |
| Apple IAP | 決済 | StoreKit（RC SDK 経由） |

それ以外の HTTP リクエストはゼロ。静的コンテンツは Bundle 内の exercises.json から読み込む。

---

## 10. Notifications

| 項目 | 値 |
|------|-----|
| Type | UNTimeIntervalNotificationTrigger / UNCalendarNotificationTrigger |
| スケジュール方式 | 毎日固定時刻（デフォルト 09:00 JST / 現地時間） |
| 許可取得タイミング | オンボーディング Step 4（F-001） |
| カスタマイズ | Settings 画面で時刻変更可（F-010） |
| Identifier | `sf.daily.reminder` |

```swift
// NotificationService 実装パターン
func scheduleDailyReminder(at time: DateComponents) async {
    let content = UNMutableNotificationContent()
    content.title = NSLocalizedString("notif.title", comment: "")
    content.body = NSLocalizedString("notif.body", comment: "")
    content.sound = .default
    var dc = DateComponents()
    dc.hour = time.hour; dc.minute = time.minute
    let trigger = UNCalendarNotificationTrigger(dateMatching: dc, repeats: true)
    let request = UNNotificationRequest(identifier: "sf.daily.reminder", content: content, trigger: trigger)
    try? await UNUserNotificationCenter.current().add(request)
}
```

---

## 11. Privacy

| 項目 | 値 |
|------|-----|
| PrivacyInfo.xcprivacy | 必須（ITMS-91053 回避） |
| Required Reason API | NSPrivacyAccessedAPICategoryUserDefaults — Reason: CA92.1 |
| ATT | **不使用**（Rule 20b）— NSUserTrackingUsageDescription なし |
| カメラ / マイク | 不使用 |
| 位置情報 | 不使用 |
| HealthKit | 不使用（MVP Out of Scope） |
| iCloud / CloudKit | 不使用 |

---

## 12. Error Handling

| エラー種別 | 発生箇所 | ハンドリング | ユーザーメッセージ |
|----------|---------|------------|----------------|
| RevenueCat Purchase失敗 | PaywallViewModel | Alert表示 + ログ | "Purchase failed. Please try again." |
| RevenueCat Restore失敗 | SettingsViewModel | Alert表示 | "Could not restore purchases." |
| Notification Permission拒否 | NotificationService | Settings 誘導 | "Enable in Settings to get daily reminders." |
| exercises.json 読み込み失敗 | ProgramViewModel | Fatal error（開発時）/ graceful fallback | アプリ内埋め込みのため実運用では発生しない |
| UserDefaults decode失敗 | UserProgress | デフォルト値にフォールバック | — |
