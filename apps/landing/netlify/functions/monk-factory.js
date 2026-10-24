const { authenticateFactoryRequest, factoryError, UUID } = require('./_lib/monk-factory.js');
const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { factoryStripeClient, beginFactoryCheckout, syncFactoryBilling, stripeHostedUrl, factoryBillingReady } = require('./_lib/monk-factory-billing.js');
const { jobRuntimeReady, entitled, ensureFactorySocial } = require('./_lib/monk-factory-jobs.js');

const publicFields = ['subscription_status', 'period_end', 'period_paid', 'cancel_at_period_end', 'billing_paused', 'auto_post', 'auto_post_intent', 'instagram_username', 'connected_at', 'avatar_image_url', 'next_post_at'];
function publicAccount(account) {
  return account ? { ...Object.fromEntries(publicFields.filter(key => Object.hasOwn(account, key)).map(key => [key, account[key]])),
    avatar_ready: !!account.avatar_id, connected: !!account.connected_at && !!account.instagram_account_id,
    social_checked_at: account.social_checked_at || null } : null;
}
const reply = (statusCode, value) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(value) });
const freeQuotaAvailable = usage => Number.isSafeInteger(usage?.videosRemaining) && usage.videosRemaining > 0
  && Number.isSafeInteger(usage?.attemptsRemaining) && usage.attemptsRemaining > 0;

async function factoryReadiness(env, providers, store) {
  let providerState;
  try {
    const api = providers || require('./_lib/monk-factory-providers.js').createFactoryProviders({ env });
    providerState = await api.readiness();
  } catch { providerState = {}; }
  const enabled = env.MONK_FACTORY_ENABLED === 'true';
  const generationProviderReady = providerState.generation?.ready === true || (!providerState.generation && providerState.ready === true);
  const socialProviderReady = providerState.social?.ready === true || (!providerState.social && providerState.ready === true);
  let companyBudget;
  try { companyBudget = await store?.companyBudgetStatus?.(); } catch { companyBudget = null; }
  const companyBudgetReady = companyBudget?.ready === true;
  const companyBudgetReason = companyBudget?.reason === 'company_budget_exhausted' ? 'company_budget_exhausted' : 'spend_cap_setup';
  const runtimeReady = jobRuntimeReady(env);
  const generation = { ready: enabled && runtimeReady && generationProviderReady && companyBudgetReady,
    reason: !enabled ? 'studio_setup' : !runtimeReady ? 'runtime_setup' : !generationProviderReady ? 'provider_setup' : !companyBudgetReady ? companyBudgetReason : null };
  const social = { ready: enabled && socialProviderReady && generation.ready,
    reason: !enabled ? 'studio_setup' : !socialProviderReady ? 'social_setup' : !generation.ready ? generation.reason : null };
  const checkout = { ready: enabled && factoryBillingReady(env) && generation.ready && social.ready,
    reason: !enabled ? 'studio_setup' : !factoryBillingReady(env) ? 'billing_setup' : !generation.ready ? generation.reason : !social.ready ? social.reason : null };
  return { generation, checkout, social };
}
function requireCapability(readiness, capability) {
  if (!readiness[capability]?.ready) {
    if (readiness[capability]?.reason === 'company_budget_exhausted') throw factoryError('company_budget_exhausted', 429);
    if (readiness[capability]?.reason === 'spend_cap_setup') throw factoryError('spend_cap_setup', 503);
    const code = capability === 'generation' ? 'generation_unavailable' : capability === 'checkout' ? 'checkout_unavailable' : 'social_unavailable';
    throw factoryError(code, 503);
  }
}

