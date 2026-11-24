// Shared x402 seller for Anicca Netlify functions.
// 402 challenge = x402 v2 (body + PAYMENT-REQUIRED header, Bazaar `extensions.bazaar`).
// Paid retry: v2 PAYMENT-SIGNATURE header, or legacy v1 X-PAYMENT header (still accepted).
// Facilitator verifies, then settles the buyer-signed EIP-3009 transfer. No private key here.
// With CDP_API_KEY_ID + CDP_API_KEY_SECRET set, verify/settle go through Coinbase's CDP facilitator
// (createFacilitatorConfig from @coinbase/x402), which is what indexes the endpoint in the CDP
// x402 Bazaar after a settled payment. Without the keys we fall back to PayAI so nothing breaks.

const PAYAI_FACILITATOR = 'https://facilitator.payai.network';
const PAY_TO = '0x7E8b13B7c080465903874352887656314A267E3c';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PRICE_ATOMIC = '5000'; // $0.005 USDC (6 decimals)
const EXTRA = { name: 'USD Coin', version: '2' };

// Resolved once per cold start. Keys come only from env; never logged.
let facilitatorPromise;
function facilitatorConfig() {
  if (!facilitatorPromise) {
    facilitatorPromise = (async () => {
      const id = process.env.CDP_API_KEY_ID;
      const secret = process.env.CDP_API_KEY_SECRET;
      if (id && secret) {
        const { createFacilitatorConfig } = await import('@coinbase/x402');
        const config = createFacilitatorConfig(id, secret);
        return { name: 'cdp', url: config.url, createAuthHeaders: config.createAuthHeaders };
      }
      return { name: 'payai', url: PAYAI_FACILITATOR };
    })().catch((e) => { facilitatorPromise = undefined; throw e; });
  }
  return facilitatorPromise;
}

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
  const payTo = cfg.payTo || PAY_TO;
  const price = cfg.price || PRICE_ATOMIC;
  // cfg: { url, payTo?, price? (atomic USDC), description, queryParams (json-schema props), required, queryExample, outputSchema, outputExample }
  const v2Req = () => ({
    scheme: 'exact', network: 'eip155:8453', amount: price, asset: USDC_BASE,
    payTo, maxTimeoutSeconds: 60, extra: EXTRA,
    // Not required by the v2 spec, but x402scan and other indexers read these from accepts[].
    description: cfg.description, mimeType: 'application/json',
  });
  const v1Req = () => ({
    scheme: 'exact', network: 'base', maxAmountRequired: price, resource: cfg.url,
    description: cfg.description, mimeType: 'application/json', payTo, maxTimeoutSeconds: 60,
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
    const fc = await facilitatorConfig();
    let authHeaders = {};
    if (fc.createAuthHeaders) {
      const all = await fc.createAuthHeaders();
      authHeaders = all[path.replace('/', '')] || {};
    }
    const r = await fetch(fc.url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      if (version === 2 && payload && typeof payload === 'object') {
        // CDP Bazaar indexes on settle only when the payload carries resource + extensions.bazaar.
        // Standard v2 clients echo them from the 402; fill them in for clients that don't.
        const pr = paymentRequired();
        if (!payload.resource) payload.resource = pr.resource;
        payload.extensions = { ...pr.extensions, ...(payload.extensions || {}) };
      }
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

module.exports = { createSeller, json, facilitatorConfig, PAYAI_FACILITATOR, PAY_TO, USDC_BASE, PRICE_ATOMIC };
