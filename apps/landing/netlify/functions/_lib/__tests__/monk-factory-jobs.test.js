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
  const store = { account: async () => account, companyBudgetStatus: async () => ({ ready: true }), reserveJob: async (...args) => { calls.push(args); return { id: key }; } };
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

test('script evidence retains only supplied numeric token usage without inventing missing counts', async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  const account = { user_id: user.id, avatar_id: 'avatar_fixture', stripe_subscription_id: 'sub_fixture', subscription_status: 'trialing',
    trial_start: new Date(Date.now() - 60000).toISOString(), trial_end: new Date(Date.now() + 60000).toISOString() };
  const job = { id: key, user_id: user.id, kind: 'video', origin: 'manual', stage: 'reserved', period_key: 'trial:sub_fixture', max_seconds: 20 };
  let saved; let posts = 0;
  const store = { account: async () => account, advanceJob: async (row, patch) => (saved = { ...row, ...patch }) };
  await advanceFactoryJob({ job, store, env, syncBilling: async () => account, loadPlaybooks: async () => [{ id: 'source_fixture' }],
    providers: { readiness: () => ({ ready: true }), createScript: async () => {
      posts++;
      return { id: 'script_fixture', script: 'Pause.', caption: 'One breath.', sourceIds: ['source_fixture'],
        usage: { inputTokens: 0, outputTokens: 4, thoughtTokens: '3', totalTokens: -1, raw: 'private-thought-fixture', apiKey: 'private-key-fixture', reservedUsd: 99 } };
    } } });
  assert.equal(saved.stage, 'script_ready');
  assert.equal(saved.script, 'Pause. For the full guide, see The Art of AI Monks at aniccaai.com.');
  assert.match(saved.caption, /The Art of AI Monks/);
  assert.match(saved.caption, /https:\/\/aniccaai\.com\/the-art-of-ai-monks/);
  assert.equal(posts, 1);
  assert.deepEqual(saved.evidence.script_submitting.usage, { inputTokens: 0, outputTokens: 4 });
  assert.equal(JSON.stringify(saved.evidence).includes('private-'), false);
});

test('image completion retains numeric token usage in its private blob and evidence', async () => {
  const { runFactoryImage, signImageTicket } = require('../monk-factory-jobs.js');
  const account = { user_id: user.id, stripe_subscription_id: 'sub_fixture', subscription_status: 'trialing',
    trial_start: new Date(Date.now() - 60000).toISOString(), trial_end: new Date(Date.now() + 60000).toISOString() };
  const expiresAt = Date.now() + 60000;
  let job = { id: key, user_id: user.id, kind: 'avatar', origin: 'manual', stage: 'image_pending', period_key: 'trial:sub_fixture', max_seconds: 20,
    image_nonce: user.id, image_ticket_until: new Date(expiresAt).toISOString() };
  let posts = 0; const blobs = new Map();
  const store = { account: async () => account, job: async () => job, claimJob: async () => job, advanceJob: async (row, patch) => {
    job = { ...row, ...patch, evidence: { ...row.evidence, ...patch.evidence } };
    return job;
  } };
  const images = { put: async (key, value) => blobs.set(key, value), get: async key => blobs.get(key) };
  const providers = { readiness: () => ({ ready: true }), createAvatarImage: async () => {
    posts++;
    return { id: 'image_fixture', imageBase64: '/9j/2Q==', mediaType: 'image/jpeg',
      usage: { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139, raw: 'private-thought-fixture', apiKey: 'private-key-fixture' } };
  } };
  await runFactoryImage({ ticket: signImageTicket({ jobId: key, nonce: user.id, expiresAt }, env), store, providers, images, env, syncBilling: async () => account });
  assert.equal(job.stage, 'image_ready');
  assert.deepEqual(blobs.get('images/' + key), { jobId: key, userId: user.id, receiptId: 'image_fixture', imageBase64: '/9j/2Q==', mediaType: 'image/jpeg',
    usage: { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139 } });
  assert.deepEqual(job.evidence.image_readback.usage, { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139 });
  assert.equal(posts, 1);
  assert.equal(JSON.stringify(job.evidence).includes('private-'), false);
});

