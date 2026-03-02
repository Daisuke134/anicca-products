import Foundation
import Mixpanel

final class AnalyticsService {
    static let shared = AnalyticsService()

    func configure() {
        // Token from Info.plist — NOT ProcessInfo.processInfo.environment
        let token = Bundle.main.infoDictionary?["MixpanelToken"] as? String ?? ""
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
    }

    func track(_ event: String, properties: [String: MixpanelType]? = nil) {
        Mixpanel.mainInstance().track(event: event, properties: properties)
    }

    func trackPaywallViewed() {
        track("paywall_viewed")
    }

    func trackRitualCompleted(streakCount: Int) {
        track("ritual_completed", properties: ["streak": streakCount])
    }

    func trackStepAdded() {
        track("step_added")
    }

    func trackPurchaseStarted(packageId: String) {
        track("purchase_started", properties: ["package_id": packageId])
    }

    func trackPurchaseCompleted(packageId: String) {
        track("purchase_completed", properties: ["package_id": packageId])
    }
}
