import SwiftUI
import RevenueCat

struct PaywallView: View {
    let language: AppLanguage
    let onDismiss: () -> Void
    let onPurchaseSuccess: () -> Void

    @State private var selectedPlan: PlanType = .annual
    @State private var isPurchasing: Bool = false
    @State private var offerings: Offerings?
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    @State private var showClose: Bool = false
    @State private var isLoading: Bool = true
    @State private var loadFailed: Bool = false
    @State private var trialEligibleProducts: Set<String> = []

    private enum PlanType {
        case monthly, annual
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Button {
                    onDismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(.secondary)
                }
                .accessibilityIdentifier("paywall_skip")
                .opacity(showClose ? 1 : 0)
                .disabled(!showClose)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    VStack(spacing: 8) {
                        Image(systemName: "heart.circle.fill")
                            .font(.system(size: 56))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color(red: 0.83, green: 0.65, blue: 0.46), Color(red: 0.49, green: 0.71, blue: 0.62)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )

                        Text(L10n.paywallHeadline(language))
                            .font(.title.bold())
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 16) {
                        featureRow(icon: "infinity", text: L10n.paywallBullet1(language))
                        featureRow(icon: "sparkles", text: L10n.paywallBullet2(language))
                        featureRow(icon: "chart.line.uptrend.xyaxis", text: L10n.paywallBullet3(language))
                    }
                    .padding(.horizontal, 8)

                    VStack(spacing: 12) {
                        if let annual = annualPackage, let monthly = monthlyPackage {
                            planCard(
                                isSelected: selectedPlan == .annual,
                                badge: savingsBadge(annual: annual, monthly: monthly),
                                title: language == .english ? "Annual" : "年額",
                                price: L10n.perYear(annual.storeProduct.localizedPriceString, language),
                                detail: annualDetail(annual)
                            ) {
                                selectedPlan = .annual
                            }
                            .accessibilityIdentifier("paywall_plan_yearly")

                            planCard(
                                isSelected: selectedPlan == .monthly,
                                badge: nil,
                                title: language == .english ? "Monthly" : "月額",
                                price: L10n.perMonth(monthly.storeProduct.localizedPriceString, language),
                                detail: trialDays(monthly).map { L10n.freeTrialDays($0, language) }
                            ) {
                                selectedPlan = .monthly
                            }
                            .accessibilityIdentifier("paywall_plan_monthly")
                        } else if loadFailed {
                            VStack(spacing: 10) {
                                Text(L10n.plansUnavailable(language))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Button(L10n.retry(language)) {
                                    Task { await fetchOfferings() }
                                }
                                .accessibilityIdentifier("paywall_retry")
                            }
                            .padding(.vertical, 12)
                        } else {
                            ProgressView()
                                .padding(.vertical, 24)
                        }
                    }

                    VStack(spacing: 16) {
                        Button {
                            Task { await purchase() }
                        } label: {
                            HStack(spacing: 8) {
                                if isPurchasing {
                                    ProgressView()
                                        .tint(.white)
                                }
                                Text(trialDays(selectedPackage).map { L10n.startTrialDays($0, language) } ?? L10n.subscribeNow(language))
                                    .font(.headline)
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: [Color(red: 0.83, green: 0.65, blue: 0.46), Color(red: 0.76, green: 0.55, blue: 0.36)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(.rect(cornerRadius: 16))
                        }
                        .disabled(isPurchasing || isLoading || loadFailed || annualPackage == nil || monthlyPackage == nil)
                        .accessibilityIdentifier("paywall_cta")

                        Text(finePrint)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .multilineTextAlignment(.center)

                        Button {
                            Task { await restore() }
                        } label: {
                            Text(L10n.restorePurchase(language))
                                .font(.subheadline)
                                .foregroundStyle(Color(red: 0.83, green: 0.65, blue: 0.46))
                        }
                        .accessibilityIdentifier("paywall_restore")
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)
            }
        }
        .background(
            LinearGradient(
                colors: [Color(red: 1.0, green: 0.98, blue: 0.95), Color(red: 0.99, green: 0.94, blue: 0.88)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        )
        .task {
            await fetchOfferings()
        }
        .task {
            // Industry pattern: the close button appears after a short delay.
            try? await Task.sleep(for: .seconds(3))
            withAnimation { showClose = true }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.body.weight(.semibold))
                .foregroundStyle(Color(red: 0.49, green: 0.71, blue: 0.62))
                .frame(width: 28)

            Text(text)
                .font(.body)
        }
    }

