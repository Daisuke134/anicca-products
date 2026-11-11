import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/open/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../public/open/data.json', import.meta.url), 'utf8'));
const capafyData = JSON.parse(readFileSync(new URL('../public/open/capafy.json', import.meta.url), 'utf8'));
const portfolioSnapshot = JSON.parse(readFileSync(new URL('../public/open/metrics.json', import.meta.url), 'utf8'));

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
  return Object.fromEntries(['slot-rev', 'slot-cost', 'slot-gp'].map(id => [id, elements.get(id).innerHTML]));
}

test('canonical Open JSON keeps the verified ASC snapshot as the bootstrap for the scheduled collector', () => {
  const analytics = data.app_store_analytics;
  assert.equal(data.app_store_analytics_status, 'scheduled-snapshot');
  assert.equal(analytics.source, 'App Store Connect Analytics Reports');
  assert.ok(Number.isFinite(Date.parse(analytics.measured_at)), 'ASC bootstrap has a valid source measurement time');
  assert.deepEqual(analytics.apps.map(app => app.app_id).sort(), ['6755129214', '6757726663', '6759514159', '6762143790', '6759667221', '6766485903'].sort());
  assert.ok(analytics.apps.every(app => app.daily.length > 0));
});

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


test('shows recorded app totals and their source measurement time', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async () => ({ ok: true, json: async () => data }), Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  const rendered = elements.get('apps').innerHTML;
  const app = data.apps_breakdown[0];
  assert.ok(app, 'the fixture contains an app source row');
  assert.ok(rendered.includes(app.app), 'the row identifies its app');
  assert.ok(rendered.includes(app.note.slice(0, 180)), 'the row retains its source-backed detail');
  assert.match(rendered, /Last measured \d{4}-\d{2}-\d{2}/);
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

  assert.match(rendered['slot-rev'], /Revenue, November 2026 to date/);
  assert.match(rendered['slot-rev'], /Observed subtotal · incomplete coverage/);
  assert.match(rendered['slot-cost'], /Observed payment notices · incomplete coverage/);
  assert.match(rendered['slot-gp'], /Gross profit, November 2026 to date/);
  assert.match(rendered['slot-gp'], /Observed difference only · full-company profit unknown/);
});

test('does not label reconciled revenue and profit as incomplete observations', async () => {
  const fixture = structuredClone(data);
  fixture.reconciliation_complete = true;
  const rendered = await renderKpis(fixture);

  assert.doesNotMatch(rendered['slot-rev'], /Observed subtotal · incomplete coverage/);
  assert.doesNotMatch(rendered['slot-gp'], /full-company profit unknown/);
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
  assert.match(rendered, /Traffic source and Developer Overview are separate Capafy feeds/);
  assert.match(rendered, /Developer Overview not collected yet/);
  assert.doesNotMatch(rendered, /Unique buyers and conversion rate are not returned/);
  assert.match(rendered, /12,384/);
  assert.match(rendered, /Provider snapshot · current/);
  assert.match(rendered, new RegExp(new Date().toISOString().slice(0, 10)));
});

