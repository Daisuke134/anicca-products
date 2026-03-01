import Foundation

@MainActor
class InsightsViewModel: ObservableObject {
    @Published var weeklyInsight: String = ""
    @Published var moodTrend: [MoodEntry] = []
    @Published var isLoading = false
    @Published var showingPaywall = false

    private let moodStore: MoodStore
    private let insightEngine: InsightEngine

    init(moodStore: MoodStore = .shared, insightEngine: InsightEngine = InsightEngine()) {
        self.moodStore = moodStore
        self.insightEngine = insightEngine
        Task { await loadInsights() }
    }

    func loadInsights() async {
        isLoading = true
        defer { isLoading = false }
        let entries = moodStore.fetchEntries(limit: 30).map { MoodEntry(from: $0) }
        moodTrend = entries
        weeklyInsight = insightEngine.generateWeeklyInsight(from: entries)
    }
}
