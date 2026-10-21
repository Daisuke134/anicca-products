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

// Integration guards: resolving this PR's additive conflicts must retain the
// metadata, structured data, business hubs and related-post features on main.
// These inspect source wiring, not React DOM execution or a Next.js build.
test('per-article attribution preserves LINE share metadata and canonical SEO wiring', () => {
  assert.match(page, /import \{ buildLineStickerShareMetadata \} from "\.\.\/\.\.\/\.\.\/lib\/line-sticker-share-meta";/);
  assert.match(page, /\.\.\.buildLineStickerShareMetadata\(\{\s*slug: post\.slug,\s*title: post\.title,\s*description,\s*markdown: post\.markdown,/);
  assert.match(page, /alternates: \{ canonical: `https:\/\/aniccaai\.com\/blog\/\$\{post\.slug\}` \}/);
  assert.match(page, /robots: \{ index: true, follow: true \}/);
});

test('per-article attribution preserves Article and BreadcrumbList JSON-LD wiring', () => {
  assert.match(page, /import \{ buildArticleJsonLd \} from "\.\.\/\.\.\/\.\.\/lib\/article-jsonld\.mjs";/);
  assert.match(page, /JSON\.stringify\(\[\.\.\.buildArticleJsonLd\(post\), \{/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /position: 3, name: hub\.label, item: `https:\/\/aniccaai\.com\/blog\/c\/\$\{business\}`/);
  assert.match(page, /position: 4, name: post\.title, item: `https:\/\/aniccaai\.com\/blog\/\$\{post\.slug\}`/);
  assert.ok(page.includes(String.raw`]).replace(/</g, "\\u003c")`));
});

test('per-article attribution preserves business classification and breadcrumb links', () => {
  assert.match(page, /import \{ BUSINESSES, businessOf \} from "\.\.\/\.\.\/\.\.\/lib\/blog-business\.mjs";/);
  assert.match(page, /const business = businessOf\(post\.slug, post\.project\);/);
  assert.match(page, /const hub = BUSINESSES\[business\];/);
  assert.match(page, /<Link href=\{`\/blog\/c\/\$\{business\}`\}[^>]*>\{hub\.label\}<\/Link>/);
});

test('per-article attribution preserves same-business related posts and excludes self', () => {
  assert.match(page, /import \{ loadAllBlogPosts \} from "\.\.\/\.\.\/\.\.\/lib\/blog-posts";/);
  assert.match(page, /const related = loadAllBlogPosts\(\)\s*\.filter\(\(p\) => p\.slug !== post\.slug && businessOf\(p\.slug, p\.project\) === business\)\s*\.slice\(0, 6\);/);
  assert.match(page, /\{related\.length > 0 && \(/);
  assert.match(page, /\{related\.map\(\(p\) => \(/);
  assert.match(page, /<Link href=\{`\/blog\/\$\{p\.slug\}`\}[^>]*>\{p\.title\}<\/Link>/);
});

test('private Writer validation, manifest and unlock gates remain unchanged', () => {
  assert.match(page, /const \{ validateWriterArticle, publicPreview, publicManifestJson \} = require\(/);
  assert.match(page, /const privatePost = loadPrivatePost\(slug\);\s*if \(privatePost\) return privatePost;/);
  assert.match(page, /writer_manifest: publicManifestJson\(privateValue\)/);
  assert.match(page, /id="writer-public-contract"/);
  assert.match(page, /post\.access_model && post\.paid_sha256 && post\.run_id && post\.artifact_id && post\.lang && \(/);
  assert.match(page, /<WriterUnlock/);
});

test('existing business classifier does not relabel Thankful or Honne as the Anicca app', async () => {
  const { businessOf } = await import('../../../../lib/blog-business.mjs');
  assert.equal(businessOf('gratitude-journal-repeating-yourself', 'Thankful'), 'thankful');
  assert.equal(businessOf('how-to-reply-to-fine-in-a-text', 'Honne'), 'notes');
  assert.equal(businessOf('anicca-reminders-versus-journaling', 'Anicca'), 'anicca');
});

test('existing structured data retains public FAQ and never emits paid body text', async () => {
  const { buildArticleJsonLd } = await import('../../../../lib/article-jsonld.mjs');
  const post = {
    slug: 'fixture', title: 'A fixture', date: '2026-10-20',
    markdown: '## First question?\nFirst answer.\n## Second question?\nSecond answer.',
    attribution: { text: 'Written with assistance from dot.' },
  };
  const publicData = buildArticleJsonLd(post);
  assert.deepEqual(publicData.map((item) => item['@type']), ['Article', 'FAQPage']);
  assert.equal(publicData[0].url, 'https://aniccaai.com/blog/fixture');
  assert.equal(publicData[1].mainEntity.length, 2);
  const paidData = buildArticleJsonLd({ ...post, access_model: 'one_time', markdown: 'PRIVATE_BODY_SENTINEL' });
  assert.deepEqual(paidData.map((item) => item['@type']), ['Article']);
  assert.ok(!JSON.stringify(paidData).includes('PRIVATE_BODY_SENTINEL'));
});

test('custom attribution and the existing Markdown renderer retain a direct product CTA', async () => {
  const { resolveArticleAttribution } = await attributionModule;
  const { renderMarkdown } = await import('../../../../lib/render-article-markdown.js');
  const attribution = resolveArticleAttribution({ text: 'AI-assisted article.' });
  assert.equal(attribution.xHandle, null);
  const html = renderMarkdown('[Thankful](https://apps.apple.com/us/app/thankful-gratitude-journal/id6759514159)');
  assert.match(html, /<a href="https:\/\/apps\.apple\.com\/us\/app\/thankful-gratitude-journal\/id6759514159"/);
});
