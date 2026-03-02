import Foundation

final class RitualStore {
    private let stepsKey = "ritual_steps"
    private let streakKey = "streak_record"

    func loadSteps() -> [RitualStep] {
        guard let data = UserDefaults.standard.data(forKey: stepsKey),
              let steps = try? JSONDecoder().decode([RitualStep].self, from: data) else {
            return defaultSteps()
        }
        return steps
    }

    func saveSteps(_ steps: [RitualStep]) {
        if let data = try? JSONEncoder().encode(steps) {
            UserDefaults.standard.set(data, forKey: stepsKey)
        }
    }

    func loadStreak() -> StreakRecord {
        guard let data = UserDefaults.standard.data(forKey: streakKey),
              let record = try? JSONDecoder().decode(StreakRecord.self, from: data) else {
            return StreakRecord()
        }
        return record
    }

    func saveStreak(_ record: StreakRecord) {
        if let data = try? JSONEncoder().encode(record) {
            UserDefaults.standard.set(data, forKey: streakKey)
        }
    }

    private func defaultSteps() -> [RitualStep] {
        [
            RitualStep(name: "Dim the lights"),
            RitualStep(name: "Put phone in airplane mode"),
            RitualStep(name: "Take 5 deep breaths")
        ]
    }
}
