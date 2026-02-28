import SwiftUI

struct OnboardingWelcomeView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @State private var showNext = false

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                ZStack {
                    Circle()
                        .fill(Color.bcAccent.opacity(0.15))
                        .frame(width: 200, height: 200)
                    Circle()
                        .fill(Color.bcAccent.opacity(0.25))
                        .frame(width: 140, height: 140)
                    Image(systemName: "wind")
                        .font(.system(size: 64))
                        .foregroundColor(Color.bcAccent)
                }

                VStack(spacing: 16) {
                    Text(NSLocalizedString("onboarding.welcome.title", comment: ""))
                        .font(.system(size: 36, weight: .bold))
                        .multilineTextAlignment(.center)
                        .foregroundColor(Color.bcText)

                    Text(NSLocalizedString("onboarding.welcome.subtitle", comment: ""))
                        .font(.system(size: 18))
                        .multilineTextAlignment(.center)
                        .foregroundColor(Color.bcTextSecondary)
                        .padding(.horizontal, 32)
                }

                Spacer()

                Button(action: { showNext = true }) {
                    Text(NSLocalizedString("onboarding.welcome.cta", comment: ""))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color.bcAccent)
                        .cornerRadius(16)
                        .padding(.horizontal, 32)
                }
                .accessibilityIdentifier("onboarding-welcome-cta")

                Spacer().frame(height: 20)
            }
        }
        .fullScreenCover(isPresented: $showNext) {
            OnboardingAnxietyView()
                .environmentObject(subscriptionManager)
        }
    }
}
