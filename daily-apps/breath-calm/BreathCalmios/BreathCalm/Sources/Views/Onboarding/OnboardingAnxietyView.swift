import SwiftUI

struct OnboardingAnxietyView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @State private var showNext = false
    @AppStorage("initial_anxiety_level") private var anxietyLevel = ""

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                Text(NSLocalizedString("onboarding.anxiety.title", comment: ""))
                    .font(.system(size: 28, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color.bcText)
                    .padding(.horizontal, 24)

                VStack(spacing: 16) {
                    anxietyButton(
                        title: NSLocalizedString("onboarding.anxiety.high", comment: ""),
                        level: "high",
                        color: Color.bcSOS
                    )
                    anxietyButton(
                        title: NSLocalizedString("onboarding.anxiety.medium", comment: ""),
                        level: "medium",
                        color: Color.bcAccent
                    )
                    anxietyButton(
                        title: NSLocalizedString("onboarding.anxiety.low", comment: ""),
                        level: "low",
                        color: Color.bcAccentSecondary
                    )
                }
                .padding(.horizontal, 32)

                Spacer()
            }
        }
        .fullScreenCover(isPresented: $showNext) {
            OnboardingNotificationsView()
                .environmentObject(subscriptionManager)
        }
        .accessibilityIdentifier("onboarding-anxiety-level")
    }

    private func anxietyButton(title: String, level: String, color: Color) -> some View {
        Button(action: {
            anxietyLevel = level
            showNext = true
        }) {
            Text(title)
                .font(.system(size: 17, weight: .medium))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .background(color.opacity(0.2))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(color, lineWidth: 1.5)
                )
                .cornerRadius(16)
        }
    }
}
