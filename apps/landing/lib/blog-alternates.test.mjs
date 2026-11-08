import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { pairSuffixOf, blogPairLanguages, blogLangName } from './blog-alternates.mjs';
import { compiled } from '../test/helpers/render-module.mjs';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));

test('pairSuffixOf only matches -en / -ja slug suffixes', () => {
  assert.deepEqual(pairSuffixOf('manager-x-en'), { self: 'en', other: 'ja', base: 'manager-x' });
  assert.deepEqual(pairSuffixOf('manager-x-ja'), { self: 'ja', other: 'en', base: 'manager-x' });
  assert.equal(pairSuffixOf('como-escribir-un-gancho-viral'), null);
  assert.equal(pairSuffixOf('written-guide'), null);
  assert.equal(pairSuffixOf('ebook-2026'), null);
});

test('blogPairLanguages annotates only complete pairs, x-default at EN', () => {
  const published = new Set(['manager-x-en', 'manager-x-ja', 'solo-en']);
  const exists = (s) => published.has(s);
  assert.deepEqual(blogPairLanguages('manager-x-en', exists), {
    en: 'https://aniccaai.com/blog/manager-x-en',
    ja: 'https://aniccaai.com/blog/manager-x-ja',
    'x-default': 'https://aniccaai.com/blog/manager-x-en',
  });
  assert.deepEqual(blogPairLanguages('manager-x-ja', exists), blogPairLanguages('manager-x-en', exists));
  assert.equal(blogPairLanguages('solo-en', exists), undefined);
  assert.equal(blogPairLanguages('como-escribir-un-gancho-viral', exists), undefined);
});

test('blogLangName names the languages the corpus publishes', () => {
  assert.equal(blogLangName('en'), 'English');
  assert.equal(blogLangName('ja'), '日本語');
  assert.equal(blogLangName('es'), 'Español');
  assert.equal(blogLangName('pt'), 'Português');
});

const post = (slug, lang) => ({ slug, title: `T ${slug}`, date: '2026-11-01', preview: '', project: 'capafy-distribute', lang });

test('ArticleList groups every language into its own block, English first, Japanese second', async () => {
  const { ArticleList } = await import(compiled(new URL('../components/blog/OwnedMedia.tsx', import.meta.url)));
  const html = renderToStaticMarkup(React.createElement(ArticleList, {
    posts: [post('es-post', 'es'), post('ja-post', 'ja'), post('en-post', 'en'), post('pt-post', 'pt')],
  }));
  const enAt = html.indexOf('>English<');
  const jaAt = html.indexOf('>日本語<');
  const esAt = html.indexOf('>Español<');
  const ptAt = html.indexOf('>Português<');
  assert.ok(enAt >= 0 && jaAt > enAt && esAt > jaAt && ptAt > esAt, html);
  // The Spanish post must sit inside the Español section, not the English one.
  assert.ok(html.indexOf('es-post') > esAt && html.indexOf('es-post') < ptAt, html);
  assert.match(html, /<section[^>]*lang="es"/);
});

test('ArticleList keeps single-language lists unsectioned', async () => {
  const { ArticleList } = await import(compiled(new URL('../components/blog/OwnedMedia.tsx', import.meta.url)));
  const html = renderToStaticMarkup(React.createElement(ArticleList, {
    posts: [post('ja-one', 'ja'), post('ja-two', 'ja')],
  }));
  assert.doesNotMatch(html, /article-lang-heading/);
  assert.match(html, /ja-one/);
});

test('article page keeps the exact legacy alternates line the Manager build adapter patches', async () => {
  // The canonical Manager blog adapter (life-manager apps/landing/manager-blog,
  // pinned in .github/workflows/netlify-deploy.yml) rewrites this exact line
  // at CI build time to inject pair hreflang, and refuses to build when the
  // line changes. Guard it here so a local edit cannot break the deploy.
  const source = readFileSync(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf-8');
  const anchor = '    alternates: { canonical: `https://aniccaai.com/blog/${post.slug}` },';
  assert.ok(source.includes(anchor), 'legacy alternates anchor line changed; the CI Manager adapter will fail');
});

test('pair semantics match the build adapter for a real -en/-ja pair', () => {
  const enFile = new URL('../data/research/anicca-ios-2026-05-19-en.json', import.meta.url);
  const jaFile = new URL('../data/research/anicca-ios-2026-05-19-ja.json', import.meta.url);
  if (!existsSync(enFile) || !existsSync(jaFile)) return; // pair not in this corpus snapshot
  const exists = (s) =>
    existsSync(new URL(`../data/research/${s}.json`, import.meta.url)) ||
    existsSync(new URL(`../private/writer-articles/${s}.json`, import.meta.url));
  assert.deepEqual(blogPairLanguages('anicca-ios-2026-05-19-en', exists), {
    en: 'https://aniccaai.com/blog/anicca-ios-2026-05-19-en',
    ja: 'https://aniccaai.com/blog/anicca-ios-2026-05-19-ja',
    'x-default': 'https://aniccaai.com/blog/anicca-ios-2026-05-19-en',
  });
});
