import Foundation
import SwiftData
import SwiftUI

@Observable
@MainActor
class AppViewModel {
    var language: AppLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: "app_language") }
    }
    var hasCompletedOnboarding: Bool {
        didSet { UserDefaults.standard.set(hasCompletedOnboarding, forKey: "has_onboarded") }
    }
    private let defaults: UserDefaults

    var isPro: Bool {
        didSet { defaults.set(isPro, forKey: Self.isProKey) }
    }
    var showPaywall: Bool = false

    var currentAffirmation: Affirmation = AffirmationData.forDay()

    static let freeHistoryDays = 7
    static let streakPaywallShownKey = "streak3_paywall_shown"
    static let isProKey = "is_pro_cached"

    // Free: always today's affirmation, even across midnight. Pro: the one they last picked.
    var displayedAffirmation: Affirmation {
        isPro ? currentAffirmation : AffirmationData.forDay()
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.isPro = defaults.bool(forKey: Self.isProKey)
        self.language = .english
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "has_onboarded")
    }

    // Free: today's affirmation only. Pro: the full library.
    func refreshAffirmation() {
        guard isPro else {
            showPaywall = true
            return
        }
        currentAffirmation = AffirmationData.random()
    }

    // Free: one entry per day. Pro: unlimited.
    func canAddEntry(entries: [GratitudeEntry]) -> Bool {
        isPro || !hasTodayEntry(entries: entries)
    }

    // Free: the last 7 days of history. Pro: everything.
    func isLocked(_ entry: GratitudeEntry) -> Bool {
        guard !isPro else { return false }
        let calendar = Calendar.current
        let cutoff = calendar.date(byAdding: .day, value: -(Self.freeHistoryDays - 1), to: calendar.startOfDay(for: Date()))!
        return entry.date < cutoff
    }

    // Soft paywall once, when a free user first reaches a 3-day streak.
    func didSaveEntry(entries: [GratitudeEntry]) {
        guard !isPro,
              calculateStreak(entries: entries) >= 3,
              !defaults.bool(forKey: Self.streakPaywallShownKey) else { return }
        defaults.set(true, forKey: Self.streakPaywallShownKey)
        showPaywall = true
    }

    func calculateStreak(entries: [GratitudeEntry]) -> Int {
        let calendar = Calendar.current
        let sortedDates = Set(entries.map { calendar.startOfDay(for: $0.date) }).sorted(by: >)

        guard !sortedDates.isEmpty else { return 0 }

        let today = calendar.startOfDay(for: Date())
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!

        guard sortedDates[0] == today || sortedDates[0] == yesterday else { return 0 }

        var streak = 1
        for i in 1..<sortedDates.count {
            let expected = calendar.date(byAdding: .day, value: -i, to: sortedDates[0])!
            if sortedDates[i] == expected {
                streak += 1
            } else {
                break
            }
        }
        return streak
    }

    func hasTodayEntry(entries: [GratitudeEntry]) -> Bool {
        let today = Calendar.current.startOfDay(for: Date())
        return entries.contains { Calendar.current.startOfDay(for: $0.date) == today }
    }

    func entryCount(entries: [GratitudeEntry]) -> Int {
        entries.count
    }
}
