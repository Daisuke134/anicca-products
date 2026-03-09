// File: ViewModels/DashboardViewModel.swift
// Implements F-004: Weekly Zone 2 progress calculation
// Source: Apple Swift Evolution SE-0395 — @Observable
// "@Observable replaces ObservableObject with zero boilerplate."

import Foundation
import Observation

@Observable
final class DashboardViewModel {
    var weeklyZone2Minutes: Double = 0
    var weeklyGoalMinutes: Int = 150
    var streak: Int = 0

    func loadWeeklyData(sessions: [WorkoutSession]) {
        let calendar = Calendar.current
        // Source: docs/IMPLEMENTATION_GUIDE.md — M-001 fix: dateInterval(of:)
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: .now)?.start ?? .now
        let thisWeek = sessions.filter { $0.date >= startOfWeek }
        weeklyZone2Minutes = thisWeek.reduce(0) { $0 + $1.zone2Minutes }
        streak = calculateStreak(sessions: sessions)
    }

    var progressFraction: Double {
        min(weeklyZone2Minutes / Double(weeklyGoalMinutes), 1.0)
    }

    /// Count consecutive days ending today where zone2Seconds > 0
    private func calculateStreak(sessions: [WorkoutSession]) -> Int {
        let calendar = Calendar.current
        var count = 0
        var checkDate = Date.now
        let sorted = sessions.sorted { $0.date > $1.date }

        for _ in 0..<365 {
            let hasSession = sorted.contains {
                calendar.isDate($0.date, inSameDayAs: checkDate) && $0.zone2Seconds > 0
            }
            if hasSession {
                count += 1
            } else {
                break
            }
            guard let prev = calendar.date(byAdding: .day, value: -1, to: checkDate) else { break }
            checkDate = prev
        }
        return count
    }

    func canLogWorkout(sessions: [WorkoutSession], isPremium: Bool) -> Bool {
        guard !isPremium else { return true }
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: .now) ?? .now
        let recentCount = sessions.filter { $0.date >= sevenDaysAgo }.count
        return recentCount < 3
    }
}
