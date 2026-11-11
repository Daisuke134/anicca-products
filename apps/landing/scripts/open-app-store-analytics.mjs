import { createHash, sign } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';

const API_ROOT = 'https://api.appstoreconnect.apple.com/v1';
const REPORTS = {
  discovery: 'App Store Discovery and Engagement Standard',
  downloads: 'App Downloads Standard',
};
const APPS = [
  { id: '6755129214', name: 'Anicca' },
  { id: '6757726663', name: 'Daily Dhamma' },
  { id: '6759514159', name: 'Thankful' },
  { id: '6762143790', name: 'Sleep Reset' },
  { id: '6759667221', name: 'Honne' },
  { id: '6766485903', name: 'STUDIO CHERIE' },
];
const DISCOVERY_KEYS = ['impressions', 'unique_impressions', 'page_views', 'unique_page_views', 'taps', 'unique_taps'];
const DOWNLOAD_KEYS = ['events', 'unique_events', 'first_time', 'auto_update', 'manual_update', 'redownload', 'restore', 'other'];
const KEEP_DAYS = 90;

const normalizedKey = value => String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const numeric = value => {
  if (value == null || String(value).trim() === '') return null;
  const parsed = Number(String(value).replaceAll(',', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

function sumKnown(values) {
  const known = values.filter(value => Number.isFinite(value));
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

function latestRowsByAppDay(rows, keys) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row.app_id || !row.date || !row.processing_date) continue;
    const key = `${row.app_id}|${row.date}`;
    const previous = grouped.get(key);
    if (!previous || row.processing_date > previous.processing_date) {
      grouped.set(key, { app_id: row.app_id, date: row.date, processing_date: row.processing_date, rows: [row] });
    } else if (row.processing_date === previous.processing_date) {
      previous.rows.push(row);
    }
  }
  return new Map([...grouped].map(([key, group]) => [key, {
    app_id: group.app_id,
    date: group.date,
    processing_date: group.processing_date,
    metrics: Object.fromEntries(keys.map(metric => [metric, metric.startsWith('unique_') ? null : sumKnown(group.rows.map(row => row.metrics?.[metric]))])),
    source_rows: group.rows.map(row => row.source_row ?? { dimensions: row.dimensions ?? {}, metrics: row.metrics ?? {} }),
  }]));
}

function dateRange(period) {
  const start = new Date(`${period.start_date}T00:00:00Z`);
  const end = new Date(`${period.end_date}T00:00:00Z`);
  const days = [];
  for (let day = start; day <= end; day = new Date(day.getTime() + 86400000)) days.push(day.toISOString().slice(0, 10));
  return days;
}

function derivePeriod(discoveryRows, downloadRows) {
  const dates = [...discoveryRows, ...downloadRows].map(row => row.date).filter(Boolean).sort();
  if (!dates.length) throw new Error('App Store Connect returned no daily analytics rows');
  const end = dates.at(-1);
  const startDate = new Date(`${end}T00:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  return { start_date: startDate.toISOString().slice(0, 10), end_date: end };
}

function aggregateMetric(days, section, key) {
  return sumKnown(days.map(day => day[section]?.[key]));
}

function appTotals(daily, periodDays) {
  const days = daily.filter(day => periodDays.has(day.date));
  return {
    metrics: Object.fromEntries(DISCOVERY_KEYS.map(key => [key, aggregateMetric(days, 'discovery', key)])),
    download_metrics: Object.fromEntries(DOWNLOAD_KEYS.map(key => [key, aggregateMetric(days, 'downloads', key)])),
    discovery_days: days.filter(day => day.discovery != null).length,
    download_days: days.filter(day => day.downloads != null).length,
  };
}

function rebuildSnapshot(apps, period, measuredAt, processingDate) {
  const periodDays = new Set(dateRange(period));
  const dailyInPeriod = apps.flatMap(app => app.daily.filter(day => periodDays.has(day.date)));
  const discovery = Object.fromEntries(DISCOVERY_KEYS.map(key => [key, aggregateMetric(dailyInPeriod, 'discovery', key)]));
  const downloads = Object.fromEntries(DOWNLOAD_KEYS.map(key => [key, aggregateMetric(dailyInPeriod, 'downloads', key)]));
  const appDaysExpected = apps.length * periodDays.size;
  return {
    source: 'App Store Connect Analytics Reports',
    measured_at: measuredAt,
    period: { ...period, processing_date: processingDate },
    coverage: {
      app_days_expected: appDaysExpected,
      discovery_app_days: dailyInPeriod.filter(day => day.discovery != null).length,
      download_app_days: dailyInPeriod.filter(day => day.downloads != null).length,
    },
    summary: { discovery, downloads },
    apps: apps.map(app => {
      const totals = appTotals(app.daily, periodDays);
      return {
        ...app,
        metrics: totals.metrics,
        download_metrics: totals.download_metrics,
        download_events: totals.download_metrics.events,
        discovery_days: totals.discovery_days,
        download_days: totals.download_days,
      };
    }),
  };
}

export function aggregateDailyMetrics({ apps, discoveryRows, downloadRows, period, measured_at }) {
  if (!Array.isArray(apps) || !apps.length) throw new Error('App Store app allowlist is empty');
  const selectedDiscovery = latestRowsByAppDay(discoveryRows, DISCOVERY_KEYS);
  const selectedDownloads = latestRowsByAppDay(downloadRows, DOWNLOAD_KEYS);
  const selectedPeriod = period ?? derivePeriod(discoveryRows, downloadRows);
  const allowedDays = new Set(dateRange(selectedPeriod));
  const latestProcessingDate = [...selectedDiscovery.values(), ...selectedDownloads.values()]
    .map(row => row.processing_date).sort().at(-1) ?? null;
  const resultApps = apps.map(app => {
    const daily = [];
    for (const date of allowedDays) {
      const key = `${app.id}|${date}`;
      const discovery = selectedDiscovery.get(key);
      const downloads = selectedDownloads.get(key);
      daily.push({
        date,
        processing_date: [discovery?.processing_date, downloads?.processing_date].filter(Boolean).sort().at(-1) ?? null,
        discovery_processing_date: discovery?.processing_date ?? null,
        downloads_processing_date: downloads?.processing_date ?? null,
        discovery: discovery?.metrics ?? null,
        downloads: downloads?.metrics ?? null,
        source_rows: {
          discovery: discovery?.source_rows ?? [],
          downloads: downloads?.source_rows ?? [],
        },
      });
    }
    return { app: app.name, app_id: app.id, daily };
  });
  return rebuildSnapshot(resultApps, selectedPeriod, measured_at ?? new Date().toISOString(), latestProcessingDate);
}

function combineReportDays(current, previous, reportKey) {
  if (!current) return previous;
  if (!previous) return current;
  const currentDate = current[`${reportKey}_processing_date`] ?? '';
  const previousDate = previous[`${reportKey}_processing_date`] ?? '';
  return currentDate >= previousDate ? current : previous;
}

export function mergeAppStoreAnalytics(previous, current) {
  if (!previous?.apps?.length) return current;
  const latestDate = current.period.end_date;
  const cutoff = new Date(`${latestDate}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - (KEEP_DAYS - 1));
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  const apps = current.apps.map(app => {
    const old = previous.apps.find(item => item.app_id === app.app_id);
    const byDate = new Map((old?.daily ?? []).map(day => [day.date, day]));
    for (const day of app.daily) {
      const prior = byDate.get(day.date);
      byDate.set(day.date, {
        ...day,
        discovery: combineReportDays(day, prior, 'discovery')?.discovery ?? null,
        discovery_processing_date: combineReportDays(day, prior, 'discovery')?.discovery_processing_date ?? null,
        downloads: combineReportDays(day, prior, 'downloads')?.downloads ?? null,
        downloads_processing_date: combineReportDays(day, prior, 'downloads')?.downloads_processing_date ?? null,
        processing_date: [
          combineReportDays(day, prior, 'discovery')?.discovery_processing_date,
          combineReportDays(day, prior, 'downloads')?.downloads_processing_date,
        ].filter(Boolean).sort().at(-1) ?? null,
        source_rows: {
          discovery: combineReportDays(day, prior, 'discovery')?.source_rows?.discovery ?? [],
          downloads: combineReportDays(day, prior, 'downloads')?.source_rows?.downloads ?? [],
        },
      });
    }
    const daily = [...byDate.values()].filter(day => day.date >= cutoffDate).sort((a, b) => a.date.localeCompare(b.date));
    return { app: app.app, app_id: app.app_id, daily };
  });
  return rebuildSnapshot(apps, current.period, current.measured_at, current.period.processing_date);
}

function parseJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createAppStoreConnectToken({ issuerId, keyId, privateKey, now = Date.now() }) {
  if (!issuerId || !keyId || !privateKey) throw new Error('App Store Connect API credentials are incomplete');
  const header = parseJwtPart({ alg: 'ES256', kid: keyId, typ: 'JWT' });
  const issuedAt = Math.floor(now / 1000);
  const payload = parseJwtPart({ iss: issuerId, iat: issuedAt, exp: issuedAt + 600, aud: 'appstoreconnect-v1' });
  const unsigned = `${header}.${payload}`;
  const signature = sign('sha256', Buffer.from(unsigned), { key: privateKey.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' });
  return `${unsigned}.${signature.toString('base64url')}`;
}

async function fetchWithRetry(url, options, fetchImpl) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetchImpl(url, options);
      if (response.ok) return response;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
        throw new Error(`App Store Connect request ${new URL(url).pathname} failed (${response.status})`);
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      await new Promise(resolve => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * (2 ** attempt)));
    } catch (error) {
      lastError = error;
      if (attempt === 3 || /failed \(\d+\)$/.test(error.message)) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw lastError ?? new Error('App Store Connect request failed');
}

async function fetchPages(url, token, fetchImpl) {
  const resources = [];
  let next = url;
  for (let page = 0; next && page < 25; page += 1) {
    const parsed = new URL(next);
    if (parsed.origin !== API_ROOT.replace('/v1', '') || !parsed.pathname.startsWith('/v1/')) throw new Error('Unexpected App Store Connect pagination URL');
    const response = await fetchWithRetry(next, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }, fetchImpl);
    const body = await response.json();
    const pageData = body.data ?? [];
    resources.push(...(Array.isArray(pageData) ? pageData : [pageData]));
    next = body.links?.next ?? null;
  }
  if (next) throw new Error('App Store Connect pagination exceeded the safety limit');
  return resources;
}