test('fenced image recovery restores numeric blob usage without another provider POST', async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  const job = { id: key, user_id: user.id, kind: 'avatar', stage: 'image_submitting' };
  let saved;
  await advanceFactoryJob({ job, env, store: { advanceJob: async (row, patch) => (saved = { ...row, ...patch }) },
    providers: { createAvatarImage: () => assert.fail('recovery repeated the image POST') },
    images: { get: async () => ({ jobId: key, userId: user.id, receiptId: 'image_fixture', imageBase64: '/9j/2Q==', mediaType: 'image/jpeg',
      usage: { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139, raw: 'private-thought-fixture' } }) } });
  assert.equal(saved.stage, 'image_ready');
  assert.deepEqual(saved.evidence.image_recovery.usage, { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139 });
  assert.equal(saved.evidence.image_recovery.provider_receipt_id, 'image_fixture');
  assert.equal(JSON.stringify(saved.evidence).includes('private-'), false);
});

test('a successful Meta media_publish response is saved for metrics recovery after a lost DB write', async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  let account = { user_id: user.id, auto_post: true, instagram_account_id: 'ig_fixture', connected_at: new Date().toISOString(),
    social_profile: 'factory_' + user.id, social_checked_at: new Date(Date.now() - 61000).toISOString(),
    stripe_subscription_id: null, avatar_id: 'avatar_fixture' };
  let saved = { id: key, user_id: user.id, kind: 'video', origin: 'auto', stage: 'post_pending', status: 'processing',
    lease_id: '22222222-2222-4222-8222-222222222222', lease_until: new Date(Date.now() + 30000).toISOString(),
    period_key: 'free:lifetime', max_seconds: 20, autopost_requested: true, post_provider_id: 'container_fixture', evidence: {} };
  let writeAttempts = 0; let publishCalls = 0; let socialStateCalls = 0;
  const store = {
    account: async () => structuredClone(account),
    job: async () => saved,
    claimSocial: async () => ({ ...account, social_lease_id: '33333333-3333-4333-8333-333333333333' }),
    saveSocial: async (_id, _lease, state) => (account = { ...account, ...state, social_checked_at: new Date().toISOString() }),
    releaseSocial: async () => {},
    fenceInstagramPublish: async () => {
      if (Date.now() - Date.parse(account.social_checked_at) >= 60000) throw Object.assign(new Error('instagram_required'), { code: 'instagram_required', status: 409 });
      return true;
    },
    advanceJob: async (row, patch) => {
      if (patch.stage === 'published' && writeAttempts++ < 2) throw Object.assign(new Error(), { code: 'store_unavailable', status: 503 });
      saved = { ...saved, ...patch, evidence: { ...saved.evidence, ...patch.evidence } };
      return saved;
    },
  };
  const providers = {
    readiness: () => ({ generation: { ready: false, reason: 'provider_setup' }, social: { ready: true } }),
    postStatus: async () => ({ id: 'container_fixture', status: 'ready_to_publish' }),
    socialState: async () => { socialStateCalls++; return { profile: 'factory_' + user.id, connected: true, accountId: 'ig_fixture', handle: 'monk.mujo' }; },
    publishInstagramContainer: async () => { publishCalls++; return { id: 'media_fixture', status: 'published' }; },
    metrics: async () => assert.fail('the same tick must not skip the published stage'),
  };
  await advanceFactoryJob({ job: saved, store, providers, env, syncBilling: async () => account });
  assert.equal(socialStateCalls, 1, 'a stale one-minute publish fence needs a fresh Instagram identity read');
  assert.equal(publishCalls, 1);
  assert.equal(saved.stage, 'published');
  assert.equal(saved.status, 'processing');
  assert.equal(saved.post_id, 'media_fixture');
  assert.equal(saved.evidence.publish_fence.effect, 'confirmed');
  assert.equal(saved.evidence.media_publish_recovery.provider_receipt_id, 'media_fixture');
});

