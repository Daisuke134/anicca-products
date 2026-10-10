const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../../lead-magnet.js');

const CONFIG = {
  SUPABASE_URL: 'https://supabase.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  RESEND_API_KEY: 'resend-test-key',
  RESEND_FROM_EMAIL: 'Anicca <hello@example.test>',
};

function response(status, value) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}

async function withRuntime({ env = {}, fetchImpl }, run) {
  const priorEnv = {};
  for (const name of Object.keys(CONFIG)) {
    priorEnv[name] = process.env[name];
    const value = Object.hasOwn(env, name) ? env[name] : CONFIG[name];
    if (value === undefined || value === '') delete process.env[name];
    else process.env[name] = value;
  }
  const priorFetch = global.fetch;
  global.fetch = fetchImpl;
  try {
    return await run();
  } finally {
    global.fetch = priorFetch;
    for (const [name, value] of Object.entries(priorEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

function event(body = { email: ' Reader@Example.com ', lang: 'jp' }) {
  return { httpMethod: 'POST', body: JSON.stringify(body) };
}

test('missing verified sender fails before any external request', async () => {
  let calls = 0;
  const result = await withRuntime({
    env: { RESEND_FROM_EMAIL: '' },
    fetchImpl: async () => { calls += 1; return response(200, {}); },
  }, () => handler(event()));

  assert.equal(result.statusCode, 503);
  assert.equal(calls, 0);
});

test('subscriber write uses normalized email RPC before sending from configured sender', async () => {
  const calls = [];
  const result = await withRuntime({
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return response(200, { outcome: 'existing', subscriber_id: 'subscriber-1' });
      return response(200, { id: 'email-1' });
    },
  }, () => handler(event()));

  assert.equal(result.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://supabase.example.test/rest/v1/rpc/upsert_ebook_subscriber');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    p_email: 'reader@example.com',
    p_lang: 'jp',
    p_stripe_customer_id: null,
    p_touch_existing: true,
  });
  assert.equal(calls[1].url, 'https://api.resend.com/emails');
  assert.equal(JSON.parse(calls[1].options.body).from, CONFIG.RESEND_FROM_EMAIL);
});

test('subscriber write failure does not send email or expose provider details', async () => {
  let calls = 0;
  const result = await withRuntime({
    fetchImpl: async () => {
      calls += 1;
      return response(500, { message: 'database detail must stay private' });
    },
  }, () => handler(event()));

  assert.equal(result.statusCode, 503);
  assert.equal(calls, 1);
  assert.doesNotMatch(result.body, /database detail/);
});

test('Resend failure returns a generic failure without echoing provider response', async () => {
  let calls = 0;
  const result = await withRuntime({
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return response(200, { outcome: 'created', subscriber_id: 'subscriber-1' });
      return response(422, { message: 'provider detail must stay private' });
    },
  }, () => handler(event()));

  assert.equal(result.statusCode, 502);
  assert.equal(calls, 2);
  assert.doesNotMatch(result.body, /provider detail/);
});
