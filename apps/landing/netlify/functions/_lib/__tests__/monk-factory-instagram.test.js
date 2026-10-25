const test = require('node:test');
const assert = require('node:assert/strict');
const { createMetaInstagramProvider, encryptToken, decryptToken } = require('../monk-factory-instagram.js');

const userId = '11111111-1111-4111-8111-111111111111';
const instagramUserId = '17841400000000001';
const requiredScopes = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_insights',
];
const env = {
  MONK_FACTORY_INSTAGRAM_APP_ID: 'instagram-app-id',
  MONK_FACTORY_INSTAGRAM_APP_SECRET: 'instagram-app-secret',
  MONK_FACTORY_META_APP_SECRET: 'meta-app-secret',
  MONK_FACTORY_META_REDIRECT_URI: 'https://aniccaai.com/.netlify/functions/monk-factory-instagram-oauth',
  MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN: 'private-webhook-verification-token',
  MONK_FACTORY_META_API_VERSION: 'v26.0',
  MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED: 'true',
  MONK_FACTORY_META_STANDARD_ACCESS_EVIDENCE_REF: 'private:instagram-standard-access-readback',
  MONK_FACTORY_JOB_SECRET: 'a-private-factory-job-secret-for-tests-only',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

function fakeStore() {
  const states = new Map();
  let credential = null;
  return {
    beginInstagramOAuth: async (id, hash, expiresAt) => { states.set(hash, { userId: id, expiresAt }); },
    consumeInstagramOAuth: async hash => {
      const entry = states.get(hash);
      if (!entry || Date.parse(entry.expiresAt) <= Date.now()) return null;
      states.delete(hash);
      return entry.userId;
    },
    saveInstagramCredential: async (id, value) => { credential = { ...credential, user_id: id, ...value }; },
    instagramCredential: async id => credential?.user_id === id ? credential : null,
    getCredential: () => credential,
    stateCount: () => states.size,
  };
}

function instagramOAuthResponse(url, init, permissions = requiredScopes) {
  const parsed = new URL(url);
  if (parsed.origin === 'https://api.instagram.com' && parsed.pathname === '/oauth/access_token') {
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['Content-Type'], undefined);
    assert.ok(init.body instanceof FormData);
    const form = init.body;
    assert.equal(form.get('client_id'), env.MONK_FACTORY_INSTAGRAM_APP_ID);
    assert.equal(form.get('client_secret'), env.MONK_FACTORY_INSTAGRAM_APP_SECRET);
    assert.equal(form.get('grant_type'), 'authorization_code');
    assert.equal(form.get('redirect_uri'), env.MONK_FACTORY_META_REDIRECT_URI);
    assert.equal(form.get('code'), 'one-time-code');
    return json({ access_token: 'short-lived-token', user_id: instagramUserId, permissions: permissions.join(',') });
  }
  if (parsed.origin === 'https://graph.instagram.com' && parsed.pathname.endsWith('/access_token')) {
    assert.equal(parsed.searchParams.get('grant_type'), 'ig_exchange_token');
    assert.equal(parsed.searchParams.get('client_secret'), env.MONK_FACTORY_INSTAGRAM_APP_SECRET);
    assert.equal(parsed.searchParams.get('access_token'), 'short-lived-token');
    return json({ access_token: 'raw-instagram-user-token', token_type: 'bearer', expires_in: 5184000 });
  }
  if (parsed.origin === 'https://graph.instagram.com' && (parsed.pathname.endsWith('/me') || parsed.pathname.endsWith('/' + instagramUserId))) {
    return json({ user_id: instagramUserId, username: 'monk.mujo' });
  }
  return null;
}

async function connectWithScopes({ store, permissions = requiredScopes, onRequest = () => {} }) {
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init = {}) => {
    onRequest(new URL(url), init);
    const response = instagramOAuthResponse(url, init, permissions);
    if (response) return response;
    throw new Error('unexpected Instagram request: ' + new URL(url).pathname);
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  const result = await provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') });
  return { provider, login, result };
}

