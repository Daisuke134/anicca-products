# Implementation Guide: DeskStretch

> **Version:** 1.0 | **Date:** 2026-03-05

---

## 1. Quick Start

```bash
# Prerequisites
# - Xcode 16+
# - iOS 15+ Simulator or device
# - RevenueCat account + API Key
# - Apple Developer account (for signing)

# 1. Create Xcode project
# File > New > Project > App
# Product Name: DeskStretch
# Bundle ID: com.aniccafactory.deskstretch
# Interface: SwiftUI
# Language: Swift

# 2. Add RevenueCat via SPM
# File > Add Package Dependencies
# URL: https://github.com/RevenueCat/purchases-ios.git

# 3. Build & Run
cd DeskStretchios && fastlane build_for_simulator
```

---

## 2. Project Setup

### Xcode Configuration

| Setting | Value |
|---------|-------|
| Deployment Target | iOS 15.0 |
| Swift Version | 5.9+ |
| Bundle ID | `com.aniccafactory.deskstretch` |
| Team | Anicca Factory |
| Signing | Automatic |
| Capabilities | Push Notifications, Background Modes (none needed for MVP) |

### SPM Dependencies

| Package | URL | Version |
|---------|-----|---------|
| RevenueCat | `https://github.com/RevenueCat/purchases-ios.git` | Latest |

**No other dependencies.** AI API / Foundation Models は使用禁止（Rule 21）。

### Info.plist Additions

```xml
<!-- Notification usage description -->
<key>NSUserNotificationsUsageDescription</key>
<string>DeskStretch sends break reminders to help you stretch throughout the day.</string>
```

### PrivacyInfo.xcprivacy

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

---

## 3. File Structure

```
DeskStretchios/
├── DeskStretch/
│   ├── App/
│   │   ├── DeskStretchApp.swift
│   │   ├── ContentView.swift
│   │   └── AppState.swift
│   ├── Views/
│   │   ├── Onboarding/
│   │   │   ├── OnboardingContainerView.swift
│   │   │   ├── ProblemEmpathyView.swift
│   │   │   ├── PainAreaSelectionView.swift
│   │   │   └── PaywallView.swift
│   │   ├── Timer/
│   │   │   ├── TimerView.swift
│   │   │   └── TimerSettingsSheet.swift
│   │   ├── Stretch/
│   │   │   ├── StretchLibraryView.swift
│   │   │   ├── StretchSessionView.swift
│   │   │   └── StretchDetailView.swift
│   │   ├── Progress/
│   │   │   └── ProgressDashboardView.swift
│   │   └── Settings/
│   │       └── SettingsView.swift
│   ├── Models/
│   │   ├── StretchExercise.swift
│   │   ├── PainArea.swift
│   │   ├── BreakSchedule.swift
│   │   ├── UserProgress.swift
│   │   └── StretchSession.swift
│   ├── Services/
│   │   ├── StretchRoutineService.swift
│   │   ├── NotificationService.swift
│   │   ├── SubscriptionService.swift
│   │   ├── ProgressService.swift
│   │   └── StretchLibraryService.swift
│   ├── Components/
│   │   ├── PrimaryButton.swift
│   │   ├── SecondaryButton.swift
│   │   ├── PainAreaCard.swift
│   │   ├── ExerciseCard.swift
│   │   ├── TimerRing.swift
│   │   ├── StreakBadge.swift
│   │   └── FilterChip.swift
│   ├── Extensions/
│   │   ├── Date+Extensions.swift
│   │   └── Notification+Extensions.swift
│   └── Resources/
│       ├── StretchLibrary.json
│       ├── Localizable.xcstrings
│       ├── Assets.xcassets/
│       └── PrivacyInfo.xcprivacy
├── DeskStretchTests/
│   ├── Services/
│   │   ├── StretchRoutineServiceTests.swift
│   │   ├── ProgressServiceTests.swift
│   │   ├── NotificationServiceTests.swift
│   │   └── SubscriptionServiceTests.swift
│   └── Models/
│       ├── StretchExerciseTests.swift
│       ├── UserProgressTests.swift
│       └── BreakScheduleTests.swift
├── maestro/
│   ├── 01-onboarding.yaml
│   ├── 02-timer-stretch-flow.yaml
│   └── 03-paywall.yaml
└── fastlane/
    └── Fastfile
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Models + Services)

#### 4.1.1 PainArea Model

```swift
enum PainArea: String, Codable, CaseIterable, Identifiable {
    case neck
    case back
    case shoulders
    case wrists

