const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hitHandler } = require('../hit.js');
const { statsHandler } = require('../stats.js');

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

test('hit records pageview and stats returns aggregates', async () => {
  const store = memoryStore();
  const getStore = () => store;

  const hit = await hitHandler(
    {
      httpMethod: 'POST',
      body: JSON.stringify({
        t: 'pageview',
        path: '/affirmation-app/ja/shindan',
        utm_source: 'x',
      }),
    },
    { getStore },
  );
  assert.equal(hit.statusCode, 204);

  await hitHandler(
    {
      httpMethod: 'GET',
      queryStringParameters: { t: 'event', event: 'quiz_start' },
    },
    { getStore },
  );

  const stats = await statsHandler(
    { httpMethod: 'GET', queryStringParameters: {} },
    { getStore, env: {} },
  );
  assert.equal(stats.statusCode, 200);
  const body = JSON.parse(stats.body);
  assert.equal(body.ok, true);
  assert.equal(body.total_pageviews, 1);
  assert.equal(body.events.quiz_start, 1);
  assert.equal(body.paths['/affirmation-app/ja/shindan'].utm_source.x, 1);
});

test('stats requires key when STATS_KEY is set', async () => {
  const store = memoryStore({
    total_pageviews: 3,
    paths: {},
    events: {},
    updated_at: '2026-01-01T00:00:00.000Z',
  });
  const denied = await statsHandler(
    { httpMethod: 'GET', queryStringParameters: {} },
    { getStore: () => store, env: { STATS_KEY: 'secret' } },
  );
  assert.equal(denied.statusCode, 401);

  const ok = await statsHandler(
    { httpMethod: 'GET', queryStringParameters: { key: 'secret' } },
    { getStore: () => store, env: { STATS_KEY: 'secret' } },
  );
  assert.equal(ok.statusCode, 200);
  assert.equal(JSON.parse(ok.body).total_pageviews, 3);
});
