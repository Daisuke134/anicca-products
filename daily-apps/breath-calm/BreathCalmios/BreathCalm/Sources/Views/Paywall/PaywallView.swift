import SwiftUI
import RevenueCat

struct PaywallView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @Binding var isPresented: Bool
    @State private var selectedPlan: PlanType = .annual

    enum PlanType {
        case monthly, annual
    }

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    // Header
                    HStack {
                        Spacer()
                        Button(action: { isPresented = false }) {
                            Text(NSLocalizedString("paywall.skip", comment: ""))
                                .font(.system(size: 15))
                                .foregroundColor(Color.bcTextSecondary)
                        }
                        .accessibilityIdentifier("paywall_skip")
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)

                    // Icon
                    ZStack {
                        Circle()
                            .fill(Color.bcAccent.opacity(0.15))
                            .frame(width: 100, height: 100)
                        Image(systemName: "wind")
                            .font(.system(size: 44))
                            .foregroundColor(Color.bcAccent)
                    }

                    // Copy
                    VStack(spacing: 12) {
                        Text(NSLocalizedString("paywall.headline", comment: ""))
                            .font(.system(size: 28, weight: .bold))
                            .multilineTextAlignment(.center)
                            .foregroundColor(Color.bcText)

                        Text(NSLocalizedString("paywall.subheadline", comment: ""))
                            .font(.system(size: 17))
                            .multilineTextAlignment(.center)
                            .foregroundColor(Color.bcTextSecondary)
                            .padding(.horizontal, 16)
                    }
                    .padding(.horizontal, 24)

                    // Features
                    VStack(spacing: 12) {
                        featureRow(NSLocalizedString("paywall.feature1", comment: ""))
                        featureRow(NSLocalizedString("paywall.feature2", comment: ""))
                        featureRow(NSLocalizedString("paywall.feature3", comment: ""))
                        featureRow(NSLocalizedString("paywall.feature4", comment: ""))
                        featureRow(NSLocalizedString("paywall.feature5", comment: ""))
                    }
                    .padding(.horizontal, 32)

                    // Plan selector
                    if let offering = subscriptionManager.offerings?.current {
                        planSelector(offering: offering)
                    }

                    // CTA
                    Button(action: purchase) {
                        Text(NSLocalizedString("paywall.cta", comment: ""))
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(Color.bcAccent)
                            .cornerRadius(16)
                    }
                    .accessibilityIdentifier("paywall_cta")
                    .padding(.horizontal, 24)

                    Text(NSLocalizedString("paywall.cancel_anytime", comment: ""))
                        .font(.system(size: 13))
                        .foregroundColor(Color.bcTextSecondary)

                    // Footer links
                    HStack(spacing: 24) {
                        Button(action: restore) {
                            Text(NSLocalizedString("paywall.restore", comment: ""))
                                .font(.system(size: 13))
                                .foregroundColor(Color.bcTextSecondary)
                        }
                        .accessibilityIdentifier("paywall_restore")

                        Button(action: openTerms) {
                            Text(NSLocalizedString("paywall.terms", comment: ""))
                                .font(.system(size: 13))
                                .foregroundColor(Color.bcTextSecondary)
                        }

                        Button(action: openPrivacy) {
                            Text(NSLocalizedString("paywall.privacy", comment: ""))
                                .font(.system(size: 13))
                                .foregroundColor(Color.bcTextSecondary)
                        }
                    }

                    Spacer().frame(height: 20)
                }
            }
        }
        .onAppear {
            subscriptionManager.fetchOfferings()
            AnalyticsManager.shared.trackPaywallViewed(offeringId: "default")
        }
    }

    private func featureRow(_ text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundColor(Color.bcAccentSecondary)
            Text(text)
                .font(.system(size: 15))
                .foregroundColor(Color.bcText)
            Spacer()
        }
    }

    private func planSelector(offering: Offering) -> some View {
        HStack(spacing: 12) {
            if let annual = offering.annual {
                planButton(
                    package: annual,
                    plan: .annual,
                    label: NSLocalizedString("paywall.annual.label", comment: ""),
                    badge: NSLocalizedString("paywall.annual.save", comment: "")
                )
                .accessibilityIdentifier("paywall_plan_yearly")
            }
            if let monthly = offering.monthly {
                planButton(
                    package: monthly,
                    plan: .monthly,
                    label: NSLocalizedString("paywall.monthly.label", comment: ""),
                    badge: nil
                )
                .accessibilityIdentifier("paywall_plan_monthly")
            }
        }
        .padding(.horizontal, 24)
    }

    private func planButton(package: Package, plan: PlanType, label: String, badge: String?) -> some View {
        Button(action: { selectedPlan = plan }) {
            VStack(spacing: 8) {
                if let badge = badge {
                    Text(badge)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.bcAccent)
                        .cornerRadius(6)
                }
                Text(label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(selectedPlan == plan ? Color.bcAccent : Color.bcText)
                Text(package.localizedPriceString)
                    .font(.system(size: 13))
                    .foregroundColor(Color.bcTextSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(selectedPlan == plan ? Color.bcAccent.opacity(0.15) : Color.bcCard)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(selectedPlan == plan ? Color.bcAccent : Color.clear, lineWidth: 1.5)
            )
            .cornerRadius(16)
        }
    }

    private func purchase() {
        guard let offering = subscriptionManager.offerings?.current else { return }
        let package = selectedPlan == .annual ? offering.annual : offering.monthly
        guard let pkg = package else { return }
        subscriptionManager.purchase(package: pkg)
    }

    private func restore() {
        subscriptionManager.restore()
    }

    private func openTerms() {
        if let url = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/") {
            UIApplication.shared.open(url)
        }
    }

    private func openPrivacy() {
        let lang = Locale.current.languageCode ?? "en"
        let urlStr = lang == "ja"
            ? "https://aniccaai.com/breath-calm/privacy/ja"
            : "https://aniccaai.com/breath-calm/privacy/en"
        if let url = URL(string: urlStr) {
            UIApplication.shared.open(url)
        }
    }
}
