import Foundation

final class AnalyticsService {
    static let shared = AnalyticsService()

    func configure() {
        // Analytics: no external SDK (ATT not used per project rules)
    }

    func track(_ event: String, properties: [String: Any]? = nil) {
        // No-op: analytics placeholder for future integration
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
