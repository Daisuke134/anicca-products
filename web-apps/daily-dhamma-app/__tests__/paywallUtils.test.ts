/**
 * paywallUtils Unit Tests (TDD)
 *
 * T-P1: findMonthlyPackage finds 'monthly' identifier
 * T-P2: findMonthlyPackage finds '$rc_monthly' identifier
 * T-P3: findYearlyPackage finds 'annual' identifier
 * T-P4: findYearlyPackage finds '$rc_annual' identifier
 * T-P5: findMonthlyPackage returns undefined when packages empty
 * T-P6: formatPackagePrice returns priceString when pkg exists
 * T-P7: formatPackagePrice returns empty string when pkg undefined
 */

import { I18n } from 'i18n-js';
import Purchases, { INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  findMonthlyPackage,
  findYearlyPackage,
  formatPackagePrice,
  getFreeTrial,
  perMonthPriceString,
  savingsPercent,
  isVerseLocked,
  isFrequencyLocked,
  nextOpenStreak,
  shouldShowStreakPaywall,
  trackPaywallEvent,
} from '../utils/paywallUtils';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { setAttributes: jest.fn(() => Promise.resolve()) },
  INTRO_ELIGIBILITY_STATUS: jest.requireActual('@revenuecat/purchases-typescript-internal').INTRO_ELIGIBILITY_STATUS,
}));

const en = require('../locales/en.json');
const ja = require('../locales/ja.json');

type Intro = { price: number; periodUnit: string; periodNumberOfUnits: number } | null;

function makePkg(
  identifier: string,
  priceString = '$9.99',
  price = 9.99,
  introPrice: Intro = null,
  currencyCode = 'USD',
  pricePerMonthString: string | null = null,
): PurchasesPackage {
  return {
    identifier,
    packageType: 'CUSTOM',
    product: {
      identifier: `com.dailydhamma.${identifier}`,
      description: 'Test product',
      title: 'Test',
      price,
      priceString,
      pricePerMonthString,
      currencyCode,
      introPrice,
      discounts: [],
      productCategory: 'NON_SUBSCRIPTION',
      productType: 'NON_CONSUMABLE',
      subscriptionPeriod: null,
    },
    offeringIdentifier: 'default',
    presentedOfferingContext: { offeringIdentifier: 'default', placementIdentifier: null, targetingContext: null },
  } as unknown as PurchasesPackage;
}

describe('findMonthlyPackage', () => {
  // T-P1
  test('finds package with identifier "monthly"', () => {
    const pkgs = [makePkg('annual'), makePkg('monthly')];
    expect(findMonthlyPackage(pkgs)?.identifier).toBe('monthly');
  });

  // T-P2
  test('finds package with identifier "$rc_monthly"', () => {
    const pkgs = [makePkg('$rc_annual'), makePkg('$rc_monthly')];
    expect(findMonthlyPackage(pkgs)?.identifier).toBe('$rc_monthly');
  });

  // T-P5
  test('returns undefined when packages array is empty', () => {
    expect(findMonthlyPackage([])).toBeUndefined();
  });
});

describe('findYearlyPackage', () => {
  // T-P3
  test('finds package with identifier "annual"', () => {
    const pkgs = [makePkg('monthly'), makePkg('annual')];
    expect(findYearlyPackage(pkgs)?.identifier).toBe('annual');
  });

  // T-P4
  test('finds package with identifier "$rc_annual"', () => {
    const pkgs = [makePkg('$rc_monthly'), makePkg('$rc_annual')];
    expect(findYearlyPackage(pkgs)?.identifier).toBe('$rc_annual');
  });

  test('returns undefined when packages array is empty', () => {
    expect(findYearlyPackage([])).toBeUndefined();
  });
});

describe('formatPackagePrice', () => {
  // T-P6
  test('returns priceString when package exists', () => {
    const pkg = makePkg('monthly', '$4.99');
    expect(formatPackagePrice(pkg)).toBe('$4.99');
  });

  // T-P7
  test('returns empty string when package is undefined', () => {
    expect(formatPackagePrice(undefined)).toBe('');
  });
});


describe('getFreeTrial', () => {
  test.each([
    undefined,
    INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_UNKNOWN,
    INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE,
    INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS,
  ])('does not promise a free trial without confirmed eligibility (%s)', (status) => {
    const pkg = makePkg('annual', '$19.99', 19.99, { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 });
    expect(getFreeTrial(pkg, status)).toBeNull();
  });

  test('returns unit and count when yearly intro offer is free', () => {
    const pkg = makePkg('annual', '¥3,000', 3000, { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 });
    expect(getFreeTrial(pkg, INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)).toEqual({ unit: 'DAY', count: 3 });
  });

  test('keeps the store unit (week stays week, never converted to days)', () => {
    const pkg = makePkg('annual', '$19.99', 19.99, { price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1 });
    expect(getFreeTrial(pkg, INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)).toEqual({ unit: 'WEEK', count: 1 });
  });

  test('returns null when there is no intro offer', () => {
    expect(getFreeTrial(makePkg('annual'), INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)).toBeNull();
    expect(getFreeTrial(undefined, INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)).toBeNull();
  });

  test('returns null for a paid intro offer', () => {
    const pkg = makePkg('annual', '$19.99', 19.99, { price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 });
    expect(getFreeTrial(pkg, INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)).toBeNull();
  });
});

