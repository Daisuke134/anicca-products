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
  {
    slug: 'affirmations-for-overthinking',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for overthinking: short lines to interrupt the loop',
    shortTitle: 'Affirmations for overthinking',
    metaDescription:
      'Short affirmations for overthinking, plus a two-minute practice for when your mind replays everything. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Overthinking is the habit of turning one thought over and over: replaying a conversation, rehearsing a message, or running every possible outcome of a decision that has not happened yet. It can feel like problem solving, because your mind is busy and the topic feels important. But the loop often has no new information in it. You finish the tenth lap knowing what you knew on the first, and you are more tired.',
      'It helps to notice what overthinking is trying to do. Usually it is trying to buy certainty or protect you from a mistake. If you think about it enough, maybe you will not be surprised, embarrassed, or wrong. That is an understandable goal, and it is also one that thinking alone rarely delivers. Some things only get clearer when you act, ask a person, or let time pass.',
      'An affirmation is not a magic phrase that switches thoughts off. Think of it as a small interruption. One calm sentence, read slowly, gives your attention somewhere else to stand for a moment. It works best when it is believable and a little boring: not "everything is perfect," but "I do not need to decide this right now." Pick lines that you could say to a friend without wincing.',
      'Anicca is an iPhone affirmation app built around that idea. Instead of a library you have to remember to open, it sends one short line at the time you tend to spiral. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can think about this later. Right now I only need the next small step.',
      'A thought repeated ten times is still just one thought.',
      'I do not need to solve the whole story today.',
      'Not knowing yet is allowed.',
      'I can act on what I know and let the rest stay open.',
      'My mind is trying to help. I can thank it and set it down.',
      'This feels urgent, but I can pause before I answer it.',
      'I do not have to win the argument that only exists in my head.',
      'Good enough is a real decision.',
      'I can come back to my body: feet, hands, breath.',
    ],
    practice: {
      heading: 'A two-minute loop breaker',
      steps: [
        'Write the looping thought as one plain sentence, for example: "I keep replaying what I said in the meeting." Seeing it on one line often makes it smaller.',
        'Ask one question: is there an action I can take in the next ten minutes? If yes, write it down and do only that. If no, write "nothing to do right now" and let that be the answer for today.',
        'Read one affirmation from the list twice, slowly. Then do something with your hands, such as washing a cup or stretching, so the thought has less room to restart.',
      ],
    },
    closing:
      'Related guides: affirmations for anxiety and affirmations for self-love, linked below. If overthinking is constant, keeps you from sleeping or working for weeks, or comes with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-anxiety',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for anxiety: gentle lines for tense moments',
    shortTitle: 'Affirmations for anxiety',
    metaDescription:
      'Gentle affirmations for anxious moments, with a simple grounding practice you can do in two minutes. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Anxiety is a very ordinary human experience. The body gets ready for something difficult: the chest tightens, thoughts speed up, and your attention narrows to what could go wrong. Sometimes there is a clear reason, such as a deadline or a hard conversation. Sometimes it arrives with no obvious cause, which can be the most unsettling version.',
      'When you are in the middle of it, arguing with the feeling rarely works. "Just calm down" is not a sentence anyone has ever found helpful. What tends to be more useful is something small and kind that does not demand you feel different right away. An affirmation for anxiety can be that: a short, steady sentence that acknowledges the feeling instead of fighting it.',
      'The best lines are honest. "I am completely safe and nothing will go wrong" can feel false, and a false line makes the tension worse. A line like "This feeling is uncomfortable, and it will change" is easier to accept, because it is true. Choose the words that make your shoulders drop a little, even by a millimetre.',
      'Anicca is an iPhone affirmation app that sends one short, kind line at the moments you tend to spiral. It has 13 self-care topics, no streaks, and is free to download with an optional subscription. It is a self-care tool, not treatment, and it is not a replacement for professional support. The lines below are yours to use however you like.',
    ],
    affirmations: [
      'This feeling is uncomfortable, and it will change.',
      'I can feel anxious and still take one small step.',
      'My body is trying to protect me. I can help it slow down.',
      'I do not have to believe every thought that arrives with a racing heart.',
      'I have handled hard moments before, and I can meet this one gently.',
      'I only need to get through this minute.',
      'It is okay to ask for help or company.',
      'I can let my breath be slow, even if my thoughts are fast.',
      'Anxious does not mean broken.',
      'I can be kind to myself while this passes.',
    ],
    practice: {
      heading: 'A two-minute grounding practice',
      steps: [
        'Look around and name five things you can see, then four you can touch, then three you can hear. Say them quietly. The goal is simply to bring your attention to the room you are in.',
        'Breathe in through your nose for a count of four, then out slowly for a count of six. Repeat four times. If counting makes you more tense, skip it and just make the exhale a little longer than the inhale.',
        'Choose one affirmation from the list and read it once out loud. If it does not feel believable, soften it until it does, then stop. There is nothing more to achieve.',
      ],
    },
    closing:
      'Related guides: affirmations for overthinking and affirmations for self-love, linked below. If anxiety is intense, frequent, or getting in the way of daily life, or if you ever feel unsafe, please contact a healthcare professional or a local crisis line. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-self-love',
    jaSlug: 'self-esteem',
    title: 'Affirmations for self-love: believable lines, not forced positivity',
    shortTitle: 'Affirmations for self-love',
    metaDescription:
      'Believable affirmations for self-love, plus a short practice for being kinder to yourself. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Self-love can sound like a big, vague goal, as if you are supposed to wake up one day adoring everything about yourself. In practice it is smaller and more practical: treating yourself with the basic respect and patience you would offer a friend. It is less about feeling amazing and more about not adding cruelty to a hard day.',
      'Many of us have a strict inner voice that was trained over years. It points out mistakes quickly and rarely mentions what went well. It may have started as a way to keep you safe or keep you improving. But a voice that only criticises is tiring to live with, and it does not make most people more capable. Often it just makes them more afraid of trying.',
      'Affirmations can help you practise a different tone, with one condition: they need to be believable. If you tell yourself "I love everything about me" while feeling the opposite, your mind will argue, and the exercise backfires. Start from where you actually are. "I am allowed to be a work in progress" is a sentence most people can accept, and acceptance is the part that matters.',
      'Anicca is an iPhone affirmation app that sends one short line of kindness at the moments your mind tends to spiral, rather than asking you to remember a routine. It has 13 self-care topics, no streaks to keep alive, and is free to download with an optional subscription. Below are ten lines to borrow, along with a short practice you can repeat any time.',
    ],
    affirmations: [
      'I am allowed to be a work in progress.',
      'I can speak to myself the way I would speak to a friend.',
      'My worth is not something I have to earn today.',
      'I can make a mistake and still be someone worth caring for.',
      'Rest is not a reward. It is part of being a person.',
      'I do not have to be the best to be enough for this moment.',
      'I can notice what I did well, even if it was small.',
      'I am learning, and learning is untidy.',
      'I can set a boundary and still be kind.',
      'I am on my own side, even on the quiet days.',
    ],
    practice: {
      heading: 'A two-minute kindness check-in',
      steps: [
        'Think of the harshest thing you said to yourself today. Write it down exactly as it came.',
        'Imagine a close friend saying that sentence about themselves. Write what you would honestly say back to them. Keep it short and true, not fake-cheerful.',
        'Read your reply to yourself once, slowly. Then pick one affirmation from the list to carry for the rest of the day, perhaps as a note on your phone.',
      ],
    },
    closing:
      'Related guides: affirmations for overthinking and affirmations for anxiety, linked below. If you are struggling with persistent low mood, self-harm thoughts, or feelings of hopelessness, please reach out to a mental health professional or a local crisis line. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
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
