// x402 paid endpoint: Anicca affirmation for agents.
// GET /.netlify/functions/x402-affirm?topic=calm&lang=ja|en
//   no X-PAYMENT -> 402 + x402 v1 PaymentRequirements (accepts[], Bazaar outputSchema)
//   X-PAYMENT    -> PayAI facilitator /verify then /settle -> 200 JSON + X-PAYMENT-RESPONSE
// Seller holds no private key; the facilitator settles the buyer-signed EIP-3009 transfer.

const FACILITATOR = 'https://facilitator.payai.network';
const PAY_TO = '0xFdB5e57946546baD5960a1946102306Ffd04aC00';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PRICE_ATOMIC = '5000'; // $0.005 USDC (6 decimals)
const RESOURCE = 'https://aniccaai.com/.netlify/functions/x402-affirm';

const TOPICS = {
  calm: {
    en: ['I breathe in, I breathe out, and this moment is enough.', 'I let thoughts pass like clouds; I am the sky.', 'Peace is already here, beneath the noise.'],
    ja: ['吸って、吐く。この瞬間だけで、もう十分。', '思考は雲のように流れていく。私は空そのもの。', '静けさは、ざわめきの下にもう在る。'],
  },
  confidence: {
    en: ['I trust myself to handle what comes.', 'My worth does not depend on anyone\'s approval.', 'I am allowed to take up space.'],
    ja: ['何が来ても、私は自分を信じて向き合える。', '私の価値は、誰かの評価で決まらない。', '私はここにいていい。'],
  },
  selflove: {
    en: ['I speak to myself the way I would speak to a friend.', 'I am enough as I am, today.', 'I forgive myself and begin again.'],
    ja: ['大切な友人に話すように、自分に話しかける。', '今日の私のままで、十分。', '自分を許して、もう一度はじめる。'],
  },
  impermanence: {
    en: ['This too shall pass, and I can rest in that.', 'Everything changes; I meet each change with an open heart.', 'Nothing stays, so I hold this moment gently.'],
    ja: ['これもまた過ぎ去る。だから安心していい。', 'すべては移ろう。私は開いた心で変化に出会う。', '何もとどまらない。だからこの瞬間をやさしく抱く。'],
  },
};

const outputSchema = {
  input: {
    type: 'http',
    method: 'GET',
    discoverable: true,
    queryParams: {
      topic: { type: 'string', required: false, description: 'One of: ' + Object.keys(TOPICS).join(', ') + ' (default calm)', enum: Object.keys(TOPICS) },
      lang: { type: 'string', required: false, description: 'ja or en (default en)', enum: ['ja', 'en'] },
    },
  },
  output: {
    type: 'object',
    properties: {
      affirmation: { type: 'string' },
      topic: { type: 'string' },
      lang: { type: 'string' },
      source: { type: 'string' },
    },
    required: ['affirmation', 'topic', 'lang', 'source'],
  },
};

function requirements() {
  return {
    scheme: 'exact',
    network: 'base',
    maxAmountRequired: PRICE_ATOMIC,
    resource: RESOURCE,
    description: 'Anicca daily affirmation (Buddhist-inspired, ja/en) as JSON. $0.005 per call.',
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

function pick(q) {
  const topic = TOPICS[(q.topic || '').toLowerCase()] ? q.topic.toLowerCase() : 'calm';
  const lang = q.lang === 'ja' ? 'ja' : 'en';
  const list = TOPICS[topic][lang];
  return { affirmation: list[Math.floor(Math.random() * list.length)], topic, lang, source: 'Anicca' };
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
  const req = requirements();
  try {
    const v = await facilitator('/verify', payload, req);
    if (!v.isValid) return challenge(v.invalidReason || 'payment verification failed');
    const s = await facilitator('/settle', payload, req);
    if (!s.success) return challenge(s.errorReason || 'payment settlement failed');
    const resp = Buffer.from(JSON.stringify(s)).toString('base64');
    return json(200, pick(event.queryStringParameters || {}), { 'X-PAYMENT-RESPONSE': resp });
  } catch (e) {
    return challenge('facilitator error');
  }
};

exports._test = { requirements, pick };
