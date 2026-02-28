import SwiftUI
import RevenueCat
import Mixpanel

@main
struct BreathCalmApp: App {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @AppStorage("onboarding_completed") private var onboardingCompleted = false

    init() {
        setupRevenueCat()
        setupMixpanel()
        setupNotifications()
    }

    var body: some Scene {
        WindowGroup {
            if onboardingCompleted {
                MainTabView()
                    .environmentObject(subscriptionManager)
            } else {
                OnboardingWelcomeView()
                    .environmentObject(subscriptionManager)
            }
        }
    }

    private func setupRevenueCat() {
        Purchases.configure(withAPIKey: "BREATHCALM_RC_IOS_KEY")
        Purchases.logLevel = .error
    }

    private func setupMixpanel() {
        let token = Bundle.main.object(forInfoDictionaryKey: "MIXPANEL_TOKEN") as? String ?? ""
        Mixpanel.initialize(token: token, trackAutomaticEvents: true)
    }

    private func setupNotifications() {
        UNUserNotificationCenter.current().delegate = NotificationService.shared
    }
}
