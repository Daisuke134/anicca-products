import SwiftUI
import RevenueCat
import Mixpanel
import AppTrackingTransparency

@main
struct MicroMoodApp: App {
    @StateObject private var subscriptionManager = SubscriptionManager()
    let persistenceController = PersistenceController.shared

    init() {
        configureRevenueCat()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(subscriptionManager)
                .onAppear {
                    requestTrackingAuthorization()
                }
        }
    }

    private func configureRevenueCat() {
        let apiKey = ProcessInfo.processInfo.environment["REVENUECAT_IOS_KEY"] ?? "PLACEHOLDER_KEY"
        Purchases.configure(withAPIKey: apiKey)
        Purchases.logLevel = .info
    }

    private func requestTrackingAuthorization() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            ATTrackingManager.requestTrackingAuthorization { status in
                configureMixpanel(trackingGranted: status == .authorized)
            }
        }
    }

    private func configureMixpanel(trackingGranted: Bool) {
        let token = ProcessInfo.processInfo.environment["MIXPANEL_TOKEN"] ?? "PLACEHOLDER_TOKEN"
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
        if !trackingGranted {
            Mixpanel.mainInstance().optOutTracking()
        }
    }
}
