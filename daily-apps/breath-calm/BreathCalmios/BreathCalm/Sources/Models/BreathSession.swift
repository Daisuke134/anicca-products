import Foundation

struct BreathSession: Codable, Identifiable {
    let id: UUID
    let sessionType: SessionType
    let date: Date
    let moodBefore: Int
    let moodAfter: Int
    let durationSeconds: Int

    init(
        id: UUID = UUID(),
        sessionType: SessionType,
        date: Date = Date(),
        moodBefore: Int,
        moodAfter: Int,
        durationSeconds: Int
    ) {
        self.id = id
        self.sessionType = sessionType
        self.date = date
        self.moodBefore = moodBefore
        self.moodAfter = moodAfter
        self.durationSeconds = durationSeconds
    }

    var improvement: Int {
        moodBefore - moodAfter
    }
}
