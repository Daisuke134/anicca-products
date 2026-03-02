import Foundation
import RevenueCat

final class SubscriptionService: NSObject, ObservableObject {
    static let shared = SubscriptionService()

    @Published var isPro: Bool = false
    @Published var offerings: Offerings?

    func configure() {
        // API key from Info.plist — NOT ProcessInfo.processInfo.environment
        let apiKey = Bundle.main.infoDictionary?["RevenueCatAPIKey"] as? String ?? ""
        Purchases.configure(withAPIKey: apiKey)
        Purchases.shared.delegate = self
        Task { await checkSubscriptionStatus() }
    }

    func fetchOfferings() async {
        do {
            let result = try await Purchases.shared.offerings()
            await MainActor.run { self.offerings = result }
        } catch {
            print("Offerings error: \(error)")
        }
    }

    func purchase(package: Package) async throws {
        let result = try await Purchases.shared.purchase(package: package)
        await MainActor.run { self.isPro = !result.customerInfo.entitlements.active.isEmpty }
    }

    func restorePurchases() async throws {
        let info = try await Purchases.shared.restorePurchases()
        await MainActor.run { self.isPro = !info.entitlements.active.isEmpty }
    }

    func checkSubscriptionStatus() async {
        do {
            let info = try await Purchases.shared.customerInfo()
            await MainActor.run { self.isPro = !info.entitlements.active.isEmpty }
        } catch {
            print("Subscription check error: \(error)")
        }
    }
}

// Rule 34: RCPurchasesDelegate → PurchasesDelegate (avoid naming collision)
extension SubscriptionService: PurchasesDelegate {
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        DispatchQueue.main.async {
            self.isPro = !customerInfo.entitlements.active.isEmpty
        }
    }
}