test('shows Capafy Developer Overview beside the separate traffic feed and preserves signed daily values', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const capafy = {
    observed_at: new Date().toISOString(),
    source: 'Capafy developer traffic analytics',
    windows: { last_7d: { start_utc: '2026-10-30T00:00:00+00:00', end_utc: '2026-11-05T23:59:59+00:00' } },
    overview: {
      source: 'Capafy Developer Overview API',
      observed_at: new Date().toISOString(),
      windows: { last_7d: {
        start_date: '2026-10-30', end_date: '2026-11-05', granularity: 'daily',
        exposure: { total_count: 32674, total_unique_device_count: 13530, total_count_change_percent: -35.8, unique_device_change_percent: -34.8, contains_unknown_country: true },
        detail_views: { total_count: 1947, total_unique_device_count: 1091, total_count_change_percent: -42.7, unique_device_change_percent: -41.1, contains_unknown_country: false },
        conversion: { total_conversion_rate: 0.04, conversion_rate_change: 0.02, total_order_count: 5, total_user_id_exposure_count: 13531, contains_unknown_country: true },
        new_users: { total_new_user_count: 4, new_user_change_percent: 0.0, contains_unknown_country: false },
        daily: [{
          date: '2026-11-03', exposure_count: 3974, exposure_unique_devices: 1772,
          detail_view_count: 227, detail_view_unique_devices: 139,
          conversion_rate: -0.06, order_count: -1, exposed_user_ids: 1772, new_user_count: 0,
        }],
      }, last_30d: {
        start_date: '2026-10-07', end_date: '2026-11-05', granularity: 'daily',
        exposure: { total_count: 126531, total_unique_device_count: 49850, total_count_change_percent: 40.6, unique_device_change_percent: 81.4, contains_unknown_country: true },
        detail_views: { total_count: 8756, total_unique_device_count: 4828, total_count_change_percent: 51.9, unique_device_change_percent: 121.2, contains_unknown_country: true },
        conversion: { total_conversion_rate: 0.03, conversion_rate_change: -0.22, total_order_count: 15, total_user_id_exposure_count: 49850, contains_unknown_country: true },
        new_users: { total_new_user_count: 14, new_user_change_percent: -75.9, contains_unknown_country: false },
        daily: [{ date: '2026-11-03', exposure_count: 3974, exposure_unique_devices: 1772,
          detail_view_count: 227, detail_view_unique_devices: 139,
          conversion_rate: -0.06, order_count: -1, exposed_user_ids: 1772, new_user_count: 0 }],
      } },
    },
  };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async url => ({ ok: true, json: async () => url.startsWith('capafy.json') ? capafy : data }),
    Date,
    Intl,
    URLSearchParams,
  });
  await new Promise(resolve => setImmediate(resolve));

  const rendered = elements.get('capafy-activity').innerHTML;
  assert.match(rendered, /Capafy Developer Overview/);
  assert.match(rendered, /Last 7 days.*2026-10-30.*2026-11-05/);
  assert.match(rendered, /Impressions 32,674/);
  assert.match(rendered, /Unique devices 13,530/);
  assert.match(rendered, /Unique devices 13,530 \(−34\.8%\)/);
  assert.match(rendered, /Impressions change −35\.8%/);
  assert.match(rendered, /Unknown country data: yes/);
  assert.match(rendered, /Unknown country data: no/);
  assert.match(rendered, /Detail page views 1,947/);
  assert.match(rendered, /Conversion rate 0\.04%/);
  assert.match(rendered, /Provider change \+0\.02/);
  assert.match(rendered, /Orders 5/);
  assert.match(rendered, /New users 4/);
  assert.match(rendered, /Last 30 days.*2026-10-07.*2026-11-05/);
  assert.match(rendered, /Impressions 126,531/);
  assert.match(rendered, /Detail page views 8,756/);
  assert.match(rendered, /Provider change −0\.22/);
  assert.match(rendered, /Daily Developer Overview/);
  assert.match(rendered, /2026-11-03/);
  assert.match(rendered, /−0\.06/);
  assert.match(rendered, /−1/);
  assert.doesNotMatch(rendered, /Unique buyers and conversion rate are not returned/);
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

