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
                        planSelectionView(current.availablePackages)
                        purchaseCTAButton()
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
                    .accessibilityIdentifier("paywall_restore")

                    // [Maybe Later] — soft paywall: user can dismiss without purchasing
                    Button("Maybe Later") {
                        onDismiss?()
                    }
                    .font(.footnote)
                    .foregroundColor(.white.opacity(0.4))
                    .padding(.bottom, 32)
                    .accessibilityIdentifier("paywall_skip")
                }
            }
        }
        .task {
            AnalyticsService.shared.trackPaywallViewed()
            await viewModel.loadOfferings()
        }
    }

    // Plan selection buttons — tap to select plan
    private func planSelectionView(_ packages: [Package]) -> some View {
        VStack(spacing: 12) {
            ForEach(packages, id: \.identifier) { package in
                planButton(package)
            }
        }
        .padding(.horizontal)
    }

    private func planButton(_ package: Package) -> some View {
        let isAnnual = package.packageType == .annual
        let accessId = isAnnual ? "paywall_plan_yearly" : "paywall_plan_monthly"
        let isSelected = viewModel.selectedPackage?.identifier == package.identifier
        return Button {
            viewModel.selectedPackage = package
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(isAnnual ? "Annual" : "Monthly")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(package.storeProduct.localizedPriceString + (isAnnual ? " / year" : " / month"))
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                    if package.storeProduct.introductoryDiscount != nil {
                        Text("7-day free trial")
                            .font(.caption)
                            .foregroundColor(.yellow)
                    }
                }
                Spacer()
                if isAnnual {
                    Text("BEST VALUE")
                        .font(.caption2).bold()
                        .foregroundColor(.white)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Color(red: 0.5, green: 0.4, blue: 1.0))
                        .cornerRadius(6)
                }
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? Color(red: 0.5, green: 0.4, blue: 1.0) : .white.opacity(0.4))
                    .font(.title3)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isSelected ?
                          Color(red: 0.3, green: 0.2, blue: 0.8).opacity(0.6) :
                          Color.white.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(isSelected ? Color(red: 0.5, green: 0.4, blue: 1.0) : Color.clear, lineWidth: 1.5)
                    )
            )
        }
        .accessibilityIdentifier(accessId)
    }

    // CTA button — purchases the selected plan
    @ViewBuilder
    private func purchaseCTAButton() -> some View {
        let hasFreeTrial = viewModel.selectedPackage?.storeProduct.introductoryDiscount != nil
        Button {
            guard let pkg = viewModel.selectedPackage else { return }
            Task { await viewModel.purchase(package: pkg) }
        } label: {
            Text(hasFreeTrial ? "Start 7-Day Free Trial" : "Subscribe Now")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.4, green: 0.3, blue: 0.9), Color(red: 0.3, green: 0.2, blue: 0.8)],
                        startPoint: .leading, endPoint: .trailing
                    )
                )
                .cornerRadius(16)
        }
        .padding(.horizontal)
        .accessibilityIdentifier("paywall_cta")
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