async function factoryHandler(event, dependencies = {}) {
  if (!['GET', 'POST'].includes(event.httpMethod)) return reply(405, { error: 'method_not_allowed' });
  const env = dependencies.env || process.env;
  try {
    const user = await authenticateFactoryRequest(event, { env, fetchImpl: dependencies.fetchImpl || fetch });
    let body = {};
    if (event.httpMethod === 'POST') {
      try {
        if (Buffer.byteLength(event.body || '') > 8192) throw new Error();
        body = JSON.parse(event.body || '{}');
      } catch { throw factoryError('invalid_request', 400); }
      if (!body || !['checkout', 'portal', 'stop', 'generate_avatar', 'generate_video', 'connect_instagram', 'autopost'].includes(body.action)) throw factoryError('invalid_request', 400);
    }
    const store = dependencies.store || createFactoryStore({ env });
    const syncBilling = dependencies.syncBilling || syncFactoryBilling;
    const providerApi = () => dependencies.providers || require('./_lib/monk-factory-providers.js').createFactoryProviders({ env });
    const billing = () => dependencies.stripe || factoryStripeClient(env);
    const getAccount = async () => {
      await store.usage?.(user.id);
      let account = await store.account(user.id);
      if (account?.stripe_subscription_id) account = await syncBilling({ userId: user.id, store,
        stripe: dependencies.syncBilling ? dependencies.stripe : billing(), env });
      return account;
    };
    if (event.httpMethod === 'GET') {
      const readiness = await factoryReadiness(env, dependencies.providers, store);
      const usage = store.usage ? await store.usage(user.id) : null;
      let account = await store.account(user.id);
      if (account?.stripe_subscription_id) account = await syncBilling({ userId: user.id, store,
        stripe: dependencies.syncBilling ? dependencies.stripe : billing(), env });
      if ((account?.social_profile || account?.social_submit_started_at) && readiness.social.ready) {
        let confirmed = false;
        try { account = await ensureFactorySocial({ userId: user.id, store, providers: providerApi() }); confirmed = true; }
        catch { /* Keep the last account readback available, including Stop. */ }
        const generationAccess = confirmed && readiness.generation.ready && (entitled(account) || freeQuotaAvailable(usage));
        if (generationAccess && account.auto_post_intent && !account.auto_post && account.connected_at && account.instagram_account_id) {
          await store.setAutopost(user.id);
          account = await store.account(user.id);
        }
        let jobs = account ? await store.jobs(user.id) : [];
        if (account?.auto_post && account.connected_at && account.instagram_account_id && generationAccess
          && !account.avatar_id && !jobs.some(job => job.kind === 'avatar')) {
          await store.reserveJob(user.id, 'avatar:lifetime', 'avatar', 'auto');
          jobs = await store.jobs(user.id);
        }
        return reply(200, { account: publicAccount(account), jobs, ready: readiness.generation.ready, readiness, usage });
      }
      return reply(200, { account: publicAccount(account), jobs: account ? await store.jobs(user.id) : [],
        ready: readiness.generation.ready, readiness, usage });
    }
    if (body.action === 'stop') { await store.stop(user.id); return reply(200, { auto_post: false }); }
    if (body.action === 'checkout') {
      const usage = store.usage ? await store.usage(user.id) : null;
      if (freeQuotaAvailable(usage)) throw factoryError('free_quota_remaining', 409);
      const readiness = await factoryReadiness(env, dependencies.providers, store);
      requireCapability(readiness, 'checkout');
      return reply(200, await beginFactoryCheckout({ user, store, stripe: billing(), env }));
    }
    if (['generate_avatar', 'generate_video'].includes(body.action)) {
      let occurrence = 'avatar:lifetime';
      if (body.action === 'generate_video') {
        const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
        if (!UUID.test(headers['idempotency-key'] || '')) throw factoryError('invalid_request', 400);
        occurrence = 'manual:' + headers['idempotency-key'].toLowerCase();
      }
      const kind = body.action === 'generate_avatar' ? 'avatar' : 'video';
      const previous = await store.jobByOccurrence?.(user.id, occurrence);
      if (previous) {
        if (previous.kind !== kind) throw factoryError('occurrence_conflict', 409);
        return reply(202, { jobId: previous.id });
      }
      const readiness = await factoryReadiness(env, dependencies.providers, store);
      requireCapability(readiness, 'generation');
      const account = await getAccount();
      if (body.action === 'generate_video' && !account?.avatar_id) throw factoryError('avatar_required', 409);
      const job = await store.reserveJob(user.id, occurrence, kind);
      return reply(202, { jobId: job.id });
    }
    if (['connect_instagram', 'autopost'].includes(body.action)) {
      const readiness = await factoryReadiness(env, dependencies.providers, store);
      requireCapability(readiness, 'social');
      const account = await getAccount();
      const usage = store.usage ? await store.usage(user.id) : null;
      if (!entitled(account) && !freeQuotaAvailable(usage)) throw factoryError('subscription_required', 402);
      if (body.action === 'connect_instagram') await store.reserveProfile(user.id);
      const api = providerApi();
      const connected = await ensureFactorySocial({ userId: user.id, store, providers: api, create: body.action === 'connect_instagram' });
      if (body.action === 'autopost') {
        if (!connected.instagram_account_id || !connected.connected_at) throw factoryError('instagram_required', 409);
        const enabled = await store.setAutopost(user.id);
        const jobs = await store.jobs(user.id);
        if (!connected.avatar_id && !jobs.some(job => job.kind === 'avatar')) {
          await store.reserveJob(user.id, 'avatar:lifetime', 'avatar', 'auto');
        }
        return reply(200, enabled);
      }
      await store.setAutopostIntent(user.id, true);
      try {
        const result = await api.connectInstagram(user.id);
        return reply(200, { url: result.accessUrl });
      } catch (error) {
        await store.setAutopostIntent(user.id, false).catch(() => {});
        throw error;
      }
    }
    const account = await getAccount();
    if (!account?.stripe_customer_id || !account.stripe_subscription_id || !env.MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID) throw factoryError('portal_unavailable', 503);
    const portal = await billing().billingPortal.sessions.create({ customer: account.stripe_customer_id, configuration: env.MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID,
      return_url: 'https://aniccaai.com/ai-monk-factory',
      flow_data: { type: 'subscription_cancel', subscription_cancel: { subscription: account.stripe_subscription_id } },
    });
    return reply(200, { url: stripeHostedUrl(portal.url, 'billing.stripe.com') });
  } catch (error) {
    const safe = Number.isInteger(error.status) && error.status >= 400 && error.status <= 503 && /^[a-z_]{1,60}$/.test(error.code || '');
    return reply(safe ? error.status : 503, { error: safe ? error.code : 'factory_unavailable' });
  }
}

exports.factoryHandler = factoryHandler;
exports.handler = event => factoryHandler(event);
