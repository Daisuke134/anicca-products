import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const APP_ID = 'ai.anicca.app.ios';
const SCREEN_EVENTS = ['screen_viewed', 'screen_exited'];
const ALLOWED_SERVERS = new Set(['data', 'data-eu', 'data-in']);
const ALLOWED_ENVIRONMENTS = new Set(['production', 'sandbox', 'simulator', 'development']);
const SAFE_DIMENSION = /^[A-Za-z0-9._+-]{1,80}$/;
const MIN_BREAKDOWN_VIEWS = 10;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getMaturedReportingWindow(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { fromDate: isoDate(start), toDate: isoDate(end) };
}

export function getReportingWindow(now = new Date(), environment = 'production') {
  if (environment !== 'simulator') {
    return { ...getMaturedReportingWindow(now), maturityHours: 24 };
  }

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { fromDate: isoDate(start), toDate: isoDate(end), maturityHours: 0 };
}

function safeDimension(value) {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim();
  return SAFE_DIMENSION.test(normalized) ? normalized : 'unknown';
}

function addCount(groupMap, keyParts, dimensions, continued) {
  const key = JSON.stringify(keyParts);
  const current = groupMap.get(key) ?? { ...dimensions, viewed_instances: 0, continued_instances: 0 };
  current.viewed_instances += 1;
  if (continued) current.continued_instances += 1;
  groupMap.set(key, current);
}

function finishRows(rows) {
  return [...rows.values()]
    .sort((a, b) => a.flow_id.localeCompare(b.flow_id)
      || a.screen_id.localeCompare(b.screen_id)
      || a.app_version.localeCompare(b.app_version)
      || a.app_build.localeCompare(b.app_build))
    .map((row) => {
      const noNext = row.viewed_instances - row.continued_instances;
      return {
        ...row,
        no_next_screen_observed: noNext,
        continuation_rate: row.viewed_instances ? Number((row.continued_instances / row.viewed_instances).toFixed(4)) : null,
        no_next_screen_rate: row.viewed_instances ? Number((noNext / row.viewed_instances).toFixed(4)) : null,
      };
    });
}

export function aggregateAniccaScreenEvents(events, {
  observedAt = new Date(),
  window = getMaturedReportingWindow(observedAt),
  environment = 'production',
} = {}) {
  if (!ALLOWED_ENVIRONMENTS.has(environment)) throw new Error('Unsupported Mixpanel app environment');

  const views = new Map();
  const exits = new Map();
  const coverage = {
    screen_view_events_received: 0,
    screen_exit_events_received: 0,
    unique_screen_instances: 0,
    unique_transitions: 0,
    duplicate_screen_views: 0,
    duplicate_screen_exits: 0,
  };

  for (const event of events) {
    if (!SCREEN_EVENTS.includes(event?.event)) continue;
    const properties = event.properties ?? {};
    if (properties.app_id !== APP_ID || properties.app_environment !== environment) continue;
    const instanceId = typeof properties.screen_instance_id === 'string' ? properties.screen_instance_id.trim() : '';
    if (!instanceId || instanceId.length > 100) continue;

    const common = {
      flow_id: safeDimension(properties.flow_id),
      screen_id: safeDimension(properties.screen_id),
      app_version: safeDimension(properties.app_version),
      app_build: safeDimension(properties.app_build),
      language: safeDimension(properties.language),
      locale: safeDimension(properties.locale),
      device_region_code: safeDimension(properties.device_region_code),
      storefront_country_code: safeDimension(properties.storefront_country_code),
    };

    if (event.event === 'screen_viewed') {
      coverage.screen_view_events_received += 1;
      if (views.has(instanceId)) {
        coverage.duplicate_screen_views += 1;
        continue;
      }
      views.set(instanceId, common);
    } else {
      const nextScreen = safeDimension(properties.next_screen_id);
      if (nextScreen === 'unknown') continue;
      coverage.screen_exit_events_received += 1;
      if (exits.has(instanceId)) {
        coverage.duplicate_screen_exits += 1;
        continue;
      }
      exits.set(instanceId, { ...common, next_screen_id: nextScreen });
    }
  }

  const screens = new Map();
  const breakdowns = new Map();
  for (const [instanceId, view] of views) {
    const exit = exits.get(instanceId);
    const continued = Boolean(exit
      && exit.flow_id === view.flow_id
      && exit.screen_id === view.screen_id);
    coverage.unique_screen_instances += 1;
    if (continued) coverage.unique_transitions += 1;

    const screenDimensions = {
      flow_id: view.flow_id,
      screen_id: view.screen_id,
      app_version: view.app_version,
      app_build: view.app_build,
    };
    addCount(screens,
      [view.flow_id, view.screen_id, view.app_version, view.app_build],
      screenDimensions,
      continued);

    const breakdownDimensions = {
      ...screenDimensions,
      language: view.language,
      locale: view.locale,
      device_region_code: view.device_region_code,
      storefront_country_code: view.storefront_country_code,
    };
    addCount(breakdowns,
      [view.flow_id, view.screen_id, view.app_version, view.app_build, view.language, view.locale, view.device_region_code, view.storefront_country_code],
      breakdownDimensions,
      continued);
  }

  const screenRows = finishRows(screens);
  const breakdownRows = finishRows(breakdowns)
    .filter((row) => row.viewed_instances >= MIN_BREAKDOWN_VIEWS);

  return {
    status: views.size ? 'ok' : coverage.screen_view_events_received || coverage.screen_exit_events_received ? 'no_views' : 'no_events',
    source: 'Mixpanel Raw Event Export API',
    observed_at: observedAt.toISOString(),
    app_id: APP_ID,
    app_environment: environment,
    data_from: window.fromDate,
    data_to: window.toDate,
    maturity_hours: window.maturityHours ?? 24,
    coverage,
    screens: screenRows,
    breakdowns: breakdownRows,
  };
}

