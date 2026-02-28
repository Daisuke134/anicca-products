import SwiftUI

struct OnboardingNotificationsView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @AppStorage("onboarding_completed") private var onboardingCompleted = false
    @State private var isRequesting = false

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                ZStack {
                    Circle()
                        .fill(Color.bcAccentSecondary.opacity(0.15))
                        .frame(width: 160, height: 160)
                    Image(systemName: "bell.badge")
                        .font(.system(size: 56))
                        .foregroundColor(Color.bcAccentSecondary)
                }

                VStack(spacing: 16) {
                    Text(NSLocalizedString("onboarding.notifications.title", comment: ""))
                        .font(.system(size: 28, weight: .bold))
                        .multilineTextAlignment(.center)
                        .foregroundColor(Color.bcText)

                    Text(NSLocalizedString("onboarding.notifications.subtitle", comment: ""))
                        .font(.system(size: 17))
                        .multilineTextAlignment(.center)
                        .foregroundColor(Color.bcTextSecondary)
                        .padding(.horizontal, 32)
                }

                Spacer()

                VStack(spacing: 16) {
                    Button(action: allowNotifications) {
                        Text(NSLocalizedString("onboarding.notifications.allow", comment: ""))
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(Color.bcAccent)
                            .cornerRadius(16)
                    }
                    .accessibilityIdentifier("onboarding-notifications-allow")
                    .disabled(isRequesting)

                    Button(action: { completeOnboarding() }) {
                        Text(NSLocalizedString("onboarding.notifications.skip", comment: ""))
                            .font(.system(size: 16))
                            .foregroundColor(Color.bcTextSecondary)
                    }
                }
                .padding(.horizontal, 32)

                Spacer().frame(height: 20)
            }
        }
    }

    private func allowNotifications() {
        isRequesting = true
        NotificationService.shared.requestPermission { _ in
            completeOnboarding()
        }
    }

    private func completeOnboarding() {
        AnalyticsManager.shared.track(.onboardingCompleted)
        onboardingCompleted = true
    }
}
