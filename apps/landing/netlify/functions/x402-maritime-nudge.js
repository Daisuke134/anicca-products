// x402 paid endpoint for the Maritime agent: one behavior-change nudge + 3-step habit plan.
// GET /.netlify/functions/x402-maritime-nudge?goal=sleep|exercise|focus|phone|stress&lang=en|ja
// Pays $0.005 USDC on Base to the Maritime agent wallet (public address only).
const { createSeller } = require('./_x402');

const PLANS = {
  sleep: { en: ['Put your phone outside the bedroom tonight.', ['Set a fixed lights-out time', 'No screens 30 min before bed', 'Same wake time for 7 days']], ja: ['今夜はスマホを寝室の外に置こう。', ['消灯時刻を決める', '寝る30分前は画面を見ない', '7日間同じ時刻に起きる']] },
  exercise: { en: ['Put on your shoes and walk for just 5 minutes now.', ['Walk 5 min after one meal daily', 'Add 2 min each week', 'Log each walk with one tap']], ja: ['靴をはいて、今5分だけ歩こう。', ['毎日1食後に5分歩く', '毎週2分ずつ延ばす', '歩いたら1タップで記録']] },
  focus: { en: ['Close every tab except the one task that matters.', ['Pick one task before opening email', 'Work 25 min, rest 5', 'Phone in another room while focusing']], ja: ['大事な1つ以外のタブを全部閉じよう。', ['メールを開く前にやることを1つ決める', '25分集中して5分休む', '集中中はスマホを別室に']] },
  phone: { en: ['Move social apps off your home screen today.', ['Turn off non-human notifications', 'Grayscale after 21:00', 'Replace the first scroll of the day with 3 breaths']], ja: ['今日、SNSアプリをホーム画面から外そう。', ['人以外からの通知をオフ', '21時以降はモノクロ表示', '朝一番のスクロールを3回の深呼吸に置き換える']] },
  stress: { en: ['Breathe out longer than you breathe in, three times.', ['Name the feeling in one word', 'Three slow exhales when it rises', 'Write one line about it at night']], ja: ['吸うより長く吐く呼吸を3回。', ['感情を一言で名づける', '高まったらゆっくり3回吐く', '夜に一行だけ書き出す']] },
};
const GOALS = Object.keys(PLANS);

const seller = createSeller({
  url: 'https://aniccaai.com/.netlify/functions/x402-maritime-nudge',
  payTo: '0x7a004fBbc3037371321B9f41875B7782971efE76',
  price: '5000', // $0.005 USDC
  description: 'Maritime agent: one behavior-change nudge plus a 3-step habit plan as JSON (en/ja). $0.005 per call.',
  queryParams: {
    goal: { type: 'string', enum: GOALS, description: 'One of: ' + GOALS.join(', ') + ' (default focus)' },
    lang: { type: 'string', enum: ['en', 'ja'], description: 'en or ja (default en)' },
  },
  queryParamsV1: {
    goal: { type: 'string', required: false, enum: GOALS, description: 'One of: ' + GOALS.join(', ') },
    lang: { type: 'string', required: false, enum: ['en', 'ja'], description: 'en or ja' },
  },
  queryExample: { goal: 'sleep', lang: 'en' },
  outputSchema: {
    type: 'object',
    properties: { goal: { type: 'string' }, lang: { type: 'string' }, nudge: { type: 'string' }, plan: { type: 'array', items: { type: 'string' } }, agent: { type: 'string' } },
    required: ['goal', 'lang', 'nudge', 'plan', 'agent'],
  },
  outputExample: { goal: 'sleep', lang: 'en', nudge: PLANS.sleep.en[0], plan: PLANS.sleep.en[1], agent: 'Maritime' },
});

function build(q) {
  const goal = PLANS[(q.goal || '').toLowerCase()] ? q.goal.toLowerCase() : 'focus';
  const lang = q.lang === 'ja' ? 'ja' : 'en';
  const [nudge, plan] = PLANS[goal][lang];
  return { goal, lang, nudge, plan, agent: 'Maritime' };
}

exports.handler = seller(async (q) => ({ status: 200, body: build(q) }));
exports._test = { build, paymentRequired: seller.paymentRequired };
