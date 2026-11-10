import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  aggregateAniccaScreenEvents,
  collectAniccaScreenAnalytics,
  getMaturedReportingWindow,
  getReportingWindow,
} from './open-mixpanel-analytics.mjs';

const event = (name, properties = {}) => ({
  event: name,
  properties: {
    app_id: 'ai.anicca.app.ios',
    app_environment: 'production',
    app_version: '1.9.8',
    app_build: '818',
    flow_id: 'onboarding',
    screen_id: 'onboarding.goal',
    screen_instance_id: 'private-instance-id',
    language: 'en',
    locale: 'en_US',
    device_region_code: 'US',
    storefront_country_code: 'US',
    distinct_id: 'private-user-id',
    ...properties,
  },
});

test('uses seven complete UTC days with at least 24 hours of maturity', () => {
  assert.deepEqual(getMaturedReportingWindow(new Date('2026-11-07T12:30:00.000Z')), {
    fromDate: '2026-10-30',
    toDate: '2026-11-05',
  });
  assert.deepEqual(getReportingWindow(new Date('2026-11-07T12:30:00.000Z'), 'production'), {
    fromDate: '2026-10-30',
    toDate: '2026-11-05',
    maturityHours: 24,
  });
});

test('shows current simulator events in preview and marks them immature', () => {
  assert.deepEqual(getReportingWindow(new Date('2026-11-07T12:30:00.000Z'), 'simulator'), {
    fromDate: '2026-11-01',
    toDate: '2026-11-07',
    maturityHours: 0,
  });
});

test('aggregates screen views and observed transitions once per instance, and filters other environments', () => {
  const result = aggregateAniccaScreenEvents([
    event('screen_viewed'),
    event('screen_viewed'),
    event('screen_exited', { next_screen_id: 'onboarding.pain_points' }),
    event('screen_exited', { next_screen_id: 'onboarding.pain_points' }),
    event('screen_viewed', { screen_instance_id: 'second-instance' }),
    event('screen_viewed', { screen_instance_id: 'sim-instance', app_environment: 'simulator' }),
    event('screen_viewed', { screen_instance_id: 'other-app', app_id: 'other.app' }),
  ], {
    observedAt: new Date('2026-11-07T12:30:00.000Z'),
    window: { fromDate: '2026-10-30', toDate: '2026-11-05' },
    environment: 'production',
  });

  assert.equal(result.status, 'ok');
  assert.deepEqual(result.coverage, {
    screen_view_events_received: 3,
    screen_exit_events_received: 2,
    unique_screen_instances: 2,
    unique_transitions: 1,
    duplicate_screen_views: 1,
    duplicate_screen_exits: 1,
  });
  assert.deepEqual(result.screens, [{
    flow_id: 'onboarding',
    screen_id: 'onboarding.goal',
    app_version: '1.9.8',
    app_build: '818',
    viewed_instances: 2,
    continued_instances: 1,
    no_next_screen_observed: 1,
    continuation_rate: 0.5,
    no_next_screen_rate: 0.5,
  }]);
  assert.equal(result.breakdowns.length, 0, 'small country/locale cohorts are suppressed');
  assert.equal(JSON.stringify(result).includes('private-user-id'), false);
  assert.equal(JSON.stringify(result).includes('private-instance-id'), false);
});

test('publishes country and locale breakdowns only at the minimum cohort size', () => {
  const events = Array.from({ length: 10 }, (_, index) => event('screen_viewed', {
    screen_instance_id: `instance-${index}`,
  }));
  const result = aggregateAniccaScreenEvents(events, {
    observedAt: new Date('2026-11-07T12:30:00.000Z'),
    window: { fromDate: '2026-10-30', toDate: '2026-11-05' },
    environment: 'production',
  });

  assert.equal(result.breakdowns.length, 1);
  assert.equal(result.breakdowns[0].viewed_instances, 10);
  assert.equal(result.breakdowns[0].locale, 'en_US');
  assert.equal(result.breakdowns[0].storefront_country_code, 'US');
});

test('distinguishes a successful empty export from a failed collection', () => {
  const result = aggregateAniccaScreenEvents([], {
    observedAt: new Date('2026-11-07T12:30:00.000Z'),
    window: { fromDate: '2026-10-30', toDate: '2026-11-05' },
    environment: 'production',
  });

  assert.equal(result.status, 'no_events');
  assert.deepEqual(result.screens, []);
});

test('reports missing service-account configuration as unavailable without making a request', async () => {
  let requestCount = 0;
  const result = await collectAniccaScreenAnalytics({
    env: {
      MIXPANEL_PROJECT_ID: '3970220',
      MIXPANEL_SERVER: 'data',
      MIXPANEL_APP_ENVIRONMENT: 'production',
    },
    now: new Date('2026-11-07T12:30:00.000Z'),
    fetchImpl: async () => {
      requestCount += 1;
      return { ok: true, status: 200, text: async () => '' };
    },
  });

  assert.equal(requestCount, 0);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.error_code, 'missing_service_account');
  assert.deepEqual(result.screens, []);
  assert.equal(result.coverage, undefined);
});

test('queries the official regional export endpoint with service-account auth and project ID', async () => {
  let request;
  const data = [event('screen_viewed', { screen_instance_id: 'instance-1' })]
    .map((row) => JSON.stringify(row)).join('\n');
  const result = await collectAniccaScreenAnalytics({
    env: {
      MIXPANEL_SERVICE_ACCOUNT: 'service-user:secret:with-colon',
      MIXPANEL_PROJECT_ID: '3970220',
      MIXPANEL_SERVER: 'data',
      MIXPANEL_APP_ENVIRONMENT: 'production',
    },
    now: new Date('2026-11-07T12:30:00.000Z'),
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options };
      return { ok: true, status: 200, text: async () => data };
    },
  });

  assert.equal(request.url.origin, 'https://data.mixpanel.com');
  assert.equal(request.url.pathname, '/api/2.0/export');
  assert.equal(request.url.searchParams.get('project_id'), '3970220');
  assert.equal(request.url.searchParams.get('from_date'), '2026-10-30');
  assert.equal(request.url.searchParams.get('to_date'), '2026-11-05');
  assert.deepEqual(JSON.parse(request.url.searchParams.get('event')), ['screen_viewed', 'screen_exited']);
  assert.equal(request.options.headers.Authorization, `Basic ${Buffer.from('service-user:secret:with-colon').toString('base64')}`);
  assert.equal(result.app_environment, 'production');
  assert.equal(result.screens[0].viewed_instances, 1);
});

test('collects same-day simulator receipts for preview without changing the production window', async () => {
  let request;
  const data = JSON.stringify(event('screen_viewed', {
    app_environment: 'simulator',
    screen_instance_id: 'simulator-instance',
  }));
  const result = await collectAniccaScreenAnalytics({
    env: {
      MIXPANEL_SERVICE_ACCOUNT: 'service-user:secret',
      MIXPANEL_PROJECT_ID: '3970220',
      MIXPANEL_SERVER: 'data',
      MIXPANEL_APP_ENVIRONMENT: 'simulator',
    },
    now: new Date('2026-11-07T12:30:00.000Z'),
    fetchImpl: async (url) => {
      request = new URL(url);
      return { ok: true, status: 200, text: async () => data };
    },
  });

  assert.equal(request.searchParams.get('from_date'), '2026-11-01');
  assert.equal(request.searchParams.get('to_date'), '2026-11-07');
  assert.equal(result.maturity_hours, 0);
  assert.equal(result.screens[0].viewed_instances, 1);
});