test('renders platform and ASC summaries as labelled mobile cards with fresh source details', async () => {
  const fixture = structuredClone(data);
  fixture.summary.platforms = [{
    platform: 'Coconala', type: 'Services', this_month: 31.8, last_month: null,
    all_time: 203.9, status: 'paid', note: 'Payout cycle is still pending.', observed_accepted_gross_usd: 31.8,
  }];
  fixture.app_store_analytics_status = 'scheduled-snapshot';
  fixture.app_store_analytics = {
    measured_at: '2026-11-05T14:06:00.982Z',
    period: { start_date: '2026-10-29', end_date: '2026-11-04', processing_date: '2026-11-05' },
    coverage: { app_days_expected: 35, discovery_app_days: 30, download_app_days: 15 },
    summary: { discovery: { impressions: 1064 }, downloads: { events: 163 } },
    apps: [{
      app: 'Anicca', metrics: { impressions: 133, page_views: 13, taps: 5 },
      download_metrics: { events: 134, first_time: 3, auto_update: 126 }, download_events: 134,
      discovery_days: 6, download_days: 4, daily: [],
    }],
  };
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async url => {
    if (url.startsWith('capafy.json')) throw new Error('not needed for this test');
    return { ok: true, json: async () => fixture };
  }, Date, Intl, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));

  const platform = elements.get('plat').innerHTML;
  assert.match(platform, /data-label="This month"/);
  assert.match(platform, /data-label="All-time"/);
  assert.match(platform, /data-label="Status"/);
  assert.match(platform, /<details class="pnote">/);
  assert.match(platform, /Payout cycle is still pending/);
  const apps = elements.get('asc-analytics').innerHTML;
  assert.match(apps, /class="asc-apps"/);
  assert.match(apps, /data-label="Impressions"/);
  assert.match(elements.get('upd').textContent, /Ledger snapshot/);
  assert.match(elements.get('ft').innerHTML, /Collection cadence varies by source/);
  assert.doesNotMatch(elements.get('ft').innerHTML, /Collection runs hourly|rebuilt every 30 minutes/i);
  assert.doesNotMatch(elements.get('ft').innerHTML, /30 minutes/i);
  assert.match(html, /@media\(max-width:600px\)[\s\S]*#plat/);
  assert.match(html, /#asc-analytics table\.asc-apps/);
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
      const rendered = ['slot-rev', 'slot-cost', 'slot-gp'].map(id => elements.get(id).innerHTML).join('\n');
      for (const label of ['Revenue', 'Costs', 'Profit']) {
        const displayLabel = label === 'Profit' ? 'Gross profit' : label;
        assert.match(rendered, new RegExp(`${displayLabel}, November 2026 to date`), timezone);
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
  assert.match(workflow, /cron: '32 \* \* \* \*'/);
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

test('renders the timestamped business and loop snapshot without converting missing revenue to zero', async () => {
  const fixture = structuredClone(portfolioSnapshot);
  fixture.updated_at = '2026-11-06 02:18 JST';
  fixture.source_updated_at = '2026-11-03 12:12 JST';
  fixture.businesses = [structuredClone(portfolioSnapshot.businesses.find(row => row.name.startsWith('Capafy agents')))];
  fixture.businesses[0].revenue_mtd = null;
  fixture.businesses[0].mrr = null;
  fixture.loops = [structuredClone(portfolioSnapshot.loops[0])];
  // Privacy scrub removes personal/private gap rows from the public count.
  // Use a sanitized private-looking fixture so CI/local both expect 0, not a misreported production 1.
  fixture.metric_gaps = [{ item: 'LINE contacts', why: 'personal private track' }];

  const urls = [];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const render = async snapshot => {
    const elements = new Map();
    const document = { getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
      return elements.get(id);
    } };
    vm.runInNewContext(code, {
      document,
      fetch: async url => {
        urls.push(String(url));
        const filename = String(url).split('?')[0].split('/').at(-1);
        const response = filename === 'data.json' ? data : filename === 'capafy.json' ? capafyData : snapshot;
        return { ok: true, json: async () => response };
      },
      Date: class extends Date { static now() { return Date.parse('2026-11-05T18:45:00Z'); } },
      Intl,
      URLSearchParams,
      setInterval: () => 1,
    });
    await new Promise(resolve => setImmediate(resolve));
    return elements;
  };
  const elements = await render(fixture);

  assert.ok(urls.some(url => /metrics\.json\?v=/.test(url)), 'the public metrics feed is requested with a cache buster');
  assert.match(elements.get('portfolio-snapshot').textContent, /Dashboard exported 2026-11-06 02:18 JST/);
  assert.match(elements.get('portfolio-snapshot').textContent, /1h 27m ago/);
  assert.match(elements.get('portfolio-snapshot').textContent, /Source observed 2026-11-03 12:12 JST/);
  assert.match(elements.get('portfolio-snapshot').textContent, /2d 15h 33m ago/);
  const summary = elements.get('portfolio-summary').innerHTML;
  assert.match(summary, /1 business/);
  assert.match(summary, /1 loop/);
  assert.match(summary, /0 metric gaps/);
  assert.match(elements.get('portfolio-businesses').innerHTML, /Capafy agents/);
  assert.match(elements.get('portfolio-businesses').innerHTML, /no data/);
  assert.doesNotMatch(elements.get('portfolio-businesses').innerHTML, /\$0\.00/);
  const loopTable = elements.get('portfolio-loops').innerHTML;
  assert.match(loopTable, /Distribution loop/);
  for (const label of ['Loop', 'Owner', 'Host', 'Schedule', 'Runs per day', 'Status as of snapshot']) {
    assert.match(loopTable, new RegExp(`data-label="${label}"`));
  }
  assert.match(elements.get('portfolio-gaps').innerHTML, /No metric gaps listed in this snapshot/);
  assert.doesNotMatch(elements.get('portfolio-gaps').innerHTML, /LINE|contacts|Capafy renewals/);

  const missingSource = structuredClone(fixture);
  delete missingSource.source_updated_at;
  const withoutObservationTime = await render(missingSource);
  assert.match(withoutObservationTime.get('portfolio-snapshot').textContent, /Source observation time unknown/);
  assert.doesNotMatch(withoutObservationTime.get('portfolio-snapshot').textContent, /Source observed 2026-11-06 02:18 JST/);
});

test('refreshes all four Open feeds in place every fifteen minutes', async () => {
  const fixture = structuredClone(portfolioSnapshot);
  fixture.businesses = [structuredClone(portfolioSnapshot.businesses.find(row => row.name.startsWith('Capafy agents')))];
  fixture.loops = [structuredClone(portfolioSnapshot.loops[0])];
  fixture.metric_gaps = [structuredClone(portfolioSnapshot.metric_gaps[0])];
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const fetchCounts = new Map();
  const intervals = [];
  let reloads = 0;
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async url => {
      const filename = String(url).split('?')[0].split('/').at(-1);
      fetchCounts.set(filename, (fetchCounts.get(filename) || 0) + 1);
      const response = filename === 'data.json' ? data : filename === 'capafy.json' ? capafyData : fixture;
      return { ok: true, json: async () => response };
    },
    Date,
    Intl,
    URLSearchParams,
    location: { reload() { reloads += 1; } },
    setInterval: (handler, milliseconds) => { intervals.push({ handler, milliseconds }); return intervals.length; },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.get('portfolio-businesses').innerHTML.includes('Updated activity'), false);
  fixture.businesses[0].status = 'Updated activity';
  fixture.updated_at = '2026-11-06 03:18 JST';
  const refreshes = intervals.filter(interval => interval.milliseconds === 15 * 60 * 1000);
  assert.equal(refreshes.length, 4, 'all four source feeds receive a 15-minute refresh');
  await Promise.all(refreshes.map(interval => interval.handler()));

  for (const filename of ['data.json', 'capafy.json', 'life.json', 'metrics.json']) assert.equal(fetchCounts.get(filename), 2, filename);
  assert.match(elements.get('portfolio-businesses').innerHTML, /Updated activity/);
  assert.equal(reloads, 0, 'refreshing feed data does not reload the page and re-emit pageview telemetry');
});

test('reveals team activity after a later snapshot adds activity rows', async () => {
  const currentData = structuredClone(data);
  currentData.by_agent = [];
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const intervals = [];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async url => {
      const filename = String(url).split('?')[0].split('/').at(-1);
      const response = filename === 'data.json' ? currentData : filename === 'capafy.json' ? capafyData : portfolioSnapshot;
      return { ok: true, json: async () => response };
    },
    Date,
    Intl,
    URLSearchParams,
    setInterval: (handler, milliseconds) => { intervals.push({ handler, milliseconds }); return intervals.length; },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.get('card-team').style.display, 'none');
  currentData.by_agent = [{ agent: 'New agent', surfaces: 'New work', status: 'Verified result' }];
  await intervals.find(interval => interval.milliseconds === 15 * 60 * 1000).handler();
  assert.equal(elements.get('card-team').style.display, '');
  assert.match(elements.get('team-activity').innerHTML, /New agent/);
});

