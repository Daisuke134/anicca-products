export type EnAffirmationProblem = {
  slug: string;
  /** Closest Japanese SEO page under /affirmation-app/ja/a/* */
  jaSlug: string;
  title: string;
  shortTitle: string;
  metaDescription: string;
  /** Plain-language “why this happens” (~lead + sections). */
  whyItHappens: string[];
  affirmations: string[];
  /** Steps for a ~2-minute practice. */
  practice: { heading: string; steps: string[] };
  closing: string;
};

export const EN_AFFIRMATION_APP_STORE_BASE =
  'https://apps.apple.com/app/id6755129214';

export function enAffirmationAppStoreUrl(slug: string): string {
  const url = new URL(EN_AFFIRMATION_APP_STORE_BASE);
  url.searchParams.set('pt', '93486075');
  url.searchParams.set('ct', `seo_en_${slug}`);
  url.searchParams.set('mt', '8');
  return url.toString();
}

/** Map EN slug → JA slug (and reverse helpers). */
export const EN_TO_JA_SLUG: Record<string, string> = {
  'overthinking-at-night': 'night-anxiety',
  'self-doubt': 'self-esteem',
  'comparing-yourself': 'comparison',
};

export const JA_TO_EN_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_JA_SLUG).map(([en, ja]) => [ja, en]),
);

