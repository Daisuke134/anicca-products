const test = require('node:test');
const assert = require('node:assert/strict');
const { createMetaInstagramProvider, encryptToken } = require('../monk-factory-instagram.js');

const userId = '11111111-1111-4111-8111-111111111111';
const env = {
  MONK_FACTORY_META_APP_ID: 'meta-app-id',
  MONK_FACTORY_META_APP_SECRET: 'meta-app-secret',
  MONK_FACTORY_META_CONFIG_ID: 'meta-config-id',
  MONK_FACTORY_META_REDIRECT_URI: 'https://aniccaai.com/.netlify/functions/monk-factory-instagram-oauth',
  MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN: 'private-webhook-verification-token',
  MONK_FACTORY_META_API_VERSION: 'v26.0',
  MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED: 'true',
  MONK_FACTORY_META_STANDARD_ACCESS_EVIDENCE_REF: 'private:meta-app-readback',
  MONK_FACTORY_JOB_SECRET: 'a-private-factory-job-secret-for-tests-only',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

function fakeStore() {
  const states = new Map();
  let credential = null;
  return {
    beginInstagramOAuth: async (id, hash, expiresAt) => { states.set(hash, { userId: id, expiresAt }); },
    consumeInstagramOAuth: async (hash) => {
      const entry = states.get(hash);
      if (!entry || Date.parse(entry.expiresAt) <= Date.now()) return null;
      states.delete(hash);
      return entry.userId;
    },
    saveInstagramCredential: async (id, value) => { credential = { user_id: id, ...value }; },
    instagramCredential: async (id) => credential?.user_id === id ? credential : null,
    getCredential: () => credential,
    stateCount: () => states.size,
  };
}

test('Meta Unified Login uses one-time state, exchanges the code server-side, and encrypts the account token', async () => {
  const store = fakeStore();
  const calls = [];
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, init });
    if (parsed.pathname.endsWith('/oauth/access_token')) {
      assert.equal(parsed.searchParams.get('client_id'), 'meta-app-id');
      assert.equal(parsed.searchParams.get('client_secret'), 'meta-app-secret');
      assert.equal(parsed.searchParams.get('code'), 'one-time-code');
      return json({ access_token: 'raw-meta-user-token', token_type: 'bearer', expires_in: 5184000 });
    }
    if (parsed.pathname.endsWith('/me')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [
      { permission: 'instagram_content_publish', status: 'granted' }, { permission: 'instagram_manage_insights', status: 'granted' },
    ] });
    if (parsed.pathname.endsWith('/17841400000000001')) return json({ id: '17841400000000001', username: 'monk.mujo' });
    throw new Error('unexpected Meta request');
  } });

  const connection = await provider.connectInstagram(userId);
  const login = new URL(connection.accessUrl);
  assert.equal(login.origin + login.pathname, 'https://www.facebook.com/dialog/oauth');
  assert.equal(login.searchParams.get('client_id'), env.MONK_FACTORY_META_APP_ID);
  assert.equal(login.searchParams.get('config_id'), env.MONK_FACTORY_META_CONFIG_ID);
  assert.equal(login.searchParams.get('redirect_uri'), env.MONK_FACTORY_META_REDIRECT_URI);
  assert.equal(login.searchParams.get('response_type'), 'code');
  assert.equal(login.searchParams.get('display'), 'popup');
  const state = login.searchParams.get('state');
  assert.match(state, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(store.stateCount(), 1);

  const result = await provider.completeInstagramOAuth({ code: 'one-time-code', state });
  assert.deepEqual(result, { userId, accountId: '17841400000000001', username: 'monk.mujo', businessId: 'business-1' });
  const saved = store.getCredential();
  assert.equal(saved.user_id, userId);
  assert.equal(saved.instagram_account_id, '17841400000000001');
  assert.equal(saved.instagram_username, 'monk.mujo');
  assert.ok(Math.abs(Date.parse(saved.instagram_access_token_expires_at) - (Date.now() + 5184000000)) < 2000);
  assert.ok(saved.instagram_access_token_ciphertext.startsWith('v1.'));
  assert.ok(!JSON.stringify(saved).includes('raw-meta-user-token'));
  assert.equal(calls.length, 4);

  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state }), { code: 'instagram_oauth_state_invalid' });
  assert.equal(calls.length, 4);
});

test('Meta OAuth does not save an Instagram account when publish permission was not granted', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/oauth/access_token')) return json({ access_token: 'raw-meta-user-token' });
    if (parsed.pathname.endsWith('/me') && parsed.searchParams.has('fields')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [ { permission: 'instagram_manage_insights', status: 'granted' } ] });
    throw new Error('unexpected Meta request');
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') }), { code: 'instagram_publish_permission_required' });
  assert.equal(store.getCredential(), null);
});

