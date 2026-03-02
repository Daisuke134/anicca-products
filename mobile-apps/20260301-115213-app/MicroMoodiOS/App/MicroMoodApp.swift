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
        // CRITICAL: API key from Info.plist, NOT environment variable
        // Environment variables do NOT work in App Store builds
        let apiKey = Bundle.main.infoDictionary?["REVENUECAT_IOS_KEY"] as? String ?? "appl_placeholder"
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
        // CRITICAL: Token from Info.plist, NOT environment variable
        let token = Bundle.main.infoDictionary?["MIXPANEL_TOKEN"] as? String ?? "placeholder"
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
        if !trackingGranted {
            Mixpanel.mainInstance().optOutTracking()
        }
    }
}