test('an Instagram reconnect requirement keeps a pending post retryable for recovery', async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  const job = { id: key, user_id: user.id, kind: 'video', origin: 'auto', stage: 'post_pending', status: 'processing',
    lease_id: '22222222-2222-4222-8222-222222222222', lease_until: new Date(Date.now() + 30000).toISOString(),
    period_key: 'free:lifetime', max_seconds: 20, autopost_requested: true, post_provider_id: 'container_fixture', evidence: {} };
  let saved;
  await advanceFactoryJob({ job, store: { advanceJob: async (row, patch) => (saved = { ...row, ...patch }) }, env,
    providers: { postStatus: async () => { throw Object.assign(new Error('instagram_reconnect_required'), { code: 'instagram_reconnect_required', status: 409 }); } } });
  assert.equal(saved.status, 'processing');
  assert.equal(saved.stage, 'post_pending');
  assert.equal(saved.error_class, 'instagram_reconnect_required');
  assert.ok(Date.parse(saved.next_run_at) > Date.now());
  assert.equal(saved.evidence.post_pending.next_action, 'instagram_reconnect');
});

test('a successful Meta container response is saved for status polling after a lost DB write', async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  const account = { user_id: user.id, auto_post: true, instagram_account_id: 'ig_fixture', connected_at: new Date().toISOString(),
    stripe_subscription_id: null, avatar_id: 'avatar_fixture', social_profile: 'factory_' + user.id };
  let saved = { id: key, user_id: user.id, kind: 'video', origin: 'auto', stage: 'post_ready', status: 'processing',
    lease_id: '22222222-2222-4222-8222-222222222222', lease_until: new Date(Date.now() + 30000).toISOString(),
    period_key: 'free:lifetime', max_seconds: 20, autopost_requested: true, video_url: 'https://fixture.example/video.mp4',
    caption: 'Fictional AI-generated monk. Pause.', evidence: {} };
  let writeAttempts = 0; let createCalls = 0;
  const store = {
    account: async () => account,
    job: async () => saved,
    claimSocial: async () => ({ ...account, social_lease_id: '33333333-3333-4333-8333-333333333333' }),
    saveSocial: async (_id, _lease, state) => ({ ...account, ...state, social_lease_id: '33333333-3333-4333-8333-333333333333' }),
    releaseSocial: async () => {},
    advanceJob: async (row, patch) => {
      if (patch.stage === 'post_pending' && patch.post_provider_id === 'container_fixture' && writeAttempts++ < 2) throw Object.assign(new Error(), { code: 'store_unavailable', status: 503 });
      saved = { ...saved, ...patch, evidence: { ...saved.evidence, ...patch.evidence } };
      return saved;
    },
  };
  const providers = {
    readiness: () => ({ generation: { ready: true }, social: { ready: true } }),
    socialState: async () => ({ profile: 'factory_' + user.id, connected: true, accountId: 'ig_fixture', handle: 'monk.mujo' }),
    publishInstagram: async () => { createCalls++; return { id: 'container_fixture', status: 'pending' }; },
    postStatus: async () => assert.fail('the same tick must not poll before the receipt is saved'),
  };
  await advanceFactoryJob({ job: saved, store, providers, env, syncBilling: async () => account });
  assert.equal(createCalls, 1);
  assert.equal(saved.stage, 'post_pending');
  assert.equal(saved.status, 'processing');
  assert.equal(saved.post_provider_id, 'container_fixture');
  assert.equal(saved.evidence.container_create_recovery.provider_receipt_id, 'container_fixture');
});


