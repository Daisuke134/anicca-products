# US-006: iOS Implementation

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/implementation-guide/SKILL.md` — rshankras: 実装ガイド
2. `.claude/skills/paywall-generator/SKILL.md` — rshankras: StoreKit 2 参照
3. `.claude/skills/ios-ux-design/SKILL.md` — UI/UX デザイン
4. `.claude/skills/mobile-ios-design/SKILL.md` — SwiftUI コード参照
5. `.claude/skills/revenuecat/SKILL.md` — RC SDK 実装参照

## 実装手順

### Step 1: docs/IMPLEMENTATION_GUIDE.md に従う
US-004 で生成された IMPLEMENTATION_GUIDE.md をそのまま実行する。
1 機能ずつ実装。Source: rshankras WORKFLOW.md Phase 4。

### Step 2: 自前 PaywallView（RevenueCatUI.PaywallView 禁止）

Source: Josh Holtz (RC DevRel) — https://gist.github.com/joshdholtz/48aa8be3d139381b5eee1c370f407fd8

パターン:
1. `let offering = try await Purchases.shared.offerings().current`
2. `ForEach(offering.availablePackages)` で商品ボタン表示
3. `try await Purchases.shared.purchase(package: package)` で購入
4. `customerInfo.entitlements.active["premium"]` でアンロック確認
5. `Purchases.shared.customerInfoStream` で購入状態リアルタイム反映

### Step 3: Accessibility Identifiers（必須 5要素）
paywall_plan_monthly / paywall_plan_yearly / paywall_cta / paywall_skip / paywall_restore

## PROHIBITED
- import RevenueCatUI 禁止
- RevenueCatUI.PaywallView 禁止
- RC ダッシュボードでペイウォール作成 禁止
- Mock/Placeholder コード禁止