    private func planCard(isSelected: Bool, badge: String?, title: String, price: String, detail: String?, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(title)
                            .font(.headline)

                        if let badge {
                            Text(badge)
                                .font(.caption2.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color(red: 0.49, green: 0.71, blue: 0.62))
                                .clipShape(.rect(cornerRadius: 6))
                        }
                    }

                    if let detail {
                        Text(detail)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Text(price)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(isSelected ? Color(red: 0.83, green: 0.65, blue: 0.46) : .secondary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color(.secondarySystemGroupedBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color(red: 0.83, green: 0.65, blue: 0.46) : .clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isSelected)
    }

    private var annualPackage: Package? { offerings?.current?.package(identifier: "$rc_annual") }
    private var monthlyPackage: Package? { offerings?.current?.package(identifier: "$rc_monthly") }
    private var selectedPackage: Package? { selectedPlan == .annual ? annualPackage : monthlyPackage }

    // Free-trial length in days, only when the store product has one and this user is eligible.
    private func trialDays(_ package: Package?) -> Int? {
        guard let product = package?.storeProduct,
              trialEligibleProducts.contains(product.productIdentifier),
              let intro = product.introductoryDiscount,
              intro.paymentMode == .freeTrial else { return nil }
        let period = intro.subscriptionPeriod
        switch period.unit {
        case .day: return period.value
        case .week: return period.value * 7
        case .month: return period.value * 30
        case .year: return period.value * 365
        @unknown default: return nil
        }
    }

    private func annualDetail(_ annual: Package) -> String? {
        let perMonth = annual.storeProduct.localizedPricePerMonth.map { L10n.perMonth($0, language) }
        let trial = trialDays(annual).map { L10n.freeTrialDays($0, language) }
        let parts = [trial, perMonth].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    private func savingsBadge(annual: Package, monthly: Package) -> String {
        PaywallPricing.annualSavingsPercent(annual: annual.storeProduct.price, monthly: monthly.storeProduct.price)
            .map { L10n.saveBadge($0, language) } ?? L10n.bestValue(language)
    }

    private var finePrint: String {
        guard let package = selectedPackage else { return "" }
        let price = package.storeProduct.localizedPriceString
        let renewal = selectedPlan == .annual ? L10n.perYear(price, language) : L10n.perMonth(price, language)
        if let days = trialDays(package) {
            return L10n.finePrintTrial(days: days, renewal: renewal, language)
        }
        return L10n.finePrintRenewal(renewal, language)
    }

    private func fetchOfferings() async {
        isLoading = true
        loadFailed = false
        offerings = nil
        trialEligibleProducts = []
        defer { isLoading = false }
        guard Purchases.isConfigured else {
            loadFailed = true
            return
        }
        do {
            offerings = try await Purchases.shared.offerings()
        } catch {
            loadFailed = true
            return
        }
        let packages = [annualPackage, monthlyPackage].compactMap { $0 }
        if packages.count != 2 {
            loadFailed = true
            return
        }
        let eligibility = await Purchases.shared.checkTrialOrIntroDiscountEligibility(packages: packages)
        trialEligibleProducts = Set(eligibility.compactMap { package, status in
            status.status == .eligible ? package.storeProduct.productIdentifier : nil
        })
    }

    private func purchase() async {
        guard Purchases.isConfigured else { return }
        isPurchasing = true
        defer { isPurchasing = false }

        do {
            let packageId = selectedPlan == .annual ? "$rc_annual" : "$rc_monthly"
            guard let package = offerings?.current?.package(identifier: packageId) else {
                errorMessage = language == .english ? "The selected plan is unavailable. Please try again later." : "選択したプランは現在利用できません。時間をおいて再度お試しください。"
                showError = true
                return
            }

            let result = try await Purchases.shared.purchase(package: package)
            if result.customerInfo.entitlements["pro"]?.isActive == true {
                onPurchaseSuccess()
            }
        } catch {
            if !error.localizedDescription.contains("cancelled") {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }

    private func restore() async {
        guard Purchases.isConfigured else { return }
        isPurchasing = true
        defer { isPurchasing = false }

        do {
            let info = try await Purchases.shared.restorePurchases()
            if info.entitlements["pro"]?.isActive == true {
                onPurchaseSuccess()
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

enum PaywallPricing {
    // Annual vs 12 months of monthly, as a whole percent; nil when annual is not cheaper.
    static func annualSavingsPercent(annual: Decimal, monthly: Decimal) -> Int? {
        let yearOfMonthly = monthly * 12
        guard yearOfMonthly > 0, annual < yearOfMonthly else { return nil }
        let percent = NSDecimalNumber(decimal: (1 - annual / yearOfMonthly) * 100).doubleValue
        let rounded = Int(percent.rounded())
        return rounded > 0 ? rounded : nil
    }
}
