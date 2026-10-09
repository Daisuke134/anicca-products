// GET ?session_id=cs_… — paid report body only when Stripe session is complete+paid+kokoro_report
const { buildKokoroReport } = require('./_lib/kokoro-report-content.js');

const SESSION_ID = /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(payload),
  };
}

async function kokoroReportHandler(event, dependencies = {}) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }
  if (event.httpMethod !== 'GET') return json(405, { error: 'method not allowed' });

  const env = dependencies.env || process.env;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const liveMode = typeof dependencies.liveMode === 'boolean'
    ? dependencies.liveMode
    : Boolean(STRIPE_KEY && STRIPE_KEY.startsWith('sk_live_'));

  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;
  if (!sessionId || !SESSION_ID.test(sessionId)) {
    return json(400, { error: 'invalid session_id' });
  }
  if (!STRIPE_KEY && !dependencies.retrieveSession) {
    return json(500, { error: 'stripe not configured' });
  }

  const fetchImpl = dependencies.fetchImpl || fetch;
  const retrieveSession = dependencies.retrieveSession || (async (id) => {
    const r = await fetchImpl(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${STRIPE_KEY}` } },
    );
    if (!r.ok) {
      const err = new Error('stripe retrieve failed');
      err.status = r.status;
      throw err;
    }
    return r.json();
  });

  let session;
  try {
    session = await retrieveSession(sessionId);
  } catch (e) {
    if (e && e.status === 404) return json(403, { error: 'forbidden' });
    return json(403, { error: 'forbidden' });
  }

  const meta = (session && session.metadata) || {};
  const ok =
    session
    && session.status === 'complete'
    && session.payment_status === 'paid'
    && meta.product === 'kokoro_report'
    && session.livemode === liveMode
    && typeof meta.type === 'string'
    && typeof meta.s === 'string';

  if (!ok) return json(403, { error: 'forbidden' });

  try {
    const report = buildKokoroReport({ type: meta.type, s: meta.s });
    return json(200, report);
  } catch {
    return json(403, { error: 'forbidden' });
  }
}

exports.kokoroReportHandler = kokoroReportHandler;
exports.handler = (event) => kokoroReportHandler(event);
