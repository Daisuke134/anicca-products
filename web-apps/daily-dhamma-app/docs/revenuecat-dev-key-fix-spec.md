# RevenueCat Dev Key Fix Spec

## 開発環境

| 項目 | 値 |
|------|-----|
| ワークツリー | `/Users/anicca/anicca-onboarding-revamp` |
| ブランチ | `feature/onboarding-revamp` |
| 対象ファイル | `providers/RevenueCatProvider.tsx` |

## 問題

`getRCToken()` が `__DEV__ === true` の場合に `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` を返すが、この環境変数は未設定。結果として `apiKey = undefined` → offerings未取得 → "Subscription plans are not available" エラー。

## 修正

`getRCToken()` のフォールバックチェーンを修正:
1. `__DEV__` かつ `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` が設定済み → テストキー使用
2. `__DEV__` だがテストキー未設定 → iOS本番キーにフォールバック
3. 本番環境 → Platform.select で iOS/Android キー使用

### コード

```typescript
function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') {
    const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
    if (testKey) return testKey;
    // Fallback to production key for sandbox testing
    return Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      default: undefined,
    });
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}
```

## テスト

| テスト | 期待 |
|--------|------|
| シミュレーターでPaywall表示 | offerings取得 → 価格表示 → "Start Free Trial" タップでRC sandbox購入フロー |

## E2E判定
- Maestro E2E追加不要（RevenueCat sandbox購入はMaestroで検証不可）
