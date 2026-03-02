import Foundation
import RevenueCat

@MainActor
final class PaywallViewModel: ObservableObject {
    @Published var offerings: Offerings?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let subscriptionService = SubscriptionService.shared

    func loadOfferings() async {
        isLoading = true
        await subscriptionService.fetchOfferings()
        offerings = subscriptionService.offerings
        isLoading = false
    }

    func purchase(package: Package) async {
        isLoading = true
        errorMessage = nil
        do {
            AnalyticsService.shared.trackPurchaseStarted(packageId: package.identifier)
            try await subscriptionService.purchase(package: package)
            AnalyticsService.shared.trackPurchaseCompleted(packageId: package.identifier)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func restore() async {
        isLoading = true
        errorMessage = nil
        do {
            try await subscriptionService.restorePurchases()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