describe('perMonthPriceString', () => {
  test('uses the store-formatted per-month price when available', () => {
    expect(perMonthPriceString(makePkg('annual', '¥3,000', 3000, null, 'JPY', '¥250'))).toBe('¥250');
  });

  test('falls back to yearly price / 12 in the product currency', () => {
    expect(perMonthPriceString(makePkg('annual', '¥3,000', 3000, null, 'JPY'), 'en-US')).toBe('¥250');
    expect(perMonthPriceString(makePkg('annual', '$19.99', 19.99, null, 'USD'), 'en-US')).toBe('$1.67');
  });

  test('returns empty string without a package', () => {
    expect(perMonthPriceString(undefined)).toBe('');
  });
});

describe('savingsPercent', () => {
  test('computes yearly savings versus 12x monthly from store prices', () => {
    expect(savingsPercent(makePkg('monthly', '¥800', 800), makePkg('annual', '¥3,000', 3000))).toBe(69);
    expect(savingsPercent(makePkg('monthly', '$4.99', 4.99), makePkg('annual', '$19.99', 19.99))).toBe(67);
  });

  test('returns null when a package is missing or yearly is not cheaper', () => {
    expect(savingsPercent(undefined, makePkg('annual'))).toBeNull();
    expect(savingsPercent(makePkg('monthly', '$1', 1), makePkg('annual', '$12', 12))).toBeNull();
  });
});

describe('paywall triggers', () => {
  test('11th verse (index 10) is locked for free users with a 10-verse limit', () => {
    expect(isVerseLocked(9, 10, false)).toBe(false);
    expect(isVerseLocked(10, 10, false)).toBe(true);
    expect(isVerseLocked(10, 10, true)).toBe(false);
  });

  test('notification frequency above the free 3/day is locked for free users', () => {
    expect(isFrequencyLocked(3, false)).toBe(false);
    expect(isFrequencyLocked(5, false)).toBe(true);
    expect(isFrequencyLocked(10, true)).toBe(false);
  });

  test('open streak counts consecutive local days', () => {
    expect(nextOpenStreak(undefined, undefined, '2026-10-24')).toEqual({ lastOpenDate: '2026-10-24', openStreak: 1 });
    expect(nextOpenStreak('2026-10-23', 2, '2026-10-24')).toEqual({ lastOpenDate: '2026-10-24', openStreak: 3 });
    expect(nextOpenStreak('2026-10-21', 2, '2026-10-24')).toEqual({ lastOpenDate: '2026-10-24', openStreak: 1 });
    expect(nextOpenStreak('2026-10-31', 4, '2026-11-01')).toEqual({ lastOpenDate: '2026-11-01', openStreak: 5 });
  });

  test('same-day reopen does not change the streak', () => {
    expect(nextOpenStreak('2026-10-24', 2, '2026-10-24')).toBeNull();
  });

  test('streak paywall shows once on the 3rd consecutive day for free users', () => {
    expect(shouldShowStreakPaywall(2, false, false)).toBe(false);
    expect(shouldShowStreakPaywall(3, false, false)).toBe(true);
    expect(shouldShowStreakPaywall(3, true, false)).toBe(false);
    expect(shouldShowStreakPaywall(3, false, true)).toBe(false);
    expect(shouldShowStreakPaywall(undefined, undefined, false)).toBe(false);
  });
});

describe('trackPaywallEvent', () => {
  test('records the event and its source as RevenueCat attributes', () => {
    trackPaywallEvent('paywall_shown', 'verse_limit');
    expect(Purchases.setAttributes).toHaveBeenCalledWith({
      paywall_shown_at: expect.any(String),
      paywall_shown_source: 'verse_limit',
    });
  });
});

describe('trial wording (ja / en)', () => {
  const make = (locale: string) => {
    const i18n = new I18n({ en, ja });
    i18n.locale = locale;
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    return i18n;
  };

  test('ja', () => {
    const i18n = make('ja');
    expect(i18n.t('paywall.trial.badge.DAY', { count: 3 })).toBe('3日間無料');
    expect(i18n.t('paywall.trial.cta.DAY', { count: 3 })).toBe('3日間無料で始める');
    expect(i18n.t('paywall.trial.after.DAY', { count: 3, price: '¥3,000' })).toBe('3日後に¥3,000/年。いつでもキャンセルできます');
    expect(i18n.t('paywall.cta')).toBe('今すぐ始める');
    expect(i18n.t('paywall.plan.savings', { percent: 69 })).toBe('月額より69%お得');
  });

  test('en', () => {
    const i18n = make('en');
    expect(i18n.t('paywall.trial.badge.DAY', { count: 3 })).toBe('3-day free trial');
    expect(i18n.t('paywall.trial.cta.DAY', { count: 3 })).toBe('Start 3-day free trial');
    expect(i18n.t('paywall.trial.after.DAY', { count: 3, price: '$19.99' })).toBe('3-day free trial, then $19.99/year. Cancel anytime.');
    expect(i18n.t('paywall.cta')).toBe('Start now');
  });
});
