# Implementation Guide: SomaticFlow

Source: [Ray Wenderlich: iOS App Architecture](https://www.kodeco.com/books/swiftui-cookbook/v1.0/chapters/1-building-your-first-swiftui-app) — 「Follow a consistent project structure from the start to reduce technical debt.」
Source: [RevenueCat: Getting Started iOS](https://docs.revenuecat.com/docs/getting-started) — 「Configure Purchases.shared once at app launch, then use it anywhere.」
Source: [Apple Developer: CoreHaptics](https://developer.apple.com/documentation/corehaptics) — 「Create, customize, and play haptic patterns that synchronize with audio.」

---

## 1. Prerequisites

### Environment Setup

| 項目 | 値 |
|------|-----|
| Xcode | 16.0+ |
| Swift | 5.10+ |
| iOS Deployment Target | 17.0 |
| RevenueCat SDK | 5.x (SPM) |
| Fastlane | 必須（xcodebuild 直接実行禁止） |

### RevenueCat API Key 管理（🔴 コードにハードコード禁止）

```bash
# 1. xcconfig ファイルに設定（コミットしない）
# SomaticFlow/Config/SomaticFlow.xcconfig
RC_API_KEY = appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. Info.plist に追加
# RC_API_KEY = $(RC_API_KEY)

# 3. Swift コードで参照
let apiKey = Bundle.main.infoDictionary?["RC_API_KEY"] as? String ?? ""
Purchases.configure(withAPIKey: apiKey)
```

### Signing Setup

```bash
# keychain unlock (Fastlane ビルド前に必須)
source ~/.config/mobileapp-builder/.env
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db
```

---

## 2. Phase Breakdown

| Phase | Feature IDs | Files (主要) | Complexity |
|-------|------------|--------------|-----------|
| Phase 1: Project Setup | F-001〜F-010 (インフラ) | SomaticFlowApp.swift, xcconfig, PrivacyInfo | Low |
| Phase 2: Models & Services | F-003, F-005, F-008 | Exercise.swift, Program.swift, UserProgress.swift, SubscriptionService.swift, NotificationService.swift | Medium |
| Phase 3: Onboarding | F-001 | OnboardingContainerView.swift, 5ステップView群, OnboardingViewModel.swift | Medium |
| Phase 4: Core Session | F-002, F-003, F-004, F-005 | ExerciseSessionView.swift, TimerView.swift, ExerciseAnimationView.swift, ExerciseViewModel.swift | High |
| Phase 5: Monetization | F-006, F-007, F-008, F-009 | PaywallView.swift, PaywallViewModel.swift, SubscriptionService.swift | High |
| Phase 6: Library & Progress | F-008, F-009, F-005 | LibraryView.swift, ProgressView.swift, StreakDashboardView.swift | Medium |
| Phase 7: Settings | F-010 | SettingsView.swift, SettingsViewModel.swift | Low |
| Phase 8: Polish & Localization | F-001〜F-010 | Localizable.xcstrings, DESIGN_SYSTEM tokens | Medium |

---

## 3. Phase 1: Project Setup

### Xcode プロジェクト作成

```bash
# Xcode 16 で新規プロジェクト作成
# Product Name: SomaticFlow
# Bundle Identifier: com.aniccafactory.somaticflow
# Interface: SwiftUI
# Language: Swift
# Include Tests: YES
# iOS Deployment Target: 17.0
```

### SPM: RevenueCat 追加

```
Xcode → File → Add Package Dependencies
URL: https://github.com/RevenueCat/purchases-ios
Version: 5.x (最新)
Target: SomaticFlow（RC-UI library は追加しない — Rule 20）
```

### PrivacyInfo.xcprivacy 作成

```xml
<!-- SomaticFlow/PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key><false/>
    <key>NSPrivacyTrackingDomains</key><array/>
    <key>NSPrivacyCollectedDataTypes</key><array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array><string>CA92.1</string></array>
        </dict>
    </array>
</dict>
</plist>
```

### SomaticFlowApp.swift

```swift
import SwiftUI
import RevenueCat

@main
struct SomaticFlowApp: App {
    @StateObject private var appState = AppState()

    init() {
        // RC configure — API key from xcconfig/Info.plist
        let apiKey = Bundle.main.infoDictionary?["RC_API_KEY"] as? String ?? ""
        Purchases.configure(withAPIKey: apiKey)
        Purchases.logLevel = .error
    }

    var body: some Scene {
        WindowGroup {
            if appState.onboardingCompleted {
                MainTabView()
                    .environmentObject(appState)
            } else {
                OnboardingContainerView()
                    .environmentObject(appState)
            }
        }
    }
}
```

---

## 4. Phase 2: Core Features

### Exercise.swift (F-003, F-008)

```swift
import Foundation

struct Exercise: Codable, Identifiable {
    let id: String
    let title: String
    let titleJa: String
    let description: String
    let descriptionJa: String
    let durationSeconds: Int
    let category: ExerciseCategory
    let difficulty: Difficulty
    let hapticPattern: HapticPattern
    let animationType: AnimationType
    let isPremium: Bool
    let programDay: Int?
}

enum ExerciseCategory: String, Codable { case grounding, nervous, release }
enum Difficulty: String, Codable { case beginner, intermediate }
enum HapticPattern: String, Codable { case pulse, wave, staccato }
enum AnimationType: String, Codable { case breathe, shake, ground }
```

### exercises.json (F-007, F-008) — static content

```json
{
  "exercises": [
    {
      "id": "sf-001",
      "title": "Ground & Feel",
      "titleJa": "地に足をつける",
      "description": "Stand or sit. Feel the floor beneath you. Breathe slowly.",
      "descriptionJa": "立つか座る。床の感触を感じる。ゆっくり呼吸する。",
      "durationSeconds": 300,
      "category": "grounding",
      "difficulty": "beginner",
      "hapticPattern": "pulse",
      "animationType": "breathe",
      "isPremium": false,
      "programDay": 1
    }
    // ... 24+ more exercises
  ]
}
```

### NotificationService.swift (F-004)

```swift
import UserNotifications

class NotificationService {
    static let shared = NotificationService()
    private init() {}

    func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func scheduleDailyReminder(hour: Int, minute: Int) async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["sf.daily.reminder"])
        let content = UNMutableNotificationContent()
        content.title = NSLocalizedString("notif.title", comment: "")
        content.body = NSLocalizedString("notif.body", comment: "")
        content.sound = .default
        var dc = DateComponents()
        dc.hour = hour; dc.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: dc, repeats: true)
        let request = UNNotificationRequest(identifier: "sf.daily.reminder", content: content, trigger: trigger)
        try? await center.add(request)
    }
}
```

### ExerciseViewModel.swift (F-003) — CoreHaptics

```swift
import SwiftUI
import CoreHaptics

@MainActor
class ExerciseViewModel: ObservableObject {
    @Published var timeRemaining: Int = 0
    @Published var isRunning: Bool = false
    @Published var animationProgress: Double = 0

    private var engine: CHHapticEngine?
    private var timer: Timer?

    func startSession(exercise: Exercise) {
        timeRemaining = exercise.durationSeconds
        setupHaptics(pattern: exercise.hapticPattern)
        isRunning = true
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if self.timeRemaining > 0 {
                self.timeRemaining -= 1
                self.animationProgress = Double(exercise.durationSeconds - self.timeRemaining) / Double(exercise.durationSeconds)
            } else {
                self.completeSession()
            }
        }
    }

    private func setupHaptics(pattern: HapticPattern) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        engine = try? CHHapticEngine()
        try? engine?.start()
        // pattern-specific haptic events
    }

    func completeSession() {
        isRunning = false
        timer?.invalidate()
        engine?.stop(completionHandler: nil)
        // update UserProgress via ProgressViewModel
    }
}
```

---

## 5. Phase 3: Monetization

**🔴 Rule 20: 自前 SwiftUI PaywallView 必須。RC-UI library 禁止。**

### SubscriptionService.swift (F-006)

```swift
import RevenueCat

protocol SubscriptionServiceProtocol {
    var isPremium: Bool { get }
    func purchase(package: Package) async throws -> CustomerInfo
    func restorePurchases() async throws -> CustomerInfo
    func fetchOfferings() async throws -> Offerings
}

class SubscriptionService: SubscriptionServiceProtocol {
    static let shared = SubscriptionService()
    private init() {}

    var isPremium: Bool {
        Purchases.shared.cachedCustomerInfo?.entitlements["premium"]?.isActive ?? false
    }

    func purchase(package: Package) async throws -> CustomerInfo {
        let result = try await Purchases.shared.purchase(package: package)  // Rule 20
        return result.customerInfo
    }

    func restorePurchases() async throws -> CustomerInfo {
        return try await Purchases.shared.restorePurchases()
    }

    func fetchOfferings() async throws -> Offerings {
        return try await Purchases.shared.offerings()
    }
}
```

### Product IDs

| Product | Product ID | Type | Price | Trial |
|---------|-----------|------|-------|-------|
| Monthly | `com.aniccafactory.somaticflow.monthly` | Auto-Renewable | $7.99/月 | なし |
| Annual | `com.aniccafactory.somaticflow.annual` | Auto-Renewable | $29.99/年 | 7日間無料 |

### RevenueCat Configuration

| 項目 | 値 |
|------|-----|
| Entitlement ID | `premium` |
| Offering ID | `default` |
| Package Monthly | `$rc_monthly` |
| Package Annual | `$rc_annual` |

### PaywallView.swift (F-006) — 自前 SwiftUI（Rule 20 準拠）

```swift
import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var vm = PaywallViewModel()
    @Environment(\.dismiss) private var dismiss
    let isSoftPaywall: Bool  // true = shows "Maybe Later"

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // 1. Headline (benefit, not feature list)
                Text("Release tension. Finally.")
                    .font(.largeTitle.bold())

                // 2. 3-5 benefit bullets
                ForEach(vm.benefits, id: \.self) { Text("✓ \($0)") }

                // 3. Social proof (Rule 20.6)
                Text("Trusted by wellness seekers worldwide")

                // 4. Pricing grid (Rule 20.3)
                if let offerings = vm.offerings {
                    PricingGrid(offerings: offerings, selectedPackage: $vm.selectedPackage)
                }

                // 5. Trial timeline (visual)
                TrialTimelineView()

                // 6. CTA (Rule 20.2)
                Button("Start my journey free") {
                    Task { await vm.purchase() }
                }
                .accessibilityIdentifier("paywall_cta_button")

                // 7. Risk removal (Rule 20.7)
                Text("Cancel anytime. No commitment.")
                    .font(.caption)

                // 8. Maybe Later (Rule 20 — soft paywall)
                if isSoftPaywall {
                    Button("Maybe Later") { dismiss() }
                        .accessibilityIdentifier("paywall_maybe_later_button")
                }

                // 9. Restore + Privacy links
                Button("Restore Purchases") { Task { await vm.restore() } }
                HStack {
                    Link("Privacy Policy", destination: URL(string: "https://daisuke134.github.io/anicca-products/somaticflow/privacy")!)
                    Link("Terms of Use", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                }
            }
            .padding()
        }
    }
}
```

---

## 6. Phase 4: Polish

### Localization (F-001〜F-010)

```swift
// Localizable.xcstrings を使用（Xcode 15+ String Catalog）
// en-US + ja を同一ファイルで管理

// 使用方法
Text("paywall.cta")      // → "Start my journey free" / "無料で始める"
Text("paywall.later")    // → "Maybe Later" / "あとで"
Text("notif.title")      // → "Time for your somatic routine" / "ソマティックルーティンの時間です"
```

### DESIGN_SYSTEM Token 適用

全 View で `DESIGN_SYSTEM.md §1 Color Tokens` を使用:
```swift
// DESIGN_SYSTEM §1 で定義する Color Tokens を使用
.foregroundStyle(Color("ds.primary"))
.background(Color("ds.background"))
```

---

## 7. Phase 5: Testing & Release Prep

### テスト順序

```
1. Unit Tests — Models + Services（Target: 70%+ coverage）
2. Integration Tests — SubscriptionService + UserProgress 連携
3. E2E Tests（Maestro）— onboarding, timer, paywall, settings 6フロー
```

### Fastlane Lanes

```ruby
# Fastfile
lane :test do
  run_tests(scheme: "SomaticFlow", configuration: "Debug")
end

lane :build do
  build_app(
    scheme: "SomaticFlow",
    configuration: "Release",
    skip_package_ipa: true  # archive のみ（Widget Extension signing 問題回避）
  )
end
```

### Greenlight Pre-submission Checks

```bash
# Rule 17: No analytics SDK
RULE17='Mix[p]anel|Fi[r]ebase|Am[p]litude'
grep -rE "$RULE17" SomaticFlow/ && echo "FAIL" || echo "PASS: Rule 17"

# Rule 20: No RC-UI library
RULE20='Re[v]enueCatUI'
grep -r "$RULE20" SomaticFlow/ && echo "FAIL" || echo "PASS: Rule 20"

# Rule 20b: No ATT
RULE20B='ATT[r]ackingManager|requestT[r]ackingAuthorization'
grep -r "$RULE20B" SomaticFlow/ && echo "FAIL" || echo "PASS: Rule 20b"

# Rule 23: No AI APIs
RULE23='Op[e]nAI|Ant[h]ropic|Go[o]gleGenerativeAI|Fo[u]ndationModels'
grep -rE "$RULE23" SomaticFlow/ && echo "FAIL" || echo "PASS: Rule 23"
```

---

## 8. Build & Run

| タスク | コマンド |
|--------|---------|
| テスト実行 | `cd SomaticFlowios && fastlane test` |
| Archive ビルド | `cd SomaticFlowios && fastlane build` |
| IPA export | `xcodebuild -exportArchive -archivePath ... -exportOptionsPlist ExportOptions.plist -exportPath build/` |
| Simulator 起動 | `xcrun simctl boot "iPhone 16 Pro"` |
| Maestro E2E | `maestro test maestro/` |
| Typecheck | `xcodebuild -scheme SomaticFlow -configuration Debug CODE_SIGNING_ALLOWED=NO build` |

### ExportOptions.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>method</key><string>app-store-connect</string>
    <key>signingStyle</key><string>automatic</string>
    <key>teamID</key><string>$(TEAM_ID)</string>
</dict>
</plist>
```

### 実装チェックリスト

| # | チェック | 方法 |
|---|---------|------|
| 1 | xcconfig で RC_API_KEY 管理 | `grep RC_API_KEY SomaticFlow.xcconfig` |
| 2 | SubscriptionService が Protocol 経由 | `grep SubscriptionServiceProtocol SomaticFlow/` |
| 3 | PaywallView に Maybe Later あり | `grep "Maybe Later" SomaticFlow/` |
| 4 | No RC-UI library import | `grep 'Re[v]enueCatUI' SomaticFlow/ \| wc -l` = 0 |
| 5 | exercises.json が Bundle に含まれる | `ls SomaticFlow/Resources/Content/exercises.json` |
| 6 | PrivacyInfo.xcprivacy が存在する | `ls SomaticFlow/PrivacyInfo.xcprivacy` |
| 7 | fastlane test PASS | `fastlane test` exit 0 |
| 8 | fastlane build PASS (archive) | `fastlane build` exit 0 |
