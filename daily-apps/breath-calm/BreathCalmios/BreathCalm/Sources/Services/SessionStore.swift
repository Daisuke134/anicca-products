import Foundation

class SessionStore: ObservableObject {
    static let shared = SessionStore()

    @Published private(set) var sessions: [BreathSession] = []

    private let storageKey = "breath_sessions"

    private init() {
        load()
    }

    func add(_ session: BreathSession) {
        sessions.append(session)
        save()
    }

    func todayCount() -> Int {
        let calendar = Calendar.current
        return sessions.filter { calendar.isDateInToday($0.date) }.count
    }

    func currentStreak() -> Int {
        guard !sessions.isEmpty else { return 0 }
        let calendar = Calendar.current
        var streak = 0
        var checkDate = Date()

        while true {
            let hasSession = sessions.contains { calendar.isDate($0.date, inSameDayAs: checkDate) }
            if hasSession {
                streak += 1
                checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate) ?? checkDate
            } else {
                break
            }
        }
        return streak
    }

    func averageImprovement() -> Double {
        guard !sessions.isEmpty else { return 0 }
        let total = sessions.reduce(0) { $0 + $1.improvement }
        return Double(total) / Double(sessions.count)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([BreathSession].self, from: data) else { return }
        sessions = decoded
    }
}
