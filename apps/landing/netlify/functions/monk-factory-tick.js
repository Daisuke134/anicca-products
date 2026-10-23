const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { createFactoryProviders } = require('./_lib/monk-factory-providers.js');
const { factoryStripeClient } = require('./_lib/monk-factory-billing.js');
const { runFactoryTick, createPrivateImages, jobRuntimeReady } = require('./_lib/monk-factory-jobs.js');

async function factoryTickHandler(event, dependencies = {}) {
  const env = dependencies.env || process.env;
  const disabled = { statusCode: 200, body: JSON.stringify({ processed: 0, disabled: true }) };
  if (env.MONK_FACTORY_ENABLED !== 'true' || !jobRuntimeReady(env)) return disabled;
  const providers = dependencies.providers || createFactoryProviders({ env });
  if ((await providers.readiness()).ready !== true) return disabled;
  if (!dependencies.stripe && (!env.STRIPE_SECRET_KEY || !['true','false'].includes(env.MONK_FACTORY_STRIPE_LIVE))) return disabled;
  if (!dependencies.store && (!(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) || !env.SUPABASE_SERVICE_ROLE_KEY)) return disabled;
  const deadline = AbortSignal.timeout(25000);
  const transport = dependencies.fetchImpl || fetch;
  const fetchImpl = (address, options = {}) => transport(address, { ...options, signal: options.signal ? AbortSignal.any([options.signal, deadline]) : deadline });
  try {
    const result = await runFactoryTick({ env, fetchImpl, store: dependencies.store || createFactoryStore({ env, fetchImpl }),
      providers: dependencies.providers || createFactoryProviders({ env, fetchImpl }),
      stripe: dependencies.stripe || factoryStripeClient(env), images: dependencies.images || createPrivateImages(event, fetchImpl),
      ...(dependencies.syncBilling ? { syncBilling: dependencies.syncBilling } : {}) });
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch { return { statusCode: 503, body: JSON.stringify({ error: 'tick_unavailable' }) }; }
}
exports.factoryTickHandler = factoryTickHandler;
exports.handler = event => factoryTickHandler(event);
