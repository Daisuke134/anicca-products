const { createHmac, timingSafeEqual, randomUUID } = require('node:crypto');
const { UUID, FACTORY_PRODUCT, factoryError } = require('./monk-factory.js');
const { syncFactoryBilling, factoryLiveMode } = require('./monk-factory-billing.js');

const DISCLOSURE = 'Fictional AI-generated monk. ';
const after = ms => new Date(Date.now() + ms).toISOString();
const codeOf = error => /^[a-z_]{1,60}$/.test(error?.code || '') ? error.code : 'job_unavailable';
const profileFor = id => 'factory_' + id.toLowerCase();
function jobRuntimeReady(env) { return Buffer.byteLength(env.MONK_FACTORY_JOB_SECRET || '') >= 32; }
function ticketKey(env) { if (!jobRuntimeReady(env)) throw factoryError('factory_unavailable', 503); return env.MONK_FACTORY_JOB_SECRET; }
function signImageTicket(payload, env) {
  if (!UUID.test(payload?.jobId || '') || !UUID.test(payload?.nonce || '') || !Number.isSafeInteger(payload.expiresAt)) throw factoryError('invalid_image_ticket', 401);
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return data + '.' + createHmac('sha256', ticketKey(env)).update(data).digest('base64url');
}
function verifyImageTicket(ticket, env, now = Date.now()) {
  try {
    if (typeof ticket !== 'string' || ticket.length > 1024) throw new Error();
    const [data, signature, extra] = ticket.split('.');
    const wanted = createHmac('sha256', ticketKey(env)).update(data).digest();
    const received = Buffer.from(signature || '', 'base64url');
    if (extra || received.length !== wanted.length || !timingSafeEqual(received, wanted)) throw new Error();
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!UUID.test(payload.jobId || '') || !UUID.test(payload.nonce || '') || !Number.isSafeInteger(payload.expiresAt)
      || payload.expiresAt <= now || payload.expiresAt > now + 300000) throw new Error();
    return payload;
  } catch { throw factoryError('invalid_image_ticket', 401); }
}

function entitled(account, now = Date.now()) {
  if (!account?.stripe_subscription_id || account.cancel_at_period_end || account.billing_paused) return false;
  const trial = account.subscription_status === 'trialing';
  const start = Date.parse(trial ? account.trial_start : account.period_start);
  const end = Date.parse(trial ? account.trial_end : account.period_end);
  return (trial || (account.subscription_status === 'active' && account.period_paid === true)) && start <= now && now < end;
}
function periodMatches(job, account) {
  if (account.subscription_status === 'trialing') return job.period_key === 'trial:' + account.stripe_subscription_id && job.max_seconds === 20;
  const prefix = 'paid:' + account.stripe_subscription_id + ':';
  return job.max_seconds === 45 && job.period_key.startsWith(prefix) && Number(job.period_key.slice(prefix.length)) === Date.parse(account.period_start) / 1000;
}
function evidence(job, phase, env, details = {}) {
  return { [phase]: { run_id: job.lease_id, owner_id: 'factory:' + job.user_id, occurrence_id: job.occurrence_id,
    release_sha: /^[a-f0-9]{40}$/i.test(env.COMMIT_REF || '') ? env.COMMIT_REF : null,
    argv: [phase], env: { factory_enabled: env.MONK_FACTORY_ENABLED === 'true' }, phase, command: phase,
    exit_code: details.error ? 1 : 0, effect: details.effect || 'none', readback: details.readback || null,
    provider_receipt_id: details.receipt || null, evidence_refs: details.receipt ? [details.receipt] : [],
    error_class: details.error || null, retryable: details.retryable === true, next_action: details.nextAction || null } };
}

// Only repeat the database write; an ambiguous response never repeats a provider POST.
async function persist(store, job, patch, keep = false) {
  for (let n = 0; n < 2; n++) {
    try {
      const saved = await store.advanceJob(job, patch, keep);
      if (saved) return saved;
    } catch (error) { if (n && !store.job) throw error; }
    if (store.job) {
      const saved = await store.job(job.id).catch(() => null);
      const keys = Object.keys(patch).filter(key => key !== 'evidence' && key !== 'error_class' && key !== 'next_run_at');
      if (saved?.user_id === job.user_id && keys.every(key => JSON.stringify(saved[key]) === JSON.stringify(patch[key]))) return saved;
    }
  }
  throw factoryError('job_lease_lost', 409);
}

