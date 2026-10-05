const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { checkoutHandler } = require('../../checkout.js');

const landingRoot = path.resolve(__dirname, '../../../../');
const checkoutAttribution = import('../../../../lib/checkout-attribution.js').catch(() => null);

const PRICE_ENV = {
  STRIPE_SECRET_KEY: 'sk_test_redacted',
  STRIPE_EN_PRICE_ID: 'price_ebook_en',
  STRIPE_JP_PRICE_ID: 'price_ebook_jp',
  STRIPE_LETTER_EN_PRICE: 'price_letter_en',
  STRIPE_LETTER_JP_PRICE: 'price_letter_jp',
};

async function createCheckout(request) {
  let stripeParams;
  const response = await checkoutHandler({
    httpMethod: 'POST',
    body: JSON.stringify(request),
    headers: { origin: 'https://aniccaai.com' },
  }, {
    env: PRICE_ENV,
    fetchImpl: async (_url, options) => {
      stripeParams = new URLSearchParams(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ url: 'https://checkout.stripe.com/c/test' }),
      };
    },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).url, 'https://checkout.stripe.com/c/test');
  return stripeParams;
}

test('landing checkout helper forwards only locale-matched owned ebook campaign tokens', async () => {
  const helper = await checkoutAttribution;
  assert.ok(helper, 'shared checkout-attribution helper must exist');
  const buildRequest = helper.buildCheckoutRequest;
  assert.equal(typeof buildRequest, 'function');

  assert.deepEqual(buildRequest({
    search: '?utm_source=social&utm_campaign=ee_abcdefghijklmnopqrst',
    lang: 'en', product: 'ebook', mode: 'payment',
  }), {
    lang: 'en', product: 'ebook', mode: 'payment',
    attribution_token: 'ee_abcdefghijklmnopqrst',
  });
  assert.deepEqual(buildRequest({
    search: '?utm_campaign=ej_abcdefghijklmnopqrst',
    lang: 'jp', product: 'letter', mode: 'subscription',
  }), {
    lang: 'jp', product: 'letter', mode: 'subscription',
    attribution_token: 'ej_abcdefghijklmnopqrst',
  });
  assert.deepEqual(buildRequest({
    search: '?utm_campaign=ee_abcdefghijklmnopqrst',
    lang: 'jp', product: 'ebook', mode: 'payment',
  }), { lang: 'jp', product: 'ebook', mode: 'payment' });
});

test('monk, achan, letter, and tegami use the shared campaign-aware checkout request', () => {
  for (const page of ['monk', 'achan', 'letter', 'tegami']) {
    const source = fs.readFileSync(path.join(landingRoot, `app/${page}/page.tsx`), 'utf8');
    assert.match(source, /buildCheckoutRequest\(/, `${page} must use the shared helper`);
  }
});

test('English ebook keeps the one-time server price and carries its attribution token', async () => {
  const token = 'ee_abcdefghijklmnopqrst';
  const params = await createCheckout({ lang: 'en', product: 'ebook', attribution_token: token });

  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price]'), PRICE_ENV.STRIPE_EN_PRICE_ID);
  assert.equal(params.get('metadata[lang]'), 'en');
  assert.equal(params.get('metadata[product]'), 'ebook');
  assert.equal(params.get('metadata[attribution_token]'), token);
  assert.equal(params.has('subscription_data[metadata][attribution_token]'), false);
});

test('Japanese ebook uses its locale price and carries its attribution token', async () => {
  const token = 'ej_abcdefghijklmnopqrst';
  const params = await createCheckout({ lang: 'jp', product: 'ebook', attribution_token: token });

  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price]'), PRICE_ENV.STRIPE_JP_PRICE_ID);
  assert.equal(params.get('metadata[attribution_token]'), token);
});

test('English Letter checkout carries attribution into subscription metadata', async () => {
  const token = 'ee_abcdefghijklmnopqrst';
  const params = await createCheckout({
    lang: 'en', product: 'letter', mode: 'subscription', attribution_token: token,
  });

  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('line_items[0][price]'), PRICE_ENV.STRIPE_LETTER_EN_PRICE);
  assert.equal(params.get('metadata[attribution_token]'), token);
  assert.equal(params.get('subscription_data[metadata][attribution_token]'), token);
  assert.equal(params.get('subscription_data[trial_period_days]'), '14');
});

test('Japanese Tegami checkout carries attribution into subscription metadata', async () => {
  const token = 'ej_abcdefghijklmnopqrst';
  const params = await createCheckout({
    lang: 'jp', product: 'letter', mode: 'subscription', attribution_token: token,
  });

  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('line_items[0][price]'), PRICE_ENV.STRIPE_LETTER_JP_PRICE);
  assert.equal(params.get('subscription_data[metadata][attribution_token]'), token);
});

test('invalid or locale-mismatched attribution never blocks checkout and is not recorded', async () => {
  const params = await createCheckout({ lang: 'jp', product: 'ebook', attribution_token: 'ee_not-japanese' });
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price]'), PRICE_ENV.STRIPE_JP_PRICE_ID);
  assert.equal(params.has('metadata[attribution_token]'), false);
});
