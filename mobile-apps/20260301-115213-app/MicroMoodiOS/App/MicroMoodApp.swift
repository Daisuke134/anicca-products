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
        // CRITICAL: API key from Info.plist, NOT environment variable
        let apiKey = Bundle.main.infoDictionary?["REVENUECAT_IOS_KEY"] as? String ?? "appl_placeholder"
        Purchases.configure(withAPIKey: apiKey)
        Purchases.logLevel = .info
    }

    private func configureMixpanel() {
        // CRITICAL: Token from Info.plist, NOT environment variable
        let token = Bundle.main.infoDictionary?["MIXPANEL_TOKEN"] as? String ?? "placeholder"
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
    }
}
