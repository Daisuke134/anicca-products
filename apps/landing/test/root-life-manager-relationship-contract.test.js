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
    if (locale === 'en') assert.match(page, /Life Manager for your time/);
    else assert.match(page, /時間を整えるLife Manager/);
    assert.doesNotMatch(page, /proactive general agent|SelfImproveLoop|DemoVideo/);
  }
});

test('the public Life Manager page exposes the canonical startup-context identity', () => {
  const page = read('app/lm/page.tsx');
  assert.match(page, /life-manager-context-version/);
  assert.match(page, /2026-10-20\.1/);
  assert.match(page, /life-manager-context-digest/);
  assert.match(page, /45f79b184d1048bc643a0db1cf6f1d928f8a426077ac0e489fcaf5bcaa1435ea/);
  assert.match(page, /identity-only Google sign-in/);
  assert.match(page, /Capafy/);
  assert.doesNotMatch(page, /Google Calendar|7-day free trial|\$29\/month/);
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
