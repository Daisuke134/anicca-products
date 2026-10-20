import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the main website presents Manager in both languages', () => {
  const home = read('components/site/ManagerHome.tsx');
  assert.match(home, /<h1>Manager\.<\/h1>/);
  assert.match(home, /<h1>マネージャー。<\/h1>/);
  assert.match(home, /all living beings/);
  assert.match(home, /宇宙規模の構想/);
  assert.doesNotMatch(home, /Life Manager|preview-label|Not deployed/);
});

test('localized homepages use Manager metadata and preserve canonical language links', () => {
  for (const locale of ['en', 'ja']) {
    const page = read(`app/${locale}/page.tsx`);
    assert.match(page, /ManagerHome/);
    assert.match(page, /export const metadata/);
    assert.match(page, new RegExp(`https://aniccaai.com/${locale}`));
    assert.doesNotMatch(page, /Life Manager|proactive general agent|SelfImproveLoop|DemoVideo/);
  }
});

test('the public Life Manager page exposes the canonical startup-context identity', () => {
  const page = read('app/lm/page.tsx');
  assert.match(page, /life-manager-context-version/);
  assert.match(page, /2026-10-08\.1/);
  assert.match(page, /life-manager-context-digest/);
  assert.match(page, /5b8e34cf01a7cf7589fc6049c080b3eb8458ec28b98103abc2ade395e8d0f90c/);
});

test('the legacy Telegram-first Life Manager URL redirects in both deployed Netlify configs', () => {
  const configs = [
    ['repo root', readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8')],
    ['landing deploy cwd', read('netlify.toml')],
  ];
  for (const [name, redirects] of configs) {
    assert.match(redirects, /from = "\/life-manager"[\s\S]*?to = "\/lm"[\s\S]*?status = 301[\s\S]*?force = true/, name);
  }
});