function tsvCells(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === '\t' && !quoted) { cells.push(cell); cell = ''; }
    else cell += character;
  }
  cells.push(cell);
  return cells;
}

function valueFor(record, aliases) {
  const values = new Map(Object.entries(record).map(([key, value]) => [normalizedKey(key), value]));
  for (const alias of aliases) {
    const found = values.get(normalizedKey(alias));
    if (found != null && String(found).trim() !== '') return found;
  }
  return null;
}

function reportDate(value) {
  const match = String(value ?? '').match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

function downloadType(value) {
  const type = normalizedKey(value);
  if (type.includes('firsttime') || type.includes('firstdownload') || type === 'download') return 'first_time';
  if (type.includes('redownload')) return 'redownload';
  if (type.includes('autoupdate') || type.includes('automaticupdate')) return 'auto_update';
  if (type.includes('manualupdate') || type === 'update') return 'manual_update';
  if (type.includes('restore')) return 'restore';
  return 'other';
}

export function parseAnalyticsTsv(text, { appId, processingDate, report }) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.length);
  if (lines.length < 2) return [];
  const headers = tsvCells(lines[0]);
  return lines.slice(1).map(line => {
    const values = tsvCells(line);
    const sourceRow = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const rowAppId = String(valueFor(sourceRow, ['App Apple ID', 'App Apple Identifier', 'App ID', 'Apple ID']) ?? appId);
    const date = reportDate(valueFor(sourceRow, ['Date', 'Report Date']));
    if (!date) return null;
    if (report === 'discovery') {
      const metrics = Object.fromEntries(DISCOVERY_KEYS.map(key => [key, null]));
      const event = normalizedKey(valueFor(sourceRow, ['Event']));
      const metric = event.includes('impression') ? 'impressions' : event.includes('pageview') ? 'page_views' : event.includes('tap') ? 'taps' : null;
      if (metric) {
        metrics[metric] = numeric(valueFor(sourceRow, ['Counts', 'Count']));
        metrics[`unique_${metric}`] = numeric(valueFor(sourceRow, ['Unique Counts', 'Unique Count']));
      }
      return { app_id: rowAppId, date, processing_date: processingDate, metrics, source_row: sourceRow };
    }
    const count = numeric(valueFor(sourceRow, ['Counts', 'Count', 'Events']));
    const uniqueCount = numeric(valueFor(sourceRow, ['Unique Counts', 'Unique Count', 'Unique Events']));
    const category = downloadType(valueFor(sourceRow, ['Download Type', 'Event Type', 'Type']));
    const metrics = { events: count, unique_events: uniqueCount, [category]: count };
    return { app_id: rowAppId, date, processing_date: processingDate, metrics, dimensions: { download_type: category }, source_row: sourceRow };
  }).filter(Boolean);
}

