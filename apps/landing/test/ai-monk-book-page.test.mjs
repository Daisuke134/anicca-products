import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compiled } from './helpers/render-module.mjs';

const book = (language) => JSON.parse(readFileSync(new URL(`../data/books/the-art-of-ai-monks-${language}.json`, import.meta.url)));
const { default: Purchase } = await import(compiled(new URL('../components/AiMonkBookPurchase.tsx', import.meta.url)));
const { default: BookPage, aiMonkBookMetadata } = await import(compiled(new URL('../components/AiMonkBookPage.tsx', import.meta.url)));

test('Japanese purchase states its edition, currency and one-time download clearly', () => {
  const html = renderToStaticMarkup(React.createElement(Purchase, { book: book('ja') }));
  assert.match(html, /PDF・EPUBを購入/);
  assert.match(html, /\$9\.99/);
  assert.match(html, /日本語版/);
  assert.match(html, /一回払い/);
  assert.doesNotMatch(html, /English edition/);
});

test('English purchase retains the English edition and fixed price', () => {
  const html = renderToStaticMarkup(React.createElement(Purchase, { book: book('en') }));
  assert.match(html, /English edition/);
  assert.match(html, /\$9\.99/);
});

for (const language of ['en', 'ja']) test(`${language} book page uses its manuscript, route, price and edition`, () => {
  const edition = book(language);
  const html = renderToStaticMarkup(React.createElement(BookPage, { book: edition }));
  assert.match(html, new RegExp(`<main lang="${language}"`));
  assert.ok(html.includes(`the-art-of-ai-monks-${language}.md`));
  assert.ok(html.includes(edition.edition));
  assert.match(html, /\$9\.99/);
  assert.equal((html.match(/<li /g) || []).length, 10);
  const structured = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(structured.inLanguage, language);
  assert.equal(structured.offers.price, '9.99');
  assert.equal(structured.offers.url, `https://aniccaai.com/${edition.slug}`);
  const metadata = aiMonkBookMetadata(edition);
  assert.equal(metadata.alternates.canonical, structured.offers.url);
  assert.equal(metadata.alternates.languages.ja, 'https://aniccaai.com/the-art-of-ai-monks/ja');
  assert.doesNotMatch(html, /behind the robe|Curiosity, then practice|strange corner/);
  assert.ok(html.includes(language === 'ja' ? '全文を無料で読む' : 'Read the full book for free'));
});