test('an incomplete paid image keeps returned numeric usage and receipt in unknown-effect evidence without retry', async () => {
  const { runFactoryImage, signImageTicket } = require('../monk-factory-jobs.js');
  const account = { user_id: user.id, stripe_subscription_id: 'sub_fixture', subscription_status: 'trialing',
    trial_start: new Date(Date.now() - 60000).toISOString(), trial_end: new Date(Date.now() + 60000).toISOString() };
  const expiresAt = Date.now() + 60000;
  let job = { id: key, user_id: user.id, kind: 'avatar', origin: 'manual', stage: 'image_pending', period_key: 'trial:sub_fixture', max_seconds: 20,
    image_nonce: user.id, image_ticket_until: new Date(expiresAt).toISOString() };
  let posts = 0;
  const store = { account: async () => account, job: async () => job, claimJob: async () => job, advanceJob: async (row, patch) => (job = { ...row, ...patch, evidence: { ...row.evidence, ...patch.evidence } }) };
  const providers = { readiness: () => ({ ready: true }), createAvatarImage: async () => {
    posts++; throw Object.assign(new Error('provider_effect_unknown'), { code: 'provider_effect_unknown', effect: 'unknown', providerReceiptId: 'incomplete_image', usage: { thoughtTokens: 37, raw: 'private thought' } });
  } };
  await runFactoryImage({ ticket: signImageTicket({ jobId: key, nonce: user.id, expiresAt }, env), store, providers, images: { put: () => assert.fail('incomplete image stored') }, env, syncBilling: async () => account });
  assert.equal(job.stage, 'image_submitting');
  assert.equal(job.status, 'effect_unknown');
  assert.equal(job.evidence.image_error.provider_receipt_id, 'incomplete_image');
  assert.deepEqual(job.evidence.image_error.usage, { thoughtTokens: 37 });
  assert.ok(!JSON.stringify(job.evidence).includes('private thought'));
  assert.equal(posts, 1);
});


test('a failed private blob write keeps the completed image receipt and usage without another generation', async () => {
  const { runFactoryImage, signImageTicket, advanceFactoryJob } = require('../monk-factory-jobs.js');
  const account = { user_id: user.id, stripe_subscription_id: 'sub_fixture', subscription_status: 'trialing',
    trial_start: new Date(Date.now() - 60000).toISOString(), trial_end: new Date(Date.now() + 60000).toISOString() };
  const expiresAt = Date.now() + 60000;
  let job = { id: key, user_id: user.id, kind: 'avatar', origin: 'manual', stage: 'image_pending', period_key: 'trial:sub_fixture', max_seconds: 20,
    image_nonce: user.id, image_ticket_until: new Date(expiresAt).toISOString() };
  let posts = 0;
  const store = { account: async () => account, job: async () => job, claimJob: async () => job, advanceJob: async (row, patch) => (job = { ...row, ...patch, evidence: { ...row.evidence, ...patch.evidence } }) };
  const providers = { readiness: () => ({ ready: true }), createAvatarImage: async () => {
    posts++; return { id: 'completed_image_1', imageBase64: '/9j/2Q==', mediaType: 'image/jpeg', usage: { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139 } };
  } };
  const images = { put: async () => { throw Object.assign(new Error('image_storage_unavailable'), { code: 'image_storage_unavailable' }); }, get: async () => null };
  await runFactoryImage({ ticket: signImageTicket({ jobId: key, nonce: user.id, expiresAt }, env), store, providers, images, env, syncBilling: async () => account });
  assert.equal(job.stage, 'image_submitting');
  assert.equal(job.status, 'effect_unknown');
  assert.equal(job.evidence.image_error.provider_receipt_id, 'completed_image_1');
  assert.deepEqual(job.evidence.image_error.usage, { inputTokens: 19, outputTokens: 1120, thoughtTokens: 0, totalTokens: 1139 });
  await advanceFactoryJob({ job, store, providers, images, env, syncBilling: async () => account });
  assert.equal(job.status, 'effect_unknown');
  assert.equal(posts, 1);
});