    var id: String { rawValue }

    var displayName: String {
        // Localized via String Catalogs
        switch self {
        case .neck: return String(localized: "Neck")
        case .back: return String(localized: "Lower Back")
        case .shoulders: return String(localized: "Shoulders")
        case .wrists: return String(localized: "Wrists")
        }
    }

    var sfSymbol: String {
        switch self {
        case .neck: return "person.crop.circle"
        case .back: return "figure.seated.side"
        case .shoulders: return "figure.arms.open"
        case .wrists: return "hand.raised"
        }
    }
}
```

#### 4.1.2 StretchExercise Model

```swift
struct StretchExercise: Codable, Identifiable {
    let id: String
    let name: String
    let category: PainArea
    let instructions: String
    let durationSeconds: Int
    let sfSymbol: String
    let isPremium: Bool
}
```

#### 4.1.3 UserProgress Model

```swift
struct UserProgress: Codable {
    var todayCount: Int
    var streak: Int
    var totalSessions: Int
    var totalMinutes: Int
    var lastActiveDate: Date?
    var weekHistory: [Date: Int]  // date → session count
}
```

#### 4.1.4 BreakSchedule Model

```swift
struct BreakSchedule: Codable {
    var intervalMinutes: Int  // 30, 45, 60, 90
    var workHoursStart: DateComponents  // hour: 9, minute: 0
    var workHoursEnd: DateComponents    // hour: 18, minute: 0
    var isEnabled: Bool
}
```

#### 4.1.5 MVVM ViewModels + AppState（コーディネーター）

```swift
// --- Domain-specific ViewModels ---

@Observable
class TimerViewModel {
    var breakSchedule: BreakSchedule = .default
    var remainingTime: TimeInterval = 0
    var isRunning: Bool = false

    private let notificationService: NotificationService
    init(notificationService: NotificationService) {
        self.notificationService = notificationService
    }
}

@Observable
class StretchViewModel {
    var currentSession: StretchSession? = nil
    var selectedPainAreas: Set<PainArea> = []
    var sessionHistory: [StretchSession] = []

    private let routineService: StretchRoutineService
    init(routineService: StretchRoutineService) {
        self.routineService = routineService
    }
}

@Observable
class ProgressViewModel {
    var userProgress: UserProgress = .empty
    var todayCount: Int { userProgress.todayCount }
    var currentStreak: Int { userProgress.streak }

    private let progressService: ProgressService
    init(progressService: ProgressService) {
        self.progressService = progressService
    }
}

// --- Thin Coordinator ---

@Observable
class AppState {
    var isPremium: Bool = false
    var hasCompletedOnboarding: Bool = false

    let timerVM: TimerViewModel
    let stretchVM: StretchViewModel
    let progressVM: ProgressViewModel

    init(timerVM: TimerViewModel, stretchVM: StretchViewModel, progressVM: ProgressViewModel) {
        self.timerVM = timerVM
        self.stretchVM = stretchVM
        self.progressVM = progressVM
    }
}
```

---

### Phase 2: Services

#### 4.2.1 ProgressService

```swift
final class ProgressService {
    private let defaults = UserDefaults.standard
    private let key = "userProgress"

    func load() -> UserProgress {
        guard let data = defaults.data(forKey: key),
              let progress = try? JSONDecoder().decode(UserProgress.self, from: data)
        else { return .empty }
        return progress
    }

    func save(_ progress: UserProgress) {
        let data = try? JSONEncoder().encode(progress)
        defaults.set(data, forKey: key)
    }

