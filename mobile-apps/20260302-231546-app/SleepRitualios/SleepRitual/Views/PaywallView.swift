import SwiftUI
import RevenueCat

// CRITICAL Rule 19: Custom SwiftUI PaywallView — RevenueCatUI.PaywallView is PROHIBITED
struct PaywallView: View {
    @StateObject private var viewModel = PaywallViewModel()
    @ObservedObject private var subscriptionService = SubscriptionService.shared
    var onDismiss: (() -> Void)?

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.15).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Text("🌙")
                        .font(.system(size: 64))
                        .padding(.top, 48)

                    Text("SleepRitual Pro")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text("Build a bedtime ritual that sticks.\nStreak protection. Unlimited steps.")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.white.opacity(0.7))
                        .padding(.horizontal)

                    featureRow(icon: "moon.stars.fill", text: "Unlimited ritual steps")
                    featureRow(icon: "flame.fill", text: "Streak protection with grace days")
                    featureRow(icon: "bell.fill", text: "Custom reminder time")
                    featureRow(icon: "chart.bar.fill", text: "Sleep quality insights")

                    if viewModel.isLoading {
                        ProgressView().tint(.white).padding()
                    } else if let offerings = viewModel.offerings,
                              let current = offerings.current {
                        packagesView(current.availablePackages)
                    } else {
                        Text("Loading offers...")
                            .foregroundColor(.white.opacity(0.5))
                            .padding()
                    }

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }

                    Button("Restore Purchases") {
                        Task { await viewModel.restore() }
                    }
                    .font(.footnote)
                    .foregroundColor(.white.opacity(0.5))

                    // [Maybe Later] — soft paywall: user can dismiss without purchasing
                    Button("Maybe Later") {
                        onDismiss?()
                    }
                    .font(.footnote)
                    .foregroundColor(.white.opacity(0.4))
                    .padding(.bottom, 32)
                }
            }
        }
        .task {
            AnalyticsService.shared.trackPaywallViewed()
            await viewModel.loadOfferings()
        }
    }

    private func packagesView(_ packages: [Package]) -> some View {
        VStack(spacing: 12) {
            ForEach(packages, id: \.identifier) { package in
                packageButton(package)
            }
        }
        .padding(.horizontal)
    }

    private func packageButton(_ package: Package) -> some View {
        Button {
            Task { await viewModel.purchase(package: package) }
        } label: {
            VStack(spacing: 4) {
                Text(package.storeProduct.localizedTitle)
                    .font(.headline)
                    .foregroundColor(.white)
                Text(package.storeProduct.localizedPriceString + (package.packageType == .annual ? " / year" : " / month"))
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                if package.storeProduct.introductoryDiscount != nil {
                    Text("7-day free trial")
                        .font(.caption)
                        .foregroundColor(.yellow)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(package.packageType == .annual ?
                          Color(red: 0.3, green: 0.2, blue: 0.8) :
                          Color.white.opacity(0.15))
            )
        }
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(red: 0.5, green: 0.4, blue: 1.0))
                .frame(width: 24)
            Text(text)
                .foregroundColor(.white.opacity(0.85))
            Spacer()
        }
        .padding(.horizontal, 32)
    }
}
