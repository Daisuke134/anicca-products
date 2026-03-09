// File: Views/Onboarding/PaywallView.swift
// F-008: Soft paywall — self-built SwiftUI (Rule 20: RevenueCatUI forbidden)
// Rule 20: [Maybe Later] button mandatory
// Source: RevenueCat — https://docs.revenuecat.com/docs/ios#make-a-purchase
// "Purchases.shared.purchase(package:) is the recommended API."
// Source: Adapty — https://adapty.io/blog/how-to-design-ios-paywall/
// "Animated vs static paywall: 2.9× higher conversion"

import SwiftUI
import RevenueCat

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var packages: [Package] = []
    @State private var selectedPackage: Package?
    @State private var isPurchasing = false
    @State private var errorMessage: String?
    @State private var isRestoring = false

    let subscriptionService: SubscriptionServiceProtocol

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection
                benefitsSection
                socialProofSection

                if !packages.isEmpty {
                    pricingSection
                }

                if let error = errorMessage {
                    Text(error)
                        .foregroundStyle(.brandDanger)
                        .font(.callout)
                }

                ctaSection
                faqSection
                legalSection
            }
            .padding()
        }
        .task { await loadPackages() }
        .accessibilityIdentifier("screen_paywall")
    }

    // MARK: — Sections

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.fill")
                .font(.system(size: 56))
                .foregroundStyle(.brandPrimary)

            Text("Unlock Your Zone 2 Potential")
                .font(.title.bold())
                .multilineTextAlignment(.center)
                .accessibilityIdentifier("paywall_headline")

            Text("Join thousands training smarter with Zone 2")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var benefitsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach([
                ("Unlimited workout history", "checkmark.circle.fill"),
                ("Weekly analytics dashboard", "chart.bar.fill"),
                ("Progress toward 150 min/week goal", "target"),
                ("Daily streak tracking", "flame.fill"),
                ("Personalized Zone 2 HR targets", "heart.circle.fill"),
            ], id: \.0) { benefit, icon in
                Label(benefit, systemImage: icon)
                    .font(.body)
                    .foregroundStyle(.textPrimary)
            }
        }
        .padding()
        .background(.surfaceCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var socialProofSection: some View {
        HStack {
            Image(systemName: "star.fill").foregroundStyle(.brandWarning)
            Text("4.9 · 2,000+ athletes training in Zone 2")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var pricingSection: some View {
        VStack(spacing: 12) {
            ForEach(packages, id: \.identifier) { pkg in
                PricingCardView(
                    package: pkg,
                    isSelected: selectedPackage?.identifier == pkg.identifier,
                    isBestValue: pkg.packageType == .annual
                ) {
                    selectedPackage = pkg
                }
            }
        }
    }

    private var ctaSection: some View {
        VStack(spacing: 12) {
            Button {
                Task { await purchaseSelected() }
            } label: {
                Group {
                    if isPurchasing {
                        ProgressView().tint(.white)
                    } else {
                        Text("Start Training")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
            }
            .buttonStyle(.borderedProminent)
            .tint(.brandPrimary)
            .disabled(selectedPackage == nil || isPurchasing)
            .animation(.easeInOut(duration: 0.2), value: isPurchasing)
            .accessibilityIdentifier("btn_subscribe")

            // Rule 20: [Maybe Later] mandatory
            Button("Maybe Later") { dismiss() }
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("btn_maybe_later")

            Button("Restore Purchases") {
                Task { await restorePurchasesAction() }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .disabled(isRestoring)
            .accessibilityIdentifier("btn_restore")
        }
    }

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("FAQ")
                .font(.headline)

            FAQRow(q: "When will I be charged?", a: "Your subscription starts after your free trial (if any). Cancel anytime.")
            FAQRow(q: "How do I cancel?", a: "Go to iOS Settings → Apple ID → Subscriptions → Zone2Daily.")
            FAQRow(q: "Does it work offline?", a: "Yes. All workout data is stored locally on your device.")
        }
        .padding()
        .background(.bgSecondary)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var legalSection: some View {
        HStack {
            Link("Privacy Policy", destination: URL(string: "https://aniccaai.com/privacy")!)
            Text("·")
            Link("Terms of Use", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
        }
        .font(.caption)
        .foregroundStyle(.secondary)
    }

    // MARK: — Actions

    private func loadPackages() async {
        packages = (try? await subscriptionService.fetchOfferings()) ?? []
        selectedPackage = packages.first(where: { $0.packageType == .annual }) ?? packages.first
    }

    private func purchaseSelected() async {
        guard let pkg = selectedPackage else { return }
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            _ = try await subscriptionService.purchase(package: pkg)
            dismiss()
        } catch {
            errorMessage = "Purchase failed. Please try again."
        }
    }

    private func restorePurchasesAction() async {
        isRestoring = true
        defer { isRestoring = false }
        try? await subscriptionService.restorePurchases()
        dismiss()
    }
}

// MARK: — Supporting Views

struct PricingCardView: View {
    let package: Package
    let isSelected: Bool
    let isBestValue: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(package.storeProduct.localizedTitle)
                            .font(.headline)
                        if isBestValue {
                            Text("Best Value")
                                .font(.caption.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(.brandPrimary)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                    }
                    Text(package.storeProduct.localizedDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(package.localizedPriceString)
                    .font(.headline)
            }
            .padding()
            .background(isSelected ? Color.brandPrimary.opacity(0.1) : Color.surfaceCard)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.brandPrimary : Color.clear, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

struct FAQRow: View {
    let q: String
    let a: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(q).font(.subheadline.bold())
            Text(a).font(.subheadline).foregroundStyle(.secondary)
        }
    }
}
