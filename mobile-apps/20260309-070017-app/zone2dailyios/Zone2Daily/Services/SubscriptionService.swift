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
        #if DEBUG
        // Source: us-006-implement.md — uiPreviewMode enables Simulator StoreKit testing
        // without real purchases (required for US-007 E2E payment flows)
        let config = Configuration.builder(withAPIKey: apiKey)
            .with(entitlementVerificationMode: .informational)
            .build()
        Purchases.configure(with: config)
        Purchases.logLevel = .debug
        #else
        // Source: RevenueCat docs — use .enforced in production to block tampered receipts
        let config = Configuration.builder(withAPIKey: apiKey)
            .with(entitlementVerificationMode: .enforced)
            .build()
        Purchases.configure(with: config)
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
        do {
            let result = try await Purchases.shared.purchase(package: package)
            if !result.userCancelled {
                isPremium = true
            }
            return !result.userCancelled
        } catch let error as ErrorCode {
            // Re-throw cancellation; swallow other errors gracefully in production
            if error == .purchaseCancelledError {
                throw error
            }
            return false
        }
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
