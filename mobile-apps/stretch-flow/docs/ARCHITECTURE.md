# Technical Architecture: DeskStretch

> **Version:** 1.0 | **Date:** 2026-03-05

---

## 1. Overview

DeskStretch は SwiftUI ベースの iOS アプリ。ローカルファーストアーキテクチャで、バックエンド不要。Apple Foundation Models によるオンデバイスAI推論、RevenueCat によるサブスクリプション管理、UserDefaults + JSON によるデータ永続化。

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **UI** | SwiftUI | iOS 15+ |
| **AI Engine** | Apple Foundation Models | iOS 26+ (with fallback) |
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
│   ├── AIStretchService.swift            # Foundation Models integration + fallback
│   ├── NotificationService.swift         # Schedule/cancel local notifications
│   ├── SubscriptionService.swift         # RevenueCat wrapper (entitlement check)
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

### State Management

```
@Observable AppState (single source of truth)
    ├── selectedPainAreas: Set<PainArea>
    ├── breakSchedule: BreakSchedule
    ├── userProgress: UserProgress
    ├── isPremium: Bool
    ├── hasCompletedOnboarding: Bool
    └── currentSession: StretchSession?

SwiftUI Views observe AppState via @Environment
Services read/write to UserDefaults and update AppState
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

### AI Data Flow

```
User's pain areas + session history
    ↓
AIStretchService.generateRoutine(painAreas:, history:)
    ↓
[iOS 26+] Foundation Models → personalized JSON
[iOS < 26] Fallback → curated static routine from StretchLibrary.json
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
| **AI Processing** | 100% on-device (Foundation Models). No data leaves device |
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
| AI generation | < 3s | On-device Foundation Models (no network) |
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
| AIStretchService (fallback logic) | Unit | P0 |
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
| Foundation Models iOS 26+ only | High | Medium | Static fallback routines for older iOS |
| RevenueCat SDK breaking changes | Low | High | Pin SDK version, test before updates |
| Notification permission denied | Medium | High | In-app timer fallback, re-prompt strategy |
| UserDefaults data loss | Low | Medium | Minimal critical data, streak reset is acceptable |
| App Store rejection (4.3 spam) | Low | High | Unique AI feature differentiates clearly |

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
| Foundation Models | System | iOS 26+ | AI stretch generation |
| UserNotifications | System | iOS 15+ | Break reminders |
| SF Symbols | System | iOS 15+ | Exercise icons |

---

## 12. Architecture Decision Records

### ADR-001: UserDefaults over CoreData

**Decision:** Use UserDefaults for all data persistence.
**Rationale:** MVP data is simple (progress counters, preferences, pain areas). CoreData adds complexity without benefit. Migrate to CoreData/SwiftData if data model grows in v2.0.

### ADR-002: Foundation Models with Static Fallback

**Decision:** Use Foundation Models for AI with static JSON fallback.
**Rationale:** Foundation Models requires iOS 26+. Static curated routines from StretchLibrary.json ensure 100% feature parity for older devices, minus personalization.

### ADR-003: Scheduled Notifications over Background Timer

**Decision:** Use UNNotificationRequest for break reminders instead of background timer.
**Rationale:** Background timers are unreliable (iOS kills background tasks), drain battery, and trigger App Store review flags. Scheduled notifications are reliable and battery-friendly.

### ADR-004: Self-built PaywallView over RevenueCatUI

**Decision:** Build PaywallView in SwiftUI from scratch.
**Rationale:** Rule 20 (factory constraint). RevenueCatUI is forbidden. Use `Purchases.shared.purchase(package:)` directly.
