import SwiftUI

@main
struct SleepRitualApp: App {
    init() {
        // RevenueCat: API key from Info.plist — NOT ProcessInfo.processInfo.environment
        SubscriptionService.shared.configure()
        // Mixpanel: token from Info.plist — NOT ProcessInfo.processInfo.environment
        AnalyticsService.shared.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
