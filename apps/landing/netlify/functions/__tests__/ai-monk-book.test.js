const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const book = require('../../../data/books/the-art-of-ai-monks-en.json');
const japaneseBook = require('../../../data/books/the-art-of-ai-monks-ja.json');
const { checkoutHandler } = require('../checkout.js');
const { ebookDownloadHandler } = require('../ebook-download.js');
const { webhookHandler } = require('../webhook.js');
const SECRET = 'whsec_book_fixture';
const NOW = 1700000000;
const paid = (overrides = {}) => ({
  id: 'cs_live_monkbook_paid', status: 'complete', payment_status: 'paid', livemode: true, mode: 'payment',
  metadata: { product: book.product, book_sku: book.sku, lang: 'en' }, ...overrides,
});

test('book downloads fit the non-streaming function response including base64 encoding', () => {
  for (const edition of [book, japaneseBook]) for (const file of Object.values(edition.formats)) {
    const bytes = fs.readFileSync(path.join(__dirname, '../../../private/ebooks', file));
    const encodedSize = Buffer.byteLength(bytes.toString('base64'));
    assert.ok(encodedSize + 4096 < 6_000_000, `${file} cannot fit the 6 MB response limit`);
  }
});

for (const edition of [book, japaneseBook]) test(`${edition.language} book checkout pins server SKU, one-time price, language, and return origin`, async () => {
  let params;
  const response = await checkoutHandler({ httpMethod: 'POST', headers: { origin: 'https://untrusted.example' },
    body: JSON.stringify({ product: book.product, lang: edition.language, mode: 'payment', price: 'price_client_override', book_sku: 'client_override' }) }, {
    env: { STRIPE_SECRET_KEY: 'sk_test_fixture' },
    fetchImpl: async (_url, options) => { params = new URLSearchParams(options.body); return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/fixture' }) }; },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(params.get('line_items[0][price]'), edition.stripe_price_id);
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('metadata[product]'), book.product);
  assert.equal(params.get('metadata[book_sku]'), edition.sku);
  assert.equal(params.get('metadata[lang]'), edition.language);
  assert.equal(params.get('success_url'), `https://aniccaai.com/${edition.slug}?success=1&session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('cancel_url'), `https://aniccaai.com/${edition.slug}?canceled=1`);
});

test('unavailable language and recurring mode never create a checkout for the new book', async () => {
  for (const request of [{ lang: 'jp' }, { lang: '__proto__' }, { lang: 'unknown' }, { lang: 'en', mode: 'subscription' }, { lang: 'ja', mode: 'subscription' }]) {
    const response = await checkoutHandler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ product: book.product, ...request }) }, {
      env: { STRIPE_SECRET_KEY: 'sk_test_fixture' }, fetchImpl: async () => { throw new Error('must not dispatch'); },
    });
    assert.equal(response.statusCode, 400);
  }
});

for (const edition of [book, japaneseBook]) for (const format of ['pdf', 'epub']) test(`${edition.language} paid session returns only its own ${format} bytes`, async () => {
  const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: {
    session_id: 'cs_live_monkbook_paid', format, lang: edition.language === 'en' ? 'ja' : 'en', book_sku: 'client_override',
  } }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_fixture' },
    retrieveSession: async () => paid({ metadata: { product: edition.product, book_sku: edition.sku, lang: edition.language } }),
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.isBase64Encoded, true);
  assert.equal(response.headers['Content-Disposition'], `attachment; filename="${edition.formats[format]}"`);
  assert.deepEqual(Buffer.from(response.body, 'base64'), fs.readFileSync(path.join(__dirname, '../../../private/ebooks', edition.formats[format])));
});

for (const format of ['pdf', 'epub']) test(`paid book session receives its own private ${format}`, async () => {
  let file;
  const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: { session_id: 'cs_live_monkbook_paid', format } }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_fixture' }, retrieveSession: async () => paid(),
    readFile: (value) => { file = value; return Buffer.from('book bytes'); },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(path.basename(file), book.formats[format]);
  assert.match(response.headers['Content-Type'], format === 'pdf' ? /application\/pdf/ : /application\/epub\+zip/);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
});

test('other book entitlement cannot select the new book through request parameters', async () => {
  let file;
  const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: {
    session_id: 'cs_live_reset_paid', format: 'pdf', product: book.product,
  } }, { env: { STRIPE_SECRET_KEY: 'sk_live_fixture' }, retrieveSession: async () => paid({ metadata: { product: 'ebook', lang: 'en' } }),
    readFile: (value) => { file = value; return Buffer.from('reset bytes'); },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(path.basename(file), 'anicca-reset-en.pdf');
});

test('production download rejects unpaid, test-mode, other-edition, and unavailable-language sessions', async () => {
  for (const session of [paid({ payment_status: 'unpaid' }), paid({ livemode: false }),
    paid({ metadata: { product: book.product, book_sku: 'other-edition', lang: 'en' } }),
    paid({ metadata: { product: book.product, book_sku: book.sku, lang: 'jp' } }),
    paid({ metadata: { product: book.product, book_sku: book.sku, lang: 'ja' } }),
    paid({ metadata: { product: book.product, book_sku: japaneseBook.sku, lang: 'en' } }),
    paid({ metadata: { product: book.product, book_sku: japaneseBook.sku, lang: '__proto__' } })]) {
    const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: { session_id: 'cs_live_monkbook_paid' } }, {
      env: { STRIPE_SECRET_KEY: 'sk_live_fixture' }, retrieveSession: async () => session,
      readFile: () => { throw new Error('must not read protected bytes'); },
    });
    assert.equal(response.statusCode, 403);
  }
});

async function delivery(session, sendEmail) {
  const body = JSON.stringify({ id: 'evt_book_fixture', type: 'checkout.session.completed', data: { object: { ...session, customer_details: { email: 'buyer@example.com' } } } });
  const signature = crypto.createHmac('sha256', SECRET).update(`${NOW}.${body}`).digest('hex');
  return webhookHandler({ httpMethod: 'POST', body, headers: { 'stripe-signature': `t=${NOW},v1=${signature}` } }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_fixture', STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: 're_fixture' }, nowSeconds: NOW, sendEmail,
  });
}

test('new-book events do not trigger Reset or Letter delivery mail', async () => {
  for (const session of [paid(), paid({ payment_status: 'unpaid' }), paid({ metadata: { product: japaneseBook.product, book_sku: japaneseBook.sku, lang: 'ja' } })]) {
    let sent = 0;
    const response = await delivery(session, async () => { sent += 1; });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, 'ok ai-monk-book');
    assert.equal(sent, 0);
  }
});
