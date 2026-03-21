import SwiftUI
import RevenueCat

/// Phase 5: CONVERT — Step 3: Custom paywall with RevenueCat packages.
struct PlanSelectionStepView: View {
    let onPurchaseSuccess: (CustomerInfo) -> Void
    let onDismiss: () -> Void

    @EnvironmentObject private var appState: AppState
    @State private var selectedPackage: Package?
    @State private var isPurchasing = false
    @State private var errorMessage: String?
    @State private var hasTracked = false

    private var offering: Offering? {
        appState.cachedOffering
    }

    private var packages: [Package] {
        offering?.availablePackages ?? []
    }

    private var yearlyPackage: Package? {
        packages.first { $0.packageType == .annual }
    }

    private var monthlyPackage: Package? {
        packages.first { $0.packageType == .monthly }
    }

    private var personalizedTitle: String {
        if let firstStruggle = appState.userProfile.struggles.first,
           let problem = ProblemType(rawValue: firstStruggle) {
            let name = problem.displayName
            return String(localized: "paywall_plan_title_personalized \(name)")
        }
        return String(localized: "paywall_plan_title")
    }

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Spacer()
                Button {
                    onDismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 32, height: 32)
                }
                .accessibilityIdentifier("paywall-dismiss")
                .padding(.trailing, 16)
                .padding(.top, 8)
            }

            Text(personalizedTitle)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            if packages.isEmpty {
                ProgressView()
                    .padding(.top, 40)
                Spacer()
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        if let yearly = yearlyPackage {
                            planCard(
                                package: yearly,
                                title: yearly.storeProduct.localizedTitle,
                                priceLabel: yearly.localizedPriceString + "/yr",
                                badge: String(localized: "paywall_plan_yearly_badge"),
                                saveLabel: String(localized: "paywall_plan_save")
                            )
                        }

                        if let monthly = monthlyPackage {
                            planCard(
                                package: monthly,
                                title: monthly.storeProduct.localizedTitle,
                                priceLabel: monthly.localizedPriceString + "/mo",
                                badge: nil,
                                saveLabel: nil
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }

                VStack(spacing: 12) {
                    Button {
                        purchase()
                    } label: {
                        Group {
                            if isPurchasing {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                let hasTrialEligibility = selectedPackage?.storeProduct.introductoryDiscount != nil
                                Text(String(localized: hasTrialEligibility ? "paywall_plan_cta_trial" : "paywall_plan_cta_subscribe"))
                            }
                        }
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(selectedPackage != nil ? AppTheme.Colors.accent : AppTheme.Colors.accent.opacity(0.5))
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                    }
                    .disabled(selectedPackage == nil || isPurchasing)
                    .accessibilityIdentifier("paywall-plan-cta")
                    .padding(.horizontal, 24)

                    Text(String(localized: "paywall_plan_trust"))
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)

                    HStack(spacing: 24) {
                        Button(String(localized: "paywall_plan_maybe_later")) {
                            onDismiss()
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.secondary)
                        .accessibilityIdentifier("paywall-maybe-later")

                        Button(String(localized: "paywall_plan_restore")) {
                            restorePurchases()
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.secondary)
                        .accessibilityIdentifier("paywall-restore")
                    }

                    HStack(spacing: 8) {
                        Link(String(localized: "paywall_plan_terms"), destination: AppConfig.termsURL)
                        Text("·").foregroundStyle(.secondary)
                        Link(String(localized: "paywall_plan_privacy"), destination: AppConfig.privacyURL)
                    }
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                }
                .padding(.bottom, 32)
            }
        }
        .background(AppBackground())
        .onAppear {
            if !hasTracked {
                hasTracked = true
                AnalyticsManager.shared.track(.paywallPlanSelectionViewed)
            }
            // Default to yearly
            if selectedPackage == nil {
                selectedPackage = yearlyPackage ?? monthlyPackage
            }
        }
    }

    @ViewBuilder
    private func planCard(
        package: Package,
        title: String,
        priceLabel: String,
        badge: String?,
        saveLabel: String?
    ) -> some View {
        let isSelected = selectedPackage?.identifier == package.identifier

        Button {
            selectedPackage = package
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(title)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.label)

                        if let badge {
                            Text(badge)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(AppTheme.Colors.accent)
                                .clipShape(Capsule())
                        }
                    }

                    HStack(spacing: 8) {
                        Text(priceLabel)
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)

                        if let saveLabel {
                            Text(saveLabel)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(AppTheme.Colors.accent)
                        }
                    }
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundStyle(isSelected ? AppTheme.Colors.accent : .secondary)
            }
            .padding(16)
            .background(isSelected ? AppTheme.Colors.accent.opacity(0.1) : AppTheme.Colors.buttonUnselected)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? AppTheme.Colors.accent : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("paywall-plan-\(package.packageType.rawValue)")
    }

    private func purchase() {
        guard let package = selectedPackage else { return }
        isPurchasing = true
        errorMessage = nil

        Task {
            do {
                let result = try await Purchases.shared.purchase(package: package)
                if result.customerInfo.entitlements[AppConfig.revenueCatEntitlementId]?.isActive == true {
                    AnalyticsManager.shared.track(.onboardingPaywallPurchased)
                    if package.storeProduct.introductoryDiscount != nil {
                        AnalyticsManager.shared.track(.trialStarted, properties: [
                            "product_id": package.storeProduct.productIdentifier
                        ])
                    }
                    await MainActor.run {
                        isPurchasing = false
                        onPurchaseSuccess(result.customerInfo)
                    }
                } else {
                    await MainActor.run {
                        isPurchasing = false
                    }
                }
            } catch {
                await MainActor.run {
                    isPurchasing = false
                    if let rcError = error as? RevenueCat.ErrorCode,
                       rcError == .purchaseCancelledError {
                        // User cancelled, no error message
                    } else {
                        errorMessage = error.localizedDescription
                    }
                }
            }
        }
    }

    private func restorePurchases() {
        isPurchasing = true
        errorMessage = nil

        Task {
            do {
                let customerInfo = try await Purchases.shared.restorePurchases()
                await MainActor.run {
                    isPurchasing = false
                    if customerInfo.entitlements[AppConfig.revenueCatEntitlementId]?.isActive == true {
                        onPurchaseSuccess(customerInfo)
                    }
                }
            } catch {
                await MainActor.run {
                    isPurchasing = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}
