import Foundation

@MainActor
final class StreakViewModel: ObservableObject {
    @Published var streak: StreakRecord = StreakRecord()
    private let store = RitualStore()

    func load() {
        streak = store.loadStreak()
        checkForNewDay()
    }

    func processCompletion() {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        if let last = streak.lastCompletedDate {
            let lastDay = calendar.startOfDay(for: last)
            let diff = calendar.dateComponents([.day], from: lastDay, to: today).day ?? 0

            if diff == 0 {
                return // Already completed today
            } else if diff == 1 {
                streak = StreakRecord(
                    currentStreak: streak.currentStreak + 1,
                    longestStreak: max(streak.longestStreak, streak.currentStreak + 1),
                    lastCompletedDate: today
                )
            } else {
                streak = StreakRecord(
                    currentStreak: 1,
                    longestStreak: streak.longestStreak,
                    lastCompletedDate: today
                )
            }
        } else {
            streak = StreakRecord(
                currentStreak: 1,
                longestStreak: max(streak.longestStreak, 1),
                lastCompletedDate: today
            )
        }
        store.saveStreak(streak)
    }

    func checkForNewDay() {
        guard let last = streak.lastCompletedDate else { return }
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let lastDay = calendar.startOfDay(for: last)
        let diff = calendar.dateComponents([.day], from: lastDay, to: today).day ?? 0

        if diff > 1 {
            streak = StreakRecord(
                currentStreak: 0,
                longestStreak: streak.longestStreak,
                lastCompletedDate: streak.lastCompletedDate
            )
            store.saveStreak(streak)
        }
    }
}
