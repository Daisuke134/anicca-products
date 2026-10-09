/** Free English Mind Habits quiz — client-safe (no paid report body). */

/** Same 8 type ids as the Japanese quiz (shared scoring keys). */
export const KOKORO_TYPE_ORDER_EN = [
  'night-anxiety',
  'self-esteem',
  'burnout',
  'self-blame',
  'heartbreak',
  'morning',
  'money-worry',
  'comparison',
] as const;

export type KokoroTypeId = (typeof KOKORO_TYPE_ORDER_EN)[number];

export function isKokoroTypeId(value: string): value is KokoroTypeId {
  return (KOKORO_TYPE_ORDER_EN as readonly string[]).includes(value);
}

export function isValidScoreString(s: string): boolean {
  return typeof s === 'string' && /^[0-9]{8}$/.test(s);
}

export function parseScoreString(s: string): Record<KokoroTypeId, number> | null {
  if (!isValidScoreString(s)) return null;
  const out = {} as Record<KokoroTypeId, number>;
  KOKORO_TYPE_ORDER_EN.forEach((id, i) => {
    out[id] = Number(s[i]);
  });
  return out;
}

export type KokoroTypeEn = {
  id: KokoroTypeId;
  name: string;
  shortDesc: string;
  freeBlurb: string;
  tonightAffirmation: string;
};

/** Natural English names — not literal translations of the JP labels. */
export const KOKORO_TYPES_EN: Record<KokoroTypeId, KokoroTypeEn> = {
  'night-anxiety': {
    id: 'night-anxiety',
    name: 'Midnight Spiral',
    shortDesc: 'Quiet hours turn up the volume on worry',
    freeBlurb:
      'When the day goes quiet, your mind starts solving problems that don’t need solving tonight. You chase answers to feel safe — and end up more awake. That isn’t weakness. It usually means you care about something you don’t want to drop.',
    tonightAffirmation: 'Tonight does not need every answer.',
  },
  'self-esteem': {
    id: 'self-esteem',
    name: 'Proof Seeker',
    shortDesc: 'Feedback and results steady your sense of self',
    freeBlurb:
      'You check your place through output and recognition. That drive can build real things. It can also blur your outline on quiet days when nothing “lands.” Your worth starts before the reaction arrives.',
    tonightAffirmation: 'I am already here — before the proof.',
  },
  burnout: {
    id: 'burnout',
    name: 'Running on Fumes',
    shortDesc: 'Hard to stop even when you’re running low',
    freeBlurb:
      'Responsibility keeps you moving. “One more thing” stacks until rest feels like a risk. Tiredness is information, not a character flaw. Rest is fuel logistics, not escape.',
    tonightAffirmation: 'I do not have to finish everything today.',
  },
  'self-blame': {
    id: 'self-blame',
    name: 'Inner Court',
    shortDesc: 'You keep replaying scenes after they end',
    freeBlurb:
      'After conversations or mistakes, a private trial opens. Care and conscience live here — and so can punishment if the trial never adjourns. Learning and self-attack are not the same job.',
    tonightAffirmation: 'I can learn without punishing myself.',
  },
  heartbreak: {
    id: 'heartbreak',
    name: 'Open Heart',
    shortDesc: 'Connection temperature moves you quickly',
    freeBlurb:
      'Feeling close steadies you; distance or silence can shake the floor. That sensitivity is often love with the volume up — not a defect. Your value does not shrink when someone goes quiet.',
    tonightAffirmation: 'Distance does not reduce my worth.',
  },
  morning: {
    id: 'morning',
    name: 'Slow Start',
    shortDesc: 'Warm-up takes longer than the world expects',
    freeBlurb:
      'Mornings and transitions need a lower gear. That is not laziness — it is a warm-up design. A soft start still counts as a start.',
    tonightAffirmation: 'A messy beginning is still a beginning.',
  },
  'money-worry': {
    id: 'money-worry',
    name: 'What-If Mind',
    shortDesc: 'You carry risks that have not happened yet',
    freeBlurb:
      'You prep for shortage and failure early. That foresight can protect you — until imagined crises eat tonight’s calm. Worry and facts can live in separate files.',
    tonightAffirmation: 'I do not have to carry every future tonight.',
  },
  comparison: {
    id: 'comparison',
    name: 'Highlight Trap',
    shortDesc: 'Other people’s progress becomes your ruler',
    freeBlurb:
      'Other people’s wins slip into your measuring stick. Ambition lives here — and so does a chronic “not enough” when you watch edited highlights. Your season is not their timeline.',
    tonightAffirmation: 'Someone else’s pace is not my homework.',
  },
};

export type KokoroQuestionEn = {
  id: string;
  text: string;
  typeId: KokoroTypeId;
};

export const KOKORO_QUESTIONS_EN: KokoroQuestionEn[] = [
  {
    id: 'q1',
    text: 'After lights-out, my mind starts running “what if” scenarios',
    typeId: 'night-anxiety',
  },
  {
    id: 'q2',
    text: 'When praise or results are thin, my mood drops quickly',
    typeId: 'self-esteem',
  },
  {
    id: 'q3',
    text: 'Even when tired, I push through “just a little more”',
    typeId: 'burnout',
  },
  {
    id: 'q4',
    text: 'After a conversation, I replay what I said and how it landed',
    typeId: 'self-blame',
  },
  {
    id: 'q5',
    text: 'Read receipts and reply gaps swing my feelings hard',
    typeId: 'heartbreak',
  },
  {
    id: 'q6',
    text: 'Mornings feel foggy; it takes a while to get moving',
    typeId: 'morning',
  },
  {
    id: 'q7',
    text: 'Money or future shortfalls pop into my head uninvited',
    typeId: 'money-worry',
  },
  {
    id: 'q8',
    text: 'Seeing others succeed online makes me feel behind',
    typeId: 'comparison',
  },
  {
    id: 'q9',
    text: 'On sleepless nights I try to “solve” the worry and stay up longer',
    typeId: 'night-anxiety',
  },
  {
    id: 'q10',
    text: 'Resting can feel like I’m falling behind or being lazy',
    typeId: 'burnout',
  },
  {
    id: 'q11',
    text: 'I hold onto my mistakes longer than I need to',
    typeId: 'self-blame',
  },
  {
    id: 'q12',
    text: 'I often feel “everyone else is ahead of me”',
    typeId: 'comparison',
  },
];

export const LIKERT_LABELS_EN = [
  'Not at all like me',
  'A little like me',
  'Somewhat like me',
  'Quite like me',
  'Very much like me',
] as const;

export const DISCLAIMER_EN =
  'Not a medical diagnosis. A short self-check to notice your patterns.';

export const KOKORO_PRICE_USD = 4.99;
export const KOKORO_PRICE_USD_CENTS = 499;

export const APP_STORE_QUIZ_EN_URL =
  'https://apps.apple.com/us/app/id6755129214?pt=93486075&ct=quiz_en&mt=8';

export function shareTextEn(typeName: string, resultUrl: string): string {
  return `#MindHabitsQuiz I got “${typeName}” → ${resultUrl}`;
}

export function allKokoroTypeIdsEn(): KokoroTypeId[] {
  return [...KOKORO_TYPE_ORDER_EN];
}

export function rankedFromScoreStringEn(s: string): KokoroTypeId[] | null {
  const scores = parseScoreString(s);
  if (!scores) return null;
  return [...KOKORO_TYPE_ORDER_EN].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return KOKORO_TYPE_ORDER_EN.indexOf(a) - KOKORO_TYPE_ORDER_EN.indexOf(b);
  });
}
