const { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');
const { UUID } = require('./monk-factory.js');

const ACCOUNT_ID = /^[A-Za-z0-9_.:-]{1,200}$/;
const POST_URL_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const INSIGHT_METRICS = ['views', 'reach', 'likes', 'comments', 'saved', 'shares'];

function error(code, providerStatus = 503, effect = 'none', retryable = false, extra = {}) {
  return Object.assign(new Error(code), { code, status: providerStatus, provider: 'meta_instagram', effect, retryable, ...extra });
}

function profileFor(userId) {
  if (typeof userId !== 'string' || !UUID.test(userId)) throw error('invalid_factory_user', 422);
  return 'factory_' + userId.toLowerCase();
}

function stateHash(state) { return createHash('sha256').update(state).digest('hex'); }

function keyFor(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw error('provider_not_ready');
  return createHmac('sha256', secret).update('ai-monk-factory:meta-token:v1').digest();
}

function encryptToken(token, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decryptToken(value, secret) {
  if (typeof value !== 'string') throw error('instagram_reconnect_required');
  const [version, iv, tag, data, extra] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !data || extra) throw error('instagram_reconnect_required');
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyFor(secret), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch { throw error('instagram_reconnect_required'); }
}

function createMetaInstagramProvider({ env = process.env, fetchImpl = fetch, store } = {}) {
  const configured = name => typeof env[name] === 'string' && env[name].trim().length > 0;
  const version = env.MONK_FACTORY_META_API_VERSION || 'v26.0';
  const graphBase = 'https://graph.facebook.com/' + version;
  const redirectUri = env.MONK_FACTORY_META_REDIRECT_URI;

  function readiness() {
    const missing = ['MONK_FACTORY_META_APP_ID', 'MONK_FACTORY_META_APP_SECRET', 'MONK_FACTORY_META_CONFIG_ID',
      'MONK_FACTORY_META_REDIRECT_URI', 'MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN', 'MONK_FACTORY_JOB_SECRET'].filter(key => !configured(key));
    try {
      if (redirectUri) {
        const url = new URL(redirectUri);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) missing.push('MONK_FACTORY_META_REDIRECT_URI');
      }
    } catch { if (!missing.includes('MONK_FACTORY_META_REDIRECT_URI')) missing.push('MONK_FACTORY_META_REDIRECT_URI'); }
    let unverified = [];
    if (env.MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED !== 'true' || !configured('MONK_FACTORY_META_STANDARD_ACCESS_EVIDENCE_REF')) unverified = ['meta_standard_access'];
    return { ready: missing.length === 0 && unverified.length === 0, missing: [...new Set(missing)], unverified };
  }

  function ensureReady() {
    const state = readiness();
    if (!state.ready) throw error('provider_not_ready', 503, 'none', false, { missing: state.missing, unverified: state.unverified });
  }

  function accountId(value) {
    if (typeof value !== 'string' || !ACCOUNT_ID.test(value)) throw error('provider_readback_invalid');
    return value;
  }

  async function request(url, { method = 'GET', token, body, timeoutMs = 10000, receiptId } = {}) {
    const mutating = method !== 'GET';
    let response;
    try {
      response = await fetchImpl(url, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
    } catch {
      throw error(mutating ? 'provider_effect_unknown' : 'provider_readback_unavailable', 503, mutating ? 'unknown' : 'none', !mutating, receiptId ? { providerReceiptId: receiptId } : {});
    }
    let data;
    try { data = await response.json(); } catch {
      throw error(mutating ? 'provider_effect_unknown' : 'provider_readback_invalid', 503, mutating ? 'unknown' : 'none', !mutating, receiptId ? { providerReceiptId: receiptId } : {});
    }
    if (!response.ok || data?.error) {
      const rejected = [400, 401, 403, 404, 413, 415, 422, 429].includes(response.status);
      throw error(mutating && !rejected ? 'provider_effect_unknown' : mutating ? 'provider_rejected' : 'provider_readback_unavailable',
        response.status || 503, mutating && !rejected ? 'unknown' : 'none', !mutating, receiptId ? { providerReceiptId: receiptId } : {});
    }
    return data;
  }

  async function credential(userId) {
    if (!store?.instagramCredential) throw error('store_unavailable');
    const value = await store.instagramCredential(userId);
    if (!value?.instagram_access_token_ciphertext || value.instagram_account_id == null) throw error('instagram_required', 409);
    if (value.instagram_access_token_expires_at && Date.parse(value.instagram_access_token_expires_at) <= Date.now()) throw error('instagram_reconnect_required', 409);
    const token = decryptToken(value.instagram_access_token_ciphertext, env.MONK_FACTORY_JOB_SECRET);
    return { ...value, token, instagram_account_id: accountId(value.instagram_account_id) };
  }

  async function connectInstagram(userId) {
    ensureReady();
    if (!store?.beginInstagramOAuth) throw error('store_unavailable');
    profileFor(userId);
    const state = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await store.beginInstagramOAuth(userId, stateHash(state), expiresAt);
    const url = new URL('https://www.facebook.com/dialog/oauth');
    url.searchParams.set('client_id', env.MONK_FACTORY_META_APP_ID);
    url.searchParams.set('config_id', env.MONK_FACTORY_META_CONFIG_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    url.searchParams.set('display', 'popup');
    return { profile: profileFor(userId), accessUrl: url.toString() };
  }

  async function completeInstagramOAuth({ code, state }) {
    ensureReady();
    if (!store?.consumeInstagramOAuth || !store?.saveInstagramCredential || typeof code !== 'string' || code.length < 1 || code.length > 4096
      || typeof state !== 'string' || !/^[A-Za-z0-9_-]{40,128}$/.test(state)) throw error('instagram_oauth_state_invalid', 400);
    const userId = await store.consumeInstagramOAuth(stateHash(state), new Date().toISOString());
    if (!userId) throw error('instagram_oauth_state_invalid', 400);
    profileFor(userId);

    const tokenUrl = new URL(graphBase + '/oauth/access_token');
    tokenUrl.searchParams.set('client_id', env.MONK_FACTORY_META_APP_ID);
    tokenUrl.searchParams.set('client_secret', env.MONK_FACTORY_META_APP_SECRET);
    tokenUrl.searchParams.set('code', code);
    const token = await request(tokenUrl.toString());
    if (typeof token.access_token !== 'string' || token.access_token.length < 16) throw error('provider_readback_invalid');

    const business = await request(graphBase + '/me?fields=client_business_id', { token: token.access_token });
    if (typeof business.client_business_id !== 'string' || !ACCOUNT_ID.test(business.client_business_id)) throw error('provider_readback_invalid');
    const assigned = await request(graphBase + '/me/assigned_instagram_accounts?fields=id,username', { token: token.access_token });
    const accounts = Array.isArray(assigned.data) ? assigned.data.filter(item => ACCOUNT_ID.test(item?.id || '') && typeof item.username === 'string' && item.username.length <= 200) : [];
    if (accounts.length !== 1) throw error(accounts.length ? 'instagram_account_selection_required' : 'instagram_account_required', 409);
    const selected = accounts[0];
    const expiresAt = Number.isFinite(token.expires_in) && token.expires_in > 0 ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
    await store.saveInstagramCredential(userId, {
      instagram_access_token_ciphertext: encryptToken(token.access_token, env.MONK_FACTORY_JOB_SECRET),
      instagram_access_token_expires_at: expiresAt,
      instagram_business_id: business.client_business_id,
      instagram_account_id: selected.id,
      instagram_username: selected.username,
      connected_at: new Date().toISOString(),
    });
    return { userId, accountId: selected.id, username: selected.username, businessId: business.client_business_id };
  }

  async function socialState(userId) {
    const saved = await credential(userId);
    const live = await request(graphBase + '/' + encodeURIComponent(saved.instagram_account_id) + '?fields=id,username', { token: saved.token });
    if (live.id !== saved.instagram_account_id || live.username !== saved.instagram_username) throw error('provider_readback_invalid');
    return { profile: profileFor(userId), connected: true, accountId: live.id, handle: live.username, reauthRequired: false };
  }

  async function publishInstagram({ userId, accountId: requestedId, videoUrl, caption, requestId }) {
    ensureReady();
    if (typeof requestId !== 'string' || requestId.length < 1 || requestId.length > 200) throw error('invalid_provider_id', 422);
    let parsed;
    try { parsed = new URL(videoUrl); } catch { throw error('invalid_instagram_post', 422); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash || typeof caption !== 'string' || !caption.trim() || caption.length > 2200) throw error('invalid_instagram_post', 422);
    const saved = await credential(userId);
    if (saved.instagram_account_id !== requestedId) throw error('instagram_account_changed', 409);
    const created = await request(graphBase + '/' + encodeURIComponent(saved.instagram_account_id) + '/media', {
      method: 'POST', token: saved.token, body: { media_type: 'REELS', video_url: parsed.href, caption, is_ai_generated: true },
    });
    if (typeof created.id !== 'string' || !ACCOUNT_ID.test(created.id)) throw error('provider_effect_unknown', 503, 'unknown', false);
    return { id: created.id, status: 'pending' };
  }

  async function postStatus({ userId, id }) {
    const saved = await credential(userId);
    const containerId = accountId(id);
    const status = await request(graphBase + '/' + encodeURIComponent(containerId) + '?fields=status_code', { token: saved.token });
    if (status.id !== containerId || !['IN_PROGRESS', 'FINISHED', 'ERROR', 'EXPIRED'].includes(status.status_code)) throw error('provider_readback_invalid');
    if (status.status_code === 'IN_PROGRESS') return { id: containerId, status: 'processing' };
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') return { id: containerId, status: 'failed' };
    return { id: containerId, status: 'ready_to_publish' };
  }

  async function publishInstagramContainer({ userId, accountId: requestedId, containerId, requestId }) {
    ensureReady();
    if (typeof requestId !== 'string' || requestId.length < 1 || requestId.length > 200) throw error('invalid_provider_id', 422);
    const saved = await credential(userId);
    if (saved.instagram_account_id !== requestedId) throw error('instagram_account_changed', 409);
    const published = await request(graphBase + '/' + encodeURIComponent(saved.instagram_account_id) + '/media_publish', {
      method: 'POST', token: saved.token, body: { creation_id: accountId(containerId) }, receiptId: containerId,
    });
    if (typeof published.id !== 'string' || !ACCOUNT_ID.test(published.id)) throw error('provider_effect_unknown', 503, 'unknown', false, { providerReceiptId: containerId });
    return { id: published.id, status: 'published', containerId };
  }

  async function metrics({ userId, postId }) {
    const saved = await credential(userId);
    const id = accountId(postId);
    const media = await request(graphBase + '/' + encodeURIComponent(id) + '?fields=id,permalink,timestamp', { token: saved.token });
    let postUrl;
    try { const url = new URL(media.permalink); if (POST_URL_HOSTS.has(url.hostname) && url.protocol === 'https:') postUrl = url.href; } catch { /* invalid provider permalink */ }
    if (media.id !== id || !postUrl || typeof media.timestamp !== 'string') throw error('provider_readback_invalid');
    const url = new URL(graphBase + '/' + encodeURIComponent(id) + '/insights');
    url.searchParams.set('metric', INSIGHT_METRICS.join(','));
    const data = await request(url.toString(), { token: saved.token });
    if (!Array.isArray(data.data)) throw error('provider_readback_invalid');
    const values = {};
    for (const item of data.data) {
      if (!INSIGHT_METRICS.includes(item?.name)) continue;
      const value = Array.isArray(item.values) ? item.values[0]?.value : item.total_value?.value;
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) values[item.name] = value;
    }
    return { postId: id, postUrl, timestamp: media.timestamp, profile: profileFor(userId), source: 'platform_api', metrics: values };
  }

  return { readiness, connectInstagram, completeInstagramOAuth, socialState, publishInstagram, postStatus, publishInstagramContainer, metrics };
}

module.exports = { createMetaInstagramProvider, encryptToken, decryptToken };