async function loadFactoryPlaybooks() {
  const { getPlaybooks } = await import('./ai-monk-index/index.mjs');
  const result = getPlaybooks();
  if (!Array.isArray(result.playbooks) || !result.playbooks.length) throw factoryError('research_unavailable', 503);
  return result.playbooks;
}
function createPrivateImages(event) {
  const { connectLambda, getStore } = require('@netlify/blobs');
  connectLambda(event);
  const blobs = getStore({ name: 'monk-factory-private', consistency: 'strong' });
  return { get: key => blobs.get(key, { type: 'json' }), put: (key, value) => blobs.setJSON(key, value) };
}
async function dispatchImage(job, env, fetchImpl = fetch) {
  const ticket = signImageTicket({ jobId: job.id, nonce: job.image_nonce, expiresAt: Date.parse(job.image_ticket_until) }, env);
  const response = await fetchImpl('https://aniccaai.com/.netlify/functions/monk-factory-image-background', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }), signal: AbortSignal.timeout(5000), redirect: 'error',
  });
  if (response.status !== 202) throw factoryError('image_dispatch_unavailable', 503);
}

async function ensureFactorySocial({ userId, store, providers, create = false }) {
  const account = await store.claimSocial(userId);
  if (!account) throw factoryError('social_sync_in_progress', 409);
  const lease = account.social_lease_id;
  try {
    if (account.user_id !== userId) throw factoryError('social_mismatch', 503);
    let state;
    try { state = await providers.socialState(userId); }
    catch (error) {
      if (!create || error.providerStatus !== 404) throw error;
      if (account.social_profile || account.social_submit_started_at || !await store.fenceSocial(userId, lease)) throw factoryError('social_reconciliation_required', 503);
      const result = await providers.createSocialProfile(userId);
      if (result.profile !== profileFor(userId)) throw factoryError('social_mismatch', 503);
      state = await providers.socialState(userId);
    }
    if (state.profile !== profileFor(userId)) throw factoryError('social_mismatch', 503);
    const saved = await store.saveSocial(userId, lease, state);
    if (!saved) throw factoryError('social_sync_in_progress', 409);
    return saved;
  } finally { await store.releaseSocial(userId, lease).catch(() => {}); }
}

