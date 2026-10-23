#!/usr/bin/env python3
"""Execute PaywallView's offering/purchase/restore bodies with a local SDK boundary.

Run with python3; requires only the installed Swift compiler. This does not build
SwiftUI, contact RevenueCat/StoreKit, or replace a native app integration test.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile


def declaration(source, marker):
    start = source.index(marker)
    opening = source.index("{", start)
    depth = 1
    end = opening + 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[start:end]


SWIFT_PREFIX = r'''
import Foundation

enum AppLanguage { case english, japanese }
struct StoreProduct { let productIdentifier: String }
struct Package: Hashable {
    let identifier: String
    var storeProduct: StoreProduct { StoreProduct(productIdentifier: identifier) }
}
struct Offering {
    let availablePackages: [Package]
    func package(identifier: String) -> Package? {
        availablePackages.first { $0.identifier == identifier }
    }
}
struct Offerings { let current: Offering? }
struct Entitlement { let isActive: Bool }
struct CustomerInfo { let entitlements: [String: Entitlement] }
struct PurchaseResult { let customerInfo: CustomerInfo }
enum EligibilityStatus { case eligible }
struct IntroEligibility { let status: EligibilityStatus }
struct SDKFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

// Only the external SDK boundary is replaced; production control flow is inserted below.
@MainActor final class Purchases {
    static var isConfigured = true
    static var shared = Purchases()
    var purchased: [String] = []
    var restores = 0
    var pro: Bool? = true
    var failure: String?
    var nextOfferings = Offerings(current: nil)
    var offeringFailure = false
    var onOfferings: (() -> Void)?
    var onEligibility: (() -> Void)?
    func offerings() async throws -> Offerings {
        onOfferings?()
        if offeringFailure { throw SDKFailure(message: "offerings unavailable") }
        return nextOfferings
    }
    func checkTrialOrIntroDiscountEligibility(packages: [Package]) async -> [Package: IntroEligibility] {
        onEligibility?()
        return Dictionary(uniqueKeysWithValues: packages.map { ($0, IntroEligibility(status: .eligible)) })
    }
    func info() throws -> CustomerInfo {
        if let failure { throw SDKFailure(message: failure) }
        return CustomerInfo(entitlements: pro.map { ["pro": Entitlement(isActive: $0)] } ?? [:])
    }
    func purchase(package: Package) async throws -> PurchaseResult {
        purchased.append(package.identifier)
        return PurchaseResult(customerInfo: try info())
    }
    func restorePurchases() async throws -> CustomerInfo {
        restores += 1
        return try info()
    }
}

@MainActor final class PaywallHarness {
    let language: AppLanguage
    var offerings: Offerings?
    var isPurchasing = false
    var isLoading = true
    var loadFailed = false
    var trialEligibleProducts: Set<String> = []
    var showError = false
    var errorMessage = ""
    var successes = 0
    var isPro = false
    var dismissed = false
    var onPurchaseSuccess: () -> Void {
        { self.successes += 1; self.isPro = true; self.dismissed = true }
    }
    init(annual: Bool, offerings: Offerings?, language: AppLanguage) {
        self.selectedPlan = annual ? .annual : .monthly
        self.offerings = offerings
        self.language = language
    }
    func run(restoring: Bool) async {
        if restoring { await restore() } else { await purchase() }
    }
    func fetch() async { await fetchOfferings() }
    var ctaDisabled: Bool { PURCHASE_DISABLED }
    var stillAnnual: Bool { selectedPlan == .annual }
    private var selectedPlan: PlanType
'''

SWIFT_SUFFIX = r'''
}

@main struct Contract {
    @MainActor static func main() async throws {
        let annual = Package(identifier: "$rc_annual")
        let monthly = Package(identifier: "$rc_monthly")
        let full = Offerings(current: Offering(availablePackages: [annual, monthly]))
        var results: [[String: Any]] = []
        func run(_ name: String, annual: Bool = true, offerings: Offerings? = nil,
                 pro: Bool? = true, failure: String? = nil, restoring: Bool = false,
                 language: AppLanguage = .english) async {
            Purchases.shared = Purchases()
            Purchases.shared.pro = pro
            Purchases.shared.failure = failure
            let view = PaywallHarness(annual: annual, offerings: offerings, language: language)
            await view.run(restoring: restoring)
            results.append([
                "name": name, "purchased": Purchases.shared.purchased,
                "restores": Purchases.shared.restores, "successes": view.successes,
                "isPro": view.isPro, "dismissed": view.dismissed,
                "showError": view.showError, "hasMessage": !view.errorMessage.isEmpty,
                "isPurchasing": view.isPurchasing, "selectionPreserved": view.stillAnnual == annual
            ])
        }
        await run("missing offerings")
        await run("missing current", offerings: Offerings(current: nil))
        await run("empty packages", offerings: Offerings(current: Offering(availablePackages: [])))
        await run("annual absent", offerings: Offerings(current: Offering(availablePackages: [monthly])))
        await run("monthly absent", annual: false, offerings: Offerings(current: Offering(availablePackages: [annual])), language: .japanese)
        await run("annual purchase", offerings: full)
        await run("monthly purchase", annual: false, offerings: full)
        await run("missing entitlement", offerings: full, pro: nil)
        await run("inactive entitlement", offerings: full, pro: false)
        await run("purchase error", offerings: full, failure: "store unavailable")
        await run("purchase cancelled", offerings: full, failure: "purchase cancelled")
        await run("restore active", restoring: true)
        await run("restore inactive", pro: false, restoring: true)
        await run("restore missing", pro: nil, restoring: true)
        await run("restore error", failure: "restore unavailable", restoring: true)

        var fetchResults: [[String: Any]] = []
        func record(_ name: String, _ view: PaywallHarness, annual: Bool = true) {
            fetchResults.append([
                "name": name, "loadFailed": view.loadFailed, "ctaDisabled": view.ctaDisabled,
                "purchased": Purchases.shared.purchased, "successes": view.successes,
                "selectionPreserved": view.stillAnnual == annual
            ])
        }
        func fetch(_ name: String, packages: [Package]?, annual: Bool = true,
                   configured: Bool = true, failure: Bool = false, buy: Bool = false) async {
            Purchases.isConfigured = configured
            Purchases.shared = Purchases()
            Purchases.shared.nextOfferings = Offerings(current: packages.map { Offering(availablePackages: $0) })
            Purchases.shared.offeringFailure = failure
            let view = PaywallHarness(annual: annual, offerings: full, language: .english)
            await view.fetch()
            if buy && !view.ctaDisabled { await view.run(restoring: false) }
            record(name, view, annual: annual)
        }
        await fetch("annual only", packages: [annual])
        await fetch("monthly only with annual selected", packages: [monthly])
        await fetch("monthly only with monthly selected", packages: [monthly], annual: false)
        await fetch("empty offering", packages: [])
        await fetch("missing current offering", packages: nil)
        await fetch("offering request fails", packages: nil, failure: true)
        await fetch("SDK unconfigured", packages: nil, configured: false)
        await fetch("complete annual purchase", packages: [annual, monthly], buy: true)
        await fetch("complete monthly purchase", packages: [annual, monthly], annual: false, buy: true)

        Purchases.isConfigured = true
        Purchases.shared = Purchases()
        let retry = PaywallHarness(annual: false, offerings: full, language: .japanese)
        Purchases.shared.nextOfferings = Offerings(current: Offering(availablePackages: [annual]))
        await retry.fetch()
        record("retry starts from partial offering", retry, annual: false)
        Purchases.shared.nextOfferings = full
        Purchases.shared.onOfferings = {
            fetchResults.append(["name": "CTA disabled during offering request", "ctaDisabled": retry.ctaDisabled])
        }
        Purchases.shared.onEligibility = {
            fetchResults.append(["name": "CTA disabled during eligibility request", "ctaDisabled": retry.ctaDisabled])
        }
        await retry.fetch()
        if !retry.ctaDisabled { await retry.run(restoring: false) }
        record("retry succeeds with selected monthly purchase", retry, annual: false)
        let data = try JSONSerialization.data(withJSONObject: ["purchases": results, "offerings": fetchResults], options: [.sortedKeys])
        print(String(data: data, encoding: .utf8)!)
    }
}
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1] / "ThankfulGratitudeApp/Views/PaywallView.swift")
    parser.add_argument("--module-cache", type=Path, help="reuse an installed Swift module cache on disk-constrained hosts")
    args = parser.parse_args()
    source = args.source.read_text()
    actual = "\n".join(declaration(source, marker) for marker in (
        "private enum PlanType", "private var annualPackage", "private var monthlyPackage",
        "private var selectedPackage", "private func fetchOfferings()",
        "private func purchase()", "private func restore()"
    ))
    disabled = re.search(r'\.disabled\(([^\n]+)\)\s*\.accessibilityIdentifier\("paywall_cta"\)', source)
    assert disabled, "purchase CTA disabled condition is required"
    with tempfile.TemporaryDirectory(prefix="thankful-purchase-") as temporary:
        root = Path(temporary)
        fixture = root / "PaywallContract.swift"
        fixture.write_text(SWIFT_PREFIX.replace("PURCHASE_DISABLED", disabled.group(1)) + actual + SWIFT_SUFFIX)
        subprocess.run(["swiftc", "-parse-as-library", "-module-cache-path", str(args.module_cache or root / "modules"), str(fixture), "-o", str(root / "contract")], check=True)
        result = json.loads(subprocess.run([str(root / "contract")], check=True, capture_output=True, text=True).stdout)
        rows = result["purchases"]

    # Literal expectations describe effects of the real methods, not source spelling.
    expected = {
        "missing offerings": ([], 0, 0, True),
        "missing current": ([], 0, 0, True),
        "empty packages": ([], 0, 0, True),
        "annual absent": ([], 0, 0, True),
        "monthly absent": ([], 0, 0, True),
        "annual purchase": (["$rc_annual"], 0, 1, False),
        "monthly purchase": (["$rc_monthly"], 0, 1, False),
        "missing entitlement": (["$rc_annual"], 0, 0, False),
        "inactive entitlement": (["$rc_annual"], 0, 0, False),
        "purchase error": (["$rc_annual"], 0, 0, True),
        "purchase cancelled": (["$rc_annual"], 0, 0, False),
        "restore active": ([], 1, 1, False),
        "restore inactive": ([], 1, 0, False),
        "restore missing": ([], 1, 0, False),
        "restore error": ([], 1, 0, True),
    }
    assert [row["name"] for row in rows] == list(expected)
    failed = 0
    for row in rows:
        purchased, restores, successes, show_error = expected[row["name"]]
        want = dict(name=row["name"], purchased=purchased, restores=restores,
                    successes=successes, isPro=successes == 1, dismissed=successes == 1,
                    showError=show_error, hasMessage=show_error,
                    isPurchasing=False, selectionPreserved=True)
        if row != want:
            failed += 1
            print("FAIL", row["name"], json.dumps({"actual": row, "expected": want}, sort_keys=True))
        else:
            print("PASS", row["name"])
    print(f"purchase/restore: {len(rows) - failed}/{len(rows)} passed")

    fetch_expected = {
        "annual only": (True, True, []),
        "monthly only with annual selected": (True, True, []),
        "monthly only with monthly selected": (True, True, []),
        "empty offering": (True, True, []),
        "missing current offering": (True, True, []),
        "offering request fails": (True, True, []),
        "SDK unconfigured": (True, True, []),
        "complete annual purchase": (False, False, ["$rc_annual"]),
        "complete monthly purchase": (False, False, ["$rc_monthly"]),
        "retry starts from partial offering": (True, True, []),
        "CTA disabled during offering request": None,
        "CTA disabled during eligibility request": None,
        "retry succeeds with selected monthly purchase": (False, False, ["$rc_monthly"]),
    }
    fetch_rows = result["offerings"]
    assert [row["name"] for row in fetch_rows] == list(fetch_expected)
    fetch_failed = 0
    for row in fetch_rows:
        expected_state = fetch_expected[row["name"]]
        if expected_state is None:
            want = dict(name=row["name"], ctaDisabled=True)
        else:
            load_failed, cta_disabled, purchased = expected_state
            want = dict(name=row["name"], loadFailed=load_failed, ctaDisabled=cta_disabled,
                        purchased=purchased, successes=len(purchased), selectionPreserved=True)
        if row != want:
            fetch_failed += 1
            print("FAIL", row["name"], json.dumps({"actual": row, "expected": want}, sort_keys=True))
        else:
            print("PASS", row["name"])
    failed += fetch_failed
    print(f"offerings/CTA: {len(fetch_rows) - fetch_failed}/{len(fetch_rows)} passed; source_sha256={hashlib.sha256(source.encode()).hexdigest()}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
