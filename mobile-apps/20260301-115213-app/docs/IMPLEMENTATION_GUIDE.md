# Implementation Guide: Micro Mood

## CRITICAL: Real RevenueCat SDK — NO MOCK

**This app MUST use the real RevenueCat SDK. No mocks. No stubs.**

Source: CLAUDE.md CRITICAL RULE — "Use REAL RevenueCat SDK. NO Mock. NO stub. PaywallView from RevenueCatUI."

```swift
// REQUIRED in Package.swift / SPM dependencies:
// https://github.com/RevenueCat/purchases-ios — version 5.x

import RevenueCat
import RevenueCatUI

// App startup (MicroMoodApp.swift):
Purchases.configure(withAPIKey: "appl_YOUR_KEY_HERE")
Purchases.logLevel = .info
```

---

## Phase 1: Project Setup

### 1.1 Xcode Project

```bash
# Create via Xcode GUI or xcodegen
# Bundle ID: com.anicca.micromood
# Minimum iOS: 17.0
# Swift: 5.9
# Interface: SwiftUI
```

### 1.2 SPM Dependencies

Add in Xcode → Package Dependencies:

| Package | URL | Version |
|---------|-----|---------|
| RevenueCat | https://github.com/RevenueCat/purchases-ios | 5.x |
| Mixpanel | https://github.com/mixpanel/mixpanel-swift | 4.x |

### 1.3 Required Files

```bash
# PrivacyInfo.xcprivacy (Apple WWDC23 requirement)
# Place in: MicroMoodiOS/PrivacyInfo.xcprivacy
# Content: NSPrivacyAccessedAPICategoryUserDefaults + CA92.1

# Info.plist must contain:
# ITSAppUsesNonExemptEncryption = NO
```

---

## Phase 2: CoreData Setup

### 2.1 Schema (MicroMoodCoreData.xcdatamodeld)

```
Entity: MoodEntry
  - id: UUID (required, indexed)
  - timestamp: Date (required, indexed)
  - moodLevel: Integer 16 (required, 1-5)
  - note: String (optional)
  - createdAt: Date (required)

Entity: UserSettings
  - id: String (required, default: "1")
  - hasSeenOnboarding: Boolean (default: false)
  - healthKitEnabled: Boolean (default: false)
```

### 2.2 MoodStore Service

```swift
// Services/MoodStore.swift
import CoreData

class MoodStore: ObservableObject {
    let container: NSPersistentContainer

    func saveMoodEntry(level: Int, note: String?) throws
    func fetchEntries(limit: Int?) -> [MoodEntry]
    func fetchEntriesSince(_ date: Date) -> [MoodEntry]
    func deleteEntry(_ entry: MoodEntry) throws
}
```

---

## Phase 3: RevenueCat Integration (REAL SDK — MANDATORY)

### 3.1 Configure RevenueCat

```swift
// MicroMoodApp.swift
import RevenueCat

@main
struct MicroMoodApp: App {
    init() {
        // REAL RevenueCat SDK — API key from ASC/RC dashboard
        Purchases.configure(withAPIKey: ProcessInfo.processInfo.environment["REVENUECAT_API_KEY"] ?? "PLACEHOLDER")
        Purchases.logLevel = .info

        // Mixpanel (CRITICAL RULE 12 — mandatory)
        Mixpanel.initialize(token: ProcessInfo.processInfo.environment["MIXPANEL_TOKEN"] ?? "PLACEHOLDER")
    }
}
```

### 3.2 SubscriptionManager

```swift
// Services/SubscriptionManager.swift
import RevenueCat

// NOTE: Internal delegate class MUST be named RCPurchasesDelegate (CRITICAL RULE 23)
// NOT PurchasesDelegate (name collision with RC protocol)

@MainActor
class SubscriptionManager: ObservableObject {
    @Published var isPro: Bool = false
    @Published var currentOffering: Offering?

    func checkSubscriptionStatus() async
    func fetchOfferings() async
    func purchase(package: Package) async throws
    func restorePurchases() async throws
}

// Internal delegate:
private class RCPurchasesDelegate: NSObject, PurchasesDelegate {
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        // handle updates
    }
}
```

### 3.3 PaywallView (RevenueCatUI — MANDATORY)

```swift
// Views/PaywallView.swift
import RevenueCatUI
import RevenueCat

struct MicroMoodPaywallView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        // MUST use RevenueCatUI PaywallView — not custom mock
        PaywallView(offering: nil) // nil = current offering
            .onPurchaseCompleted { customerInfo in
                // handle success
                dismiss()
            }
            .onRestoreCompleted { customerInfo in
                dismiss()
            }
    }
}
```

### 3.4 Mixpanel Analytics (CRITICAL RULE 12 — Mandatory)

