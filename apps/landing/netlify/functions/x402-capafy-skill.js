// x402 paid endpoint: Capafy skill/agent details (Anicca publisher) for agents.
// GET /.netlify/functions/x402-capafy-skill?id=<capafy agent id>
//   no X-PAYMENT -> 402 + x402 v1 PaymentRequirements (accepts[], Bazaar outputSchema)
//   X-PAYMENT    -> PayAI /verify -> lookup -> /settle -> 200 JSON + X-PAYMENT-RESPONSE
// Unknown id after a valid payment returns 404 before settlement, so the buyer is not charged.
// Data: Capafy public read-only API (no login). Seller holds no private key.

const FACILITATOR = 'https://facilitator.payai.network';
const PAY_TO = '0xFdB5e57946546baD5960a1946102306Ffd04aC00';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PRICE_ATOMIC = '5000'; // $0.005 USDC (6 decimals)
const RESOURCE = 'https://aniccaai.com/.netlify/functions/x402-capafy-skill';
const CAPAFY_LIST = 'https://api.capafy.ai/public/developer/agents?slug=Anicca&pageSize=100&pageNo=';
const ID = /^[0-9]{6,20}$/;

const outputSchema = {
  input: {
    type: 'http',
    method: 'GET',
    discoverable: true,
    queryParams: {
      id: { type: 'string', required: true, description: 'Capafy agent id (digits), e.g. 6839055303. Anicca publisher catalog: https://capafy.ai/publisher/Anicca' },
    },
  },
  output: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      model: { type: 'string' },
      agentType: { type: 'string' },
      estimatedExecutionMinutes: { type: 'number' },
      pricing: { type: 'array', items: { type: 'object' } },
      rating: { type: 'number' },
      salesVolume: { type: 'number' },
      url: { type: 'string' },
      buy_link: { type: 'string' },
      source: { type: 'string' },
    },
    required: ['id', 'title', 'description', 'url', 'buy_link', 'source'],
  },
};

function requirements() {
  return {
    scheme: 'exact',
    network: 'base',
    maxAmountRequired: PRICE_ATOMIC,
    resource: RESOURCE,
    description: 'Capafy AI skill/agent details (Anicca publisher) as JSON: title, description, pricing, model, tracked buy link. $0.005 per call.',
    mimeType: 'application/json',
    payTo: PAY_TO,
    maxTimeoutSeconds: 60,
    asset: USDC_BASE,
    outputSchema,
    extra: { name: 'USD Coin', version: '2' },
  };
}

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE', ...headers },
  body: JSON.stringify(body),
});

const challenge = (error) => json(402, { x402Version: 1, error, accepts: [requirements()] });

function shape(a) {
  const c = a.agentCard || {};
  const pricing = (a.billings || []).map((b) => ({
    mode: b.billingMode, cycle: b.cycleType, price: b.cyclePrice ?? b.oneTimeFee ?? b.hourlyPrice, currency: b.currency,
    maxMessages: b.cycleMaxMessageCount ?? b.hourlyMaxMessageCount ?? null,
  }));
  return {
    id: String(a.agentId),
    title: a.title || c.title || '',
    description: c.shortDescription || '',
    tags: String(a.tags || c.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    model: c.model || null,
    agentType: a.agentType || null,
    estimatedExecutionMinutes: c.estimatedExecutionMinutes ?? null,
    pricing,
    rating: a.rating ?? null,
    salesVolume: a.salesVolume ?? null,
    url: `https://capafy.ai/agent/${a.agentId}`,
    buy_link: `https://capafy-skills-daily.netlify.app/go/${a.agentId}/x402/api`,
    source: 'Capafy public API via Anicca',
  };
}

async function lookup(id) {
  for (let p = 1; p <= 5; p++) {
    const r = await fetch(CAPAFY_LIST + p, { headers: { 'User-Agent': 'aniccaai-x402' } });
    const list = ((await r.json()).data || {}).list || [];
    const hit = list.find((a) => String(a.agentId) === id);
    if (hit) return shape(hit);
    if (list.length < 100) return null;
  }
  return null;
}

async function facilitator(path, paymentPayload, paymentRequirements) {
  const r = await fetch(FACILITATOR + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x402Version: 1, paymentPayload, paymentRequirements }),
  });
  return r.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {}, { 'Access-Control-Allow-Headers': 'X-PAYMENT, Content-Type' });
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });
  const h = event.headers || {};
  const header = h['x-payment'] || h['X-PAYMENT'];
  if (!header) return challenge('X-PAYMENT header is required');

  let payload;
  try {
    payload = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
  } catch {
    return challenge('Invalid X-PAYMENT header');
  }
  const id = String((event.queryStringParameters || {}).id || '');
  if (!ID.test(id)) return json(400, { error: 'id must be a Capafy agent id (digits)' });
  const req = requirements();
  try {
    const v = await facilitator('/verify', payload, req);
    if (!v.isValid) return challenge(v.invalidReason || 'payment verification failed');
    const item = await lookup(id);
    if (!item) return json(404, { error: 'Capafy agent not found for publisher Anicca', id });
    const s = await facilitator('/settle', payload, req);
    if (!s.success) return challenge(s.errorReason || 'payment settlement failed');
    const resp = Buffer.from(JSON.stringify(s)).toString('base64');
    return json(200, item, { 'X-PAYMENT-RESPONSE': resp });
  } catch (e) {
    return challenge('facilitator error');
  }
};

exports._test = { requirements, shape, lookup };
