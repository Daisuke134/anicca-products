import Foundation
import RevenueCat

final class SubscriptionService: SubscriptionServiceProtocol {
    static let shared = SubscriptionService()
    private init() {}

    var isPremium: Bool {
        get async {
            await checkPremiumStatus()
        }
    }

    func configure(apiKey: String) {
        #if DEBUG
        // Use StoreKit 1 in debug builds to avoid StoreKit 2 simulator bugs
        // (iOS 18.4+ / 26.x simulator: StoreKit 2 fails to fetch products)
        // Source: https://github.com/RevenueCat/purchases-ios/issues/4954
        let config = Configuration.Builder(withAPIKey: apiKey)
            .with(storeKitVersion: .storeKit1)
            .build()
        Purchases.configure(with: config)
        #else
        Purchases.configure(withAPIKey: apiKey)
        #endif
    }

    func checkPremiumStatus() async -> Bool {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            return customerInfo.entitlements["premium"]?.isActive == true
        } catch {
            return false
        }
    }

    func getOfferings() async -> Offerings? {
        try? await Purchases.shared.offerings()
    }

    func purchase(package: Package) async throws -> Bool {
        let result = try await Purchases.shared.purchase(package: package)
        return result.customerInfo.entitlements["premium"]?.isActive == true
    }

    func restorePurchases() async throws -> Bool {
        let customerInfo = try await Purchases.shared.restorePurchases()
        return customerInfo.entitlements["premium"]?.isActive == true
    }
}
