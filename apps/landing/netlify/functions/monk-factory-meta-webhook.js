const { createHmac, timingSafeEqual } = require('node:crypto');

function response(statusCode, body = '') {
  return { statusCode, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }, body };
}

function header(event, wanted) {
  const name = Object.keys(event.headers || {}).find(key => key.toLowerCase() === wanted.toLowerCase());
  return name ? event.headers[name] : undefined;
}

function webhookResult(event, dependencies = {}) {
  const env = dependencies.env || process.env;
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    if (!env.MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN) return response(503);
    if (params['hub.mode'] !== 'subscribe' || params['hub.verify_token'] !== env.MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN
      || typeof params['hub.challenge'] !== 'string' || params['hub.challenge'].length > 2048) return response(403);
    return response(200, params['hub.challenge']);
  }
  if (event.httpMethod !== 'POST') return { ...response(405), headers: { ...response(405).headers, Allow: 'GET, POST' } };
  if (!env.MONK_FACTORY_META_APP_SECRET) return response(503);
  const supplied = header(event, 'x-hub-signature-256');
  if (typeof supplied !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(supplied)) return response(403);
  let body;
  try {
    body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'utf8');
    const expected = createHmac('sha256', env.MONK_FACTORY_META_APP_SECRET).update(body).digest();
    const received = Buffer.from(supplied.slice('sha256='.length), 'hex');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return response(403);
  } catch { return response(403); }
  return response(200, 'EVENT_RECEIVED');
}

exports.webhookResult = webhookResult;
exports.handler = event => webhookResult(event);
