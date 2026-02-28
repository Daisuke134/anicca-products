import Foundation
import RevenueCat
import Mixpanel

class SubscriptionManager: NSObject, ObservableObject {
    static let shared = SubscriptionManager()

    @Published var isPro = false
    @Published var offerings: Offerings?

    private override init() {
        super.init()
        Purchases.shared.delegate = self
        updateStatus()
        fetchOfferings()
    }

    func updateStatus() {
        Purchases.shared.getCustomerInfo { [weak self] info, _ in
            DispatchQueue.main.async {
                self?.isPro = info?.entitlements["premium"]?.isActive == true
            }
        }
    }

    func fetchOfferings() {
        Purchases.shared.getOfferings { [weak self] offerings, _ in
            DispatchQueue.main.async {
                self?.offerings = offerings
            }
        }
    }

    func purchase(package: Package) {
        Mixpanel.mainInstance().track(event: "paywall_viewed", properties: [
            "offering_id": package.offeringIdentifier ?? "default"
        ])
        Purchases.shared.purchase(package: package) { [weak self] _, info, _, cancelled in
            if !cancelled {
                DispatchQueue.main.async {
                    self?.isPro = info?.entitlements["premium"]?.isActive == true
                    if self?.isPro == true {
                        Mixpanel.mainInstance().track(event: "subscription_started", properties: [
                            "product_id": package.storeProduct.productIdentifier,
                            "offering_id": package.offeringIdentifier ?? "default"
                        ])
                    }
                }
            }
        }
    }

    func restore() {
        Purchases.shared.restorePurchases { [weak self] info, _ in
            DispatchQueue.main.async {
                self?.isPro = info?.entitlements["premium"]?.isActive == true
            }
        }
    }

    var canStartFreeSession: Bool {
        SessionStore.shared.todayCount() == 0
    }
}

extension SubscriptionManager: PurchasesDelegate {
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        DispatchQueue.main.async {
            self.isPro = customerInfo.entitlements["premium"]?.isActive == true
        }
    }
}
