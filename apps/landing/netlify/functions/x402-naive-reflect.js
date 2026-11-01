// x402 paid endpoint for the Naive agent: one journaling/reflection prompt plus a 2-minute exercise.
// GET /.netlify/functions/x402-naive-reflect?mood=anxious|low|angry|scattered|grateful&lang=en|ja
// Pays $0.005 USDC on Base to the Naive agent wallet (public address only).
const { createSeller } = require('./_x402');

const P = {
  anxious: { en: ['What is one thing within your control in the next hour?', 'Feel your feet on the floor and count 10 slow breaths.'], ja: ['この1時間で自分にコントロールできることは何?', '足裏の感覚を感じながら、ゆっくり10回呼吸する。'] },
  low: { en: ['What small thing went even slightly okay today?', 'Stand up, open a window, and stretch your arms for one minute.'], ja: ['今日、少しでもうまくいった小さなことは?', '立って窓を開け、1分間腕を伸ばす。'] },
  angry: { en: ['What need of yours was not met just now?', 'Write the angry sentence, then rewrite it as a request.'], ja: ['いま満たされなかった自分のニーズは何?', '怒りの一文を書き、それをお願いの形に書き直す。'] },
  scattered: { en: ['If you could finish only one thing today, what would it be?', 'Write every open loop on paper for two minutes, then circle one.'], ja: ['今日1つだけ終えられるなら、何を選ぶ?', '気になることを2分間すべて紙に書き、1つに丸をつける。'] },
  grateful: { en: ['Who made today a little easier, and how could you tell them?', 'Send one person a one-line thank-you.'], ja: ['今日を少し楽にしてくれたのは誰? どう伝えられる?', '誰か1人に一行のありがとうを送る。'] },
};
const MOODS = Object.keys(P);

const seller = createSeller({
  url: 'https://aniccaai.com/.netlify/functions/x402-naive-reflect',
  payTo: '0xB32b13226Fc4601Dd85140cf9815D79d63006ca0',
  price: '5000', // $0.005 USDC
  description: 'Naive agent: one reflection/journaling prompt plus a 2-minute exercise for a given mood, as JSON (en/ja). $0.005 per call.',
  queryParams: {
    mood: { type: 'string', enum: MOODS, description: 'One of: ' + MOODS.join(', ') + ' (default scattered)' },
    lang: { type: 'string', enum: ['en', 'ja'], description: 'en or ja (default en)' },
  },
  queryParamsV1: {
    mood: { type: 'string', required: false, enum: MOODS, description: 'One of: ' + MOODS.join(', ') },
    lang: { type: 'string', required: false, enum: ['en', 'ja'], description: 'en or ja' },
  },
  queryExample: { mood: 'anxious', lang: 'en' },
  outputSchema: {
    type: 'object',
    properties: { mood: { type: 'string' }, lang: { type: 'string' }, prompt: { type: 'string' }, exercise: { type: 'string' }, agent: { type: 'string' } },
    required: ['mood', 'lang', 'prompt', 'exercise', 'agent'],
  },
  outputExample: { mood: 'anxious', lang: 'en', prompt: P.anxious.en[0], exercise: P.anxious.en[1], agent: 'Naive' },
});

function build(q) {
  const mood = P[(q.mood || '').toLowerCase()] ? q.mood.toLowerCase() : 'scattered';
  const lang = q.lang === 'ja' ? 'ja' : 'en';
  const [prompt, exercise] = P[mood][lang];
  return { mood, lang, prompt, exercise, agent: 'Naive' };
}

exports.handler = seller(async (q) => ({ status: 200, body: build(q) }));
exports._test = { build, paymentRequired: seller.paymentRequired };
