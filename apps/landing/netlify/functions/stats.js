// GET /.netlify/functions/stats — aggregate site counters (no personal data).
// If STATS_KEY env is set, require ?key=…; otherwise return public aggregates.
const { connectLambda, getStore } = require('@netlify/blobs');
const { loadCounters, publicStats } = require('./_lib/site-hit-store');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

function openStore(event, getStoreImpl, connectImpl) {
  try {
    connectImpl(event);
  } catch {
    // ignore — getStore will throw if context is still missing
  }
  return getStoreImpl('site-stats');
}

async function statsHandler(event, dependencies = {}) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: 'method not allowed' };
  }

  const env = dependencies.env || process.env;
  const requiredKey = typeof env.STATS_KEY === 'string' ? env.STATS_KEY.trim() : '';
  if (requiredKey) {
    const provided = (event.queryStringParameters && event.queryStringParameters.key) || '';
    if (provided !== requiredKey) {
      return {
        statusCode: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'unauthorized' }),
      };
    }
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

  const state = await loadCounters(store);
  const body = publicStats(state);
  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, ...body }),
  };
}

exports.statsHandler = statsHandler;
exports.handler = (event) => statsHandler(event);
