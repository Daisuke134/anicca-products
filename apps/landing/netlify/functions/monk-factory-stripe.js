const { FACTORY_PRODUCT, UUID } = require('./_lib/monk-factory.js');
const { factoryStripeClient, factoryLiveMode } = require('./_lib/monk-factory-billing.js');
const { createFactoryStore } = require('./_lib/monk-factory-store.js');

const idOf = value => typeof value === 'string' ? value : value?.id;
function eventRecord(event) {
  const object = event.data?.object;
  let metadata = object?.metadata;
  let subscriptionId;
  if (event.type.startsWith('invoice.')) {
    metadata = object?.parent?.subscription_details?.metadata;
    subscriptionId = idOf(object?.parent?.subscription_details?.subscription);
    if (!['invoice.paid', 'invoice.payment_failed'].includes(event.type)) return null;
  } else if (event.type.startsWith('customer.subscription.')) {
    if (!['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'].includes(event.type)) return null;
    subscriptionId = object?.id;
  } else if (['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) {
    if (metadata?.product === FACTORY_PRODUCT && (object.client_reference_id !== metadata.user_id || object.mode !== 'subscription')) throw new Error('mismatched checkout');
    subscriptionId = idOf(object?.subscription) || null;
  } else return null;
  if (metadata?.product !== FACTORY_PRODUCT) return null;
  if (!UUID.test(metadata.user_id || '') || !event.id?.startsWith('evt_') || !object?.id
    || (event.type !== 'checkout.session.expired' && !subscriptionId?.startsWith('sub_'))) throw new Error('invalid event');
  return { id: event.id, user_id: metadata.user_id, event_type: event.type, stripe_object_id: object.id, stripe_subscription_id: subscriptionId };
}

async function factoryStripeHandler(event, dependencies = {}) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' };
  const env = dependencies.env || process.env;
  let stripe, liveMode;
  try {
    if (!env.MONK_FACTORY_STRIPE_WEBHOOK_SECRET) throw new Error();
    liveMode = factoryLiveMode(env);
    stripe = dependencies.stripe || factoryStripeClient(env);
  } catch { return { statusCode: 503, body: 'webhook unavailable' }; }
  let payload;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body;
    if (!raw || Buffer.byteLength(raw) > 1048576) throw new Error();
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
    payload = stripe.webhooks.constructEvent(raw, headers['stripe-signature'], env.MONK_FACTORY_STRIPE_WEBHOOK_SECRET);
    if (payload.livemode !== liveMode) throw new Error();
  } catch { return { statusCode: 400, body: 'invalid signature or mode' }; }
  let row;
  try { row = eventRecord(payload); } catch { return { statusCode: 400, body: 'invalid Factory event' }; }
  if (!row) return { statusCode: 200, body: 'ignored' };
  try {
    const store = dependencies.store || createFactoryStore({ env });
    await store.enqueueEvent(row);
    return { statusCode: 200, body: 'received' };
  } catch { return { statusCode: 503, body: 'receipt unavailable' }; }
}

exports.factoryStripeHandler = factoryStripeHandler;
exports.handler = event => factoryStripeHandler(event);
