import Purchases from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat の Offering から月額パッケージを返す。
 * identifier が 'monthly' または '$rc_monthly' のパッケージを探す。
 */
export function findMonthlyPackage(
  packages: PurchasesPackage[]
): PurchasesPackage | undefined {
  return packages.find(
    (pkg) => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
  );
}

/**
 * RevenueCat の Offering から年額パッケージを返す。
 * identifier が 'annual' または '$rc_annual' のパッケージを探す。
 */
export function findYearlyPackage(
  packages: PurchasesPackage[]
): PurchasesPackage | undefined {
  return packages.find(
    (pkg) => pkg.identifier === 'annual' || pkg.identifier === '$rc_annual'
  );
}

/**
 * パッケージの価格文字列を返す。パッケージが undefined の場合は空文字を返す。
 */
export function formatPackagePrice(
  pkg: PurchasesPackage | undefined
): string {
  if (!pkg) return '';
  return pkg.product.priceString;
}

export type TrialUnit = 'DAY' | 'WEEK' | 'MONTH';
const TRIAL_UNITS: TrialUnit[] = ['DAY', 'WEEK', 'MONTH'];

/**
 * 無料トライアル（introPrice の price が 0）があれば、ストアの単位のまま返す。換算はしない。
 */
export function getFreeTrial(
  pkg: PurchasesPackage | undefined
): { unit: TrialUnit; count: number } | null {
  const intro = pkg?.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unit = intro.periodUnit as TrialUnit;
  return TRIAL_UNITS.includes(unit) ? { unit, count: intro.periodNumberOfUnits } : null;
}

/**
 * 年額の月換算（年額 / 12）。ストアが整形した値を優先し、無ければ商品の通貨で整形する。
 */
export function perMonthPriceString(
  pkg: PurchasesPackage | undefined,
  locale?: string
): string {
  if (!pkg) return '';
  return (
    pkg.product.pricePerMonthString ??
    new Intl.NumberFormat(locale, { style: 'currency', currency: pkg.product.currencyCode }).format(pkg.product.price / 12)
  );
}

/**
 * 年額が「月額 × 12」より何%安いか。計算できない・安くない場合は null。
 */
export function savingsPercent(
  monthly: PurchasesPackage | undefined,
  yearly: PurchasesPackage | undefined
): number | null {
  if (!monthly || !yearly || monthly.product.price <= 0) return null;
  const percent = Math.round((1 - yearly.product.price / (monthly.product.price * 12)) * 100);
  return percent > 0 ? percent : null;
}

// --- paywall の出しどころ ---

export const FREE_NOTIFICATION_LIMIT = 3;
export const STREAK_PAYWALL_DAY = 3;

/** 無料ユーザーが無料枠（freeCount 句）を超えた句（0始まり index）に来たか */
export const isVerseLocked = (index: number, freeCount: number, isPremium: boolean) =>
  !isPremium && index >= freeCount;

/** 無料ユーザーが1日3回を超える通知回数を選ぼうとしたか */
export const isFrequencyLocked = (frequency: number, isPremium: boolean) =>
  !isPremium && frequency > FREE_NOTIFICATION_LIMIT;

/** Date → ローカル日付 'YYYY-MM-DD' */
export function localDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * 今日開いたときの連続起動日数。同じ日の再オープンなら null（更新不要）。
 */
export function nextOpenStreak(
  lastOpenDate: string | null | undefined,
  openStreak: number | undefined,
  today: string
): { lastOpenDate: string; openStreak: number } | null {
  if (lastOpenDate === today) return null;
  const [y, m, d] = today.split('-').map(Number);
  const yesterday = localDateKey(new Date(y, m - 1, d - 1));
  return { lastOpenDate: today, openStreak: lastOpenDate === yesterday ? (openStreak ?? 0) + 1 : 1 };
}

/** 3日連続で開いた無料ユーザーに1回だけ出す */
export const shouldShowStreakPaywall = (
  openStreak: number | undefined,
  alreadyShown: boolean | undefined,
  isPremium: boolean
) => !isPremium && !alreadyShown && (openStreak ?? 0) >= STREAK_PAYWALL_DAY;

// --- 計測 ---

export type PaywallEvent = 'paywall_shown' | 'trial_started' | 'purchase';

/**
 * 自作ペイウォールの表示・購入を RevenueCat の subscriber attributes に記録する。
 * ponytail: 最新の1件だけ残る（回数は RevenueCat 側の購入イベントで見る）。件数が要るなら analytics を入れる。
 */
export function trackPaywallEvent(event: PaywallEvent, source: string): void {
  console.log('[Paywall] event:', event, source);
  Purchases.setAttributes({
    [`${event}_at`]: new Date().toISOString(),
    [`${event}_source`]: source,
  }).catch((e: unknown) => console.warn('[Paywall] setAttributes failed:', e));
}
