# US-006: iOS Implementation

Source: rshankras WORKFLOW.md Phase 4
> "Claude-Assisted Implementation — Ask Claude to implement specific components"

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/implementation-guide/SKILL.md` — rshankras
2. `.claude/skills/ios-ux-design/SKILL.md` — UI/UX デザイン
3. `.claude/skills/mobile-ios-design/SKILL.md` — SwiftUI コード参照

## Quality Gate (MANDATORY — US-005 の成果物検証)
```bash
# RC offerings + SPM が存在しないと Mock を作ってしまう
asc subscriptions groups list --app $APP_ID | grep -q "group" || { echo "GATE FAIL: no IAP groups"; exit 1; }
grep -q "RevenueCat" Package.swift || { echo "GATE FAIL: no RevenueCat in SPM"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Story Ordering: Dependencies First. Wrong order: UI component (depends on schema that does not exist yet)」

## Step 1: IMPLEMENTATION_GUIDE.md に従う
docs/IMPLEMENTATION_GUIDE.md をそのまま実行。1 機能ずつ。

## Step 2: 自前 PaywallView（RevenueCatUI.PaywallView 禁止）

Source: Josh Holtz (RC DevRel) — https://gist.github.com/joshdholtz/48aa8be3d139381b5eee1c370f407fd8

パターン:
1. `let offering = try await Purchases.shared.offerings().current`
2. `ForEach(offering.availablePackages)` で商品ボタン表示
3. `try await Purchases.shared.purchase(package: package)` で購入
4. `customerInfo.entitlements.active["premium"]` でアンロック確認
5. `Purchases.shared.customerInfoStream` でリアルタイム反映

### Accessibility Identifiers（必須 5要素 — Maestro E2E 用）
paywall_plan_monthly / paywall_plan_yearly / paywall_cta / paywall_skip / paywall_restore

## PROHIBITED
- ⛔ `import RevenueCatUI` 禁止
- ⛔ `RevenueCatUI.PaywallView` 禁止
- ⛔ Mock/Placeholder コード禁止
- ⛔ 存在しない機能を Paywall コピーに書く禁止（Rule 11）

## Mock ゼロ検証 (PATCH 9)
```bash
MOCK_COUNT=$(grep -r 'Mock' --include='*.swift' . | grep -v 'Tests/' | grep -v '.build/' | wc -l)
[ "$MOCK_COUNT" -eq 0 ] || { echo "FAIL: $MOCK_COUNT Mock references in production code"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Acceptance Criteria: Must Be Verifiable. Each criterion must be something Ralph can CHECK」

## Acceptance Criteria
- <AppName>ios/ directory exists with App/, Views/, Models/, Services/, Resources/
- xcodebuild build succeeds
- grep -r 'Mock' (excl Tests/) = 0
- grep -r 'import RevenueCat' > 0
- No RevenueCatUI imports
- PaywallView has 5 accessibilityIdentifiers
