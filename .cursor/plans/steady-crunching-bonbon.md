# Daily Dhamma v1.1.0 — 3 Fix Spec

## Context

シミュレーターでオンボーディング v2 を確認した結果、3つの問題を発見。App Store 提出前に修正必須。
コード検証 + 品質レビュー済み。BLOCKING 2件を修正、UX改善2件を追加。

---

## Fix 1: 購入エラーハンドリング改善

### 根本原因

**シミュレーターでの購入失敗は想定動作。バグではない。** StoreKit APIがシミュレーターで動作しない。

Source: RevenueCat Docs (test-and-launch/sandbox)

### 問題

`app/paywall.tsx:120-125` のキャンセル検出が**文字列マッチ**で脆弱。Providerは正しく `.code` を使用。

### 修正

| ファイル | 行 | 変更 |
|---------|-----|------|
| `app/paywall.tsx` | import | `PURCHASES_ERROR_CODE` を `react-native-purchases` から追加 |
| `app/paywall.tsx` | 120-125 | `.code` チェックに変更 |

```typescript
// import変更
import { PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases';

// catch変更
} catch (error: unknown) {
  const purchaseError = error as Error & { code?: string };
  if (purchaseError.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    Alert.alert(t('paywall.alert.purchaseFailed.title'), t('paywall.alert.purchaseFailed.msg'));
  }
}
```

---

## Fix 2: 設定/プレミアム機能からのPaywallを直接表示

### 根本原因

ルートパラメータなし。全アクセスが3ステップフローを表示。

| アクセス元 | 現在 | 修正後 |
|-----------|------|--------|
| オンボーディング（`onboarding.tsx:129`） | 3ステップ | 3ステップ（正しい） |
| ブックマーク（`index.tsx:49`） | 3ステップ | **直接 hard-close** |
| 設定バナー（`settings.tsx:98`） | 3ステップ | **直接 hard-close** |
| 設定頻度（`settings.tsx:172`） | 3ステップ | **直接 hard-close** |

### 修正

| ファイル | 行 | 変更 |
|---------|-----|------|
| `app/paywall.tsx` | import | `useLocalSearchParams` を `expo-router` から追加 |
| `app/paywall.tsx` | 37付近 | sourceパラメータ取得 + 初期ステップ分岐 |
| `app/paywall.tsx` | step dots | non-onboarding時は非表示 |
| `app/paywall.tsx` | X button | non-onboarding時は即表示（3秒ディレイなし） |
| `app/onboarding.tsx` | 129 | `?source=onboarding` パラメータ追加 |

**paywall.tsx:**
```typescript
// import
import { useRouter, useLocalSearchParams } from 'expo-router';

// state
const { source } = useLocalSearchParams<{ source?: string }>();
const isOnboarding = source === 'onboarding';
const [currentStep, setCurrentStep] = useState<PaywallStep>(
  isOnboarding ? 'risk-free' : 'hard-close'
);

// X button: non-onboarding時は即表示
useEffect(() => {
  if (currentStep === 'hard-close') {
    if (!isOnboarding) {
      setShowClose(true);  // 即表示
      return;
    }
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }
  setShowClose(false);
}, [currentStep, isOnboarding]);

// step dots: non-onboarding時は非表示
{isOnboarding && renderStepDots()}
```

**onboarding.tsx:**
```typescript
// 129行目
router.replace('/paywall?source=onboarding');
```

---

## Fix 3: プッシュ通知タイトルのローカライズ

### 根本原因

UI画面91キーは完全ローカライズ済み。通知タイトル2箇所のみハードコード。

### 修正

| ファイル | 行 | 変更 |
|---------|-----|------|
| `utils/notifications.ts` | 44後 | `scheduleMorningVerseNotification` に `lang` 変数追加 |
| `utils/notifications.ts` | 65 | タイトルローカライズ |
| `utils/notifications.ts` | 85後 | `scheduleStayPresentNotifications` に `lang` 変数追加 |
| `utils/notifications.ts` | 132 | タイトルローカライズ |

**scheduleMorningVerseNotification（L44付近）:**
```typescript
const locale = getDeviceLocale();
const lang = locale.toLowerCase().split('-')[0];  // ← 追加
const [hours, minutes] = time.split(':').map(Number);
// ...
// L65:
title: lang === 'ja' ? 'デイリーダンマ' : 'Daily Dhamma',
```

**scheduleStayPresentNotifications（L85付近）:**
```typescript
const locale = getDeviceLocale();
const lang = locale.toLowerCase().split('-')[0];  // ← 追加
const actualFrequency = isPremium ? frequency : Math.min(frequency, 3);
// ...
// L132:
title: lang === 'ja' ? 'デイリーダンマ' : 'Daily Dhamma',
```

**Trial Reminder（L170-176）:** 変更なし（既に正しいパターン）。

---

## 修正対象ファイル一覧

| ファイル | Fix # | 変更内容 |
|---------|-------|---------|
| `app/paywall.tsx` | 1, 2 | import追加 + source分岐 + error.code + X即表示 + dots非表示 |
| `app/onboarding.tsx` | 2 | 1行（`?source=onboarding`） |
| `utils/notifications.ts` | 3 | `lang`変数追加2箇所 + タイトルローカライズ2箇所 |

## 検証手順

| Step | やること |
|------|---------|
| 1 | コード修正（3ファイル） |
| 2 | `npm test` — 既存66テスト全パス |
| 3 | `npx expo run:ios`（EN）→ オンボーディング完走 → 3ステップPaywall + ドット表示確認 |
| 4 | メイン画面 → ブックマーク → **直接Paywall** + ドットなし + X即表示 確認 |
| 5 | 設定 → プレミアムバナー → **直接Paywall** + ドットなし + X即表示 確認 |
| 6 | シミュレーター言語JA → 全画面日本語確認 |
| 7 | コミット & push |
