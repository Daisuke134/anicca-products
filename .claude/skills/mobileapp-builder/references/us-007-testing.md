# US-007: Testing

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/tdd-feature/SKILL.md` — rshankras: Red-Green-Refactor
2. `.claude/skills/integration-test-scaffold/SKILL.md` — rshankras: Integration tests
3. `.claude/skills/test-data-factory/SKILL.md` — rshankras: Test data
4. `.claude/skills/maestro-e2e/SKILL.md` — Maestro YAML flows

## 実装手順

### Step 1: docs/TEST_SPEC.md に従う
US-004 で生成された TEST_SPEC.md をそのまま実行する。
Source: rshankras WORKFLOW.md Phase 5。

### Step 2: Unit Tests
- Models + ViewModels + Services の全テスト
- `xcodebuild test` が PASS すること

### Step 3: StoreKit Configuration File
Source: Apple — https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode

1. `Products.storekit` ファイルを生成（ローカルテスト用サブスク定義）
2. monthly + annual の 2 商品を定義
3. Xcode scheme で StoreKit Configuration を設定

### Step 4: Maestro E2E（サブスク購入フロー含む）
Source: https://maestro.dev/insights/how-to-write-yaml-test-scripts-for-mobile-apps

```yaml
# flows/paywall-purchase.yaml
appId: <bundle_id>
---
- launchApp
- tapOn: "Settings"
- tapOn:
    id: "paywall_plan_monthly"
- assertVisible: "Monthly"
- tapOn:
    id: "paywall_cta"
- assertVisible: "Confirm"    # StoreKit sandbox confirmation
- tapOn: "Confirm"
```

### Step 5: 全テスト実行
```bash
# Unit + Integration
xcodebuild test -scheme <AppName> -destination "platform=iOS Simulator,id=$UDID"

# Maestro E2E
maestro test flows/
```

## Acceptance Criteria
- xcodebuild test PASS
- Unit tests exist for Models and Services
- Maestro E2E flows PASS（paywall 表示 + 購入フロー）
- All tests pass
