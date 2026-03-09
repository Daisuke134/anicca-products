import SwiftUI

/// Phase 5: CONVERT — Step 2: Blinkist-style timeline (Today → Day 5 → Day 7).
struct TrialTimelineStepView: View {
    let next: () -> Void

    private let milestones: [(key: String, icon: String)] = [
        ("paywall_timeline_today", "play.circle.fill"),
        ("paywall_timeline_day5", "bell.fill"),
        ("paywall_timeline_day7", "checkmark.seal.fill")
    ]

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Text(String(localized: "paywall_timeline_title"))
                .font(.system(size: 32, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(milestones.enumerated()), id: \.element.key) { index, milestone in
                    HStack(alignment: .top, spacing: 16) {
                        VStack(spacing: 0) {
                            Image(systemName: milestone.icon)
                                .font(.system(size: 24))
                                .foregroundStyle(AppTheme.Colors.accent)
                                .frame(width: 32, height: 32)

                            if index < milestones.count - 1 {
                                Rectangle()
                                    .fill(AppTheme.Colors.accent.opacity(0.3))
                                    .frame(width: 2, height: 40)
                            }
                        }

                        Text(String(localized: String.LocalizationValue(milestone.key)))
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.label)
                            .padding(.top, 4)

                        Spacer()
                    }
                }
            }
            .padding(.horizontal, 40)

            Text(String(localized: "paywall_timeline_subtitle"))
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button {
                next()
            } label: {
                Text(String(localized: "common_continue"))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .accessibilityIdentifier("paywall-timeline-cta")
            .padding(.horizontal, 24)
            .padding(.bottom, 64)
        }
        .background(AppBackground())
        .onAppear {
            AnalyticsManager.shared.track(.paywallTimelineViewed)
        }
    }
}
