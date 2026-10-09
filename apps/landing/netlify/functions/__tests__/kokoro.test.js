const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { kokoroCheckoutHandler, PRICE_JPY } = require('../kokoro-checkout.js');
const { kokoroReportHandler } = require('../kokoro-report.js');
const { webhookHandler } = require('../webhook.js');
const {
  buildKokoroReport,
  isValidType,
  isValidScoreString,
} = require('../_lib/kokoro-report-content.js');

const SECRET = 'whsec_kokoro_test';
const NOW = 1785642000;

function signedEvent(payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET).update(`${NOW}.${body}`).digest('hex');
  return {
    httpMethod: 'POST',
    body,
    headers: { 'stripe-signature': `t=${NOW},v1=${signature}` },
  };
}

test('rejects invalid type or score string on checkout', async () => {
  const badType = await kokoroCheckoutHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ type: 'depression', s: '99999999' }),
    headers: { host: 'aniccaai.com' },
  }, { env: { STRIPE_SECRET_KEY: 'sk_test_x' } });
  assert.equal(badType.statusCode, 400);

  const badS = await kokoroCheckoutHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ type: 'night-anxiety', s: 'abc' }),
    headers: { host: 'aniccaai.com' },
  }, { env: { STRIPE_SECRET_KEY: 'sk_test_x' } });
  assert.equal(badS.statusCode, 400);

  assert.equal(isValidType('night-anxiety'), true);
  assert.equal(isValidType('hsp'), false);
  assert.equal(isValidScoreString('12345678'), true);
  assert.equal(isValidScoreString('123456789'), false);
});

test('checkout sends inline JPY price_data and kokoro_report metadata', async () => {
  let stripeParams;
  const response = await kokoroCheckoutHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ type: 'burnout', s: '19283746' }),
    headers: { host: 'aniccaai.com', 'x-forwarded-proto': 'https' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_test_redacted' },
    fetchImpl: async (_url, options) => {
      stripeParams = new URLSearchParams(options.body);
      return {
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/c/test', id: 'cs_test_1' }),
      };
    },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).url, 'https://checkout.stripe.com/c/test');
  assert.equal(stripeParams.get('mode'), 'payment');
  assert.equal(stripeParams.get('locale'), 'ja');
  assert.equal(stripeParams.get('line_items[0][price_data][currency]'), 'jpy');
  assert.equal(stripeParams.get('line_items[0][price_data][unit_amount]'), String(PRICE_JPY));
  assert.match(stripeParams.get('line_items[0][price_data][product_data][name]'), /心のクセ・取扱説明書/);
  assert.equal(stripeParams.get('metadata[product]'), 'kokoro_report');
  assert.equal(stripeParams.get('metadata[type]'), 'burnout');
  assert.equal(stripeParams.get('metadata[s]'), '19283746');
  assert.equal(stripeParams.get('metadata[lang]'), 'jp');
  assert.match(stripeParams.get('success_url'), /shindan\/report\?session_id=/);
  assert.match(stripeParams.get('cancel_url'), /shindan\/burnout\?s=19283746/);
});

test('report returns 403 for unpaid, wrong product, or missing session', async () => {
  const unpaid = await kokoroReportHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_unpaid_1' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_x' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_unpaid_1',
      status: 'open',
      payment_status: 'unpaid',
      livemode: true,
      metadata: { product: 'kokoro_report', type: 'burnout', s: '19283746' },
    }),
  });
  assert.equal(unpaid.statusCode, 403);

  const wrongProduct = await kokoroReportHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_ebook_1' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_x' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_ebook_1',
      status: 'complete',
      payment_status: 'paid',
      livemode: true,
      metadata: { product: 'ebook', type: 'burnout', s: '19283746' },
    }),
  });
  assert.equal(wrongProduct.statusCode, 403);

  const missing = await kokoroReportHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_missing' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_x' },
    liveMode: true,
    retrieveSession: async () => {
      const err = new Error('not found');
      err.status = 404;
      throw err;
    },
  });
  assert.equal(missing.statusCode, 403);
});

test('paid kokoro session returns 200 report body (server-side only)', async () => {
  const response = await kokoroReportHandler({
    httpMethod: 'GET',
    queryStringParameters: { session_id: 'cs_live_paid_1' },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_x' },
    liveMode: true,
    retrieveSession: async () => ({
      id: 'cs_live_paid_1',
      status: 'complete',
      payment_status: 'paid',
      livemode: true,
      metadata: { product: 'kokoro_report', type: 'night-anxiety', s: '91234567' },
    }),
  });
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.product, 'kokoro_report');
  assert.equal(body.typeName, '夜ぐるぐるタイプ');
  assert.equal(body.sections.affirmations30.items.length, 30);
  assert.match(body.disclaimer, /医療的な診断ではありません/);
  assert.equal(body.sections.affirmations30.items.some((t) => /うつ|HSP|愛着障害/.test(t)), false);
});

test('buildKokoroReport never uses medical diagnosis labels', () => {
  const report = buildKokoroReport({ type: 'self-blame', s: '11223344' });
  const blob = JSON.stringify(report);
  assert.equal(/うつ|HSP|愛着障害|ADHD|発達障害|双極/.test(blob), false);
  assert.match(report.disclaimer, /医療的な診断ではありません/);
});

test('webhook acknowledges kokoro_report without ebook email', async () => {
  let delivered = 0;
  const payload = {
    id: 'evt_kokoro',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_kokoro',
        mode: 'payment',
        metadata: { product: 'kokoro_report', lang: 'jp', type: 'burnout', s: '19283746' },
        customer_details: { email: 'buyer@example.com' },
        amount_total: 480,
        currency: 'jpy',
      },
    },
  };
  const response = await webhookHandler(signedEvent(payload), {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_live_redacted',
      RESEND_API_KEY: 're_redacted',
    },
    nowSeconds: NOW,
    sendEmail: async () => { delivered += 1; },
  });
  assert.equal(response.body, 'ok kokoro');
  assert.equal(delivered, 0);
});

test('webhook acknowledges retreat-build-fund without ebook email', async () => {
  let delivered = 0;
  const payload = {
    id: 'evt_retreat',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_retreat',
        mode: 'payment',
        metadata: { product: 'retreat-build-fund', amount_jpy: '1000' },
        customer_details: { email: 'donor@example.com' },
        amount_total: 1000,
        currency: 'jpy',
      },
    },
  };
  const response = await webhookHandler(signedEvent(payload), {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_live_redacted',
      RESEND_API_KEY: 're_redacted',
    },
    nowSeconds: NOW,
    sendEmail: async () => { delivered += 1; },
  });
  assert.equal(response.body, 'ok retreat-build');
  assert.equal(delivered, 0);
});

test('webhook still emails ebook PDF for product=ebook', async () => {
  let delivered = 0;
  const payload = {
    id: 'evt_ebook',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_ebook',
        mode: 'payment',
        metadata: { product: 'ebook', lang: 'en' },
        customer_details: { email: 'buyer@example.com' },
        amount_total: 1099,
        currency: 'usd',
      },
    },
  };
  const response = await webhookHandler(signedEvent(payload), {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_live_redacted',
      RESEND_API_KEY: 're_redacted',
    },
    nowSeconds: NOW,
    sendEmail: async () => { delivered += 1; },
  });
  assert.equal(response.body, 'ok ebook');
  assert.equal(delivered, 1);
});
