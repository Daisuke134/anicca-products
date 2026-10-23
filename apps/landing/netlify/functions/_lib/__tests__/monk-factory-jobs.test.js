const { test } = require('node:test');
const assert = require('node:assert/strict');
const { factoryHandler } = require('../../monk-factory.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com', email_confirmed_at: '2026-01-01' };
const key = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_ANON_KEY: 'fixture', MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
const auth = async () => new Response(JSON.stringify(user));

test('image ticket authenticates its exact job and rejects expiry or tampering before persistence', async () => {
  const { signImageTicket, verifyImageTicket } = require('../monk-factory-jobs.js');
  const ticket = signImageTicket({ jobId: user.id, nonce: key, expiresAt: 120000 }, env);
  assert.equal(verifyImageTicket(ticket, env, 100000).jobId, user.id);
  assert.throws(() => verifyImageTicket(ticket, env, 120001), { code: 'invalid_image_ticket' });
  const otherPayload = Buffer.from(JSON.stringify({ jobId: key, nonce: key, expiresAt: 120000 })).toString('base64url');
  assert.throws(() => verifyImageTicket(otherPayload + '.' + ticket.split('.')[1], env, 100000), { code: 'invalid_image_ticket' });
  const { imageBackgroundHandler } = require('../../monk-factory-image-background.js');
  const reply = await imageBackgroundHandler({ httpMethod: 'POST', body: JSON.stringify({ ticket: 'unsigned' }) }, { env, store: { job: () => assert.fail('invalid ticket reached persistence') } });
  assert.equal(reply.statusCode, 401);
});

test('Generate binds occurrence to verified UID and readiness false reserves nothing', async () => {
  const account = { user_id: user.id, avatar_id: 'avatar_fixture', stripe_subscription_id: 'sub_fixture' };
  const calls = [];
  const store = { account: async () => account, reserveJob: async (...args) => { calls.push(args); return { id: key }; } };
  const event = { httpMethod: 'POST', headers: { authorization: 'Bearer fixture', 'idempotency-key': key }, body: JSON.stringify({ action: 'generate_video', user_id: key, script: 'untrusted' }) };
  const response = await factoryHandler(event, { env, store, fetchImpl: auth, providers: { readiness: () => ({ ready: true }) }, syncBilling: async () => account });
  assert.equal(response.statusCode, 202);
  assert.deepEqual(JSON.parse(response.body), { jobId: key });
  assert.deepEqual(calls, [[user.id, 'manual:' + key, 'video']]);
  const unavailable = await factoryHandler(event, { env, store: { reserveJob: () => assert.fail('readiness false reserved a job') }, fetchImpl: auth, providers: { readiness: () => ({ ready: false }) } });
  assert.equal(unavailable.statusCode, 503);
  const noKey = await factoryHandler({ ...event, headers: { authorization: 'Bearer fixture' } }, { env, store, fetchImpl: auth, providers: { readiness: () => ({ ready: true }) }, syncBilling: async () => account });
  assert.equal(noKey.statusCode, 400);
});
