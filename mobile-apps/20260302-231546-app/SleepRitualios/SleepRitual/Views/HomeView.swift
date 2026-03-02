import SwiftUI

struct HomeView: View {
    @StateObject private var ritualVM = RitualViewModel()
    @StateObject private var streakVM = StreakViewModel()
    @ObservedObject private var subscriptionService = SubscriptionService.shared
    @State private var showingPaywall = false
    @State private var showCompletionAnimation = false
    private let maxFreeSteps = 3

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.15).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    streakBadge

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Tonight's Ritual")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                            .padding(.horizontal)

                        ForEach(ritualVM.steps) { step in
                            stepRow(step)
                        }
                    }

                    if ritualVM.allCompleted && !showCompletionAnimation {
                        completionButton
                    }
                }
                .padding(.vertical)
            }
        }
        .onAppear {
            ritualVM.load()
            streakVM.load()
        }
        .sheet(isPresented: $showingPaywall) {
            PaywallView(onDismiss: { showingPaywall = false })
        }
    }

    private var streakBadge: some View {
        VStack(spacing: 8) {
            Text("🔥 \(streakVM.streak.currentStreak)")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            Text("night streak")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.6))
        }
        .padding(.top, 24)
    }

    private func stepRow(_ step: RitualStep) -> some View {
        Button {
            ritualVM.toggleStep(step)
        } label: {
            HStack(spacing: 16) {
                Image(systemName: step.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(step.isCompleted ? Color(red: 0.5, green: 0.4, blue: 1.0) : .white.opacity(0.4))
                Text(step.name)
                    .foregroundColor(step.isCompleted ? .white.opacity(0.5) : .white)
                    .strikethrough(step.isCompleted)
                Spacer()
            }
            .padding(.horizontal)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.07))
            )
            .padding(.horizontal)
        }
    }

    private var completionButton: some View {
        Button {
            withAnimation(.spring()) { showCompletionAnimation = true }
            streakVM.processCompletion()
            AnalyticsService.shared.trackRitualCompleted(streakCount: streakVM.streak.currentStreak)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                showCompletionAnimation = false
                ritualVM.resetForNewDay()
            }
        } label: {
            Text("Mark Night Complete ✓")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color(red: 0.3, green: 0.2, blue: 0.8))
                )
                .padding(.horizontal)
        }
    }
}
