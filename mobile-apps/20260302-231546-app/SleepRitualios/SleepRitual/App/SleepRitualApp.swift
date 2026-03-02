import SwiftUI

@main
struct SleepRitualApp: App {
    init() {
        // RevenueCat: API key from Info.plist — NOT ProcessInfo.processInfo.environment
        SubscriptionService.shared.configure()
        AnalyticsService.shared.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
