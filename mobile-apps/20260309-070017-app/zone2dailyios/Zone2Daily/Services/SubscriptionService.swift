// File: Services/SubscriptionService.swift
// Implements SubscriptionServiceProtocol via RevenueCat SDK
// Source: RevenueCat iOS Quickstart — https://docs.revenuecat.com/docs/ios
// Rule 20: SDK only — RevenueCatUI forbidden
// Rule 23: No AI API

import Foundation
import RevenueCat

@Observable
final class SubscriptionService: SubscriptionServiceProtocol {
    var isPremium: Bool = false
    private var isConfigured = false

    func configure(apiKey: String) {
        guard !apiKey.isEmpty else { return }
        Purchases.configure(withAPIKey: apiKey)
        #if DEBUG
        Purchases.logLevel = .debug
        #else
        Purchases.logLevel = .error
        #endif
        isConfigured = true
        Task { await refreshPremiumStatus() }
    }

    func fetchOfferings() async throws -> [Package] {
        guard isConfigured else { return [] }
        let offerings = try await Purchases.shared.offerings()
        return offerings.current?.availablePackages ?? []
    }

    func purchase(package: Package) async throws -> Bool {
        guard isConfigured else { return false }
        let result = try await Purchases.shared.purchase(package: package)
        if !result.userCancelled {
            isPremium = true
        }
        return !result.userCancelled
    }

    func restorePurchases() async throws {
        guard isConfigured else { return }
        let info = try await Purchases.shared.restorePurchases()
        isPremium = info.entitlements["premium"]?.isActive == true
    }

    private func refreshPremiumStatus() async {
        guard isConfigured else { return }
        let info = try? await Purchases.shared.customerInfo()
        isPremium = info?.entitlements["premium"]?.isActive == true
    }
}
