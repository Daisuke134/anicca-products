import SwiftUI
import RevenueCat
import RevenueCatUI
import Mixpanel

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @EnvironmentObject private var subscriptionManager: SubscriptionManager
    @State private var showingCheckIn = false
    @State private var showingPaywall = false
    @State private var selectedMood: MoodLevel?
    @State private var noteText = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color("BackgroundColor").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        greetingHeader
                        todayMoodCard
                        recentMoodsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingCheckIn) {
            CheckInSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $showingPaywall) {
            if let offering = subscriptionManager.currentOffering {
                PaywallView(offering: offering)
                    .onPurchaseCompleted { _ in showingPaywall = false }
                    .onRestoreCompleted { _ in showingPaywall = false }
            }
        }
        .task { await viewModel.loadData() }
        .onAppear {
            if let offering = subscriptionManager.currentOffering {
                Mixpanel.mainInstance().track(event: "paywall_viewed", properties: [
                    "offering_id": offering.identifier,
                    "source": "home"
                ])
            }
        }
    }

    private var greetingHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greetingText)
                    .font(.title2.bold())
                    .foregroundColor(.white)
                Text(dateText)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.6))
            }
            Spacer()
        }
    }

    private var todayMoodCard: some View {
        VStack(spacing: 16) {
            if let entry = viewModel.todayEntry {
                VStack(spacing: 12) {
                    Text(entry.moodLevel.emoji)
                        .font(.system(size: 64))
                    Text("Today: \(entry.moodLevel.label)")
                        .font(.headline)
                        .foregroundColor(.white)
                    if let note = entry.note {
                        Text(note)
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                    }
                    Button("Update") { showingCheckIn = true }
                        .font(.subheadline)
                        .foregroundColor(Color("AccentColor"))
                }
            } else {
                VStack(spacing: 16) {
                    Text("How are you feeling?")
                        .font(.headline)
                        .foregroundColor(.white)
                    HStack(spacing: 16) {
                        ForEach(MoodLevel.allCases, id: \.self) { mood in
                            Button(action: {
                                selectedMood = mood
                                showingCheckIn = true
                            }) {
                                Text(mood.emoji)
                                    .font(.system(size: 36))
                            }
                            .accessibilityIdentifier("mood_button_\(mood.rawValue)")
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var recentMoodsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent")
                .font(.headline)
                .foregroundColor(.white)

            if viewModel.recentEntries.isEmpty {
                Text("No entries yet. Log your first mood above.")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
            } else {
                ForEach(viewModel.recentEntries.prefix(7)) { entry in
                    MoodRowView(entry: entry)
                }
            }
        }
    }

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var dateText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: Date())
    }
}

struct MoodRowView: View {
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
                        .lineLimit(1)
                }
            }
            Spacer()
            Text(entry.timestamp, style: .time)
                .font(.caption)
                .foregroundColor(.white.opacity(0.5))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct CheckInSheet: View {
    @ObservedObject var viewModel: HomeViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedMood: MoodLevel?
    @State private var noteText = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color("BackgroundColor").ignoresSafeArea()
                VStack(spacing: 32) {
                    Text("How are you feeling?")
                        .font(.title2.bold())
                        .foregroundColor(.white)

                    HStack(spacing: 20) {
                        ForEach(MoodLevel.allCases, id: \.self) { mood in
                            Button(action: { selectedMood = mood }) {
                                VStack(spacing: 8) {
                                    Text(mood.emoji)
                                        .font(.system(size: 44))
                                    Text(mood.label)
                                        .font(.caption2)
                                        .foregroundColor(.white.opacity(0.7))
                                }
                                .padding(12)
                                .background(selectedMood == mood ? Color("AccentColor").opacity(0.3) : Color.white.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(selectedMood == mood ? Color("AccentColor") : Color.clear, lineWidth: 2)
                                )
                            }
                        }
                    }

                    TextField("Add a note (optional)", text: $noteText, axis: .vertical)
                        .padding(16)
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .accessibilityIdentifier("checkin_note_field")

                    Button(action: save) {
                        Text("Save")
                            .font(.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(selectedMood != nil ? Color("AccentColor") : Color.gray)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .disabled(selectedMood == nil)
                    .accessibilityIdentifier("checkin_save_button")

                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 32)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(Color("AccentColor"))
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func save() {
        guard let mood = selectedMood else { return }
        Task {
            await viewModel.saveMood(mood, note: noteText)
            dismiss()
        }
    }
}
