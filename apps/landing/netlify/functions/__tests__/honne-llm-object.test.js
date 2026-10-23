const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handle } = require('../honne-llm-object.js');

function memoryStore() {
  const data = new Map();
  return {
    async get(key, opts) {
      const v = data.get(key);
      if (v === undefined) return null;
      return opts && opts.type === 'json' ? structuredClone(v) : v;
    },
    async setJSON(key, value) { data.set(key, structuredClone(value)); },
  };
}

const schema = {
  type: 'object',
  properties: { honne: { type: 'string' }, emotionLevel: { type: 'number' } },
  required: ['honne', 'emotionLevel'],
};

function event(overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { 'x-honne-token': 'app-token', 'x-nf-client-connection-ip': '203.0.113.7' },
    body: JSON.stringify({ messages: [{ role: 'user', content: '分析して' }], schema }),
    ...overrides,
  };
}

const env = { HONNE_LLM_KEY: 'sk-test', HONNE_APP_TOKEN: 'app-token' };

function okFetch(calls) {
  return async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return {
      ok: true,
      status: 200,
      async json() {
        return { choices: [{ message: { content: JSON.stringify({ honne: '本音', emotionLevel: 3 }) } }] };
      },
    };
  };
}

test('returns the Rork-compatible {object} from the model', async () => {
  const calls = [];
  const res = await handle(event(), { env, store: memoryStore(), fetchImpl: okFetch(calls), now: new Date('2026-10-24T00:00:00Z') });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { object: { honne: '本音', emotionLevel: 3 } });
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(calls[0].body.model, 'deepseek/deepseek-v4.1-flash');
  assert.equal(calls[0].body.response_format.type, 'json_schema');
  assert.deepEqual(calls[0].body.response_format.json_schema.schema, schema);
  assert.equal(calls[0].auth, 'Bearer sk-test');
});

test('rejects a missing or wrong app token without calling the model', async () => {
  const calls = [];
  const res = await handle(event({ headers: { 'x-honne-token': 'nope' } }), { env, store: memoryStore(), fetchImpl: okFetch(calls) });
  assert.equal(res.statusCode, 401);
  assert.equal(calls.length, 0);
});

test('fails closed when the key is not configured', async () => {
  const res = await handle(event(), { env: { HONNE_APP_TOKEN: 'app-token' }, store: memoryStore(), fetchImpl: okFetch([]) });
  assert.equal(res.statusCode, 503);
});

test('rejects malformed bodies', async () => {
  const bad = [
    'not json',
    JSON.stringify({ messages: [], schema }),
    JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(8001) }], schema }),
    JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  ];
  for (const body of bad) {
    const res = await handle(event({ body }), { env, store: memoryStore(), fetchImpl: okFetch([]) });
    assert.equal(res.statusCode, 400, body.slice(0, 30));
  }
});

test('enforces the per-IP daily limit and the global daily cap', async () => {
  const store = memoryStore();
  const now = new Date('2026-10-24T00:00:00Z');
  const limits = { perIp: 2, global: 3 };
  for (let i = 0; i < 2; i++) {
    assert.equal((await handle(event(), { env, store, fetchImpl: okFetch([]), now, limits })).statusCode, 200);
  }
  assert.equal((await handle(event(), { env, store, fetchImpl: okFetch([]), now, limits })).statusCode, 429);
  const other = event({ headers: { 'x-honne-token': 'app-token', 'x-nf-client-connection-ip': '198.51.100.9' } });
  assert.equal((await handle(other, { env, store, fetchImpl: okFetch([]), now, limits })).statusCode, 200);
  assert.equal((await handle(other, { env, store, fetchImpl: okFetch([]), now, limits })).statusCode, 429);
});

test('does not store raw IP addresses', async () => {
  const store = memoryStore();
  const now = new Date('2026-10-24T00:00:00Z');
  await handle(event(), { env, store, fetchImpl: okFetch([]), now });
  const day = await store.get('2026-10-24', { type: 'json' });
  assert.ok(!JSON.stringify(day).includes('203.0.113.7'));
});

test('upstream failure maps to 502 without leaking the key', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, async json() { return { error: 'boom sk-test' }; } });
  const res = await handle(event(), { env, store: memoryStore(), fetchImpl });
  assert.equal(res.statusCode, 502);
  assert.ok(!res.body.includes('sk-test'));
});
