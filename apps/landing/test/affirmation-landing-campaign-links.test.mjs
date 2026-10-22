import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

// Source-contract checks: no browser, install, or App Store analytics claims.
const source = readFileSync(
  process.env.AFFIRMATION_LANDING_SOURCE ||
    new URL('../components/affirmation/AffirmationLanding.tsx', import.meta.url),
  'utf8',
);

function storeUrl(region) {
  const declaration = new RegExp(`const APP_STORE_URL_${region} =\\s*('[^']+');`).exec(source);
  assert.ok(declaration, `${region} must have one literal App Store destination`);
  return new URL(runInNewContext(declaration[1]));
}

for (const { region, locale, path } of [
  { region: 'US', locale: 'en', path: '/us/app/daily-affirmations-anicca/id6755129214' },
  { region: 'JP', locale: 'ja', path: '/jp/app/id6755129214' },
]) {
  test(`${locale} landing download URL preserves its storefront and adds its own campaign`, () => {
    const url = storeUrl(region);
    assert.equal(url.origin, 'https://apps.apple.com');
    assert.equal(url.pathname, path);
    assert.equal(url.hash, '');
    assert.deepEqual([...url.searchParams.entries()].sort(), [
      ['ct', `affirmation_landing_${locale}`],
      ['mt', '8'],
      ['pt', '93486075'],
    ]);
  });
}

test('landing locales use distinct campaign names within Apple\'s 30-character limit', () => {
  const campaigns = ['US', 'JP'].map((region) => storeUrl(region).searchParams.get('ct'));
  assert.notEqual(campaigns[0], campaigns[1]);
  for (const campaign of campaigns) {
    assert.match(campaign, /^affirmation_landing_(en|ja)$/);
    assert.ok(campaign.length <= 30);
    assert.notEqual(campaign, 'anicca-ios_ig_anicca-en_en');
  }
});

test('the real locale selector preserves EN → JA → EN destinations', () => {
  const expression = /const appStoreUrl = ([^;]+);/.exec(source)?.[1];
  assert.ok(expression, 'the shared locale selector must remain present');
  const US = storeUrl('US').href;
  const JP = storeUrl('JP').href;
  const selected = ['en', 'ja', 'en'].map((locale) => runInNewContext(expression, {
    locale,
    APP_STORE_URL_US: US,
    APP_STORE_URL_JP: JP,
  }));
  assert.deepEqual(selected, [US, JP, US]);
});

for (const [label, start, end] of [
  ['hero', '{/* HERO */}', '{/* STORY */}'],
  ['pricing', '{/* PRICING */}', '{/* FAQ */}'],
  ['closing', '{/* CLOSING */}', null],
]) {
  test(`${label} download CTA uses the shared localized URL directly`, () => {
    const startIndex = source.indexOf(start);
    const endIndex = end === null ? source.length : source.indexOf(end, startIndex);
    assert.ok(startIndex >= 0 && endIndex > startIndex, `${label} section must be found`);
    const section = source.slice(startIndex, endIndex);
    const anchors = [...section.matchAll(/<a\b[^>]*\bhref=\{([^}]+)\}[^>]*>/g)];
    assert.equal(anchors.length, 1, `${label} must have one direct download CTA`);
    assert.equal(anchors[0][1], 'appStoreUrl');
    assert.match(anchors[0][0], /target="_blank"/);
    assert.match(anchors[0][0], /rel="noopener noreferrer"/);
  });
}
