#!/bin/bash
set -euo pipefail

# No login, payment, notification permission, production keys or data uploads.
# Run after the unsigned Release build on a disposable macOS CI runner.
: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
APP_PATH=$(find "$RUNNER_TEMP/dhamma-ios/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' -type d | head -1)
test -n "$APP_PATH"
xcrun swiftc scripts/assert-ios-screen.swift -o "$RUNNER_TEMP/assert-ios-screen"
xcrun simctl list devices available --json > "$RUNNER_TEMP/dhamma-simulators.json"
DEVICE_ID=$(node - "$RUNNER_TEMP/dhamma-simulators.json" <<'JS'
const fs = require('fs');
const { devices } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const phones = Object.entries(devices).filter(([runtime]) => runtime.includes('.iOS-'))
  .flatMap(([, list]) => list).filter(device => device.isAvailable && device.name.startsWith('iPhone'));
const device = phones.find(device => device.name.includes('Pro Max')) ?? phones[0];
if (!device) throw new Error('No available iPhone Simulator');
console.error(`Using ${device.name} (${device.udid})`);
console.log(device.udid);
JS
)
trap 'xcrun simctl shutdown "$DEVICE_ID" >/dev/null 2>&1 || true' EXIT
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl install "$DEVICE_ID" "$APP_PATH"

launch_app() {
  local result
  result=$(xcrun simctl launch "$DEVICE_ID" com.dailydhamma.app -AppleLanguages '(en)' -AppleLocale en_US)
  echo "$result"
  APP_PID=$(printf '%s\n' "$result" | awk '/com.dailydhamma.app:/ {print $NF}')
  [[ "$APP_PID" =~ ^[0-9]+$ ]]
}

assert_screen() {
  local phase=$1
  shift
  local screenshot="$RUNNER_TEMP/dhamma-$phase.png"
  for attempt in {1..12}; do
    kill -0 "$APP_PID"
    xcrun simctl io "$DEVICE_ID" screenshot "$screenshot" >/dev/null
    if "$RUNNER_TEMP/assert-ios-screen" "$screenshot" "$@"; then
      sleep 10
      kill -0 "$APP_PID"
      echo "PASS $phase: rendered expected screen and process remained alive"
      return
    fi
    sleep 5
  done
  echo "FAIL $phase: screen did not become ready" >&2
  return 1
}

launch_app
assert_screen first-launch 'Ancient wisdom' 'Continue'
xcrun simctl terminate "$DEVICE_ID" com.dailydhamma.app
launch_app
assert_screen relaunch 'Ancient wisdom' 'Continue'
xcrun simctl openurl "$DEVICE_ID" 'dailydharma://paywall'
assert_screen paywall-no-credentials 'Deepen Your' 'Plans are unavailable' 'Restore Purchases'
echo 'PASS native launch, relaunch and no-credentials paywall smoke test'
