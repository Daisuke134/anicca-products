import Foundation
import SwiftUI
import Mixpanel

@MainActor
class HomeViewModel: ObservableObject {
    @Published var todayEntry: MoodEntry?
    @Published var recentEntries: [MoodEntry] = []
    @Published var isLoading = false
    @Published var showingPaywall = false

    private let moodStore: MoodStore

    init(moodStore: MoodStore = .shared) {
        self.moodStore = moodStore
        Task { await loadData() }
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        let moEntries = moodStore.fetchEntries(limit: 7)
        let entries = moEntries.map { MoodEntry(from: $0) }
        let calendar = Calendar.current
        todayEntry = entries.first { calendar.isDateInToday($0.timestamp) }
        recentEntries = entries
    }

    func saveMood(_ level: MoodLevel, note: String?) async {
        try? moodStore.saveMoodEntry(level: level.rawValue, note: note?.isEmpty == true ? nil : note)
        Mixpanel.mainInstance().track(event: "mood_logged", properties: [
            "mood_level": Int(level.rawValue),
            "has_note": note?.isEmpty == false
        ])
        await loadData()
    }
}
