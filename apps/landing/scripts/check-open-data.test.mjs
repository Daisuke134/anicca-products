import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateOpenData } from './check-open-data.mjs';

const analytics = {
  status: 'ok',
  source: 'Mixpanel Raw Event Export API',
  observed_at: '2026-11-07T00:00:00.000Z',
  app_id: 'ai.anicca.app.ios',
  app_environment: 'production',
  data_from: '2026-10-30',
  data_to: '2026-11-05',
  maturity_hours: 24,
  coverage: {
    screen_view_events_received: 10,
    screen_exit_events_received: 8,
    unique_screen_instances: 10,
    unique_transitions: 8,
    duplicate_screen_views: 0,
    duplicate_screen_exits: 0,
  },
  screens: [{
    flow_id: 'onboarding',
    screen_id: 'onboarding.goal',
    app_version: '1.9.8',
    app_build: '818',
    viewed_instances: 10,
    continued_instances: 8,
    no_next_screen_observed: 2,
    continuation_rate: 0.8,
    no_next_screen_rate: 0.2,
  }],
  breakdowns: [],
};

const validOpenData = (productAnalytics = analytics) => JSON.stringify({
  summary: { platforms: [] },
  kpis: [],
  product_analytics: { anicca_ios: productAnalytics },
});

test('requires usable Open dashboard data and a valid Anicca analytics snapshot', () => {
  assert.doesNotThrow(() => validateOpenData(validOpenData()));
  assert.throws(() => validateOpenData('{"summary":{"platforms":[]},"kpis":[]}'));
  for (const input of ['', '<html>404</html>', '{}', '{"summary":{},"kpis":[]}']) {
    assert.throws(() => validateOpenData(input));
  }
});

test('rejects broken denominators, duplicate rows, and public user identifiers', () => {
  assert.throws(() => validateOpenData(validOpenData({ ...analytics, screens: [{
    ...analytics.screens[0], continued_instances: 11,
  }] })));
  assert.throws(() => validateOpenData(validOpenData({ ...analytics, screens: [
    analytics.screens[0], analytics.screens[0],
  ] })));
  assert.throws(() => validateOpenData(validOpenData({ ...analytics, screens: [{
    ...analytics.screens[0], distinct_id: 'private-id',
  }] })));
});

test('allows a successful empty export without turning missing data into zero screens', () => {
  assert.doesNotThrow(() => validateOpenData(validOpenData({
    ...analytics,
    status: 'no_events',
    coverage: Object.fromEntries(Object.keys(analytics.coverage).map((key) => [key, 0])),
    screens: [],
    breakdowns: [],
  })));
});

test('allows an explicitly immature simulator preview but keeps production matured', () => {
  assert.doesNotThrow(() => validateOpenData(validOpenData({
    ...analytics,
    app_environment: 'simulator',
    data_from: '2026-11-01',
    data_to: '2026-11-07',
    maturity_hours: 0,
  })));
  assert.throws(() => validateOpenData(validOpenData({
    ...analytics,
    maturity_hours: 0,
  })));
});
