import SwiftUI
import RevenueCat

struct BenefitRow: View {
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(text)
                .font(.body)
        }
    }
}

struct PaywallView: View {
    @Environment(AppState.self) private var appState
    @State private var offerings: Offerings?
    @State private var isPurchasing = false
    @State private var errorMessage: String?
    let onDismiss: () -> Void
    var isHardPaywall: Bool = false

    var body: some View {
        VStack(spacing: 24) {
            Text(String(localized: "Unlock Your Full Stretch Routine"))
                .font(.title)
                .bold()
                .multilineTextAlignment(.center)

            VStack(alignment: .leading, spacing: 12) {
                BenefitRow(text: String(localized: "Unlimited stretches"))
                BenefitRow(text: String(localized: "Personalized routines for your pain areas"))
                BenefitRow(text: String(localized: "All pain areas"))
                BenefitRow(text: String(localized: "Custom schedules"))
                BenefitRow(text: String(localized: "Progress tracking"))
            }

            Spacer()

            if let offering = offerings?.current {
                if let annual = offering.annual {
                    PrimaryButton(title: String(localized: "Annual \(annual.localizedPriceString)/yr")) {
                        Task { await purchase(annual) }
                    }
                    .accessibilityIdentifier("paywall_plan_yearly")
                }
                if let weekly = offering.weekly {
                    SecondaryButton(title: String(localized: "Weekly \(weekly.localizedPriceString)/wk")) {
                        Task { await purchase(weekly) }
                    }
                    .accessibilityIdentifier("paywall_plan_weekly")
                }
            } else if errorMessage != nil {
                Text(String(localized: "Could not load subscription options."))
                    .font(.body)
                    .foregroundColor(.secondary)
            } else {
                ProgressView()
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }

            HStack {
                if !isHardPaywall {
                    Button(String(localized: "Maybe Later")) { onDismiss() }
                        .font(.subheadline)
                        .accessibilityIdentifier("paywall_maybe_later")
                }
                Spacer()
                Button(String(localized: "Restore")) {
                    Task { await restore() }
                }
                .font(.subheadline)
                .accessibilityIdentifier("paywall_restore")
            }

            HStack {
                if let termsURL = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/") {
                    Link(String(localized: "Terms"), destination: termsURL)
                }
                Text("·")
                if let privacyURL = URL(string: "https://aniccaai.com/privacy") {
                    Link(String(localized: "Privacy"), destination: privacyURL)
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 32)
        .task { await loadOfferings() }
    }

    private func loadOfferings() async {
        offerings = await appState.subscriptionService.getOfferings()
        if offerings == nil {
            errorMessage = String(localized: "Failed to load offerings. Please try again.")
        }
    }

    private func purchase(_ package: Package) async {
        isPurchasing = true
        errorMessage = nil
        defer { isPurchasing = false }
        do {
            let success = try await appState.subscriptionService.purchase(package: package)
            if success {
                appState.isPremium = true
                onDismiss()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func restore() async {
        errorMessage = nil
        do {
            let success = try await appState.subscriptionService.restorePurchases()
            if success {
                appState.isPremium = true
                onDismiss()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
