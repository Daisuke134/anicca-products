// POST|GET /.netlify/functions/hit — cookieless pageview / named-event counter.
// Body or query: { t: 'pageview'|'event', path, event?, type?, utm_source?, utm_campaign?, ref?, ct? }
const { connectLambda, getStore } = require('@netlify/blobs');
const { recordHit } = require('./_lib/site-hit-store');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return Object.fromEntries(new URLSearchParams(raw));
    } catch {
      return {};
    }
  }
}

function parseInput(event) {
  const q = event.queryStringParameters || {};
  const body = event.httpMethod === 'POST' ? parseBody(event) : {};
  return { ...q, ...body };
}

function openStore(event, getStoreImpl, connectImpl) {
  // Classic Netlify Functions need connectLambda to hydrate Blobs credentials from event.blobs.
  try {
    connectImpl(event);
  } catch {
    // ignore — getStore will throw a clearer error if context is still missing
  }
  return getStoreImpl('site-stats');
}

async function hitHandler(event, dependencies = {}) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'method not allowed' };
  }

  const getStoreImpl = dependencies.getStore || getStore;
  const connectImpl = dependencies.connectLambda || connectLambda;
  let store;
  try {
    store = openStore(event, getStoreImpl, connectImpl);
  } catch {
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'blobs_unavailable' }),
    };
  }

  const result = await recordHit(store, parseInput(event));
  if (!result.ok) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: result.reason }),
    };
  }
  return {
    statusCode: 204,
    headers: CORS,
    body: '',
  };
}

exports.hitHandler = hitHandler;
exports.handler = (event) => hitHandler(event);
