import SwiftUI
import RevenueCat
import PostHog

/// Variant B paywall — CRO optimized design for A/B testing
struct PaywallVariantBView: View {
    let variant: String
    let onPurchaseSuccess: (CustomerInfo) -> Void
    let onDismiss: () -> Void

    @EnvironmentObject private var appState: AppState
    @State private var selectedPackage: Package?
    @State private var isPurchasing = false
    @State private var errorMessage: String?
    @State private var hasTracked = false

    private var offering: Offering? { appState.cachedOffering }
    private var packages: [Package] { offering?.availablePackages ?? [] }
    private var yearlyPackage: Package? { packages.first { $0.packageType == .annual } }
    private var monthlyPackage: Package? { packages.first { $0.packageType == .monthly } }

    private var savePct: Int? {
        guard let yearly = yearlyPackage, let monthly = monthlyPackage else { return nil }
        let yearlyPrice = (yearly.storeProduct.price as NSDecimalNumber).doubleValue
        let monthlyPrice = (monthly.storeProduct.price as NSDecimalNumber).doubleValue
        guard monthlyPrice > 0 else { return nil }
        return Int((1.0 - yearlyPrice / (monthlyPrice * 12.0)) * 100)
    }

    private var dailyPrice: String? {
        guard let yearly = yearlyPackage else { return nil }
        let price = (yearly.storeProduct.price as NSDecimalNumber).doubleValue / 365.0
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
        formatter.currencyCode = yearly.storeProduct.currencyCode
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: price))
    }

    private var trialPeriodText: String? {
        guard let discount = selectedPackage?.storeProduct.introductoryDiscount else { return nil }
        let period = discount.subscriptionPeriod
        let lang = Locale.current.languageCode ?? "en"
        switch period.unit {
        case .day:
            if lang == "ja" { return "\(period.value)日間" }
            if lang == "es" { return "\(period.value) día(s)" }
            return period.value == 1 ? "1 Day" : "\(period.value) Days"
        case .week:
            if lang == "ja" { return "\(period.value)週間" }
            if lang == "es" { return "\(period.value) semana(s)" }
            return period.value == 1 ? "Week" : "\(period.value) Weeks"
        case .month:
            if lang == "ja" { return "\(period.value)ヶ月" }
            if lang == "es" { return "\(period.value) mes(es)" }
            return period.value == 1 ? "1 Month" : "\(period.value) Months"
        case .year:
            if lang == "ja" { return "\(period.value)年" }
            if lang == "es" { return "\(period.value) año(s)" }
            return period.value == 1 ? "1 Year" : "\(period.value) Years"
        @unknown default:
            return nil
        }
    }

    private var hasTrialEligibility: Bool {
        selectedPackage?.storeProduct.introductoryDiscount != nil
    }

    var body: some View {
        VStack(spacing: 12) {
            dismissButton
            heroSection
            featureList

            if packages.isEmpty {
                ProgressView()
                    .padding(.top, 40)
                Spacer()
            } else {
                planCards
                ctaSection
            }
        }
        .background(AppBackground())
        .onAppear {
            if !hasTracked {
                hasTracked = true
                AnalyticsManager.shared.track(.paywallPlanSelectionViewed)
                AnalyticsManager.shared.trackPostHog("paywall_viewed", properties: ["variant": variant])
            }
            if selectedPackage == nil {
                selectedPackage = yearlyPackage ?? monthlyPackage
            }
        }
    }

    // MARK: - Sections

    private var dismissButton: some View {
        HStack {
            Spacer()
            Button { onDismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(.secondary)
                    .frame(width: 32, height: 32)
            }
            .accessibilityIdentifier("paywall-dismiss")
            .padding(.trailing, 16)
            .padding(.top, 8)
        }
    }

    private var heroSection: some View {
        VStack(spacing: 8) {
            if let uiImage = UIImage(named: "AppIcon") {
                Image(uiImage: uiImage)
                    .resizable()
                    .frame(width: 64, height: 64)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }

            Text(paywallText("title", fallback: "paywall_b_title"))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            Text(paywallText("subtitle", fallback: "paywall_b_subtitle"))
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
    }

    private var featureList: some View {
        VStack(alignment: .leading, spacing: 8) {
            featureRow("paywall_b_feature_nudges")
            featureRow("paywall_b_feature_ai")
            featureRow("paywall_b_feature_personalized")
            featureRow("paywall_b_feature_feedback")
            featureRow("paywall_b_feature_cancel")
        }
        .padding(.horizontal, 32)
    }

    private var planCards: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let yearly = yearlyPackage {
                    planCard(
                        package: yearly,
                        priceLabel: yearly.localizedPriceString + String(localized: "paywall_b_per_year"),
                        badge: String(localized: "paywall_plan_yearly_badge"),
                        dailyPriceLabel: dailyPrice.map {
                            String(format: NSLocalizedString("paywall_b_daily_price", comment: ""), $0)
                        },
                        trialBadge: (hasTrialEligibility && selectedPackage?.packageType == .annual)
                            ? trialPeriodText.map {
                                String(format: NSLocalizedString("paywall_b_trial_badge", comment: ""), $0)
                            }
                            : nil
                    )
                }

                if let monthly = monthlyPackage {
                    planCard(
                        package: monthly,
                        priceLabel: monthly.localizedPriceString + String(localized: "paywall_b_per_month"),
                        badge: nil,
                        dailyPriceLabel: nil,
                        trialBadge: nil
                    )
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 8)
        }
    }

    private var ctaSection: some View {
        VStack(spacing: 10) {
            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 24)
            }

            Button { purchase() } label: {
                Group {
                    if isPurchasing {
                        ProgressView().tint(.white)
                    } else if hasTrialEligibility, let period = trialPeriodText {
                        Text(String(format: NSLocalizedString("paywall_b_cta_trial", comment: ""), period))
                    } else {
                        Text(String(localized: "paywall_b_cta_no_trial"))
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

            Text(paywallText("review", fallback: "paywall_b_review"))
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
                .italic()
                .padding(.horizontal, 24)

            Text(String(localized: hasTrialEligibility ? "paywall_b_trust_trial" : "paywall_b_trust_no_trial"))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            HStack(spacing: 24) {
                Button(String(localized: "paywall_plan_maybe_later")) { onDismiss() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("paywall-maybe-later")

                Button(String(localized: "paywall_plan_restore")) { restorePurchases() }
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

    // MARK: - Components

    @ViewBuilder
    private func featureRow(_ key: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 16))
                .foregroundStyle(AppTheme.Colors.accent)
                .frame(width: 24)
            Text(String(localized: String.LocalizationValue(key)))
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(AppTheme.Colors.label)
        }
    }

    @ViewBuilder
    private func planCard(
        package: Package,
        priceLabel: String,
        badge: String?,
        dailyPriceLabel: String?,
        trialBadge: String?
    ) -> some View {
        let isSelected = selectedPackage?.identifier == package.identifier

        Button { selectedPackage = package } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(package.storeProduct.localizedTitle)
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

                    Text(priceLabel)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)

                    if let dailyPriceLabel {
                        Text(dailyPriceLabel)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.accent)
                    }

                    if let trialBadge {
                        Text(trialBadge)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.green)
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

    // MARK: - Helpers

    private func paywallText(_ key: String, fallback: String) -> String {
        let lang = Locale.current.languageCode ?? "en"
        if lang == "en",
           let payload = PostHogSDK.shared.getFeatureFlagPayload("paywall-ab-test") as? [String: Any],
           let text = payload[key] as? String {
            return text
        }
        return String(localized: String.LocalizationValue(fallback))
    }

    // MARK: - Actions

    private func purchase() {
        guard let package = selectedPackage else { return }
        isPurchasing = true
        errorMessage = nil

        Task {
            do {
                let result = try await Purchases.shared.purchase(package: package)
                if result.customerInfo.entitlements[AppConfig.revenueCatEntitlementId]?.isActive == true {
                    AnalyticsManager.shared.track(.onboardingPaywallPurchased)
                    AnalyticsManager.shared.trackPostHog("paywall_purchased", properties: [
                        "variant": variant,
                        "plan_type": package.packageType == .annual ? "annual" : "monthly",
                        "has_trial": package.storeProduct.introductoryDiscount != nil
                    ])
                    if package.packageType == .annual,
                       package.storeProduct.introductoryDiscount != nil {
                        AnalyticsManager.shared.track(.trialStarted, properties: [
                            "product_id": package.storeProduct.productIdentifier
                        ])
                    }
                    await MainActor.run {
                        isPurchasing = false
                        onPurchaseSuccess(result.customerInfo)
                    }
                } else {
                    await MainActor.run { isPurchasing = false }
                }
            } catch {
                await MainActor.run {
                    isPurchasing = false
                    if let rcError = error as? RevenueCat.ErrorCode,
                       rcError == .purchaseCancelledError {
                        // User cancelled
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
