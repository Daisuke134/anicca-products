# Paywall Polish Spec — 価格表示 + 比較テーブル改善

## 開発環境

| 項目 | 値 |
|------|-----|
| ワークツリー | `/Users/anicca/anicca-onboarding-revamp` |
| ブランチ | `feature/onboarding-revamp` |
| 対象ファイル | `app/paywall.tsx`, `utils/paywallUtils.ts`, `locales/en.json`, `locales/ja.json` |

## 問題 1: 価格が表示されない

### 現状
- `formatPackagePrice(pkg)` → `pkg` が `undefined` の場合、空文字 `""` を返す
- シミュレーター/RevenueCat未設定環境ではパッケージが `undefined`
- UIには `/month` `/year` のみ表示され、金額がない

### 修正
- `formatPackagePrice()` にフォールバック価格を追加
- Monthly: `$9.99`, Yearly: `$49.99`（RevenueCat設定値と一致）
- RevenueCatからパッケージが取得できた場合はそちらを優先

### 変更箇所

| ファイル | 変更内容 |
|---------|---------|
| `utils/paywallUtils.ts` | `formatPackagePrice()` にフォールバック引数追加 |
| `app/paywall.tsx` | `formatPrice()` 呼び出しにフォールバック値渡し |

### コード設計

```typescript
// utils/paywallUtils.ts
export function formatPackagePrice(
  pkg: PurchasesPackage | undefined,
  fallback: string = ''
): string {
  if (!pkg) return fallback;
  return pkg.product.priceString;
}
```

```typescript
// paywall.tsx — hard-close内
formatPrice(monthlyPackage, '$9.99')
formatPrice(yearlyPackage, '$49.99')
```

## 問題 2: 比較テーブルに機能名がない

### 現状
- 3列: 絵文字アイコン | Free値 | Premium値
- アイコンだけでは何の機能か伝わらない

### 修正
- 比較テーブルを4列に: 絵文字 | 機能名 | Free値 | Premium値
- 機能名はロケールで管理

### 変更箇所

| ファイル | 変更内容 |
|---------|---------|
| `locales/en.json` | `paywall.compare.verses.label`, `.reminders.label`, `.bookmark.label` 追加 |
| `locales/ja.json` | 同上（日本語） |
| `app/paywall.tsx` | 比較テーブル行に機能名テキスト列追加 |

### ロケール追加

| Key | EN | JA |
|-----|----|----|
| `paywall.compare.verses.label` | `Verses` | `法句経` |
| `paywall.compare.reminders.label` | `Reminders` | `通知` |
| `paywall.compare.bookmark.label` | `Bookmarks` | `ブックマーク` |

### UIレイアウト

```
| 📜 Verses    | 10 verses   | All 423 verses |
| 🔔 Reminders | 3x / day    | Up to 10x / day|
| 🔖 Bookmarks | —           | Unlimited      |
```

## テスト

| テスト | 内容 |
|--------|------|
| Unit: paywallUtils | `formatPackagePrice(undefined, '$9.99')` === `'$9.99'` |
| Unit: paywallUtils | `formatPackagePrice(mockPkg)` === `mockPkg.product.priceString` |
| Unit: i18n | 新しいロケールキー存在確認 |

## E2E判定
- 既存Maestroテストで比較テーブル表示確認済み → 追加不要
- 価格表示はRevenueCat依存 → Maestroでは検証しない

## チェックリスト

- [ ] `formatPackagePrice` フォールバック追加
- [ ] `paywall.tsx` フォールバック価格渡し
- [ ] 比較テーブル4列化（機能名追加）
- [ ] EN/JAロケール追加
- [ ] ユニットテスト追加
- [ ] シミュレーターで確認
