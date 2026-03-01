import Foundation

// Rule-based weekly insight engine (v1 — no LLM dependency)
struct InsightEngine {

    func generateWeeklyInsight(from entries: [MoodEntry]) -> String {
        guard entries.count >= 3 else {
            return "Log your mood for a few more days to see patterns."
        }

        let recentEntries = entries.prefix(7)
        let avgMood = recentEntries.map { Double($0.moodLevel.rawValue) }.reduce(0, +) / Double(recentEntries.count)

        let dayGroups = Dictionary(grouping: recentEntries) { entry -> Int in
            Calendar.current.component(.weekday, from: entry.timestamp)
        }

        let dayAverages = dayGroups.mapValues { dayEntries in
            dayEntries.map { Double($0.moodLevel.rawValue) }.reduce(0, +) / Double(dayEntries.count)
        }

        if let worstDay = dayAverages.min(by: { $0.value < $1.value }), worstDay.value < 3.0 {
            let dayName = Calendar.current.weekdaySymbols[worstDay.key - 1]
            return "Your mood tends to dip on \(dayName)s. Try scheduling something enjoyable that day."
        }

        if avgMood >= 4.0 {
            return "Great week! Your average mood was \(String(format: "%.1f", avgMood))/5. Keep up what you're doing."
        } else if avgMood <= 2.5 {
            return "Tough week with an average mood of \(String(format: "%.1f", avgMood))/5. Small changes in sleep and movement often help."
        }

        return "Your mood averaged \(String(format: "%.1f", avgMood))/5 this week. Consistent tracking reveals deeper patterns over time."
    }

    func dominantMood(from entries: [MoodEntry]) -> MoodLevel? {
        guard !entries.isEmpty else { return nil }
        let counts = Dictionary(grouping: entries) { $0.moodLevel }.mapValues { $0.count }
        return counts.max(by: { $0.value < $1.value })?.key
    }
}
