import SwiftUI
import RevenueCat
import Mixpanel

@main
struct MicroMoodApp: App {
    @StateObject private var subscriptionManager = SubscriptionManager()
    let persistenceController = PersistenceController.shared

    init() {
        configureRevenueCat()
        configureMixpanel()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(subscriptionManager)
        }
    }

    private func configureRevenueCat() {
        let apiKey = ProcessInfo.processInfo.environment["REVENUECAT_IOS_KEY"] ?? "PLACEHOLDER_KEY"
        Purchases.configure(withAPIKey: apiKey)
        Purchases.logLevel = .info
    }

    private func configureMixpanel() {
        let token = ProcessInfo.processInfo.environment["MIXPANEL_TOKEN"] ?? "PLACEHOLDER_TOKEN"
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
    }
}
