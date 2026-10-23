const FACTORY_PRODUCT = 'ai_monk_factory';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function factoryError(code, status) {
  return Object.assign(new Error(code), { code, status });
}

async function authenticateFactoryRequest(event, { env = process.env, fetchImpl = fetch } = {}) {
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  const match = typeof headers.authorization === 'string' && /^Bearer ([^\s,]{1,8192})$/i.exec(headers.authorization);
  if (!match) throw factoryError('sign_in_required', 401);
  const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let url;
  try { url = new URL(base); } catch { throw factoryError('auth_unavailable', 503); }
  if (!key || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw factoryError('auth_unavailable', 503);
  }
  let response;
  try {
    // The Auth server verifies this session; decoding client JWT claims is insufficient.
    response = await fetchImpl(url.origin + '/auth/v1/user', {
      headers: { apikey: key, Authorization: 'Bearer ' + match[1] },
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
  } catch { throw factoryError('auth_unavailable', 503); }
  if (!response.ok) throw factoryError(response.status === 401 || response.status === 403 ? 'invalid_session' : 'auth_unavailable', response.status === 401 || response.status === 403 ? 401 : 503);
  let user;
  try { user = await response.json(); } catch { throw factoryError('auth_unavailable', 503); }
  if (!UUID.test(user?.id || '') || !user.email_confirmed_at || user.is_anonymous || typeof user.email !== 'string' || !user.email || Date.parse(user.banned_until) > Date.now()) {
    throw factoryError('invalid_session', 401);
  }
  return { id: user.id, email: user.email };
}

function validateFactoryPrice(price) {
  if (!price?.id?.startsWith('price_') || !price.active || price.currency !== 'usd' || price.unit_amount !== 19900 || price.metadata?.product !== FACTORY_PRODUCT || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1 || (price.recurring.usage_type && price.recurring.usage_type !== 'licensed')) {
    throw factoryError('price_unavailable', 503);
  }
}

function buildFactoryCheckout({ user, price, customerId, trialUsed }) {
  if (!UUID.test(user?.id || '') || typeof user.email !== 'string' || !user.email || typeof trialUsed !== 'boolean') {
    throw factoryError('account_unavailable', 503);
  }
  validateFactoryPrice(price);
  if (customerId && !/^cus_[A-Za-z0-9]+$/.test(customerId)) throw factoryError('account_unavailable', 503);
  const metadata = { product: FACTORY_PRODUCT, user_id: user.id };
  const subscription = { metadata: { ...metadata } };
  if (!trialUsed) {
    subscription.trial_period_days = 3;
    subscription.trial_settings = { end_behavior: { missing_payment_method: 'cancel' } };
  }
  return {
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: user.id,
    metadata,
    subscription_data: subscription,
    payment_method_collection: 'always',
    ...(customerId ? { customer: customerId } : { customer_email: user.email }),
    success_url: 'https://aniccaai.com/ai-monk-factory?checkout=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://aniccaai.com/ai-monk-factory?checkout=cancelled',
    custom_text: { submit: { message: trialUsed ? 'USD199 per month. Up to 30 videos per month, each up to 45 seconds. Cancel from your dashboard.' : '3 days free, then USD199 per month. Trial: up to 3 videos, each up to 20 seconds. Cancel before your trial ends to avoid the subscription charge.' } },
  };
}

module.exports = { FACTORY_PRODUCT, UUID, factoryError, authenticateFactoryRequest, validateFactoryPrice, buildFactoryCheckout };
