import Foundation

struct StreakRecord: Codable {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var lastCompletedDate: Date?
    var graceUsedThisWeek: Bool = false
}
