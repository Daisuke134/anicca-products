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

test('Instagram connection follows one generated avatar and one completed full video, regardless of remaining free quota', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  let account = null;
  let jobs = [];
  let oauthRequests = 0;
  const dependencies = {
    env: configured,
    fetchImpl: auth,
    providers: {
      readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
      connectInstagram: async () => { oauthRequests++; return { accessUrl: 'https://www.facebook.com/dialog/oauth?fixture=1' }; },
    },
    store: {
      companyBudgetStatus: async () => ({ ready: true }),
      usage: async () => ({ videosRemaining: 0, attemptsRemaining: 0, maxSeconds: 20 }),
      account: async () => structuredClone(account),
      jobs: async () => structuredClone(jobs),
      reserveProfile: async () => {},
      setAutopostIntent: async () => ({ auto_post_intent: true }),
    },
  };
  const request = { httpMethod: 'POST', headers: { authorization: 'Bearer fixture-session' }, body: JSON.stringify({ action: 'connect_instagram' }) };
  const beforeAvatar = await factoryHandler(request, dependencies);
  assert.equal(beforeAvatar.statusCode, 409);
  assert.equal(JSON.parse(beforeAvatar.body).error, 'avatar_required');

  account = { user_id: user.id, avatar_id: 'avatar-fixture', social_profile: 'factory_' + user.id };
  const beforeVideo = await factoryHandler(request, dependencies);
  assert.equal(beforeVideo.statusCode, 409);
  assert.equal(JSON.parse(beforeVideo.body).error, 'video_required');

  jobs = [{ id: 'completed-video-fixture', kind: 'video', status: 'completed', video_url: 'https://cdn.example/fixture.mp4' }];
  const afterVideo = await factoryHandler(request, dependencies);
  assert.equal(afterVideo.statusCode, 200);
  assert.equal(JSON.parse(afterVideo.body).url, 'https://www.facebook.com/dialog/oauth?fixture=1');
  assert.equal(oauthRequests, 1);
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

test('an authorized Instagram starts daily automation after the avatar and first full video exist, but Stop stays stopped', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const calls = [];
  let account = { user_id: user.id, subscription_status: 'none', auto_post: false, auto_post_intent: true,
    social_profile: 'factory_' + user.id, connected_at: null, instagram_account_id: null, avatar_id: 'avatar-fixture' };
  const jobs = [{ id: 'completed-video-fixture', kind: 'video', status: 'completed', video_url: 'https://cdn.example/fixture.mp4' }];
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
  assert.equal(connected.jobs[0].kind, 'video');
  assert.deepEqual(calls, ['autopost']);

  account.auto_post = false; account.auto_post_intent = false; // A user Stop must not be undone by the next status refresh.
  const stopped = await factoryHandler(request, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(stopped.statusCode, 200);
  assert.equal(JSON.parse(stopped.body).account.auto_post, false);
  assert.equal(calls.filter(call => call === 'autopost').length, 1);
  assert.equal(calls.filter(call => Array.isArray(call)).length, 0);
});

test('status refresh reads delayed Instagram metrics for at most one owned post and verifies the receipt', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const post = { id: 'posted-video-fixture', kind: 'video', status: 'completed', post_id: 'ig-media-fixture', post_url: 'https://www.instagram.com/reel/fixture/', metrics: {}, metrics_at: null };
  const calls = [];
  const account = { user_id: user.id, auto_post: false, social_profile: 'factory_' + user.id, instagram_account_id: 'ig-account-fixture',
    instagram_username: 'monk_fixture', connected_at: '2026-10-24T00:00:00.000Z' };
  const store = {
    companyBudgetStatus: async () => ({ ready: true }),
    usage: async () => ({ videosRemaining: 0, attemptsRemaining: 0, maxSeconds: 20 }),
    account: async () => structuredClone(account),
    jobs: async () => [structuredClone(post)],
    claimSocial: async () => ({ ...account, social_lease_id: 'social-lease-fixture' }),
    saveSocial: async (_id, _lease, state) => ({ ...account, social_profile: state.profile, instagram_account_id: state.accountId,
      instagram_username: state.handle, connected_at: account.connected_at, social_checked_at: new Date().toISOString() }),
    releaseSocial: async () => {},
    staleMetricsJob: async (_id, cutoff) => { calls.push(['stale', _id, cutoff]); return { ...post, user_id: user.id }; },
    claimMetricsRefresh: async (_id, jobId, postId, cutoff, retryCutoff, checkedAt) => {
      calls.push(['claim', _id, jobId, postId, cutoff, retryCutoff, checkedAt]);
      return { ...post, metrics_checked_at: checkedAt };
    },
    saveMetrics: async (_id, jobId, postId, _checkedAt, metrics, metricsAt) => {
      calls.push(['save', _id, jobId, postId, { metrics, metrics_at: metricsAt }]);
      Object.assign(post, { metrics, metrics_at: metricsAt });
      return { id: jobId, metrics, metrics_at: metricsAt };
    },
  };
  const providers = {
    readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => ({ profile: 'factory_' + user.id, connected: true, accountId: account.instagram_account_id, handle: 'monk_fixture' }),
    metrics: async input => {
      calls.push(['metrics', input]);
      return { postId: 'ig-media-fixture', postUrl: post.post_url, profile: 'factory_' + user.id, source: 'platform_api', metrics: { views: 700 } };
    },
  };
  const response = await factoryHandler({ httpMethod: 'GET', headers: { authorization: 'Bearer fixture-session' } }, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(response.statusCode, 200);
  assert.equal(calls.filter(call => call[0] === 'metrics').length, 1);
  assert.equal(calls.find(call => call[0] === 'metrics')[1].postId, 'ig-media-fixture');
  assert.deepEqual(calls.find(call => call[0] === 'save')[4].metrics, { views: 700 });
  assert.deepEqual(post.metrics, { views: 700 });
  assert.ok(post.metrics_at);
  assert.equal(JSON.parse(response.body).jobs[0].metrics.views, 700);
  assert.equal(JSON.parse(response.body).jobs[0].post_id, undefined);
  assert.equal(JSON.parse(response.body).jobs[0].metrics_checked_at, undefined);
});

test('status refresh does not save delayed metrics when provider post identity mismatches', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const post = { id: 'posted-video-fixture', kind: 'video', status: 'completed', post_id: 'ig-media-fixture', post_url: 'https://www.instagram.com/reel/fixture/', metrics: {}, metrics_at: null };
  const calls = [];
  const account = { user_id: user.id, auto_post: false, social_profile: 'factory_' + user.id, instagram_account_id: 'ig-account-fixture', connected_at: '2026-10-24T00:00:00.000Z' };
  const store = {
    companyBudgetStatus: async () => ({ ready: true }), usage: async () => ({ videosRemaining: 0, attemptsRemaining: 0, maxSeconds: 20 }),
    account: async () => structuredClone(account), jobs: async () => [structuredClone(post)],
    claimSocial: async () => ({ ...account, social_lease_id: 'social-lease-fixture' }), saveSocial: async (_id, _lease, state) => ({ ...account, ...state }), releaseSocial: async () => {},
    staleMetricsJob: async () => ({ ...post, user_id: user.id }),
    claimMetricsRefresh: async () => ({ ...post, user_id: user.id }),
    saveMetrics: async () => { calls.push('save'); },
  };
  const providers = {
    readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => ({ profile: 'factory_' + user.id, connected: true, accountId: account.instagram_account_id, handle: 'monk_fixture' }),
    metrics: async () => ({ postId: 'different-post', postUrl: post.post_url, profile: 'factory_' + user.id, source: 'platform_api', metrics: { views: 999 } }),
  };
  const response = await factoryHandler({ httpMethod: 'GET', headers: { authorization: 'Bearer fixture-session' } }, { env: configured, fetchImpl: auth, store, providers });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, []);
  assert.deepEqual(post.metrics, {});
  assert.equal(post.metrics_at, null);
});

