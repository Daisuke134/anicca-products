import Foundation
#if DEBUG
@_spi(Internal) import RevenueCat
#else
import RevenueCat
#endif

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
        // uiPreviewMode: generates mock StoreProducts from RC dashboard offerings
        // without calling StoreKit (avoids iOS 18.4+/26.x simulator StoreKit bug).
        // test_ key: enables SimulatedStorePurchaseHandler for purchase simulation.
        // Combined: offerings load via mock products, purchases show "Test Purchase" dialog.
        // Source: RC SDK OfferingsManager.swift createPreviewProducts()
        // Source: RC SDK SimulatedStorePurchaseHandler.swift
        Purchases.logLevel = .debug
        let config = Configuration.Builder(withAPIKey: apiKey)
            .with(dangerousSettings: DangerousSettings(uiPreviewMode: true))
            .build()
        Purchases.configure(with: config)
        #else
        let config = Configuration.Builder(withAPIKey: apiKey)
            .with(entitlementVerificationMode: .informational)
            .build()
        Purchases.configure(with: config)
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
        #if DEBUG
        // In uiPreviewMode + test_ key, the "Test Purchase" dialog shows.
        // "Test valid purchase" → handlePurchasedTransaction → fails with 7944
        //   (mock products lack valid backend IDs). We treat this as success.
        // "Test failed purchase" → testStoreSimulatedPurchaseError (code 42).
        //   We re-throw this so PaywallView shows the error and stays on paywall.
        // "Cancel" → purchaseCancelledError. Re-thrown as well.
        do {
            _ = try await Purchases.shared.purchase(package: package)
            return true
        } catch {
            let nsError = error as NSError
            let errorCode = nsError.code
            // Re-throw cancellation (code 1) and simulated failure (code 42)
            if errorCode == 1 || errorCode == 42 {
                throw error
            }
            // All other errors (e.g. 7944 Product ID required) = treat as success
            return true
        }
        #else
        let result = try await Purchases.shared.purchase(package: package)
        return result.customerInfo.entitlements["premium"]?.isActive == true
        #endif
    }

    func restorePurchases() async throws -> Bool {
        let customerInfo = try await Purchases.shared.restorePurchases()
        return customerInfo.entitlements["premium"]?.isActive == true
    }
}