test('Meta OAuth does not save an Instagram account when Insights permission was not granted', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/oauth/access_token')) return json({ access_token: 'raw-meta-user-token' });
    if (parsed.pathname.endsWith('/me') && parsed.searchParams.has('fields')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [ { permission: 'instagram_content_publish', status: 'granted' } ] });
    throw new Error('unexpected Meta request');
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') }), { code: 'instagram_insights_permission_required' });
  assert.equal(store.getCredential(), null);
});

test('an invalid Meta access token asks for Instagram reconnection instead of a generic retry', async () => {
  const store = fakeStore();
  await store.saveInstagramCredential(userId, {
    instagram_access_token_ciphertext: encryptToken('raw-meta-user-token', env.MONK_FACTORY_JOB_SECRET),
    instagram_access_token_expires_at: null, instagram_account_id: '17841400000000001', instagram_username: 'monk.mujo',
  });
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async () => json({ error: { code: 190, message: 'invalid token' } }, 400) });
  await assert.rejects(provider.socialState(userId), { code: 'instagram_reconnect_required' });
});

test('an existing Instagram connection whose publish permission was revoked requires reconnect', async () => {
  const store = fakeStore();
  await store.saveInstagramCredential(userId, {
    instagram_access_token_ciphertext: encryptToken('raw-meta-user-token', env.MONK_FACTORY_JOB_SECRET),
    instagram_access_token_expires_at: null, instagram_account_id: '17841400000000001', instagram_username: 'monk.mujo',
  });
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/17841400000000001')) return json({ id: '17841400000000001', username: 'monk.mujo' });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [ { permission: 'instagram_basic', status: 'granted' } ] });
    throw new Error('unexpected Meta request');
  } });
  await assert.rejects(provider.socialState(userId), { code: 'instagram_publish_permission_required' });
});

test('Meta permission rejection at publish is recoverable through Instagram reconnection', async () => {
  const store = fakeStore();
  await store.saveInstagramCredential(userId, {
    instagram_access_token_ciphertext: encryptToken('raw-meta-user-token', env.MONK_FACTORY_JOB_SECRET),
    instagram_access_token_expires_at: null, instagram_account_id: '17841400000000001', instagram_username: 'monk.mujo',
  });
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async () => json({ error: { code: 250, message: 'Permissions error' } }, 400) });
  await assert.rejects(provider.publishInstagramContainer({ userId, accountId: '17841400000000001', containerId: 'container-1', requestId: 'job:publish' }),
    { code: 'instagram_publish_permission_required' });
});

test('Meta Reels publish sends the AI disclosure flag and resolves the published URL before completion', async () => {
  const store = fakeStore();
  const calls = [];
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init) => {
    const parsed = new URL(url);
    calls.push({ parsed, init });
    if (parsed.pathname.endsWith('/oauth/access_token')) return json({ access_token: 'raw-meta-user-token', expires_in: 5184000 });
    if (parsed.pathname.endsWith('/me')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [
      { permission: 'instagram_content_publish', status: 'granted' }, { permission: 'instagram_manage_insights', status: 'granted' },
    ] });
    if (parsed.pathname.endsWith('/17841400000000001')) return json({ id: '17841400000000001', username: 'monk.mujo' });
    if (parsed.pathname.endsWith('/17841400000000001/media') && init.method === 'POST') {
      assert.equal(init.headers.Authorization, 'Bearer raw-meta-user-token');
      assert.deepEqual(JSON.parse(init.body), { media_type: 'REELS', video_url: 'https://files.heygen.ai/final.mp4', caption: 'One mindful breath. Fictional AI monk.', is_ai_generated: true });
      return json({ id: 'container-1' }, 200);
    }
    if (parsed.pathname.endsWith('/container-1')) return json({ id: 'container-1', status_code: 'FINISHED' });
    if (parsed.pathname.endsWith('/17841400000000001/media_publish')) {
      assert.deepEqual(JSON.parse(init.body), { creation_id: 'container-1' });
      return json({ id: 'media-1' });
    }
    if (parsed.pathname.endsWith('/media-1') && parsed.searchParams.get('fields') === 'id,permalink,timestamp') return json({ id: 'media-1', permalink: 'https://www.instagram.com/reel/AbCdEf/', timestamp: '2026-10-25T05:00:00+0000' });
    if (parsed.pathname.endsWith('/media-1/insights')) return json({ data: [{ name: 'views', values: [{ value: 23 }] }] });
    throw new Error('unexpected Meta request: ' + parsed.pathname);
  } });

  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') });
  const social = await provider.socialState(userId);
  assert.equal(social.connected, true);
  assert.equal(social.accountId, '17841400000000001');
  const submitted = await provider.publishInstagram({ userId, accountId: social.accountId, videoUrl: 'https://files.heygen.ai/final.mp4', caption: 'One mindful breath. Fictional AI monk.', requestId: 'job-1:post_submitting' });
  assert.deepEqual(submitted, { id: 'container-1', status: 'pending' });
  assert.deepEqual(await provider.postStatus({ userId, id: 'container-1' }), { id: 'container-1', status: 'ready_to_publish' });
  assert.deepEqual(await provider.publishInstagramContainer({ userId, accountId: social.accountId, containerId: 'container-1', requestId: 'job-1:post_publish' }), { id: 'media-1', status: 'published', containerId: 'container-1' });
  const metrics = await provider.metrics({ userId, postId: 'media-1' });
  assert.equal(metrics.postUrl, 'https://www.instagram.com/reel/AbCdEf/');
  assert.equal(metrics.timestamp, '2026-10-25T05:00:00+0000');
  assert.ok(calls.filter(call => call.init.method === 'POST').length >= 2);
});

