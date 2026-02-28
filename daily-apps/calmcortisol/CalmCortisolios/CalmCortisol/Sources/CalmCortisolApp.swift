import SwiftUI
import RevenueCat
import Mixpanel

@main
struct CalmCortisolApp: App {
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
        Purchases.configure(withAPIKey: "appl_pcZedDwIwXVSSdEugQZPMBormtl")
        Purchases.logLevel = .error
    }

    private func setupMixpanel() {
        Mixpanel.initialize(token: "YOUR_MIXPANEL_TOKEN", trackAutomaticEvents: true)
    }

    private func setupNotifications() {
        UNUserNotificationCenter.current().delegate = NotificationDelegate.shared
    }
}
