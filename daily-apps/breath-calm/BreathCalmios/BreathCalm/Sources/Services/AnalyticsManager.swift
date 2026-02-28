import Foundation
import Mixpanel

enum AnalyticsEvent: String {
    case sessionStarted = "session_started"
    case sessionCompleted = "session_completed"
    case paywallViewed = "paywall_viewed"
    case onboardingCompleted = "onboarding_completed"
}

class AnalyticsManager {
    static let shared = AnalyticsManager()

    private init() {}

    func track(_ event: AnalyticsEvent, properties: [String: MixpanelType] = [:]) {
        Mixpanel.mainInstance().track(event: event.rawValue, properties: properties)
    }

    func trackSessionStarted(type: SessionType) {
        track(.sessionStarted, properties: ["session_type": type.rawValue as MixpanelType])
    }

    func trackSessionCompleted(type: SessionType, moodBefore: Int, moodAfter: Int) {
        track(.sessionCompleted, properties: [
            "session_type": type.rawValue as MixpanelType,
            "mood_before": moodBefore as MixpanelType,
            "mood_after": moodAfter as MixpanelType,
            "improvement": (moodBefore - moodAfter) as MixpanelType
        ])
    }

    func trackPaywallViewed(offeringId: String) {
        track(.paywallViewed, properties: ["offering_id": offeringId as MixpanelType])
    }
}
