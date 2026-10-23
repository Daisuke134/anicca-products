const { test } = require('node:test');
const assert = require('node:assert/strict');
const { factoryHandler } = require('../../monk-factory.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com', email_confirmed_at: '2026-01-01' };
const key = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_ANON_KEY: 'fixture', MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long',
  STRIPE_SECRET_KEY: 'sk_test_fixture', MONK_FACTORY_STRIPE_LIVE: 'false', MONK_FACTORY_STRIPE_PRICE_ID: 'price_fixture',
  MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID: 'bpc_fixture', MONK_FACTORY_STRIPE_WEBHOOK_SECRET: 'whsec_fixture' };
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

test('an exhausted scheduled tick cannot claim a job or begin a provider effect', async () => {
  const { runFactoryTick } = require('../monk-factory-jobs.js');
  const result = await runFactoryTick({ env, providers: { readiness: () => ({ ready: true }) }, budgetMs: 1,
    store: { pendingEvents: async () => [], dueAccounts: async () => [], claimJob: () => assert.fail('deadline claimed another job') } });
  assert.deepEqual(result, { processed: 0 });
});

test('the installed private Blobs SDK uses the bounded transport once and tolerates classic eventual reads', async () => {
  const { createPrivateImages } = require('../monk-factory-jobs.js');
  const prior = process.env.NETLIFY_BLOBS_CONTEXT; const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response(null, { status: 404 });
    const event = { blobs: Buffer.from(JSON.stringify({ url: 'https://synthetic.example', token: 'synthetic' })).toString('base64'), headers: { 'x-nf-site-id': 'synthetic-site' } };
    const image = { jobId: user.id, receiptId: 'synthetic-receipt' }; let requests = 0;
    const images = createPrivateImages(event, async (_url, options) => {
      requests++; assert.ok(options.signal);
      return new Response(JSON.stringify(image));
    });
    assert.deepEqual(await images.get('images/' + user.id), image);
    assert.equal(requests, 1);
    let failures = 0;
    const unavailable = createPrivateImages(event, async () => { failures++; return new Response(null, { status: 503 }); });
    await assert.rejects(unavailable.get('images/' + user.id), { code: 'image_storage_unavailable' });
    assert.equal(failures, 1);
  } finally {
    global.fetch = originalFetch;
    if (prior == null) delete process.env.NETLIFY_BLOBS_CONTEXT; else process.env.NETLIFY_BLOBS_CONTEXT = prior;
  }
});

test('a disabled scheduled function returns before constructing Stripe, persistence or Blobs', async () => {
  const { factoryTickHandler } = require('../../monk-factory-tick.js');
  const result = await factoryTickHandler({}, { env: {} });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { processed: 0, disabled: true });
});

test('scheduled creation stays disabled when cancellation configuration is missing', async () => {
  const { factoryTickHandler } = require('../../monk-factory-tick.js');
  const missing = { ...env }; delete missing.MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID;
  const result = await factoryTickHandler({}, { env: missing, stripe: {}, providers: { readiness: () => ({ ready: true }) },
    store: { pendingEvents: () => assert.fail('incomplete billing configuration reached work queue') } });
  assert.deepEqual(JSON.parse(result.body), { processed: 0, disabled: true });
});

test('stop is idempotent before the first Factory account exists', async () => {
  const result = await factoryHandler({ httpMethod: 'POST', headers: { authorization: 'Bearer fixture' }, body: JSON.stringify({ action: 'stop' }) },
    { env, fetchImpl: auth, store: { stop: async () => null } });
  assert.deepEqual(JSON.parse(result.body), { auto_post: false });
});
