// x402 paid endpoint: Anicca affirmation for agents.
// GET /.netlify/functions/x402-affirm?topic=calm&lang=ja|en
//   unpaid -> 402 x402 v2 challenge (accepts[], Bazaar extensions); paid -> 200 JSON.
// Payment handling lives in ./_x402.js (PayAI facilitator; no private key here).

const { createSeller } = require('./_x402');

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

const seller = createSeller({
  url: 'https://aniccaai.com/.netlify/functions/x402-affirm',
  description: 'Anicca daily affirmation (Buddhist-inspired, ja/en) as JSON. $0.005 per call.',
  queryParams: {
    topic: { type: 'string', enum: Object.keys(TOPICS), description: 'One of: ' + Object.keys(TOPICS).join(', ') + ' (default calm)' },
    lang: { type: 'string', enum: ['ja', 'en'], description: 'ja or en (default en)' },
  },
  queryParamsV1: {
    topic: { type: 'string', required: false, description: 'One of: ' + Object.keys(TOPICS).join(', ') + ' (default calm)', enum: Object.keys(TOPICS) },
    lang: { type: 'string', required: false, description: 'ja or en (default en)', enum: ['ja', 'en'] },
  },
  queryExample: { topic: 'calm', lang: 'en' },
  outputSchema: {
    type: 'object',
    properties: { affirmation: { type: 'string' }, topic: { type: 'string' }, lang: { type: 'string' }, source: { type: 'string' } },
    required: ['affirmation', 'topic', 'lang', 'source'],
  },
  outputExample: { affirmation: 'I breathe in, I breathe out, and this moment is enough.', topic: 'calm', lang: 'en', source: 'Anicca' },
});

function pick(q) {
  const topic = TOPICS[(q.topic || '').toLowerCase()] ? q.topic.toLowerCase() : 'calm';
  const lang = q.lang === 'ja' ? 'ja' : 'en';
  const list = TOPICS[topic][lang];
  return { affirmation: list[Math.floor(Math.random() * list.length)], topic, lang, source: 'Anicca' };
}

exports.handler = seller(async (q) => ({ status: 200, body: pick(q) }));
exports._test = { pick, paymentRequired: seller.paymentRequired };