```swift
// Services/AnalyticsService.swift
import Mixpanel

class AnalyticsService {
    static func trackPaywallViewed(offeringId: String) {
        // CRITICAL RULE 12: paywall_viewed with offering_id property
        Mixpanel.mainInstance().track(event: "paywall_viewed", properties: [
            "offering_id": offeringId
        ])
    }

    static func trackMoodLogged(level: Int) {
        Mixpanel.mainInstance().track(event: "mood_logged", properties: [
            "mood_level": level
        ])
    }

    static func trackCheckInOpened(source: String) {
        Mixpanel.mainInstance().track(event: "checkin_opened", properties: [
            "source": source // "widget", "app", "notification"
        ])
    }
}
```

---

## Phase 4: UI Implementation

### 4.1 HomeView

```swift
// Views/HomeView.swift
struct HomeView: View {
    @StateObject private var vm = HomeViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("How are you today?")
                    .font(.mmHeading)

                MoodPickerView(selectedLevel: $vm.selectedLevel)

                if vm.selectedLevel != nil {
                    NoteInputView(note: $vm.note)
                    LogMoodButton(action: vm.logMood)
                }

                WeeklyChartView(entries: vm.weekEntries)
            }
            .padding(.horizontal, 24)
            .background(Color.mmBackground)
        }
    }
}
```

### 4.2 WidgetKit Extension

```swift
// Widget/MicroMoodWidget.swift
import WidgetKit
import SwiftUI

struct MicroMoodWidget: Widget {
    let kind = "MicroMoodWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MoodTimelineProvider()) { entry in
            MoodWidgetView(entry: entry)
        }
        .configurationDisplayName("Micro Mood")
        .description("Log your mood in one tap")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

// Widget taps deep-link to app via widgetURL:
// micromood://checkin?mood=3
```

### 4.3 HealthKit Integration

```swift
// Services/HealthKitService.swift
import HealthKit

class HealthKitService {
    let store = HKHealthStore()

    func requestPermission() async throws
    func writeMoodSession(date: Date, moodLevel: Int) async throws {
        // Write as HKMindfulSession (mindfulness minutes)
        // Duration: 1 minute per entry
        let type = HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        let sample = HKCategorySample(type: type, value: 0,
                                       start: date, end: date.addingTimeInterval(60))
        try await store.save(sample)
    }
}
```

---

## Phase 5: InsightEngine (Rule-Based v1)

```swift
// Services/InsightEngine.swift
struct WeeklyInsight {
    let bestDay: String        // "Fridays"
    let worstDay: String       // "Mondays"
    let weekAverage: Double    // 3.4
    let pattern: String        // "You feel better on days with notes"
}

class InsightEngine {
    func generateWeeklyInsight(entries: [MoodEntry]) -> WeeklyInsight {
        // Rule 1: Find day-of-week with highest avg mood
        // Rule 2: Find day-of-week with lowest avg mood
        // Rule 3: Compare avg mood on days with notes vs without
        // Rule 4: Calculate weekly average
    }
}
```

---

## Phase 6: Paywall Trigger Points

| Trigger | When | Action |
|---------|------|--------|
| History scroll past 30 days | User swipes to see entry >30 days old | Sheet: PaywallView |
| Insights tab (free) | User taps Insights tab | Inline: blur + PaywallView |
| HealthKit toggle | Free user enables HealthKit | Alert: "Pro feature" → PaywallView |
| Export button | Free user taps Export | Sheet: PaywallView |

---

## Environment Variables (NEVER hardcode)

```
REVENUECAT_API_KEY=appl_xxxx    # App-specific key from RC dashboard
MIXPANEL_TOKEN=xxxx             # From Mixpanel project settings
```

Store in `.env` file (gitignored). Load in MicroMoodApp.swift via ProcessInfo.

---

## Build Commands

```bash
# CRITICAL RULE 4: Fastlane ONLY — no xcodebuild direct calls

# Test
cd MicroMoodiOS && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane test

# Device build
cd MicroMoodiOS && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane build_for_device

# App Store archive
cd MicroMoodiOS && FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build
```

---

## Quality Gates (Pre-Submit)

```bash
# Verify NO mocks in production code
grep -r 'Mock' --include='*.swift' MicroMoodiOS/ | grep -v 'Tests/' | grep -v '.build/' | wc -l
# Must be: 0

# Verify RevenueCat imported
grep -r 'import RevenueCat' --include='*.swift' MicroMoodiOS/ | wc -l
# Must be: >0

# Verify Mixpanel imported
grep -r 'import Mixpanel' --include='*.swift' MicroMoodiOS/ | wc -l
# Must be: >0
```
