import Foundation
import SwiftData

@Model
final class PlungeSession {
    var id: UUID
    var date: Date
    var duration: TimeInterval
    var waterTemperature: Double?
    var hotTemperature: Double?
    var notes: String
    var heartRateAvg: Double?
    var heartRateMax: Double?
    var heartRates: [Double]
    var protocolName: String?
    var isContrastSession: Bool
    var coldDuration: TimeInterval?
    var hotDuration: TimeInterval?
    var roundsCompleted: Int?
    var createdAt: Date

    init(duration: TimeInterval, waterTemperature: Double? = nil, notes: String = "") {
        self.id = UUID()
        self.date = Date()
        self.duration = duration
        self.waterTemperature = waterTemperature
        self.notes = notes
        self.heartRates = []
        self.isContrastSession = false
        self.createdAt = Date()
    }
}

enum AccessibilityID {
    static let timerView = "timer_view"
    static let timerStartButton = "timer_start_button"
    static let timerPauseButton = "timer_pause_button"
    static let timerStopButton = "timer_stop_button"
    static let timerCountdown = "timer_countdown"
    static let breathingPrepView = "breathing_prep_view"
    static let sessionSummaryView = "session_summary_view"
    static let historyView = "history_view"
    static let historyList = "history_list"
    static let sessionCard = "session_card"
    static let progressDashboard = "progress_dashboard"
    static let settingsView = "settings_view"
    static let settingsUpgradeButton = "settings_upgrade_button"
    static let onboardingView = "onboarding_view"
    static let onboardingNextButton = "onboarding_next_button"
    static let paywallView = "paywall_view"
    static let paywallHeadline = "paywall_headline"
    static let paywallPlanWeekly = "paywall_plan_weekly"
    static let paywallPlanMonthly = "paywall_plan_monthly"
    static let paywallPlanYearly = "paywall_plan_yearly"
    static let paywallCta = "paywall_cta"
    static let paywallMaybeLater = "paywall_maybe_later"
    static let paywallRestore = "paywall_restore"
    static let streakCalendar = "streak_calendar"
    static let temperatureToggle = "temperature_toggle"
}
