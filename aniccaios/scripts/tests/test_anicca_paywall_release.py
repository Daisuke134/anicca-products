"""Release mirror contract for the canonical Anicca paywall fix."""

from pathlib import Path
import unittest


APP_ROOT = Path(__file__).resolve().parents[2]
HELPER = APP_ROOT / "aniccaios/Onboarding/PaywallPackageSelection.swift"
MANAGER = APP_ROOT / "aniccaios/Services/SubscriptionManager.swift"
VIEW = APP_ROOT / "aniccaios/Onboarding/PaywallVariantBView.swift"


class AniccaPaywallReleaseTests(unittest.TestCase):
    def test_honne_current_falls_back_to_validated_anicca_offering(self):
        self.assertTrue(HELPER.is_file(), "Anicca offering/package resolver is absent from the release target")
        manager = MANAGER.read_text(encoding="utf-8")
        helper = HELPER.read_text(encoding="utf-8")
        self.assertTrue('aniccaFallbackOfferingIdentifier = "anicca_variant_b"' in manager, "Anicca fallback offering is not configured")
        self.assertTrue("resolveAniccaOffering(from: cached)" in manager, "cached offerings bypass Anicca validation")
        self.assertTrue("resolveAniccaOffering(from: result)" in manager, "refreshed offerings bypass Anicca validation")
        self.assertTrue('productIdentifiers.allSatisfy { $0.hasPrefix("ai.anicca.app.ios.") }' in helper, "fallback accepts non-Anicca products")

    def test_async_refresh_reconciles_selected_package(self):
        view = VIEW.read_text(encoding="utf-8")
        self.assertTrue("synchronizePackageSelection()" in view, "selected package is not reconciled after offering refresh")
        self.assertTrue("ObjectIdentifier($0)" in view, "same-ID package replacement is not observed")


if __name__ == "__main__":
    unittest.main()
