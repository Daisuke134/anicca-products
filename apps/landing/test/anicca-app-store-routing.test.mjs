import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the Instagram bio /app route includes the provider and campaign tokens Apple requires', () => {
  const page = read('app/app/page.tsx');
  const target = /redirect\(['"]([^'"]+)['"]\)/.exec(page)?.[1];
  assert.ok(target, 'the /app route must keep redirecting directly to the store');
  const url = new URL(target);
  assert.match(url.pathname, /\/id6755129214$/);
  assert.equal(url.searchParams.get('ct'), 'anicca-ios_ig_anicca-en_en');
  assert.equal(url.searchParams.get('pt'), '93486075');
  assert.equal(url.searchParams.get('mt'), '8');
  const deployConfigs = [
    readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8'),
    read('netlify.toml'),
  ];
  for (const config of deployConfigs) {
    const redirect = /from = "\/app"[\s\S]*?to = "([^"]+)"[\s\S]*?status = 302/.exec(config);
    assert.ok(redirect, 'both Netlify deploy configs must preserve the /app redirect');
    const store = new URL(redirect[1]);
    assert.match(store.pathname, /\/id6755129214$/);
    assert.equal(store.searchParams.get('ct'), 'anicca-ios_ig_anicca-en_en');
    assert.equal(store.searchParams.get('pt'), '93486075');
    assert.equal(store.searchParams.get('mt'), '8');
  }
});

test('internal site App Store links do not reuse the Instagram profile redirect', () => {
  const links = read('lib/links.ts');
  const breathCalm = read('app/breath-calm/page.tsx');
  assert.doesNotMatch(links, /aniccaai\.com\/app/);
  assert.doesNotMatch(breathCalm, /aniccaai\.com\/app/);
  assert.match(links, /apps\.apple\.com\/us\/app\/daily-affirmations-anicca\/id6755129214/);
  assert.match(breathCalm, /apps\.apple\.com\/us\/app\/daily-affirmations-anicca\/id6755129214/);
});

// /ja/affirmation-app (and /en/affirmation-app) 404'd: language-prefixed links put the
// locale before the route, but the pages live at /affirmation-app and /affirmation-app/ja.
test('language-prefixed affirmation links redirect to the canonical pages', () => {
  const deployConfigs = [
    ['repository root', readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8')],
    ['landing deploy root', read('netlify.toml')],
  ];
  const expected = [
    ['/ja/affirmation-app', '/affirmation-app/ja'],
    ['/en/affirmation-app', '/affirmation-app'],
  ];
  for (const [name, config] of deployConfigs) {
    for (const [from, to] of expected) {
      const rule = new RegExp(`from = "${from}"[\\s\\S]{0,200}?to = "([^"]+)"[\\s\\S]{0,80}?status = 308`);
      const match = rule.exec(config);
      assert.ok(match, `${name} netlify.toml must redirect ${from}`);
      assert.equal(match[1], to, `${name} netlify.toml must redirect ${from} to ${to}`);
      // The target carries no query of its own, so Netlify forwards the incoming
      // ?ct= / ?pt= / utm_* values and App Store attribution survives the hop.
      assert.ok(!match[1].includes('?'), `${from} target must let Netlify carry the query string`);
    }
  }
  // The page the /ja/affirmation-app hop lands on is the JA canonical.
  assert.match(
    read('app/affirmation-app/ja/page.tsx'),
    /canonical: 'https:\/\/aniccaai\.com\/affirmation-app\/ja'/,
  );
});
