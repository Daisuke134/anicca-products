import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the Instagram bio /app route uses the configured Apple campaign and provider tokens', () => {
  const page = read('app/app/page.tsx');
  const target = /redirect\(['"]([^'"]+)['"]\)/.exec(page)?.[1];
  assert.ok(target, 'the /app route must keep redirecting directly to the store');
  const url = new URL(target);
  assert.match(url.pathname, /\/id6755129214$/);
  assert.equal(url.searchParams.get('ct'), 'anicca-ios_ig_anicca-en_en');
  assert.equal(url.searchParams.get('pt'), '93486075');
  const deployConfigs = [
    readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8'),
    read('netlify.toml'),
  ];
  for (const config of deployConfigs) {
    const redirect = /from = "\/app"[\s\S]*?to = "([^"]+)"[\s\S]*?status = 302/.exec(config);
    assert.ok(redirect, 'both Netlify deploy configs must preserve the /app redirect');
    assert.equal(new URL(redirect[1]).searchParams.get('ct'), 'anicca-ios_ig_anicca-en_en');
    assert.equal(new URL(redirect[1]).searchParams.get('pt'), '93486075');
  }
});

test('root Netlify config changes trigger the landing PR contract test', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/landing-pr-build.yml', import.meta.url), 'utf8');
  const pullRequest = /^  pull_request:\n((?: {4}[^\n]*\n|\n)*)/m.exec(workflow)?.[1] ?? '';
  const paths = /^    paths:\n((?: {6}- [^\n]*\n)+)/m.exec(pullRequest)?.[1] ?? '';
  assert.match(paths, /^      - ['"]netlify\.toml['"]$/m);
  assert.match(workflow, /run: npm run test:anicca-app-store-routing/);
});

test('internal site App Store links do not reuse the Instagram profile redirect', () => {
  const links = read('lib/links.ts');
  const breathCalm = read('app/breath-calm/page.tsx');
  assert.doesNotMatch(links, /aniccaai\.com\/app/);
  assert.doesNotMatch(breathCalm, /aniccaai\.com\/app/);
  assert.match(links, /apps\.apple\.com\/us\/app\/daily-affirmations-anicca\/id6755129214/);
  assert.match(breathCalm, /apps\.apple\.com\/us\/app\/daily-affirmations-anicca\/id6755129214/);
});
