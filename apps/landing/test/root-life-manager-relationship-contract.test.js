import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('root presents Anicca as the mission and Life Manager as the product', () => {
  const hero = read('components/site/Hero.tsx');
  assert.match(hero, /Anicca builds Life Manager/);
  assert.match(hero, /AniccaはLife Managerをつくる/);
  assert.match(hero, /href="\/lm"/);
  assert.match(hero, /github\.com\/Daisuke134\/life-manager/);
  assert.match(hero, /Body|身体/);
  assert.match(hero, /Mind|心/);
  assert.match(hero, /Money|お金/);
});

test('root metadata and rendered sections do not revive the retired self-funding product story', () => {
  for (const path of ['app/en/page.tsx', 'app/ja/page.tsx']) {
    const page = read(path);
    assert.match(page, /Life Manager/);
    assert.match(page, /export const metadata/);
    assert.match(page, /proactive general agent/);
    assert.doesNotMatch(page, /<TheBet|<HowDiagram|<SelfFundingTriad|<InstallSplit|<BasicIncomeNote/);
    assert.doesNotMatch(page, /faqLd|softwareApplicationLd/);
  }
});

test('the public Life Manager page exposes the canonical startup-context identity', () => {
  const page = read('app/lm/page.tsx');
  assert.match(page, /life-manager-context-version/);
  assert.match(page, /2026-09-01\.1/);
  assert.match(page, /life-manager-context-digest/);
  assert.match(page, /f61cbb3cd2878abfb67756de2b23e816070aa3d991c71f748b2dfe1dbd3180d6/);
});
