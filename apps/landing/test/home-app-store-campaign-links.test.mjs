import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { withIncomingCampaign, withLocaleCampaignQuery } from '../lib/affirmation-campaign.mjs';

// Source-contract checks for the homepage CTA. No browser, install, or App Store
// analytics claim is made here: the contract is the destination URL and the
// incoming ?ct= pass-through, not measured campaign performance.
const ROOT = new URL('../', import.meta.url);
const homeLinks = readFileSync(
  process.env.HOME_CAMPAIGN_LINKS_SOURCE ||
    new URL('components/site/HomeCampaignLinks.tsx', ROOT),
  'utf8',
);
const managerHome = readFileSync(
  process.env.MANAGER_HOME_SOURCE || new URL('components/site/ManagerHome.tsx', ROOT),
  'utf8',
);

function storeUrl(region) {
  const declaration = new RegExp(
    `const APP_STORE_URL_${region} =\\s*((["'])[^"']+\\2);`,
  ).exec(homeLinks);
  assert.ok(declaration, `${region} must have one literal App Store destination`);
  return new URL(runInNewContext(declaration[1]));
}

for (const { region, locale, ct } of [
  { region: 'EN', locale: 'en', ct: 'home_en' },
  { region: 'JA', locale: 'ja', ct: 'home_ja' },
]) {
  test(`${locale} homepage App Store URL keeps its provider token and own campaign`, () => {
    const url = storeUrl(region);
    assert.equal(url.origin, 'https://apps.apple.com');
    assert.equal(url.pathname, '/app/id6755129214');
    assert.equal(url.hash, '');
    assert.deepEqual([...url.searchParams.entries()].sort(), [
      ['ct', ct],
      ['mt', '8'],
      ['pt', '93486075'],
    ]);
  });
}

test('homepage locales use distinct campaign names within Apple\'s 30-character limit', () => {
  const campaigns = ['EN', 'JA'].map((region) => storeUrl(region).searchParams.get('ct'));
  assert.notEqual(campaigns[0], campaigns[1]);
  for (const campaign of campaigns) {
    assert.match(campaign, /^home_(en|ja)$/);
    assert.ok(campaign.length <= 30);
  }
});

test('homepage App Store link reads the incoming ct client-side', () => {
  // The deployed chunk must contain this exact query read and an App Store host;
  // team/scripts/ct_probe.py treats that pair as the client-side rewrite.
  assert.match(
    homeLinks,
    /new URLSearchParams\(window\.location\.search\)\.get\((?:"|')ct(?:"|')\)/,
  );
  assert.match(homeLinks, /apps\.apple\.com/);
  assert.match(
    homeLinks,
    /withIncomingCampaign\(\s*baseUrl\s*,\s*incomingCt\s*\)/,
    'the CTA must apply the incoming ct through withIncomingCampaign',
  );
  assert.match(homeLinks, /withLocaleCampaignQuery\(\s*to\s*,\s*incomingCt\s*\)/);
});

test('ManagerHome delegates both App Store CTAs to the client component', () => {
  const hardcoded = managerHome.match(/href="https:\/\/apps\.apple\.com[^"]*"/g) || [];
  assert.deepEqual(hardcoded, [], 'no App Store href may bypass the ct pass-through');
  const ctas = [...managerHome.matchAll(/<HomeAppStoreCta\b[^>]*locale="(en|ja)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(ctas.sort(), ['en', 'ja']);
});

test('ManagerHome locale switch keeps incoming ct on /en and /ja', () => {
  const targets = [...managerHome.matchAll(/<HomeLocaleLink\b[^>]*to="(\/en|\/ja)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(targets.sort(), ['/en', '/ja']);
  const bareLocaleLinks = managerHome.match(/href="\/(en|ja)"/g) || [];
  assert.deepEqual(bareLocaleLinks, [], 'locale links must not drop the query string');
});

test('incoming ct overrides the homepage campaign while preserving pt and mt', () => {
  const EN = storeUrl('EN').href;
  const JA = storeUrl('JA').href;

  assert.equal(withIncomingCampaign(EN, null), EN);
  assert.equal(withIncomingCampaign(JA, ''), JA);
  assert.equal(withIncomingCampaign(JA, '   '), JA);

  for (const ct of [
    'probe-0745',
    'ig_en',
    'youtube_aniccaffirmations_bio',
    'a b',
    'stall-probe-20261114',
  ]) {
    for (const base of [EN, JA]) {
      const updated = new URL(withIncomingCampaign(base, ct));
      assert.equal(updated.searchParams.get('ct'), ct);
      assert.equal(updated.searchParams.get('pt'), '93486075');
      assert.equal(updated.searchParams.get('mt'), '8');
    }
  }
});

test('EN ↔ JA homepage switch preserves the incoming ct', () => {
  assert.equal(withLocaleCampaignQuery('/ja', null), '/ja');
  assert.equal(withLocaleCampaignQuery('/ja', 'ig_en'), '/ja?ct=ig_en');
  assert.equal(withLocaleCampaignQuery('/en', 'a b'), '/en?ct=a+b');
});
