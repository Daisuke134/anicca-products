import Foundation

/// v3 Onboarding flow — 20 cases (Bible-compliant 23-screen spec: 20 onboarding + 3 paywall).
enum OnboardingStep: Int, CaseIterable, Codable {
    case welcome = 0
    case name = 1
    case age = 2
    case goal = 3
    case painPoints = 4
    case struggleFreq = 5
    case tinderPain = 6
    case whatTried = 7
    case stressLevel = 8
    case socialProof = 9
    case nudgeTimes = 10
    case meditExp = 11
    case referral = 12
    case processing = 13
    case planReveal = 14
    case comparison = 15
    case appDemo = 16
    case valueDelivery = 17
    case ratingPrompt = 18
    case notifications = 19
}

enum PaywallStep: Int, CaseIterable, Codable {
    case primer = 0
    case valueTimeline = 1
    case planSelection = 2
}

extension OnboardingStep {
    /// v2 (8-step) → v3 (20-step) migration.
    /// v2 schema: welcome=0, struggles=1, struggleDepth=2, personalizedInsight=3,
    ///             processing=4, valueProp=5, appDemo=6, notifications=7
    static func migratedFromV2RawValue(_ rawValue: Int) -> OnboardingStep? {
        switch rawValue {
        case 0: return .welcome
        case 1: return .painPoints       // struggles → painPoints
        case 2: return .struggleFreq     // struggleDepth → struggleFreq
        case 3: return .planReveal       // personalizedInsight → planReveal
        case 4: return .processing
        case 5: return .valueDelivery    // valueProp → valueDelivery
        case 6: return .appDemo
        case 7: return .notifications
        default: return nil
        }
    }
}

extension OnboardingStep {
    var analyticsName: String {
        switch self {
        case .welcome: return "welcome"
        case .name: return "name"
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
        case .referral: return "referral"
        case .processing: return "processing"
        case .planReveal: return "plan_reveal"
        case .comparison: return "comparison"
        case .appDemo: return "app_demo"
        case .valueDelivery: return "value_delivery"
        case .ratingPrompt: return "rating_prompt"
        case .notifications: return "notifications"
        }
    }
}
