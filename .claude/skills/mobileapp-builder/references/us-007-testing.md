# US-007: Testing

Source: rshankras WORKFLOW.md Phase 5

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/tdd-feature/SKILL.md` — rshankras: Red-Green-Refactor
2. `.claude/skills/integration-test-scaffold/SKILL.md` — rshankras
3. `.claude/skills/test-data-factory/SKILL.md` — rshankras
4. `.claude/skills/maestro-e2e/SKILL.md` — Maestro YAML flows

## Quality Gate (MANDATORY — US-006 検証)
```bash
xcodebuild -scheme <AppName> build -destination "platform=iOS Simulator,id=$UDID" || { echo "GATE FAIL: build broken"; exit 1; }
grep -r 'Mock' --include='*.swift' . | grep -v Tests/ | grep -v .build/ | wc -l | grep -q '^0$' || { echo "GATE FAIL: Mocks in prod"; exit 1; }
```

## Step 1: docs/TEST_SPEC.md に従う

## Step 2: Unit + Integration Tests
- Models + ViewModels + Services
- `xcodebuild test` PASS

## Step 3: StoreKit Configuration File
Source: Apple (https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode)

1. `Products.storekit` — monthly + annual 定義
2. Xcode scheme で StoreKit Configuration 設定

## Step 4: Maestro E2E（サブスク購入フロー）
Source: https://maestro.dev/insights/how-to-write-yaml-test-scripts-for-mobile-apps

```yaml
# flows/paywall-purchase.yaml
appId: <bundle_id>
---
- launchApp
- tapOn:
    id: "paywall_plan_monthly"
- tapOn:
    id: "paywall_cta"
- assertVisible: "Confirm"
- tapOn: "Confirm"
```

## Step 5: 全テスト実行
```bash
xcodebuild test -scheme <AppName> -destination "platform=iOS Simulator,id=$UDID"
maestro test flows/
```

## Acceptance Criteria
- xcodebuild test succeeds
- Unit tests for Models and Services
- Products.storekit exists
- Maestro E2E flows pass (paywall purchase)
- All tests pass
