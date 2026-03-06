import Foundation
import RevenueCat

protocol SubscriptionServiceProtocol {
    var isPremium: Bool { get async }
    func configure(apiKey: String)
    func checkPremiumStatus() async -> Bool
    func getOfferings() async -> Offerings?
    func purchase(package: Package) async throws -> Bool
    func restorePurchases() async throws -> Bool
}
