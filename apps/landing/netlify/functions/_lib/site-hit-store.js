// Cookieless first-party aggregate counters for aniccaai.com.
// No IPs, no cookies, no user ids — path/event tallies only.

const COUNTERS_KEY = 'counters';
const MAX_PATH_LEN = 180;
const MAX_ATTR_LEN = 64;
const MAX_PATHS = 400;
const MAX_EVENTS = 200;

const ALLOWED_EVENTS = new Set([
  'quiz_start',
  'quiz_complete',
  'result_view',
  'checkout_click',
  'checkout_success',
  'app_store_click',
]);

function emptyState() {
  return {
    total_pageviews: 0,
    paths: {},
    events: {},
    updated_at: null,
  };
}

function sanitizeToken(value, max = MAX_ATTR_LEN) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, max);
  if (!trimmed) return '';
  // Keep printable attribution tokens only (utm / ref / ct / type).
  if (!/^[a-zA-Z0-9_.:/=+-]+$/.test(trimmed)) return '';
  return trimmed;
}

function sanitizePath(raw) {
  if (typeof raw !== 'string') return '';
  let path = raw.trim();
  if (!path.startsWith('/')) path = `/${path}`;
  // Drop query/hash — attribution is stored separately.
  path = path.split('?')[0].split('#')[0];
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (path.length > MAX_PATH_LEN) path = path.slice(0, MAX_PATH_LEN);
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(path)) return '';
  return path || '/';
}

function bumpMap(map, key, n = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + n;
}

function ensurePathEntry(state, path) {
  if (!state.paths[path]) {
    const keys = Object.keys(state.paths);
    if (keys.length >= MAX_PATHS) {
      // Drop a low-count path to bound blob size.
      let victim = keys[0];
      let min = state.paths[victim].count || 0;
      for (const k of keys) {
        const c = state.paths[k].count || 0;
        if (c < min) {
          min = c;
          victim = k;
        }
      }
      delete state.paths[victim];
    }
    state.paths[path] = { count: 0, utm_source: {}, utm_campaign: {}, ref: {} };
  }
  return state.paths[path];
}

function bumpEvent(state, name, n = 1) {
  const keys = Object.keys(state.events);
  if (!state.events[name] && keys.length >= MAX_EVENTS) {
    let victim = keys[0];
    let min = state.events[victim] || 0;
    for (const k of keys) {
      const c = state.events[k] || 0;
      if (c < min) {
        min = c;
        victim = k;
      }
    }
    delete state.events[victim];
  }
  bumpMap(state.events, name, n);
}

function normalizeHit(input) {
  const kind = input && input.t === 'event' ? 'event' : 'pageview';
  const path = sanitizePath(input && input.path);
  const utm_source = sanitizeToken(input && input.utm_source);
  const utm_campaign = sanitizeToken(input && input.utm_campaign);
  const ref = sanitizeToken(input && (input.ref || input.referrer));
  const ct = sanitizeToken(input && input.ct);
  let event = sanitizeToken(input && input.event, 40);
  const type = sanitizeToken(input && input.type, 40);

  if (kind === 'event') {
    if (!ALLOWED_EVENTS.has(event)) return null;
    if (event === 'result_view' && type) event = `result_view:${type}`;
    if (event === 'app_store_click' && ct) event = `app_store_click:${ct}`;
  } else if (!path) {
    return null;
  }

  return { kind, path, utm_source, utm_campaign, ref, event, type, ct };
}

function applyHit(state, hit) {
  const next = state && typeof state === 'object' ? state : emptyState();
  if (!next.paths) next.paths = {};
  if (!next.events) next.events = {};
  if (typeof next.total_pageviews !== 'number') next.total_pageviews = 0;

  if (hit.kind === 'pageview') {
    next.total_pageviews += 1;
    const entry = ensurePathEntry(next, hit.path);
    entry.count += 1;
    bumpMap(entry.utm_source, hit.utm_source);
    bumpMap(entry.utm_campaign, hit.utm_campaign);
    bumpMap(entry.ref, hit.ref);
  } else {
    bumpEvent(next, hit.event);
    // Also keep bare name totals for funnel math.
    const bare = hit.event.split(':')[0];
    if (bare !== hit.event) bumpEvent(next, bare);
  }

  next.updated_at = new Date().toISOString();
  return next;
}

async function loadCounters(store) {
  if (!store) return emptyState();
  const data = await store.get(COUNTERS_KEY, { type: 'json' });
  return data && typeof data === 'object' ? data : emptyState();
}

async function saveCounters(store, state) {
  await store.setJSON(COUNTERS_KEY, state);
}

async function recordHit(store, rawInput) {
  const hit = normalizeHit(rawInput || {});
  if (!hit) return { ok: false, reason: 'bad_payload' };
  const current = await loadCounters(store);
  const next = applyHit(current, hit);
  await saveCounters(store, next);
  return { ok: true, hit, state: next };
}

function publicStats(state) {
  const src = state && typeof state === 'object' ? state : emptyState();
  return {
    total_pageviews: src.total_pageviews || 0,
    paths: src.paths || {},
    events: src.events || {},
    updated_at: src.updated_at || null,
    note: 'Aggregate counts only. No cookies, IPs, or personal data stored.',
  };
}

module.exports = {
  COUNTERS_KEY,
  ALLOWED_EVENTS,
  emptyState,
  sanitizePath,
  sanitizeToken,
  normalizeHit,
  applyHit,
  loadCounters,
  saveCounters,
  recordHit,
  publicStats,
};