    func recordSession(duration: Int, current: UserProgress) -> UserProgress {
        let today = Calendar.current.startOfDay(for: Date())
        let lastActive = current.lastActiveDate.map { Calendar.current.startOfDay(for: $0) }

        let isFirstToday = lastActive != today
        let isConsecutive = lastActive == Calendar.current.date(byAdding: .day, value: -1, to: today)

        var updated = current
        updated.todayCount = isFirstToday ? 1 : current.todayCount + 1
        updated.streak = isFirstToday ? (isConsecutive ? current.streak + 1 : 1) : current.streak
        updated.totalSessions = current.totalSessions + 1
        updated.totalMinutes = current.totalMinutes + duration
        updated.lastActiveDate = Date()

        var weekHistory = current.weekHistory
        weekHistory[today] = (weekHistory[today] ?? 0) + 1
        updated.weekHistory = weekHistory

        return updated
    }
}
```

#### 4.2.2 NotificationService

```swift
final class NotificationService {
    private let center = UNUserNotificationCenter.current()

    func requestPermission() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func scheduleBreakReminder(intervalMinutes: Int, workHoursStart: DateComponents, workHoursEnd: DateComponents) {
        center.removeAllPendingNotificationRequests()

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Time to stretch!")
        content.body = String(localized: "Take a quick break and stretch your muscles.")
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(intervalMinutes * 60),
            repeats: true
        )

        let request = UNNotificationRequest(
            identifier: "breakReminder",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }
}
```

#### 4.2.3 SubscriptionService (RevenueCat — Protocol 化)

**Protocol 化により Mock 差し替えでテスト可能にする。**

```swift
import RevenueCat

// Protocol（テスト時に MockSubscriptionService を DI）
protocol SubscriptionServiceProtocol {
    var isPremium: Bool { get async }
    func configure(apiKey: String)
    func checkPremiumStatus() async -> Bool
    func getOfferings() async -> Offerings?
    func purchase(package: Package) async throws -> Bool
    func restorePurchases() async throws -> Bool
}

// Production 実装
final class SubscriptionService: SubscriptionServiceProtocol {
    static let shared = SubscriptionService()

    var isPremium: Bool {
        get async { await checkPremiumStatus() }
    }

    func configure(apiKey: String) {
        Purchases.configure(withAPIKey: apiKey)
    }

    func checkPremiumStatus() async -> Bool {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            return customerInfo.entitlements["premium"]?.isActive == true
        } catch {
            return false
        }
    }

    func getOfferings() async -> Offerings? {
        try? await Purchases.shared.offerings()
    }

    func purchase(package: Package) async throws -> Bool {
        let result = try await Purchases.shared.purchase(package: package)
        return result.customerInfo.entitlements["premium"]?.isActive == true
    }

    func restorePurchases() async throws -> Bool {
        let customerInfo = try await Purchases.shared.restorePurchases()
        return customerInfo.entitlements["premium"]?.isActive == true
    }
}
```

**CRITICAL:** Production では real RevenueCat SDK を使用。テスト時のみ `MockSubscriptionService` を DI。

#### 4.2.4 StretchRoutineService（静的フィルタリング — Rule 21: AI API 禁止）

**AI API（Foundation Models 含む）は使用禁止。StretchLibrary.json から静的フィルタリングのみ。**

```swift
import Foundation

final class StretchRoutineService {
    private let libraryService: StretchLibraryService

    init(libraryService: StretchLibraryService) {
        self.libraryService = libraryService
    }

    /// 痛みエリア + 履歴ベースでルーティンを静的フィルタリング
    func selectRoutine(
        painAreas: Set<PainArea>,
        history: [StretchSession],
        exerciseCount: Int = 3
    ) -> [StretchExercise] {
        let allExercises = libraryService.exercises(for: painAreas)
        // 3日以内の重複を除外（バリエーション確保）
        let recentIds = Set(history.suffix(3).flatMap(\.exercises).map(\.id))
        let available = allExercises.filter { !recentIds.contains($0.id) }

        if available.count >= exerciseCount {
            return Array(available.shuffled().prefix(exerciseCount))
        }
        return Array(allExercises.shuffled().prefix(exerciseCount))
    }
}
```

#### 4.2.5 StretchLibraryService

```swift
final class StretchLibraryService {
    private var allExercises: [StretchExercise] = []

