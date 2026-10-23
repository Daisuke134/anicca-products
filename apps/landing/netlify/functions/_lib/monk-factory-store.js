const { createClient } = require('@supabase/supabase-js');
const { UUID, factoryError } = require('./monk-factory.js');

const conflicts = new Set(['profile_capacity', 'profile_required', 'subscription_exists', 'occurrence_conflict', 'avatar_exists', 'billing_sync_conflict', 'instagram_required', 'social_mismatch']);
async function checked(query) {
  const { data, error } = await query;
  if (error) {
    if (error.code === 'P0001') {
      if (conflicts.has(error.message)) throw factoryError(error.message, 409);
      if (['quota_exhausted', 'budget_exhausted'].includes(error.message)) throw factoryError(error.message, 429);
      if (error.message === 'subscription_required') throw factoryError(error.message, 402);
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
    reserveJob: (id, occurrence, kind) => rpc('monk_factory_start_job', { p_user_id: uid(id), p_occurrence_id: occurrence, p_kind: kind, p_origin: 'manual' }),
    job: id => checked(db.from('monk_factory_jobs').select('*').eq('id', uid(id)).maybeSingle()),
    claimJob: (id = null, image = false) => rpc('monk_factory_claim_job', { p_job_id: id == null ? null : uid(id), p_image: image }),
    advanceJob: (job, patch, keep = false) => rpc('monk_factory_advance_job', { p_job_id: uid(job.id), p_lease_id: uid(job.lease_id), p_stage: job.stage, p_patch: patch, p_keep_lease: keep }),
    usage: id => rpc('monk_factory_usage', { p_user_id: uid(id) }),
    claimSocial: id => rpc('monk_factory_claim_social', { p_user_id: uid(id) }),
    fenceSocial: (id, lease) => rpc('monk_factory_fence_social', { p_user_id: uid(id), p_lease_id: uid(lease) }),
    saveSocial: (id, lease, state) => rpc('monk_factory_save_social', { p_user_id: uid(id), p_lease_id: uid(lease), p_state: state }),
    releaseSocial: (id, lease) => checked(accounts().update({ social_lease_id: null, social_lease_until: null }).eq('user_id', uid(id)).eq('social_lease_id', uid(lease))),
    setAutopost: id => rpc('monk_factory_set_autopost', { p_user_id: uid(id) }),
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
    releaseUnusedProfile: (id, nonce) => checked(accounts().update({ profile_reserved_at: null }).eq('user_id', uid(id)).eq('checkout_nonce', nonce).eq('trial_used', false).is('social_profile', null).is('social_submit_started_at', null).is('stripe_subscription_id', null)),
    stop: id => checked(accounts().update({ auto_post: false }).eq('user_id', uid(id)).select('auto_post').maybeSingle()),
    jobs: id => checked(db.from('monk_factory_jobs').select('id,kind,status,stage,max_seconds,video_url,image_url,post_url,metrics,metrics_at,error_class,created_at').eq('user_id', uid(id)).order('created_at', { ascending: false }).limit(40)),
    enqueueEvent: row => checked(db.from('monk_factory_stripe_events').upsert(row, { onConflict: 'id', ignoreDuplicates: true })),
    pendingEvents: () => checked(db.from('monk_factory_stripe_events').select('*').is('processed_at', null).order('created_at').limit(10)),
    markEvent: id => checked(db.from('monk_factory_stripe_events').update({ processed_at: new Date().toISOString() }).eq('id', id)),
  };
}

module.exports = { createFactoryStore };
