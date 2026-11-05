import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/open/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../public/open/data.json', import.meta.url), 'utf8'));

async function renderKpis(kpiData) {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async () => ({ ok: true, json: async () => kpiData }),
    Date,
    Intl,
    URLSearchParams,
  });
  await new Promise(resolve => setImmediate(resolve));
  return elements.get('kpi').innerHTML;
}

function renderedCard(rendered, title) {
  const heading = `<h3>${title}</h3>`;
  const start = rendered.indexOf(heading);
  assert.notEqual(start, -1, `Missing KPI card: ${title}`);
  const next = rendered.indexOf('<div class="c"><h3>', start + heading.length);
  return rendered.slice(start, next < 0 ? undefined : next);
}

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

test('shows App Store daily analytics, coverage, and missing download rows as unknown', async () => {
  const fixture = structuredClone(data);
  fixture.app_store_analytics_status = 'scheduled-snapshot';
  fixture.app_store_analytics = {
    measured_at: '2026-11-05T13:11:41.659Z',
    period: { start_date: '2026-10-29', end_date: '2026-11-04', processing_date: '2026-11-05' },
    coverage: { app_days_expected: 35, discovery_app_days: 30, download_app_days: 15 },
    summary: {
      discovery: { impressions: 1064, unique_impressions: null, page_views: 48, unique_page_views: null, taps: 17, unique_taps: null },
      downloads: { events: 163, first_time: 11, auto_update: 146, redownload: 2, restore: 1, manual_update: 3 },
    },
    apps: [{
      app: 'Anicca',
      metrics: { impressions: 133, unique_impressions: null, page_views: 13, unique_page_views: null, taps: 5, unique_taps: null },
      download_metrics: { events: 134, first_time: 3, auto_update: 126, manual_update: 2, redownload: 2, restore: 1 },
      download_events: 134,
      discovery_days: 6,
      download_days: 4,
      daily: [{
        date: '2026-10-29',
        discovery: { impressions: 10, unique_impressions: null, page_views: 2, unique_page_views: null, taps: 1, unique_taps: null },
        downloads: null,
        source_rows: { discovery: [{ Event: 'Impression', 'Source Type': 'App Store search', Territory: 'US', Counts: '10', 'Unique Counts': '8' }], downloads: [] },
      }, { date: '2026-11-04', processing_date: null, discovery: null, downloads: null, source_rows: { discovery: [], downloads: [] } }],
    }],
  };
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async () => ({ ok: true, json: async () => fixture }), Date, Intl, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  const rendered = elements.get('asc-analytics').innerHTML;
  assert.match(rendered, /App Store Connect Analytics/);
  assert.match(rendered, /Scheduled snapshot/);
  assert.match(rendered, /2026-10-29 to 2026-11-04/);
  assert.match(rendered, /Impressions 1,064/);
  assert.match(rendered, /Unique impressions —/);
  assert.match(rendered, /Unique page views —/);
  assert.match(rendered, /Unique taps —/);
  assert.match(rendered, /Unique page views/);
  assert.match(rendered, /Unique taps<\/th>/);
  assert.match(rendered, /Discovery status/);
  assert.match(rendered, /<td>Not reported<\/td>/);
  assert.match(rendered, /Source dimensions/);
  assert.match(rendered, /Unique counts/);
  assert.match(rendered, /App Store search/);
  assert.match(rendered, /Unique counts stay on source rows/);
  assert.match(rendered, /Downloads 163 observed events/);
  assert.match(rendered, /Discovery 30\/35 app-days reported/);
  assert.match(rendered, /Downloads 15\/35 app-days reported/);
  assert.match(rendered, /6\/7 discovery days · 4\/7 download days/);
  assert.match(rendered, /Anicca/);
  assert.match(rendered, /Not reported/);
  assert.doesNotMatch(rendered, /Downloads 0\b/);
});

