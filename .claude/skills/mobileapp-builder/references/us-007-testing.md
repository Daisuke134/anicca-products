# US-007: E2E Testing (Maestro)

**Unit/Integration tests are written in US-006 (TDD).** This US is E2E only.

## Skill

**Read first:** `.claude/skills/maestro-ui-testing/SKILL.md` — Best practices, Fix Loop, RC Test Store, a11y selectors

## Variables

```bash
APP_NAME="<AppName>"
BUNDLE_ID="com.aniccafactory.<appname>"
UDID=$(xcrun simctl list devices available | grep "iPhone 16" | head -1 | grep -oE '[A-F0-9-]{36}')
```

## Quality Gate 0 (US-006 成果物検証)

```bash
fastlane test  # Unit/Integration from 006 must still pass
fastlane build_for_simulator  # Simulator build for Maestro
```

## 6 Flows

| # | File | Content | Tags |
|---|------|---------|------|
| 1 | `maestro/01-onboarding.yaml` | Full onboarding flow | onboarding, smokeTest |
| 2 | `maestro/02-timer.yaml` | Timer start → stretch | timer |
| 3 | `maestro/03-settings.yaml` | Settings screen navigation | settings |
| 4 | `maestro/04-payment-monthly-success.yaml` | RC Test Store → Monthly → Simulate Success | payment, smokeTest |
| 5 | `maestro/05-payment-annual-success.yaml` | RC Test Store → Annual → Simulate Success | payment |
| 6 | `maestro/06-payment-failure.yaml` | RC Test Store → Simulate Failure | payment |

## Flow Template (all flows follow this structure)

```yaml
appId: com.aniccafactory.<appname>
tags:
  - <tag>
---
- clearState
- clearKeychain
- launchApp
- extendedWaitUntil:
    visible:
      id: "<first_element>"
    timeout: 30000
# ... flow steps using id: selectors ...
- takeScreenshot: "<flow_name>"
```

## Fix Loop (FAIL 時の自動修正)

See maestro-ui-testing SKILL.md "Fix Loop" section.

## PROHIBITED

- `flows/` directory (use `maestro/`)
- `xcodebuild test` (use `fastlane test`)
- StoreKit Configuration file (use RC Test Store + `uiPreviewMode`)
  ⚠️ RC Test Store (`test_` key) 単独ではシミュレータで offerings 取得不可。
  us-005b の `uiPreviewMode` パターンが必須。詳細: us-005b-monetization.md
- `point:` selectors (use `id:`)
- Static `wait:` commands (use `extendedWaitUntil`)
- Foundation Models references (Rule 21)
- `"Simulate Success"` / `"Simulate Failure"` テキスト（旧API。RC SDK 5.60.0 では `"Test valid purchase"` / `"Test failed purchase"`）

## Gate (ALL must pass)

```bash
# Simulator build
fastlane build_for_simulator

# All 6 Maestro flows
maestro test maestro/

# Verify flow count
FLOW_COUNT=$(ls maestro/*.yaml | wc -l)
[ "$FLOW_COUNT" -ge 6 ] || { echo "FAIL: need 6+ flows, got $FLOW_COUNT"; exit 1; }

# Verify clearState in all flows
for f in maestro/*.yaml; do
  grep -q 'clearState' "$f" || { echo "FAIL: $f missing clearState"; exit 1; }
done

# Verify takeScreenshot in all flows
for f in maestro/*.yaml; do
  grep -q 'takeScreenshot' "$f" || { echo "FAIL: $f missing takeScreenshot"; exit 1; }
done

# Verify smokeTest tag exists
grep -rl 'smokeTest' maestro/ | wc -l | grep -qv '^0$' || { echo "FAIL: no smokeTest tags"; exit 1; }

echo "US-007 PASS"
```
