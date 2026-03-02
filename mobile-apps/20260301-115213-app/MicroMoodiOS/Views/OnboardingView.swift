import SwiftUI
import RevenueCatUI

struct OnboardingView: View {
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @EnvironmentObject private var subscriptionManager: SubscriptionManager
    @State private var currentPage = 0
    @State private var showingPaywall = false

    private let pages: [(title: String, subtitle: String, emoji: String)] = [
        ("Track in 3 taps", "No journaling. No 20 questions.\nJust tap how you feel.", "😊"),
        ("See your patterns", "Weekly AI insights reveal why\nyou feel the way you feel.", "📊"),
        ("Private by default", "All data stays on your device.\nNo cloud. No tracking.", "🔒")
    ]

    var body: some View {
        ZStack {
            Color("BackgroundColor").ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(
                            emoji: pages[index].emoji,
                            title: pages[index].title,
                            subtitle: pages[index].subtitle
                        )
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 340)

                PageIndicator(currentPage: currentPage, pageCount: pages.count)

                Spacer()

                Button(action: handleContinue) {
                    Text(currentPage == pages.count - 1 ? "Get Started" : "Continue")
                        .font(.headline)
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color("AccentColor"))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
                .accessibilityIdentifier("onboarding_continue_button")
            }
        }
        .sheet(isPresented: $showingPaywall, onDismiss: { finishOnboarding() }) {
            PaywallViewWrapper(subscriptionManager: subscriptionManager, onFinish: finishOnboarding)
        }
        .preferredColorScheme(.dark)
    }

    private func handleContinue() {
        if currentPage < pages.count - 1 {
            withAnimation { currentPage += 1 }
        } else {
            // Last page → show soft paywall
            showingPaywall = true
        }
    }

    private func finishOnboarding() {
        showingPaywall = false
        hasSeenOnboarding = true
    }
}

struct PaywallViewWrapper: View {
    @ObservedObject var subscriptionManager: SubscriptionManager

    var onFinish: () -> Void

    var body: some View {
        NavigationStack {
            Group {
                if let offering = subscriptionManager.currentOffering {
                    PaywallView(offering: offering)
                        .onPurchaseCompleted { _ in onFinish() }
                        .onRestoreCompleted { _ in onFinish() }
                } else {
                    // Offerings not loaded yet — skip paywall
                    Color.clear.onAppear { onFinish() }
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Maybe Later") { onFinish() }
                        .foregroundColor(.white.opacity(0.7))
                        .accessibilityIdentifier("paywall_skip_button")
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct OnboardingPageView: View {
    let emoji: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 24) {
            Text(emoji)
                .font(.system(size: 80))

            Text(title)
                .font(.title.bold())
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            Text(subtitle)
                .font(.body)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 32)
    }
}

struct PageIndicator: View {
    let currentPage: Int
    let pageCount: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<pageCount, id: \.self) { index in
                Circle()
                    .fill(index == currentPage ? Color("AccentColor") : Color.white.opacity(0.3))
                    .frame(width: 8, height: 8)
            }
        }
    }
}
