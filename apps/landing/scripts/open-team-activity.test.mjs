import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/open/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../public/open/data.json', import.meta.url), 'utf8'));

test('shows recorded team activity without treating unobserved work as zero completed tasks', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  data.by_agent = [{ agent: 'Muse', board_updates_today: 2, surfaces: 'Dashboard', status: 'Observed' },
                   { agent: 'Dots', board_updates_today: 0, surfaces: 'No new action observed', status: 'Not observed' }];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async () => ({ ok: true, json: async () => data }), Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(html, /id="team-activity"/);
  const rendered = elements.get('team-activity').innerHTML;
  assert.match(rendered, /Muse/);
  assert.match(rendered, /Dashboard/);
  assert.match(rendered, /No new action observed/);
  assert.doesNotMatch(rendered, /0 tasks completed/);
});


test('shows recorded app totals and their period', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async () => ({ ok: true, json: async () => data }), Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  const rendered = elements.get('apps').innerHTML;
  assert.match(rendered, /1,410/);
  assert.match(rendered, /2026-10-26 to 2026-11-01 week/);
});


test('shows Capafy account observations with their collection time', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const capafy = { observed_at: new Date().toISOString(), source: 'Capafy developer traffic analytics', windows: { last_7d: {
    views: 1864, page_views: 1200, detail_views: 664, attributed_unique_visitors: 1000,
    paid_orders: 4, sales_usd: '39.96', platform_orders: 0, platform_revenue_usd: '0.00',
    refunds_usd: '0.00', unit_sales: 0, trial_units: 0,
    daily: [
      { date: '2026-11-03', orders: -1, revenue_usd: '-9.99', refunds_usd: '0.00', units: -1, trial_units: 0 },
      { date: '2026-11-05', orders: 1, revenue_usd: '9.99', refunds_usd: '0.00', units: 1, trial_units: 0 }
    ],
    impressions: [{ name: 'search', count: 12384 }]
  } } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async url => ({ ok: true, json: async () => url.startsWith('capafy.json') ? capafy : data }), Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(elements.has('capafy-activity'), 'Capafy observation is rendered');
  const rendered = elements.get('capafy-activity').innerHTML;
  assert.match(rendered, /Page views 1,200/);
  assert.match(rendered, /Detail views 664/);
  assert.match(rendered, /Net units 0/);
  assert.match(rendered, /Platform net orders 0/);
  assert.match(rendered, /Platform-reported revenue/);
  assert.match(rendered, /Daily net orders, revenue, refunds and net units/);
  assert.match(rendered, /−\$9\.99/);
  assert.match(rendered, /Negative daily values are returned by Capafy/);
  assert.match(rendered, /does not document their transaction meaning/);
  assert.match(rendered, /revenue basis is not established/i);
  assert.match(rendered, /Unique buyers and conversion rate are not returned/);
  assert.match(rendered, /12,384/);
  assert.match(rendered, /Hourly refresh · current/);
  assert.match(rendered, new RegExp(new Date().toISOString().slice(0, 10)));
});


test('reports unavailable Capafy data rather than hiding the section', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async url => {
    if (url.startsWith('capafy.json')) throw new Error('offline');
    return { ok: true, json: async () => data };
  }, Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.get('capafy-activity')?.textContent, 'Capafy data unavailable');
});
