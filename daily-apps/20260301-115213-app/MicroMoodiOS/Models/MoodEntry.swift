import Foundation

struct MoodEntry: Identifiable {
    let id: UUID
    let timestamp: Date
    let moodLevel: MoodLevel
    let note: String?

    init(id: UUID = UUID(), timestamp: Date = Date(), moodLevel: MoodLevel, note: String? = nil) {
        self.id = id
        self.timestamp = timestamp
        self.moodLevel = moodLevel
        self.note = note
    }

    init(from mo: MoodEntryMO) {
        self.id = mo.id
        self.timestamp = mo.timestamp
        self.moodLevel = MoodLevel(rawValue: Int(mo.moodLevel)) ?? .okay
        self.note = mo.note
    }
}
