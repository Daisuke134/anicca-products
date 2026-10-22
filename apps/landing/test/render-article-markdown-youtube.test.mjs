import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../lib/render-article-markdown.js';

test('renders a YouTube Short as a lazy portrait lite-youtube card', () => {
  const html = renderMarkdown('[youtube-short:Er2Ig4GM7z0|Yang Mun & his story]');

  assert.match(html, /<lite-youtube class="youtube-short"/);
  assert.match(html, /videoid="Er2Ig4GM7z0"/);
  assert.match(html, /title="Yang Mun &amp; his story"/);
  assert.match(html, /https:\/\/i\.ytimg\.com\/vi\/Er2Ig4GM7z0\/hqdefault\.jpg/);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/shorts\/Er2Ig4GM7z0"/);
  assert.doesNotMatch(html, /<iframe\b/);
});

test('keeps the legacy YouTube marker as a landscape lite-youtube card', () => {
  const html = renderMarkdown('[youtube-embed:JlE7egVlMZs]');

  assert.match(html, /<lite-youtube class="youtube-embed"/);
  assert.match(html, /videoid="JlE7egVlMZs"/);
  assert.doesNotMatch(html, /youtube-short/);
  assert.doesNotMatch(html, /<iframe\b/);
});

test('does not turn a malformed Shorts marker into an embed', () => {
  const html = renderMarkdown('[youtube-short:too-short|No]');

  assert.doesNotMatch(html, /<lite-youtube\b/);
  assert.doesNotMatch(html, /<iframe\b/);
});
