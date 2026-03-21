import Foundation
import Mixpanel
import OSLog

/// アプリ全体のアナリティクスを管理するシングルトン
/// Jake Mor's Tip #1: "Most important metric is App Install → Paywall View"
@MainActor
final class AnalyticsManager {
    static let shared = AnalyticsManager()
    private let logger = Logger(subsystem: "com.anicca.ios", category: "Analytics")
    
    private init() {}
    
    // MARK: - Configuration
    
    func configure() {
        let token = AppConfig.mixpanelToken
        // trackAutomaticEvents: false (公式推奨 - クライアントサイドの自動イベントは信頼性が低い)
        Mixpanel.initialize(token: token, trackAutomaticEvents: false)
        
        // ログを常時有効化（Debug/Release両方でイベント送信を確認可能）
        Mixpanel.mainInstance().loggingEnabled = true
        
        logger.info("Mixpanel initialized")
    }
    
    /// ユーザーIDを設定（ログイン時に呼び出し）
    func identify(userId: String) {
        Mixpanel.mainInstance().identify(distinctId: userId)
        logger.info("Mixpanel identified user: \(userId, privacy: .private(mask: .hash))")
    }
    
    /// ユーザープロファイル情報を設定
    func setUserProperties(_ properties: [String: MixpanelType]) {
        Mixpanel.mainInstance().people.set(properties: properties)
    }
    
    /// 単一のユーザープロパティを設定
    /// - Parameters:
    ///   - key: プロパティキー（例: "acquisition_source", "gender"）
    ///   - value: プロパティ値
    func setUserProperty(_ key: String, value: MixpanelType) {
        Mixpanel.mainInstance().people.set(properties: [key: value])
        logger.debug("Set user property: \(key, privacy: .public)")
    }
    
    /// ログアウト時にリセット
    func reset() {
        Mixpanel.mainInstance().reset()
        logger.info("Mixpanel reset")
    }
    
    // MARK: - Event Tracking
    
    /// 汎用イベントトラッキング
    func track(_ event: AnalyticsEvent, properties: [String: MixpanelType]? = nil) {
        Mixpanel.mainInstance().track(event: event.rawValue, properties: properties)
        logger.debug("Tracked event: \(event.rawValue, privacy: .public)")
    }
    
    // MARK: - Convenience Methods

    /// トライアル開始
    func trackTrialStarted(productId: String) {
        track(.trialStarted, properties: [
            "product_id": productId
        ])
    }
    
    /// 購入完了
    func trackPurchaseCompleted(productId: String, revenue: Double) {
        track(.purchaseCompleted, properties: [
            "product_id": productId,
            "revenue": revenue
        ])
        
        // Revenue tracking
        Mixpanel.mainInstance().people.trackCharge(amount: revenue)
    }
    
    /// 音声セッション開始
    func trackSessionStarted(habitType: String, customHabitId: String? = nil) {
        var props: [String: MixpanelType] = ["habit_type": habitType]
        if let customId = customHabitId {
            props["custom_habit_id"] = customId
        }
        track(.sessionStarted, properties: props)
    }
    
    /// 音声セッション完了
    func trackSessionCompleted(habitType: String, durationSeconds: Int) {
        track(.sessionCompleted, properties: [
            "habit_type": habitType,
            "duration_seconds": durationSeconds
        ])
    }
}

// MARK: - Analytics Events

enum AnalyticsEvent: String {
    // App
    case appOpened = "app_opened"

    // Onboarding funnel
    case onboardingStarted = "onboarding_started"
    case onboardingWelcomeCompleted = "onboarding_welcome_completed"
    case onboardingStrugglesCompleted = "onboarding_struggles_completed"
    case onboardingStruggleDepthCompleted = "onboarding_struggle_depth_completed"
    case onboardingGoalsCompleted = "onboarding_goals_completed"
    case onboardingInsightCompleted = "onboarding_insight_completed"
    case onboardingValuePropCompleted = "onboarding_valueprop_completed"
    case onboardingNotificationsCompleted = "onboarding_notifications_completed"
    case onboardingCompleted = "onboarding_completed"

    // Paywall funnel
    case paywallPrimerViewed = "paywall_primer_viewed"
    case paywallPlanSelectionViewed = "paywall_plan_selection_viewed"
    case onboardingPaywallPurchased = "onboarding_paywall_purchased"
    case onboardingPaywallDismissedFree = "onboarding_paywall_dismissed_free"

    // Subscription
    case trialStarted = "trial_started"
    case trialCancelled = "trial_cancelled"
    case purchaseCompleted = "purchase_completed"
    case subscriptionRenewed = "subscription_renewed"
    case subscriptionCancelled = "subscription_cancelled"

    // Voice Session
    case sessionStarted = "session_started"
    case sessionCompleted = "session_completed"
    case sessionFailed = "session_failed"

    // Habits
    case habitCreated = "habit_created"
    case habitDeleted = "habit_deleted"
    case habitNotificationTapped = "habit_notification_tapped"

    // Engagement
    case talkTabOpened = "talk_tab_opened"
    case settingsOpened = "settings_opened"

    // Nudge
    case nudgeTapped = "nudge_tapped"
    case nudgeIgnored = "nudge_ignored"
    case nudgePositiveFeedback = "nudge_positive_feedback"
    case nudgeNegativeFeedback = "nudge_negative_feedback"
    case nudgeScheduled = "nudge_scheduled"
}

