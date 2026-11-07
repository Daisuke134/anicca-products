import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PRIVATE_KEYS = new Set([
  '$user_id',
  'distinct_id',
  'email',
  'event_id',
  'properties',
  'quote_text',
  'screen_instance_id',
  'token',
  'user_id',
]);

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Open dashboard analytics has invalid ${label}`);
  }
}

function assertNoPrivateFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEYS.has(key.toLowerCase())) {
      throw new Error(`Open dashboard analytics contains private field ${key}`);
    }
    assertNoPrivateFields(child);
  }
}

function validateRate(actual, numerator, denominator, label) {
  const expected = denominator === 0 ? null : numerator / denominator;
  if (expected === null ? actual !== null : !Number.isFinite(actual) || Math.abs(actual - expected) > 0.0001) {
    throw new Error(`Open dashboard analytics has invalid ${label}`);
  }
}

function validateRows(rows, label, { minimumViews = 1 } = {}) {
  if (!Array.isArray(rows)) throw new Error(`Open dashboard analytics is missing ${label}`);
  const keys = new Set();
  for (const row of rows) {
    const key = JSON.stringify([
      row.flow_id,
      row.screen_id,
      row.app_version,
      row.app_build,
      row.language,
      row.locale,
      row.device_region_code,
      row.storefront_country_code,
    ]);
    if (keys.has(key)) throw new Error(`Open dashboard analytics has duplicate ${label}`);
    keys.add(key);

    for (const dimension of ['flow_id', 'screen_id', 'app_version', 'app_build']) {
      if (typeof row[dimension] !== 'string' || !row[dimension]) {
        throw new Error(`Open dashboard analytics has invalid ${label} ${dimension}`);
      }
    }
    assertNonNegativeInteger(row.viewed_instances, `${label} denominator`);
    assertNonNegativeInteger(row.continued_instances, `${label} numerator`);
    assertNonNegativeInteger(row.no_next_screen_observed, `${label} no-next count`);
    if (row.viewed_instances < minimumViews
      || row.continued_instances > row.viewed_instances
      || row.no_next_screen_observed !== row.viewed_instances - row.continued_instances) {
      throw new Error(`Open dashboard analytics has invalid ${label} denominator`);
    }
    validateRate(row.continuation_rate, row.continued_instances, row.viewed_instances, `${label} continuation rate`);
    validateRate(row.no_next_screen_rate, row.no_next_screen_observed, row.viewed_instances, `${label} no-next rate`);
  }
}

function validateAniccaAnalytics(analytics) {
  if (!analytics || typeof analytics !== 'object' || Array.isArray(analytics)) {
    throw new Error('Open dashboard data is missing product_analytics.anicca_ios');
  }
  if (!['ok', 'no_events', 'no_views'].includes(analytics.status)) {
    throw new Error('Open dashboard analytics has invalid status');
  }
  if (analytics.source !== 'Mixpanel Raw Event Export API'
    || analytics.app_id !== 'ai.anicca.app.ios'
    || !['production', 'sandbox', 'simulator', 'development'].includes(analytics.app_environment)) {
    throw new Error('Open dashboard analytics has invalid source or app identity');
  }
  if (!Number.isFinite(Date.parse(analytics.observed_at))
    || !/^\d{4}-\d{2}-\d{2}$/.test(analytics.data_from)
    || !/^\d{4}-\d{2}-\d{2}$/.test(analytics.data_to)
    || analytics.data_from > analytics.data_to
    || !Number.isInteger(analytics.maturity_hours)
    || analytics.maturity_hours < 0
    || (analytics.app_environment !== 'simulator' && analytics.maturity_hours < 24)) {
    throw new Error('Open dashboard analytics has invalid window or timestamp');
  }

  const coverage = analytics.coverage;
  if (!coverage || typeof coverage !== 'object') {
    throw new Error('Open dashboard analytics is missing event coverage');
  }
  for (const name of [
    'screen_view_events_received',
    'screen_exit_events_received',
    'unique_screen_instances',
    'unique_transitions',
    'duplicate_screen_views',
    'duplicate_screen_exits',
  ]) assertNonNegativeInteger(coverage[name], `coverage ${name}`);

  if (coverage.unique_transitions > coverage.unique_screen_instances
    || coverage.unique_screen_instances > coverage.screen_view_events_received
    || coverage.unique_transitions > coverage.screen_exit_events_received) {
    throw new Error('Open dashboard analytics has inconsistent event coverage');
  }
  validateRows(analytics.screens, 'screen rows');
  validateRows(analytics.breakdowns, 'breakdowns', { minimumViews: 10 });

  const totalViews = analytics.screens.reduce((sum, row) => sum + row.viewed_instances, 0);
  const totalTransitions = analytics.screens.reduce((sum, row) => sum + row.continued_instances, 0);
  if (totalViews !== coverage.unique_screen_instances || totalTransitions !== coverage.unique_transitions) {
    throw new Error('Open dashboard analytics has inconsistent screen denominators');
  }
  if (analytics.status === 'ok' && totalViews === 0) {
    throw new Error('Open dashboard analytics has empty rows with ok status');
  }
  if (analytics.status === 'no_events' && (coverage.screen_view_events_received || coverage.screen_exit_events_received)) {
    throw new Error('Open dashboard analytics labels received events as empty');
  }
  if (analytics.status === 'no_views' && (!coverage.screen_exit_events_received || totalViews !== 0)) {
    throw new Error('Open dashboard analytics has invalid no_views status');
  }
  assertNoPrivateFields(analytics);
}

export function validateOpenData(content, { requireProductAnalytics = true } = {}) {
  const data = JSON.parse(content);
  if (!Array.isArray(data?.summary?.platforms) || !Array.isArray(data?.kpis)) {
    throw new Error('Open dashboard data is missing platforms or KPIs');
  }
  const analytics = data.product_analytics?.anicca_ios;
  if (analytics) validateAniccaAnalytics(analytics);
  else if (requireProductAnalytics) validateAniccaAnalytics(analytics);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateOpenData(readFileSync(process.argv[2], 'utf8'));
}
