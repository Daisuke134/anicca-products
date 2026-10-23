const { FACTORY_PRODUCT, UUID, factoryError, validateFactoryPrice, buildFactoryCheckout } = require('./monk-factory.js');

const objectId = value => typeof value === 'string' ? value : value?.id;
const timestamp = value => Number.isSafeInteger(value) && value > 0;
const iso = value => timestamp(value) ? new Date(value * 1000).toISOString() : null;

// Input must come from Stripe's authenticated subscription GET, with latest_invoice expanded.
function subscriptionPatch({ subscription: sub, user, priceId, liveMode, customerId }) {
  const items = sub?.items?.data;
  const item = items?.[0];
  if (!UUID.test(user?.id || '') || typeof liveMode !== 'boolean' || sub?.livemode !== liveMode
      || !sub.id?.startsWith('sub_') || !objectId(sub.customer)?.startsWith('cus_')
      || (customerId && objectId(sub.customer) !== customerId)
      || sub.metadata?.product !== FACTORY_PRODUCT || sub.metadata.user_id !== user.id
      || !['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused'].includes(sub.status)
      || items?.length !== 1 || sub.items.has_more || item.quantity !== 1 || item.price?.id !== priceId
      || !timestamp(item.current_period_start) || !timestamp(item.current_period_end)
      || item.current_period_end <= item.current_period_start
      || ((sub.trial_start != null || sub.trial_end != null)
        && (!timestamp(sub.trial_start) || !timestamp(sub.trial_end) || sub.trial_end <= sub.trial_start))
      || (sub.status === 'trialing' && (!timestamp(sub.trial_start) || !timestamp(sub.trial_end)))) {
    throw factoryError('billing_mismatch', 503);
  }
  try { validateFactoryPrice(item.price); } catch { throw factoryError('billing_mismatch', 503); }
  const invoice = sub.latest_invoice;
  const paid = sub.status === 'active' && !sub.pause_collection && invoice?.status === 'paid'
    && objectId(invoice.parent?.subscription_details?.subscription) === sub.id
    && invoice.lines?.has_more === false && invoice.lines.data.some(line =>
      objectId(line.pricing?.price_details?.price) === priceId
      && objectId(line.parent?.subscription_item_details?.subscription_item) === item.id
      && line.period?.start === item.current_period_start && line.period?.end === item.current_period_end);
  const stop = sub.cancel_at_period_end || sub.pause_collection || !(sub.status === 'trialing' || paid);
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: objectId(sub.customer),
    subscription_status: sub.status,
    trial_used: timestamp(sub.trial_start),
    trial_start: iso(sub.trial_start), trial_end: iso(sub.trial_end),
    period_start: iso(item.current_period_start), period_end: iso(item.current_period_end),
    period_paid: !!paid,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    billing_paused: !!sub.pause_collection,
    ...(stop ? { auto_post: false } : {}),
  };
}

function factoryLiveMode(env) {
  if (!['true', 'false'].includes(env.MONK_FACTORY_STRIPE_LIVE)) throw factoryError('billing_unavailable', 503);
  return env.MONK_FACTORY_STRIPE_LIVE === 'true';
}

function factoryStripeClient(env) {
  factoryLiveMode(env);
  if (!env.STRIPE_SECRET_KEY) throw factoryError('billing_unavailable', 503);
  const Stripe = require('stripe');
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia', timeout: 10000, maxNetworkRetries: 0 });
}

function stripeHostedUrl(value, hostname = 'checkout.stripe.com') {
  let url;
  try { url = new URL(value); } catch { throw factoryError('billing_mismatch', 503); }
  if (url.protocol !== 'https:' || url.host !== hostname || url.username || url.password) throw factoryError('billing_mismatch', 503);
  return url.href;
}

async function syncFactoryBilling({ userId, subscriptionId, store, stripe, env }) {
  const account = await store.claimBilling(userId);
  if (!account) throw factoryError('billing_sync_in_progress', 409);
  const nonce = account.billing_sync_nonce;
  try {
    if (account.user_id !== userId) throw factoryError('billing_mismatch', 503);
    const id = subscriptionId || account.stripe_subscription_id;
    if (!id) { await store.releaseBilling(userId, nonce); return account; }
    const replacing = id !== account.stripe_subscription_id;
    if (replacing && account.stripe_subscription_id && !['none', 'canceled', 'incomplete_expired'].includes(account.subscription_status)) throw factoryError('billing_mismatch', 503);
    const sub = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] });
    if (sub.id !== id || (replacing && (!UUID.test(account.checkout_nonce || '') || sub.metadata?.checkout_nonce !== account.checkout_nonce))) throw factoryError('billing_mismatch', 503);
    const state = subscriptionPatch({ subscription: sub, user: { id: userId }, priceId: env.MONK_FACTORY_STRIPE_PRICE_ID,
      liveMode: factoryLiveMode(env), customerId: account.stripe_customer_id });
    const updated = await store.applyBilling(userId, nonce, state);
    if (!updated) throw factoryError('store_unavailable', 503);
    return updated;
  } catch (error) {
    await store.releaseBilling(userId, nonce).catch(() => {});
    throw error;
  }
}

