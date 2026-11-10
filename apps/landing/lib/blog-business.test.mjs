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
  for (const key of ['ai-creator-tools', 'line-stickers', 'ebook', 'ebook-publishing', 'ai-monk-avatars', 'ai-voice-tools', 'anicca', 'notes']) {
    assert.ok(BUSINESSES[key].label && BUSINESSES[key].intro);
  }
});

test('AI monk avatar guide slugs belong to the dedicated research hub', () => {
  for (const slug of ['ebook-publishing-ai-monk-economy-2026', 'ai-monk-avatar-field-guide-ja-2026']) {
    const business = businessOf(slug, 'AI Monk Avatars');
    assert.equal(business, 'ai-monk-avatars');
    assert.equal(BUSINESSES[business].label, 'AI Monk Avatars');
    assert.ok(BUSINESSES[business].intro);
  }
});

test('published Thankful guide belongs to its product and excludes unrelated build notes', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const root = new URL('../data/research/', import.meta.url);
  const post = JSON.parse(readFileSync(new URL('gratitude-journal-repeating-yourself.json', root), 'utf8'));
  assert.equal(businessOf(post.slug, post.project), 'thankful');
  assert.equal(BUSINESSES.thankful.label, 'Thankful');
  const related = readdirSync(root).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL(f, root), 'utf8')))
    .filter(p => p.slug !== post.slug && businessOf(p.slug, p.project) === businessOf(post.slug, post.project));
  assert.ok(related.every(p => String(p.project).toLowerCase() === 'thankful'));
  assert.equal(post.date, '2026-10-21');
  assert.match(post.markdown, /https:\/\/apps.apple.com\/us\/app\/thankful-gratitude-journal\/id6759514159/);
  assert.equal(post.attribution.text, 'An Anicca practical guide. Examples are illustrative.');
});

test('every app in the product line has its own blog hub (2026-11-07 overhaul)', () => {
  assert.equal(businessOf('honne-what-does-this-text-mean', 'Honne'), 'honne');
  assert.equal(businessOf('daily-dhamma-one-verse-a-day', 'Daily Dhamma'), 'daily-dhamma');
  assert.equal(businessOf('sleep-reset-score-explained', 'Sleep Reset'), 'sleep-reset');
  assert.equal(businessOf('studio-cherie-closet-photo-guide', 'STUDIO CHERIE'), 'studio-cherie');
  for (const key of ['honne', 'daily-dhamma', 'sleep-reset', 'studio-cherie']) {
    assert.ok(BUSINESSES[key].label && BUSINESSES[key].intro, key);
    assert.ok(BUSINESSES[key].product && BUSINESSES[key].product.href, key);
  }
});
