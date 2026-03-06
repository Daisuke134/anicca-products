import Foundation

final class ProgressService {
    func recordSession(duration: Int, current: UserProgress) -> UserProgress {
        let clampedDuration = max(0, min(duration, 1440))

        let today = Calendar.current.startOfDay(for: Date())
        let todayKey = ISO8601DateFormatter().string(from: today)
        let lastActive = current.lastActiveDate.map { Calendar.current.startOfDay(for: $0) }

        let isFirstToday = lastActive != today
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)
        let isConsecutive = lastActive == yesterday

        return UserProgress(
            todayCount: isFirstToday ? 1 : current.todayCount + 1,
            streak: isFirstToday ? (isConsecutive ? current.streak + 1 : 1) : current.streak,
            totalSessions: current.totalSessions + 1,
            totalMinutes: current.totalMinutes + clampedDuration,
            lastActiveDate: Date(),
            weekHistory: {
                var weekHistory = current.weekHistory
                weekHistory[todayKey] = (weekHistory[todayKey] ?? 0) + 1
                return weekHistory
            }()
        )
    }
}
