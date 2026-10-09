const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  ebookDownloadHandler,
  ebookDownloadUrl,
  isPaidEbookSession,
} = require('../ebook-download.js');
const { webhookHandler } = require('../webhook.js');

const privatePdf = path.resolve(__dirname, '../../../private/ebooks/anicca-reset-en.pdf');
const SECRET = 'whsec_test_ebook_download';
const NOW = 1_700_000_000;

function sign(body, secret = SECRET, ts = NOW) {
  const crypto = require('node:crypto');
  const payload = `${ts}.${body}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { 'stripe-signature': `t=${ts},v1=${sig}` };
}

test('paid ebook session gate accepts complete paid ebook sessions only', () => {
  assert.equal(isPaidEbookSession({
    status: 'complete', payment_status: 'paid', livemode: true, mode: 'payment',
    metadata: { product: 'ebook', lang: 'en' },
  }, true), true);
  assert.equal(isPaidEbookSession({
    status: 'complete', payment_status: 'paid', livemode: true, mode: 'payment',
    metadata: {},
  }, true), true);
  assert.equal(isPaidEbookSession({
    status: 'complete', payment_status: 'paid', livemode: true, mode: 'payment',
    metadata: { product: 'kokoro_report' },
  }, true), false);
  assert.equal(isPaidEbookSession({
    status: 'complete', payment_status: 'unpaid', livemode: true, mode: 'payment',
    metadata: { product: 'ebook' },
  }, true), false);
  assert.equal(isPaidEbookSession({
    status: 'complete', payment_status: 'paid', livemode: false, mode: 'payment',
    metadata: { product: 'ebook' },
  }, true), false);
});

test('ebook download streams private PDF for a verified Stripe session', async () => {
  assert.ok(fs.existsSync(privatePdf), 'paid PDF must live under private/ebooks');
  const response = await ebookDownloadHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_paid_ebook_1', format: 'pdf' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_redacted' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_paid_ebook_1',
      status: 'complete',
      payment_status: 'paid',
      livemode: true,
      mode: 'payment',
      metadata: { product: 'ebook', lang: 'en' },
    }),
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.isBase64Encoded, true);
  assert.match(response.headers['Content-Type'], /pdf/);
  assert.match(response.headers['Content-Disposition'], /anicca-reset-en\.pdf/);
  const bytes = Buffer.from(response.body, 'base64');
  assert.ok(bytes.length > 1000);
  assert.equal(bytes.compare(fs.readFileSync(privatePdf)), 0);
});

test('ebook download rejects unpaid or wrong-product sessions', async () => {
  const unpaid = await ebookDownloadHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_unpaid_1' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_redacted' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_unpaid_1',
      status: 'complete',
      payment_status: 'unpaid',
      livemode: true,
      mode: 'payment',
      metadata: { product: 'ebook' },
    }),
  });
  assert.equal(unpaid.statusCode, 403);

  const wrongProduct = await ebookDownloadHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_letter_1' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_redacted' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_letter_1',
      status: 'complete',
      payment_status: 'paid',
      livemode: true,
      mode: 'subscription',
      metadata: { product: 'letter' },
    }),
  });
  assert.equal(wrongProduct.statusCode, 403);
});

test('webhook ebook email uses gated download URL with session id', async () => {
  let html = '';
  const payload = {
    id: 'evt_ebook_gate',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_live_ebook_mail',
        mode: 'payment',
        metadata: { product: 'ebook', lang: 'en' },
        customer_details: { email: 'buyer@example.com' },
        amount_total: 1099,
        currency: 'usd',
      },
    },
  };
  const body = JSON.stringify(payload);
  const response = await webhookHandler({
    httpMethod: 'POST',
    headers: sign(body),
    body,
  }, {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_live_redacted',
      RESEND_API_KEY: 're_redacted',
    },
    nowSeconds: NOW,
    sendEmail: async (_key, _email, _subject, deliveredHtml) => { html = deliveredHtml; },
  });
  assert.equal(response.body, 'ok ebook');
  assert.match(html, /ebook-download\?session_id=cs_live_ebook_mail/);
  assert.equal(html.includes('/ebooks/anicca-reset-en.pdf'), false);
  assert.equal(
    ebookDownloadUrl('cs_live_ebook_mail'),
    'https://aniccaai.com/.netlify/functions/ebook-download?session_id=cs_live_ebook_mail&format=pdf',
  );
});

test('public/ebooks no longer contains paid book files', () => {
  const publicDir = path.resolve(__dirname, '../../../public/ebooks');
  for (const name of [
    'anicca-reset-en.pdf',
    'anicca-reset-jp.pdf',
    'anicca-reset-en.md',
    'anicca-reset-jp.md',
    'anicca-reset-en.html',
    'anicca-reset-jp.html',
    'book.css',
  ]) {
    assert.equal(fs.existsSync(path.join(publicDir, name)), false, `${name} must not be public`);
    assert.ok(
      fs.existsSync(path.join(__dirname, '../../../private/ebooks', name)),
      `${name} must live under private/ebooks`,
    );
  }
});

test('netlify.toml redirects old public ebook paths to /monk', () => {
  const toml = fs.readFileSync(path.resolve(__dirname, '../../../netlify.toml'), 'utf8');
  for (const file of [
    'anicca-reset-en.pdf',
    'anicca-reset-jp.pdf',
    'anicca-reset-en.md',
    'anicca-reset-jp.md',
  ]) {
    assert.match(toml, new RegExp(`/ebooks/${file.replace('.', '\\.')}`));
  }
  assert.match(toml, /to = "\/monk"/);
  assert.match(toml, /\[functions\.ebook-download\]/);
  assert.match(toml, /private\/ebooks\/\*\*/);
});
