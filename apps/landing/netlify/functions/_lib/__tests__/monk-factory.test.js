const test = require('node:test');
const assert = require('node:assert/strict');
const { authenticateFactoryRequest, buildFactoryCheckout } = require('../monk-factory.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com' };
const env = { SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_ANON_KEY: 'public-fixture-key' };
const price = { id: 'price_factory', active: true, currency: 'usd', unit_amount: 19900, metadata: { product: 'ai_monk_factory' }, recurring: { interval: 'month', interval_count: 1 } };

test('missing or ambiguous bearer identity never reaches the auth provider', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('must not call'); };
  for (const authorization of [undefined, 'Bearer ', 'Bearer first, second', 'Basic value']) {
    await assert.rejects(authenticateFactoryRequest({ headers: { authorization } }, { env, fetchImpl }), { code: 'sign_in_required', status: 401 });
  }
  assert.equal(calls, 0);
});

test('identity comes from the official auth readback, never client body or JWT metadata', async () => {
  const fetchImpl = async (url, init) => {
    assert.equal(url, 'https://fixture.supabase.co/auth/v1/user');
    assert.equal(init.headers.Authorization, 'Bearer fixture-session');
    assert.equal(init.headers.apikey, 'public-fixture-key');
    return new Response(JSON.stringify({ ...user, email_confirmed_at: '2026-01-01', user_metadata: { role: 'admin' } }));
  };
  const actual = await authenticateFactoryRequest({ headers: { Authorization: 'Bearer fixture-session' }, body: JSON.stringify({ user_id: 'another-user', customer_id: 'cus_another' }) }, { env, fetchImpl });
  assert.deepEqual(actual, user);
});

test('expired, anonymous and unconfirmed sessions cannot start a paid trial', async () => {
  for (const response of [new Response('{}', { status: 401 }), new Response(JSON.stringify({ ...user, is_anonymous: true })), new Response(JSON.stringify(user))]) {
    await assert.rejects(authenticateFactoryRequest({ headers: { authorization: 'Bearer fixture-session' } }, { env, fetchImpl: async () => response }), { code: 'invalid_session', status: 401 });
  }
  await assert.rejects(authenticateFactoryRequest({ headers: { authorization: 'Bearer fixture-session' } }, { env, fetchImpl: async () => { throw new Error('private upstream diagnostic'); } }), { code: 'auth_unavailable', status: 503 });
});

test('checkout binds the verified user to the fixed monthly price and three-day card-backed trial', () => {
  const actual = buildFactoryCheckout({ user, price, trialUsed: false });
  assert.equal(actual.mode, 'subscription');
  assert.deepEqual(actual.line_items, [{ price: price.id, quantity: 1 }]);
  assert.equal(actual.client_reference_id, user.id);
  assert.deepEqual(actual.metadata, { product: 'ai_monk_factory', user_id: user.id });
  assert.equal(actual.subscription_data.metadata.user_id, user.id);
  assert.equal(actual.subscription_data.trial_period_days, 3);
  assert.equal(actual.subscription_data.trial_settings.end_behavior.missing_payment_method, 'cancel');
  assert.equal(actual.payment_method_collection, 'always');
  assert.equal(actual.customer_email, user.email);
  assert.ok(actual.success_url.startsWith('https://aniccaai.com/ai-monk-factory'));
});

test('a used trial cannot be granted again and customer reuse omits a new customer email', () => {
  const actual = buildFactoryCheckout({ user, price, customerId: 'cus_fixture', trialUsed: true });
  assert.equal(actual.customer, 'cus_fixture');
  assert.equal(actual.customer_email, undefined);
  assert.equal(actual.subscription_data.trial_period_days, undefined);
});

test('a changed currency, amount, interval or inactive Stripe price cannot silently charge a different plan', () => {
  for (const change of [{ currency: 'jpy' }, { unit_amount: 99 }, { active: false }, { metadata: { product: 'another_product' } }, { recurring: { interval: 'year', interval_count: 1 } }, { recurring: { interval: 'month', interval_count: 2 } }, { recurring: { interval: 'month', interval_count: 1, usage_type: 'metered' } }]) {
    assert.throws(() => buildFactoryCheckout({ user, price: { ...price, ...change }, trialUsed: false }), { code: 'price_unavailable', status: 503 });
  }
});
