// POST /api/honne/llm/object — Rork toolkit-compatible structured-output endpoint for the Honne iOS app.
// Body: { messages: [{ role: 'user', content }], schema }  →  { object }
// The schema and system prompt are pinned here, so the shared app token cannot turn this into a general LLM relay.
// Env: HONNE_LLM_KEY (OpenRouter key), HONNE_APP_TOKEN (shared token the app sends as x-honne-token).
const crypto = require('node:crypto');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-v4.1-flash';
const DEFAULT_LIMITS = { perIp: 30, global: 1000 };
const MAX_CONTENT = 8000;
const MAX_TOKENS = 800;

const SYSTEM_PROMPT = 'You analyse a message for the Honne (本音翻訳AI) app. Reply only with the JSON object described by the schema, in the language of the message. emotionLevel is an integer from 1 (calm) to 5 (very intense).';
const HONNE_SCHEMA = {
  type: 'object',
  properties: {
    honne: { type: 'string' },
    psychologicalState: { type: 'string' },
    suggestedResponse: { type: 'string' },
    emotionLevel: { type: 'integer' },
  },
  required: ['honne', 'psychologicalState', 'suggestedResponse', 'emotionLevel'],
  additionalProperties: false,
};

// ponytail: blob read-modify-write counter, so concurrent requests can overshoot a limit slightly, and quota is
// spent before the upstream call (failures still count). The app token ships inside the IPA, so the quotas are the
// real cost bound: worst case ~1000 calls/day × MAX_TOKENS. Move to per-install attestation if abuse appears.

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
  if (!Array.isArray(messages) || messages.length !== 1) return null;
  const [m] = messages;
  if (!m || m.role !== 'user' || typeof m.content !== 'string' || !m.content || m.content.length > MAX_CONTENT) return null;
  // The app's schema is required for Rork compatibility but never forwarded.
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null;
  return { content: m.content };
}

function validObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ['honne', 'psychologicalState', 'suggestedResponse'].every((k) => typeof value[k] === 'string') &&
    Number.isInteger(value.emotionLevel)
  );
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
        max_tokens: MAX_TOKENS,
        // Reasoning tokens ate the budget and truncated the JSON in a live test; off, each call is ~100-150 tokens.
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: request.content },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'honne', strict: true, schema: HONNE_SCHEMA } },
      }),
    });
  } catch {
    return reply(502, { error: 'upstream_unreachable' });
  }
  if (!upstream.ok) return reply(502, { error: 'upstream_error', status: upstream.status });

  try {
    const data = await upstream.json();
    const object = JSON.parse(data.choices[0].message.content);
    if (!validObject(object)) return reply(502, { error: 'upstream_invalid_output' });
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
