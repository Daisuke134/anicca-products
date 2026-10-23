const { test } = require('node:test');
const assert = require('node:assert/strict');
const { factoryHandler } = require('../../monk-factory.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com', email_confirmed_at: '2026-01-01' };
const env = { SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_ANON_KEY: 'public-fixture' };
const auth = async () => new Response(JSON.stringify(user));

test('missing identity never accesses Factory persistence', async () => {
  const response = await factoryHandler({ httpMethod: 'GET', headers: {} }, { env, fetchImpl: async () => assert.fail('missing identity reached network') });
  assert.equal(response.statusCode, 401);
});

test('API reads and stop updates bind to Auth server ID, ignoring forged body and query IDs', async () => {
  const calls = [];
  const store = {
    account: async id => { calls.push(['account', id]); return { user_id: id, subscription_status: 'none', stripe_customer_id: 'private-internal-fixture', checkout_nonce: 'private-context-fixture' }; },
    jobs: async id => { calls.push(['jobs', id]); return []; },
    stop: async id => { calls.push(['stop', id]); return { auto_post: false }; },
  };
  const req = { httpMethod: 'GET', headers: { authorization: 'Bearer fixture-session' }, body: JSON.stringify({ user_id: 'another-user' }), queryStringParameters: { user_id: 'another-user' } };
  const response = await factoryHandler(req, { env, fetchImpl: auth, store });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.includes('private-'), false);
  const stopped = await factoryHandler({ ...req, httpMethod: 'POST', body: JSON.stringify({ action: 'stop', user_id: 'another-user' }) }, { env, fetchImpl: auth, store });
  assert.equal(stopped.statusCode, 200);
  assert.deepEqual(calls, [['account', user.id], ['jobs', user.id], ['stop', user.id]]);
});

test('unavailable production providers cannot start a trial or reserve a billing profile', async () => {
  const response = await factoryHandler({ httpMethod: 'POST', headers: { authorization: 'Bearer fixture-session' }, body: JSON.stringify({ action: 'checkout' }) }, { env, fetchImpl: auth, store: { reserveProfile: async () => assert.fail('unavailable service reserved a checkout') } });
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.parse(response.body).error, 'factory_unavailable');
});

test('missing cancellation or billing configuration keeps ready false and cannot reserve Checkout', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long',
    STRIPE_SECRET_KEY: 'sk_test_fixture', MONK_FACTORY_STRIPE_PRICE_ID: 'price_fixture', MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID: 'bpc_fixture',
    MONK_FACTORY_STRIPE_WEBHOOK_SECRET: 'whsec_fixture', MONK_FACTORY_STRIPE_LIVE: 'false' };
  for (const field of ['STRIPE_SECRET_KEY', 'MONK_FACTORY_STRIPE_PRICE_ID', 'MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID', 'MONK_FACTORY_STRIPE_WEBHOOK_SECRET', 'MONK_FACTORY_STRIPE_LIVE']) {
    const missing = { ...configured }; delete missing[field]; let reservations = 0;
    const dependencies = { env: missing, fetchImpl: auth, stripe: {}, providers: { readiness: () => ({ ready: true }) },
      store: { account: async () => null, reserveProfile: async () => { reservations++; throw new Error('not configured'); } } };
    const req = { httpMethod: 'GET', headers: { authorization: 'Bearer fixture' } };
    const state = await factoryHandler(req, dependencies);
    assert.equal(JSON.parse(state.body).ready, false, field);
    const checkout = await factoryHandler({ ...req, httpMethod: 'POST', body: JSON.stringify({ action: 'checkout' }) }, dependencies);
    assert.equal(checkout.statusCode, 503); assert.equal(reservations, 0, field);
  }
});
