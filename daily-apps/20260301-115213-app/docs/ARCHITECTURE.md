# Architecture: Micro Mood

## Overview

Offline-first iOS app. No backend required for v1. All data lives on device.

```
┌─────────────────────────────────────────────┐
│                  iOS App                     │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Views  │  │ViewModels│  │  Services │  │
│  │ SwiftUI │→ │@Observable│→ │ Business  │  │
│  │         │  │          │  │  Logic    │  │
│  └─────────┘  └──────────┘  └─────┬─────┘  │
│                                   │         │
│  ┌────────────────────────────────▼──────┐  │
│  │              CoreData Store           │  │
│  │         (MoodEntry, UserSettings)     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─────────────┐  ┌──────────┐             │
│  │  WidgetKit  │  │HealthKit │             │
│  │  Extension  │  │ (write)  │             │
│  └─────────────┘  └──────────┘             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     RevenueCat SDK (Purchases)      │   │
│  │   + RevenueCatUI (PaywallView)      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Mixpanel SDK (Analytics)        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
MicroMoodiOS/
├── App/
│   ├── MicroMoodApp.swift          # @main, RevenueCat.configure, Mixpanel.initialize
│   └── AppDelegate.swift           # (if needed for background tasks)
├── Views/
│   ├── HomeView.swift              # Main tab: today's check-in + recent moods
│   ├── CheckInView.swift           # Mood selection + optional note
│   ├── HistoryView.swift           # Scrollable list of past entries + 7-day chart
│   ├── InsightsView.swift          # Pro: AI weekly pattern report
│   ├── OnboardingView.swift        # 3-screen onboarding
│   ├── PaywallView.swift           # RevenueCatUI PaywallView wrapper
│   └── SettingsView.swift          # Export, HealthKit toggle
├── Models/
│   ├── MoodEntry.swift             # CoreData NSManagedObject subclass
│   ├── MoodLevel.swift             # Enum: .great .good .okay .bad .awful
│   └── SubscriptionStatus.swift    # Enum: .free .pro
├── Services/
│   ├── MoodStore.swift             # CoreData CRUD for MoodEntry
│   ├── SubscriptionManager.swift   # RevenueCat wrapper (REAL SDK, no mock)
│   ├── InsightEngine.swift         # Rule-based weekly pattern calculation
│   ├── HealthKitService.swift      # Write mood to HKMindfulSession
│   └── AnalyticsService.swift      # Mixpanel events
├── ViewModels/
│   ├── HomeViewModel.swift
│   ├── CheckInViewModel.swift
│   └── InsightsViewModel.swift
├── Resources/
│   ├── Assets.xcassets             # App icon + colors
│   └── Localizable.strings         # en + ja
├── Widget/
│   ├── MicroMoodWidget.swift       # WidgetKit extension
│   └── WidgetBundle.swift
├── MicroMoodCoreData.xcdatamodeld  # CoreData schema
├── PrivacyInfo.xcprivacy           # NSPrivacyAccessedAPICategoryUserDefaults CA92.1
└── Info.plist                      # ITSAppUsesNonExemptEncryption = NO
```

## CoreData Schema

### MoodEntry

| Attribute | Type | Constraints |
|-----------|------|-------------|
| id | UUID | Required, indexed |
| timestamp | Date | Required, indexed |
| moodLevel | Int16 | Required, 1-5 |
| note | String | Optional, max 280 chars |
| createdAt | Date | Required |

### UserSettings (singleton, id="1")

| Attribute | Type | Default |
|-----------|------|---------|
| id | String | "1" |
| hasSeenOnboarding | Bool | false |
| healthKitEnabled | Bool | false |

## External SDKs

| SDK | Version | Purpose | Source |
|-----|---------|---------|--------|
| RevenueCat | 5.x | Subscription management | SPM: github.com/RevenueCat/purchases-ios |
| RevenueCatUI | 5.x | PaywallView | SPM: github.com/RevenueCat/purchases-ios |
| Mixpanel | 4.x | Analytics | SPM: github.com/mixpanel/mixpanel-swift |

## Architecture Pattern

**MVVM with @Observable (iOS 17+)**
- Views: SwiftUI declarative UI
- ViewModels: @Observable for reactive state
- Services: Protocol-based for testability
- CoreData: @Environment(\.managedObjectContext) injection

## Privacy Architecture

- All mood data: CoreData on-device ONLY
- No cloud sync in v1 (privacy as feature)
- Mixpanel: anonymized device ID only, no mood content
- HealthKit: write-only (we write, never read other apps' data)
- RevenueCat: receipt validation only

## Build Configuration

| Config | Value |
|--------|-------|
| Minimum iOS | 17.0 |
| Swift | 5.9+ |
| Xcode | 16+ |
| Architecture | arm64 |
| Signing | Manual (Distribution cert) |
| Build tool | Fastlane gym |
