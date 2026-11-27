const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handle, normalize, welcomeHtml } = require('../lm-newsletter-signup.js');

function memoryStore() {
  const data = new Map();
  return {
    async setJSON(key, value) {
      data.set(key, structuredClone(value));
    },
    async get(key, opts) {
      if (!data.has(key)) return null;
      const value = data.get(key);
      return opts && opts.type === 'json' ? structuredClone(value) : value;
    },
    async list({ prefix }) {
      return {
        blobs: Array.from(data.keys())
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ key })),
      };
    },
    size() {
      return data.size;
    },
    keys() {
      return Array.from(data.keys());
    },
    entries() {
      return Array.from(data.entries());
    },
  };
}

function deps(store) {
  return { getStore: () => store, connectLambda: () => {} };
}

function post(body) {
  return { httpMethod: 'POST', body: JSON.stringify(body) };
}

const GOOD = {
  email: 'Reader@Example.com',
  lang: 'ja',
  interests: ['voice', 'testing'],
  device: 'phone',
};

test('normalize trims and lowercases the address, keeps only allowlisted interests', () => {
  const result = normalize({ ...GOOD, interests: ['voice', 'nope', 'voice'] });
  assert.equal(result.ok, true);
  assert.equal(result.record.email, 'reader@example.com');
  assert.deepEqual(result.record.interests, ['voice']);
  assert.equal(result.record.lang, 'ja');
  assert.equal(result.record.device, 'phone');
  assert.match(result.record.receipt, /^[0-9a-f]{16}$/);
});

test('normalize rejects a bad address, unknown language and unknown device', () => {
  assert.equal(normalize({ ...GOOD, email: 'nope' }).error, 'invalid_email');
  assert.equal(normalize({ ...GOOD, lang: 'fr' }).error, 'invalid_lang');
  assert.equal(normalize({ ...GOOD, device: 'desktop' }).error, 'invalid_device');
});

test('POST stores the subscriber in blobs and answers with a receipt', async () => {
  const store = memoryStore();
  const response = await handle(post(GOOD), deps(store));
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.equal(body.stored.blobs, true);
  assert.equal(body.duplicate, false);
  const subscriberKey = store.keys().find((key) => key.startsWith('subscribers/'));
  assert.match(subscriberKey, /^subscribers\/[0-9a-f]{64}\.json$/);
  const value = await store.get(subscriberKey, { type: 'json' });
  assert.equal(value.email, 'reader@example.com');
  assert.deepEqual(value.interests, ['voice', 'testing']);
  assert.ok(store.keys().includes('index/summary.json'));
});

test('the same address does not create a second record', async () => {
  const store = memoryStore();
  await handle(post(GOOD), deps(store));
  const second = await handle(post({ ...GOOD, lang: 'en' }), deps(store));
  const body = JSON.parse(second.body);
  assert.equal(body.duplicate, true);
  assert.equal(
    store.keys().filter((key) => key.startsWith('subscribers/')).length,
    1,
  );
  assert.equal((await store.get('index/summary.json', { type: 'json' })).count, 1);
});

test('a filled honeypot is acknowledged but stores nothing', async () => {
  const store = memoryStore();
  const response = await handle(post({ ...GOOD, company: 'acme' }), deps(store));
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).receipt, 'ignored');
  assert.equal(store.size(), 0);
});

test('an invalid POST is a 400 and stores nothing', async () => {
  const store = memoryStore();
  const response = await handle(post({ ...GOOD, email: 'nope' }), deps(store));
  assert.equal(response.statusCode, 400);
  assert.equal(store.size(), 0);
});

test('an unavailable store is reported instead of a false success', async () => {
  const response = await handle(post(GOOD), {
    getStore: () => {
      throw new Error('no context');
    },
    connectLambda: () => {},
  });
  assert.equal(response.statusCode, 503);
});

test('GET ?action=count returns the stored count and nothing else', async () => {
  const store = memoryStore();
  await handle(post(GOOD), deps(store));
  const response = await handle(
    { httpMethod: 'GET', queryStringParameters: { action: 'count' } },
    deps(store),
  );
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.equal(body.count, 1);
  assert.equal(Object.keys(body).sort().join(','), 'count,ok');
});

test('GET without the count action is a 400', async () => {
  const response = await handle({ httpMethod: 'GET', queryStringParameters: {} }, deps(memoryStore()));
  assert.equal(response.statusCode, 400);
});

test('welcome email exists in all three languages and in no other', () => {
  for (const lang of ['ja', 'en', 'es']) {
    const mail = welcomeHtml(lang, 'reader@example.com');
    assert.ok(mail && mail.subject && mail.html.includes('reader@example.com'));
  }
  assert.equal(welcomeHtml('fr', 'reader@example.com'), null);
});
