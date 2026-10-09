// Mind Habits / 心のクセ report — Stripe Checkout (inline price_data)
// JP: JPY ¥480 · EN: USD $4.99 — metadata.product always kokoro_report
const {
  isValidType,
  isValidScoreString,
  REPORTS,
  REPORTS_EN,
} = require('./_lib/kokoro-report-content.js');
const { isAttributionTokenForLang } = require('../../lib/checkout-attribution.cjs');

const PRICE_JPY = 480;
const PRICE_USD_CENTS = 499;
const ORIGIN_DEFAULT = 'https://aniccaai.com';

async function kokoroCheckoutHandler(event, dependencies = {}) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' };

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'bad json' };
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const s = typeof body.s === 'string' ? body.s : '';
  const lang = body.lang === 'en' ? 'en' : 'jp';
  if (!isValidType(type) || !isValidScoreString(s)) {
    return { statusCode: 400, body: 'invalid type or s' };
  }

  const env = dependencies.env || process.env;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) return { statusCode: 500, body: 'stripe not configured' };

  const fetchImpl = dependencies.fetchImpl || fetch;
  const proto = (event.headers && (event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto'])) || 'https';
  const host = (event.headers && (event.headers.host || event.headers.Host)) || 'aniccaai.com';
  const origin = dependencies.publicOrigin
    || (event.headers && (event.headers.origin || event.headers.Origin))
    || `${proto}://${host}`
    || ORIGIN_DEFAULT;

  const typeName = lang === 'en' ? REPORTS_EN[type].name : REPORTS[type].name;
  const attributionToken = isAttributionTokenForLang(body.attribution_token, lang)
    ? body.attribution_token
    : null;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('locale', lang === 'en' ? 'en' : 'ja');
  params.append('payment_method_types[0]', 'card');
  if (lang === 'en') {
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(PRICE_USD_CENTS));
    params.append(
      'line_items[0][price_data][product_data][name]',
      `Mind Habits Field Guide (${typeName})`,
    );
    params.append(
      'success_url',
      `${origin}/affirmation-app/en/quiz/report?session_id={CHECKOUT_SESSION_ID}`,
    );
    params.append(
      'cancel_url',
      `${origin}/affirmation-app/en/quiz/${encodeURIComponent(type)}?s=${encodeURIComponent(s)}`,
    );
  } else {
    params.append('line_items[0][price_data][currency]', 'jpy');
    params.append('line_items[0][price_data][unit_amount]', String(PRICE_JPY));
    params.append(
      'line_items[0][price_data][product_data][name]',
      `心のクセ・取扱説明書（${typeName}）`,
    );
    params.append(
      'success_url',
      `${origin}/affirmation-app/ja/shindan/report?session_id={CHECKOUT_SESSION_ID}`,
    );
    params.append(
      'cancel_url',
      `${origin}/affirmation-app/ja/shindan/${encodeURIComponent(type)}?s=${encodeURIComponent(s)}`,
    );
  }
  params.append('line_items[0][quantity]', '1');
  params.append('metadata[product]', 'kokoro_report');
  params.append('metadata[type]', type);
  params.append('metadata[s]', s);
  params.append('metadata[lang]', lang);
  if (attributionToken) params.append('metadata[attribution_token]', attributionToken);
  params.append('customer_creation', 'always');

  let session;
  try {
    const r = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    session = await r.json();
    if (!r.ok || !session?.url) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'stripe failure', detail: session }),
      };
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'stripe network', detail: String(e) }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: session.url, session_id: session.id }),
  };
}

exports.kokoroCheckoutHandler = kokoroCheckoutHandler;
exports.handler = (event) => kokoroCheckoutHandler(event);
exports.PRICE_JPY = PRICE_JPY;
exports.PRICE_USD_CENTS = PRICE_USD_CENTS;
