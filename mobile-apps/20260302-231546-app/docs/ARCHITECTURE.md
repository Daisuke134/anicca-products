# Architecture: SleepRitual

**App**: SleepRitual
**Bundle ID**: com.anicca.sleepritual
**Pattern**: MVVM + SwiftUI
**Date**: 2026-03-02

---

## 1. Architecture Pattern

**MVVM (Model-View-ViewModel)** — standard SwiftUI pattern.

```
┌─────────────────────────────────────────────┐
│                    Views                     │
│  OnboardingView → PaywallView → HomeView     │
│  RitualBuilderView → SettingsView            │
└──────────────┬──────────────────────────────┘
               │ @StateObject / @ObservedObject
┌──────────────▼──────────────────────────────┐
│                 ViewModels                   │
│  RitualViewModel  StreakViewModel            │
│  OnboardingViewModel  PaywallViewModel       │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│            Models + Services                 │
│  RitualStep  StreakRecord                   │
│  RitualStore (UserDefaults)                  │
│  NotificationService                         │
│  SubscriptionService (RevenueCat)            │
│  AnalyticsService (Mixpanel)                 │
└─────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
SleepRitualios/
├── App/
│   ├── SleepRitualApp.swift       ← @main entry point
│   └── AppDelegate.swift          ← RevenueCat + Mixpanel init
├── Models/
│   ├── RitualStep.swift           ← Codable struct
│   └── StreakRecord.swift         ← Codable struct
├── Views/
│   ├── Onboarding/
│   │   ├── OnboardingView.swift
│   │   └── PaywallView.swift      ← soft paywall, [Maybe Later]
│   ├── Home/
│   │   ├── HomeView.swift
│   │   └── StreakBadgeView.swift
│   ├── Ritual/
│   │   ├── RitualBuilderView.swift
│   │   └── RitualStepRow.swift
│   └── Settings/
│       └── SettingsView.swift
├── ViewModels/
│   ├── RitualViewModel.swift
│   ├── StreakViewModel.swift
│   └── PaywallViewModel.swift
├── Services/
│   ├── RitualStore.swift          ← UserDefaults CRUD
│   ├── NotificationService.swift  ← UserNotifications
│   ├── SubscriptionService.swift  ← RevenueCat wrapper
│   └── AnalyticsService.swift     ← Mixpanel wrapper
└── Resources/
    ├── Assets.xcassets
    ├── Info.plist
    └── PrivacyInfo.xcprivacy
```

---

## 3. Data Layer

### Persistence: UserDefaults Only (No Backend)

```swift
// RitualStore.swift
struct RitualStore {
    private let defaults = UserDefaults.standard
    private let stepsKey = "ritual_steps"
    private let streakKey = "streak_record"
    private let completionKey = "today_completion"

    func saveSteps(_ steps: [RitualStep])
    func loadSteps() -> [RitualStep]
    func saveStreak(_ record: StreakRecord)
    func loadStreak() -> StreakRecord
}
```

### Data Models

```swift
struct RitualStep: Codable, Identifiable {
    let id: UUID
    var name: String
    var isCompleted: Bool
}

struct StreakRecord: Codable {
    var currentStreak: Int
    var longestStreak: Int
    var lastCompletedDate: Date?
    var graceUsedThisWeek: Bool
}
```

---

## 4. Subscription Layer (RevenueCat)

```
RevenueCat SDK
    ├── Purchases.configure(withAPIKey:) → App startup
    ├── Purchases.shared.getOfferings()  → PaywallViewModel
    ├── Purchases.shared.purchase(package:) → PaywallView
    └── Purchases.shared.customerInfo    → SubscriptionService
```

**Critical**: API key read from `Info.plist["RevenueCatAPIKey"]` — NOT from environment variables.

---

## 5. Notifications

```
UserNotifications
    ├── Request authorization (onboarding completion)
    ├── Schedule daily notification (UNCalendarNotificationTrigger)
    └── Cancel + reschedule on time change (SettingsView)
```

---

## 6. Analytics Events

| Event | When |
|-------|------|
| `onboarding_started` | App first launch |
| `onboarding_completed` | Paywall shown |
| `paywall_viewed` | PaywallView appears |
| `subscription_started` | Purchase success |
| `ritual_completed` | All steps checked off |
| `streak_milestone` | 3, 7, 14, 30 days |

---

## 7. App Entry Flow

```
SleepRitualApp.init()
    ├── Purchases.configure(withAPIKey: Info.plist["RevenueCatAPIKey"])
    ├── Mixpanel.initialize(token: Info.plist["MixpanelToken"])
    └── ContentView
            ├── hasCompletedOnboarding? → HomeView
            └── NO → OnboardingView → PaywallView
```
