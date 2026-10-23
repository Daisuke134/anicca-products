const { test } = require('node:test');
const assert = require('node:assert/strict');
const Stripe = require('stripe');

test('a real signed Factory event cannot create or cancel a wake-call subscription', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
  process.env.STRIPE_ALARM_WEBHOOK_SECRET = 'whsec_fixture';
  process.env.SUPABASE_URL = 'https://fixture.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture';
  const { handler } = require('../../alarm-webhook.js');
  const originalFetch = global.fetch;
  global.fetch = async () => assert.fail('Factory must not touch wake-call records');
  try {
    for (const type of ['checkout.session.completed', 'customer.subscription.deleted']) {
      const body = JSON.stringify({ id: 'evt_factory', type, data: { object: {
        id: 'sub_factory', subscription: 'sub_factory', customer: 'cus_fixture',
        metadata: { product: 'ai_monk_factory' }, customer_details: { phone: '+15555550100' },
      } } });
      const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_ALARM_WEBHOOK_SECRET });
      const response = await handler({ httpMethod: 'POST', body, headers: { 'stripe-signature': signature } });
      assert.equal(response.statusCode, 200);
    }
  } finally { global.fetch = originalFetch; }
});
