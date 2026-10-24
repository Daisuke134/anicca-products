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

test('Stripe setup does not block an authenticated free video and Checkout waits for the lifetime allowance', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  const dependencies = { env: configured, fetchImpl: auth, syncBilling: async () => null,
    providers: { readiness: async () => ({ generation: { ready: true }, social: { ready: false } }) },
    store: {
      companyBudgetStatus: async () => ({ ready: true }),
      account: async id => { calls.push(['account', id]); return null; },
      usage: async id => { calls.push(['usage', id]); return { videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20, periodEnd: null }; },
      reserveJob: async (id, occurrence, kind) => { calls.push(['reserve', id, occurrence, kind]); return { id: 'free-job-fixture' }; },
      checkoutContext: async () => assert.fail('free quota must be used before Checkout is created'),
    } };
  const request = { headers: { authorization: 'Bearer fixture-session' } };
  const avatar = await factoryHandler({ ...request, httpMethod: 'POST', body: JSON.stringify({ action: 'generate_avatar' }) }, dependencies);
  assert.equal(avatar.statusCode, 202);
  assert.equal(JSON.parse(avatar.body).jobId, 'free-job-fixture');
  const checkout = await factoryHandler({ ...request, httpMethod: 'POST', body: JSON.stringify({ action: 'checkout' }) }, dependencies);
  assert.equal(checkout.statusCode, 409);
  assert.equal(JSON.parse(checkout.body).error, 'free_quota_remaining');
  assert.deepEqual(calls, [['usage', user.id], ['account', user.id], ['reserve', user.id, 'avatar:lifetime', 'avatar'], ['usage', user.id]]);
});

test('checkout readiness is separate from generation readiness', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const response = await factoryHandler({ httpMethod: 'GET', headers: { authorization: 'Bearer fixture-session' } }, {
    env: configured, fetchImpl: auth,
    providers: { readiness: async () => ({ generation: { ready: true }, social: { ready: false } }) },
    store: { companyBudgetStatus: async () => ({ ready: true }), usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20 }), account: async () => null, jobs: async () => [] },
  });
  assert.equal(response.statusCode, 200);
  const snapshot = JSON.parse(response.body);
  assert.equal(snapshot.readiness.generation.ready, true);
  assert.equal(snapshot.readiness.checkout.ready, false);
  assert.equal(snapshot.readiness.social.ready, false);
  assert.equal(snapshot.usage.videosRemaining, 3);
});

test('company daily budget exhaustion keeps generation disabled and returns its reason before reserving a job', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  const dependencies = {
    env: configured,
    fetchImpl: auth,
    providers: { readiness: async () => ({ generation: { ready: true }, social: { ready: true } }) },
    store: {
      companyBudgetStatus: async () => ({ ready: false, reason: 'company_budget_exhausted' }),
      usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20 }),
      account: async () => null,
      jobs: async () => [],
      reserveJob: async () => { calls.push('reserve'); return { id: 'should-not-reserve' }; },
    },
  };
  const headers = { authorization: 'Bearer fixture-session' };
  const status = await factoryHandler({ httpMethod: 'GET', headers }, dependencies);
  const snapshot = JSON.parse(status.body);
  assert.equal(status.statusCode, 200);
  assert.deepEqual(snapshot.readiness.generation, { ready: false, reason: 'company_budget_exhausted' });
  assert.equal(snapshot.readiness.social.ready, false);
  assert.equal(snapshot.readiness.checkout.ready, false);

  const generated = await factoryHandler({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'generate_avatar' }) }, dependencies);
  assert.equal(generated.statusCode, 429);
  assert.equal(JSON.parse(generated.body).error, 'company_budget_exhausted');
  assert.deepEqual(calls, []);
});

test('an existing idempotent job can be recovered after the company budget is exhausted', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  const occurrence = '12345678-1234-4234-8234-123456789abc';
  const dependencies = {
    env: configured,
    fetchImpl: auth,
    providers: { readiness: async () => ({ generation: { ready: true }, social: { ready: true } }) },
    store: {
      companyBudgetStatus: async () => ({ ready: false, reason: 'company_budget_exhausted' }),
      jobByOccurrence: async (id, key) => { calls.push(['lookup', id, key]); return { id: 'reserved-job', kind: 'video' }; },
      reserveJob: async () => { calls.push(['reserve']); return { id: 'new-job' }; },
    },
  };
  const response = await factoryHandler({
    httpMethod: 'POST', headers: { authorization: 'Bearer fixture-session', 'idempotency-key': occurrence },
    body: JSON.stringify({ action: 'generate_video' }),
  }, dependencies);
  assert.equal(response.statusCode, 202);
  assert.deepEqual(JSON.parse(response.body), { jobId: 'reserved-job' });
  assert.deepEqual(calls, [['lookup', user.id, 'manual:' + occurrence]]);
});

test('a missing company budget guard fails closed before generation', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  const dependencies = {
    env: configured,
    fetchImpl: auth,
    providers: { readiness: async () => ({ generation: { ready: true }, social: { ready: true } }) },
    store: {
      usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20 }),
      account: async () => null,
      jobs: async () => [],
      reserveJob: async () => { calls.push('reserve'); return { id: 'should-not-reserve' }; },
    },
  };
  const headers = { authorization: 'Bearer fixture-session' };
  const status = await factoryHandler({ httpMethod: 'GET', headers }, dependencies);
  assert.deepEqual(JSON.parse(status.body).readiness.generation, { ready: false, reason: 'spend_cap_setup' });
  const generated = await factoryHandler({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'generate_avatar' }) }, dependencies);
  assert.equal(generated.statusCode, 503);
  assert.equal(JSON.parse(generated.body).error, 'spend_cap_setup');
  assert.deepEqual(calls, []);
});

