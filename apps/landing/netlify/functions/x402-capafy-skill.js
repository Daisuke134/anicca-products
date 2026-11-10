// x402 paid endpoint: Capafy skill/agent details (Anicca publisher) for agents.
// GET /.netlify/functions/x402-capafy-skill?id=<capafy agent id>
//   no X-PAYMENT -> 402 + x402 v1 PaymentRequirements (accepts[], Bazaar outputSchema)
//   X-PAYMENT    -> PayAI /verify -> lookup -> /settle -> 200 JSON + X-PAYMENT-RESPONSE
// Unknown id after a valid payment returns 404 before settlement, so the buyer is not charged.
// Payment handling lives in ./_x402.js. Data: Capafy public read-only API (no login). Seller holds no private key.

const { createSeller } = require('./_x402');

const CAPAFY_LIST = 'https://api.capafy.ai/public/developer/agents?slug=Anicca&pageSize=100&pageNo=';
const ID = /^[0-9]{6,20}$/;

const outputSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } }, model: { type: 'string' }, agentType: { type: 'string' },
    estimatedExecutionMinutes: { type: 'number' }, pricing: { type: 'array', items: { type: 'object' } },
    rating: { type: 'number' }, salesVolume: { type: 'number' }, url: { type: 'string' }, buy_link: { type: 'string' }, source: { type: 'string' },
  },
  required: ['id', 'title', 'description', 'url', 'buy_link', 'source'],
};

const ID_DESC = 'Capafy agent id (digits), e.g. 6839055303. Anicca catalog: https://capafy.ai/publisher/Anicca';
const seller = createSeller({
  url: 'https://aniccaai.com/.netlify/functions/x402-capafy-skill',
  description: 'Capafy AI skill/agent details (Anicca publisher) as JSON: title, description, pricing, model, tracked buy link. $0.005 per call.',
  queryParams: { id: { type: 'string', pattern: '^[0-9]{6,20}$', description: ID_DESC } },
  required: ['id'],
  queryParamsV1: { id: { type: 'string', required: true, description: ID_DESC } },
  queryExample: { id: '6839055303' },
  outputSchema,
  outputExample: {
    id: '6839055303', title: 'Academic Humanizer — Human Voice, No AI Tells', description: 'Rewrite AI-sounding academic drafts in a careful human voice.',
    tags: ['humanizer'], model: 'DeepSeek V4.1 Flash', agentType: 'run_online', estimatedExecutionMinutes: 5,
    pricing: [{ mode: 'subscription', cycle: 'week', price: 9.99, currency: 'usd', maxMessages: 20 }], rating: null, salesVolume: 0,
    url: 'https://capafy.ai/agent/6839055303', buy_link: 'https://capafy-skills-daily.netlify.app/go/6839055303/x402/api', source: 'Capafy public API via Anicca',
  },
});

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

// Unknown id after a valid payment returns 400/404 before settlement, so the buyer is not charged.
exports.handler = seller(async (q) => {
  const id = String(q.id || '');
  if (!ID.test(id)) return { status: 400, body: { error: 'id must be a Capafy agent id (digits)' } };
  const item = await lookup(id);
  if (!item) return { status: 404, body: { error: 'Capafy agent not found for publisher Anicca', id } };
  return { status: 200, body: item };
});

exports._test = { shape, lookup, paymentRequired: seller.paymentRequired };
