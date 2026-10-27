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
    utm_medium: 'social',
    utm_campaign: 'spring',
    ref: 'newsletter',
  });
  assert.equal(hit.kind, 'pageview');
  assert.equal(hit.path, '/affirmation-app/ja/shindan');
  assert.equal(hit.utm_source, 'x');
  assert.equal(hit.utm_medium, 'social');
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

test('normalizes and aggregates sticker clicks by product and article', () => {
  const hit = normalizeHit({
    t: 'event',
    event: 'line_sticker_click',
    type: '37146107',
    ct: 'line-sticker-set-005-2026-10-12-22',
    path: '/blog/line-sticker-set-005-2026-10-12-22',
  });
  assert.ok(hit, 'official sticker CTA click should be accepted');
  assert.equal(hit.event, 'line_sticker_click:37146107:line-sticker-set-005-2026-10-12-22');
  const state = applyHit(emptyState(), hit);
  assert.equal(state.events[hit.event], 1);
  assert.equal(state.events.line_sticker_click, 1);
});

test('rejects malformed sticker click attribution', () => {
  assert.equal(normalizeHit({
    t: 'event', event: 'line_sticker_click', type: 'x',
    ct: 'line-sticker-set-005-2026-10-12-22',
  }), null);
  assert.equal(normalizeHit({
    t: 'event', event: 'line_sticker_click', type: '37146107',
    ct: 'not-a-sticker-article',
  }), null);
});

test('applyHit stores medium on a legacy pageview path entry', () => {
  let state = {
    total_pageviews: 0,
    paths: {
      '/affirmation-app/ja/shindan': {
        count: 0,
        utm_source: {},
        utm_campaign: {},
        ref: {},
      },
    },
    events: {},
    updated_at: null,
  };
  state = applyHit(
    state,
    normalizeHit({
      t: 'pageview',
      path: '/affirmation-app/ja/shindan',
      utm_source: 'tiktok',
      utm_medium: 'social',
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
  assert.equal(state.paths['/affirmation-app/ja/shindan'].utm_medium.social, 1);
  assert.equal(state.events.quiz_start, 1);
  assert.equal(state.events['result_view:burnout'], 1);
  assert.equal(state.events.result_view, 1);
});

test('attributes existing funnel events to source, medium, and campaign', () => {
  const hit = normalizeHit({
    t: 'event',
    path: '/monk',
    event: 'checkout_click',
    utm_source: 'x',
    utm_medium: 'social',
    utm_campaign: 'ai_monk_launch',
  });
  const state = applyHit(emptyState(), hit);

  assert.equal(state.events.checkout_click, 1);
  assert.equal(
    state.events_by_campaign['checkout_click|x|social|ai_monk_launch|'],
    1,
  );
  assert.equal(
    publicStats(state).events_by_campaign['checkout_click|x|social|ai_monk_launch|'],
    1,
  );
});

test('accepts the canonical funnel and aggregates the test campaign token', () => {
  const eventNames = [
    'onboarding_completed',
    'paywall_shown',
    'trial_started',
    'purchase_completed',
  ];
  const normalized = eventNames.map((event) => normalizeHit({ t: 'event', event }));
  assert.deepEqual(normalized.map((hit) => hit && hit.event), eventNames);

  const state = applyHit(emptyState(), normalizeHit({
    t: 'event',
    path: '/onboarding/paywall',
    event: 'paywall_shown',
    ct: 'test_codex_1027',
    utm_source: 'codex_test',
    utm_medium: 'qa',
    utm_campaign: 'test_codex_1027',
  }));
  assert.equal(state.events.paywall_shown, 1);
  assert.equal(
    state.events_by_campaign[
      'paywall_shown|codex_test|qa|test_codex_1027|test_codex_1027'
    ],
    1,
  );
});

test('keeps prototype-like UTM values as ordinary bounded map keys', () => {
  const state = applyHit(emptyState(), normalizeHit({
    t: 'pageview',
    path: '/monk',
    utm_medium: '__proto__',
  }));
  const values = state.paths['/monk'].utm_medium;

  assert.equal(Object.hasOwn(values, '__proto__'), true);
  assert.equal(values.__proto__, 1);
  assert.equal(Object.getPrototypeOf(values), Object.prototype);
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