    func loadFromBundle() {
        guard let url = Bundle.main.url(forResource: "StretchLibrary", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let exercises = try? JSONDecoder().decode([StretchExercise].self, from: data)
        else { return }
        allExercises = exercises
    }

    func exercises(for painAreas: Set<PainArea>) -> [StretchExercise] {
        allExercises.filter { painAreas.contains($0.category) }
    }

    func allCategories() -> [PainArea] {
        PainArea.allCases
    }

    var all: [StretchExercise] { allExercises }
}
```

---

### Phase 3: Views (Onboarding)

#### 4.3.1 DeskStretchApp (Entry Point)

**API Key は xcconfig で管理する。ハードコード禁止。**

```
DeskStretchios/
├── Config/
│   ├── Debug.template.xcconfig    # テンプレート（コミット可、秘密値なし）
│   ├── Release.template.xcconfig  # テンプレート（コミット可、秘密値なし）
│   ├── Debug.local.xcconfig       # 実値（.gitignore、秘密値あり）
│   ├── Release.local.xcconfig     # 実値（.gitignore、秘密値あり）
│   └── .gitignore                 # *.local.xcconfig をコミットしない
```

**Info.plist に `$(REVENUECAT_API_KEY)` を追加:**
```xml
<key>RevenueCatAPIKey</key>
<string>$(REVENUECAT_API_KEY)</string>
```

```swift
@main
struct DeskStretchApp: App {
    @State private var appState: AppState

    init() {
        // API Key を xcconfig → Info.plist 経由で取得（ハードコード禁止）
        guard let apiKey = Bundle.main.infoDictionary?["RevenueCatAPIKey"] as? String,
              !apiKey.isEmpty else {
            fatalError("RevenueCatAPIKey not configured in xcconfig")
        }

        // MVVM DI: 各 ViewModel にサービスを注入
        let subscriptionService: SubscriptionServiceProtocol = SubscriptionService.shared
        subscriptionService.configure(apiKey: apiKey)

        let progressService = ProgressService()
        let libraryService = StretchLibraryService()
        let routineService = StretchRoutineService(libraryService: libraryService)
        let notificationService = NotificationService()

        let timerVM = TimerViewModel(notificationService: notificationService)
        let stretchVM = StretchViewModel(routineService: routineService)
        let progressVM = ProgressViewModel(progressService: progressService)

        _appState = State(initialValue: AppState(
            subscriptionService: subscriptionService,
            timerVM: timerVM,
            stretchVM: stretchVM,
            progressVM: progressVM
        ))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}
```

#### 4.3.2 ContentView (Router)

```swift
struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        if !appState.hasCompletedOnboarding {
            OnboardingContainerView()
        } else {
            MainTabView()
        }
    }
}
```

#### 4.3.3 PaywallView (Self-Built — Rule 20)

```swift
struct PaywallView: View {
    @Environment(AppState.self) private var appState
    @State private var offerings: Offerings?
    @State private var isPurchasing = false
    let subscriptionService: SubscriptionServiceProtocol
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            // Header
            Text("Unlock Your Full Stretch Routine")
                .font(.title)
                .bold()
                .multilineTextAlignment(.center)

            // Benefits list
            VStack(alignment: .leading, spacing: 12) {
                BenefitRow(text: "Unlimited stretches")
                BenefitRow(text: "Personalized routines for your pain areas")
                BenefitRow(text: "All pain areas")
                BenefitRow(text: "Custom schedules")
                BenefitRow(text: "Progress tracking")
            }

            Spacer()

            // Subscription buttons
            if let offering = offerings?.current {
                if let annual = offering.annual {
                    PrimaryButton(title: "Annual \(annual.localizedPriceString)/yr — Save 37%") {
                        Task { await purchase(annual) }
                    }
                }
                if let monthly = offering.monthly {
                    SecondaryButton(title: "Monthly \(monthly.localizedPriceString)/mo") {
                        Task { await purchase(monthly) }
                    }
                }
            }

