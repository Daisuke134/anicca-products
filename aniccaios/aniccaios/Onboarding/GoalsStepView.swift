import SwiftUI

/// Phase 2: INVEST — chip selection for goals (like Struggles).
struct GoalsStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState

    private let options: [String] = [
        "better_sleep", "emotional_calm", "less_screen_time", "more_discipline",
        "self_acceptance", "deeper_focus", "healthier_habits", "inner_peace"
    ]

    @State private var selected: Set<String> = []

    var body: some View {
        VStack(spacing: 24) {
            Text(String(localized: "onboarding_goals_title"))
                .font(.system(size: 32, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.top, 40)
                .padding(.horizontal, 24)

            Text(String(localized: "onboarding_goals_subtitle"))
                .font(.system(size: 16))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ], spacing: 12) {
                    ForEach(options, id: \.self) { key in
                        chipButton(key: key)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
            .scrollIndicators(.visible)

            Button {
                saveAndAdvance()
            } label: {
                Text(String(localized: "common_next"))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(selected.isEmpty ? AppTheme.Colors.label.opacity(0.5) : AppTheme.Colors.label)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .disabled(selected.isEmpty)
            .accessibilityIdentifier("onboarding-goals-next")
            .padding(.horizontal, 24)
            .padding(.bottom, 64)
        }
        .background(AppBackground())
        .onAppear {
            selected = Set(appState.userProfile.goals)
        }
    }

    @ViewBuilder
    private func chipButton(key: String) -> some View {
        let isSelected = selected.contains(key)
        Button {
            if isSelected {
                selected.remove(key)
            } else {
                selected.insert(key)
            }
        } label: {
            Text(NSLocalizedString("goal_\(key)", comment: ""))
                .font(.system(size: 14, weight: .medium))
                .lineLimit(2)
                .minimumScaleFactor(0.8)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, minHeight: 56)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? AppTheme.Colors.buttonSelected : AppTheme.Colors.buttonUnselected)
                .foregroundStyle(isSelected ? AppTheme.Colors.buttonTextSelected : AppTheme.Colors.label)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("onboarding-goal-\(key)")
    }

    private func saveAndAdvance() {
        var profile = appState.userProfile
        profile.goals = Array(selected)
        appState.updateUserProfile(profile, sync: true)
        AnalyticsManager.shared.track(.onboardingGoalsCompleted, properties: [
            "goals_count": selected.count
        ])
        next()
    }
}