test('Instagram Login uses one-time state, current scopes, short-to-long token exchange, and encrypted storage', async () => {
  const store = fakeStore();
  const calls = [];
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init = {}) => {
    calls.push(new URL(url));
    const response = instagramOAuthResponse(url, init);
    if (response) return response;
    throw new Error('unexpected Instagram request: ' + new URL(url).pathname);
  } });

  const connection = await provider.connectInstagram(userId);
  const login = new URL(connection.accessUrl);
  assert.equal(login.origin + login.pathname, 'https://www.instagram.com/oauth/authorize');
  assert.equal(login.searchParams.get('client_id'), env.MONK_FACTORY_INSTAGRAM_APP_ID);
  assert.equal(login.searchParams.get('redirect_uri'), env.MONK_FACTORY_META_REDIRECT_URI);
  assert.equal(login.searchParams.get('response_type'), 'code');
  assert.equal(login.searchParams.get('enable_fb_login'), 'false');
  assert.deepEqual(login.searchParams.get('scope').split(','), requiredScopes);
  assert.equal(login.searchParams.has('config_id'), false);
  const state = login.searchParams.get('state');
  assert.match(state, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(store.stateCount(), 1);

  const result = await provider.completeInstagramOAuth({ code: 'one-time-code', state });
  assert.deepEqual(result, { userId, accountId: instagramUserId, username: 'monk.mujo' });
  const saved = store.getCredential();
  assert.equal(saved.user_id, userId);
  assert.equal(saved.instagram_account_id, instagramUserId);
  assert.equal(saved.instagram_username, 'monk.mujo');
  assert.ok(Math.abs(Date.parse(saved.instagram_access_token_expires_at) - (Date.now() + 5184000000)) < 2000);
  assert.ok(saved.instagram_access_token_ciphertext.startsWith('v1.'));
  assert.ok(!JSON.stringify(saved).includes('raw-instagram-user-token'));
  assert.deepEqual(calls.map(url => url.origin), [
    'https://api.instagram.com', 'https://graph.instagram.com', 'https://graph.instagram.com',
  ]);
  assert.equal(decryptToken(saved.instagram_access_token_ciphertext, env.MONK_FACTORY_JOB_SECRET), 'raw-instagram-user-token');

  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state }), { code: 'instagram_oauth_state_invalid' });
  assert.equal(calls.length, 3);
});

test('Instagram OAuth refuses to save an account if publish scope was not granted', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init = {}) => {
    const response = instagramOAuthResponse(url, init, ['instagram_business_basic', 'instagram_business_manage_insights']);
    if (response) return response;
    throw new Error('unexpected Instagram request');
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') }), { code: 'instagram_publish_permission_required' });
  assert.equal(store.getCredential(), null);
});

test('Instagram OAuth refuses to save an account if Insights scope was not granted', async () => {
  const store = fakeStore();
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init = {}) => {
    const response = instagramOAuthResponse(url, init, ['instagram_business_basic', 'instagram_business_content_publish']);
    if (response) return response;
    throw new Error('unexpected Instagram request');
  } });
  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await assert.rejects(provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') }), { code: 'instagram_insights_permission_required' });
  assert.equal(store.getCredential(), null);
});

test('an Instagram token nearing expiry is refreshed and saved before the account readback', async () => {
  const store = fakeStore();
  await store.saveInstagramCredential(userId, {
    instagram_access_token_ciphertext: encryptToken('old-instagram-user-token', env.MONK_FACTORY_JOB_SECRET),
    instagram_access_token_expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    instagram_account_id: instagramUserId, instagram_username: 'monk.mujo', connected_at: '2026-10-01T00:00:00.000Z',
  });
  let refreshed = false;
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/refresh_access_token')) {
      refreshed = true;
      assert.equal(parsed.searchParams.get('grant_type'), 'ig_refresh_token');
      assert.equal(parsed.searchParams.get('access_token'), 'old-instagram-user-token');
      return json({ access_token: 'rotated-instagram-user-token', token_type: 'bearer', expires_in: 5184000 });
    }
    if (parsed.pathname.endsWith('/me')) return json({ user_id: instagramUserId, username: 'monk.mujo' });
    throw new Error('unexpected Instagram request: ' + parsed.pathname);
  } });

  const state = await provider.socialState(userId);
  assert.equal(state.connected, true);
  assert.equal(refreshed, true);
  const saved = store.getCredential();
  assert.equal(decryptToken(saved.instagram_access_token_ciphertext, env.MONK_FACTORY_JOB_SECRET), 'rotated-instagram-user-token');
  assert.ok(Date.parse(saved.instagram_access_token_expires_at) > Date.now() + 59 * 24 * 60 * 60 * 1000);
  assert.equal(saved.connected_at, '2026-10-01T00:00:00.000Z');
});

