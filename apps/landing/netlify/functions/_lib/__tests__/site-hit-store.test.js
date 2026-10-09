const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeHit,
  applyHit,
  emptyState,
  recordHit,
  publicStats,
} = require('../site-hit-store');

function memoryStore(seed) {
  let data = seed || null;
  return {
    async get(_key, opts) {
      if (!data) return null;
      return opts && opts.type === 'json' ? structuredClone(data) : data;
    },
    async setJSON(_key, value) {
      data = structuredClone(value);
    },
    snapshot() {
      return structuredClone(data);
    },
  };
}

test('normalizeHit accepts pageviews with attribution', () => {
  const hit = normalizeHit({
    t: 'pageview',
    path: '/affirmation-app/ja/shindan?x=1',
    utm_source: 'x',
    utm_campaign: 'spring',
    ref: 'newsletter',
  });
  assert.equal(hit.kind, 'pageview');
  assert.equal(hit.path, '/affirmation-app/ja/shindan');
  assert.equal(hit.utm_source, 'x');
  assert.equal(hit.utm_campaign, 'spring');
  assert.equal(hit.ref, 'newsletter');
});

test('normalizeHit rejects unknown events and bad paths', () => {
  assert.equal(normalizeHit({ t: 'event', event: 'hack' }), null);
  assert.equal(normalizeHit({ t: 'pageview', path: 'https://evil.test' }), null);
});

test('normalizeHit namespaces result_view and app_store_click', () => {
  assert.equal(
    normalizeHit({ t: 'event', event: 'result_view', type: 'burnout' }).event,
    'result_view:burnout',
  );
  assert.equal(
    normalizeHit({ t: 'event', event: 'app_store_click', ct: 'shindan' }).event,
    'app_store_click:shindan',
  );
});

test('applyHit increments path and event aggregates', () => {
  let state = emptyState();
  state = applyHit(
    state,
    normalizeHit({
      t: 'pageview',
      path: '/affirmation-app/ja/shindan',
      utm_source: 'tiktok',
    }),
  );
  state = applyHit(state, normalizeHit({ t: 'event', event: 'quiz_start' }));
  state = applyHit(
    state,
    normalizeHit({ t: 'event', event: 'result_view', type: 'burnout' }),
  );
  assert.equal(state.total_pageviews, 1);
  assert.equal(state.paths['/affirmation-app/ja/shindan'].count, 1);
  assert.equal(state.paths['/affirmation-app/ja/shindan'].utm_source.tiktok, 1);
  assert.equal(state.events.quiz_start, 1);
  assert.equal(state.events['result_view:burnout'], 1);
  assert.equal(state.events.result_view, 1);
});

test('recordHit persists via store', async () => {
  const store = memoryStore();
  const first = await recordHit(store, {
    t: 'pageview',
    path: '/',
    utm_campaign: 'launch',
  });
  assert.equal(first.ok, true);
  const second = await recordHit(store, { t: 'event', event: 'checkout_click' });
  assert.equal(second.ok, true);
  const snap = store.snapshot();
  assert.equal(snap.total_pageviews, 1);
  assert.equal(snap.events.checkout_click, 1);
  const pub = publicStats(snap);
  assert.equal(pub.total_pageviews, 1);
  assert.match(pub.note, /No cookies/);
});
