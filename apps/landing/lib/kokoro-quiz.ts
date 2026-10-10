/** Free 「心のクセ診断」 quiz — client-safe (no paid report body). */

export const KOKORO_TYPE_ORDER = [
  'night-anxiety',
  'self-esteem',
  'burnout',
  'self-blame',
  'heartbreak',
  'morning',
  'money-worry',
  'comparison',
] as const;

export type KokoroTypeId = (typeof KOKORO_TYPE_ORDER)[number];

export type KokoroType = {
  id: KokoroTypeId;
  name: string;
  shortDesc: string;
  /** Free result: ~3 lines */
  freeBlurb: string;
  tonightAffirmation: string;
  problemSlug: KokoroTypeId;
};

export const KOKORO_TYPES: Record<KokoroTypeId, KokoroType> = {
  'night-anxiety': {
    id: 'night-anxiety',
    name: '夜ぐるぐるタイプ',
    shortDesc: '暗くなると頭が回り始める',
    freeBlurb:
      '夜になると、昼間は黙っていた心配が急に声を大きくします。答えを出そうとして、ますます眠れなくなるパターンです。悪いことではなく、「守りたいものがある」サインでもあります。',
    tonightAffirmation: '今夜は、全部を解決しなくていい。',
    problemSlug: 'night-anxiety',
  },
  'self-esteem': {
    id: 'self-esteem',
    name: 'がんばり証明タイプ',
    shortDesc: '認めてもらわないと落ち着かない',
    freeBlurb:
      '成果や反応で自分の位置を確認したくなるタイプです。がんばれる強さがある一方、評価が薄いと急に自分の輪郭がぼやけることがあります。価値は、反応の前からあります。',
    tonightAffirmation: '私は、いまのままでも足りている。',
    problemSlug: 'self-esteem',
  },
  burnout: {
    id: 'burnout',
    name: '燃え尽き手前タイプ',
    shortDesc: '止め時がわからず走り続ける',
    freeBlurb:
      '責任感が強く、休む前に「もう少し」を積み重ねやすいタイプです。疲れを感じても、止める許可を自分に出せないことがあります。休息は、逃げではなく燃料補給です。',
    tonightAffirmation: '今日は、全部やらなくていい。',
    problemSlug: 'burnout',
  },
  'self-blame': {
    id: 'self-blame',
    name: 'ひとり反省会タイプ',
    shortDesc: '終わったあとでも自分を取り調べる',
    freeBlurb:
      '会話や出来事のあと、頭の中で再審が始まりやすいタイプです。誠実さの裏返しでもありますが、反省が罰になってしまうと心が削れます。学びと自己攻撃は別物です。',
    tonightAffirmation: '責め続けても、時間は戻らない。',
    problemSlug: 'self-blame',
  },
  heartbreak: {
    id: 'heartbreak',
    name: 'つながり渇望タイプ',
    shortDesc: '関係の温度に心が揺れやすい',
    freeBlurb:
      '人とつながっている感覚が、安心の土台になりやすいタイプです。距離や沈黙に敏感で、愛があるぶん痛みも深く感じます。寂しさは欠陥ではなく、大切にしたい気持ちの形です。',
    tonightAffirmation: '離れても、私の価値は減らない。',
    problemSlug: 'heartbreak',
  },
  morning: {
    id: 'morning',
    name: 'エンジン低速タイプ',
    shortDesc: '立ち上がりに時間がかかる',
    freeBlurb:
      '朝や切り替えの瞬間に、体と心のギアがすぐ上がらないタイプです。怠けではなく、ウォームアップが必要な設計に近いです。ゆっくり始まっても、一日はちゃんと始まります。',
    tonightAffirmation: '完璧な朝でなくていい。始まった朝でいい。',
    problemSlug: 'morning',
  },
  'money-worry': {
    id: 'money-worry',
    name: '先回り心配タイプ',
    shortDesc: 'まだ起きていない不安を先に抱える',
    freeBlurb:
      '将来の不足や失敗を先読みして、いまを守りにいくタイプです。備えの意識が強い一方、想像が現実より大きくなると夜が長くなります。心配と事実は、分けて扱えます。',
    tonightAffirmation: '将来の不安は、今夜全部背負わなくていい。',
    problemSlug: 'money-worry',
  },
  comparison: {
    id: 'comparison',
    name: 'となりの芝生タイプ',
    shortDesc: '他人の進み方と比べてしまう',
    freeBlurb:
      '他人の更新や成果が、自分の尺度に入り込みやすいタイプです。向上心がある証拠でもありますが、比較が続くと「まだ足りない」が常態化します。あなたの季節は、他人のタイムラインではありません。',
    tonightAffirmation: '他人の速度は、私の宿題ではない。',
    problemSlug: 'comparison',
  },
};

export type KokoroQuestion = {
  id: string;
  text: string;
  /** Which type this Likert answer mainly feeds */
  typeId: KokoroTypeId;
};

