import { test } from 'node:test';
import assert from 'node:assert/strict';
import { businessOf, BUSINESSES } from './blog-business.mjs';

test('posts are grouped by the business that published them', () => {
  assert.equal(businessOf('line-sticker-set-039-2026-10-15-17', 'capafy-distribute'), 'line-stickers');
  assert.equal(businessOf('ebook-ja-2026-10-17-05', 'capafy-distribute'), 'ebook');
  assert.equal(businessOf('elevenlabs-voice-cloning-for-creators', 'AFFILIATE DECISION GUIDE'), 'ai-voice-tools');
  assert.equal(businessOf('anicca-ios-2026-05-19-en', 'anicca-ios'), 'anicca');
  assert.equal(businessOf('hooks-for-fitness-videos', 'capafy-distribute'), 'ai-creator-tools');
  assert.equal(businessOf('capafy-hook-lab-2026-10-17-h11m00', 'capafy-distribute'), 'ai-creator-tools');
  assert.equal(businessOf('remote-coding-2026-08-10-ja', 'REMOTE CODING'), 'notes');
});

test('every business has a hub label and intro', () => {
  for (const key of ['ai-creator-tools', 'line-stickers', 'ebook', 'ai-voice-tools', 'anicca', 'notes']) {
    assert.ok(BUSINESSES[key].label && BUSINESSES[key].intro);
  }
});
