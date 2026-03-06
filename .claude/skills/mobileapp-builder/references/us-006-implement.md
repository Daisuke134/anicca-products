# US-006: iOS Implementation (TDD)

## Skill

**Read first:** `.claude/skills/tdd-feature/SKILL.md` — Canon TDD 5-step cycle, iOS patterns, Fastlane commands

## Variables

```bash
APP_NAME="<AppName>"          # e.g. DeskStretch
APP_SCHEME="<AppName>"        # Xcode scheme name
APP_DIR="$PWD"                # App root directory
BUNDLE_ID="com.aniccafactory.<appname>"
UDID=$(xcrun simctl list devices available | grep "iPhone 16" | head -1 | grep -oE '[A-F0-9-]{36}')
```

## Quality Gate 0 (US-005b 成果物検証)

```bash
source ~/.config/mobileapp-builder/.env
export ASC_BYPASS_KEYCHAIN=true
grep -q "RevenueCat" ${APP_NAME}ios/project.yml || { echo "GATE FAIL: no RevenueCat in project.yml"; exit 1; }
asc subscriptions groups list --app $APP_ID | grep -q "group" || { echo "GATE FAIL: no IAP groups"; exit 1; }
```

## Execution Order (4 sub-sessions: 006a → 006b → 006c → 006d)

Source: tdd-feature SKILL.md — "TDD Execution Order: Models → Services → ViewModels → Integration"

### 006a: Data Layer
1. xcconfig template for API Key (tdd-feature: "xcconfig Template Pattern")
2. SubscriptionService Protocol + Implementation (tdd-feature: "Protocol-Based DI")
3. StretchLibraryService error handling
4. Models with accessibilityIdentifier constants
5. ProgressService input validation

### 006b: Onboarding + Monetization
1. AppState → MVVM split (ViewModels)
2. Onboarding flow (notification permission step)
3. Onboarding hook (UX_SPEC compliant — see ios-ux-design references/onboarding.md)
4. PaywallView: offerings error display + DESIGN_SYSTEM tokens
5. PaywallView: remove false claims (Rule 21: AI禁止)
6. URL force-unwrap → optional binding

### 006c: Core Screens
1. Timer: background timer support
2. Timer: zero-division guard (intervalMinutes=0)
3. Timer: StretchLibraryService dedup
4. Settings: Upgrade → PaywallView navigation
5. ProgressDashboard: DateFormatter optimization + weekday labels

### 006d: Polish + Resources
1. DESIGN_SYSTEM tokens across all Views
2. All a11y IDs aligned to TEST_SPEC
3. PrivacyInfo.xcprivacy + ITSAppUsesNonExemptEncryption
4. Localization (.xcstrings)
5. PainAreaSelectionView: disabled button helper text

**Each sub-session follows Canon TDD:** Test List → RED → GREEN → REFACTOR → repeat

## Step: project.yml (before implementation)

```bash
cd ${APP_NAME}ios && xcodegen generate
```

project.yml template: see current file or docs/ARCHITECTURE.md. Key points:
- `deploymentTarget: iOS "17.0"` if @Observable, `"15.0"` if ObservableObject
- `packages: RevenueCat` (SPM mirror, from: 5.0.0). **RevenueCatUI 禁止**
- Test target: `GENERATE_INFOPLIST_FILE: YES`
- `.xcodeproj` in .gitignore

## Step: PrivacyInfo.xcprivacy

```bash
cat > ${APP_NAME}ios/${APP_NAME}/PrivacyInfo.xcprivacy << 'PRIVEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
PRIVEOF
```

## Step: App Icon (1024x1024 single image, universal idiom)

```bash
# Generate with PIL, then place at:
# Resources/Assets.xcassets/AppIcon.appiconset/1024.png
# Contents.json: "idiom": "universal", "platform": "ios", "size": "1024x1024"
```

## Step: PaywallView (自前 SwiftUI — RevenueCatUI 禁止)

Pattern: `Purchases.shared.offerings().current` → `ForEach(availablePackages)` → `purchase(package:)`

Required a11y IDs: `paywall_plan_monthly`, `paywall_plan_yearly`, `paywall_cta`, `paywall_maybe_later`, `paywall_restore`

Onboarding key: `hasCompletedOnboarding` (全アプリ統一 — US-008a スクショ依存)

## Step: Greenlight Loop (実装完了後)

```bash
while true; do
  GL_OUTPUT=$(greenlight preflight "$(find . -name '*.xcodeproj' -maxdepth 2 | head -1 | xargs dirname)" --format json 2>&1)
  GL_CRITICAL=$(echo "$GL_OUTPUT" | jq '.summary.critical // 999')
  [ "$GL_CRITICAL" -eq 0 ] && echo "GREENLIT" && break
  echo "CRITICAL=$GL_CRITICAL — fixing..."
done
```

## PROHIBITED

- `import RevenueCatUI` / `RevenueCatUI.PaywallView`
- Mock/Placeholder code in production
- Mixpanel / Firebase Analytics / Amplitude (Greenlight CRITICAL)
- AppTrackingTransparency / NSUserTrackingUsageDescription
- AI API / external API (Rule 21: OpenAI, Anthropic, Gemini, FoundationModels)
- `xcodebuild` direct — use `fastlane test` / `fastlane build`

## Gate (ALL must pass)

```bash
# Build
fastlane build

# Tests
fastlane test

# Mock zero
MOCK_COUNT=$(grep -rw 'class Mock' --include='*.swift' . | grep -v 'Tests/' | grep -v '.build/' | wc -l)
[ "$MOCK_COUNT" -eq 0 ] || { echo "FAIL: $MOCK_COUNT Mock in production"; exit 1; }

# RevenueCat present, RevenueCatUI absent
grep -r 'import RevenueCat' --include='*.swift' . | grep -v 'RevenueCatUI' | wc -l  # > 0
grep -r 'import RevenueCatUI' --include='*.swift' . | wc -l  # = 0

# PrivacyInfo
grep -q "CA92.1" ${APP_NAME}ios/${APP_NAME}/PrivacyInfo.xcprivacy

# No AI APIs (Rule 21)
grep -rE 'import (OpenAI|GoogleGenerativeAI|Anthropic)' --include='*.swift' . | wc -l  # = 0

# Greenlight
greenlight preflight "$(find . -name '*.xcodeproj' -maxdepth 2 | head -1 | xargs dirname)" --format json | jq -e '.summary.critical == 0'

echo "US-006 PASS"
```
