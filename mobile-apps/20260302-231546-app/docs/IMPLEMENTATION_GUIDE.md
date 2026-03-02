# Implementation Guide: SleepRitual

**App**: SleepRitual
**Bundle ID**: com.anicca.sleepritual
**Date**: 2026-03-02

---

## Prerequisites

Before starting implementation:
1. RevenueCat SDK added via SPM (`https://github.com/RevenueCat/purchases-ios`)
2. Mixpanel SDK added via SPM
3. `Info.plist` contains `RevenueCatAPIKey` and `MixpanelToken`
4. `PrivacyInfo.xcprivacy` created with UserDefaults declaration
5. `Info.plist` contains `ITSAppUsesNonExemptEncryption = NO`

---

## Phase 1: Project Setup (30 min)

### Task 1.1: Xcode Project Creation
- Create new iOS App in Xcode
- Bundle ID: `com.anicca.sleepritual`
- Target: iOS 17.0
- Interface: SwiftUI
- Language: Swift

### Task 1.2: SPM Dependencies
Add via File → Add Package Dependencies:
```
RevenueCat iOS SDK: https://github.com/RevenueCat/purchases-ios
Version: ≥ 5.0.0

Mixpanel: https://github.com/mixpanel/mixpanel-swift
Version: ≥ 4.0.0
```

**RevenueCat SDK** (NOT Mock): `import RevenueCat` and `Purchases.configure(withAPIKey:)`.

### Task 1.3: Info.plist Keys
```xml
<key>RevenueCatAPIKey</key>
<string>$(REVENUECAT_API_KEY)</string>
<key>MixpanelToken</key>
<string>$(MIXPANEL_TOKEN)</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
<key>NSUserNotificationsUsageDescription</key>
<string>We'll remind you when it's time for your sleep ritual.</string>
```

---

## Phase 2: Models (20 min)

### Task 2.1: RitualStep.swift
```swift
struct RitualStep: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var isCompleted: Bool = false

    init(id: UUID = UUID(), name: String, isCompleted: Bool = false) {
        self.id = id; self.name = name; self.isCompleted = isCompleted
    }
}
```

### Task 2.2: StreakRecord.swift
```swift
struct StreakRecord: Codable {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var lastCompletedDate: Date? = nil
    var graceUsedThisWeek: Bool = false
}
```

---

## Phase 3: Services (40 min)

### Task 3.1: RitualStore.swift (UserDefaults)
CRUD operations for `[RitualStep]` and `StreakRecord` using `JSONEncoder/Decoder`.

### Task 3.2: NotificationService.swift
- `requestAuthorization()` → `UNUserNotificationCenter`
- `scheduleReminder(at hour: Int, minute: Int)` → `UNCalendarNotificationTrigger`
- `cancelAllReminders()`

### Task 3.3: SubscriptionService.swift (RevenueCat SDK — NOT Mock)
```swift
import RevenueCat

class SubscriptionService: ObservableObject {
    @Published var isPro: Bool = false
    @Published var offerings: Offerings?

    func configure() {
        // API key from Info.plist, NOT ProcessInfo.processInfo.environment
        let apiKey = Bundle.main.infoDictionary?["RevenueCatAPIKey"] as? String ?? ""
        Purchases.configure(withAPIKey: apiKey)
    }

    func fetchOfferings() async
    func purchase(package: Package) async throws
    func restorePurchases() async throws
    func checkSubscriptionStatus() async
}
```

**CRITICAL**: Read API key from `Info.plist` via `Bundle.main.infoDictionary`. Never use `ProcessInfo.processInfo.environment`.

### Task 3.4: AnalyticsService.swift (Mixpanel)
Wrapper for Mixpanel events. Token from `Info.plist["MixpanelToken"]`.

---

## Phase 4: ViewModels (30 min)

### Task 4.1: RitualViewModel.swift
- `@Published var steps: [RitualStep]`
- `loadSteps()`, `toggleStep(_ step:)`, `addStep(name:)`, `deleteStep(at:)`, `reorderSteps(from:to:)`
- `var allCompleted: Bool` → computed property
- `resetForNewDay()` called at midnight check

### Task 4.2: StreakViewModel.swift
- `@Published var streak: StreakRecord`
- `processCompletion()` → increment or break streak
- `checkForNewDay()` → reset step completion

### Task 4.3: PaywallViewModel.swift
- `@Published var offerings: Offerings?`
- `purchase(package:)`, `restore()`

---

## Phase 5: Views (2 hours)

### Task 5.1: SleepRitualApp.swift
```swift
@main struct SleepRitualApp: App {
    init() {
        // RevenueCat: API key from Info.plist
        SubscriptionService.shared.configure()
        // Mixpanel: token from Info.plist
        AnalyticsService.shared.configure()
    }
    var body: some Scene { WindowGroup { ContentView() } }
}
```

### Task 5.2: OnboardingView.swift (3 screens + PaywallView)
TabView with `.tabViewStyle(.page)`. Last page = PaywallView.

### Task 5.3: PaywallView.swift (Soft Paywall — CRITICAL)
- Show `offerings` from RevenueCat SDK (NOT hardcoded)
- Two packages: monthly (`$rc_monthly`) + annual (`$rc_annual`)
- `[Maybe Later]` button: dismisses without purchase
- `[Start Free Trial]` → `Purchases.shared.purchase(package:)`
- RevenueCatUI is PROHIBITED per CLAUDE.md Rule 19 — use custom SwiftUI

### Task 5.4: HomeView.swift
- StreakBadgeView at top
- List of today's ritual steps (RitualStepRow)
- Completion animation

### Task 5.5: RitualBuilderView.swift
- `List` with `ForEach` + `.onMove` + `.onDelete`
- Inline add step row
- Pro limit enforcement (max 3 free, 5 pro)

### Task 5.6: SettingsView.swift
- Notification time picker
- Subscription status from `SubscriptionService`
- Restore purchases button

---

## Phase 6: Polish (30 min)

### Task 6.1: PrivacyInfo.xcprivacy
```xml
<key>NSPrivacyAccessedAPITypes</key>
<array>
  <dict>
    <key>NSPrivacyAccessedAPIType</key>
    <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
    <key>NSPrivacyAccessedAPITypeReasons</key>
    <array><string>CA92.1</string></array>
  </dict>
</array>
```

### Task 6.2: App Icons
Generate with app-icon skill or Koubou.

### Task 6.3: Launch Screen
`LaunchScreen.storyboard` with dark background + moon icon.

---

## Verification Checklist

| Check | Command |
|-------|---------|
| Build succeeds | `xcodebuild -scheme SleepRitual build` |
| No Mock in production | `grep -r 'Mock' --include='*.swift' . | grep -v Tests/ | wc -l` should = 0 |
| RevenueCat import exists | `grep -r 'import RevenueCat' --include='*.swift' . | wc -l` should > 0 |
| RevenueCatUI not used | `grep -r 'import RevenueCatUI' --include='*.swift' . | wc -l` should = 0 |
| API key from Info.plist | `grep -r 'ProcessInfo' --include='*.swift' . | wc -l` should = 0 |
