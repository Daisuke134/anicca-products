const { authenticateFactoryRequest, factoryError, UUID } = require('./_lib/monk-factory.js');
const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { factoryStripeClient, beginFactoryCheckout, syncFactoryBilling, stripeHostedUrl } = require('./_lib/monk-factory-billing.js');
const { jobRuntimeReady, entitled, ensureFactorySocial } = require('./_lib/monk-factory-jobs.js');

const publicFields = ['subscription_status', 'trial_end', 'period_end', 'period_paid', 'cancel_at_period_end', 'billing_paused', 'auto_post', 'instagram_username', 'connected_at', 'avatar_image_url', 'next_post_at'];
function publicAccount(account) {
  return account ? { ...Object.fromEntries(publicFields.filter(key => Object.hasOwn(account, key)).map(key => [key, account[key]])),
    avatar_ready: !!account.avatar_id, connected: !!account.connected_at && !!account.instagram_account_id,
    social_checked_at: account.social_checked_at || null } : null;
}
const reply = (statusCode, value) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(value) });
async function ready(env, providers) {
  if (env.MONK_FACTORY_ENABLED !== 'true' || !jobRuntimeReady(env)) return false;
  try {
    const api = providers || require('./_lib/monk-factory-providers.js').createFactoryProviders({ env });
    return (await api.readiness()).ready === true;
  } catch { return false; }
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
      if (!['portal','stop'].includes(body.action) && !await ready(env, dependencies.providers)) throw factoryError('factory_unavailable', 503);
    }
    const store = dependencies.store || createFactoryStore({ env });
    const syncBilling = dependencies.syncBilling || syncFactoryBilling;
    const providers = () => dependencies.providers || require('./_lib/monk-factory-providers.js').createFactoryProviders({ env });
    const billing = () => dependencies.stripe || factoryStripeClient(env);
    if (event.httpMethod === 'GET') {
      let account = await store.account(user.id);
      if (account?.stripe_subscription_id) account = await syncBilling({ userId: user.id, store, stripe: billing(), env });
      if (account?.social_profile || account?.social_submit_started_at) {
        try { account = await ensureFactorySocial({ userId: user.id, store, providers: providers() }); } catch { /* Preserve the last official readback timestamp. */ }
      }
      return reply(200, { account: publicAccount(account), jobs: account ? await store.jobs(user.id) : [], ready: await ready(env, dependencies.providers),
        usage: account && store.usage ? await store.usage(user.id) : null });
    }
    if (body.action === 'stop') { await store.stop(user.id); return reply(200, { auto_post: false }); }
    if (['generate_avatar','generate_video'].includes(body.action)) {
      let occurrence = 'avatar:lifetime';
      if (body.action === 'generate_video') {
        const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key,value]) => [key.toLowerCase(),value]));
        if (!UUID.test(headers['idempotency-key'] || '')) throw factoryError('invalid_request', 400);
        occurrence = 'manual:' + headers['idempotency-key'].toLowerCase();
      }
      const account = await syncBilling({ userId: user.id, store, stripe: dependencies.syncBilling ? dependencies.stripe : billing(), env });
      if (body.action === 'generate_video' && !account?.avatar_id) throw factoryError('avatar_required', 409);
      const job = await store.reserveJob(user.id, occurrence, body.action === 'generate_avatar' ? 'avatar' : 'video');
      return reply(202, { jobId: job.id });
    }
    const stripe = billing();
    if (body.action === 'checkout') return reply(200, await beginFactoryCheckout({ user, store, stripe, env }));
    const account = await syncBilling({ userId: user.id, store, stripe, env });
    if (['connect_instagram','autopost'].includes(body.action)) {
      if (!entitled(account)) throw factoryError('subscription_required', 402);
      const api = providers();
      const connected = await ensureFactorySocial({ userId: user.id, store, providers: api, create: body.action === 'connect_instagram' });
      if (body.action === 'autopost') {
        if (!connected.instagram_account_id || !connected.connected_at || !connected.avatar_id) throw factoryError('instagram_required', 409);
        return reply(200, await store.setAutopost(user.id));
      }
      const result = await api.connectInstagram(user.id);
      return reply(200, { url: result.accessUrl });
    }
    if (!account?.stripe_customer_id || !account.stripe_subscription_id || !env.MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID) throw factoryError('portal_unavailable', 503);
    const portal = await stripe.billingPortal.sessions.create({ customer: account.stripe_customer_id, configuration: env.MONK_FACTORY_STRIPE_PORTAL_CONFIGURATION_ID,
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