async function advanceFactoryJob(options) {
  const { store, providers, env = process.env, stripe, loadPlaybooks = loadFactoryPlaybooks, images,
    syncBilling = syncFactoryBilling, dispatch = job => dispatchImage(job, env), deadline = Infinity } = options;
  let job = options.job;
  if (!job) return;
  const save = (patch, keep = false) => persist(store, job, patch, keep).then(row => (job = row));
  async function allowed(post = false) {
    if (Date.now() >= deadline) throw factoryError('tick_deadline', 503);
    if (env.MONK_FACTORY_ENABLED !== 'true' || (await providers.readiness()).ready !== true) throw factoryError('factory_unavailable', 503);
    const account = await syncBilling({ userId: job.user_id, store, stripe, env });
    if (account?.user_id !== job.user_id || !entitled(account)) throw factoryError('subscription_required', 402);
    if (!post && !periodMatches(job, account)) throw factoryError('job_period_expired', 402);
    if ((job.origin === 'auto' || post) && !account.auto_post) throw factoryError('autopost_stopped', 409);
    if (Date.now() >= deadline) throw factoryError('tick_deadline', 503);
    return account;
  }
  async function submit(stage, method, input, resultPatch, extra = {}) {
    await allowed(stage === 'post_submitting');
    await save({ ...extra, stage, status: 'effect_unknown', evidence: evidence(job, stage, env, { effect: 'unknown', nextAction: 'official_readback' }) }, true);
    if (Date.now() >= deadline) throw factoryError('tick_deadline', 503);
    const result = await providers[method]({ ...input, requestId: job.id + ':' + stage });
    await save({ ...resultPatch(result), error_class: null,
      evidence: evidence(job, stage, env, { effect: 'confirmed', receipt: result.id, nextAction: 'next_stage' }) });
  }
  try {
    // A persisted submit fence is never an invitation to repeat its POST.
    if (job.stage.endsWith('_submitting')) {
      if (job.stage === 'image_submitting' && images) {
        const image = await images.get('images/' + job.id);
        if (image?.jobId === job.id && image?.userId === job.user_id && image.receiptId) {
          return await save({ stage: 'image_ready', status: 'processing', image_blob_key: 'images/' + job.id, image_receipt_id: image.receiptId,
            evidence: evidence(job, 'image_recovery', env, { effect: 'confirmed', receipt: image.receiptId, readback: 'private_blob', nextAction: 'avatar_submit' }) });
        }
      }
      const receipt = job.stage === 'avatar_submitting' ? job.avatar_provider_id : job.stage === 'video_submitting' ? job.video_provider_id : null;
      if (receipt) return await save({ stage: job.stage === 'avatar_submitting' ? 'avatar_pending' : 'video_pending', status: 'processing' });
      if (job.stage === 'post_submitting' && job.post_provider_id) return await save({ stage: 'post_pending', status: 'processing' });
      return await save({ status: 'effect_unknown', error_class: 'provider_effect_unreconciled', next_run_at: after(3600000),
        evidence: evidence(job, 'reconcile', env, { effect: 'unknown', error: 'provider_effect_unreconciled', nextAction: 'provider_receipt_required' }) });
    }
    if (job.kind === 'avatar' && ['reserved', 'image_pending'].includes(job.stage)) {
      await allowed();
      await save({ stage: 'image_pending', status: 'processing', next_run_at: after(60000),
        evidence: evidence(job, 'image_dispatch', env, { nextAction: 'background_claim' }) });
      await dispatch(job);
    } else if (job.stage === 'image_ready') {
      if (!images || !job.image_blob_key) throw factoryError('image_storage_unavailable', 503);
      const image = await images.get(job.image_blob_key);
      if (image?.jobId !== job.id || image.userId !== job.user_id || image.receiptId !== job.image_receipt_id) throw factoryError('image_storage_mismatch', 503);
      await submit('avatar_submitting', 'createPhotoAvatar', { imageBase64: image.imageBase64, mediaType: image.mediaType }, result => ({ stage: 'avatar_pending', status: 'processing', avatar_provider_id: result.id, provider_id: result.id }));
    } else if (job.stage === 'avatar_pending') {
      const result = await providers.avatarStatus(job.avatar_provider_id);
      if (result.status === 'failed') throw factoryError('avatar_generation_failed', 422);
      const done = result.status === 'completed';
      await save({ status: done ? 'completed' : 'processing', stage: done ? 'completed' : 'avatar_pending', ...(done ? { image_url: result.imageUrl } : {}),
        evidence: evidence(job, 'avatar_readback', env, { receipt: result.id, readback: result.status, nextAction: done ? 'preview' : 'official_get' }) });
    } else if (job.kind === 'video' && job.stage === 'reserved') {
      const account = await store.account(job.user_id);
      if (!account?.avatar_id) throw factoryError('avatar_required', 409);
      const playbooks = await loadPlaybooks();
      await submit('script_submitting', 'createScript', { playbooks, maxSeconds: job.max_seconds }, result => ({ stage: 'script_ready', status: 'processing', script_receipt_id: result.id, script: result.script,
        caption: DISCLOSURE + result.caption.slice(0, 2200 - DISCLOSURE.length), source_ids: result.sourceIds }));
    } else if (job.stage === 'script_ready') {
      await submit('speech_submitting', 'createSpeech', { script: job.script }, result => ({ stage: 'speech_ready', status: 'processing', speech_receipt_id: result.id, audio_url: result.audioUrl, audio_seconds: result.duration }));
    } else if (job.stage === 'speech_ready') {
      const duration = Number(job.audio_seconds);
      if (!Number.isFinite(duration) || duration <= 0 || duration > job.max_seconds) throw factoryError('invalid_audio_duration', 422);
      const account = await store.account(job.user_id);
      if (!account?.avatar_id) throw factoryError('avatar_required', 409);
      await submit('video_submitting', 'createVideo', { avatarId: account.avatar_id, audioUrl: job.audio_url, duration, maxSeconds: job.max_seconds }, result => ({ stage: 'video_pending', status: 'processing', video_provider_id: result.id, provider_id: result.id }));
    } else if (job.stage === 'video_pending') {
      const result = await providers.videoStatus(job.video_provider_id);
      if (result.status === 'failed') throw factoryError('video_generation_failed', 422);
      if (result.status === 'completed' && result.duration > job.max_seconds) throw factoryError('video_duration_exceeded', 422);
      const done = result.status === 'completed';
      await save({ status: done ? 'completed' : 'processing', stage: done ? 'completed' : 'video_pending',
        ...(done ? { video_url: result.videoUrl, video_completed_at: new Date().toISOString() } : {}),
        evidence: evidence(job, 'video_readback', env, { receipt: result.id, readback: result.status, nextAction: done ? 'preview' : 'official_get' }) });
      if (done && job.autopost_requested) {
        await save({ stage: 'post_ready', status: 'processing', next_run_at: after(1000) });
      }
    } else if (job.stage === 'post_ready') {
      await allowed(true);
      const account = await ensureFactorySocial({ userId: job.user_id, store, providers });
      if (!account.auto_post || !account.instagram_account_id || !account.connected_at) throw factoryError('instagram_required', 409);
      const requestId = job.id + ':post_submitting';
      await submit('post_submitting', 'publishInstagram', { userId: job.user_id, accountId: account.instagram_account_id, videoUrl: job.video_url, caption: job.caption }, result => ({ stage: 'post_pending', status: 'processing', post_provider_id: result.id, provider_id: result.id }), { post_provider_id: requestId });
    } else if (job.stage === 'post_pending') {
      const result = await providers.postStatus(job.post_provider_id);
      if (result.profile && result.profile !== profileFor(job.user_id)) throw factoryError('social_mismatch', 503);
      if (result.status === 'failed') throw factoryError('instagram_publish_failed', 422);
      const done = result.status === 'completed';
      await save({ status: 'processing', stage: done ? 'published' : 'post_pending', ...(done ? { post_id: result.postId, post_url: result.postUrl } : {}),
        evidence: evidence(job, 'post_readback', env, { effect: done ? 'confirmed' : 'unknown', receipt: result.id, readback: result.status, nextAction: done ? 'metrics_get' : 'official_get' }) });
    } else if (job.stage === 'published') {
      const result = await providers.metrics({ userId: job.user_id, postId: job.post_id });
      if (result.profile !== profileFor(job.user_id) || result.postId !== job.post_id || result.source !== 'platform_api') throw factoryError('social_mismatch', 503);
      await save({ status: 'completed', metrics: result.metrics, metrics_at: new Date().toISOString(),
        evidence: evidence(job, 'metrics_readback', env, { effect: 'confirmed', receipt: result.postId, readback: 'platform_api', nextAction: 'complete' }) });
    }
  } catch (error) {
    if (codeOf(error) === 'job_lease_lost') return;
    const submitting = job.stage.endsWith('_submitting');
    const transient = error.retryable === true || ['factory_unavailable','image_dispatch_unavailable','image_storage_unavailable','tick_deadline','billing_sync_in_progress','social_sync_in_progress','store_unavailable','billing_unavailable'].includes(codeOf(error));
    const unknown = submitting && error.effect !== 'none';
    await save({ status: unknown ? 'effect_unknown' : transient ? job.status : 'failed', stage: unknown || transient ? job.stage : 'failed',
      error_class: codeOf(error), next_run_at: after(unknown ? 3600000 : 60000),
      evidence: evidence(job, job.stage, env, { effect: unknown ? 'unknown' : error.effect || 'none', receipt: error.providerReceiptId,
        error: codeOf(error), retryable: transient, nextAction: unknown ? 'official_readback' : transient ? 'retry_readback' : 'reservation_retained' }) }).catch(() => {});
  }
}

