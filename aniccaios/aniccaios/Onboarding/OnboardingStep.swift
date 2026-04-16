import Foundation

/// v4 Onboarding flow — 19 cases (Bible-compliant: 19 onboarding + 2 paywall).
enum OnboardingStep: Int, CaseIterable, Codable {
    case welcome = 0
    case age = 1
    case goal = 2
    case painPoints = 3
    case struggleFreq = 4
    case tinderPain = 5
    case whatTried = 6
    case stressLevel = 7
    case socialProof = 8
    case nudgeTimes = 9
    case meditExp = 10
    case processing = 11
    case planReveal = 12
    case valueTimeline = 13
    case comparison = 14
    case appDemo = 15
    case valueDelivery = 16
    case ratingPrompt = 17
    case notifications = 18
}

enum PaywallStep: Int, CaseIterable, Codable {
    case primer = 0
    case planSelection = 1
}

extension OnboardingStep {
    /// v2 (8-step) → v3 (18-step) migration.
    /// v2 schema: welcome=0, struggles=1, struggleDepth=2, personalizedInsight=3,
    ///             processing=4, valueProp=5, appDemo=6, notifications=7
    static func migratedFromV2RawValue(_ rawValue: Int) -> OnboardingStep? {
        switch rawValue {
        case 0: return .welcome
        case 1: return .painPoints
        case 2: return .struggleFreq
        case 3: return .planReveal
        case 4: return .processing
        case 5: return .valueDelivery
        case 6: return .appDemo
        case 7: return .notifications
        default: return nil
        }
    }
}

extension OnboardingStep {
    /// v4 (20-step) → v5 (18-step) migration: name(1) and referral(12) removed.
    static func migratedFromV4RawValue(_ rawValue: Int) -> OnboardingStep? {
        switch rawValue {
        case 0: return .welcome
        case 1: return .age
        case 2: return .age
        case 3: return .goal
        case 4: return .painPoints
        case 5: return .struggleFreq
        case 6: return .tinderPain
        case 7: return .whatTried
        case 8: return .stressLevel
        case 9: return .socialProof
        case 10: return .nudgeTimes
        case 11: return .meditExp
        case 12: return .processing
        case 13: return .processing
        case 14: return .planReveal
        case 15: return .comparison
        case 16: return .appDemo
        case 17: return .valueDelivery
        case 18: return .ratingPrompt
        case 19: return .notifications
        default: return nil
        }
    }
}

extension OnboardingStep {
    /// v5 (18-step) → v6 (19-step) migration: valueTimeline inserted at 13.
    static func migratedFromV5RawValue(_ rawValue: Int) -> OnboardingStep? {
        // v5: 0-12 same, 13=comparison, 14=appDemo, 15=valueDelivery, 16=ratingPrompt, 17=notifications
        // v6: 0-12 same, 13=valueTimeline(new), 14=comparison, 15=appDemo, 16=valueDelivery, 17=ratingPrompt, 18=notifications
        if rawValue <= 12 {
            return OnboardingStep(rawValue: rawValue)
        }
        // 13+ shift by 1 (valueTimeline inserted)
        return OnboardingStep(rawValue: rawValue + 1)
    }
}

extension OnboardingStep {
    var analyticsName: String {
        switch self {
        case .welcome: return "welcome"
        case .age: return "age"
        case .goal: return "goal"
        case .painPoints: return "pain_points"
        case .struggleFreq: return "struggle_freq"
        case .tinderPain: return "tinder_pain"
        case .whatTried: return "what_tried"
        case .stressLevel: return "stress_level"
        case .socialProof: return "social_proof"
        case .nudgeTimes: return "nudge_times"
        case .meditExp: return "medit_exp"
        case .processing: return "processing"
        case .planReveal: return "plan_reveal"
        case .valueTimeline: return "value_timeline"
        case .comparison: return "comparison"
        case .appDemo: return "app_demo"
        case .valueDelivery: return "value_delivery"
        case .ratingPrompt: return "rating_prompt"
        case .notifications: return "notifications"
        }
    }
}
