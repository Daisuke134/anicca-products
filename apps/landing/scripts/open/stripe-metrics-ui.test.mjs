import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/open/index.html', import.meta.url), 'utf8');

function renderer(name, expression, context = {}) {
  const match = html.match(expression);
  assert.ok(match, `Open page must define ${name}`);
  return vm.runInNewContext(`(${match[0].replace(`const ${name}=`, '').replace(/;$/, '')})`, context);
}

test('Stripe metrics render source time, 90-day window, currency-specific activity and safe detail', () => {
  assert.match(html, /id="card-stripe-metrics"/);
  const stripeMoney = renderer('stripeMoney', /const stripeMoney=\(minor,currency\)=>\{[\s\S]*?\n\};/);
  assert.equal(stripeMoney(500, 'ISK').replace(/\D/g, ''), '5');
  assert.equal(stripeMoney(500, 'UGX').replace(/\D/g, ''), '5');
  assert.equal(stripeMoney(500, 'JPY').replace(/\D/g, ''), '500');
  assert.match(stripeMoney(1234, 'KWD'), /1\.234/);
  const renderStripeMetrics = renderer('renderStripeMetrics', /const renderStripeMetrics=feed=>\{[\s\S]*?\n\};/, {
    esc: (value) => String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]),
    NN: (value) => value == null ? '—' : Number(value).toLocaleString('en-US'),
    stripeMoney,
  });
  const output = renderStripeMetrics({
    source: 'Stripe API',
    status: 'partial',
    observed_at: '2026-11-06T03:00:00Z',
    window: { start: '2026-08-08T03:00:00Z', end: '2026-11-06T03:00:00Z' },
    balance: { status: 'observed', currencies: [{ currency: 'USD', available_minor: 10000, pending_minor: 250 }, { currency: 'JPY', available_minor: 900, pending_minor: 0 }] },
    subscriptions: { status: 'observed', currencies: [{ currency: 'USD', active: 3, trialing: 1 }] },
    balance_transactions: {
      status: 'observed',
      currencies: [{ currency: 'USD', count: 2, amount_minor: 800, fee_minor: 59, net_minor: 741 }],
      daily: [{ date: '2026-11-05', currency: 'USD', reporting_category: 'charge', type: 'charge', count: 1, amount_minor: 1000, fee_minor: 59, net_minor: 941 }],
    },
    refunds: { status: 'unavailable', currencies: [] },
    payouts: { status: 'observed', currencies: [{ currency: 'USD', statuses: [{ status: 'paid', count: 1, amount_minor: 941 }] }] },
    coverage: { subscriptions_active: { status: 'observed' }, subscriptions_trialing: { status: 'observed' }, refunds: { status: 'unavailable' } },
  });

  assert.match(output, /2026-11-06T03:00:00Z/);
  assert.match(output, /2026-08-08T03:00:00Z/);
  assert.match(output, /USD/);
  assert.match(output, /\$100\.00/);
  assert.match(output, /JPY/);
  assert.match(output, /¥900/);
  assert.match(output, /3 active/);
  assert.match(output, /1 trialing/);
  assert.match(output, /59/);
  assert.match(output, /refunds · unavailable/i);
  assert.match(output, /Daily balance activity/);
  assert.match(html, /stripe-metrics-wrap/);
});

test('Stripe unavailable values stay unknown and explain missing restricted key', () => {
  const stripeMoney = renderer('stripeMoney', /const stripeMoney=\(minor,currency\)=>\{[\s\S]*?\n\};/);
  const renderStripeMetrics = renderer('renderStripeMetrics', /const renderStripeMetrics=feed=>\{[\s\S]*?\n\};/, { esc: String, NN: String, stripeMoney });

  const output = renderStripeMetrics({ status: 'unavailable', reason: 'restricted_read_key_missing', observed_at: null, balance: { status: 'unavailable', currencies: [] }, subscriptions: { status: 'unavailable', currencies: [] }, balance_transactions: { status: 'unavailable', currencies: [], daily: [] }, refunds: { status: 'unavailable', currencies: [] }, payouts: { status: 'unavailable', currencies: [] }, coverage: {} });
  assert.match(output, /restricted live key/i);
  assert.match(output, /unknown/i);
  assert.doesNotMatch(output, /\$0\.00/);
});

test('an unavailable subscription status is not rendered as zero', () => {
  const stripeMoney = renderer('stripeMoney', /const stripeMoney=\(minor,currency\)=>\{[\s\S]*?\n\};/);
  const renderStripeMetrics = renderer('renderStripeMetrics', /const renderStripeMetrics=feed=>\{[\s\S]*?\n\};/, {
    esc: String,
    NN: (value) => value == null ? '—' : Number(value).toLocaleString('en-US'),
    stripeMoney,
  });
  const output = renderStripeMetrics({
    status: 'partial', observed_at: '2026-11-06T03:00:00Z', window: { start: 'start', end: 'end' },
    balance: { status: 'observed', currencies: [{ currency: 'USD', available_minor: 0, pending_minor: 0 }] },
    subscriptions: { status: 'partial', currencies: [{ currency: 'USD', active: null, trialing: 1 }] },
    balance_transactions: { status: 'observed_empty', currencies: [], daily: [] },
    refunds: { status: 'observed_empty', currencies: [] }, payouts: { status: 'observed_empty', currencies: [] },
    coverage: { subscriptions_active: { status: 'unavailable' }, subscriptions_trialing: { status: 'observed' } },
  });
  assert.match(output, /unknown<\/span> active · 1 trialing/);
  assert.doesNotMatch(output, /0 active/);
});
