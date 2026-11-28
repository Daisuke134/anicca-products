import test from 'node:test';
import assert from 'node:assert/strict';
import { lifeManagerCtaHref, ANICCA_HOME_URL } from '../lib/writer-cta-url.js';

test('normal /lm CTA opens the live Anicca site, not the retired Life Manager web app', () => {
  assert.equal(ANICCA_HOME_URL, 'https://aniccaai.com/');
  assert.equal(lifeManagerCtaHref(''), ANICCA_HOME_URL);
  assert.doesNotMatch(lifeManagerCtaHref(''), /railway\.app/);
});

test('normal /lm CTA carries a single bounded first-touch UTM set', () => {
  assert.equal(
    lifeManagerCtaHref('?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time'),
    `${ANICCA_HOME_URL}?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time`,
  );
});

test('invalid or duplicated UTM values are dropped without blocking the start', () => {
  assert.equal(
    lifeManagerCtaHref('?utm_source=instagram&utm_source=spam&utm_campaign=fall'),
    `${ANICCA_HOME_URL}?utm_campaign=fall`,
  );
});

test('valid Writer CTA identity still routes through its click receipt', () => {
  assert.match(
    lifeManagerCtaHref('?product_id=anicca&run_id=20260919-025451&artifact_id=article-ja&variant_id=hook&click_id=click-1'),
    /^\/\.netlify\/functions\/writer-cta\?/,
  );
});
