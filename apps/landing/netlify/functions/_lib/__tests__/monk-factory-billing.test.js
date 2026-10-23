const { test } = require('node:test');
const assert = require('node:assert/strict');
const { subscriptionPatch } = require('../monk-factory-billing.js');

const user = { id: 'eaa06ae6-53ec-4a6b-baa4-e6731b129ca8', email: 'fixture@example.com' };
const price = { id: 'price_factory', active: true, currency: 'usd', unit_amount: 19900, metadata: { product: 'ai_monk_factory' }, recurring: { interval: 'month', interval_count: 1 } };
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
