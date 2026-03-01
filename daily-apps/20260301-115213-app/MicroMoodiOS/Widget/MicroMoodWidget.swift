import WidgetKit
import SwiftUI
import CoreData

// MARK: - Widget Timeline Entry

struct MoodWidgetEntry: TimelineEntry {
    let date: Date
    let lastMoodEmoji: String
    let lastMoodLabel: String
    let hasEntryToday: Bool
}

// MARK: - Timeline Provider

struct MoodWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> MoodWidgetEntry {
        MoodWidgetEntry(date: Date(), lastMoodEmoji: "😊", lastMoodLabel: "Good", hasEntryToday: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (MoodWidgetEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MoodWidgetEntry>) -> Void) {
        let entry = makeEntry()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry() -> MoodWidgetEntry {
        let container = PersistenceController.shared.container
        let context = container.viewContext
        let request = MoodEntryMO.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MoodEntryMO.timestamp, ascending: false)]
        request.fetchLimit = 1

        let entries = (try? context.fetch(request)) ?? []
        let todayEntry = entries.first.flatMap { entry -> MoodEntryMO? in
            Calendar.current.isDateInToday(entry.timestamp) ? entry : nil
        }

        if let entry = todayEntry {
            let mood = MoodLevel(rawValue: Int(entry.moodLevel)) ?? .okay
            return MoodWidgetEntry(date: Date(), lastMoodEmoji: mood.emoji, lastMoodLabel: mood.label, hasEntryToday: true)
        } else if let lastEntry = entries.first {
            let mood = MoodLevel(rawValue: Int(lastEntry.moodLevel)) ?? .okay
            return MoodWidgetEntry(date: Date(), lastMoodEmoji: mood.emoji, lastMoodLabel: mood.label, hasEntryToday: false)
        }

        return MoodWidgetEntry(date: Date(), lastMoodEmoji: "😊", lastMoodLabel: "Tap to log", hasEntryToday: false)
    }
}

// MARK: - Widget View

struct MoodWidgetEntryView: View {
    let entry: MoodWidgetEntry

    var body: some View {
        ZStack {
            Color("BackgroundColor")

            VStack(spacing: 8) {
                Text(entry.lastMoodEmoji)
                    .font(.system(size: 40))

                if entry.hasEntryToday {
                    Text(entry.lastMoodLabel)
                        .font(.caption.bold())
                        .foregroundColor(.white)
                    Text("Today ✓")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.5))
                } else {
                    Text("How are you?")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                    Text("Tap to log")
                        .font(.caption2)
                        .foregroundColor(Color("AccentColor"))
                }
            }
        }
        .containerBackground(Color("BackgroundColor"), for: .widget)
    }
}

// MARK: - Widget Configuration

@main
struct MicroMoodWidget: Widget {
    let kind = "MicroMoodWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MoodWidgetProvider()) { entry in
            MoodWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Micro Mood")
        .description("Log your mood from your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