test('an expired Instagram token requires OAuth again without an API request', async () => {
  const store = fakeStore();
  await store.saveInstagramCredential(userId, {
    instagram_access_token_ciphertext: encryptToken('expired-instagram-user-token', env.MONK_FACTORY_JOB_SECRET),
    instagram_access_token_expires_at: new Date(Date.now() - 1000).toISOString(),
    instagram_account_id: instagramUserId, instagram_username: 'monk.mujo',
  });
  let calls = 0;
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async () => { calls += 1; return json({}); } });
  await assert.rejects(provider.socialState(userId), { code: 'instagram_reconnect_required' });
  assert.equal(calls, 0);
});

test('Instagram Reels publish, status, and metrics use the selected account and return the published URL', async () => {
  const store = fakeStore();
  const calls = [];
  const provider = createMetaInstagramProvider({ env, store, fetchImpl: async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ parsed, init });
    const authResponse = instagramOAuthResponse(url, init);
    if (authResponse) return authResponse;
    if (parsed.pathname.endsWith('/' + instagramUserId + '/media') && init.method === 'POST') {
      assert.equal(init.headers.Authorization, 'Bearer raw-instagram-user-token');
      assert.deepEqual(JSON.parse(init.body), {
        media_type: 'REELS', video_url: 'https://files.heygen.ai/final.mp4',
        caption: 'One mindful breath. Fictional AI monk.', is_ai_generated: true,
      });
      return json({ id: 'container-1' });
    }
    if (parsed.pathname.endsWith('/container-1')) return json({ id: 'container-1', status_code: 'FINISHED' });
    if (parsed.pathname.endsWith('/' + instagramUserId + '/media_publish')) {
      assert.deepEqual(JSON.parse(init.body), { creation_id: 'container-1' });
      return json({ id: 'media-1' });
    }
    if (parsed.pathname.endsWith('/media-1') && parsed.searchParams.get('fields') === 'id,permalink,timestamp') {
      return json({ id: 'media-1', permalink: 'https://www.instagram.com/reel/AbCdEf/', timestamp: '2026-10-25T05:00:00+0000' });
    }
    if (parsed.pathname.endsWith('/media-1/insights')) return json({ data: [{ name: 'views', values: [{ value: 23 }] }, { name: 'likes', values: [{ value: 4 }] }] });
    throw new Error('unexpected Instagram request: ' + parsed.pathname);
  } });

  const login = new URL((await provider.connectInstagram(userId)).accessUrl);
  await provider.completeInstagramOAuth({ code: 'one-time-code', state: login.searchParams.get('state') });
  const created = await provider.publishInstagram({
    userId, accountId: instagramUserId, videoUrl: 'https://files.heygen.ai/final.mp4',
    caption: 'One mindful breath. Fictional AI monk.', requestId: 'job:publish',
  });
  assert.deepEqual(created, { id: 'container-1', status: 'pending' });
  assert.deepEqual(await provider.postStatus({ userId, id: created.id }), { id: 'container-1', status: 'ready_to_publish' });
  assert.deepEqual(await provider.publishInstagramContainer({ userId, accountId: instagramUserId, containerId: created.id, requestId: 'job:publish' }),
    { id: 'media-1', status: 'published', containerId: 'container-1' });
  const metrics = await provider.metrics({ userId, postId: 'media-1' });
  assert.equal(metrics.postUrl, 'https://www.instagram.com/reel/AbCdEf/');
  assert.deepEqual(metrics.metrics, { views: 23, likes: 4 });
  assert.ok(calls.every(call => call.parsed.origin === 'https://graph.instagram.com' || call.parsed.origin === 'https://api.instagram.com'));
});

test('Instagram readiness fails closed when app, callback, webhook, job secret, or Standard Access evidence is missing', () => {
  const provider = createMetaInstagramProvider({ env: {
    ...env,
    MONK_FACTORY_INSTAGRAM_APP_ID: '',
    MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN: '',
    MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED: '',
  }, store: fakeStore() });
  const readiness = provider.readiness();
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes('MONK_FACTORY_INSTAGRAM_APP_ID'));
  assert.ok(readiness.missing.includes('MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN'));
  assert.ok(readiness.unverified.includes('meta_standard_access'));
});