test('a newly connected Instagram starts daily creation and one default avatar, but a stopped account stays stopped', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  let account = { user_id: user.id, subscription_status: 'none', auto_post: false, auto_post_intent: true,
    social_profile: 'factory_' + user.id, connected_at: null, instagram_account_id: null, avatar_id: null };
  const jobs = [];
  const store = {
    companyBudgetStatus: async () => ({ ready: true }),
    usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20, periodEnd: null }),
    account: async () => structuredClone(account),
    jobs: async () => structuredClone(jobs),
    claimSocial: async () => ({ ...account, social_lease_id: 'social-lease-fixture' }),
    saveSocial: async (_id, _lease, state) => {
      account = { ...account, social_profile: state.profile, instagram_account_id: state.accountId,
        instagram_username: state.handle, connected_at: state.connected ? (account.connected_at || new Date().toISOString()) : null,
        social_checked_at: new Date().toISOString() };
      return structuredClone(account);
    },
    releaseSocial: async () => {},
    setAutopost: async () => { calls.push('autopost'); account.auto_post = true; return { auto_post: true }; },
    reserveJob: async (_id, occurrence, kind, origin) => {
      calls.push(['reserve', occurrence, kind, origin]);
      const job = { id: 'avatar-job-fixture', kind, status: 'reserved', origin };
      jobs.push(job);
      return job;
    },
  };
  const providers = {
    readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => ({ profile: 'factory_' + user.id, connected: true, accountId: 'ig-opaque-fixture', handle: 'monk_fixture' }),
  };
  const request = { httpMethod: 'GET', headers: { authorization: 'Bearer fixture-session' } };
  const first = await factoryHandler(request, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(first.statusCode, 200);
  const connected = JSON.parse(first.body);
  assert.equal(connected.account.connected, true);
  assert.equal(connected.account.auto_post, true);
  assert.equal(connected.jobs[0].kind, 'avatar');
  assert.deepEqual(calls, ['autopost', ['reserve', 'avatar:lifetime', 'avatar', 'auto']]);

  account.auto_post = false; account.auto_post_intent = false; // A user Stop must not be undone by the next status refresh.
  const stopped = await factoryHandler(request, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(stopped.statusCode, 200);
  assert.equal(JSON.parse(stopped.body).account.auto_post, false);
  assert.equal(calls.filter(call => call === 'autopost').length, 1);
  assert.equal(calls.filter(call => Array.isArray(call)).length, 1);
});

test('Stop during Instagram OAuth prevents a later connection readback from starting automation', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  let connected = false;
  let account = { user_id: user.id, subscription_status: 'none', auto_post: false, auto_post_intent: false,
    social_profile: 'factory_' + user.id, social_submit_started_at: '2026-10-24T00:00:00.000Z', connected_at: null, instagram_account_id: null };
  let autopostStarts = 0;
  const store = {
    companyBudgetStatus: async () => ({ ready: true }),
    usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20, periodEnd: null }),
    account: async () => structuredClone(account),
    reserveProfile: async () => {},
    setAutopostIntent: async (_id, enabled) => { account.auto_post_intent = enabled; return { auto_post_intent: enabled }; },
    stop: async () => { account.auto_post = false; account.auto_post_intent = false; return { auto_post: false }; },
    jobs: async () => [],
    claimSocial: async () => ({ ...account, social_lease_id: 'social-lease-fixture' }),
    saveSocial: async (_id, _lease, state) => {
      account = { ...account, social_profile: state.profile, instagram_account_id: state.accountId,
        connected_at: state.connected ? (account.connected_at || new Date().toISOString()) : null,
        social_checked_at: new Date().toISOString() };
      return structuredClone(account);
    },
    releaseSocial: async () => {},
    setAutopost: async () => { autopostStarts++; account.auto_post = true; return { auto_post: true }; },
    reserveJob: async () => assert.fail('Stop during OAuth must prevent avatar generation'),
  };
  const providers = {
    readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => ({ profile: 'factory_' + user.id, connected, accountId: connected ? 'ig-opaque-fixture' : null, handle: 'monk_fixture' }),
    connectInstagram: async () => ({ accessUrl: 'https://instagram.example/authorize' }),
  };
  const authHeader = { authorization: 'Bearer fixture-session' };
  const connect = await factoryHandler({ httpMethod: 'POST', headers: authHeader, body: JSON.stringify({ action: 'connect_instagram' }) },
    { env: configured, fetchImpl: auth, store, providers });
  assert.equal(connect.statusCode, 200);
  assert.equal(account.auto_post_intent, true);
  const pending = await factoryHandler({ httpMethod: 'GET', headers: authHeader }, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(JSON.parse(pending.body).account.auto_post_intent, true);
  assert.equal(JSON.parse(pending.body).account.auto_post, false);
  await factoryHandler({ httpMethod: 'POST', headers: authHeader, body: JSON.stringify({ action: 'stop' }) }, { env: configured, fetchImpl: auth, store });
  connected = true;
  const status = await factoryHandler({ httpMethod: 'GET', headers: authHeader }, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(status.statusCode, 200);
  assert.equal(JSON.parse(status.body).account.auto_post, false);
  assert.equal(autopostStarts, 0);
});