/** 12 questions · 5-point Likert (1=まったく当てはまらない … 5=とても当てはまる) */
export const KOKORO_QUESTIONS: KokoroQuestion[] = [
  {
    id: 'q1',
    text: '夜、布団に入ってから「もし〜だったら」と考え始めやすい',
    typeId: 'night-anxiety',
  },
  {
    id: 'q2',
    text: 'ほめられたり成果が出たりしないと、自分の調子が落ちやすい',
    typeId: 'self-esteem',
  },
  {
    id: 'q3',
    text: '疲れているのに「もう少しだけ」とやり続けてしまう',
    typeId: 'burnout',
  },
  {
    id: 'q4',
    text: '会話のあと、「あの言い方まずかったかな」と何度も思い出す',
    typeId: 'self-blame',
  },
  {
    id: 'q5',
    text: '既読や返信の間隔で、気持ちが大きく上下する',
    typeId: 'heartbreak',
  },
  {
    id: 'q6',
    text: '朝は頭がぼんやりして、動き出すまで時間がかかる',
    typeId: 'morning',
  },
  {
    id: 'q7',
    text: '家計や将来のお金のことが、ふとした瞬間に頭を占める',
    typeId: 'money-worry',
  },
  {
    id: 'q8',
    text: 'SNSや周囲のうまくいっている話を見ると、自分と比べて落ち込む',
    typeId: 'comparison',
  },
  {
    id: 'q9',
    text: '眠れない夜は、心配を「解決」しようとしてさらに長引く',
    typeId: 'night-anxiety',
  },
  {
    id: 'q10',
    text: '休むと「サボっている」気がして落ち着かない',
    typeId: 'burnout',
  },
  {
    id: 'q11',
    text: '自分のミスを、必要以上に長く引きずる',
    typeId: 'self-blame',
  },
  {
    id: 'q12',
    text: '「みんなは進んでいるのに自分だけ」と感じやすい',
    typeId: 'comparison',
  },
];

export const LIKERT_LABELS = [
  'まったく当てはまらない',
  'あまり当てはまらない',
  'どちらともいえない',
  'やや当てはまる',
  'とても当てはまる',
] as const;

export const DISCLAIMER_JA =
  '医療的な診断ではありません。自分を知るためのセルフチェックです。';

export const APP_STORE_SHINDAN_URL =
  'https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=shindan&mt=8';

export const KOKORO_PRICE_JPY = 480;

const TYPE_SET = new Set<string>(KOKORO_TYPE_ORDER);

export function isKokoroTypeId(value: string): value is KokoroTypeId {
  return TYPE_SET.has(value);
}

/** Validate `s`: exactly 8 chars, each digit 0-9, in type order. */
export function isValidScoreString(s: string): boolean {
  return typeof s === 'string' && /^[0-9]{8}$/.test(s);
}

export function parseScoreString(s: string): Record<KokoroTypeId, number> | null {
  if (!isValidScoreString(s)) return null;
  const out = {} as Record<KokoroTypeId, number>;
  KOKORO_TYPE_ORDER.forEach((id, i) => {
    out[id] = Number(s[i]);
  });
  return out;
}

export function encodeScoreString(scores: Record<KokoroTypeId, number>): string {
  return KOKORO_TYPE_ORDER.map((id) => {
    const n = Math.max(0, Math.min(9, Math.round(scores[id] ?? 0)));
    return String(n);
  }).join('');
}

/**
 * answers: length 12, each 1..5
 * Raw type totals → normalize to 0..9 (max raw among types maps to 9, or 0 if all zero).
 */
export function scoreAnswers(answers: number[]): {
  scores: Record<KokoroTypeId, number>;
  scoreString: string;
  ranked: KokoroTypeId[];
  primary: KokoroTypeId;
} {
  if (!Array.isArray(answers) || answers.length !== KOKORO_QUESTIONS.length) {
    throw new TypeError('answers length must be 12');
  }
  const raw = Object.fromEntries(KOKORO_TYPE_ORDER.map((id) => [id, 0])) as Record<
    KokoroTypeId,
    number
  >;
  answers.forEach((a, i) => {
    if (!Number.isInteger(a) || a < 1 || a > 5) {
      throw new TypeError(`answer ${i} must be 1..5`);
    }
    raw[KOKORO_QUESTIONS[i].typeId] += a;
  });
  const maxRaw = Math.max(...KOKORO_TYPE_ORDER.map((id) => raw[id]), 0);
  const scores = {} as Record<KokoroTypeId, number>;
  for (const id of KOKORO_TYPE_ORDER) {
    scores[id] = maxRaw === 0 ? 0 : Math.round((raw[id] / maxRaw) * 9);
  }
  const ranked = [...KOKORO_TYPE_ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return KOKORO_TYPE_ORDER.indexOf(a) - KOKORO_TYPE_ORDER.indexOf(b);
  });
  return {
    scores,
    scoreString: encodeScoreString(scores),
    ranked,
    primary: ranked[0],
  };
}

export function rankedFromScoreString(s: string): KokoroTypeId[] | null {
  const scores = parseScoreString(s);
  if (!scores) return null;
  return [...KOKORO_TYPE_ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return KOKORO_TYPE_ORDER.indexOf(a) - KOKORO_TYPE_ORDER.indexOf(b);
  });
}

export function shareText(typeName: string, resultUrl: string): string {
  return `#心のクセ診断 わたしは『${typeName}』でした → ${resultUrl}`;
}

export function allKokoroTypeIds(): KokoroTypeId[] {
  return [...KOKORO_TYPE_ORDER];
}
