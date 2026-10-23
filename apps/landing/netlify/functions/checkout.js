// Stripe Checkout Session creator.
// Legacy: POST { lang: 'en' | 'jp', mode?, product?: 'ebook' | 'letter' }
// Writer: POST { product, slug, artifact_id, run_id, lang, client_reference_id }
// Returns { url } for Stripe-hosted Checkout. Raw payment data never enters us.
const { buildWriterCheckout, loadWriterArticle } = require('./_lib/writer-checkout.js');
const { isAttributionTokenForLang } = require('../../lib/checkout-attribution.cjs');

const { AI_MONK_BOOK_PRODUCT, getAiMonkBook } = require('./_lib/ai-monk-books.js');

const STRIPE_API_VERSION = '2026-04-22.dahlia';

async function checkoutHandler(event, dependencies = {}) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' };
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'bad json' };
  }

  const env = dependencies.env || process.env;
  const fetchImpl = dependencies.fetchImpl || fetch;
  const stripeKey = env.STRIPE_SECRET_KEY;
  const isWriter = body.product === 'writer_article' || body.product === 'writer_archive';
  const isAiMonkBook = body.product === AI_MONK_BOOK_PRODUCT;
  let params;

  if (isWriter) {
    if (!stripeKey) return { statusCode: 500, body: 'missing config' };
    try {
      params = buildWriterCheckout({
        request: body,
        env,
        lookupArticle: dependencies.lookupArticle || loadWriterArticle,
        origin: dependencies.publicOrigin || env.WRITER_PUBLIC_ORIGIN || 'https://aniccaai.com',
      });
    } catch (error) {
      if (/missing Writer Price|public origin/.test(String(error && error.message))) {
        return { statusCode: 500, body: 'missing config' };
      }
      return { statusCode: 400, body: 'invalid Writer checkout' };
    }
  } else if (isAiMonkBook) {
    const book = getAiMonkBook(body.lang);
    if (!book || (body.mode && body.mode !== 'payment')) {
      return { statusCode: 400, body: 'invalid book edition or payment mode' };
    }
    if (!stripeKey || !book.stripe_price_id) return { statusCode: 500, body: 'missing config' };
    const destination = `https://aniccaai.com/${book.slug}`;
    params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price]': book.stripe_price_id,
      'line_items[0][quantity]': '1',
      success_url: `${destination}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${destination}?canceled=1`,
      'metadata[product]': book.product,
      'metadata[book_sku]': book.sku,
      'metadata[lang]': book.language,
      customer_creation: 'always',
    });
  } else {
    const lang = body.lang === 'jp' ? 'jp' : 'en';
    const mode = body.mode === 'subscription' ? 'subscription' : 'payment';
    const product = body.product === 'letter' ? 'letter' : 'ebook';
    const attributionToken = isAttributionTokenForLang(body.attribution_token, lang)
      ? body.attribution_token
      : null;
    const price = product === 'letter'
      ? (lang === 'jp' ? env.STRIPE_LETTER_JP_PRICE : env.STRIPE_LETTER_EN_PRICE)
      : (lang === 'jp' ? env.STRIPE_JP_PRICE_ID : env.STRIPE_EN_PRICE_ID);
    const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || 'https://aniccaai.com';

    if (!stripeKey || !price) return { statusCode: 500, body: 'missing config' };
    const productSlug = product === 'letter'
      ? (lang === 'jp' ? 'tegami' : 'letter')
      : (lang === 'jp' ? 'achan' : 'monk');

    params = new URLSearchParams();
    params.append('mode', mode);
    params.append('line_items[0][price]', price);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${origin}/${productSlug}?success=1&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/${productSlug}?canceled=1`);
    params.append('metadata[lang]', lang);
    params.append('metadata[product]', product);
    if (attributionToken) params.append('metadata[attribution_token]', attributionToken);
    if (mode === 'payment') params.append('customer_creation', 'always');
    if (mode === 'subscription') {
      params.append('subscription_data[metadata][lang]', lang);
      params.append('subscription_data[metadata][product]', product);
      if (attributionToken) {
        params.append('subscription_data[metadata][attribution_token]', attributionToken);
      }
      params.append('subscription_data[trial_period_days]', '14');
    }
  }

  const headers = {
    Authorization: 'Basic ' + Buffer.from(stripeKey + ':').toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (isWriter || isAiMonkBook) headers['Stripe-Version'] = STRIPE_API_VERSION;
  const stripeResponse = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers,
    body: params.toString(),
  });
  const data = await stripeResponse.json();
  if (!stripeResponse.ok) {
    if (isAiMonkBook) return { statusCode: 502, body: 'checkout unavailable' };
    return { statusCode: stripeResponse.status, body: JSON.stringify(data) };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: data.url }),
  };
}

exports.checkoutHandler = checkoutHandler;
exports.handler = (event) => checkoutHandler(event);