test('shows the portfolio section as unavailable when its snapshot fetch fails', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async url => String(url).includes('metrics.json')
      ? { ok: false, json: async () => ({}) }
      : { ok: true, json: async () => String(url).includes('capafy.json') ? capafyData : data },
    Date,
    Intl,
    URLSearchParams,
    setInterval: () => 1,
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(elements.get('portfolio-snapshot').textContent, /Portfolio snapshot unavailable/);
});

test('renders RevenueCat source time and keeps an unreadable project unknown', async () => {
  const fixture = structuredClone(portfolioSnapshot);
  fixture.revenuecat_charts = {
    source: 'RevenueCat Charts API v2',
    observed_at: '2026-11-06T00:00:00Z',
    window: { start_date: '2026-10-07', end_date: '2026-11-05', resolution: 'day' },
    projects: [{
      name: 'Anicca',
      status: 'observed',
      charts: {
        mrr: {
          id: 'mrr', status: 'observed', display_name: 'MRR', start_date: '2026-10-07', end_date: '2026-11-05',
          summary: { average: { Anicca: { MRR: 20.34 } } },
          measures: [{ display_name: 'MRR', unit: '$' }],
          segments: [{ display_name: 'Anicca', is_total: false }],
          values: [{ cohort: 1793836800, measure: 0, segment: 0, value: 20.34, incomplete: true }],
          incomplete: true,
        },
        prediction_explorer: {
          id: 'prediction_explorer', status: 'observed', display_name: 'Prediction Explorer', value_format: 'cohort_matrix',
          segments: [{ display_name: 'New customers', unit: '#' }, { display_name: 'Month 0', unit: '$' }],
          values: [{ cohort: 1791331200, cells: [{ segment: 0, value: 3 }, { segment: 1, value: 0.0 }], incomplete: null }],
          incomplete: null,
        },
      },
    }, {
      name: 'Honne',
      status: 'credential_missing',
      reason: 'project_scoped_key_unavailable',
      charts: {},
    }],
  };
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async url => {
      const filename = String(url).split('?')[0].split('/').at(-1);
      const response = filename === 'data.json' ? data : filename === 'capafy.json' ? capafyData : fixture;
      return { ok: true, json: async () => response };
    },
    Date,
    Intl,
    URLSearchParams,
    setInterval: () => 1,
  });
  await new Promise(resolve => setImmediate(resolve));

  assert.ok(elements.has('revenuecat-charts'), 'RevenueCat chart section is wired into the page');
  const rendered = elements.get('revenuecat-charts').innerHTML;
  assert.match(rendered, /2026-11-06T00:00:00Z/);
  assert.match(rendered, /Anicca/);
  assert.match(rendered, /20\.34/);
  assert.match(rendered, /incomplete/i);
  assert.match(rendered, /Month 0/);
  assert.match(rendered, />3</);
  assert.match(rendered, /Honne/);
  assert.match(rendered, /unknown/i);
  assert.doesNotMatch(rendered, /Honne[\s\S]{0,200}0\.00/);
});
