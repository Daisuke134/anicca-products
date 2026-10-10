const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { checkoutHandler } = require('../../checkout.js');

const landingRoot = path.resolve(__dirname, '../../../../');
const env = {
  STRIPE_SECRET_KEY: 'sk_test_redacted',
  STRIPE_LETTER_EN_PRICE: 'price_letter_en',
};

async function createLetterCheckout() {
  let params;
  const response = await checkoutHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ lang: 'en', product: 'letter', mode: 'subscription' }),
    headers: { origin: 'https://aniccaai.com' },
  }, {
    env,
    fetchImpl: async (_url, options) => {
      params = new URLSearchParams(options.body);
      return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/c/test' }) };
    },
  });
  assert.equal(response.statusCode, 200);
  return params;
}

test('Letter subscription omits the payment-only customer_creation parameter', async () => {
  const params = await createLetterCheckout();
  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('customer_creation'), null);
  assert.equal(params.get('subscription_data[trial_period_days]'), '14');
});

test('Monk page offers the paid Letter checkout while keeping ebook checkout separate', () => {
  const source = fs.readFileSync(path.join(landingRoot, 'app/monk/page.tsx'), 'utf8');
  assert.ok(source.includes('<BuyButton label="Start the 14-day free trial" product="letter" mode="subscription" />'), 'Monk CTA must create a Letter subscription');
  assert.ok(source.includes('search: window.location.search'), 'Monk Letter CTA must preserve the campaign token');
  assert.ok(source.includes('Daily Anicca Letter'), 'Monk CTA must identify the recurring product');
  assert.ok(source.includes('$9.99'), 'Monk CTA must show the recurring price');
  assert.ok(source.includes('14 days free'), 'Monk CTA must show the trial length');
});

test('Letter trial copy does not promise a card-free trial', () => {
  const source = fs.readFileSync(path.join(landingRoot, 'app/letter/page.tsx'), 'utf8');
  assert.ok(/payment method is required/i.test(source), 'Letter page must state that checkout collects a payment method');
  assert.ok(!/no card needed for trial/i.test(source), 'Letter page must not promise a card-free trial');
});

test('Tegami trial copy matches Stripe default card collection (not card-free)', () => {
  const source = fs.readFileSync(path.join(landingRoot, 'app/tegami/page.tsx'), 'utf8');
  assert.ok(
    /お支払い方法の登録が必要/.test(source),
    'Tegami must state that checkout collects a payment method',
  );
  assert.ok(
    !/カード登録不要/.test(source),
    'Tegami must not promise a card-free subscription trial',
  );
});