export const EN_AFFIRMATION_PROBLEMS: EnAffirmationProblem[] = [
  {
    slug: 'overthinking-at-night',
    jaSlug: 'night-anxiety',
    title: "Overthinking at night? Affirmations for when your mind won't stop",
    shortTitle: 'Overthinking at night',
    metaDescription:
      "Gentle affirmations for nighttime overthinking. Anicca is an iPhone affirmation app that sends one kind line when your mind tends to spiral — 13 self-care topics, no streaks.",
    whyItHappens: [
      'Night is when the noise drops and the unfinished list gets loud. Without meetings, messages, or errands to interrupt you, the brain finally has bandwidth — and it often spends that bandwidth on worry, replay, and “what if.” That does not mean you are broken. It means your nervous system is still on duty after the day has ended.',
      'Overthinking at night is rarely about finding a perfect answer. It is usually your mind trying to feel safe by solving everything before sleep. The cost is that sleep becomes a negotiation: one more scenario, one more message draft in your head, one more review of a conversation. The body wants rest; the mind wants certainty. Affirmations will not delete the worry. They can shorten the argument and give you a softer place to land.',
      'Anicca is an iPhone affirmation app that sends one kind line when your mind tends to spiral. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. Use the lines below as bookmarks for 11:47 p.m. — and if you want the line to find you instead of the other way around, the App Store link is at the bottom.',
    ],
    affirmations: [
      'I do not have to solve tonight to deserve rest.',
      'This worry is loud, not always true.',
      'One slow breath is enough for this minute.',
      'Lying down counts, even if sleep is late.',
      'Morning-me will not punish night-me for needing quiet.',
      'Thoughts can visit without moving in.',
      'I can put the phone down and feel the weight of my body.',
      'A imperfect night is still a night I survived.',
      'Scary imagination and this dark room are not the same place.',
      'Peace does not require a finished checklist.',
    ],
    practice: {
      heading: 'A two-minute night practice',
      steps: [
        'Sit or lie still. Name three things you can feel (sheet, pillow, air). No fixing — only noticing.',
        'Pick one affirmation from the list. Say it once out loud or in a whisper. If it feels fake, soften it: “I am willing to rest without solving everything.”',
        'Exhale longer than you inhale, twice. Then stop. Do not turn this into a project. If the mind returns, meet it with the same line once more and leave it there.',
      ],
    },
    closing:
      'If nights keep feeling unbearable, reach out to someone you trust or a local crisis line. This page is self-care copy for an affirmation app — not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'self-doubt',
    jaSlug: 'self-esteem',
    title: 'Affirmations for self-doubt',
    shortTitle: 'Self-doubt',
    metaDescription:
      'Short affirmations for self-doubt days. Anicca sends one kind line when your mind spirals — 13 self-care topics, no streaks, free to download on iPhone.',
    whyItHappens: [
      'Self-doubt often shows up as a private courtroom. You replay a message, a meeting, a photo, a silence — and the verdict arrives before the evidence does. “Not enough” becomes the default setting, even on days when nothing dramatic happened. Doubt is not proof that you are failing. It is often a habit of scanning for threat so you will not be surprised by criticism.',
      'Comparison, perfectionism, and old feedback can keep that habit well-fed. Social feeds compress other people’s highlights into a scoreboard. Work culture rewards constant output. Family scripts about being “responsible” or “impressive” linger. None of that means your worth is a grade. It means your attention has been trained to look for gaps.',
      'Affirmations for self-doubt are not cheerleading. They are interruptions: small, honest sentences that refuse the harshest story for sixty seconds. Anicca is an iPhone affirmation app that sends one kind line when your mind tends to spiral across 13 self-care topics. No streaks. Free to download, with an optional subscription if you want the full proactive experience.',
    ],
    affirmations: [
      'I am allowed to take up space without a perfect resume.',
      'My value is not a performance review.',
      'Doubt can speak without getting the final vote.',
      'I can be unfinished and still worthy of kindness.',
      'One kind sentence to myself is still progress.',
      'I do not have to earn rest with excellence.',
      'Being human includes uneven days.',
      'I can move at my pace without apologizing for it.',
      'Feedback is information, not a full identity.',
      'I am on my own side today, even quietly.',
    ],
    practice: {
      heading: 'A two-minute self-doubt reset',
      steps: [
        'Write down the meanest sentence your mind is repeating. Literally one line.',
        'Underline any absolute words (“always,” “never,” “everyone”). Ask: would I say this to a friend I care about?',
        'Replace it with one affirmation from above — or a gentler cousin that still feels believable. Read it twice. Stop. Optional: set a reminder later so kindness is not only a crisis tool.',
      ],
    },
    closing:
      'Persistent hopelessness, panic, or thoughts of harming yourself deserve real human support. Use crisis resources in your country. Anicca is a self-care app, not medical advice.',
  },
  {
    slug: 'comparing-yourself',
    jaSlug: 'comparison',
    title: 'Stop comparing yourself: affirmations for the scroll spiral',
    shortTitle: 'Comparing yourself',
    metaDescription:
      'Affirmations for comparison and the scroll spiral. Anicca is an iPhone affirmation app — one kind line, 13 topics, no streaks, free to download.',
    whyItHappens: [
      'The scroll spiral is efficient: other people’s highlight reels arrive in high resolution, while your own life arrives as laundry, drafts, and unfinished tabs. Your brain treats the feed like data about your worth. It is not. It is curated marketing mixed with real lives you only see from the outside.',
      'Comparison thrives on incomplete information. You see the promotion, not the anxiety. The trip, not the credit card. The calm selfie, not the argument five minutes earlier. Still, the body reacts as if you lost a race you never entered. That reaction is human. Feeding it with more scrolling usually makes it louder.',
      'These affirmations are for the moment your thumb keeps moving and your chest gets tight. Anicca is an iPhone affirmation app that sends one kind line when your mind tends to spiral. Thirteen self-care topics. No streaks. Free to download with an optional subscription. It will not “fix” social media. It can give you a sentence to hold while you put the phone face-down.',
    ],
    affirmations: [
      'Someone else’s timeline is not my homework.',
      'A highlight is not a full life.',
      'I can close the app without earning permission.',
      'My season is allowed to look different.',
      'Envy can point to a wish without shrinking me.',
      'Quiet progress still counts.',
      'I am not behind; I am here.',
      'Likes are not a price tag for my heart.',
      'I can celebrate others without disappearing.',
      'My pace is a valid pace.',
    ],
    practice: {
      heading: 'A two-minute anti-scroll practice',
      steps: [
        'Flip the phone face-down. Feel both feet on the floor for ten seconds.',
        'Name what you were comparing (career, body, relationship, money, creativity). Naming reduces the fog.',
        'Read one affirmation slowly. If you want a next step offline, choose one tiny real-world action (water, stretch, text a friend) — not another feed.',
      ],
    },
    closing:
      'If comparison is tangled with depression, disordered eating, or crisis feelings, please talk to a professional or a local helpline. This is self-care language for an affirmation app — not medical advice.',
  },
];

export function getEnAffirmationProblem(
  slug: string,
): EnAffirmationProblem | undefined {
  return EN_AFFIRMATION_PROBLEMS.find((p) => p.slug === slug);
}

export function allEnAffirmationSlugs(): string[] {
  return EN_AFFIRMATION_PROBLEMS.map((p) => p.slug);
}