async function runFactoryImage({ ticket, store, providers, images, env, stripe, syncBilling = syncFactoryBilling }) {
  const payload = verifyImageTicket(ticket, env);
  const original = await store.job(payload.jobId);
  if (!original || original.image_nonce !== payload.nonce || Date.parse(original.image_ticket_until) !== payload.expiresAt) throw factoryError('invalid_image_ticket', 401);
  let job = await store.claimJob(payload.jobId, true);
  if (!job) return;
  try {
    const account = await syncBilling({ userId: job.user_id, store, stripe, env });
    if (env.MONK_FACTORY_ENABLED !== 'true' || (await providers.readiness()).ready !== true) throw factoryError('factory_unavailable', 503);
    if (account?.user_id !== job.user_id || !entitled(account) || !periodMatches(job, account)) throw factoryError('subscription_required', 402);
    if (job.origin === 'auto' && !account.auto_post) throw factoryError('autopost_stopped', 409);
    job = await persist(store, job, { stage: 'image_submitting', status: 'effect_unknown',
      evidence: evidence(job, 'image_submitting', env, { effect: 'unknown', nextAction: 'private_blob_save' }) }, true);
    const result = await providers.createAvatarImage({ requestId: job.id + ':image_submitting' });
    const key = 'images/' + job.id;
    await images.put(key, { jobId: job.id, userId: job.user_id, receiptId: result.id, imageBase64: result.imageBase64, mediaType: result.mediaType });
    await persist(store, job, { stage: 'image_ready', status: 'processing', image_blob_key: key, image_receipt_id: result.id,
      evidence: evidence(job, 'image_readback', env, { effect: 'confirmed', receipt: result.id, readback: 'private_blob', nextAction: 'avatar_submit' }) });
  } catch (error) {
    const unknown = job.stage === 'image_submitting' && error.effect !== 'none';
    await persist(store, job, { status: unknown ? 'effect_unknown' : 'failed', stage: unknown ? job.stage : 'failed', error_class: codeOf(error),
      next_run_at: after(3600000), evidence: evidence(job, 'image_error', env, { effect: unknown ? 'unknown' : 'none', error: codeOf(error), nextAction: unknown ? 'private_blob_or_receipt_readback' : 'reservation_retained' }) }).catch(() => {});
  }
}