function validateCheckout(session, context, userId) {
  if (!session?.id?.startsWith('cs_') || session.mode !== 'subscription' || session.client_reference_id !== userId
    || session.metadata?.product !== FACTORY_PRODUCT || session.metadata.user_id !== userId
    || session.metadata.checkout_nonce !== context.checkout_nonce
    || (context.checkout_customer_id && objectId(session.customer) !== context.checkout_customer_id)
    || !['open', 'complete', 'expired'].includes(session.status)) throw factoryError('billing_mismatch', 503);
}

async function findCheckout(stripe, context, userId, created) {
  let after;
  const found = [];
  for (let page = 0; page < 5; page++) {
    const list = await stripe.checkout.sessions.list({ limit: 100, created: { gte: Math.floor(created/1000)-5, lte: Math.floor(created/1000)+23*3600 }, ...(after ? { starting_after: after } : {}) });
    for (const session of list.data) if (session.metadata?.checkout_nonce === context.checkout_nonce && session.metadata.user_id === userId) found.push(session);
    if (!list.has_more) {
      if (found.length > 1) throw factoryError('checkout_reconciliation_required', 503);
      return found[0] || null;
    }
    after = list.data.at(-1)?.id;
    if (!after) break;
  }
  throw factoryError('checkout_reconciliation_required', 503);
}

async function beginFactoryCheckout({ user, store, stripe, env, now = Date.now, allowReset = true }) {
  let account = await store.reserveProfile(user.id);
  if (account.stripe_subscription_id) account = await syncFactoryBilling({ userId: user.id, store, stripe, env });
  if (account.stripe_subscription_id && !['none', 'canceled', 'incomplete_expired'].includes(account.subscription_status)) throw factoryError('subscription_exists', 409);
  const context = await store.checkoutContext(user.id, env.MONK_FACTORY_STRIPE_PRICE_ID, user.email);
  const created = Date.parse(context.checkout_created_at);
  if (context.user_id !== user.id || !UUID.test(context.checkout_nonce || '') || !Number.isFinite(created)
    || context.checkout_price_id !== env.MONK_FACTORY_STRIPE_PRICE_ID || typeof context.checkout_trial !== 'boolean') throw factoryError('billing_mismatch', 503);
  let session;
  if (context.checkout_session_id) session = await stripe.checkout.sessions.retrieve(context.checkout_session_id);
  else if (now() - created >= 22*3600000) {
    // Do not reuse a Stripe idempotency key after its documented retention window.
    if (now() - created < 24*3600000) throw factoryError('checkout_reconciliation_required', 503);
    session = await findCheckout(stripe, context, user.id, created);
    if (session) await store.saveCheckout(user.id, context.checkout_nonce, session.id);
  } else {
    const price = await stripe.prices.retrieve(context.checkout_price_id);
    if (price.livemode !== factoryLiveMode(env)) throw factoryError('billing_mismatch', 503);
    const params = buildFactoryCheckout({ user: { id: user.id, email: context.checkout_email }, price,
      customerId: context.checkout_customer_id, trialUsed: !context.checkout_trial });
    params.metadata.checkout_nonce = context.checkout_nonce;
    params.subscription_data.metadata.checkout_nonce = context.checkout_nonce;
    params.expires_at = Math.floor(created/1000) + 23*3600;
    session = await stripe.checkout.sessions.create(params, { idempotencyKey: 'monk-factory:checkout:' + user.id + ':' + context.checkout_nonce });
    validateCheckout(session, context, user.id);
    await store.saveCheckout(user.id, context.checkout_nonce, session.id);
  }
  if (session) validateCheckout(session, context, user.id);
  if (session?.status === 'open') return { url: stripeHostedUrl(session.url) };
  const oldCanceled = session?.status === 'complete' && objectId(session.subscription) === account.stripe_subscription_id
    && ['canceled', 'incomplete_expired'].includes(account.subscription_status);
  if (!session || session.status === 'expired' || oldCanceled) {
    if (!allowReset) throw factoryError('checkout_reconciliation_required', 503);
    await store.resetCheckout(user.id, context.checkout_nonce);
    return beginFactoryCheckout({ user, store, stripe, env, now, allowReset: false });
  }
  if (!objectId(session.subscription)) throw factoryError('checkout_reconciliation_required', 503);
  await syncFactoryBilling({ userId: user.id, subscriptionId: objectId(session.subscription), store, stripe, env });
  return { complete: true };
}

module.exports = { subscriptionPatch, factoryLiveMode, factoryStripeClient, stripeHostedUrl, syncFactoryBilling, beginFactoryCheckout };
