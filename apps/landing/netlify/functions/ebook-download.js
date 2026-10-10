// GET ?session_id=cs_…&format=pdf|md|html|css
// Streams paid Anicca Reset ebook files only when Stripe Checkout session is
// complete + paid + product=ebook (legacy: missing product + payment mode).
const fs = require('node:fs');
const path = require('node:path');

const SESSION_ID = /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/;
const FORMATS = new Set(['pdf', 'md', 'html', 'css']);

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  md: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
};

function forbidden() {
  return {
    statusCode: 403,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ error: 'forbidden' }),
  };
}

function badRequest(message) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ error: message }),
  };
}

function resolveFile({ lang, format }) {
  if (format === 'css') {
    return {
      fileName: 'book.css',
      absolutePath: path.join(__dirname, '../../private/ebooks/book.css'),
      downloadName: 'book.css',
    };
  }
  const stem = lang === 'jp' ? 'anicca-reset-jp' : 'anicca-reset-en';
  const fileName = `${stem}.${format}`;
  return {
    fileName,
    absolutePath: path.join(__dirname, '../../private/ebooks', fileName),
    downloadName: fileName,
  };
}

function isPaidEbookSession(session, liveMode) {
  if (!session || session.status !== 'complete' || session.payment_status !== 'paid') return false;
  if (session.livemode !== liveMode) return false;
  const meta = session.metadata || {};
  const product = meta.product;
  if (product === 'ebook') return true;
  // Legacy checkouts omitted metadata.product; webhook treats those as ebook.
  if (!product && session.mode === 'payment') return true;
  return false;
}

function sessionLang(session) {
  return session && session.metadata && session.metadata.lang === 'jp' ? 'jp' : 'en';
}

function rewriteHtmlCssLinks(html, sessionId) {
  const cssUrl = `/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=css`;
  return html.replace(/(href=["'])book\.css(["'])/g, `$1${cssUrl}$2`);
}

async function ebookDownloadHandler(event, dependencies = {}) {
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
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'method not allowed' };
  }

  const env = dependencies.env || process.env;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const liveMode = typeof dependencies.liveMode === 'boolean'
    ? dependencies.liveMode
    : Boolean(STRIPE_KEY && STRIPE_KEY.startsWith('sk_live_'));

  const query = event.queryStringParameters || {};
  const sessionId = query.session_id;
  const format = (query.format || 'pdf').toLowerCase();

  if (!sessionId || !SESSION_ID.test(sessionId)) return badRequest('invalid session_id');
  if (!FORMATS.has(format)) return badRequest('invalid format');
  if (!STRIPE_KEY && !dependencies.retrieveSession) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'stripe not configured' }),
    };
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
  } catch {
    return forbidden();
  }

  if (!isPaidEbookSession(session, liveMode)) return forbidden();

  const lang = sessionLang(session);
  const { absolutePath, downloadName } = resolveFile({ lang, format });
  const readFile = dependencies.readFile || ((p) => fs.readFileSync(p));

  let bytes;
  try {
    bytes = readFile(absolutePath);
  } catch {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'file unavailable' }),
    };
  }

  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);

  if (format === 'html') {
    const rewritten = rewriteHtmlCssLinks(bytes.toString('utf8'), sessionId);
    bytes = Buffer.from(rewritten, 'utf8');
  }

  const dispositionType = format === 'html' || format === 'css' ? 'inline' : 'attachment';
  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      'Content-Type': CONTENT_TYPES[format],
      'Content-Disposition': `${dispositionType}; filename="${downloadName}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
    body: bytes.toString('base64'),
  };
}

function ebookDownloadUrl(sessionId, { origin = 'https://aniccaai.com', format = 'pdf' } = {}) {
  const base = String(origin || 'https://aniccaai.com').replace(/\/$/, '');
  return `${base}/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=${format}`;
}

exports.ebookDownloadHandler = ebookDownloadHandler;
exports.ebookDownloadUrl = ebookDownloadUrl;
exports.isPaidEbookSession = isPaidEbookSession;
exports.handler = (event) => ebookDownloadHandler(event);
