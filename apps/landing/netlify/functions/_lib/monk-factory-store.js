const { createClient } = require('@supabase/supabase-js');
const { UUID, factoryError } = require('./monk-factory.js');

const conflicts = new Set(['profile_capacity', 'profile_required', 'subscription_exists', 'free_quota_remaining', 'occurrence_conflict', 'avatar_exists', 'billing_sync_conflict', 'instagram_required', 'social_mismatch', 'autopost_stopped', 'video_required']);
async function checked(query) {
  const { data, error } = await query;
  if (error) {
    if (error.code === 'P0001') {
      if (conflicts.has(error.message)) throw factoryError(error.message, 409);
      if (['quota_exhausted', 'budget_exhausted', 'company_budget_exhausted'].includes(error.message)) throw factoryError(error.message, 429);
      if (error.message === 'spend_cap_setup') throw factoryError(error.message, 503);
      if (['subscription_required', 'job_period_expired'].includes(error.message)) throw factoryError(error.message, 402);
    }
    throw factoryError('store_unavailable', 503);
  }
  return data;
}

function createFactoryStore({ env = process.env, fetchImpl = fetch } = {}) {
  let url;
  try { url = new URL(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL); } catch { throw factoryError('store_unavailable', 503); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !env.SUPABASE_SERVICE_ROLE_KEY) throw factoryError('store_unavailable', 503);
  const db = createClient(url.origin, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (address, options) => fetchImpl(address, { ...options, signal: AbortSignal.timeout(10000) }) },
  });
  const uid = id => { if (!UUID.test(id || '')) throw factoryError('invalid_request', 400); return id; };
  const accounts = () => db.from('monk_factory_accounts');
  const rpc = (name, input) => checked(db.rpc(name, input));
  const checkoutReset = { checkout_nonce: null, checkout_created_at: null, checkout_price_id: null, checkout_customer_id: null, checkout_email: null, checkout_trial: null, checkout_session_id: null };
  return {
    account: id => checked(accounts().select('*').eq('user_id', uid(id)).maybeSingle()),
    reserveProfile: id => rpc('monk_factory_reserve_profile', { p_user_id: uid(id) }),
    reserveJob: (id, occurrence, kind, origin = 'manual') => rpc('monk_factory_start_job', { p_user_id: uid(id), p_occurrence_id: occurrence, p_kind: kind, p_origin: origin }),
    jobByOccurrence: (id, occurrence) => checked(db.from('monk_factory_jobs').select('id,kind').eq('user_id', uid(id)).eq('occurrence_id', occurrence).maybeSingle()),
    job: id => checked(db.from('monk_factory_jobs').select('*').eq('id', uid(id)).maybeSingle()),
    claimJob: (id = null, image = false) => rpc('monk_factory_claim_job', { p_job_id: id == null ? null : uid(id), p_image: image }),
    advanceJob: (job, patch, keep = false) => rpc('monk_factory_advance_job', { p_job_id: uid(job.id), p_lease_id: uid(job.lease_id), p_stage: job.stage, p_patch: patch, p_keep_lease: keep }),
    usage: id => rpc('monk_factory_usage', { p_user_id: uid(id) }),
    companyBudgetStatus: () => rpc('monk_factory_company_budget_status', {}),
    claimSocial: id => rpc('monk_factory_claim_social', { p_user_id: uid(id) }),
    fenceInstagramPublish: (id, lease) => rpc('monk_factory_fence_instagram_publish', { p_job_id: uid(id), p_lease_id: uid(lease) }),
    fenceSocial: (id, lease) => rpc('monk_factory_fence_social', { p_user_id: uid(id), p_lease_id: uid(lease) }),
    saveSocial: (id, lease, state) => rpc('monk_factory_save_social', { p_user_id: uid(id), p_lease_id: uid(lease), p_state: state }),
    releaseSocial: (id, lease) => checked(accounts().update({ social_lease_id: null, social_lease_until: null }).eq('user_id', uid(id)).eq('social_lease_id', uid(lease))),
    async beginInstagramOAuth(id, stateHash, expiresAt) {
      if (!/^[a-f0-9]{64}$/.test(stateHash) || !Number.isFinite(Date.parse(expiresAt))) throw factoryError('invalid_request', 400);
      const row = await checked(accounts().update({ instagram_oauth_state_hash: stateHash, instagram_oauth_state_expires_at: expiresAt })
        .eq('user_id', uid(id)).select('user_id').maybeSingle());
      if (!row) throw factoryError('profile_required', 409);
      return row;
    },
    async consumeInstagramOAuth(stateHash, now) {
      if (!/^[a-f0-9]{64}$/.test(stateHash) || !Number.isFinite(Date.parse(now))) return null;
      const row = await checked(accounts().update({ instagram_oauth_state_hash: null, instagram_oauth_state_expires_at: null })
        .eq('instagram_oauth_state_hash', stateHash).gt('instagram_oauth_state_expires_at', now).select('user_id').maybeSingle());
      return row?.user_id || null;
    },
    async saveInstagramCredential(id, state) {
      const fields = ['instagram_access_token_ciphertext', 'instagram_account_id', 'instagram_username', 'connected_at'];
      if (!state || typeof state.instagram_access_token_ciphertext !== 'string' || !state.instagram_access_token_ciphertext.startsWith('v1.')
        || typeof state.instagram_account_id !== 'string' || typeof state.instagram_username !== 'string' || !Number.isFinite(Date.parse(state.connected_at))) {
        throw factoryError('invalid_request', 400);
      }
      const row = await checked(accounts().update({ ...Object.fromEntries(fields.map(key => [key, state[key]])),
        instagram_access_token_expires_at: state.instagram_access_token_expires_at || null, instagram_business_id: state.instagram_business_id || null,
        social_profile: 'factory_' + uid(id).toLowerCase() })
        .eq('user_id', uid(id)).select('user_id,instagram_account_id,instagram_username,connected_at').maybeSingle());
      if (!row) throw factoryError('profile_required', 409);
      return row;
    },
    instagramCredential: id => checked(accounts().select('user_id,instagram_access_token_ciphertext,instagram_access_token_expires_at,instagram_business_id,instagram_account_id,instagram_username,connected_at').eq('user_id', uid(id)).maybeSingle()),
    setAutopost: id => rpc('monk_factory_set_autopost', { p_user_id: uid(id) }),
    setAutopostIntent: (id, enabled) => rpc('monk_factory_set_autopost_intent', { p_user_id: uid(id), p_enabled: enabled === true }),
    scheduleAuto: id => rpc('monk_factory_schedule_auto', { p_user_id: uid(id) }),
    dueAccounts: () => checked(accounts().select('user_id').eq('auto_post', true).lte('next_post_at', new Date().toISOString()).order('next_post_at').limit(2)),
    checkoutContext: (id, price, email) => rpc('monk_factory_checkout_context', { p_user_id: uid(id), p_price_id: price, p_email: email }),
    claimBilling: id => rpc('monk_factory_claim_billing', { p_user_id: uid(id) }),
    applyBilling: (id, nonce, state) => rpc('monk_factory_apply_billing', { p_user_id: uid(id), p_nonce: nonce, p_state: state }),
    releaseBilling: (id, nonce) => checked(accounts().update({ billing_sync_nonce: null, billing_sync_until: null }).eq('user_id', uid(id)).eq('billing_sync_nonce', nonce)),
    async saveCheckout(id, nonce, sessionId) {
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw factoryError('billing_mismatch', 503);
      const row = await checked(accounts().update({ checkout_session_id: sessionId }).eq('user_id', uid(id)).eq('checkout_nonce', nonce)
        .or('checkout_session_id.is.null,checkout_session_id.eq.' + sessionId).select('*').maybeSingle());
      if (!row) throw factoryError('checkout_conflict', 409);
      return row;
    },
    async resetCheckout(id, nonce) {
      const row = await checked(accounts().update(checkoutReset).eq('user_id', uid(id)).eq('checkout_nonce', nonce).select('*').maybeSingle());
      if (!row) throw factoryError('checkout_conflict', 409);
      return row;
    },
    releaseUnusedProfile: (id, nonce, session, subscription) => rpc('monk_factory_release_unused_profile', {
      p_user_id: uid(id), p_checkout_nonce: uid(nonce), p_checkout_session_id: session, p_subscription_id: subscription }),
    stop: id => checked(accounts().update({ auto_post: false, auto_post_intent: false }).eq('user_id', uid(id)).select('auto_post').maybeSingle()),
    jobs: id => checked(db.from('monk_factory_jobs').select('id,kind,status,stage,period_key,max_seconds,video_url,image_url,post_url,post_provider_id,post_id,metrics,metrics_at,metrics_checked_at,error_class,created_at').eq('user_id', uid(id)).order('created_at', { ascending: false }).limit(40)),
    async claimMetricsRefresh(id, jobId, postId, expectedMetricsAt, expectedCheckedAt, checkedAt) {
      if (typeof postId !== 'string' || !postId || postId.length > 200 || !Number.isFinite(Date.parse(checkedAt))) throw factoryError('invalid_request', 400);
      let query = db.from('monk_factory_jobs').update({ metrics_checked_at: checkedAt }).eq('user_id', uid(id))
        .eq('id', uid(jobId)).eq('kind', 'video').eq('status', 'completed').eq('post_id', postId).not('post_url', 'is', null);
      query = expectedMetricsAt ? query.eq('metrics_at', expectedMetricsAt) : query.is('metrics_at', null);
      query = expectedCheckedAt ? query.eq('metrics_checked_at', expectedCheckedAt) : query.is('metrics_checked_at', null);
      return checked(query.select('id,post_id,post_url,metrics,metrics_at,metrics_checked_at').maybeSingle());
    },
    async saveMetrics(id, jobId, postId, checkedAt, metrics, metricsAt) {
      if (typeof postId !== 'string' || !postId || postId.length > 200 || !Number.isFinite(Date.parse(checkedAt))
        || !Number.isFinite(Date.parse(metricsAt)) || !metrics || typeof metrics !== 'object' || Array.isArray(metrics)) throw factoryError('invalid_request', 400);
      return checked(db.from('monk_factory_jobs').update({ metrics, metrics_at: metricsAt }).eq('user_id', uid(id))
        .eq('id', uid(jobId)).eq('kind', 'video').eq('status', 'completed').eq('post_id', postId).eq('metrics_checked_at', checkedAt)
        .select('id,metrics,metrics_at').maybeSingle());
    },
    enqueueEvent: row => checked(db.from('monk_factory_stripe_events').upsert(row, { onConflict: 'id', ignoreDuplicates: true })),
    pendingEvents: () => checked(db.from('monk_factory_stripe_events').select('*').is('processed_at', null).lte('next_attempt_at', new Date().toISOString()).order('created_at').limit(10)),
    markEvent: id => checked(db.from('monk_factory_stripe_events').update({ processed_at: new Date().toISOString(), error_class: null }).eq('id', id)),
    deferEvent: (id, patch) => checked(db.from('monk_factory_stripe_events').update(patch).eq('id', id).is('processed_at', null)),
  };
}

module.exports = { createFactoryStore };
