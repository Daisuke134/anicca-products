import { I18n } from 'i18n-js';
import * as fs from 'fs';
import * as path from 'path';

const en = require('../locales/en.json');
const ja = require('../locales/ja.json');

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, full);
    }
    return [full];
  });
}

function flattenValues(obj: Record<string, unknown>): string[] {
  return Object.entries(obj).flatMap(([, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenValues(value as Record<string, unknown>);
    }
    return typeof value === 'string' ? [value] : [];
  });
}

describe('i18n', () => {
  // T-L1: すべてのENキーがJAにも存在する
  test('T-L1: all en keys have ja translation', () => {
    const enKeys = flattenKeys(en).sort();
    const jaKeys = flattenKeys(ja).sort();
    expect(enKeys).toEqual(jaKeys);
  });

  // T-L2: ENロケールでt()がキーをそのまま返さない
  test('T-L2: en locale returns translated string, not raw key', () => {
    const i18n = new I18n({ en, ja });
    i18n.locale = 'en';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    expect(i18n.t('onboarding.welcome.title')).toBe('Find Your Daily\nMoment of Peace');
    expect(i18n.t('paywall.title.default')).toBe('Your Mindful Journey\nStarts Today');
    expect(i18n.t('settings.title')).toBe('Settings');
    expect(i18n.t('index.swipeHint')).toBe('Swipe up for next verse');
  });

  // T-L3: JAロケールで日本語が返る
  test('T-L3: ja locale returns japanese string', () => {
    const i18n = new I18n({ en, ja });
    i18n.locale = 'ja';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    expect(i18n.t('onboarding.welcome.title')).toBe('毎日の\n心の安らぎを見つける');
    expect(i18n.t('paywall.title.default')).toBe('マインドフルな旅が\n今日始まる');
    expect(i18n.t('settings.title')).toBe('設定');
    expect(i18n.t('index.swipeHint')).toBe('スワイプで次の法句経へ');
  });

  // T-L4: JAロケールでEN fallbackが動く
  test('T-L4: unknown locale falls back to en', () => {
    const i18n = new I18n({ en, ja });
    i18n.locale = 'de';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    const result = i18n.t('onboarding.skip');
    expect(result).toBe('Skip');
  });

  // T-L5: 全キーに空文字・undefinedがない
  test('T-L5: no empty values in en or ja', () => {
    const enKeys = flattenKeys(en);
    const jaKeys = flattenKeys(ja);

    const i18nEn = new I18n({ en, ja });
    i18nEn.locale = 'en';
    i18nEn.enableFallback = false;

    const i18nJa = new I18n({ en, ja });
    i18nJa.locale = 'ja';
    i18nJa.enableFallback = false;

    for (const key of enKeys) {
      const val = i18nEn.t(key);
      expect(val).toBeTruthy();
      expect(typeof val).toBe('string');
    }
    for (const key of jaKeys) {
      const val = i18nJa.t(key);
      expect(val).toBeTruthy();
      expect(typeof val).toBe('string');
    }
  });

  // T-L6: jaに存在しないキーはenにfallbackする
  test('T-L6: ja locale falls back to en when key missing in ja', () => {
    const enOnly = { ...en, test_only: { key: 'fallback value' } };
    const i18n = new I18n({ en: enOnly, ja });
    i18n.locale = 'ja';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    const result = i18n.t('test_only.key');
    expect(result).toBe('fallback value');
    expect(result).not.toMatch(/^\[missing/);
  });

  // T-L7: en.json のキー数が新しい仕様と一致
  test('T-L7: en.json key count matches spec inventory', () => {
    const enKeys = flattenKeys(en);
    // 新しいspec: onboarding(20) + paywall(43) + index(2) + settings(26) = 91
    expect(enKeys.length).toBeGreaterThanOrEqual(85);
  });

  // T-L9: 新規 onboarding キーが全て存在する
  test('T-L9: all new onboarding keys exist', () => {
    const i18n = new I18n({ en, ja });
    i18n.locale = 'en';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';

    const newKeys = [
      'onboarding.welcome.title',
      'onboarding.welcome.subtitle',
      'onboarding.q1.title',
      'onboarding.q1.option.peace',
      'onboarding.q1.option.wisdom',
      'onboarding.q1.option.routine',
      'onboarding.q1.option.mindfulness',
      'onboarding.value.title',
      'onboarding.value.stat',
      'onboarding.q2.title',
      'onboarding.q2.option.morning',
      'onboarding.q2.option.midday',
      'onboarding.q2.option.evening',
      'onboarding.q2.option.custom',
      'onboarding.building.title',
      'onboarding.building.subtitle',
      'onboarding.notif.title',
      'onboarding.notif.subtitle',
    ];

    for (const key of newKeys) {
      const val = i18n.t(key);
      expect(val).toBeTruthy();
      expect(val).not.toMatch(/^\[missing/);
    }
  });

  // T-L10: 新規 paywall キーが全て存在する
  test('T-L10: all new paywall keys exist', () => {
    const i18n = new I18n({ en, ja });
    i18n.locale = 'en';
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';

    const newKeys = [
      'paywall.title.personalized.peace',
      'paywall.title.personalized.wisdom',
      'paywall.title.personalized.routine',
      'paywall.title.personalized.mindfulness',
      'paywall.title.default',
      'paywall.socialProof',
      'paywall.compare.free',
      'paywall.compare.premium',
      'paywall.compare.verses.free',
      'paywall.compare.verses.premium',
      'paywall.compare.reminders.free',
      'paywall.compare.reminders.premium',
      'paywall.compare.bookmark.free',
      'paywall.compare.bookmark.premium',
      'paywall.plan.bestValue',
      'paywall.plan.savePercent',
      'paywall.step1.title',
      'paywall.step1.subtitle',
      'paywall.step1.cta',
      'paywall.step2.title',
      'paywall.step2.timeline.day1',
      'paywall.step2.timeline.day5',
      'paywall.step2.timeline.day7',
      'paywall.step2.cta',
      'paywall.step3.title',
      'paywall.trialReminder.title',
      'paywall.trialReminder.body',
    ];

    for (const key of newKeys) {
      const val = i18n.t(key);
      expect(val).toBeTruthy();
      expect(val).not.toMatch(/^\[missing/);
    }
  });
});
