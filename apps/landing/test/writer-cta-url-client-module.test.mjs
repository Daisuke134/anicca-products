import test from 'node:test';
import assert from 'node:assert/strict';
import { TG_DEEPLINK, writerCtaHref } from '../lib/writer-cta-url.js';

test('writer CTA helper loads as a browser-compatible ES module', () => {
  assert.equal(writerCtaHref(''), TG_DEEPLINK);
});