            Text("7-day free trial")
                .font(.footnote)
                .foregroundColor(.secondary)

            // Footer
            HStack {
                Button("Maybe Later") { onDismiss() }
                    .font(.subheadline)
                    .accessibilityIdentifier("paywall_maybe_later")

                Spacer()

                Button("Restore") {
                    Task { await restore() }
                }
                .font(.subheadline)
            }

            HStack {
                Link("Terms", destination: URL(string: "https://example.com/terms")!)
                Text("·")
                Link("Privacy", destination: URL(string: "https://example.com/privacy")!)
            }
            .font(.caption)
            .foregroundColor(.tertiary)
        }
        .padding(.horizontal)
        .padding(.vertical, 32)
        .task { await loadOfferings() }
    }

    private func loadOfferings() async {
        offerings = await subscriptionService.getOfferings()
    }

    private func purchase(_ package: Package) async {
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            let success = try await subscriptionService.purchase(package: package)
            if success {
                appState.isPremium = true
                onDismiss()
            }
        } catch {
            // Handle error (show alert)
        }
    }

    private func restore() async {
        do {
            let success = try await subscriptionService.restorePurchases()
            if success {
                appState.isPremium = true
                onDismiss()
            }
        } catch {
            // Handle error
        }
    }
}
```

---

### Phase 4: Views (Main App)

#### 4.4.1 TimerView

```swift
// Core timer view pseudo-code
// - Circular ring showing progress
// - Countdown text (minutes:seconds)
// - "Stretch Now" button (starts session immediately)
// - "Pause/Resume" toggle
// - Uses Timer.publish for UI updates
// - Actual break reminder via NotificationService (not Timer)
```

#### 4.4.2 StretchSessionView

```swift
// Modal session view pseudo-code
// - Receives [StretchExercise] array
// - Shows one exercise at a time with countdown
// - Auto-advances on countdown completion
// - Skip button to advance manually
// - Close button to exit early
// - On completion: call ProgressService.recordSession()
// - Haptic feedback at 3-2-1 and on completion
```

#### 4.4.3 StretchLibraryView

```swift
// Library view pseudo-code
// - Horizontal filter chips for pain area categories
// - List of ExerciseCard rows
// - Lock icon on premium exercises for free users
// - Tap premium exercise → show paywall
// - Tap free exercise → show detail or start session
```

#### 4.4.4 ProgressDashboardView

```swift
// Progress view pseudo-code
// - 2x2 grid: Today's count, Current streak, Total sessions, Total minutes
// - Weekly history bar (M-T-W-T-F-S-S with filled/empty dots)
// - Streak badge with fire emoji when streak > 0
```

---

### Phase 5: Stretch Library Data

#### 4.5.1 StretchLibrary.json Structure

```json
[
    {
        "id": "neck_rolls",
        "name": "Neck Rolls",
        "category": "neck",
        "instructions": "Slowly roll your head in a circle. 5 times clockwise, then 5 times counter-clockwise. Keep shoulders relaxed.",
        "durationSeconds": 30,
        "sfSymbol": "arrow.clockwise.circle",
        "isPremium": false
    },
    {
        "id": "chin_tucks",
        "name": "Chin Tucks",
        "category": "neck",
        "instructions": "Pull your chin straight back, creating a double chin. Hold for 5 seconds. Repeat 5 times.",
        "durationSeconds": 25,
        "sfSymbol": "person.crop.circle",
        "isPremium": false
    }
    // ... 20+ exercises total (5+ per category)
]
```

**Exercise Distribution:**

| Category | Free | Premium | Total |
|----------|------|---------|-------|
| Neck | 3 | 3 | 6 |
| Back | 3 | 3 | 6 |
| Shoulders | 3 | 3 | 6 |
| Wrists | 3 | 3 | 6 |
| **Total** | **12** | **12** | **24** |

---

## 5. State Management（MVVM）

### ViewModel + Coordinator パターン

```
AppState（薄いコーディネーター）
    │
    ├── TimerView → @Environment(TimerViewModel.self)
    │   └── TimerViewModel → NotificationService → UNNotificationCenter
    │
    ├── StretchViews → @Environment(StretchViewModel.self)
    │   └── StretchViewModel → StretchRoutineService → StretchLibraryService
    │
    ├── ProgressView → @Environment(ProgressViewModel.self)
    │   └── ProgressViewModel → ProgressService → UserDefaults
    │
    ├── Paywall/Settings → @Environment(AppState.self)
    │   └── AppState.isPremium ← SubscriptionServiceProtocol
    │
    └── UserDefaults persists between launches
        ├── selectedPainAreas（StretchViewModel）
        ├── breakSchedule（TimerViewModel）
        ├── userProgress（ProgressViewModel）
        └── hasCompletedOnboarding（AppState）