test('keeps the newest App Store processing date per app-day and leaves absent downloads null', async () => {
  let aggregateDailyMetrics;
  try {
    ({ aggregateDailyMetrics } = await import('./open-app-store-analytics.mjs'));
  } catch {
    assert.fail('App Store analytics aggregator has not been implemented');
  }
  const result = aggregateDailyMetrics({
    apps: [{ id: 'a', name: 'Anicca' }, { id: 'b', name: 'Daily Dhamma' }],
    period: { start_date: '2026-11-01', end_date: '2026-11-02' },
    discoveryRows: [
      { app_id: 'a', date: '2026-11-01', processing_date: '2026-11-02', metrics: { impressions: 90, unique_impressions: 80 } },
      { app_id: 'a', date: '2026-11-01', processing_date: '2026-11-03', metrics: { impressions: 4, unique_impressions: 3 } },
      { app_id: 'a', date: '2026-11-01', processing_date: '2026-11-03', metrics: { impressions: 6, unique_impressions: 5 } },
      { app_id: 'b', date: '2026-11-02', processing_date: '2026-11-03', metrics: { impressions: 7, unique_impressions: 6 } },
    ],
    downloadRows: [
      { app_id: 'b', date: '2026-11-02', processing_date: '2026-11-03', metrics: { events: 2, first_time: 1 } },
    ],
    measured_at: '2026-11-05T12:00:00.000Z',
  });

  assert.equal(result.apps.find(app => app.app === 'Anicca').daily[0].discovery.impressions, 10);
  assert.equal(result.apps.find(app => app.app === 'Anicca').daily[0].processing_date, '2026-11-03');
  assert.equal(result.apps.find(app => app.app === 'Anicca').daily[0].downloads, null);
  assert.equal(result.apps.find(app => app.app === 'Daily Dhamma').daily[1].downloads.events, 2);
  assert.equal(result.coverage.app_days_expected, 4);
  assert.equal(result.coverage.download_app_days, 1);
  assert.equal(result.summary.discovery.impressions, 17);
});

test('does not add per-dimension Apple unique counts into a total', async () => {
  const { aggregateDailyMetrics } = await import('./open-app-store-analytics.mjs');
  const result = aggregateDailyMetrics({
    apps: [{ id: 'a', name: 'Anicca' }],
    period: { start_date: '2026-11-01', end_date: '2026-11-01' },
    discoveryRows: [
      { app_id: 'a', date: '2026-11-01', processing_date: '2026-11-02', metrics: { impressions: 10, unique_impressions: 9 }, source_row: { 'Source Type': 'App Store search', Counts: '10', 'Unique Counts': '9' } },
      { app_id: 'a', date: '2026-11-01', processing_date: '2026-11-02', metrics: { impressions: 7, unique_impressions: 6 }, source_row: { 'Source Type': 'App Store browse', Counts: '7', 'Unique Counts': '6' } },
    ],
    downloadRows: [],
  });

  assert.equal(result.summary.discovery.impressions, 17);
  assert.equal(result.summary.discovery.unique_impressions, null);
  assert.equal(result.apps[0].daily[0].discovery.unique_impressions, null);
  assert.deepEqual(result.apps[0].daily[0].source_rows.discovery.map(row => row['Unique Counts']), ['9', '6']);
});

test('parses Apple report event rows and preserves source dimensions', async () => {
  const { parseAnalyticsTsv } = await import('./open-app-store-analytics.mjs');
  const discovery = parseAnalyticsTsv(
    'Date\tApp Apple Identifier\tEvent\tPage Type\tSource Type\tTerritory\tCounts\tUnique Counts\n2026-11-01\t6755129214\tImpression\tNo page\tApp Store search\tUS\t12\t10\n2026-11-01\t6755129214\tPage view\tProduct page\tApp Store search\tUS\t4\t3\n2026-11-01\t6755129214\tTap\tProduct page\tApp Store search\tUS\t2\t2',
    { appId: 'fallback', processingDate: '2026-11-03', report: 'discovery' },
  );
  assert.deepEqual(discovery.map(row => row.metrics), [
    { impressions: 12, unique_impressions: 10, page_views: null, unique_page_views: null, taps: null, unique_taps: null },
    { impressions: null, unique_impressions: null, page_views: 4, unique_page_views: 3, taps: null, unique_taps: null },
    { impressions: null, unique_impressions: null, page_views: null, unique_page_views: null, taps: 2, unique_taps: 2 },
  ]);
  assert.equal(discovery[0].app_id, '6755129214');
  assert.equal(discovery[0].source_row.Territory, 'US');
});

test('labels unreconciled revenue, costs, and profit as observed values', async () => {
  const fixture = structuredClone(data);
  fixture.reconciliation_complete = false;
  const rendered = await renderKpis(fixture);

  assert.match(renderedCard(rendered, 'Revenue, November 2026 to date'), /Observed subtotal · incomplete coverage/);
  assert.match(renderedCard(rendered, 'Costs, November 2026 to date'), /Observed payment notices · incomplete coverage/);
  assert.match(renderedCard(rendered, 'Profit, November 2026 to date'), /Observed difference only · full-company profit unknown/);
});

