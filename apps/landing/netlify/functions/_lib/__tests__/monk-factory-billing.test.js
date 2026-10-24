const { test } = require('node:test');
const assert = require('node:assert/strict');
const { subscriptionPatch, beginFactoryCheckout, syncFactoryBilling } = require('../monk-factory-billing.js');
const { buildFactoryCheckout } = require('../monk-factory.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com' };
const price = { id: 'price_factory', livemode: false, active: true, currency: 'usd', unit_amount: 19900, metadata: { product: 'ai_monk_factory' }, recurring: { interval: 'month', interval_count: 1 } };
function subscription(status = 'active') {
  return {
    id: 'sub_fixture', customer: 'cus_fixture', livemode: false, status,
    metadata: { product: 'ai_monk_factory', user_id: user.id },
    trial_start: 100, trial_end: 200, cancel_at_period_end: false,
    items: { data: [{ id: 'si_fixture', quantity: 1, price, current_period_start: 200, current_period_end: 300 }] },
    latest_invoice: { id: 'in_fixture', status: 'paid', parent: { subscription_details: { subscription: 'sub_fixture' } },
      lines: { has_more: false, data: [{ pricing: { price_details: { price: price.id } },
        parent: { subscription_item_details: { subscription_item: 'si_fixture' } }, period: { start: 200, end: 300 } }] } },
  };
}
const patch = sub => subscriptionPatch({ subscription: sub, user, priceId: price.id, liveMode: false, customerId: 'cus_fixture' });

test('paid access requires the official current item period and its paid invoice line', () => {
  const actual = patch(subscription());
  assert.equal(actual.period_paid, true);
  assert.equal(actual.period_start, new Date(200000).toISOString());
  assert.equal(actual.period_end, new Date(300000).toISOString());
  assert.equal(actual.trial_used, true);
  for (const mutate of [
    sub => { sub.latest_invoice.status = 'open'; },
    sub => { sub.latest_invoice.lines.data[0].period.end = 299; },
    sub => { sub.latest_invoice.parent.subscription_details.subscription = 'sub_other'; },
    sub => { sub.latest_invoice.lines.data[0].parent.subscription_item_details.subscription_item = 'si_other'; },
  ]) {
    const sub = subscription(); mutate(sub);
    assert.equal(patch(sub).period_paid, false);
  }
});

test('official trial boundaries remain separate from an unpaid period', () => {
  const sub = subscription('trialing'); sub.latest_invoice = null;
  const actual = patch(sub);
  assert.equal(actual.period_paid, false);
  assert.equal(actual.trial_start, new Date(100000).toISOString());
  assert.equal(actual.trial_end, new Date(200000).toISOString());
});

test('customer, user, price and live-mode mismatches cannot attach another subscription', () => {
  for (const mutate of [
    sub => { sub.customer = 'cus_other'; },
    sub => { sub.metadata.user_id = '00000000-0000-4000-8000-000000000001'; },
    sub => { sub.metadata.product = 'other_product'; },
    sub => { sub.items.data[0].price.id = 'price_other'; },
    sub => { sub.items.data[0].quantity = 2; },
    sub => { sub.livemode = true; },
  ]) {
    const sub = structuredClone(subscription()); mutate(sub);
    assert.throws(() => patch(sub), { code: 'billing_mismatch' });
  }
});

test('cancellation and incomplete invoice evidence never keep autonomous posting enabled', () => {
  for (const sub of [subscription('canceled'), { ...subscription(), cancel_at_period_end: true }]) {
    const actual = patch(sub);
    assert.equal(actual.auto_post, false);
  }
  const missing = subscription(); missing.items.data[0].current_period_end = null;
  assert.throws(() => patch(missing), { code: 'billing_mismatch' });
});

test('the paid plan starts without a Stripe trial or trial messaging', () => {
  const params = buildFactoryCheckout({ user, price });
  assert.equal(params.mode, 'subscription');
  assert.equal(params.subscription_data.trial_period_days, undefined);
  assert.equal(params.subscription_data.trial_settings, undefined);
  assert.equal(JSON.stringify(params).toLowerCase().includes('3 days free'), false);
});

test('retry after a lost Checkout save uses the same persisted payload and Stripe idempotency key', async () => {
  const now = Date.now();
  const context = { user_id: user.id, subscription_status: 'none', checkout_nonce: '00000000-0000-4000-8000-000000000001', checkout_created_at: new Date(now).toISOString(), checkout_price_id: price.id, checkout_email: user.email, checkout_customer_id: null, checkout_session_id: null };
  const calls = []; let saveCalls = 0;
  const store = { account: async () => context, reserveProfile: async () => context, checkoutContext: async () => context,
    saveCheckout: async () => { if (++saveCalls === 1) throw new Error('fixture lost database response'); } };
  const stripe = { prices: { retrieve: async () => price }, checkout: { sessions: { create: async (params, options) => {
    calls.push(structuredClone({ params, options }));
    return { id: 'cs_fixture', mode: 'subscription', status: 'open', url: 'https://checkout.stripe.com/c/pay/fixture', client_reference_id: user.id, metadata: params.metadata };
  } } } };
  const input = { user, store, stripe, env: { MONK_FACTORY_STRIPE_PRICE_ID: price.id, MONK_FACTORY_STRIPE_LIVE: 'false' }, now: () => now };
  await assert.rejects(beginFactoryCheckout(input));
  const result = await beginFactoryCheckout({ ...input, user: { ...user, email: 'changed@example.com' } });
  assert.equal(result.url, 'https://checkout.stripe.com/c/pay/fixture');
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[1].params.customer_email, user.email);
  assert.ok(calls[0].options.idempotencyKey.includes(context.checkout_nonce));
});

test('an older subscription event cannot replace the account current subscription', async () => {
  const account = { user_id: user.id, stripe_subscription_id: 'sub_current', subscription_status: 'active', billing_sync_nonce: '00000000-0000-4000-8000-000000000001' };
  const store = { claimBilling: async () => account, releaseBilling: async () => {}, applyBilling: async () => assert.fail('old subscription overwrote current state') };
  const stripe = { subscriptions: { retrieve: async () => assert.fail('old subscription should be rejected before provider lookup') } };
  await assert.rejects(syncFactoryBilling({ userId: user.id, subscriptionId: 'sub_old', store, stripe, env: {} }), { code: 'billing_mismatch' });
});
test('the installed Stripe SDK uses the tick transport and aborts its GET at the shared deadline without retry', async () => {
  const { factoryStripeClient } = require('../monk-factory-billing.js');
  const controller = new AbortController(); let calls = 0;
  const stripe = factoryStripeClient({ STRIPE_SECRET_KEY: 'sk_test_synthetic_fixture', MONK_FACTORY_STRIPE_LIVE: 'false' }, {
    fetchImpl: async (url, options) => {
      calls++; assert.equal(new URL(url).hostname, 'api.stripe.com'); assert.equal(options.method, 'GET');
      const signal = AbortSignal.any([options.signal, controller.signal]);
      return new Promise((_resolve, reject) => {
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    },
  });
  assert.equal(stripe._api.httpClient.getClientName(), 'fetch');
  const timer = setTimeout(() => controller.abort(new Error('synthetic tick deadline')), 10);
  try { await assert.rejects(stripe.subscriptions.retrieve('sub_fixture')); assert.equal(calls, 1); }
  finally { clearTimeout(timer); }
});
