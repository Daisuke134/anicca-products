import test from 'node:test';
import assert from 'node:assert/strict';
import { lifeManagerCtaHref } from '../lib/writer-cta-url.js';

const LIFE_MANAGER_WEB_APP_URL = 'https://life-call-production.up.railway.app/lm?start_calendar=1';

test('normal /lm CTA opens the Life Manager web app in the same browser', () => {
  assert.equal(lifeManagerCtaHref(''), LIFE_MANAGER_WEB_APP_URL);
});

test('normal /lm CTA carries a single bounded first-touch UTM set', () => {
  assert.equal(
    lifeManagerCtaHref('?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time'),
    `${LIFE_MANAGER_WEB_APP_URL}&utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time`,
  );
});

test('invalid or duplicated UTM values are dropped without blocking the web start', () => {
  assert.equal(
    lifeManagerCtaHref('?utm_source=instagram&utm_source=spam&utm_campaign=fall'),
    `${LIFE_MANAGER_WEB_APP_URL}&utm_campaign=fall`,
  );
});

test('valid Writer CTA identity still routes through its click receipt', () => {
  assert.match(
    lifeManagerCtaHref('?product_id=anicca&run_id=20260919-025451&artifact_id=article-ja&variant_id=hook&click_id=click-1'),
    /^\/\.netlify\/functions\/writer-cta\?/,
  );
});