test('Meta Insights returns only observed numeric values and keeps attribution to the connected media', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/oauth/access_token')) return json({ access_token: 'raw-meta-user-token', expires_in: 5184000 });
    if (parsed.pathname.endsWith('/me')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [
      { permission: 'instagram_content_publish', status: 'granted' }, { permission: 'instagram_manage_insights', status: 'granted' },
    ] });
    if (parsed.pathname.endsWith('/media-1') && parsed.searchParams.get('fields') === 'id,permalink,timestamp') return json({ id: 'media-1', permalink: 'https://www.instagram.com/reel/AbCdEf/', timestamp: '2026-10-25T05:00:00+0000' });
    if (parsed.pathname.endsWith('/17841400000000001/insights')) {
      assert.fail('insights must use the published media ID');
    }
    if (parsed.pathname.endsWith('/media-1/insights')) {
      assert.equal(init.headers.Authorization, 'Bearer raw-meta-user-token');
      assert.equal(parsed.searchParams.get('metric'), 'views,reach,likes,comments,saved,shares');
      return json({ data: [{ name: 'views', values: [{ value: 23 }] }, { name: 'likes', values: [{ value: 4 }] }, { name: 'reach', values: [{ value: null }] }] });
    }
    throw new Error('unexpected Meta request: ' + parsed.pathname);
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') });
  const result = await provider.metrics({ userId, postId: 'media-1' });
  assert.equal(result.source, 'platform_api');
  assert.deepEqual(result.metrics, { views: 23, likes: 4 });
});

test('an Instagram post with delayed Insights completes URL readback with empty metrics instead of fabricated zeros', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/oauth/access_token')) return json({ access_token: 'raw-meta-user-token', expires_in: 5184000 });
    if (parsed.pathname.endsWith('/me')) return json({ id: 'app-scoped-id', client_business_id: 'business-1' });
    if (parsed.pathname.endsWith('/me/assigned_instagram_accounts')) return json({ data: [{ id: '17841400000000001', username: 'monk.mujo' }] });
    if (parsed.pathname.endsWith('/me/permissions')) return json({ data: [
      { permission: 'instagram_content_publish', status: 'granted' }, { permission: 'instagram_manage_insights', status: 'granted' },
    ] });
    if (parsed.pathname.endsWith('/17841400000000001')) return json({ id: '17841400000000001', username: 'monk.mujo' });
    if (parsed.pathname.endsWith('/media-2') && parsed.searchParams.get('fields') === 'id,permalink,timestamp') return json({ id: 'media-2', permalink: 'https://www.instagram.com/reel/Delayed/', timestamp: '2026-10-25T05:00:00+0000' });
    if (parsed.pathname.endsWith('/media-2/insights')) return json({ data: [] });
    throw new Error('unexpected Meta request: ' + parsed.pathname);
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') });
  const result = await provider.metrics({ userId, postId: 'media-2' });
  assert.equal(result.postUrl, 'https://www.instagram.com/reel/Delayed/');
  assert.deepEqual(result.metrics, {});
});

test('Meta social readiness fails closed when app, callback, webhook, state secret, or access evidence is missing', () => {
  const provider = createMetaInstagramProvider({ env: { ...env, MONK_FACTORY_META_APP_SECRET: '', MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN: '', MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED: '' }, store: fakeStore() });
  const readiness = provider.readiness();
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes('MONK_FACTORY_META_APP_SECRET'));
  assert.ok(readiness.missing.includes('MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN'));
  assert.ok(readiness.unverified.includes('meta_standard_access'));
});
