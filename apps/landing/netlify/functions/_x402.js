// Shared x402 seller for Anicca Netlify functions.
// 402 challenge = x402 v2 (body + PAYMENT-REQUIRED header, Bazaar `extensions.bazaar`).
// Paid retry: v2 PAYMENT-SIGNATURE header, or legacy v1 X-PAYMENT header (still accepted).
// PayAI facilitator verifies, then settles the buyer-signed EIP-3009 transfer. No private key here.

const FACILITATOR = 'https://facilitator.payai.network';
const PAY_TO = '0xFdB5e57946546baD5960a1946102306Ffd04aC00';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PRICE_ATOMIC = '5000'; // $0.005 USDC (6 decimals)
const EXTRA = { name: 'USD Coin', version: '2' };

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function createSeller(cfg) {
  // cfg: { url, description, queryParams (json-schema props), required, queryExample, outputSchema, outputExample }
  const v2Req = () => ({
    scheme: 'exact', network: 'eip155:8453', amount: PRICE_ATOMIC, asset: USDC_BASE,
    payTo: PAY_TO, maxTimeoutSeconds: 60, extra: EXTRA,
  });
  const v1Req = () => ({
    scheme: 'exact', network: 'base', maxAmountRequired: PRICE_ATOMIC, resource: cfg.url,
    description: cfg.description, mimeType: 'application/json', payTo: PAY_TO, maxTimeoutSeconds: 60,
    asset: USDC_BASE,
    outputSchema: {
      input: { type: 'http', method: 'GET', discoverable: true, queryParams: cfg.queryParamsV1 },
      output: cfg.outputSchema,
    },
    extra: EXTRA,
  });
  const bazaar = () => ({
    info: {
      input: { type: 'http', method: 'GET', queryParams: cfg.queryExample },
      output: { type: 'json', example: cfg.outputExample },
    },
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['input'],
      properties: {
        input: {
          type: 'object', required: ['type', 'method'], additionalProperties: false,
          properties: {
            type: { type: 'string', const: 'http' },
            method: { type: 'string', enum: ['GET'] },
            queryParams: { type: 'object', properties: cfg.queryParams, required: cfg.required || [] },
          },
        },
        output: { type: 'object', required: ['type'], properties: { type: { type: 'string' }, example: cfg.outputSchema } },
      },
    },
  });
  const paymentRequired = (error) => ({
    x402Version: 2,
    error,
    resource: { url: cfg.url, description: cfg.description, mimeType: 'application/json' },
    accepts: [v2Req()],
    extensions: { bazaar: bazaar() },
  });
  const challenge = (error) => {
    const body = paymentRequired(error);
    return json(402, body, { 'PAYMENT-REQUIRED': b64(body) });
  };

  async function facilitator(path, version, paymentPayload, paymentRequirements) {
    const r = await fetch(FACILITATOR + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x402Version: version, paymentPayload, paymentRequirements }),
    });
    return r.json();
  }

  // handle(query) -> { status, body }; status 200 settles, anything else returns without charging.
  const make = function handler(handle) {
    return async (event) => {
      if (event.httpMethod === 'OPTIONS') {
        return json(204, {}, { 'Access-Control-Allow-Headers': 'PAYMENT-SIGNATURE, X-PAYMENT, Content-Type' });
      }
      if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') return json(405, { error: 'GET only' });
      const h = {};
      for (const [k, v] of Object.entries(event.headers || {})) h[k.toLowerCase()] = v;
      const v2Header = h['payment-signature'];
      const v1Header = h['x-payment'];
      if (!v2Header && !v1Header) return challenge('PAYMENT-SIGNATURE header is required');

      let payload;
      try {
        payload = JSON.parse(Buffer.from(v2Header || v1Header, 'base64').toString('utf8'));
      } catch {
        return challenge('Invalid payment header');
      }
      const version = v2Header ? 2 : 1;
      const req = version === 2 ? v2Req() : v1Req();
      try {
        const v = await facilitator('/verify', version, payload, req);
        if (!v.isValid) return challenge(v.invalidReason || 'payment verification failed');
        const out = await handle(event.queryStringParameters || {});
        if (out.status !== 200) return json(out.status, out.body);
        const s = await facilitator('/settle', version, payload, req);
        if (!s.success) return challenge(s.errorReason || 'payment settlement failed');
        const resp = b64(s);
        return json(200, out.body, version === 2 ? { 'PAYMENT-RESPONSE': resp } : { 'X-PAYMENT-RESPONSE': resp });
      } catch (e) {
        return challenge('facilitator error');
      }
    };
  };
  make.paymentRequired = paymentRequired;
  make.v1Req = v1Req;
  return make;
}

module.exports = { createSeller, json, PAY_TO, USDC_BASE, PRICE_ATOMIC };
