import SwiftUI
import SwiftData
import RevenueCat

@main
struct FrostDipApp: App {
    init() {
        guard let apiKey = Bundle.main.infoDictionary?["RC_API_KEY"] as? String,
              !apiKey.isEmpty,
              !apiKey.contains("PLACEHOLDER") else {
            return
        }

        #if DEBUG
        Purchases.logLevel = .debug
        #endif

        let subscriptionService = SubscriptionService()
        subscriptionService.configure(apiKey: apiKey)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [PlungeSession.self, PlungeProtocol.self])
    }
}
