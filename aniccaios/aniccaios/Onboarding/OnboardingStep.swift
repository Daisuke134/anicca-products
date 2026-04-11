import Foundation

enum OnboardingStep: Int, CaseIterable {
    case welcome           // 0
    case struggles         // 1
    case struggleDepth     // 2
    case personalizedInsight // 3
    case processing        // 4
    case valueProp         // 5
    case appDemo           // 6
    case notifications     // 7
}

enum PaywallStep: Int {
    case primer            // 0
    case planSelection     // 1
}

extension OnboardingStep {
    /// v1.6.1以前（旧4-step enum）からの legacy migration。
    ///
    /// ## rawValue履歴
    /// - v0.4:   0=welcome, 4=name, 11=att
    /// - v1.6.0: 0=welcome, 1=value, 2=struggles, 3=notifications, 4=att
    /// - v1.6.1: 0=welcome, 1=struggles, 2=liveDemo, 3=notifications（value削除、ATT削除）
    /// - v2:     0=welcome, 1=struggles, 2=struggleDepth, 3=personalizedInsight, 4=processing, 5=valueProp, 6=appDemo, 7=notifications
    static func migratedFromLegacyRawValue(_ rawValue: Int) -> OnboardingStep {
        // v1.6.0以前からの移行マッピング
        switch rawValue {
        case 0: return .welcome
        case 1: return .struggles       // 旧 value/account → struggles（value 削除）
        case 2: return .struggles       // 旧 struggles → struggles（legacy only）
        case 3: return .notifications   // v1.6.0 の .notifications=3 を保護（現行ユーザー優先）
        case 5, 6, 7, 8: return .struggles  // 旧 name/gender/age/ideals → struggles（未実施防止）
        case 4: return .notifications   // v1.6.0の.att → notifications（ATT削除後）
        case 9, 10: return .notifications // 旧 habitSetup/notifications → notifications
        case 11, 12: return .notifications // 旧 att/alarmkit → notifications
        default:
            return .welcome
        }
    }

    /// v1.6.1（旧4-step enum: 0=welcome, 1=struggles, 2=liveDemo, 3=notifications）
    /// から v2（8-step enum）への移行マッピング。
    static func migratedFromV1RawValue(_ rawValue: Int) -> OnboardingStep {
        switch rawValue {
        case 0: return .welcome           // welcome → welcome
        case 1: return .struggles         // struggles → struggles
        case 2: return .notifications     // liveDemo(2) → notifications (liveDemo deleted in v3)
        case 3: return .notifications     // notifications(3) → notifications(6)
        default: return .welcome
        }
    }
}
