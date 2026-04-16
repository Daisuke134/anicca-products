import Foundation

/// v3 Onboarding flow — 18 cases (Bible-compliant: 18 onboarding + 3 paywall).
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
    case comparison = 13
    case appDemo = 14
    case valueDelivery = 15
    case ratingPrompt = 16
    case notifications = 17
}

enum PaywallStep: Int, CaseIterable, Codable {
    case primer = 0
    case valueTimeline = 1
    case planSelection = 2
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
        // v4: welcome=0,name=1,age=2,goal=3,painPoints=4,struggleFreq=5,tinderPain=6,
        //     whatTried=7,stressLevel=8,socialProof=9,nudgeTimes=10,meditExp=11,
        //     referral=12,processing=13,planReveal=14,comparison=15,appDemo=16,
        //     valueDelivery=17,ratingPrompt=18,notifications=19
        switch rawValue {
        case 0: return .welcome
        case 1: return .age          // name removed → skip to age
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
        case 12: return .processing  // referral removed → skip to processing
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
        case .comparison: return "comparison"
        case .appDemo: return "app_demo"
        case .valueDelivery: return "value_delivery"
        case .ratingPrompt: return "rating_prompt"
        case .notifications: return "notifications"
        }
    }
}