function parseServiceAccount(value) {
  const separator = value.indexOf(':');
  if (separator <= 0 || separator === value.length - 1) {
    throw new Error('MIXPANEL_SERVICE_ACCOUNT must contain username and secret');
  }
  return {
    username: value.slice(0, separator).trim(),
    password: value.slice(separator + 1).trim(),
  };
}

export async function fetchMixpanelScreenEvents({
  projectId,
  server,
  serviceAccount,
  fromDate,
  toDate,
  fetchImpl = globalThis.fetch,
}) {
  if (!/^\d+$/.test(projectId ?? '')) throw new Error('MIXPANEL_PROJECT_ID must be numeric');
  if (!ALLOWED_SERVERS.has(server)) throw new Error('MIXPANEL_SERVER must be data, data-eu, or data-in');
  const { username, password } = parseServiceAccount(serviceAccount ?? '');
  const url = new URL(`https://${server}.mixpanel.com/api/2.0/export`);
  url.searchParams.set('project_id', projectId);
  url.searchParams.set('from_date', fromDate);
  url.searchParams.set('to_date', toDate);
  url.searchParams.set('event', JSON.stringify(SCREEN_EVENTS));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Mixpanel Export API returned HTTP ${response.status}`);
    const body = await response.text();
    return body.split(/\r?\n/).filter(Boolean).map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Mixpanel Export API returned invalid JSONL at row ${index + 1}`);
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function collectAniccaScreenAnalytics({ env = process.env, now = new Date(), fetchImpl = globalThis.fetch } = {}) {
  const environment = env.MIXPANEL_APP_ENVIRONMENT ?? 'production';
  if (!ALLOWED_ENVIRONMENTS.has(environment)) throw new Error('MIXPANEL_APP_ENVIRONMENT is invalid');
  const window = getReportingWindow(now, environment);
  if (typeof env.MIXPANEL_SERVICE_ACCOUNT !== 'string' || !env.MIXPANEL_SERVICE_ACCOUNT.trim()) {
    return {
      status: 'unavailable',
      error_code: 'missing_service_account',
      source: 'Mixpanel Raw Event Export API',
      observed_at: now.toISOString(),
      app_id: APP_ID,
      app_environment: environment,
      data_from: window.fromDate,
      data_to: window.toDate,
      maturity_hours: window.maturityHours ?? 24,
      screens: [],
      breakdowns: [],
    };
  }
  const events = await fetchMixpanelScreenEvents({
    projectId: env.MIXPANEL_PROJECT_ID,
    server: env.MIXPANEL_SERVER,
    serviceAccount: env.MIXPANEL_SERVICE_ACCOUNT ?? '',
    fromDate: window.fromDate,
    toDate: window.toDate,
    fetchImpl,
  });
  return aggregateAniccaScreenEvents(events, { observedAt: now, window, environment });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataPath = process.argv[2] ?? 'out/open/data.json';
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const analytics = await collectAniccaScreenAnalytics();
  data.product_analytics ??= {};
  data.product_analytics.anicca_ios = analytics;
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(analytics.status === 'unavailable'
    ? `Mixpanel Anicca screen snapshot: unavailable (${analytics.error_code}); no export request was made.`
    : `Mixpanel Anicca screen snapshot: ${analytics.status}, ${analytics.screens.length} screens, ${analytics.data_from}–${analytics.data_to}.`);
}
