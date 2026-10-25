const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { createFactoryProviders } = require('./_lib/monk-factory-providers.js');
const { factoryStripeClient } = require('./_lib/monk-factory-billing.js');
const { verifyImageTicket, runFactoryImage, createPrivateImages } = require('./_lib/monk-factory-jobs.js');

async function imageBackgroundHandler(event, dependencies = {}) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };
  const env = dependencies.env || process.env;
  let ticket;
  try {
    if (Buffer.byteLength(event.body || '') > 2048) throw new Error();
    ticket = JSON.parse(event.body || '{}').ticket;
    verifyImageTicket(ticket, env);
  } catch { return { statusCode: 401, body: '' }; }
  try {
    const store = dependencies.store || createFactoryStore({ env });
    await runFactoryImage({ ticket, env, store,
      providers: dependencies.providers || createFactoryProviders({ env, socialStore: store }),
      stripe: dependencies.stripe || factoryStripeClient(env), images: dependencies.images || createPrivateImages(event),
      ...(dependencies.syncBilling ? { syncBilling: dependencies.syncBilling } : {}) });
    return { statusCode: 204, body: '' };
  } catch { return { statusCode: 503, body: '' }; }
}
exports.imageBackgroundHandler = imageBackgroundHandler;
exports.handler = event => imageBackgroundHandler(event);