```

---

## 6. Error Handling

| Scenario | Handling |
|----------|---------|
| RevenueCat purchase fails | Show alert with error message, do not crash |
| StretchLibrary.json 読み込み失敗 | Debug: fatalError、Release: 空ライブラリ |
| Notification permission denied | Show in-app timer, prompt to enable in Settings |
| StretchLibrary.json missing | Fatal error in debug, empty library in release |
| UserDefaults read fails | Return default values |

---

## 7. Testing

### Unit Test Targets

| Test File | Tests |
|-----------|-------|
| `ProgressServiceTests.swift` | streak calculation, session recording, day boundary |
| `StretchRoutineServiceTests.swift` | フィルタリングロジック, 履歴重複排除, exercise count |
| `NotificationServiceTests.swift` | scheduling, cancellation, work hours filtering |
| `BreakScheduleTests.swift` | interval validation, work hours logic |
| `StretchExerciseTests.swift` | JSON decoding, category filtering |

### E2E Test Scenarios (Maestro)

| Scenario | File |
|----------|------|
| Complete onboarding flow | `01-onboarding.yaml` |
| Timer → Stretch → Complete | `02-timer-stretch-flow.yaml` |
| Paywall display + Maybe Later | `03-paywall.yaml` |

---

## 8. Localization

### String Catalogs (.xcstrings)

All user-facing strings use `String(localized:)` macro:

```swift
Text(String(localized: "Time to stretch!"))
Text(String(localized: "Break Interval"))
```

### Localized Content

| Category | en-US | ja |
|----------|-------|----|
| Exercise names | English names | Japanese names |
| Instructions | English text | Japanese text |
| UI labels | English | Japanese |
| Paywall text | English | Japanese |

---

## 9. Performance

| Optimization | Detail |
|-------------|--------|
| Lazy loading | `LazyVStack` for exercise library list |
| Image caching | N/A (SF Symbols are system-cached) |
| Timer efficiency | `Timer.publish` for UI only, `UNNotification` for actual reminders |
| Routine selection | 静的フィルタリング（JSON ベース）、< 500ms |
| App launch | Minimal init, defer data loading |

---

## 10. Common Pitfalls

| Pitfall | Prevention |
|---------|-----------|
| Using RevenueCatUI | **FORBIDDEN (Rule 20).** Build PaywallView from scratch |
| Adding Mixpanel/analytics | **FORBIDDEN (Rule 17).** No analytics SDK |
| Adding ATT dialog | **FORBIDDEN (Rule 20b).** No AppTrackingTransparency |
| Background timer draining battery | Use scheduled notifications, NOT background timer |
| Hardcoding strings | Use String Catalogs for all user-facing text |
| Mock RevenueCat in production | Use REAL RevenueCat SDK. `Purchases.shared.purchase(package:)` |
| AI API / Foundation Models 使用 | **FORBIDDEN (Rule 21).** 静的フィルタリングのみ使用 |
| Forgetting PrivacyInfo.xcprivacy | Include CA92.1 for UserDefaults. Without it = ITMS-91061 rejection |
