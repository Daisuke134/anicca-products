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
