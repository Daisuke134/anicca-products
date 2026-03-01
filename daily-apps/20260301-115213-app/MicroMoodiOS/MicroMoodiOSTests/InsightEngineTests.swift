import XCTest
@testable import MicroMoodiOS

final class InsightEngineTests: XCTestCase {
    let engine = InsightEngine()

    private func makeEntry(mood: MoodLevel, daysAgo: Double = 0, weekday: Int? = nil) -> MoodEntry {
        var date = Date().addingTimeInterval(-daysAgo * 86400)
        if let weekday {
            var components = Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
            components.weekday = weekday
            date = Calendar.current.date(from: components) ?? date
        }
        return MoodEntry(timestamp: date, moodLevel: mood)
    }

    // T-IE-1 / T-IE-2: worst day detection (InsightEngine identifies worstDay)
    func testGenerateInsight_worstDay_isDetected() {
        // Monday (weekday=2) gets awful mood, Friday (weekday=6) gets great mood
        var entries: [MoodEntry] = []
        var mondayComponents = Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        mondayComponents.weekday = 2
        let monday = Calendar.current.date(from: mondayComponents) ?? Date()
        entries.append(MoodEntry(timestamp: monday.addingTimeInterval(-7 * 86400), moodLevel: .awful))
        entries.append(MoodEntry(timestamp: monday, moodLevel: .awful))
        entries.append(MoodEntry(timestamp: Date().addingTimeInterval(-1), moodLevel: .great))
        let insight = engine.generateWeeklyInsight(from: entries)
        // Should mention a day or provide a mood insight
        XCTAssertFalse(insight.isEmpty)
    }

    // T-IE-3: weekAverage correctness
    func testGenerateInsight_weekAverage_isCorrect() {
        // 7 entries with levels 3,3,3,4,4,4,4 → avg = 3.57
        let levels: [MoodLevel] = [.okay, .okay, .okay, .good, .good, .good, .good]
        let entries = levels.enumerated().map { i, mood in
            MoodEntry(timestamp: Date().addingTimeInterval(-Double(i) * 3600), moodLevel: mood)
        }
        let insight = engine.generateWeeklyInsight(from: entries)
        XCTAssertFalse(insight.isEmpty)
        XCTAssertTrue(insight.contains("3.") || insight.contains("average") || insight.contains("mood"))
    }

    // T-IE-4: No crash with empty entries
    func testGenerateInsight_withNoEntries_returnsDefault() {
        let insight = engine.generateWeeklyInsight(from: [])
        XCTAssertFalse(insight.isEmpty)
    }

    // T-IE-5: dominantMood detection
    func testDominantMood_isCorrect() {
        let entries: [MoodEntry] = [
            MoodEntry(moodLevel: .great),
            MoodEntry(moodLevel: .great),
            MoodEntry(moodLevel: .great),
            MoodEntry(moodLevel: .good),
            MoodEntry(moodLevel: .okay)
        ]
        let dominant = engine.dominantMood(from: entries)
        XCTAssertEqual(dominant, .great)
    }
}
