import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compiled } from './helpers/render-module.mjs';

const book = (language) => JSON.parse(readFileSync(new URL(`../data/books/the-art-of-ai-monks-${language}.json`, import.meta.url)));
const { default: Purchase } = await import(compiled(new URL('../components/AiMonkBookPurchase.tsx', import.meta.url)));
const { default: BookPage, aiMonkBookMetadata } = await import(compiled(new URL('../components/AiMonkBookPage.tsx', import.meta.url)));

async function clickPurchase(language) {
  // Invoke the real button handler without adding a DOM test dependency.
  const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const oldDispatcher = internals.ReactCurrentDispatcher.current;
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldFetch = globalThis.fetch;
  const requests = [];
  const state = [];
  let hookIndex = 0;
  let button;
  try {
    internals.ReactCurrentDispatcher.current = {
      useState(initial) {
        const index = hookIndex++;
        return [state[index] ?? initial, (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
      },
      useEffect() {},
    };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: `/the-art-of-ai-monks${language === 'ja' ? '/ja' : ''}`, search: '?utm_source=instagram&utm_medium=social&utm_campaign=ai_monk_book', assign() {} } },
    });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
    globalThis.fetch = async (url, options) => {
      requests.push({ url, body: options?.body ? JSON.parse(options.body) : undefined });
      return { ok: url === '/.netlify/functions/hit' };
    };
    const tree = Purchase({ book: book(language) });
    button = tree.props.children.find((child) => child?.type === 'button');
    internals.ReactCurrentDispatcher.current = oldDispatcher;
    await button.props.onClick();
    return requests;
  } finally {
    internals.ReactCurrentDispatcher.current = oldDispatcher;
    globalThis.fetch = oldFetch;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else delete globalThis.window;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator);
    else delete globalThis.navigator;
  }
}

for (const [language, ct] of [['en', 'ai_monk_book_en_checkout'], ['ja', 'ai_monk_book_ja_checkout']]) {
  test(`${language} purchase click records its edition and preserves checkout request`, async () => {
    const requests = await clickPurchase(language);
    const hit = requests.find((request) => request.url === '/.netlify/functions/hit');
    const checkout = requests.find((request) => request.url === '/.netlify/functions/checkout');
    assert.ok(hit, 'purchase click should emit a tracking event');
    assert.equal(hit.body.event, 'checkout_click');
    assert.equal(hit.body.ct, ct);
    assert.equal(hit.body.utm_source, 'instagram');
    assert.equal(hit.body.utm_medium, 'social');
    assert.equal(hit.body.utm_campaign, 'ai_monk_book');
    assert.equal(hit.body.path, `/the-art-of-ai-monks${language === 'ja' ? '/ja' : ''}`);
    assert.deepEqual(checkout.body, { product: book(language).product, lang: language, mode: 'payment' });
  });
}

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
