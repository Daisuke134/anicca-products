const { FACTORY_PRODUCT, UUID, factoryError, validateFactoryPrice } = require('./monk-factory.js');

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

module.exports = { subscriptionPatch };
