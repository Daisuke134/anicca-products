import Foundation
import RevenueCat
@testable import DeskStretch

final class MockSubscriptionService: SubscriptionServiceProtocol {
    var mockIsPremium = false
    var configuredApiKey: String?
    var mockOfferings: Offerings?
    var mockPurchaseResult = true
    var mockRestoreResult = true
    var shouldThrowOnPurchase = false
    var shouldThrowOnRestore = false

    var isPremium: Bool {
        get async { mockIsPremium }
    }

    func configure(apiKey: String) {
        configuredApiKey = apiKey
    }

    func checkPremiumStatus() async -> Bool {
        mockIsPremium
    }

    func getOfferings() async -> Offerings? {
        mockOfferings
    }

    func purchase(package: Package) async throws -> Bool {
        if shouldThrowOnPurchase {
            throw NSError(domain: "MockError", code: -1)
        }
        return mockPurchaseResult
    }

    func restorePurchases() async throws -> Bool {
        if shouldThrowOnRestore {
            throw NSError(domain: "MockError", code: -1)
        }
        return mockRestoreResult
    }
}
