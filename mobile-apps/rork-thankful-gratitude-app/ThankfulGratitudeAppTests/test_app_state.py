#!/usr/bin/env python3
"""Run the real AppViewModel and model types with the installed macOS Swift SDK.

The startup fixture registers an in-memory default. It never contacts a billing
provider, opens an app data store, or modifies the app's persistent preferences.
"""

import json
from pathlib import Path
import platform
import subprocess
import tempfile


CONTRACT = r'''
import Foundation

@main struct AppStateContract {
    @MainActor static func main() throws {
        UserDefaults.standard.register(defaults: ["is_pro_cached": true])
        let model = AppViewModel()
        let result = ["cached_pro_at_startup": model.isPro]
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
    ]
    with tempfile.TemporaryDirectory(prefix="thankful-state-") as temporary:
        root = Path(temporary)
        fixture = root / "AppStateContract.swift"
        fixture.write_text(CONTRACT)
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
    expected = {"cached_pro_at_startup": True}
    if actual != expected:
        print("FAIL cached Pro at startup", json.dumps({"actual": actual, "expected": expected}))
        return 1
    print("PASS cached Pro at startup")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
