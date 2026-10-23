const { authenticateFactoryRequest, factoryError } = require('./_lib/monk-factory.js');
const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { factoryStripeClient, beginFactoryCheckout, syncFactoryBilling, stripeHostedUrl } = require('./_lib/monk-factory-billing.js');

const publicFields = ['subscription_status', 'trial_end', 'period_end', 'period_paid', 'cancel_at_period_end', 'billing_paused', 'auto_post', 'instagram_username', 'connected_at', 'avatar_image_url', 'next_post_at'];
function publicAccount(account) {
  return account ? Object.fromEntries(publicFields.filter(key => Object.hasOwn(account, key)).map(key => [key, account[key]])) : null;
}
const reply = (statusCode, value) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(value) });
async function ready(env, providers) {
  if (env.MONK_FACTORY_ENABLED !== 'true') return false;
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
      if (!body || !['checkout', 'portal', 'stop'].includes(body.action)) throw factoryError('invalid_request', 400);
      if (body.action === 'checkout' && !await ready(env, dependencies.providers)) throw factoryError('factory_unavailable', 503);
    }
    const store = dependencies.store || createFactoryStore({ env });
    if (event.httpMethod === 'GET') {
      let account = await store.account(user.id);
      if (account?.stripe_subscription_id) account = await syncFactoryBilling({ userId: user.id, store, stripe: dependencies.stripe || factoryStripeClient(env), env });
      return reply(200, { account: publicAccount(account), jobs: account ? await store.jobs(user.id) : [], ready: await ready(env, dependencies.providers) });
    }
    if (body.action === 'stop') return reply(200, await store.stop(user.id));
    const stripe = dependencies.stripe || factoryStripeClient(env);
    if (body.action === 'checkout') return reply(200, await beginFactoryCheckout({ user, store, stripe, env }));
    const account = await syncFactoryBilling({ userId: user.id, store, stripe, env });
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
