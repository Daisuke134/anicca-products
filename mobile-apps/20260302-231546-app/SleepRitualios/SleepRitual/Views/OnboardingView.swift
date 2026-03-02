import SwiftUI

struct OnboardingView: View {
    @State private var currentPage = 0
    @Binding var hasCompletedOnboarding: Bool

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.15).ignoresSafeArea()

            TabView(selection: $currentPage) {
                onboardingPage(
                    emoji: "🌙",
                    title: "Sleep Better, Tonight",
                    subtitle: "Build a 3-step pre-sleep ritual that works on autopilot."
                ).tag(0)

                onboardingPage(
                    emoji: "🔥",
                    title: "Build Your Streak",
                    subtitle: "Track your consistency night after night. Small steps = big results."
                ).tag(1)

                onboardingPage(
                    emoji: "⚡",
                    title: "Your Ritual. Your Rules.",
                    subtitle: "Customize any steps you want. Complete them in order. Feel the difference."
                ).tag(2)

                // Page 4: Soft paywall (Rule 19)
                PaywallView(onDismiss: { hasCompletedOnboarding = true })
                    .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            if currentPage < 3 {
                VStack {
                    Spacer()
                    HStack {
                        pageIndicator
                        Spacer()
                        nextButton
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 48)
                }
            }
        }
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(i == currentPage ? Color.white : Color.white.opacity(0.3))
                    .frame(width: 8, height: 8)
            }
        }
    }

    private var nextButton: some View {
        Button {
            withAnimation { currentPage = min(currentPage + 1, 3) }
        } label: {
            Text(currentPage == 2 ? "Get Started" : "Next")
                .font(.headline)
                .foregroundColor(.black)
                .padding(.horizontal, 28)
                .padding(.vertical, 14)
                .background(Color.white)
                .clipShape(Capsule())
        }
    }

    private func onboardingPage(emoji: String, title: String, subtitle: String) -> some View {
        VStack(spacing: 24) {
            Spacer()
            Text(emoji).font(.system(size: 80))
            Text(title)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            Text(subtitle)
                .font(.body)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
            Spacer()
        }
    }
}
