import SwiftUI
import RevenueCat

/// Phase 5: CONVERT — Step 3: Custom paywall with RevenueCat packages.
struct PlanSelectionStepView: View {
    let onPurchaseSuccess: (CustomerInfo) -> Void
    let onDismiss: () -> Void
    let onShowDrawer: () -> Void

    @EnvironmentObject private var appState: AppState
    @State private var selectedPackage: Package?
    @State private var isPurchasing = false
    @State private var errorMessage: String?

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

    var body: some View {
        VStack(spacing: 12) {
            if packages.isEmpty {
                Spacer()
                ProgressView()
                Spacer()
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        // App icon from bundle
                        AppIconView()
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .padding(.top, 24)

                        // Headline
                        Text(String(localized: "paywall_plan_title"))
                            .font(.system(size: 28, weight: .bold))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(AppTheme.Colors.label)

                        // Benefit checklist
                        VStack(alignment: .leading, spacing: 10) {
                            benefitRow(String(localized: "paywall_benefit_1"))
                            benefitRow(String(localized: "paywall_benefit_2"))
                            benefitRow(String(localized: "paywall_benefit_3"))
                        }
                        .padding(.horizontal, 24)

                        // Plan cards
                        VStack(spacing: 10) {
                            if let yearly = yearlyPackage {
                                yearlyPlanCard(package: yearly)
                            }

                            if let monthly = monthlyPackage {
                                planCard(
                                    package: monthly,
                                    title: monthly.storeProduct.localizedTitle,
                                    priceLabel: monthly.localizedPriceString + "/mo",
                                    badge: nil,
                                    saveLabel: nil,
                                    weeklyLabel: nil,
                                    trialLabel: nil
                                )
                            }
                        }
                        .padding(.horizontal, 24)

                        // Social proof
                        Text(String(localized: "paywall_plan_social_proof"))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }

                VStack(spacing: 10) {
                    // CTA
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

                    // Trust text
                    Text(String(localized: "paywall_plan_trust"))
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)

                    // Cancel explanation
                    VStack(spacing: 4) {
                        Text(String(localized: "paywall_cancel_title"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.label)
                        Text(String(localized: "paywall_cancel_description"))
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity)
                    .background(AppTheme.Colors.buttonUnselected)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)

                    // Maybe Later + Restore
                    HStack(spacing: 24) {
                        Button(String(localized: "paywall_plan_maybe_later")) {
                            onShowDrawer()
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

                    // Legal footer
                    HStack(spacing: 4) {
                        Link(String(localized: "paywall_legal_terms"), destination: URL(string: "https://anicca.ai/terms")!)
                        Text("·").foregroundStyle(.tertiary)
                        Link(String(localized: "paywall_legal_privacy"), destination: URL(string: "https://anicca.ai/privacy")!)
                    }
                    .font(.system(size: 11))
                    .foregroundStyle(.tertiary)
                }
                .padding(.bottom, 16)
            }
        }
        .background(AppBackground())
        .onAppear {
            AnalyticsManager.shared.track(.paywallPlanSelectionViewed)
            if selectedPackage == nil {
                selectedPackage = yearlyPackage ?? monthlyPackage
            }
        }
    }


    @ViewBuilder
    private func benefitRow(_ text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundStyle(AppTheme.Colors.accent)
            Text(text)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(AppTheme.Colors.label)
        }
    }

    @ViewBuilder
    private func yearlyPlanCard(package: Package) -> some View {
        let isSelected = selectedPackage?.identifier == package.identifier
        let yearlyPrice = package.storeProduct.price as Decimal
        let weeklyPrice = yearlyPrice / 52
        let formatter = NumberFormatter()
        let _ = {
            formatter.numberStyle = .currency
            formatter.locale = package.storeProduct.priceFormatter?.locale ?? .current
            formatter.maximumFractionDigits = 2
        }()
        let weeklyString = formatter.string(from: weeklyPrice as NSDecimalNumber) ?? ""

        Button {
            selectedPackage = package
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                // BEST VALUE badge
                Text(String(localized: "paywall_plan_yearly_badge"))
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(AppTheme.Colors.accent)
                    .clipShape(Capsule())

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(package.storeProduct.localizedTitle)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.label)

                        Text(package.localizedPriceString + "/yr")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)

                        Text(String(format: String(localized: "paywall_plan_weekly_breakdown"), weeklyString))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.accent)

                        if package.storeProduct.introductoryDiscount != nil {
                            Text(String(localized: "paywall_plan_trial_label"))
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(AppTheme.Colors.accent.opacity(0.8))
                        }
                    }

                    Spacer()

                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 24))
                        .foregroundStyle(isSelected ? AppTheme.Colors.accent : .secondary)
                }
            }
            .padding(16)
            .background(isSelected ? AppTheme.Colors.accent.opacity(0.08) : AppTheme.Colors.buttonUnselected)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(AppTheme.Colors.accent, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("paywall-plan-\(package.packageType.rawValue)")
    }

    @ViewBuilder
    private func planCard(
        package: Package,
        title: String,
        priceLabel: String,
        badge: String?,
        saveLabel: String?,
        weeklyLabel: String?,
        trialLabel: String?
    ) -> some View {
        let isSelected = selectedPackage?.identifier == package.identifier

        Button {
            selectedPackage = package
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.label)

                    Text(priceLabel)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundStyle(isSelected ? AppTheme.Colors.accent : .secondary)
            }
            .padding(16)
            .background(AppTheme.Colors.buttonUnselected)
            .clipShape(RoundedRectangle(cornerRadius: 16))
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
                if !result.userCancelled {
                    AnalyticsManager.shared.track(.onboardingPaywallPurchased)
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

private struct AppIconView: View {
    var body: some View {
        if let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
           let primary = icons["CFBundlePrimaryIcon"] as? [String: Any],
           let files = primary["CFBundleIconFiles"] as? [String],
           let name = files.last,
           let uiImage = UIImage(named: name) {
            Image(uiImage: uiImage)
                .resizable()
        } else {
            Image(systemName: "app.fill")
                .resizable()
                .foregroundStyle(AppTheme.Colors.accent)
        }
    }
}
