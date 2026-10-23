// POST /api/honne/llm/object — Rork toolkit-compatible structured-output endpoint for the Honne iOS app.
// Body: { messages: [{ role, content }], schema }  →  { object }
// Env: HONNE_LLM_KEY (OpenRouter key), HONNE_APP_TOKEN (shared token the app sends as x-honne-token).
const crypto = require('node:crypto');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-v4.1-flash';
const DEFAULT_LIMITS = { perIp: 30, global: 1000 };
const MAX_MESSAGES = 4;
const MAX_CONTENT = 8000;

// ponytail: blob read-modify-write counter, so concurrent requests can overshoot a limit slightly.
// Move to an atomic store if abuse ever matters.

function reply(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

function header(event, name) {
  const headers = event.headers || {};
  return headers[name] ?? headers[name.toLowerCase()] ?? '';
}

function tokenMatches(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseRequest(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  const { messages, schema } = body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const valid = messages.every(
    (m) => m && ['user', 'system', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.length <= MAX_CONTENT,
  );
  if (!valid || !schema || typeof schema !== 'object' || Array.isArray(schema)) return null;
  return { messages: messages.map(({ role, content }) => ({ role, content })), schema };
}

async function takeQuota(store, ip, now, limits) {
  const day = now.toISOString().slice(0, 10);
  const ipKey = crypto.createHash('sha256').update(`${day}:${ip}`).digest('hex').slice(0, 16);
  const state = (await store.get(day, { type: 'json' })) || { total: 0, ips: {} };
  if (state.total >= limits.global || (state.ips[ipKey] || 0) >= limits.perIp) return false;
  state.total += 1;
  state.ips[ipKey] = (state.ips[ipKey] || 0) + 1;
  await store.setJSON(day, state);
  return true;
}

async function handle(event, { env = process.env, store, fetchImpl = fetch, now = new Date(), limits = DEFAULT_LIMITS } = {}) {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'method_not_allowed' });
  if (!env.HONNE_LLM_KEY || !env.HONNE_APP_TOKEN) return reply(503, { error: 'not_configured' });
  if (!tokenMatches(header(event, 'x-honne-token'), env.HONNE_APP_TOKEN)) return reply(401, { error: 'unauthorized' });

  const request = parseRequest(event);
  if (!request) return reply(400, { error: 'invalid_request' });

  const ip = header(event, 'x-nf-client-connection-ip') || 'unknown';
  if (!(await takeQuota(store, ip, now, limits))) return reply(429, { error: 'rate_limited' });

  let upstream;
  try {
    upstream = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.HONNE_LLM_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: request.messages,
        response_format: { type: 'json_schema', json_schema: { name: 'object', strict: true, schema: request.schema } },
      }),
    });
  } catch {
    return reply(502, { error: 'upstream_unreachable' });
  }
  if (!upstream.ok) return reply(502, { error: 'upstream_error', status: upstream.status });

  try {
    const data = await upstream.json();
    const object = JSON.parse(data.choices[0].message.content);
    return reply(200, { object });
  } catch {
    return reply(502, { error: 'upstream_invalid_output' });
  }
}

exports.handle = handle;

exports.handler = async (event) => {
  const { connectLambda, getStore } = require('@netlify/blobs');
  try {
    connectLambda(event);
  } catch {
    // getStore below reports the missing Blobs context
  }
  return handle(event, { store: getStore('honne-llm-quota') });
};
