const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const guide = require('../../../data/books/life-manager-ops-guide.json');
const { checkoutHandler } = require('../checkout.js');
const { ebookDownloadHandler } = require('../ebook-download.js');
const { webhookHandler } = require('../webhook.js');
const SECRET = 'whsec_lm_fixture';
const NOW = 1700000000;
const paid = (overrides = {}) => ({
  id: 'cs_live_lm_paid', status: 'complete', payment_status: 'paid', livemode: true, mode: 'payment',
  currency: guide.currency, amount_total: guide.unit_amount,
  metadata: { product: guide.product, guide_sku: guide.sku, lang: 'ja' }, ...overrides,
});

test('guide package files fit the non-streaming function response including base64 encoding', () => {
  for (const file of Object.values(guide.formats)) {
    const bytes = fs.readFileSync(path.join(__dirname, '../../../private/ebooks', file));
    const encodedSize = Buffer.byteLength(bytes.toString('base64'));
    assert.ok(encodedSize + 4096 < 6_000_000, `${file} cannot fit the 6 MB response limit`);
  }
});

test('guide checkout pins server-side $29 price_data, product metadata, and return origin', async () => {
  let params;
  const response = await checkoutHandler({ httpMethod: 'POST', headers: { origin: 'https://untrusted.example' },
    body: JSON.stringify({ product: guide.product, lang: 'ja', mode: 'payment', unit_amount: 1, price: 'price_client_override', guide_sku: 'client_override' }) }, {
    env: { STRIPE_SECRET_KEY: 'sk_test_fixture' },
    fetchImpl: async (_url, options) => { params = new URLSearchParams(options.body); return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/fixture' }) }; },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price_data][currency]'), 'usd');
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '2900');
  assert.equal(params.get('line_items[0][price_data][product_data][name]'), guide.title);
  assert.equal(params.get('line_items[0][quantity]'), '1');
  assert.equal(params.get('metadata[product]'), guide.product);
  assert.equal(params.get('metadata[guide_sku]'), guide.sku);
  assert.equal(params.get('metadata[lang]'), 'ja');
  assert.equal(params.get('success_url'), `https://aniccaai.com/${guide.slug}?success=1&session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('cancel_url'), `https://aniccaai.com/${guide.slug}?canceled=1`);
});

test('recurring mode and other languages never create a guide checkout', async () => {
  for (const request of [{ lang: 'ja', mode: 'subscription' }, { lang: 'en' }, { lang: 'unknown' }]) {
    const response = await checkoutHandler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ product: guide.product, ...request }) }, {
      env: { STRIPE_SECRET_KEY: 'sk_test_fixture' }, fetchImpl: async () => { throw new Error('must not dispatch'); },
    });
    assert.equal(response.statusCode, 400);
  }
});

for (const format of ['pdf', 'md', 'epub', 'json']) test(`paid guide session returns its own ${format} bytes`, async () => {
  const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: {
    session_id: 'cs_live_lm_paid', format, product: 'ebook', guide_sku: 'client_override',
  } }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_fixture' },
    retrieveSession: async () => paid(),
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.isBase64Encoded, true);
  assert.equal(response.headers['Content-Disposition'], `attachment; filename="${guide.formats[format]}"`);
  assert.deepEqual(Buffer.from(response.body, 'base64'), fs.readFileSync(path.join(__dirname, '../../../private/ebooks', guide.formats[format])));
});

test('production download rejects unpaid, test-mode, wrong-sku, wrong-amount, and wrong-currency guide sessions', async () => {
  for (const session of [paid({ payment_status: 'unpaid' }), paid({ livemode: false }),
    paid({ metadata: { product: guide.product, guide_sku: 'other-sku', lang: 'ja' } }),
    paid({ amount_total: 999 }), paid({ amount_total: 9900 }), paid({ currency: 'jpy' })]) {
    const response = await ebookDownloadHandler({ httpMethod: 'GET', queryStringParameters: { session_id: 'cs_live_lm_paid', format: 'pdf' } }, {
      env: { STRIPE_SECRET_KEY: 'sk_live_fixture' }, retrieveSession: async () => session,
      readFile: () => { throw new Error('must not read protected bytes'); },
    });
    assert.equal(response.statusCode, 403);
  }
});

async function delivery(session, sendEmail) {
  const body = JSON.stringify({ id: 'evt_lm_fixture', type: 'checkout.session.completed', data: { object: { ...session, customer_details: { email: 'buyer@example.com' } } } });
  const signature = crypto.createHmac('sha256', SECRET).update(`${NOW}.${body}`).digest('hex');
  return webhookHandler({ httpMethod: 'POST', body, headers: { 'stripe-signature': `t=${NOW},v1=${signature}` } }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_fixture', STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: 're_fixture' }, nowSeconds: NOW, sendEmail,
  });
}

test('guide events do not trigger Reset or Letter delivery mail', async () => {
  let sent = 0;
  const response = await delivery(paid(), async () => { sent += 1; });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'ok lm-ops-guide');
  assert.equal(sent, 0);
});
