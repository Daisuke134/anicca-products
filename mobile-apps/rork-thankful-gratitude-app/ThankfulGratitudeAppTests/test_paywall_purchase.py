#!/usr/bin/env python3
"""Execute PaywallView's unchanged purchase/restore bodies with a local SDK boundary.

Run with python3; requires only the installed Swift compiler. This does not build
SwiftUI, contact RevenueCat/StoreKit, or replace a native app integration test.
"""

import argparse
import hashlib
import json
from pathlib import Path
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
struct Package { let identifier: String }
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
        let data = try JSONSerialization.data(withJSONObject: results, options: [.sortedKeys])
        print(String(data: data, encoding: .utf8)!)
    }
}
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1] / "ThankfulGratitudeApp/Views/PaywallView.swift")
    args = parser.parse_args()
    source = args.source.read_text()
    actual = "\n".join(declaration(source, marker) for marker in (
        "private enum PlanType", "private func purchase()", "private func restore()"
    ))
    with tempfile.TemporaryDirectory(prefix="thankful-purchase-") as temporary:
        root = Path(temporary)
        fixture = root / "PaywallContract.swift"
        fixture.write_text(SWIFT_PREFIX + actual + SWIFT_SUFFIX)
        subprocess.run(["swiftc", "-parse-as-library", "-module-cache-path", str(root / "modules"), str(fixture), "-o", str(root / "contract")], check=True)
        rows = json.loads(subprocess.run([str(root / "contract")], check=True, capture_output=True, text=True).stdout)

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
    print(f"{len(rows) - failed}/{len(rows)} passed; source_sha256={hashlib.sha256(source.encode()).hexdigest()}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