async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index]);
    }
  }));
  return results.flat();
}

function recentProcessingDates(now, count = 8) {
  const dates = [];
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  for (let index = 0; index < count; index += 1) {
    const date = new Date(day.getTime() - index * 86400000);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

async function fetchReportRows({ reportId, appId, report, dates, token, fetchImpl }) {
  const url = new URL(`${API_ROOT}/analyticsReports/${reportId}/instances`);
  url.searchParams.set('filter[granularity]', 'DAILY');
  url.searchParams.set('filter[processingDate]', dates.join(','));
  url.searchParams.set('limit', '200');
  const uniqueInstances = [...new Map((await fetchPages(url, token, fetchImpl)).map(instance => [instance.id, instance])).values()];
  const results = await mapLimit(uniqueInstances, 4, async instance => {
    const processingDate = instance.attributes?.processingDate;
    if (!processingDate) return [];
    const segmentUrl = `${API_ROOT}/analyticsReportInstances/${instance.id}/segments?limit=200`;
    const segments = await fetchPages(segmentUrl, token, fetchImpl);
    const segmentRows = await mapLimit(segments, 3, async segment => {
      const url = segment.attributes?.url;
      const checksum = segment.attributes?.checksum;
      if (!url || !checksum) throw new Error('App Store Connect segment is missing download metadata');
      const response = await fetchWithRetry(url, {}, fetchImpl);
      const compressed = Buffer.from(await response.arrayBuffer());
      const observedChecksum = createHash('md5').update(compressed).digest('hex');
      if (observedChecksum.toLowerCase() !== String(checksum).toLowerCase()) throw new Error('App Store Connect segment checksum mismatch');
      const content = gunzipSync(compressed).toString('utf8');
      return parseAnalyticsTsv(content, { appId, processingDate, report });
    });
    return segmentRows.flat();
  });
  return results.flat();
}

async function collectReportIds(appId, token, fetchImpl) {
  const requestUrl = `${API_ROOT}/apps/${appId}/relationships/analyticsReportRequests?limit=200`;
  const requestRefs = await fetchPages(requestUrl, token, fetchImpl);
  const requests = await mapLimit(requestRefs, 3, async item => {
    const found = await fetchPages(`${API_ROOT}/analyticsReportRequests/${item.id}`, token, fetchImpl);
    return found[0] ?? null;
  });
  const ongoing = requests.find(item => item.attributes?.accessType === 'ONGOING');
  if (!ongoing) throw new Error(`No ongoing App Store analytics request for app ${appId}`);
  const reports = await fetchPages(`${API_ROOT}/analyticsReportRequests/${ongoing.id}/reports?limit=200`, token, fetchImpl);
  const result = {};
  for (const [key, name] of Object.entries(REPORTS)) {
    const report = reports.find(item => item.attributes?.name === name);
    if (!report) throw new Error(`App Store analytics report unavailable: ${name} for app ${appId}`);
    result[key] = report.id;
  }
  return result;
}

export async function collectAnalytics({ issuerId, keyId, privateKey, fetchImpl = fetch, now = new Date() }) {
  const token = createAppStoreConnectToken({ issuerId, keyId, privateKey, now: now.getTime() });
  const dates = recentProcessingDates(now);
  const appReports = await mapLimit(APPS, 3, async app => ({ app, reports: await collectReportIds(app.id, token, fetchImpl) }));
  const rows = await mapLimit(appReports, 2, async ({ app, reports }) => {
    const [discoveryRows, downloadRows] = await Promise.all([
      fetchReportRows({ reportId: reports.discovery, appId: app.id, report: 'discovery', dates, token, fetchImpl }),
      fetchReportRows({ reportId: reports.downloads, appId: app.id, report: 'downloads', dates, token, fetchImpl }),
    ]);
    return { discoveryRows, downloadRows };
  });
  const discoveryRows = rows.flatMap(item => item.discoveryRows);
  const downloadRows = rows.flatMap(item => item.downloadRows);
  if (!discoveryRows.length) throw new Error('App Store Connect returned no discovery rows; refusing to replace the last snapshot');
  const period = derivePeriod(discoveryRows, downloadRows);
  const snapshot = aggregateDailyMetrics({ apps: APPS, discoveryRows, downloadRows, period, measured_at: now.toISOString() });
  return snapshot;
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const inputIndex = args.indexOf('--input');
  const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : 'out/open/data.json';
  if (!inputPath) throw new Error('Expected a path after --input');
  const credentials = {
    issuerId: env.APP_STORE_CONNECT_ISSUER_ID,
    keyId: env.APP_STORE_CONNECT_KEY_ID,
    privateKey: env.APP_STORE_CONNECT_PRIVATE_KEY,
  };
  const current = await collectAnalytics(credentials);
  const data = JSON.parse(await readFile(inputPath, 'utf8'));
  data.app_store_analytics = mergeAppStoreAnalytics(data.app_store_analytics, current);
  data.app_store_analytics_status = 'scheduled-snapshot';
  await writeFile(inputPath, `${JSON.stringify(data, null, 2)}\n`);
  const { period, coverage, summary } = data.app_store_analytics;
  console.log(`App Store analytics updated: ${period.start_date} to ${period.end_date}; discovery ${coverage.discovery_app_days}/${coverage.app_days_expected} app-days; downloads ${coverage.download_app_days}/${coverage.app_days_expected} app-days; impressions ${summary.discovery.impressions ?? 'unknown'}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