test('does not label reconciled revenue and profit as incomplete observations', async () => {
  const fixture = structuredClone(data);
  fixture.reconciliation_complete = true;
  const rendered = await renderKpis(fixture);

  assert.doesNotMatch(renderedCard(rendered, 'Revenue, November 2026 to date'), /Observed subtotal · incomplete coverage/);
  assert.doesNotMatch(renderedCard(rendered, 'Profit, November 2026 to date'), /full-company profit unknown/);
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

test('monthly revenue label follows the dashboard month in every viewer timezone', async () => {
  const previousTimezone = process.env.TZ;
  const monthData = { ...data, month: '2026-11' };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  try {
    for (const timezone of ['America/Los_Angeles', 'Asia/Tokyo', 'UTC']) {
      process.env.TZ = timezone;
      const elements = new Map();
      const document = { getElementById(id) {
        if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
        return elements.get(id);
      } };
      vm.runInNewContext(code, {
        document,
        fetch: async () => ({ ok: true, json: async () => monthData }),
        Date,
        Intl,
        URLSearchParams,
      });
      await new Promise(resolve => setImmediate(resolve));
      const rendered = elements.get('kpi').innerHTML;
      for (const label of ['Revenue', 'Costs', 'Profit']) {
        assert.match(rendered, new RegExp(`${label}, November 2026 to date`), timezone);
      }
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('main deploy refreshes Capafy rather than republishing the committed stale feed', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/netlify-deploy.yml', import.meta.url), 'utf8');
  const start = workflow.indexOf('      - name: Collect current Capafy metrics for Open dashboard');
  const end = workflow.indexOf('      - name: Stage latest Open dashboard data snapshot', start);
  assert.ok(start >= 0 && end > start, 'Capafy collection step is present before snapshot staging');
  const collector = workflow.slice(start, end);
  assert.match(collector, /if:\s*github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(collector, /github\.event_name\s*!=\s*'push'/);
});

test('hourly production deploy retains the previous ASC window and refreshes it before publishing static JSON', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/netlify-deploy.yml', import.meta.url), 'utf8');
  const deployConfig = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const rootConfig = readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8');
  const stageIndex = workflow.indexOf('      - name: Stage latest Open dashboard data snapshot');
  const seedIndex = workflow.indexOf('      - name: Seed previous App Store analytics snapshot', stageIndex);
  const collectIndex = workflow.indexOf('      - name: Collect App Store Connect analytics', seedIndex);
  const verifyIndex = workflow.indexOf('      - name: Verify Open dashboard data before deploy', collectIndex);
  assert.match(workflow, /cron: '17 \* \* \* \*'/);
  assert.ok(stageIndex >= 0 && seedIndex > stageIndex && collectIndex > seedIndex && verifyIndex > collectIndex);
  const seed = workflow.slice(seedIndex, collectIndex);
  const collect = workflow.slice(collectIndex, verifyIndex);
  assert.match(seed, /https:\/\/aniccaai\.com\/open\/data\.json/);
  assert.match(seed, /app_store_analytics/);
  for (const key of ['APP_STORE_CONNECT_ISSUER_ID', 'APP_STORE_CONNECT_KEY_ID', 'APP_STORE_CONNECT_PRIVATE_KEY']) {
    assert.match(collect, new RegExp(`${key}: \\$\\{\\{ secrets\\.${key} \\}\\}`));
  }
  assert.match(collect, /node scripts\/open-app-store-analytics\.mjs/);
  assert.doesNotMatch(collect, /console\.log\(.*APP_STORE_CONNECT/);
  for (const config of [deployConfig, rootConfig]) {
    assert.doesNotMatch(config, /open-dashboard-data/);
  }
  assert.equal(existsSync(new URL('../netlify/functions/open-dashboard-data.mjs', import.meta.url)), false);
  assert.equal(existsSync(new URL('../netlify/functions/open-asc-refresh.mjs', import.meta.url)), false);
});

test('Open JSON-only pushes are included in main deployment paths', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/netlify-deploy.yml', import.meta.url), 'utf8');
  const push = workflow.match(/\n  push:\n([\s\S]*?)\n  workflow_dispatch:/)?.[1];
  assert.ok(push, 'push trigger is present');
  assert.match(push, /paths:[\s\S]*?apps\/landing\/\*\*/);
  assert.doesNotMatch(push, /!apps\/landing\/public\/open\/(?:\*\.json|\*\*\/\*\.json)/);
});
