const { test } = require('node:test');
const assert = require('node:assert/strict');
const Stripe = require('stripe');
const { factoryStripeHandler } = require('../../monk-factory-stripe.js');

const env = { STRIPE_SECRET_KEY: 'sk_test_fixture', MONK_FACTORY_STRIPE_WEBHOOK_SECRET: 'whsec_fixture', MONK_FACTORY_STRIPE_LIVE: 'false' };
const userId = 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8';
function event(overrides = {}) {
  return { id: 'evt_fixture', livemode: false, type: 'checkout.session.completed', data: { object: {
    id: 'cs_fixture', mode: 'subscription', subscription: 'sub_fixture', client_reference_id: userId,
    metadata: { product: 'ai_monk_factory', user_id: userId },
  } }, ...overrides };
}
function request(payload) {
  const body = JSON.stringify(payload);
  return { httpMethod: 'POST', body, headers: { 'stripe-signature': Stripe.webhooks.generateTestHeaderString({ payload: body, secret: env.MONK_FACTORY_STRIPE_WEBHOOK_SECRET }) } };
}

test('actual Stripe HMAC rejects tampering and stale signatures before persistence', async () => {
  const store = { enqueueEvent: async () => assert.fail('unsigned event reached persistence') };
  const changed = request(event()); changed.body += ' ';
  assert.equal((await factoryStripeHandler(changed, { env, store })).statusCode, 400);
  const stale = request(event());
  stale.headers['stripe-signature'] = Stripe.webhooks.generateTestHeaderString({ payload: stale.body, secret: env.MONK_FACTORY_STRIPE_WEBHOOK_SECRET, timestamp: Math.floor(Date.now()/1000)-1000 });
  assert.equal((await factoryStripeHandler(stale, { env, store })).statusCode, 400);
});

test('verified base64 request queues identifiers only and never grants from the event payload', async () => {
  const req = request(event()); req.body = Buffer.from(req.body).toString('base64'); req.isBase64Encoded = true;
  const records = [];
  const store = { enqueueEvent: async row => { records.push(row); } };
  assert.equal((await factoryStripeHandler(req, { env, store })).statusCode, 200);
  assert.deepEqual(records, [{ id: 'evt_fixture', user_id: userId, event_type: 'checkout.session.completed', stripe_object_id: 'cs_fixture', stripe_subscription_id: 'sub_fixture' }]);
});

test('another product, wrong live mode and mismatched Checkout user cannot enter the Factory queue', async () => {
  const store = { enqueueEvent: async () => assert.fail('foreign event reached Factory persistence') };
  const foreign = event(); foreign.data.object.metadata.product = 'other_product';
  assert.equal((await factoryStripeHandler(request(foreign), { env, store })).statusCode, 200);
  assert.equal((await factoryStripeHandler(request(event({ livemode: true })), { env, store })).statusCode, 400);
  const mismatch = event(); mismatch.data.object.client_reference_id = 'another-user';
  assert.equal((await factoryStripeHandler(request(mismatch), { env, store })).statusCode, 400);
});