async function processFactoryEvents({ store, stripe, env, deadline = Infinity }) {
  let count = 0;
  for (const event of await store.pendingEvents()) {
    if (Date.now() + 12000 >= deadline || count >= 1) break;
    try {
      const account = await store.account(event.user_id);
      if (!account) throw factoryError('billing_mismatch', 503);
      if (event.event_type === 'checkout.session.expired') {
        const session = await stripe.checkout.sessions.retrieve(event.stripe_object_id);
        if (session.id !== event.stripe_object_id || session.livemode !== factoryLiveMode(env) || session.status !== 'expired' || session.subscription
          || session.client_reference_id !== event.user_id || session.metadata?.product !== FACTORY_PRODUCT || session.metadata.user_id !== event.user_id
          || session.metadata.checkout_nonce !== account.checkout_nonce || session.id !== account.checkout_session_id) throw factoryError('billing_mismatch', 503);
        await store.releaseUnusedProfile(event.user_id, account.checkout_nonce);
      } else if (account.stripe_subscription_id && event.stripe_subscription_id !== account.stripe_subscription_id
        && !['none','canceled','incomplete_expired'].includes(account.subscription_status)) {
        const old = await stripe.subscriptions.retrieve(event.stripe_subscription_id);
        if (old.id !== event.stripe_subscription_id || old.metadata?.product !== FACTORY_PRODUCT || old.metadata.user_id !== event.user_id
          || old.livemode !== factoryLiveMode(env) || !['canceled','incomplete_expired'].includes(old.status)
          || (typeof old.customer === 'string' ? old.customer : old.customer?.id) !== account.stripe_customer_id) throw factoryError('billing_mismatch', 503);
      } else await syncFactoryBilling({ userId: event.user_id, subscriptionId: event.stripe_subscription_id, store, stripe, env });
      await store.markEvent(event.id);
    } catch { /* The durable receipt stays pending for official reconciliation. */ }
    count++;
  }
  return count;
}

async function runFactoryTick({ store, providers, stripe, env, images, fetchImpl = fetch, syncBilling = syncFactoryBilling, maxItems = 4, budgetMs = 40000 }) {
  const deadline = Date.now() + Math.min(budgetMs, 40000);
  let count = await processFactoryEvents({ store, stripe, env, deadline });
  if (env.MONK_FACTORY_ENABLED !== 'true' || !jobRuntimeReady(env) || (await providers.readiness()).ready !== true) return { processed: count };
  for (const row of await store.dueAccounts()) {
    if (Date.now() + 15000 >= deadline || count >= maxItems) break;
    try {
      const account = await syncBilling({ userId: row.user_id, store, stripe, env });
      if (entitled(account) && account.auto_post) {
        const social = await ensureFactorySocial({ userId: row.user_id, store, providers });
        if (social.auto_post && social.instagram_account_id) await store.scheduleAuto(row.user_id);
      }
    } catch { /* Preserve the account cursor and do not reserve a second occurrence. */ }
    count++;
  }
  while (count < Math.min(maxItems, 4) && Date.now() + 15000 < deadline) {
    const job = await store.claimJob();
    if (!job) break;
    await advanceFactoryJob({ job, store, providers, stripe, env, images, syncBilling, deadline, dispatch: row => dispatchImage(row, env, fetchImpl) });
    count++;
  }
  return { processed: count };
}

module.exports = { jobRuntimeReady, signImageTicket, verifyImageTicket, entitled, loadFactoryPlaybooks, createPrivateImages,
  ensureFactorySocial, advanceFactoryJob, runFactoryImage, processFactoryEvents, runFactoryTick };
