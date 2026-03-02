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
        // RevenueCat iOS API key (from RC Dashboard → Project → API Keys)
        Purchases.configure(withAPIKey: "appl_hNTijvmQxhfkknlPentkvRvpZve")
        Purchases.logLevel = .info
    }

    private func configureMixpanel() {
        // Mixpanel project token
        let token = Bundle.main.infoDictionary?["MIXPANEL_TOKEN"] as? String ?? "placeholder"
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
    }
}
