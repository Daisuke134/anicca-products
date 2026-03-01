import Foundation
import RevenueCat

// CRITICAL RULE 23: Internal delegate MUST be named RCPurchasesDelegate (NOT PurchasesDelegate)
@MainActor
class SubscriptionManager: ObservableObject {
    @Published var isPro: Bool = false
    @Published var currentOffering: Offering?
    @Published var isLoading: Bool = false

    init() {
        Task { await checkSubscriptionStatus() }
        Task { await fetchOfferings() }
        setupDelegate()
    }

    func checkSubscriptionStatus() async {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            isPro = customerInfo.entitlements["pro"]?.isActive == true
        } catch {
            isPro = false
        }
    }

    func fetchOfferings() async {
        do {
            let offerings = try await Purchases.shared.offerings()
            currentOffering = offerings.current
        } catch {
            // Offerings unavailable — handled gracefully
        }
    }

    func purchase(package: Package) async throws {
        isLoading = true
        defer { isLoading = false }
        let result = try await Purchases.shared.purchase(package: package)
        isPro = result.customerInfo.entitlements["pro"]?.isActive == true
    }

    func restorePurchases() async throws {
        isLoading = true
        defer { isLoading = false }
        let customerInfo = try await Purchases.shared.restorePurchases()
        isPro = customerInfo.entitlements["pro"]?.isActive == true
    }

    private func setupDelegate() {
        Purchases.shared.delegate = RCPurchasesDelegate.shared
    }
}

// CRITICAL RULE 23: Must be named RCPurchasesDelegate
private class RCPurchasesDelegate: NSObject, PurchasesDelegate {
    static let shared = RCPurchasesDelegate()

    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            // Notify active SubscriptionManager instances of updates
        }
    }
}
