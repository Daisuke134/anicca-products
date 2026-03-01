import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var subscriptionManager: SubscriptionManager
    @State private var entries: [MoodEntry] = []
    @State private var showingPaywall = false

    private let moodStore = MoodStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color("BackgroundColor").ignoresSafeArea()

                Group {
                    if entries.isEmpty {
                        VStack(spacing: 16) {
                            Text("📝")
                                .font(.system(size: 64))
                            Text("No entries yet")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Log your mood from the home screen")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.6))
                        }
                    } else {
                        List {
                            ForEach(groupedEntries, id: \.key) { section in
                                Section(header:
                                    Text(section.key)
                                        .foregroundColor(.white.opacity(0.6))
                                        .font(.subheadline.bold())
                                ) {
                                    ForEach(section.value) { entry in
                                        HistoryRowView(entry: entry)
                                            .listRowBackground(Color.white.opacity(0.05))
                                            .listRowSeparator(.hidden)
                                    }
                                }
                            }
                        }
                        .listStyle(.insetGrouped)
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("History")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if !subscriptionManager.isPro {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Upgrade") { showingPaywall = true }
                            .foregroundColor(Color("AccentColor"))
                    }
                }
            }
            .sheet(isPresented: $showingPaywall) {
                if let offering = subscriptionManager.currentOffering {
                    RevenueCatUI.PaywallView(offering: offering)
                }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { loadEntries() }
    }

    private func loadEntries() {
        let limit = subscriptionManager.isPro ? 365 : 30
        entries = moodStore.fetchEntries(limit: limit).map { MoodEntry(from: $0) }
    }

    private var groupedEntries: [(key: String, value: [MoodEntry])] {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM d, yyyy"
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: entries) { entry in
            if calendar.isDateInToday(entry.timestamp) { return "Today" }
            if calendar.isDateInYesterday(entry.timestamp) { return "Yesterday" }
            return formatter.string(from: entry.timestamp)
        }
        return grouped.sorted { a, b in
            guard let da = entries.first(where: { formatter.string(from: $0.timestamp) == a.key || a.key == "Today" || a.key == "Yesterday" })?.timestamp,
                  let db = entries.first(where: { formatter.string(from: $0.timestamp) == b.key || b.key == "Today" || b.key == "Yesterday" })?.timestamp else { return false }
            return da > db
        }
    }
}

struct HistoryRowView: View {
    let entry: MoodEntry

    var body: some View {
        HStack(spacing: 16) {
            Text(entry.moodLevel.emoji)
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.moodLevel.label)
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
                if let note = entry.note {
                    Text(note)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            Spacer()
            Text(entry.timestamp, style: .time)
                .font(.caption)
                .foregroundColor(.white.opacity(0.4))
        }
        .padding(.vertical, 4)
    }
}
