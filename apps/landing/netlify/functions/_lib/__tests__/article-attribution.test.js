const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const page = readFileSync(
  path.resolve(__dirname, '../../../../app/blog/[slug]/page.tsx'),
  'utf8',
);

const attributionModule = import('../../../../lib/article-attribution.js');

test('absent metadata preserves legacy attribution and X handle', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  assert.deepEqual(resolveArticleAttribution(undefined), {
    text: null,
    xHandle: 'selawmqt',
  });
});

test('custom text without a handle never inherits the legacy account', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  assert.deepEqual(resolveArticleAttribution({ text: 'Written with assistance from dot.' }), {
    text: 'Written with assistance from dot.',
    xHandle: null,
  });
});

test('a custom handle is used only when explicitly supplied', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  assert.deepEqual(resolveArticleAttribution({ text: 'Field notes.', x_handle: 'Example_Name' }), {
    text: 'Field notes.',
    xHandle: 'Example_Name',
  });
});

test('malformed attribution fails closed instead of claiming the legacy author', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  for (const value of [null, false, 0, '', [], {}, { text: null }, { text: 42 }, { text: '' }, { text: '   ' }]) {
    assert.throws(() => resolveArticleAttribution(value), /Invalid article attribution/);
  }
});

test('handles cannot supply a URL, HTML, path or invalid account syntax', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  for (const x_handle of [null, 42, '', '@example', 'example/name', 'example-name', 'https://x.com/example', 'a'.repeat(16), 'x\" onclick=\"x', 'example\n', ' example']) {
    assert.throws(() => resolveArticleAttribution({ text: 'Field notes.', x_handle }), /Invalid article attribution/);
  }
});

test('custom text stays plain text for React escaping, without pre-escaping or HTML rendering', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  const text = 'dot & <script>alert("x")</script> <img src=x onerror=alert(1)>';
  assert.deepEqual(resolveArticleAttribution({ text }), { text, xHandle: null });
});

test('resolution does not mutate metadata or return unrelated metadata', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  const value = Object.freeze({ text: 'Field notes.', ignored: 'not attribution' });
  assert.deepEqual(resolveArticleAttribution(value), { text: 'Field notes.', xHandle: null });
  const legacy = resolveArticleAttribution(undefined);
  legacy.xHandle = 'changed';
  assert.equal(resolveArticleAttribution(undefined).xHandle, 'selawmqt');
});

test('the blog page uses optional per-article attribution', () => {
  assert.match(page, /attribution\?: ArticleAttribution;/);
  assert.match(page, /const attribution = resolveArticleAttribution\(post\.attribution\);/);
  assert.match(page, /attribution\.text === null \? \(/);
  assert.match(page, /\) : attribution\.text\}/);
});

test('the X card is conditional and its fixed-host URL uses the resolved handle', () => {
  assert.match(page, /\{attribution\.xHandle && \(/);
  assert.match(page, /href=\{`https:\/\/x\.com\/\$\{attribution\.xHandle\}`\}/);
  assert.match(page, /@\{attribution\.xHandle\} ↗/);
  assert.match(page, /attribution\.xHandle \? "sm:grid-cols-3" : "sm:grid-cols-2"/);
});

test('custom attribution is a React text child, never raw HTML or Markdown', () => {
  assert.match(page, /\) : attribution\.text\}/);
  assert.doesNotMatch(page, /__html:\s*(?:post\.)?attribution/);
  assert.doesNotMatch(page, /renderMarkdown\([^)]*attribution/);
});

test('legacy byline, SAO link, source-of-truth sentence and other subscriptions remain', () => {
  assert.match(page, /Written end-to-end by Anicca, an autonomous AI entity \(literature → hypothesis → draft → publish → cross-post\)\./);
  assert.match(page, /One of the\{' '\}/);
  assert.match(page, /<Link href="\/fellows" className="underline hover:text-ink">SAOs<\/Link>\./);
  assert.match(page, /Source of truth lives at this URL; all other channels mirror back here\./);
  assert.match(page, /href="https:\/\/aniccaai\.substack\.com"/);
  assert.match(page, /href="\/letter"/);
});