test('Stop during Instagram OAuth prevents a later connection readback from starting automation', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  let connected = false;
  let account = { user_id: user.id, subscription_status: 'none', auto_post: false, auto_post_intent: false,
    social_profile: 'factory_' + user.id, social_submit_started_at: '2026-10-24T00:00:00.000Z', connected_at: null, instagram_account_id: null, avatar_id: 'avatar-fixture' };
  let autopostStarts = 0;
  const store = {
    companyBudgetStatus: async () => ({ ready: true }),
    usage: async () => ({ videosRemaining: 3, attemptsRemaining: 3, maxSeconds: 20, periodEnd: null }),
    account: async () => structuredClone(account),
    reserveProfile: async () => {},
    setAutopostIntent: async (_id, enabled) => { account.auto_post_intent = enabled; return { auto_post_intent: enabled }; },
    stop: async () => { account.auto_post = false; account.auto_post_intent = false; return { auto_post: false }; },
    jobs: async () => [{ id: 'completed-video-fixture', kind: 'video', status: 'completed', video_url: 'https://cdn.example/fixture.mp4' }],
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

test('a lost Instagram publishing permission is shown as reconnect-required and Connect starts fresh OAuth', async () => {
  const configured = { ...env, MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long' };
  const account = { user_id: user.id, subscription_status: 'none', auto_post: true, auto_post_intent: false,
    social_profile: 'factory_' + user.id, instagram_account_id: 'ig-opaque-fixture', connected_at: new Date().toISOString(),
    avatar_id: 'avatar-fixture' };
  let oauthCalls = 0;
  const store = {
    companyBudgetStatus: async () => ({ ready: true }),
    usage: async () => ({ videosRemaining: 2, attemptsRemaining: 2, maxSeconds: 20, periodEnd: null }),
    account: async () => structuredClone(account),
    jobs: async () => [{ id: 'completed-video-fixture', kind: 'video', status: 'completed', video_url: 'https://cdn.example/fixture.mp4' }],
    claimSocial: async () => ({ ...account, social_lease_id: 'social-lease-fixture' }),
    releaseSocial: async () => {},
    reserveProfile: async () => {},
    setAutopostIntent: async () => ({ auto_post_intent: true }),
  };
  const providers = {
    readiness: async () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => { throw Object.assign(new Error('instagram_publish_permission_required'), { code: 'instagram_publish_permission_required', status: 409 }); },
    connectInstagram: async () => { oauthCalls++; return { accessUrl: 'https://www.facebook.com/dialog/oauth?reconnect=1' }; },
  };
  const headers = { authorization: 'Bearer fixture-session' };
  const status = await factoryHandler({ httpMethod: 'GET', headers }, { env: configured, fetchImpl: auth, store, providers });
  const snapshot = JSON.parse(status.body);
  assert.equal(status.statusCode, 200);
  assert.equal(snapshot.account.connected, false);
  assert.equal(snapshot.account.instagram_reauth_required, true);

  const reconnect = await factoryHandler({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'connect_instagram' }) },
    { env: configured, fetchImpl: auth, store, providers });
  assert.equal(reconnect.statusCode, 200);
  assert.equal(JSON.parse(reconnect.body).url, 'https://www.facebook.com/dialog/oauth?reconnect=1');
  assert.equal(oauthCalls, 1);
});
