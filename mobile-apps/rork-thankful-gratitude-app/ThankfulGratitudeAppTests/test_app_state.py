#!/usr/bin/env python3
"""Run the real AppViewModel and model types with the installed macOS Swift SDK.

The startup fixture uses an in-memory default; other cases clean up a unique
defaults suite. No billing provider or app data store is opened.
"""

import json
from pathlib import Path
import platform
import subprocess
import tempfile
from test_paywall_purchase import declaration


CONTRACT = r'''
import Foundation
import Observation
import SwiftUI

@MainActor final class ChangeFlag {
    var changed = false
}

@MainActor final class EntryContext {
    var inserted: [GratitudeEntry] = []
    func insert(_ entry: GratitudeEntry) { inserted.append(entry) }
}

@MainActor final class HomeHarness {
    let viewModel: AppViewModel
    let language = AppLanguage.english
    let modelContext = EntryContext()
    var entries: [GratitudeEntry] = []
    var gratitude1 = " gratitude "
    var gratitude2 = ""
    var gratitude3 = ""
    var showSavedFeedback = false
    init(_ viewModel: AppViewModel) { self.viewModel = viewModel }
    func runSave() { saveEntry() }
    __SAVE_ENTRY__
}

@main struct AppStateContract {
    @MainActor static func main() throws {
        NSTimeZone.default = TimeZone(secondsFromGMT: 0)!
        UserDefaults.standard.register(defaults: ["is_pro_cached": true])
        let model = AppViewModel()
        let suite = "thankful-state-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        defaults.set(false, forKey: "is_pro_cached")
        let free = AppViewModel(defaults: defaults)
        let formatter = ISO8601DateFormatter()
        let first = formatter.date(from: "2026-10-23T12:00:00Z")!
        let next = formatter.date(from: "2026-10-24T12:00:00Z")!
        free.refreshDay(first)
        let before = free.displayedAffirmation.english
        let flag = ChangeFlag()
        withObservationTracking {
            _ = free.displayedAffirmation
        } onChange: {
            MainActor.assumeIsolated { flag.changed = true }
        }
        free.refreshDay(next)
        let after = free.displayedAffirmation.english
        let observedDayChange = flag.changed
        free.isPro = true
        free.currentAffirmation = Affirmation(english: "My selected quote", japanese: "選んだ言葉")
        free.refreshDay(first)
        let proKeptSelection = free.displayedAffirmation.english == "My selected quote"
        free.isPro = false
        free.refreshDay(next)
        let revoked = AppViewModel(defaults: defaults)
        let todayQuote = revoked.displayedAffirmation.english
        free.refreshDay(Calendar.current.date(byAdding: .day, value: -1, to: Date())!)
        let home = HomeHarness(free)
        home.runSave()
        let saved = home.modelContext.inserted[0]
        let result: [String: Any] = [
            "cached_pro_at_startup": model.isPro,
            "first_day": before,
            "next_day": after,
            "observed_day_change": observedDayChange,
            "pro_kept_selection": proKeptSelection,
            "revoked_cache": !revoked.isPro,
            "month_en": L10n.trialPeriod(value: 1, unit: .month, .english),
            "month_ja": L10n.trialPeriod(value: 1, unit: .month, .japanese),
            "week_en": L10n.trialPeriod(value: 2, unit: .week, .english),
            "year_ja": L10n.trialPeriod(value: 1, unit: .year, .japanese),
            "saved_today": Calendar.current.isDateInToday(saved.date),
            "save_refreshes_display": free.displayedAffirmation.english == todayQuote,
            "saved_matches_today": saved.affirmation == todayQuote,
        ]
        let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
        print(String(data: data, encoding: .utf8)!)
    }
}
'''


def main():
    app = Path(__file__).resolve().parents[1] / "ThankfulGratitudeApp"
    sources = [
        app / "ViewModels/AppViewModel.swift",
        app / "Models/AppLanguage.swift",
        app / "Models/AffirmationData.swift",
        app / "Models/GratitudeEntry.swift",
        app / "Models/Strings.swift",
    ]
    with tempfile.TemporaryDirectory(prefix="thankful-state-") as temporary:
        root = Path(temporary)
        fixture = root / "AppStateContract.swift"
        save = declaration((app / "Views/HomeView.swift").read_text(), "private func saveEntry()")
        fixture.write_text(CONTRACT.replace("__SAVE_ENTRY__", save))
        binary = root / "contract"
        subprocess.run([
            "swiftc", "-parse-as-library", "-swift-version", "6",
            "-target", f"{platform.machine()}-apple-macosx14.0",
            "-module-cache-path", str(root / "modules"),
            *map(str, sources), str(fixture), "-o", str(binary),
        ], check=True)
        actual = json.loads(subprocess.run(
            [str(binary)], check=True, capture_output=True, text=True,
        ).stdout)
    expected = {
        "cached_pro_at_startup": True,
        "first_day": "I am surrounded by love",
        "next_day": "My heart is open to new experiences",
        "observed_day_change": True,
        "pro_kept_selection": True,
        "revoked_cache": True,
        "month_en": "1-month",
        "month_ja": "1か月間",
        "week_en": "2-week",
        "year_ja": "1年間",
        "saved_today": True,
        "save_refreshes_display": True,
        "saved_matches_today": True,
    }
    if actual != expected:
        print("FAIL app state", json.dumps({"actual": actual, "expected": expected}))
        return 1
    print("PASS app state: cached Pro, observed day rollover, Pro selection, trial units")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
