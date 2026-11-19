import { createHash } from 'node:crypto';

export type EnAffirmationFaq = { q: string; a: string };

export type EnAffirmationComparison = {
  competitorName: string;
  competitorStoreUrl: string;
  /** ISO date when competitor facts were read from the public App Store page. */
  sourcedAsOf: string;
  /** Verifiable focus points only (no invented ratings, counts, or prices). */
  competitorFocus: string[];
  aniccaFocus: string[];
};

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
  /**
   * Optional GEO fields. When set, the page uses the exact phrase as H1,
   * shows a quotable direct answer, FAQ (+ FAQPage JSON-LD), and can use
   * ct=seo_geo_<slug> on the App Store button.
   */
  h1?: string;
  /** Usually three short sentences AI/search can quote. */
  directAnswer?: string[];
  faq?: EnAffirmationFaq[];
  /** App Store ct param prefix. Default seo_en. */
  campaignPrefix?: 'seo_en' | 'seo_geo';
  comparison?: EnAffirmationComparison;
};

export const EN_AFFIRMATION_APP_STORE_BASE =
  'https://apps.apple.com/app/id6755129214';

export function enAffirmationAppStoreUrl(
  slug: string,
  campaignPrefix: 'seo_en' | 'seo_geo' = 'seo_en',
): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug) ||
      !['seo_en', 'seo_geo'].includes(campaignPrefix)) {
    throw new Error('Invalid affirmation campaign input');
  }
  const identity = `${campaignPrefix}_${slug}`;
  // Keep existing valid attribution identities; hash the entire longer identity
  // so similar slugs and different campaign lanes retain distinct tokens.
  const campaign = identity.length <= 30
    ? identity
    : `${identity.slice(0, 13)}-${createHash('sha256').update(identity, 'utf8').digest('hex').slice(0, 16)}`;
  const url = new URL(EN_AFFIRMATION_APP_STORE_BASE);
  url.searchParams.set('pt', '93486075');
  url.searchParams.set('ct', campaign);
  url.searchParams.set('mt', '8');
  return url.toString();
}

/** Map EN slug → JA slug (and reverse helpers). */
export const EN_TO_JA_SLUG: Record<string, string> = {
  'overthinking-at-night': 'night-anxiety',
  'self-doubt': 'self-esteem',
  'comparing-yourself': 'comparison',
  'affirmations-for-sunday-scaries': 'sunday-scaries',
  'affirmations-for-social-anxiety-at-work': 'social-anxiety-at-work',
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
    title: 'Affirmations for overthinking: 10 calm lines to stop the loop (2026)',
    h1: 'Affirmations for overthinking: 10 calm lines that interrupt the loop',
    directAnswer: [
      'The short answer: affirmations help with overthinking when they interrupt the loop instead of fighting it. A believable, slightly boring line such as "I do not need to solve the whole story today" gives your attention somewhere else to stand for a moment. Read one slowly, then take one small action or do something with your hands.',
    ],
    faq: [
      { q: "What are good affirmations for overthinking?", a: 'Believable, calm lines work better than big positive ones, for example: "A thought repeated ten times is still just one thought." "I do not need to solve the whole story today." "Not knowing yet is allowed." Pick one you could say to a friend without wincing.' },
      { q: 'Do affirmations stop overthinking?', a: 'No phrase switches thoughts off. An affirmation works as a small interruption: one calm sentence, read slowly, gives your attention somewhere else to stand for a moment. Pair it with one small action, because some things only get clearer when you act, ask a person, or let time pass.' },
      { q: 'How do I break an overthinking loop in two minutes?', a: 'Write the looping thought as one plain sentence. Ask whether there is an action you can take in the next ten minutes; if yes, do only that, if no, write "nothing to do right now." Then read one affirmation twice, slowly, and do something with your hands, such as washing a cup or stretching.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for overthinking',
    metaDescription:
      '10 calm affirmations for overthinking that interrupt the loop instead of fighting it, plus a two-minute loop breaker for when your mind replays everything. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
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
  {
    slug: 'affirmations-for-imposter-syndrome',
    jaSlug: 'self-esteem',
    title: 'Affirmations for imposter syndrome (2026): lines that do not ask you to fake confidence',
    shortTitle: 'Affirmations for imposter syndrome',
    metaDescription:
      'Honest affirmations for imposter syndrome, plus a two-minute exercise for when you feel like a fraud at work. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we have a stake in this topic. Here is the short version first. Imposter syndrome is the persistent feeling that your results are luck or an error, and that people will soon notice. It is not an official diagnosis, and it shows up in people who are objectively doing the work. The practical question is not "how do I feel confident?" but "what can I say to myself that I can actually believe today?"',
      'The feeling tends to grow when the bar keeps moving. You finish a project and immediately look at what you missed. You get praise and file it under "they are just being nice." Over time your mind collects every doubt as evidence and discards every success as an exception. Nothing about this means you are secretly unqualified. It means your attention has a filter, and the filter is set to look for flaws.',
      'That is why "I am the best" style affirmations often backfire. Your mind argues, and the argument wins. Lines that work better are factual and modest: things you did, things you are learning, things that can be true at the same time as the doubt. You are allowed to feel like a beginner and to be competent at the same time.',
      'Anicca is built around that kind of line. It sends one short affirmation at the time of day you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I was hired, chosen, or trusted for reasons. I do not have to re-prove them every day.',
      'Feeling like a beginner and being capable can both be true.',
      'I can ask a question without it cancelling my competence.',
      'Praise is information. I can let one piece of it stay.',
      'I do not need to know everything to do this well.',
      'My doubt is loud, but it is not a record of my work.',
      'Everyone around me is also figuring parts of this out.',
      'I can name one thing I handled well this week.',
      'Learning something in public is not the same as being exposed.',
      'I am allowed to take up space in this room.',
    ],
    practice: {
      heading: 'A two-minute evidence list',
      steps: [
        'Write three plain facts about work you did in the last month, such as "I shipped the report" or "I answered the customer\'s question." Stick to facts, not adjectives.',
        'Next to each fact, write who or what it helped. If you cannot think of anyone, write "unknown" and move on; you do not have to force it.',
        'Read one affirmation from the list twice, slowly, then read your list once. Keep the list somewhere you can add to it, because your mind will not do this on its own.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for anxiety, linked below. If feelings of being a fraud are constant, affect your sleep or work for weeks, or come with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-burnout',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for burnout and exhaustion (2026): small lines for when you have nothing left',
    shortTitle: 'Affirmations for burnout',
    metaDescription:
      'Gentle affirmations for burnout and exhaustion, plus a two-minute reset for the end of a draining day. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral here. The short version: affirmations cannot fix burnout. If you are worn out because of workload, caring for others, or long stretches without rest, the real fixes are rest, support, and changes to the load. What a short line can do is make a hard evening a little less harsh, so you are not also fighting yourself.',
      'Burnout is usually described as exhaustion that does not fully go away with a normal weekend, often with cynicism about work and a feeling that nothing you do is enough. It is not a character flaw, and it is not laziness. It tends to build quietly, and the common reaction is to push harder, which makes the tiredness worse.',
      'When you are this tired, long self-help routines become one more task. So the useful lines are short and permission-giving: you can stop for today, you can do less, resting is not failing. They should sound like something a kind friend would say, not a motivational poster.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks that punish you for missing a day, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I am tired because I have been carrying a lot, not because I am weak.',
      'Resting is not a reward I have to earn.',
      'I can do less today and still be a responsible person.',
      'Done for today is a real place to stop.',
      'I do not have to feel motivated to take one small next step.',
      'My worth is not measured by my output this week.',
      'I can say "not right now" without a long explanation.',
      'Needing support is a normal part of being human.',
      'One honest break is better than three guilty ones.',
      'I can let tomorrow\'s problems wait until tomorrow.',
    ],
    practice: {
      heading: 'A two-minute end-of-day reset',
      steps: [
        'Write down the one thing that must happen tomorrow, and only one. Everything else goes on a "later" list you do not look at tonight.',
        'Name one small thing that would help your body, such as water, a shower, a stretch, or going to bed ten minutes earlier. Do it if you can.',
        'Read one affirmation from the list twice, slowly. Then put your phone down for a few minutes, if you can.',
      ],
    },
    closing:
      'Related guides: affirmations for anxiety and affirmations for overthinking, linked below. If exhaustion lasts for weeks, affects your health, or comes with hopeless feelings, please talk with a doctor, therapist, or local helpline, and consider speaking with your employer about workload where that is possible. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-loneliness',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for loneliness (2026): kind lines for evenings when you feel alone',
    shortTitle: 'Affirmations for loneliness',
    metaDescription:
      'Kind affirmations for loneliness, plus a two-minute exercise for reaching out in a small way. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so take our view with that in mind. The short version: an affirmation cannot replace people. What it can do is soften the voice that says "something is wrong with me" when you feel alone, so you have a little more energy to reach out.',
      'Loneliness is the gap between the connection you want and the connection you have. It is not the same as being alone, and you can feel it in a crowd, in a relationship, or after moving to a new city. It is common, it is painful, and it often gets louder in the evening and on weekends when the structure of the day falls away.',
      'A trap many people fall into is reading loneliness as proof that they are unlikable. That story makes reaching out feel riskier, which keeps the loneliness going. Lines that help are warm and slightly practical: you are allowed to want company, one small message counts, and connection grows slowly.',
      'Anicca sends one short line at the time of day you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'Feeling lonely does not mean I am unlovable.',
      'Wanting connection is a normal human need.',
      'This feeling is real, and it can change.',
      'I can reach out in a small way today.',
      'A short message counts as a conversation starter.',
      'I do not have to be at my best to deserve company.',
      'Connection grows slowly, and slow is fine.',
      'I can be kind to myself in the meantime.',
      'Some people would be glad to hear from me.',
      'I can spend this evening gently, even if I am by myself.',
    ],
    practice: {
      heading: 'A two-minute small reach-out',
      steps: [
        'Pick one person you have lost touch with, or one you would like to know better. It does not need to be your closest friend.',
        'Write one low-pressure message, such as "I saw this and thought of you" or "How have you been?" You do not have to send it right now, but try to send it today.',
        'Read one affirmation from the list twice, slowly. If sending feels too hard, write the name down for tomorrow and let that be enough for tonight.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for anxiety, linked below. If loneliness is constant, comes with hopeless feelings, or you feel unsafe, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-motivation-when-tired',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for motivation when you are tired (2026): honest lines for low-energy days',
    shortTitle: 'Affirmations for motivation when tired',
    metaDescription:
      'Honest affirmations for finding a little motivation when you are tired, plus a two-minute five-minute-start exercise. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not a neutral source. The short version: when you are genuinely tired, a pep talk will not give you energy. If the tiredness is from lack of sleep or overload, rest comes first. But on an ordinary low-energy day, the right small line can help you make a start, and starting is often the hardest part.',
      'Many people wait for motivation before they begin, then feel worse when it does not show up. In practice, motivation often follows action rather than preceding it. A very small start, such as five minutes, lowers the cost of beginning, and once you are moving the task often feels less heavy. This is a common observation, not a guarantee.',
      'That is why "you can do anything!" lines tend to fail when you are drained. Believable lines work better: they lower the bar, give you permission to do the small version, and separate "I am tired" from "I am failing."',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I do not need to feel ready. I only need to start small.',
      'Five minutes counts as a real start.',
      'Being tired is information, not a verdict on me.',
      'I can do the smaller version of this today.',
      'Progress does not have to look impressive to be progress.',
      'I can begin badly and improve as I go.',
      'I can rest after this one small step.',
      'My energy changes through the day, and that is normal.',
      'I can choose the easiest useful thing first.',
      'Today I am doing what I can, and that is enough.',
    ],
    practice: {
      heading: 'A two-minute five-minute start',
      steps: [
        'Choose one task and shrink it until it feels almost silly, for example "open the document and write one sentence" instead of "finish the report."',
        'Set a timer for five minutes and tell yourself you are allowed to stop when it rings. Often you will keep going, but you do not have to.',
        'Read one affirmation from the list twice, slowly, then start the timer. If you stop at five minutes, that was still a success.',
      ],
    },
    closing:
      'Related guides: affirmations for overthinking and affirmations for self-love, linked below. If you feel tired and unmotivated nearly all the time for weeks, or it comes with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-procrastination',
    jaSlug: 'self-esteem',
    title: 'Affirmations for procrastination (2026): lines that lower the cost of starting',
    shortTitle: 'Affirmations for procrastination',
    metaDescription:
      'Honest affirmations for procrastination, plus a two-minute exercise for starting the task you keep avoiding. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we have a stake in this topic. The short version first: affirmations will not do the task for you. What they can do is soften the self-criticism that often sits on top of procrastination, so starting feels a little less heavy.',
      'Procrastination is often less about time management and more about avoiding a feeling: boredom, fear of doing it badly, or the sense that the task is too big. Putting it off gives short relief, then guilt arrives, and the guilt makes the task feel even worse. That loop is common, and it is not a sign that you are lazy.',
      'That is why "just do it" lines tend to bounce off. Lines that work better are small and permission-giving: you can start badly, you can do ten minutes, and you can feel resistance and begin anyway.',
      'Anicca sends one short line at the time of day you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can start before I feel ready.',
      'Ten minutes of imperfect work is better than zero minutes of perfect planning.',
      'Avoiding this task does not make me a bad person.',
      'I can feel resistance and still take one small step.',
      'The first version is allowed to be rough.',
      'I can break this into a piece small enough to begin now.',
      'Guilt is not a useful way to get started. Kindness is.',
      'I can begin with the easiest part.',
      'Starting is the hard part, and I only need to do that part right now.',
      'I can pick this up again tomorrow without punishing myself.',
    ],
    practice: {
      heading: 'A two-minute smallest-next-step exercise',
      steps: [
        'Name the task you are avoiding in one plain sentence, then write the very first physical action, such as "open the file" or "write the subject line."',
        'Say out loud what feeling you are avoiding, for example "I am worried it will not be good." Naming it does not fix it, but it often loosens it a little.',
        'Read one affirmation from the list twice, slowly, then do the first action for just five minutes. You are allowed to stop when the timer ends.',
      ],
    },
    closing:
      'Related guides: affirmations for motivation when tired and affirmations for overthinking, linked below. If you are unable to start things for weeks, or it comes with persistent low mood or hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-self-worth',
    jaSlug: 'self-esteem',
    title: 'Affirmations for self-worth (2026): lines that do not depend on what you achieved today',
    shortTitle: 'Affirmations for self-worth',
    metaDescription:
      'Grounded affirmations for self-worth, plus a two-minute exercise for separating your value from your output. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The short version: repeating "I am worthy" will not by itself change how you feel. It tends to help more when the line is believable and you pair it with small actions that match it.',
      'Low self-worth often comes from conditional rules learned early: I am okay when I perform, when people approve, or when I do not make mistakes. When worth is tied to results, every bad day becomes a verdict, and every good day feels temporary.',
      'Lines that help are steady rather than grand. They say that worth is not earned daily, that you can be imperfect and still deserve care, and that you can treat yourself the way you would treat a friend in the same spot.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'My worth is not a score I have to keep up.',
      'I can be imperfect and still deserve kindness.',
      'I do not have to earn rest or respect every single day.',
      'A mistake is something I did, not something I am.',
      'I can speak to myself the way I would speak to a friend.',
      'I am allowed to have needs.',
      'Other people\'s opinions are information, not a ruling on my value.',
      'I can take one small action today that is good for me.',
      'I am more than my productivity.',
      'I can keep practicing this, even if I only half believe it today.',
    ],
    practice: {
      heading: 'A two-minute friend-voice exercise',
      steps: [
        'Write down the harshest thing you said to yourself today, word for word.',
        'Imagine a friend said that same thing about themselves. Write what you would honestly tell them back, in one or two plain sentences.',
        'Read one affirmation from the list twice, slowly, then reread your friend-voice reply once.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for imposter syndrome, linked below. If feelings of worthlessness are constant, last for weeks, or come with hopeless feelings or thoughts of self-harm, please talk with a doctor, therapist, or local helpline right away. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-perfectionism',
    jaSlug: 'self-esteem',
    title: 'Affirmations for perfectionism (2026): lines for when "good enough" feels unsafe',
    shortTitle: 'Affirmations for perfectionism',
    metaDescription:
      'Calm affirmations for perfectionism, plus a two-minute exercise for shipping something good enough. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we have a stake here. The short version: affirmations will not remove high standards, and you may not want them to. They can help with the harsh part, the voice that treats every flaw as a failure.',
      'Perfectionism is often described as setting very high standards combined with harsh self-judgment when they are missed. It can look like rewriting things many times, avoiding starting, or never feeling finished. It can come from a wish to be safe from criticism, which is understandable.',
      'The cost is that it eats time and energy and can feed procrastination. Lines that help are not "lower your standards"; they separate quality from fear. Good enough for now can be a real, deliberate choice.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'Good enough for now is a real choice, not a failure.',
      'I can do careful work without demanding flawlessness.',
      'A flaw is not the same as a failure.',
      'I can finish something and improve it later.',
      'My standards can be high and my voice can still be kind.',
      'Mistakes are part of how I learn this.',
      'I can let one thing be imperfect today.',
      'Done is a useful place to be.',
      'People rarely notice what I am afraid they will notice.',
      'I can be proud of effort, not only of outcomes.',
    ],
    practice: {
      heading: 'A two-minute good-enough check',
      steps: [
        'Pick the thing you are polishing and write what "good enough for its purpose" would honestly look like in one sentence.',
        'List the one or two changes that would matter to the person who will use it. Ignore the rest for now.',
        'Read one affirmation from the list twice, slowly, then make those changes only and set a stopping time.',
      ],
    },
    closing:
      'Related guides: affirmations for procrastination and affirmations for self-worth, linked below. If perfectionism causes constant distress, affects your health or sleep, or comes with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-fear-of-failure',
    jaSlug: 'self-esteem',
    title: 'Affirmations for fear of failure (2026): lines for trying when you might get it wrong',
    shortTitle: 'Affirmations for fear of failure',
    metaDescription:
      'Steady affirmations for fear of failure, plus a two-minute exercise for taking one small risk. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so take our view with that in mind. The short version: an affirmation will not guarantee success. It can make the cost of trying feel a little smaller, which is often what is needed to begin.',
      'Fear of failure is the worry that getting something wrong will say something bad about you, or cost you respect. It is common and it often shows up as avoidance, over-preparing, or not trying at all. Avoiding the risk feels safe in the moment but can keep you from things you care about.',
      'Believable lines separate the outcome from your worth. They admit that failing is uncomfortable, and that you can survive it, learn from it, and try again. They do not promise it will go well.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can try something and not know how it will turn out.',
      'A failed attempt is information, not a verdict on me.',
      'I have been uncomfortable before and I got through it.',
      'I can take a small risk today.',
      'Not trying is also a choice with a cost.',
      'My worth does not ride on this result.',
      'I can learn from this and try again.',
      'It is okay to be nervous and begin anyway.',
      'I can prepare enough and then let it go.',
      'Even if this does not work, I will still be okay.',
    ],
    practice: {
      heading: 'A two-minute worst-case, then next-step exercise',
      steps: [
        'Write the worst realistic outcome in one sentence, then write how you would cope with it, even roughly.',
        'Write one small, low-stakes version of the attempt that you could do in the next day, such as sending a draft to one person.',
        'Read one affirmation from the list twice, slowly, then schedule that small step in your calendar.',
      ],
    },
    closing:
      'Related guides: affirmations for perfectionism and affirmations for anxiety, linked below. If fear keeps you from daily life for weeks, or comes with panic or hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmation-app-no-streaks',
    jaSlug: 'night-anxiety',
    title: 'Affirmation app with no streaks',
    shortTitle: 'Affirmation app with no streaks',
    metaDescription:
      'Looking for an affirmation app with no streaks? Anicca is a free-to-download iPhone affirmation app that sends one kind line when you need it — no streak counters, no guilt for missing a day.',
    h1: 'affirmation app with no streaks',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'An affirmation app with no streaks is one that does not punish you for missing a day with a broken counter or a guilt notification.',
      'Anicca is a free-to-download iPhone affirmation app that sends one short, kind line at the time you tend to spiral, across 13 self-care topics, with no streaks.',
      'If you want kindness without a productivity scoresheet, download Anicca from the App Store and set one reminder time that matches your real day.',
    ],
    whyItHappens: [
      'Many habit apps treat a missed day as a failure: the streak resets, the badge disappears, and the next open becomes a lecture. For affirmations, that design often backfires. The people who reach for a kind line are often already hard on themselves. Adding a scoreboard turns self-care into another chore they can “fail.”',
      'A no-streak affirmation app keeps the practice optional. You can miss Tuesday and still open Wednesday without a broken chain. The point is a usable sentence when your mind spirals — not a perfect calendar.',
      'Anicca’s public App Store listing (id6755129214, checked 2026-10-15) describes the product as free to download with an optional subscription, and states there are no streaks and no “you missed a day” guilt. Use the lines below when you want words without a counter.',
    ],
    affirmations: [
      'Missing a day does not erase the kindness I already practiced.',
      'I can open this app without earning a perfect week first.',
      'A streak is optional. Softness is not.',
      'I am allowed to return without apologizing to a counter.',
      'One honest line today is enough.',
      'I do not have to perform self-care to deserve it.',
      'Quiet days still count as being human.',
      'I can start again midweek with no backlog.',
      'Guilt is not a useful coach for kindness.',
      'I show up when I can, and that is still a practice.',
    ],
    practice: {
      heading: 'A two-minute no-streak reset',
      steps: [
        'If you missed days, name it once without a speech: “I was away.” Then stop explaining.',
        'Pick one affirmation from the list. Read it twice. Do not add a make-up session for the days you skipped.',
        'Optional: set a single daily reminder in Anicca for a time you already tend to spiral — not five reminders that recreate pressure.',
      ],
    },
    faq: [
      {
        q: 'What does “no streaks” mean in an affirmation app?',
        a: 'It means the app does not track a unbroken daily chain that resets when you miss a day. You can skip and return without a guilt scoreboard.',
      },
      {
        q: 'Does Anicca have streaks?',
        a: 'No. Anicca’s App Store listing (id6755129214, checked 2026-10-15) states there are no streaks and no “you missed a day” guilt. It is free to download with an optional subscription.',
      },
      {
        q: 'Is Anicca only for iPhone?',
        a: 'Yes. Anicca is listed on the App Store for iPhone as “Daily Affirmations - Anicca.” This page is about that product, not a cross-platform claim.',
      },
    ],
    closing:
      'Related guides: affirmations for overthinking at night and affirmation reminders throughout the day, linked below. Anicca is a self-care app, not medical advice.',
  },
  {
    slug: 'affirmations-for-overthinking-at-night',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for overthinking at night',
    shortTitle: 'Affirmations for overthinking at night',
    metaDescription:
      'Short affirmations for overthinking at night, plus a two-minute wind-down. Anicca is a free-to-download iPhone affirmation app with no streaks that can send one kind line late in the evening.',
    h1: 'affirmations for overthinking at night',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'Affirmations for overthinking at night are short, believable lines you can use when the unfinished day gets loud and sleep feels far away.',
      'They will not delete every worry; they can interrupt the tenth lap of the same thought so your body has a smaller place to land.',
      'Anicca is a free-to-download iPhone affirmation app with no streaks that can send one kind line at the hour you tend to spiral — including late night.',
    ],
    whyItHappens: [
      'Night removes the daytime interruptions that kept worry on pause. Without meetings and errands, the mind often replays messages, deadlines, and “what if” scenes. That does not mean you failed the day. It means your nervous system still has energy with nowhere useful to spend it.',
      'Overthinking at night is usually a search for certainty before sleep. Affirmations work best when they are modest: not “everything is fine,” but “I do not have to solve tonight to deserve rest.” Believeable beats dramatic.',
      'Anicca covers 13 self-care topics and, per its App Store listing (id6755129214, checked 2026-10-15), is free to download with an optional subscription and has no streaks. Use the lines below as bookmarks for 11:47 p.m., with or without the app.',
    ],
    affirmations: [
      'I do not have to solve tonight to deserve rest.',
      'This worry is loud, not always true.',
      'One slow breath is enough for this minute.',
      'Lying down counts, even if sleep is late.',
      'Thoughts can visit without moving in.',
      'Morning-me will not punish night-me for needing quiet.',
      'I can put the phone down and feel the weight of my body.',
      'Scary imagination and this dark room are not the same place.',
      'Peace does not require a finished checklist.',
      'I can meet this thought once and leave it here.',
    ],
    practice: {
      heading: 'A two-minute night wind-down',
      steps: [
        'Lie still. Name three things you can feel (sheet, pillow, air). No fixing — only noticing.',
        'Pick one affirmation. Say it once out loud or in a whisper. If it feels fake, soften it until it is believable.',
        'Exhale longer than you inhale, twice. Then stop. If the mind returns, use the same line once more and leave it there.',
      ],
    },
    faq: [
      {
        q: 'Do affirmations stop nighttime overthinking?',
        a: 'Not always. They are a small interruption, not a cure. Many people find a short, honest line shortens the argument with worry long enough to rest.',
      },
      {
        q: 'When should I read affirmations at night?',
        a: 'When the loop starts — often after you put the phone down — not as a long extra routine. One or two lines is enough.',
      },
      {
        q: 'Can Anicca send a line at night?',
        a: 'Yes. Anicca is built to send one short affirmation at a time you choose or tend to spiral. Check the latest details on the App Store listing for Daily Affirmations - Anicca (id6755129214).',
      },
    ],
    closing:
      'If nights keep feeling unbearable, reach out to someone you trust or a local crisis line. This page is self-care copy for an affirmation app — not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmation-reminders-throughout-the-day',
    jaSlug: 'morning',
    title: 'Affirmation reminders throughout the day on iPhone',
    shortTitle: 'Affirmation reminders throughout the day',
    metaDescription:
      'Want affirmation reminders throughout the day on iPhone? Anicca sends one short, kind line at the time you tend to spiral — free to download, no streaks, optional subscription.',
    h1: 'affirmation reminders throughout the day iphone',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'Affirmation reminders throughout the day on iPhone are scheduled notifications that bring a short line to you, so you do not have to remember to open an app.',
      'Anicca is a free-to-download iPhone affirmation app that sends one kind line at the moment you tend to spiral, across 13 self-care topics, with no streaks.',
      'If you want reminders that feel like a friend instead of a habit scoreboard, set one or a few times that match your real day and keep the wording believable.',
    ],
    whyItHappens: [
      'The hardest part of affirmations is rarely finding a nice sentence. It is remembering them when your attention is already spent. A library you never open does little on a hard Tuesday afternoon.',
      'Reminders work better when they match real friction points — after lunch, before a meeting, late evening — rather than flooding the lock screen every hour until you mute everything.',
      'Anicca’s App Store listing (id6755129214, checked 2026-10-15) describes smart timing and daily affirmation cards, free download with an optional subscription, and no streaks. Other apps also offer reminders; pick the style that fits you. Links to honest comparison pages for I Am and ThinkUp are below.',
    ],
    affirmations: [
      'This reminder is a pause, not a test.',
      'I can take one kind sentence and return to my day.',
      'I do not need a perfect routine to use a reminder.',
      'One line at the right time is enough.',
      'I can silence extras and keep the one that helps.',
      'A notification can be soft, not urgent.',
      'I am allowed to change the time until it fits.',
      'Kindness on a schedule still counts as kindness.',
      'I can read this once and put the phone down.',
      'My day does not have to be optimized to include care.',
    ],
    practice: {
      heading: 'A two-minute reminder setup',
      steps: [
        'Pick the one time of day your mind usually gets harsh (not five times). Write it down.',
        'Choose one affirmation from the list — or write a cousin that sounds like you.',
        'In Anicca (or your reminder app), set that single time. Live with it for three days before adding more.',
      ],
    },
    faq: [
      {
        q: 'How many affirmation reminders per day is useful?',
        a: 'Start with one. Many people mute apps that ping constantly. Add a second time only if the first one already helps.',
      },
      {
        q: 'Does Anicca send reminders on iPhone?',
        a: 'Yes. Anicca is an iPhone app listed on the App Store as “Daily Affirmations - Anicca” (id6755129214). It is built around delivering one short line when you need it.',
      },
      {
        q: 'Do I need a subscription for reminders?',
        a: 'Anicca is free to download with an optional subscription for the full proactive experience. Exact entitlements can change; check the current App Store purchase screen for what is included.',
      },
    ],
    closing:
      'Related guides: affirmation app with no streaks, I Am app alternative, and ThinkUp alternative, linked below. Anicca is a self-care app, not medical advice.',
  },
  {
    slug: 'i-am-app-alternative',
    jaSlug: 'self-esteem',
    title: 'I Am app alternative (2026): no-streak daily affirmations on iPhone',
    shortTitle: 'I Am app alternative',
    metaDescription:
      'Looking for an I Am app alternative? A dated side-by-side of I am - Daily Affirmations and Anicca: widgets and many reminders vs one timed line with no streaks. Public App Store facts only, links to both.',
    h1: 'I Am app alternative',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'If you are searching for an I Am app alternative, you likely want daily affirmations on iPhone with a different reminder style, tone, or pressure level.',
      'I am - Daily Affirmations (Monkey Taps) and Anicca (Daily Affirmations - Anicca) are both free-to-download Health & Fitness apps with optional in-app purchases; they emphasize different workflows.',
      'Below is a neutral, dated summary of what each public App Store page says it focuses on, plus links to both listings so you can verify.',
    ],
    whyItHappens: [
      '“I Am app” usually refers to I am - Daily Affirmations by Monkey Taps on the App Store (id874656917). People look for alternatives when they want fewer widgets, a quieter tone, no streak pressure, or a single well-timed line instead of many reminders.',
      'This page is written by the maker of Anicca. That is a conflict of interest. To keep it honest, competitor details below are limited to what appears on the public US App Store page, and they are dated. We do not invent ratings, download counts, or prices.',
      'Read both listings yourself before you decide. Preferences about widgets, voice recording, streaks, and notification volume are personal.',
    ],
    affirmations: [],
    practice: {
      heading: 'How to choose in two minutes',
      steps: [
        'Open both App Store links below. Skim the current description and screenshots only — ignore third-party “download count” sites.',
        'Ask which workflow you want: widgets and many reminders (I am), or one timed line without streaks (Anicca’s stated focus).',
        'Download the free tier of the one that matches. You can delete it later; you do not owe either app a long trial.',
      ],
    },
    comparison: {
      competitorName: 'I am - Daily Affirmations',
      competitorStoreUrl:
        'https://apps.apple.com/us/app/i-am-daily-affirmations/id874656917',
      sourcedAsOf: '2026-10-15',
      competitorFocus: [
        'Developer listed as Monkey Taps; category Health & Fitness; listed as Free with In-App Purchases (US App Store page, 2026-10-15).',
        'Listing copy emphasizes daily affirmations, positive widgets, Lock Screen affirmations, Home Screen widgets, daily intentions, and reminders delivered throughout the day.',
        'Premium is described as lifetime, monthly, and yearly auto-renewable subscription options; this page does not repeat dollar amounts because store prices vary by region and time.',
      ],
      aniccaFocus: [
        'Developer listed as Daisuke Narita; “Daily Affirmations - Anicca” (id6755129214); category Health & Fitness; Free with optional subscription (US App Store / iTunes lookup, 2026-10-15).',
        'Listing copy emphasizes one kind line when the mind spirals, 13 self-care themes, smart timing, and explicitly “no streaks” / no “you missed a day” guilt.',
        'Positioned as a self-care companion, not medical advice. Exact subscription prices are shown on the purchase screen and can vary by region.',
      ],
    },
    faq: [
      {
        q: 'Is Anicca a drop-in replacement for I am - Daily Affirmations?',
        a: 'Not exactly. I am’s public listing emphasizes widgets and reminders throughout the day. Anicca’s listing emphasizes one timed line and no streaks. Try the free download of each if you are unsure.',
      },
      {
        q: 'Where did these comparison facts come from?',
        a: 'From the public US App Store pages / iTunes lookup for id874656917 (I am) and id6755129214 (Anicca), read on 2026-10-15. We omit ratings tallies and dollar prices here so this page does not go stale or invent numbers.',
      },
      {
        q: 'Is there a free I Am app alternative?',
        a: 'Both I am - Daily Affirmations and Anicca are free to download on the App Store, with optional paid plans. If you mainly want fewer notifications and no streak count, Anicca’s free download sends one line at the time you choose.',
      },
      {
        q: 'Who wrote this page?',
        a: 'The maker of Anicca. That is disclosed on purpose. Links to both App Store pages are included so you can verify independently.',
      },
    ],
    closing:
      'Links: I am - Daily Affirmations on the App Store, and Anicca below. This is not medical advice. Store details can change; re-check the live listings.',
  },
  {
    slug: 'thinkup-alternative',
    jaSlug: 'self-esteem',
    title: 'ThinkUp alternative: a neutral comparison with Anicca',
    shortTitle: 'ThinkUp alternative',
    metaDescription:
      'Neutral comparison of ThinkUp and Anicca, based on public App Store listing facts only (dated). Links to both apps. No invented ratings, counts, or prices.',
    h1: 'ThinkUp alternative',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'If you want a ThinkUp alternative, you may want daily affirmations without recording your own voice, or a quieter reminder style on iPhone.',
      'ThinkUp-Daily Affirmations app (Precise Wellness LLC) and Anicca (Daily Affirmations - Anicca) are both free-to-download Health & Fitness apps with optional in-app purchases; they emphasize different workflows.',
      'Below is a neutral, dated summary of what each public App Store page says it focuses on, plus links to both listings so you can verify.',
    ],
    whyItHappens: [
      'ThinkUp on the App Store is listed as ThinkUp-Daily Affirmations app by Precise Wellness LLC (id906660772). People look for alternatives when they prefer not to record audio, do not want Health-app practice tracking, or want a single proactive line instead of a listen-and-repeat session.',
      'This page is written by the maker of Anicca. That is a conflict of interest. Competitor details below are limited to the public US App Store page and are dated. We do not invent ratings, download counts, or prices.',
      'Open both listings and decide from the current screenshots and description. Neither app replaces therapy or medical care.',
    ],
    affirmations: [],
    practice: {
      heading: 'How to choose in two minutes',
      steps: [
        'Open both App Store links. Skim what each app asks you to do daily (record-and-listen vs receive one line).',
        'If you want your own voice plus music loops, ThinkUp’s listing matches that focus. If you want one timed line with no streaks, Anicca’s listing matches that focus.',
        'Download one free tier first. Switch later if the daily friction is wrong for you.',
      ],
    },
    comparison: {
      competitorName: 'ThinkUp-Daily Affirmations app',
      competitorStoreUrl:
        'https://apps.apple.com/us/app/thinkup-daily-affirmations-app/id906660772',
      sourcedAsOf: '2026-10-15',
      competitorFocus: [
        'Developer listed as Precise Wellness LLC; category Health & Fitness; listed as Free with In-App Purchases (US App Store page, 2026-10-15).',
        'Listing copy emphasizes selecting or creating affirmations, recording them in your own voice, adding images and music, notifications, and listening daily; also mentions Apple Health Mindful Minutes tracking.',
        'Free vs premium is described in the listing (e.g. limited recordings on free); this page does not repeat dollar amounts because store prices vary by region and time.',
      ],
      aniccaFocus: [
        'Developer listed as Daisuke Narita; “Daily Affirmations - Anicca” (id6755129214); category Health & Fitness; Free with optional subscription (US App Store / iTunes lookup, 2026-10-15).',
        'Listing copy emphasizes one kind line when the mind spirals, 13 self-care themes, smart timing, and explicitly “no streaks” / no “you missed a day” guilt.',
        'Positioned as a self-care companion, not medical advice. Exact subscription prices are shown on the purchase screen and can vary by region.',
      ],
    },
    faq: [
      {
        q: 'Does Anicca let me record affirmations in my own voice?',
        a: 'Anicca’s public listing focuses on delivered affirmation cards and timed lines, not on recording your own voice library. ThinkUp’s listing emphasizes voice recording. Choose based on which workflow you want.',
      },
      {
        q: 'Where did these comparison facts come from?',
        a: 'From the public US App Store pages / iTunes lookup for id906660772 (ThinkUp) and id6755129214 (Anicca), read on 2026-10-15. Ratings tallies and dollar prices are omitted here on purpose.',
      },
      {
        q: 'Who wrote this page?',
        a: 'The maker of Anicca. That is disclosed on purpose. Links to both App Store pages are included so you can verify independently.',
      },
    ],
    closing:
      'Links: ThinkUp on the App Store, and Anicca below. This is not medical advice. Store details can change; re-check the live listings.',
  },
  {
    slug: 'affirmations-for-sunday-scaries',
    jaSlug: 'sunday-scaries',
    title: 'Affirmations for Sunday scaries (2026): lines for the dread before Monday',
    shortTitle: 'Affirmations for Sunday scaries',
    metaDescription:
      'Calm affirmations for Sunday scaries, plus a two-minute exercise for easing Monday dread. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we have a stake in this topic. The short version first: affirmations will not change your job or your Monday. They can make the dread a little quieter so Sunday evening is less of a loss.',
      'Sunday scaries are the anxious, heavy feeling many people get as the weekend ends. It often comes from anticipating the week: an unfinished task, a hard conversation, or a long to-do list your mind keeps rehearsing. Dreading the future steals the present, which makes the last hours of the weekend feel worse.',
      'Lines that help are modest. They do not claim Monday will be great. They acknowledge the dread, remind you that the week arrives one task at a time, and give you permission to enjoy what is left of today.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I do not have to solve the whole week tonight.',
      'It is okay to feel dread and still enjoy this evening.',
      'Monday will come one task at a time.',
      'I have handled hard weeks before.',
      'My worries are not a forecast.',
      'I can write the worry down and let it wait until morning.',
      'I can choose one small thing tonight that makes tomorrow easier.',
      'Resting now is part of being ready later.',
      'I do not need to have every answer before the week begins.',
      'I can be gentle with myself as the weekend ends.',
    ],
    practice: {
      heading: 'A two-minute Sunday-evening reset',
      steps: [
        'Write the one or two things about Monday that are worrying you most, in plain words. Next to each, write one small first action, or "nothing to do tonight."',
        'Pick one thing from the week that you are looking forward to or can tolerate, even something small like a coffee.',
        'Read one affirmation from the list twice, slowly, then close the list and do something you enjoy for the next ten minutes.',
      ],
    },
    closing:
      'Related guides: affirmations for overthinking at night and affirmations for anxiety, linked below. If dread about work is constant, affects your sleep or health for weeks, or comes with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-social-anxiety-at-work',
    jaSlug: 'social-anxiety-at-work',
    title: 'Affirmations for social anxiety at work (2026): lines for meetings, chat, and small talk',
    shortTitle: 'Affirmations for social anxiety at work',
    metaDescription:
      'Steady affirmations for social anxiety at work, plus a two-minute exercise before a meeting or conversation. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The short version: affirmations will not remove nerves or replace professional support. They can give you a calmer thing to say to yourself right before a meeting, a message, or a conversation.',
      'Social anxiety at work often looks like rehearsing what to say, staying quiet in meetings, avoiding small talk, or replaying a conversation afterward. It is common, and it usually comes from a fear of being judged rather than from any lack of ability.',
      'Lines that help are realistic. They do not say you will feel confident. They say you can be nervous and still speak, that a pause or an imperfect sentence is fine, and that people are mostly thinking about their own work.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can be nervous and still speak.',
      'I belong in this meeting.',
      'A short answer is a good answer.',
      'People are mostly focused on their own work, not on mine.',
      'A pause is fine. I can take a breath before I speak.',
      'I do not have to say something perfect.',
      'One awkward moment does not define how I am seen.',
      'I can ask a question without apologizing for it.',
      'I can let the conversation go once it is over.',
      'Each small step at work counts, even the quiet ones.',
    ],
    practice: {
      heading: 'A two-minute pre-meeting steadying exercise',
      steps: [
        'Breathe out slowly for a count of six, three times, with your feet flat on the floor.',
        'Decide on one small contribution, such as one question or one sentence you will say, and write it down in plain words.',
        'Read one affirmation from the list twice, slowly, then go in knowing that one sentence is enough.',
      ],
    },
    closing:
      'Related guides: affirmations for anxiety and affirmations for imposter syndrome, linked below. If anxiety keeps you from working or from daily life for weeks, or comes with panic or hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'do-affirmations-help-anxiety',
    jaSlug: 'self-esteem',
    title: 'Do affirmations help anxiety? An honest answer (2026), plus lines to try',
    shortTitle: 'Do affirmations help anxiety?',
    metaDescription:
      'Do affirmations help anxiety? An honest answer: what they can and cannot do, which kinds of lines tend to work better, and a two-minute exercise. From the maker of Anicca, a free-to-download iPhone app.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The honest short answer: affirmations are not a treatment for anxiety, and they will not make it disappear. For some people they are a small, calming habit that changes what you say to yourself in a tense moment.',
      'What they seem to do best is interrupt a loop. Anxious thinking tends to repeat the same worst-case sentence. Replacing it with a steadier, believable sentence gives your mind something else to hold for a moment. It is a pause, not a cure.',
      'Lines tend to work better when you can believe them. "I am completely calm" often rings false when you are not, and can make you feel worse. Modest lines such as "I can feel anxious and still take the next step" are easier to accept because they do not argue with how you feel.',
      'They also work best alongside other basics: slow breathing, sleep, movement, talking with someone you trust. If anxiety is frequent or heavy, professional support such as therapy is the thing with real evidence behind it, and affirmations are at most a companion to it.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can feel anxious and still take the next step.',
      'This feeling is uncomfortable, and it will pass.',
      'I do not have to believe every worried thought.',
      'I only need to handle this moment, not the whole day.',
      'My body is trying to protect me, and I can slow it down with one breath.',
      'I have gotten through anxious moments before.',
      'I can ask for help when I need it.',
      'I do not need to be calm to be okay.',
      'A worry is not a fact.',
      'I can be kind to myself right now.',
    ],
    practice: {
      heading: 'A two-minute way to test it for yourself',
      steps: [
        'Name the worry in one plain sentence, then rate how strong the feeling is from 0 to 10.',
        'Breathe out slowly for a count of six, three times. Then read one line from the list twice, slowly, choosing the one that feels most believable, not the most positive.',
        'Rate the feeling again. If it did not move, that is fine and useful to know: try a different line, a walk, or talking to someone instead.',
      ],
    },
    closing:
      'Related guides: affirmations for anxiety and affirmations for overthinking, linked below. If anxiety is frequent, affects your sleep, work, or health for weeks, or comes with panic or hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
// Batch 8 EN entry for EN_AFFIRMATION_PROBLEMS (apps/landing/lib/en-affirmation-problems.ts). Append verbatim at end of array.
// Target phrase: "affirmations to fall asleep to" (KEYWORDS-2026-10-16.md EN #8). Slug checked absent on origin/main c5bae77 (2026-10-17).
// True ES counterpart: afirmaciones-para-dormir-con-calma (new-entries-es-batch8.ts) -> hreflang en+es+x-default. No JA counterpart.
  {
    slug: 'affirmations-to-fall-asleep-to',
    jaSlug: 'night-anxiety',
    title: 'Affirmations to fall asleep to (2026): calm lines for bedtime, plus a two-minute wind-down',
    shortTitle: 'Affirmations to fall asleep to',
    metaDescription:
      'Calm affirmations to fall asleep to, how to use them at bedtime, and a two-minute wind-down. From the maker of Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The honest short answer: affirmations will not put you to sleep on command, and they are not a treatment for sleep problems. For some people, a few quiet lines at bedtime are a gentle way to set the day down.',
      'A common reason sleep stalls is a busy mind: replaying the day, rehearsing tomorrow, or arguing with a worry. A short, steady sentence gives your mind something simple to rest on instead of the loop. It is a pause, not a switch.',
      'Lines tend to work better when they are soft and believable. "I will sleep perfectly tonight" can create pressure. Lines like "I do not have to solve tomorrow tonight" or "Resting is enough for now" do not demand a result, so there is nothing to fail at.',
      'Keep it low-stimulation: dim light, phone on night mode or set down after reading a line, and a slow pace. Affirmations sit alongside the basics, such as a regular schedule, a dark and cool room, and winding down before bed.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I do not have to solve tomorrow tonight.',
      'Resting is enough for now.',
      'I did what I could today, and that counts.',
      'My thoughts can wait until morning.',
      'I can let my shoulders drop and breathe out slowly.',
      'I do not have to force sleep. I can simply lie here and rest.',
      'The day is finished, and I am allowed to put it down.',
      'Worries can be written down and left for tomorrow.',
      'I am safe to slow down right now.',
      'I can be kind to myself tonight.',
    ],
    practice: {
      heading: 'A two-minute wind-down before sleep',
      steps: [
        'Write one unfinished thing on paper, with a first step for tomorrow if you like, so your mind does not have to hold it overnight.',
        'Breathe out slowly for a count of six, three times, with your shoulders loose.',
        'Read one line from the list, slowly, twice. Put the phone down and keep the lights low. If you are still awake, that is okay: rest quietly instead of trying to force sleep.',
      ],
    },
    closing:
      'Related guides: affirmations for overthinking at night and affirmations for anxiety, linked below. If trouble sleeping lasts for weeks, affects your daytime life or health, or comes with low mood or panic, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
// Target query: "morning affirmations" (2026-11-02). Winners copied: answer-first definition, grouped short lines, before-the-phone routine, "how many" FAQ (see team/marketing/SEO-WINNERS.md).
  {
    slug: 'morning-affirmations',
    jaSlug: 'self-esteem',
    title: 'Morning affirmations (2026): 12 calm lines to start the day, plus a two-minute routine',
    shortTitle: 'Morning affirmations',
    h1: 'Morning affirmations: 12 calm, believable lines to start the day',
    metaDescription:
      'Morning affirmations are short, present-tense lines you say soon after waking to set the tone for the day. Here are 12 calm, believable ones, how many to use, and a two-minute routine before you check your phone. From Anicca, a free-to-download iPhone affirmation app with no streaks.',
    directAnswer: [
      'Morning affirmations are short, first-person, present-tense sentences you say soon after waking, before messages and news set the tone for you. The ones that tend to work are calm and believable, such as "I can take today one step at a time," not lines that argue with how you feel. Pick one to three, say each slowly, and come back to one of them later in the day.',
    ],
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The honest short answer: a morning affirmation will not change your day by itself, and it is not a treatment for low mood or anxiety. For some people it is a small, steady way to choose the first sentence of the day instead of letting a notification choose it.',
      'Mornings matter because the first things you read often set the emotional tone. Scrolling news or social feeds first tends to pull attention toward comparison and urgency. One chosen line, read before the phone, gives your mind a calmer starting point.',
      'Lines tend to work better when you can believe them today. "Today will be perfect" can feel false on a hard morning. Modest lines such as "I can do the next small thing" or "I do not have to feel ready to begin" do not demand a result, so there is nothing to fail at.',
      'Fewer is better. Most people remember one to three lines; a list of fifty is easy to read and easy to forget. Keep the one that lands and bring it back at midday, which is where a reminder helps more than willpower.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can take today one step at a time.',
      'I do not have to feel ready to begin.',
      'I can do the next small thing.',
      'Today does not need to be perfect to be good.',
      'I have handled hard mornings before.',
      'I am allowed to start slowly.',
      'I can choose where my attention goes first.',
      'One kind sentence to myself is a good start.',
      'I can be calm and still get things done.',
      'Whatever happens today, I can come back to my breath.',
      'I do not need to finish everything today.',
      'I am grateful for one small thing this morning.',
    ],
    practice: {
      heading: 'A two-minute morning routine, before you check your phone',
      steps: [
        'Before opening messages or news, sit up, put both feet on the floor, and breathe out slowly for a count of six, three times.',
        'Read the list once and pick one line that feels believable today, not the most positive one. Say it slowly, out loud or quietly, twice.',
        'Write that line on paper or set it as a midday reminder, so you meet it again when the day gets busy. If it stops fitting, swap it for another line tomorrow.',
      ],
    },
    faq: [
      {
        q: 'What are morning affirmations?',
        a: 'Morning affirmations are short, first-person, present-tense sentences you say soon after waking, before messages and news set the tone. Calm, believable lines tend to work better than lines that argue with how you feel.',
      },
      {
        q: 'What are good morning affirmations to start the day?',
        a: 'Short, believable lines, for example: "I can take today one step at a time." "I do not have to feel ready to begin." "I can do the next small thing." Pick one to three and say each slowly.',
      },
      {
        q: 'How many morning affirmations should I say?',
        a: 'One to three is enough. A short set is easier to remember and bring back later in the day than a long list read once and forgotten.',
      },
      {
        q: 'Should I say affirmations before checking my phone?',
        a: 'If you can, yes. The first things you read often set the emotional tone, and news or social feeds tend to pull attention toward comparison and urgency. One chosen line first gives you a calmer starting point.',
      },
      {
        q: 'Is the Anicca affirmation app free?',
        a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.',
      },
    ],
    campaignPrefix: 'seo_geo',
    closing:
      'Related guides: affirmations for motivation when tired and affirmations to fall asleep to, linked below. If low mood or anxiety makes mornings hard for weeks, or comes with hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
// Target query: "affirmations for stress" (2026-11-03). Winners copied: numbered lines each with a one-line why (insighttimer.com/blog/affirmations-for-stress-relief), pairing a line with the out-breath (health.clevelandclinic.org/do-positive-affirmations-work), "this is temporary" and control/no-control lines, short twice-a-day practice (www2.hse.ie balancing-stress exercises). See team/marketing/SEO-WINNERS.md.
  {
    slug: 'affirmations-for-stress',
    jaSlug: 'night-anxiety',
    title: 'Affirmations for stress (2026): 12 calm lines and a one-minute breathing reset',
    shortTitle: 'Affirmations for stress',
    h1: 'Affirmations for stress: 12 calm, believable lines for heavy days',
    metaDescription:
      'Affirmations for stress are short, calm sentences you pair with a slow breath when pressure builds. Here are 12 believable ones, why each helps, and a one-minute breathing reset. From Anicca, a free-to-download iPhone affirmation app with no streaks.',
    directAnswer: [
      'The short answer: affirmations for stress work best as a pause, not a pep talk. Pick a calm, believable line such as "This is a lot, and I can take it one piece at a time," and say it slowly on a long out-breath. It will not remove the cause of stress, but it can give you a few seconds of space before you decide what to do next.',
    ],
    whyItHappens: [
      'Full disclosure: this site is run by Anicca, the company that makes the Anicca affirmation app, so we are not neutral. The honest short answer: an affirmation will not fix a heavy workload, money worries or a hard conversation, and it is not a treatment for anxiety or depression. What it can do is interrupt the moment when stress turns into a racing list of everything at once.',
      'Stress tends to narrow attention. The mind jumps between every unfinished task and every possible bad outcome, and the body follows: a tight jaw, raised shoulders, shallow breathing. A short line, said slowly, gives attention one place to land for a moment.',
      'Believable lines tend to help more than big ones. "Everything is perfect" can feel false in the middle of a deadline. Lines that admit the pressure and still point to one next step, such as "I only have to do the next thing," leave nothing to argue with.',
      'Pairing a line with the out-breath is the part most guides agree on. A longer exhale is a simple way many people use to slow down, and saying the line on that exhale ties the words to something your body is already doing.',
      'Anicca sends one short line at the time you choose, covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'This is a lot, and I can take it one piece at a time.',
      'I only have to do the next thing.',
      'This feeling is strong right now, and it will pass.',
      'I can let go of what is not mine to control today.',
      'I can choose how I respond, even if I cannot choose what happens.',
      'Breathing out slowly is a real thing I can do right now.',
      'I am allowed to ask for help or more time.',
      'One unfinished task does not make me a failure.',
      'I have handled stressful days before.',
      'My worth is not measured by how much I get done today.',
      'I can rest for a minute and still be responsible.',
      'Whatever happens next, I can come back to this breath.',
    ],
    practice: {
      heading: 'A one-minute breathing reset with one line',
      steps: [
        'Drop your shoulders and unclench your jaw. Breathe in through your nose for a count of four.',
        'Breathe out slowly for a count of six, and say one line from the list in your head on that out-breath. Repeat three times.',
        'Write down the single next action you can take in the next ten minutes, do only that, and come back to the same line later in the day.',
      ],
    },
    faq: [
      {
        q: 'What are good affirmations for stress?',
        a: 'Calm, believable lines that admit the pressure and point to one next step, for example: "This is a lot, and I can take it one piece at a time." "I only have to do the next thing." "This feeling is strong right now, and it will pass."',
      },
      {
        q: 'Do affirmations help with stress?',
        a: 'They will not remove the cause of stress, and they are not a treatment. Used as a short pause, paired with a slow out-breath, an affirmation can give you a few seconds of space before you decide what to do next.',
      },
      {
        q: 'How do I use affirmations for stress relief?',
        a: 'Breathe in for four counts, breathe out for six, and say one line slowly on the out-breath. Repeat three times, then take one small action. Many people find it easier to remember one line used often than a long list read once.',
      },
      {
        q: 'How often should I say affirmations for stress?',
        a: 'Whenever stress rises, plus once in the morning and once in the evening if you want a routine. A reminder at the time stress usually builds, such as mid-afternoon, helps more than relying on memory.',
      },
      {
        q: 'Is the Anicca affirmation app free?',
        a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.',
      },
    ],
    campaignPrefix: 'seo_geo',
    closing:
      'Related guides: affirmations for anxiety and affirmations for burnout, linked below. If stress lasts for weeks, affects your sleep, appetite or health, or comes with panic or hopeless feelings, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-confidence',
    jaSlug: 'self-esteem',
    title: 'Affirmations for confidence: quiet lines that help you trust yourself',
    h1: 'Affirmations for confidence: quiet lines that help you trust yourself',
    directAnswer: [
      'Affirmations for confidence work best when they sound like a calm friend, not a pep talk. Confidence is mostly trust built from small kept promises, so believable lines such as "I have handled hard things before" land better than "I am unstoppable." Pick one line, say it before the moment that usually shrinks you, then do the small thing.',
    ],
    faq: [
      { q: 'What are good affirmations for confidence?', a: 'Lines that point at evidence work best, for example: "I have handled hard things before." "I can be nervous and still begin." "My voice does not need to be the loudest to count." Choose one that feels almost true, not one that feels like a costume.' },
      { q: 'Do affirmations really build confidence?', a: 'A sentence alone does not build confidence; kept promises do. An affirmation helps by choosing the thought you act from. Say the line, then take the small action it points to — sending the message, raising the hand, starting the first five minutes. The action becomes the evidence the next line stands on.' },
      { q: 'How do I use affirmations for confidence in two minutes?', a: 'Name the moment ahead of you in one plain sentence. Read one affirmation slowly, twice. Then decide the smallest visible step you will take in that moment, such as asking one question or opening the document. Small and done beats big and imagined.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for confidence',
    metaDescription:
      '10 believable affirmations for confidence, built on small kept promises instead of hype, plus a two-minute practice for moments that shrink you. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Confidence rarely disappears all at once. It leaks out in small moments: the meeting where you rehearse a sentence three times and never say it, the message you rewrite until it says almost nothing, the opportunity you talk yourself out of before anyone else can. Underneath is usually not a lack of ability. It is a habit of treating your own voice as the least reliable one in the room.',
      'It helps to separate confidence from volume. The loudest person is not the most sure; they are often just the most practiced at sounding sure. Real confidence is quieter: it is the memory of times you were scared and did the thing anyway, badly at first, and survived it. That memory is built, not born. Every small kept promise — the email sent, the class attended, the boundary said out loud — is a deposit.',
      'This is why loud affirmations often bounce off. "I am a powerhouse" feels false on a Tuesday morning, and your mind argues with it, which leaves you less sure than before. Lines that work are closer to the ground: specific, believable, and tied to evidence you already have. You are not trying to become a different person. You are reminding the person you already are of what she or he has already done.',
      'Anicca is an iPhone affirmation app built around that idea. It sends one short line at the time you choose — before work, before the hard conversation, on the train — instead of asking you to open a library and motivate yourself. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I have handled hard things before, and I remember how.',
      'I can be nervous and still begin.',
      'My voice does not need to be the loudest to count.',
      'I trust myself to figure out the next step, not the whole staircase.',
      'A small promise kept is proof I can keep the next one.',
      'I am allowed to take up a normal amount of space.',
      'Not knowing yet is a stage, not a verdict.',
      'I can say it plainly and let that be enough.',
      'My past attempts count as training, not failure.',
      'I do not need to feel ready to start.',
    ],
    practice: {
      heading: 'A two-minute confidence deposit',
      steps: [
        'Write down one thing you did in the last month that was hard and that you finished anyway. One line, plain words. This is your evidence, not a pep talk.',
        'Read one affirmation from the list slowly, twice. If it feels too big, shrink it: "I am learning to trust myself with this" is a valid version.',
        'Choose the smallest visible step toward the thing you are avoiding — open the file, draft the first sentence, book the slot — and do only that step now.',
      ],
    },
    closing:
      'Related guides: affirmations for self-doubt and affirmations for fear of failure, linked below. If low confidence is tangled with depression or anxiety that runs your days, please talk with a doctor, therapist, or local helpline. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-success',
    jaSlug: 'money-worry',
    title: 'Affirmations for success: steady lines for people doing the work',
    h1: 'Affirmations for success: steady lines for people doing the work',
    directAnswer: [
      'Affirmations for success are most useful when they describe the worker, not the trophy. Lines such as "I finish what I start, one small piece at a time" keep your attention on the part you control — today\u2019s work — instead of on outcomes that arrive later and unevenly. Read one before you start, then do the first small piece.',
    ],
    faq: [
      { q: 'What are good affirmations for success?', a: 'Process lines beat outcome lines, for example: "I finish what I start, one small piece at a time." "Slow progress is still progress I can keep." "I can want more without insulting what I have." They stay believable on ordinary days, which is when success is actually built.' },
      { q: 'Do affirmations attract success?', a: 'No sentence attracts results by itself. What a good line can do is set the frame you work inside: patient instead of frantic, steady instead of comparing. The work still has to happen — the affirmation just helps you start it and return to it after a flat week.' },
      { q: 'When should I read affirmations for success?', a: 'Attach them to a moment that already exists: before you open your laptop, after a rejection, or when you close the day. One line, read slowly, at the same moment each day is worth more than a long list read once a month.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for success',
    metaDescription:
      '10 steady affirmations for success that focus on the work instead of the trophy, plus a two-minute start-of-day practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Most people search for affirmations for success on a specific kind of day: the launch that flopped, the application that went nowhere, the colleague who got there faster. Success starts to look like a door that opens for other people. What gets lost in that view is how uneven real progress is — long flat stretches, then a jump, then another flat stretch. The flat stretch is not the opposite of success. It is most of it.',
      'Outcome affirmations ("wealth flows to me," "I am already a millionaire") tend to collapse exactly on these days, because the gap between the sentence and the bank account is too wide to step over. What holds up better is defining success at the scale of today: the page written, the call made, the skill practiced for twenty honest minutes. That definition is not smaller ambition. It is ambition with a handle on it.',
      'There is also a quieter trap: using other people\u2019s timelines as your measuring tape. Their visible jump hides their flat years. Your flat stretch, seen from inside, feels like proof you are behind. A steadier line — one that returns you to your own work and your own definition of a life that is going well — protects the years where nothing looks like it is happening yet.',
      'Anicca is an iPhone affirmation app built for the flat stretches. It sends one short line at the time you choose, so the reminder arrives before the workday starts or right after the discouraging email, without you having to go looking for motivation. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I finish what I start, one small piece at a time.',
      'Slow progress is still progress I can keep.',
      'I can want more without insulting what I have.',
      'My timeline is allowed to be different from theirs.',
      'A flat week is part of the work, not the end of it.',
      'I measure today by what I did, not by what arrived.',
      'I am building something that takes the time it takes.',
      'One honest hour beats a perfect plan I never start.',
      'Setbacks are information, not identity.',
      'I can rest without quitting.',
    ],
    practice: {
      heading: 'A two-minute start-of-work practice',
      steps: [
        'Before you open anything else, write today\u2019s work as one small finishable piece: not "finish the project," but "draft the first section." Success needs a size your day can hold.',
        'Read one affirmation from the list slowly. Let it set the frame: steady, not frantic.',
        'Start the small piece immediately and work on only it for the first stretch. When it is done, the day already contains one kept promise, whatever else happens.',
      ],
    },
    closing:
      'Related guides: affirmations for confidence and affirmations for motivation when tired, linked below. This page is self-care writing for an affirmation app. It does not promise income, promotion, or any specific result — it is about the frame you work in while you do the work.',
  },
  {
    slug: 'affirmations-for-healing',
    jaSlug: 'heartbreak',
    title: 'Affirmations for healing: gentle lines for slow repairs',
    h1: 'Affirmations for healing: gentle lines for slow repairs',
    directAnswer: [
      'Affirmations for healing should never rush you. Healing is slow and uneven, so the lines that help sound like company, not instructions: "I do not have to be over this by now." Read one when the day feels heavier than expected, and let small and slow count as real progress.',
    ],
    faq: [
      { q: 'What are good affirmations for healing?', a: 'Gentle, permission-giving lines work best, for example: "I do not have to be over this by now." "Rest is part of healing, not a delay." "I can miss what was and still build what is next." Avoid lines that demand gratitude or silver linings before you are ready.' },
      { q: 'How long does healing take?', a: 'There is no honest schedule. Healing after loss, illness, heartbreak, or a hard season usually moves in waves rather than a straight line — better weeks, then a song or a date brings it back. That return is not failure; it is how repair actually looks.' },
      { q: 'Can affirmations help with emotional healing?', a: 'They can help the way a kind friend helps: by changing the sentence running in your head during a hard moment. They are company, not treatment. If what you are carrying involves trauma, depression, or anything that feels unsafe, a therapist or doctor is the right next step, and this page is not a substitute.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for healing',
    metaDescription:
      '10 gentle affirmations for healing that never rush you, plus a two-minute practice for heavy days. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Healing has a public-relations problem: from the outside it is supposed to look like a staircase — bad, then better, then fine. From the inside it feels more like weather. You can have a good week and then be flattened by a smell, a song, an empty chair. People around you, meaning well, ask if you are "feeling more like yourself yet," and the honest answer is that you are becoming a slightly different self, at a speed you did not choose.',
      'The hardest part is often the second wound: the judgment about the first one. "I should be over this." "Other people handled worse." That commentary turns pain into a performance review. Healing slows down further when every bad day is treated as evidence that you are doing recovery wrong. There is no wrong speed for this. There is only the speed it is actually going.',
      'Affirmations for healing, then, are not cheerleading. They are permission slips. A line like "rest is part of healing, not a delay" does not fix anything; it removes the extra weight of guilt from a day that is already heavy. Said slowly, at the moment the spiral starts, one kind sentence can be the difference between carrying the day and also fighting yourself through it.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose — many people pick the hour they usually feel the drop — so a gentler sentence can find you instead of the other way around. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I do not have to be over this by now.',
      'Rest is part of healing, not a delay.',
      'A hard day is a wave, not the whole sea.',
      'I can miss what was and still build what is next.',
      'Slow is a speed. I am allowed to heal at mine.',
      'My body and heart are doing quiet work I cannot see.',
      'I do not need to earn rest by suffering enough first.',
      'It is okay that this still hurts sometimes.',
      'I can be gentle with the version of me that is hurting.',
      'Small good moments are allowed in, even now.',
    ],
    practice: {
      heading: 'A two-minute practice for heavy days',
      steps: [
        'Put one hand somewhere that feels steady — your chest, the table, your own other hand. Notice the warmth and the weight for a few breaths. You are giving your body one simple fact: right now, in this minute, you are here.',
        'Read one affirmation from the list slowly. If a line brings tears, that is not the practice failing; let it be information, not a problem to fix.',
        'Choose the smallest kind thing available in the next hour — water, daylight, a message to one safe person, lying down without a screen. Small and done is the whole assignment.',
      ],
    },
    closing:
      'Related guides: affirmations for grief and affirmations for letting go, linked below. If you are healing from trauma, illness, or loss and the weight is more than you can carry, please reach out to a doctor, therapist, or local crisis line. This page is self-care writing for an affirmation app — not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-gratitude',
    jaSlug: 'morning',
    title: 'Affirmations for gratitude: specific lines for ordinary days',
    h1: 'Affirmations for gratitude: specific lines for ordinary days',
    directAnswer: [
      'Affirmations for gratitude work when they name something specific and small — the coffee that was still warm, the friend who texted back — instead of announcing that everything is wonderful. Read one slowly and let it point at one real thing from today. Specific beats grand, every time.',
    ],
    faq: [
      { q: 'What are good affirmations for gratitude?', a: 'Specific ones, for example: "Something in today was quietly good, and I noticed it." "I have been helped more times than I can count." "Ordinary days are most of a life, and mine count." If a line could not possibly describe your actual day, shrink it until it can.' },
      { q: 'What is the difference between gratitude affirmations and a gratitude journal?', a: 'A journal asks you to write your own list, which is powerful and takes a few minutes. An affirmation is a ready-made line you read or hear — useful on days when your mind is blank or low and generating a list feels like homework. Many people use both: lines on hard days, writing on better ones.' },
      { q: 'Can gratitude affirmations feel fake?', a: 'Yes, when they are too big. "I am grateful for everything" is hard to believe on a day with a parking ticket and a headache. The fix is size, not effort: be grateful for one true thing. The smaller and more specific the line, the more believable — and believable is what makes it work.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for gratitude',
    metaDescription:
      '10 specific affirmations for gratitude for ordinary days — no forced positivity — plus a two-minute noticing practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Gratitude has an image problem. It is often presented as a mood you are supposed to live in — radiant, appreciative, unbothered — which makes it useless on the days you actually need it: the grey Tuesdays, the weeks where nothing is wrong exactly, but nothing feels like much either. On those days "be grateful" sounds like an instruction to feel differently, and feelings do not take instructions.',
      'What does work is smaller: noticing. The brain is built to scan for problems, so the good parts of an ordinary day — the train that came on time, the colleague who covered for you, ten quiet minutes — pass without being registered. Gratitude practice is mostly a registration habit. You are not manufacturing a feeling; you are giving your attention one specific, true thing to land on before the problem-scan resumes.',
      'That is why the believable unit of gratitude is one thing, named plainly. "I am grateful for everything in my abundant life" slides off. "Someone made tea for me today and I did not even ask" sticks, because it is checkable. The affirmations below are written at that scale on purpose. Read one, then find today\u2019s version of it. The finding is the practice.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose — a morning line works well for gratitude, so the noticing starts before the problem-scan does. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'Something in today was quietly good, and I noticed it.',
      'I have been helped more times than I can count.',
      'Ordinary days are most of a life, and mine count.',
      'I can thank people while I still have the chance.',
      'What I already have was once what I hoped for.',
      'My senses bring me small gifts all day; I can pause for one.',
      'I do not need a perfect life to find one good thing in this one.',
      'The people in my life are not background. They are the story.',
      'Enough is a real place, and I visit it more often than I think.',
      'Today gave me something. I am looking for it on purpose.',
    ],
    practice: {
      heading: 'A two-minute noticing practice',
      steps: [
        'Scan today — or yesterday, if today is young — for one specific good thing. Not a category ("my family") but a moment ("my sister sent the photo without being asked"). Specific is what makes it real.',
        'Read one affirmation from the list slowly, and mentally attach your moment to it. Say the moment out loud if you can; hearing it makes it register more deeply.',
        'If a person is part of the moment, consider telling them today in one short message. Gratitude that gets delivered tends to come back as connection, which is tomorrow\u2019s material.',
      ],
    },
    closing:
      'Related guides: morning affirmations and affirmations for self-love, linked below. Gratitude is not a treatment for depression or grief, and a hard season is not a gratitude failure. If low mood persists, please talk with a doctor or therapist. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'affirmations-for-letting-go',
    jaSlug: 'heartbreak',
    title: 'Affirmations for letting go: lines for loosening your grip',
    h1: 'Affirmations for letting go: lines for loosening your grip',
    directAnswer: [
      'Affirmations for letting go help when your mind keeps returning to something you cannot change — a mistake, an ending, someone else\u2019s opinion. A believable line such as "I can learn from this without living in it" does not erase the past; it loosens your grip on it for this hour. Read one, then put your hands and attention somewhere in the present.',
    ],
    faq: [
      { q: 'What are good affirmations for letting go?', a: 'Lines that separate learning from living in the past, for example: "I can learn from this without living in it." "What I cannot control, I practice releasing." "Letting go is not saying it was okay." The last one matters: releasing your grip is not approval of what happened.' },
      { q: 'Why is letting go so hard?', a: 'Because holding on often feels like control or loyalty — as if replaying the moment keeps you ready, or letting go of a person means the love was not real. The replay does not protect you; it just re-delivers the pain on schedule. Letting go is not forgetting. It is choosing where your attention lives now.' },
      { q: 'How do I practice letting go in two minutes?', a: 'Name the thing in one plain sentence. Say what is yours to do about it — often the honest answer is "nothing more." Then read one affirmation slowly and do something physical with your hands. Attention follows the body more easily than it follows arguments.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for letting go',
    metaDescription:
      '10 calm affirmations for letting go of mistakes, endings, and other people\u2019s opinions, plus a two-minute release practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Holding on rarely feels like a choice. It feels like the moment simply will not leave: the conversation you replay in the shower, the decision you re-try in your head at 2 a.m., the version of events where you said the smarter thing. Underneath the replay is usually a hope — if I examine it once more, maybe it will change, or maybe I will finally be ready if it happens again. The examination never delivers either. It just keeps the wound on your schedule instead of life\u2019s.',
      'Some grips are about love, not control. Letting go of a person, a place, or a former version of your life can feel like betrayal, as if releasing it means it did not matter. It mattered. Letting go is not a statement about the past; it is a decision about where your attention gets to live now. You can honor something fully and still stop carrying it into every room.',
      'An affirmation cannot pry your fingers open by force, and it should not try. What a good line does is give the loosening a sentence: a small, repeatable reminder that releasing is allowed, that it is not approval, and that this hour can be spent in the present. Used at the moment the replay starts, it becomes a fork in the road your mind learns to recognize.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose — many people pick the hours the replay usually starts, like the commute or the last hour before sleep. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can learn from this without living in it.',
      'What I cannot control, I practice releasing.',
      'Letting go is not saying it was okay.',
      'I can honor what was and still choose what is.',
      'My hands are allowed to open.',
      'Replaying it will not protect me. Resting might.',
      'I release the version of the story where I am punished forever.',
      'Other people\u2019s opinions are theirs to carry.',
      'This chapter can end without my permission slip being signed in anger.',
      'I am allowed to travel lighter from here.',
    ],
    practice: {
      heading: 'A two-minute release practice',
      steps: [
        'Name the thing you are gripping in one plain sentence, written down if possible: "I keep replaying the comment from Tuesday." Plain sentences are smaller than spirals.',
        'Ask: what is mine to do about this today? If there is a real action, write it and schedule it. If there is not, write "nothing more is mine" and let that sentence stand.',
        'Read one affirmation slowly, then do something with your hands for two minutes — wash a cup, fold laundry, step outside. Give your attention a present-tense address.',
      ],
    },
    closing:
      'Related guides: affirmations for forgiveness and affirmations for healing, linked below. If what you are carrying involves trauma or keeps you from sleeping or working, please talk with a therapist or doctor. This page is self-care writing for an affirmation app, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-forgiveness',
    jaSlug: 'self-blame',
    title: 'Affirmations for forgiveness: unhooking, not excusing',
    h1: 'Affirmations for forgiveness: unhooking, not excusing',
    directAnswer: [
      'Affirmations for forgiveness work when they are honest about what forgiveness is: unhooking yourself from a debt that keeps charging you interest. It is not excusing what happened, and it is not a deadline. A line such as "I can set down this weight without calling it light" lets you begin at the size of today.',
    ],
    faq: [
      { q: 'What are good affirmations for forgiveness?', a: 'Honest ones, for example: "I can set down this weight without calling it light." "Forgiving is something I do for my own hands." "I do not have to finish forgiving today; I only have to stop rehearsing the injury." Avoid lines that pretend it did not hurt — your mind will reject them, correctly.' },
      { q: 'Does forgiving mean what they did was okay?', a: 'No. Forgiveness is not a verdict on them; it is a decision about you. You can hold a clear opinion — it was wrong, it mattered — and still stop paying for it daily. Boundaries, distance, and even never speaking again can all coexist with forgiveness.' },
      { q: 'How do I forgive myself?', a: 'Start with the same standard you would use for a friend: name what you did plainly, make the repair that is actually possible, and then practice the sentence "I am a person who did a harmful thing, not a harmful person." Self-forgiveness grows from repair plus time, not from arguing with the memory.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for forgiveness',
    metaDescription:
      '10 honest affirmations for forgiveness — of others and of yourself — that never ask you to call it okay, plus a two-minute unhooking practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Forgiveness gets bad press because it is usually introduced as a gift you owe the person who hurt you — ideally quickly, ideally with a hug. No wonder people resist it. The version worth having is different: forgiveness as something you do for your own hands. The injury happened once, or for one season. The rehearsal of it — the argument re-run in the shower, the sentence you wish you had said — can happen hundreds of times, and each rehearsal charges you again.',
      'It also helps to know what forgiveness is not. It is not excusing, not forgetting, not reconciling, and not a deadline. You do not have to be ready, and you do not have to do it in one piece. Some people forgive the person and keep the boundary forever. Some forgive in layers over years. Both count. What changes first is usually small: the memory visits, and it takes a little less of the day with it.',
      'The self-directed version is its own work. Forgiving yourself asks for two things that feel opposed: full honesty about what you did, and refusal to turn it into your whole identity. Repair what can be repaired. Apologize where an apology is still possible and welcome. Then practice the line that separates the act from the person — because you will need to live with this person, yourself, for the rest of the story.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose, so a gentler sentence can arrive at the hour the rehearsal usually starts. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I can set down this weight without calling it light.',
      'Forgiving is something I do for my own hands.',
      'I do not have to finish forgiving today.',
      'I can stop rehearsing the injury and still remember the lesson.',
      'What they did was real. So is my decision to travel lighter.',
      'I am a person who did a harmful thing, not a harmful person.',
      'Repair I can make, I will make. The rest, I practice releasing.',
      'My boundaries and my forgiveness can exist at the same time.',
      'I release the debt without calling it paid.',
      'Peace is allowed to arrive in layers.',
    ],
    practice: {
      heading: 'A two-minute unhooking practice',
      steps: [
        'Write the injury in one plain sentence, then write one sentence about what it still costs you weekly — sleep, attention, a relationship. Seeing the ongoing price, plainly, is often what makes release feel practical rather than noble.',
        'Read one affirmation from the list slowly. If "I forgive" is too big today, use the smaller true version: "I am practicing setting this down."',
        'If a repair is possible and welcome — an apology, a returned item, a clear boundary message — write the first line of it now. If none is, close the notebook and do one ordinary kind thing for yourself.',
      ],
    },
    closing:
      'Related guides: affirmations for letting go and affirmations for self-blame, linked below. If what happened involves abuse or trauma, forgiveness is never an obligation, and a therapist can help you decide what healing looks like on your terms. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'affirmations-for-new-beginnings',
    jaSlug: 'morning',
    title: 'Affirmations for new beginnings: first-step lines for starting over',
    h1: 'Affirmations for new beginnings: first-step lines for starting over',
    directAnswer: [
      'Affirmations for new beginnings help most when they shrink the start. A new job, city, routine, or chapter feels huge from the doorway; a believable line such as "I only have to do the first small thing" turns it back into a morning. Read one, then do the first small thing before the day gets loud.',
    ],
    faq: [
      { q: 'What are good affirmations for new beginnings?', a: 'First-step lines, for example: "I only have to do the first small thing." "Beginners are allowed to be bad at this for a while." "A new chapter does not require erasing the old ones." They respect the nerves instead of arguing with them.' },
      { q: 'Why does starting over feel so hard even when it is good?', a: 'Because beginnings trade the known for the unknown, and the brain prices unknown as danger even when the change is chosen and welcome. You are also a beginner again, which is uncomfortable at any age. Feeling wobbly at the start is not a sign you chose wrong; it is the normal texture of starting.' },
      { q: 'How do I use affirmations when starting something new?', a: 'Attach one line to the first action of the new routine — the first page, the first class, the first commute. Read it right before that action for the first couple of weeks, while the routine is still fragile. Repetition at the same moment is what turns a sentence into a doorway ritual.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for new beginnings',
    metaDescription:
      '10 first-step affirmations for new beginnings — a new job, a move, a fresh start after an ending — plus a two-minute doorway practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Beginnings are usually photographed at the wrong moment. We imagine the confident version — new keys in hand, new desk, new city — and skip the actual texture of starting: not knowing where things are, being the least experienced person in the room, missing the old routine even when the old routine was the problem. Almost every real beginning contains some grief for what it replaced. That mixture is not a warning sign. It is the standard recipe.',
      'The size illusion makes it harder. From the doorway, the whole chapter is visible at once — the entire job, the entire recovery, the entire degree — and the whole chapter is too big to start. Nobody actually begins a chapter. They begin a morning inside it: one form filled in, one introduction made, one box unpacked. The people who "start over successfully" are mostly people who got good at first small things, repeated.',
      'An affirmation for a beginning should therefore be small and slightly brave, not triumphant. It should give you permission to be a beginner, remind you that the old chapters are not erased, and point at the next physical action. Read at the doorway — literally, before the first step of the new thing — it becomes part of the ritual that carries you across the threshold on wobbly days.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose — set it for the minute before the new routine starts, and the line arrives like a hand on the door. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I only have to do the first small thing.',
      'Beginners are allowed to be bad at this for a while.',
      'A new chapter does not require erasing the old ones.',
      'I can be nervous and still walk in.',
      'Not knowing yet is the correct first stage.',
      'I have started from zero before. I know the way it goes.',
      'This beginning is allowed to be imperfect and still real.',
      'I will let the first weeks be practice, not a verdict.',
      'What I am leaving taught me something I get to keep.',
      'Today I am a person who begins.',
    ],
    practice: {
      heading: 'A two-minute doorway practice',
      steps: [
        'Name the beginning in one plain sentence: "I am starting a new job," "I am living in a new city," "I am beginning again after the ending." Plain naming makes it a fact, not a fog.',
        'Read one affirmation from the list slowly, right before the first action of the new routine. Same line, same moment, for the first two weeks if you can.',
        'Choose the first small thing — one introduction, one form, one shelf arranged — and do it now. Beginnings are built out of first small things, stacked.',
      ],
    },
    closing:
      'Related guides: morning affirmations and affirmations for letting go, linked below. If your new beginning follows a loss and grief is the larger weather, the affirmations for grief page may fit better. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'affirmations-for-women',
    jaSlug: 'self-esteem',
    title: 'Affirmations for women: lines for the days you carry a lot',
    h1: 'Affirmations for women: lines for the days you carry a lot',
    directAnswer: [
      'Affirmations for women land best when they answer the actual pressure: being the default parent, the reliable colleague, the one who remembers everything — and feeling guilty for resting anyway. A believable line such as "Rest is not something I earn by finishing everything" speaks to that directly. Read one at the moment the guilt usually starts.',
    ],
    faq: [
      { q: 'What are good affirmations for women?', a: 'Lines that answer real pressure, for example: "Rest is not something I earn by finishing everything." "My needs are not an interruption of my life; they are part of it." "I can be kind without being endlessly available." The test: could you say it to your closest friend and mean it?' },
      { q: 'Why do generic positive affirmations not work for me?', a: 'Often because they skip the actual weight. "You are a queen" does not touch the mental load, the double shift, or the guilt about resting. Lines that name the real situation — and give one specific permission inside it — feel less like a poster and more like a friend who has seen your actual day.' },
      { q: 'When is a good time to read affirmations?', a: 'At a transition you already have: the first coffee, the commute, the moment you close the laptop, the school-run return. One line at the same transition each day beats a long list on Sundays, because the line starts to belong to that moment.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for women',
    metaDescription:
      '10 honest affirmations for women about rest, boundaries, and being more than your usefulness, plus a two-minute transition practice. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'A lot of women are running an invisible second job: remembering the birthdays, noticing the empty fridge, tracking who is struggling and who needs a call, keeping the emotional weather of a household or a team regulated. The work is real, skilled, and almost never listed anywhere. When it goes well, it looks like nothing happened. That invisibility is exhausting in a particular way — you are tired from labor that other people experience as "things just working out."',
      'Layered on top is a training many women absorbed early: be kind, be easy, do not make it awkward. So rest gets postponed until everything is finished — and everything is never finished — and saying no arrives wrapped in an apology and an explanation. Generic positivity does not touch any of this. What touches it is permission, stated plainly, in sentences that sound like they were written by someone who has seen the actual day.',
      'The affirmations below are written for that day. They are about rest that does not need to be earned, needs that are not interruptions, and a self that is not measured by usefulness. Read one at a transition — the coffee, the commute, the laptop closing — and let it mark the border between carrying things and being a person.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose, so the line can arrive at exactly that transition without you having to remember or go looking. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'Rest is not something I earn by finishing everything.',
      'My needs are not an interruption of my life; they are part of it.',
      'I can be kind without being endlessly available.',
      'I am allowed to be a person, not only a function.',
      'Saying no plainly is not unkind.',
      'The invisible work I do is real work, and I can set some of it down.',
      'I do not have to be easy to be worthy of love.',
      'My body is not an apology.',
      'I can want things for myself without a committee meeting.',
      'Tired is information, not a character flaw.',
    ],
    practice: {
      heading: 'A two-minute transition practice',
      steps: [
        'Pick one daily transition — first coffee, commute, laptop closing, walking back from the school run. That moment is now the border: before it, carrying things; after it, two minutes that are yours.',
        'At the border, read one affirmation from the list slowly. Let it be about permission, not productivity: you are not gearing up, you are setting something down.',
        'Use the two minutes for one small thing that is only for you — stepping outside, sitting down with the drink while it is hot, one song with your eyes closed. Small and daily beats rare and elaborate.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for burnout, linked below. If the load you are carrying includes depression, anxiety, or a situation that is not safe, please reach out to a professional or a local helpline. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'i-am-affirmations',
    jaSlug: 'self-esteem',
    title: 'I am affirmations: 10 believable I am statements (and how to write your own)',
    h1: 'I am affirmations: 10 believable I am statements',
    directAnswer: [
      '"I am" affirmations are short identity statements — "I am learning," "I am enough as I am" — that work when they are believable and present-tense honest. The trick is size: "I am becoming calmer" lands where "I am perfectly calm" gets argued with. Pick one statement that feels almost true, say it slowly, and let your day collect the evidence.',
    ],
    faq: [
      { q: 'What are the best I am affirmations?', a: 'The believable ones, for example: "I am learning to trust myself." "I am enough as I am, and still growing." "I am a person who finishes small things." Statements with a small bridge word — learning, becoming, practicing — survive contact with a real Tuesday much better than absolute ones.' },
      { q: 'How do I write my own I am affirmation?', a: 'Start from the sentence your mind currently repeats ("I am always behind") and answer it at the same scale, not the opposite extreme: "I am a person who can do the next thing." Keep it present tense, keep it checkable, and keep it kind enough that you could say it to a friend.' },
      { q: 'Why do I am affirmations sometimes feel fake?', a: 'Because the gap between the statement and your current evidence is too wide, so your mind files it as fiction. Shrink the claim until it is almost true — add "learning to," "practicing," or "on my way to" — and then take one small action that makes it a little truer. Belief follows evidence.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'I am affirmations',
    metaDescription:
      '10 believable "I am" affirmations plus a simple method for writing your own that do not feel fake. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      '"I am" is the strongest grammatical frame a sentence about yourself can take. "I feel behind" describes weather; "I am behind" describes identity — and identity statements are the ones that quietly steer behavior, because we act to stay consistent with who we believe we are. That is the whole opportunity and the whole risk of I am affirmations: the frame is powerful in both directions, and most people are already running powerful I am statements all day. They are just negative ones, repeated for years.',
      'The common failure is overreach. Someone whose honest current statement is "I am a mess" tries to install "I am radiant, wealthy, and completely at peace," and the mind rejects the download. The statement has to live within sight of your current evidence. Bridge words do that work: learning, becoming, practicing, on my way. "I am learning to rest without guilt" is a statement a real person can stand inside today — and standing inside it changes what you do next, which changes the evidence, which lets the statement grow.',
      'The other rule is specificity of behavior. The I am statements that change days are attached to things you can watch yourself do: finishing small things, telling the truth kindly, returning after a lapse. Identity built on behavior is stable because the day keeps supplying proof. Pick one statement below — or write your own with the method in the practice — and give it a few weeks of small evidence.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose, so your statement can arrive at the moment you tend to forget it — morning, the commute, the hour the inner critic clocks in. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'I am learning to trust myself.',
      'I am enough as I am, and still growing.',
      'I am a person who finishes small things.',
      'I am allowed to take up a normal amount of space.',
      'I am becoming calmer, one ordinary day at a time.',
      'I am not behind; I am on my own road.',
      'I am worthy of rest before I am empty.',
      'I am the kind of person who returns after a lapse.',
      'I am more than the worst thing I have done or survived.',
      'I am here, and here is a workable place to start.',
    ],
    practice: {
      heading: 'A two-minute write-your-own practice',
      steps: [
        'Write the I am sentence your mind already repeats, exactly as it sounds: "I am always behind," "I am too much," "I am not a finisher." Seeing it on paper makes it a sentence instead of a fact.',
        'Answer it at the same scale with a bridge word: "I am learning to do the next thing," "I am a person who can ask for less on her plate," "I am practicing finishing small." Almost true is the target.',
        'Say your new line slowly, twice. Then take one tiny action that makes it truer today — finish one small thing, rest for ten minutes without earning it, send the message. Evidence is the fertilizer.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for self-worth, linked below. If your current I am statements are tangled with depression or trauma, a therapist can help you rewrite them at a pace that holds. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'affirmations-for-grief',
    jaSlug: 'heartbreak',
    title: 'Affirmations for grief: gentle lines with no schedule',
    h1: 'Affirmations for grief: gentle lines with no schedule',
    directAnswer: [
      'Affirmations for grief should never include a deadline or a silver lining. The lines that help are company for the day as it is: "There is no schedule for this" and "Love does not end just because the form of it changed." Read one when a wave hits, and let the only job be getting through this hour kindly.',
    ],
    faq: [
      { q: 'What are good affirmations for grief?', a: 'Gentle, schedule-free lines, for example: "There is no schedule for this." "I can carry love and loss at the same time." "Today I only have to do today." Avoid anything that calls grief a gift or a lesson before you would say that yourself — which may be never, and that is allowed.' },
      { q: 'What should I say to myself on a hard grief day?', a: 'Something small and true: that this wave is a wave, that you have survived every hard day so far, that the person you lost would not want your suffering to be the monument. Then do the next physical thing — water, food, air, one message to one person. Grief days are lived in hours, not insights.' },
      { q: 'Is it normal that grief comes back months later?', a: 'Yes. Grief is not a staircase with a top floor; it is more like a tide that mostly recedes and sometimes returns at full height — a song, a season, an empty chair at a table. A returning wave is not a relapse or a failure of healing. It is the ordinary behavior of love after loss.' },
      { q: 'Is the Anicca affirmation app free?', a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. It sends one short line at the time you choose, covers 13 self-care topics, and has no streaks.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for grief',
    metaDescription:
      '10 gentle affirmations for grief with no schedule and no silver linings, plus a two-minute practice for wave days. Free lines from Anicca, a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Grief is the price structure of love, and nobody sane would refuse the love to avoid the price. But knowing that does not make the supermarket bearable when their favorite song comes on, or the first holiday, or the ordinary Tuesday when you reach for the phone to tell them something before you remember. Grief lives in the body and in logistics: the empty chair, the unshared joke, the form that asks for an emergency contact.',
      'Well-meaning people will hand you timelines — the first year is the hardest, you will feel better by spring — mostly because your pain makes them feel helpless and a schedule makes it feel manageable. There is no schedule. There are waves, which mostly get smaller and further apart, and anniversaries, which do not consult your progress. Anyone who tells you that you should be further along is describing their discomfort, not your grief.',
      'So the affirmations here make only one kind of promise: company. They will not interpret your loss, call it a lesson, or rush you toward gratitude. They say the day can be survived in hours, that love and loss can be carried at the same time, and that the person you are grieving is not honored by your punishment. Read one when a wave hits. Let it be a handrail, not a lecture.',
      'Anicca is an iPhone affirmation app that sends one short line at the time you choose — some people set it for the hour the house gets quiet — so on the days you cannot go looking for comfort, a kind sentence can come to you. It covers 13 self-care topics, has no streaks, and is free to download with an optional subscription. The lines below are free to use with or without the app.',
    ],
    affirmations: [
      'There is no schedule for this.',
      'I can carry love and loss at the same time.',
      'Today I only have to do today.',
      'A wave is a wave. It will pass through, not stay forever.',
      'Missing them is a form of loving them, not a problem to fix.',
      'I have survived every hard day so far, including the worst one.',
      'Rest is allowed, even in grief. Especially in grief.',
      'I do not have to be strong in the way people mean it.',
      'Their love is still part of my life, in a changed form.',
      'I can let one small good moment in without betraying anyone.',
    ],
    practice: {
      heading: 'A two-minute practice for wave days',
      steps: [
        'When a wave hits, name it plainly: "This is a grief wave." Naming it separates you from it slightly — you are the shore, not only the water.',
        'Read one affirmation from the list slowly. If tears come, let them; crying is the body doing grief correctly, not a setback.',
        'Do the next physical thing only: a glass of water, something small to eat, standing outside for one minute of air. On wave days, care is measured in glasses of water, not breakthroughs.',
      ],
    },
    closing:
      'Related guides: affirmations for healing and affirmations for letting go, linked below. If grief is joined by feelings that frighten you, or you cannot sleep, eat, or function for a long stretch, please reach out to a doctor, a grief counselor, or a local crisis line. This page is self-care writing for an affirmation app — not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-self-esteem',
    jaSlug: 'self-esteem',
    title: 'Affirmations for self-esteem: respect that survives an ordinary day',
    h1: 'Affirmations for self-esteem: respect that survives an ordinary day',
    directAnswer: [
      'Affirmations for self-esteem are reminders to treat yourself with basic respect even when you feel unimpressive. A line such as "I can dislike a choice without disliking the person who made it" separates a mistake from your whole identity. Read one after a harsh self-judgment, then name the specific thing you can change.',
    ],
    faq: [
      { q: 'What are good affirmations for self-esteem?', a: 'Choose lines that leave room for an imperfect day: "My ordinary self deserves ordinary kindness." "A mistake can need repair without making me worthless." They offer respect without asking you to pretend you did everything well.' },
      { q: 'How is self-esteem different from confidence?', a: 'Confidence is about trusting yourself with a task; self-esteem is about how you regard yourself when the task goes badly. You can be unsure about giving a presentation and still believe you deserve to be heard. These lines focus on that second part.' },
      { q: 'What if I cannot believe a positive statement about myself?', a: 'Start with fair treatment instead of praise. "I am willing to describe this mistake without insulting myself" asks less than "I love everything about myself." You do not have to admire yourself before you stop speaking to yourself cruelly.' },
      { q: 'How can I use self-esteem affirmations after criticism?', a: 'Separate the specific feedback from the verdict you added. "The report needs clearer examples" gives you something to revise; "I am useless" does not. Read one line about respect, then write down the revision that is actually being requested.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for self-esteem',
    metaDescription:
      '10 believable affirmations for self-esteem when criticism becomes a verdict on your worth, plus a two-minute fair-description practice. Free lines from Anicca.',
    whyItHappens: [
      'Low self-esteem can show up in the little translations you make all day. A forgotten appointment becomes "I am hopeless." Someone else getting picked becomes "I have nothing to offer." The event is specific, but the sentence about you has no limits. By evening, a few ordinary disappointments can feel like a complete account of who you are.',
      'If approval has usually arrived after achievement, it can feel strange to offer yourself respect before you have earned a compliment. You might even worry that kindness will make you careless. But describing a mistake accurately gives you a repair to make. Insulting your whole character leaves you with a much larger problem and no clear next step.',
      'The lines below keep the distinction small and practical: your choices can need work while you remain a person worth caring for. Try one after catching an absolute judgment, especially words like "useless" or "unlovable." You are not trying to win a debate about how wonderful you are. You are practicing a fairer description of what happened.',
      'If the harshest verdict tends to arrive at the same time each evening, that can be a useful moment for a reminder from Anicca, an iPhone affirmation app with 13 self-care topics and no streaks. It is free to download with optional subscriptions. You can also keep one of these free lines beside the notebook where you review your day.',
    ],
    affirmations: [
      'My ordinary self deserves ordinary kindness.',
      'I can dislike a choice without disliking the person who made it.',
      'A mistake can need repair without making me worthless.',
      'I do not lose my right to respect when someone is disappointed.',
      'My quiet qualities count even when nobody applauds them.',
      'I can accept a compliment without arguing against myself.',
      'I am allowed to describe myself without an insult attached.',
      'One awkward moment cannot contain all of who I am.',
      'I can improve something without declaring myself defective.',
      'I deserve a fair description, including from myself.',
    ],
    practice: {
      heading: 'A two-minute fair-description practice',
      steps: [
        'For thirty seconds, write the judgment you just made about yourself. Under it, name the event that prompted it, using only what happened.',
        'Spend thirty seconds reading one affirmation slowly. Replace the insult with a specific description: "I forgot the appointment" is enough.',
        'Use the last minute to name one repair or one need. Write "reschedule the appointment" or "take a break," then leave the larger verdict unwritten.',
      ],
    },
    closing:
      'Related guides: affirmations for confidence and affirmations for self-love, linked below. Let respect stay available on the days praise feels out of reach. This page is self-care writing for an affirmation app, not medical advice.',
  },
  {
    slug: 'affirmations-for-work',
    jaSlug: 'burnout',
    title: 'Affirmations for work: steady lines for a crowded workday',
    h1: 'Affirmations for work: steady lines for a crowded workday',
    directAnswer: [
      'Affirmations for work are short reminders for handling priorities, feedback, and boundaries during the workday. "I can clarify the priority before accepting the deadline" points toward a concrete conversation instead of pretending the workload is easy. Read one before opening your inbox, joining a meeting, or closing your shift.',
    ],
    faq: [
      { q: 'What are useful affirmations for work?', a: 'Use lines about actions available in your job: "I can ask what done looks like before I begin." "A full inbox does not make every message equally urgent." These give you a next move when vague expectations or competing requests fill the day.' },
      { q: 'Can I use affirmations before a difficult meeting?', a: 'Yes. Choose a line about asking or listening, then prepare one sentence you need to say. For example, read "I can disagree with a proposal and still respect the person," then write the specific concern you want the meeting to address.' },
      { q: 'What should I say to myself after a mistake at work?', a: 'Try "I can own an error without making it my job title." Then identify who needs to know and what needs correcting. A kind line should help you take responsibility, not hide the mistake or turn it into a day of self-punishment.' },
      { q: 'Do work affirmations mean tolerating an unreasonable workload?', a: 'No. A reminder cannot create staffing, time, or fair treatment. Use it to prepare a specific request about priorities or support. If your role gives you little control, asking what can change is more honest than promising to handle everything cheerfully.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for work',
    metaDescription:
      '10 practical affirmations for work about priorities, meetings, feedback, and ending your shift, plus a two-minute workload reset. Free lines from Anicca.',
    whyItHappens: [
      'A crowded workday often starts with several people treating their request as the next thing. The inbox, the rota, the customer, and the meeting all have different clocks. You can spend the whole morning responding and still feel as if you have not started. That feeling can reflect competing demands rather than a personal failure to organize yourself.',
      'Unclear expectations add another layer. If nobody has said what finished looks like, it is easy to keep polishing, stay late, or read a brief message as disappointment. An affirmation cannot settle those expectations for you. It can give you a plain sentence to stand behind while you ask for the missing information.',
      'Work affirmations are useful here as cues for specific actions: clarify a priority, acknowledge an error, ask a question, or record where you stopped. They do not need to make you love every task. A line that helps you handle one meeting honestly is already doing a reasonable amount of work.',
      'For a reminder at the start or end of a shift, Anicca offers short lines on iPhone across 13 self-care topics, without streaks. Downloading is free, with optional subscriptions. Keep these lines where your work actually happens — beside a desk, in a pocket notebook, or near the place you put down your keys after a shift.',
    ],
    affirmations: [
      'I can clarify the priority before accepting the deadline.',
      'A full inbox does not make every message equally urgent.',
      'I can ask what done looks like before I begin.',
      'My contribution includes the questions that prevent confusion.',
      'I can own an error without making it my job title.',
      'I can disagree with a proposal and still respect the person.',
      'A clear handover is a useful place to stop.',
      'I can request support before the task becomes a crisis.',
      'My break belongs in the workday, not only after exhaustion.',
      'I can leave a note for tomorrow instead of carrying the whole shift home.',
    ],
    practice: {
      heading: 'A two-minute workload reset',
      steps: [
        'Spend thirty seconds listing the requests competing for your attention. Circle the one with a clear agreed priority; if none has one, mark the question you need to ask.',
        'Read one work affirmation for thirty seconds. Draft a plain sentence such as "Which of these should come first today?"',
        'Use the final minute to write the first action for the agreed task, or prepare the clarification request. Keep the other requests on the list instead of in your head.',
      ],
    },
    closing:
      'Related guides: affirmations for burnout and affirmations for confidence, linked below. A manageable workday needs realistic expectations as well as kind self-talk. This page offers self-care writing, not a promise of promotion or a solution to unsafe working conditions.',
  },
  {
    slug: 'affirmations-for-students',
    jaSlug: 'self-esteem',
    title: 'Affirmations for students: learning without making every grade a verdict',
    h1: 'Affirmations for students: learning without making every grade a verdict',
    directAnswer: [
      'Affirmations for students are believable lines for studying, asking questions, and responding to grades. "An unanswered question shows me where to study next" turns confusion into a specific starting point. Read one before a study session, then choose a single question or problem to work on.',
    ],
    faq: [
      { q: 'What are good affirmations for students?', a: 'Try lines that allow learning to be unfinished: "I am allowed to need another explanation." "My first attempt is material I can learn from." They fit a real study session better than a promise to know every answer or get the highest grade.' },
      { q: 'What affirmation can I use before an exam?', a: 'Try "I can read the question in front of me before worrying about the next one." Pair it with a practical check of the instructions and available time. A phrase cannot guarantee a result, but it can remind you what you are doing in this minute.' },
      { q: 'How do I use affirmations after a disappointing grade?', a: 'Read a line that separates the result from your identity, then look at one piece of feedback. Identify whether you misunderstood a concept, missed an instruction, or need help with the method. Bring that specific question to your teacher or tutor.' },
      { q: 'Can students use these without adding another daily habit?', a: 'Yes. Put one line inside the notebook you already open. Read it when you meet a difficult question, then return to the material. There is no need to track a streak, recite the whole list, or make affirmation practice another assignment.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for students',
    metaDescription:
      '10 affirmations for students facing exams, confusing lessons, and disappointing grades, plus a two-minute study-entry practice. Free lines from Anicca.',
    whyItHappens: [
      'School gives learning a visible scoreboard: marks, deadlines, class rankings, acceptance letters. Those measures can matter without telling the whole story of a student. When every result feels like a judgment about intelligence, the moments that learning requires — getting stuck, asking again, making an attempt — can start to feel embarrassing.',
      'Comparison makes the room look more certain than it is. You see someone finish early, but not the practice they did yesterday or the topic they find difficult elsewhere. If you also work, commute, or care for family, comparing study hours can hide real differences in the time available. Your next useful study step has to fit your actual day.',
      'These lines are meant to make room for the unfinished part of learning. They point toward asking a specific question, trying a worked example, or reading feedback without turning it into a personal label. An affirmation is a cue to return to the material; it cannot replace practice, instruction, or support when the course is moving too quickly.',
      'Anicca is an iPhone affirmation app with 13 self-care topics and no streaks, free to download with optional subscriptions. A reminder before your usual study period can mark the start without becoming another grade to earn. These free lines also work on a card tucked into your textbook.',
    ],
    affirmations: [
      'An unanswered question shows me where to study next.',
      'I am allowed to need another explanation.',
      'My first attempt is material I can learn from.',
      'I can read the question in front of me before worrying about the next one.',
      'A grade describes this submission, not every possibility ahead of me.',
      'Asking during office hours is part of being a student.',
      'I can study one example without mastering the chapter tonight.',
      'My learning still counts when it takes longer to show.',
      'I can compare my notes with the lesson instead of my life with a classmate.',
      'I can bring one clear question to the next class.',
    ],
    practice: {
      heading: 'A two-minute study-entry practice',
      steps: [
        'For thirty seconds, open the material and choose one question you cannot yet answer. Make the target smaller than the whole chapter.',
        'Spend thirty seconds reading one affirmation and writing what you already know about that question, even if it is only a definition.',
        'Use the last minute to attempt the first step or mark the exact point where you need an explanation. That is your starting point for studying or asking for help.',
      ],
    },
    closing:
      'Related guides: affirmations for confidence and affirmations for focus, linked below. If the workload is outgrowing the time or support you have, bring a concrete example to a teacher or adviser. These lines are self-care prompts, not a guarantee of exam results.',
  },
  {
    slug: 'affirmations-for-men',
    jaSlug: 'self-esteem',
    title: 'Affirmations for men: room to be human behind the capable face',
    h1: 'Affirmations for men: room to be human behind the capable face',
    directAnswer: [
      'Affirmations for men can offer a plain way to question the pressure to be useful, certain, and silent about difficulty. "I can be dependable without being invulnerable" leaves room for both responsibility and support. Read one before a conversation where you would usually say you are fine, then name what is actually happening.',
    ],
    faq: [
      { q: 'What are good affirmations for men?', a: 'Try lines that make room for an ordinary human need: "I can be dependable without being invulnerable." "My worth is not a payslip or a performance." Choose the pressure you recognize rather than a statement about how every man should be.' },
      { q: 'Do affirmations for men have to sound tough?', a: 'No. If you already spend the day trying to look unshakable, another demand to be strong may add to the load. A useful line can be quiet and practical, such as "I can tell a friend the part I usually leave out."' },
      { q: 'How can I use an affirmation when asking for help feels awkward?', a: 'Read a line about receiving support, then draft a specific request. "Could we talk for ten minutes? I have had a rough week" gives someone a way to respond. You do not have to explain your whole life in the first message.' },
      { q: 'Are these lines only for fathers or providers?', a: 'No. Men have different roles, relationships, and ways of living. These lines address pressures you may recognize, not requirements for manhood. Keep the ones that fit your day and leave the rest.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for men',
    metaDescription:
      '10 affirmations for men about support, responsibility, and worth beyond achievement, plus a two-minute honest check-in. Free lines from Anicca.',
    whyItHappens: [
      'Some men learn to answer almost every check-in with "fine." It can be easier to discuss work, a result, or a broken appliance than to say you feel lonely or uncertain. If being capable has become your main way of belonging, admitting difficulty can feel like giving up the very thing people value about you.',
      'That pressure does not look the same in every life. It might be the expectation to earn more, solve a family problem, hide disappointment, or never need reassurance. The common thread is a narrow job description for being a person: useful when needed, unobtrusive when hurting. Nobody can live inside that description all the time.',
      'The lines below offer more room without asking you to abandon responsibility. Asking for help can sit beside keeping a promise. Naming a feeling can sit beside deciding what to do about it. Pick the line that answers your actual pressure, then use it to make one conversation a little more honest.',
      'Anicca is an iPhone affirmation app with 13 self-care topics and no streaks, free to download with optional subscriptions. A short reminder before the trip home can be a moment to check how you are doing beneath the list of things you handled. The free lines here also fit in a note you keep for yourself.',
    ],
    affirmations: [
      'I can be dependable without being invulnerable.',
      'My worth is not a payslip or a performance.',
      'I can tell a friend the part I usually leave out.',
      'Needing reassurance does not make me less of a man.',
      'I can name disappointment without turning it into a fight.',
      'My care matters even when I cannot fix the problem.',
      'I can receive support without paying it back immediately.',
      'Being honest about my limits is part of being reliable.',
      'I am allowed friendships with room for difficult conversations.',
      'I can choose what being a man means in my own daily actions.',
    ],
    practice: {
      heading: 'A two-minute honest check-in',
      steps: [
        'For thirty seconds, finish the sentence "Underneath fine, I feel..." with one plain word. There is no need to justify it.',
        'Read one affirmation for thirty seconds. Name one thing you need today: company, quiet, help with a task, or a chance to talk.',
        'Use the last minute to draft a specific request to someone you trust. If you are not ready to send it, keep the words so the next conversation has a starting point.',
      ],
    },
    closing:
      'Related guides: affirmations for self-esteem and affirmations for burnout, linked below. You can take your responsibilities seriously and still let another person see how you are doing. These lines are self-care writing, not a definition of masculinity or a substitute for professional support.',
  },
  {
    slug: 'affirmations-for-love',
    jaSlug: 'heartbreak',
    title: 'Affirmations for love: connection with room for both people',
    h1: 'Affirmations for love: connection with room for both people',
    directAnswer: [
      'Affirmations for love are reminders to seek connection without abandoning your needs or trying to control another person. "I can want closeness and still ask for clarity" gives you a starting point for an honest conversation. Read one when you are guessing what someone feels, then separate what you know from what you need to ask.',
    ],
    faq: [
      { q: 'What are good affirmations for love?', a: 'Choose lines that allow mutual choice: "I can want closeness and still ask for clarity." "I can offer affection without making it a bargain." They leave room for your needs and the other person instead of promising a particular response.' },
      { q: 'Can affirmations make a specific person love me?', a: 'No. A sentence cannot decide another person\u2019s feelings or consent. Use affirmations to clarify how you want to participate in a relationship: honestly, with care, and with boundaries. Their choice remains theirs.' },
      { q: 'Can I use love affirmations while single?', a: 'Yes. Love is also present in friendships, family relationships, and the ways people look after each other. A line about receiving care can fit a call with a friend. Being single does not make connection a future-only possibility.' },
      { q: 'What affirmation fits a disagreement with a partner?', a: 'Try "I can listen to a different need without erasing my own." Then name the specific issue rather than guessing motives. A line can support a respectful conversation; it does not require staying in a conversation or relationship where you feel unsafe.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for love',
    metaDescription:
      '10 affirmations for love about mutual care, honest requests, and boundaries, plus a two-minute connection practice. Free lines from Anicca.',
    whyItHappens: [
      'Wanting love can make small uncertainties feel enormous. A delayed reply becomes a story about losing interest; a disagreement becomes a question about whether the relationship will last. When connection matters, it is tempting to search for certainty in details that cannot supply it. You can end up rehearsing a conversation you have not actually had.',
      'Another pressure is the idea that being easy to love means needing very little. You might agree to plans you dislike, hide disappointment, or give care while hoping the other person will guess what you need in return. That leaves both people working with incomplete information. A clear request may feel exposed, but it gives the relationship something real to respond to.',
      'The affirmations here focus on mutual care rather than attracting or securing a person. They leave space for affection, disagreement, boundaries, and a reply you cannot choose. Use a line to prepare your side of an honest exchange, not to predict how the other side will go.',
      'Anicca offers short reminders on iPhone across 13 self-care topics, with no streaks and optional subscriptions after a free download. A reminder during an evening pause can be a cue to notice the care already present in your life. You can use these free lines in friendships and family conversations as well as romantic relationships.',
    ],
    affirmations: [
      'I can want closeness and still ask for clarity.',
      'My needs belong in the conversation about our relationship.',
      'I can offer affection without making it a bargain.',
      'I can listen to a different need without erasing my own.',
      'A boundary can make room for more honest connection.',
      'I can receive kindness without searching for the catch.',
      'Another person\u2019s uncertainty does not decide my lovability.',
      'I can enjoy connection without rushing it into a promise.',
      'Love in my friendships counts as love in my life.',
      'I can ask directly instead of building a story from silence.',
    ],
    practice: {
      heading: 'A two-minute connection practice',
      steps: [
        'Spend thirty seconds naming one relationship moment on your mind. Write what happened separately from what you think it meant.',
        'Read one affirmation for thirty seconds. Identify whether you want to express appreciation, ask a question, or state a need.',
        'Use the final minute to write one clear sentence to share when the time is right. Make it a request or an observation, leaving the other person room to answer.',
      ],
    },
    closing:
      'Related guides: affirmations for self-love and affirmations for letting go, linked below. Closeness can include clear requests and room for a no. These lines are self-care prompts, not promises of romance or reasons to overlook harmful behavior.',
  },
  {
    slug: 'affirmations-for-money',
    jaSlug: 'money-worry',
    title: 'Affirmations for money: a kinder way to face the numbers',
    h1: 'Affirmations for money: a kinder way to face the numbers',
    directAnswer: [
      'Affirmations for money can help you approach an uncomfortable money task without turning the numbers into a judgment of your character. "I can look at a balance without making it a measure of me" keeps the task specific. Read one before opening a statement, then write down one fact and one question you need answered.',
    ],
    faq: [
      { q: 'What are realistic affirmations for money?', a: 'Use lines about facing information: "I can look at a balance without making it a measure of me." "An unfamiliar money term is something I can ask about." These remain usable when money is tight because they do not claim that you already have plenty.' },
      { q: 'Do money affirmations attract wealth?', a: 'No affirmation can guarantee income, erase a bill, or change a price. A line can serve as a cue to open a document or ask a question you have been avoiding. The financial situation still needs practical attention on its own terms.' },
      { q: 'How do I use affirmations when I feel ashamed about money?', a: 'Choose a line that separates your circumstances from your worth. Then describe one fact without an insult: "This bill is unopened" rather than "I am hopeless with money." You can work with the first sentence more easily.' },
      { q: 'What if looking at everything feels overwhelming?', a: 'Limit this practice to one document and one question. You do not need to solve every money concern in two minutes. If you need help understanding your circumstances, use the question as a starting point with an appropriately qualified adviser.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for money',
    metaDescription:
      '10 grounded affirmations for money worries, with no promises of wealth, plus a two-minute practice for facing one money task. Free lines from Anicca.',
    whyItHappens: [
      'A number on a screen can seem to say much more than it does. A balance becomes a verdict on adulthood; an unexpected expense becomes proof that you should have planned better. Money has practical consequences, so the worry is not imaginary. But a judgment about your entire character adds another burden to a situation that already needs attention.',
      'When opening a statement feels like opening a criticism, postponing it can offer a moment of relief. The unopened document then takes up space in the background of the day. This is the small moment these lines address: approaching information without requiring yourself to feel calm, capable, or proud first.',
      'Affirmations about effortless wealth skip that moment. They can sound particularly distant when income is uncertain or costs have risen beyond what you can manage. The lines below make smaller claims about dignity, questions, and looking at what is actually there. They are prompts for self-talk, not a budget, an investment method, or an explanation for why someone has less.',
      'Anicca is an iPhone affirmation app with 13 self-care topics, no streaks, and optional subscriptions after a free download. If you already set aside time for paperwork, a short reminder can mark that moment. You can also keep a free line from this page beside the folder you tend to leave closed.',
    ],
    affirmations: [
      'I can look at a balance without making it a measure of me.',
      'An unopened bill is a task, not a character description.',
      'I can ask a money question without apologizing for not knowing.',
      'My circumstances deserve attention without shame attached.',
      'I can name a cost honestly even when I wish it were different.',
      'Someone else\u2019s spending does not set the standard for my day.',
      'An unfamiliar money term is something I can ask about.',
      'I can say a plan is outside my budget without inventing an excuse.',
      'I deserve respectful help with a difficult money situation.',
      'One clear fact is a useful place to begin this paperwork.',
    ],
    practice: {
      heading: 'A two-minute money-paperwork practice',
      steps: [
        'For thirty seconds, choose one statement, bill, or money question. Leave the rest of the pile outside this two-minute task.',
        'Spend thirty seconds reading an affirmation. Name the feeling that comes up without turning it into a label about your ability.',
        'Use the final minute to note one fact from the document and one thing you do not understand. Keep that question for the next practical conversation or paperwork session.',
      ],
    },
    closing:
      'Related guides: affirmations for success and affirmations for self-esteem, linked below. A money problem can be real without being a verdict on you. This page offers self-care writing, not financial advice or a promise of income.',
  },
  {
    slug: 'affirmations-for-focus',
    jaSlug: 'burnout',
    title: 'Affirmations for focus: one clear place to return your attention',
    h1: 'Affirmations for focus: one clear place to return your attention',
    directAnswer: [
      'Affirmations for focus are brief cues to choose one task and return to it after a distraction. "I can return to this sentence without criticizing the detour" makes returning part of the practice. Read one, name the next visible action, and give that action a short stretch of attention.',
    ],
    faq: [
      { q: 'What are good affirmations for focus?', a: 'Choose a line that tells you where to return: "For this minute, this paragraph is my task." "I can park a new idea without following it immediately." Specific cues are easier to use than demanding perfect concentration for the whole day.' },
      { q: 'What should I say when I notice I am distracted?', a: 'Try "Noticing the distraction gives me a chance to return." Then find your place and do the next small action. A long argument about why you drifted can become another interruption; you can investigate recurring obstacles after the work period.' },
      { q: 'Can I use focus affirmations while studying?', a: 'Yes. Match the line to a small unit such as one example, one paragraph, or one question. Write unrelated reminders on a separate note so you do not have to keep rehearsing them while you study.' },
      { q: 'Can affirmations fix ongoing concentration problems?', a: 'They are self-care cues, not a diagnosis or treatment. If concentration regularly disrupts your daily life, a qualified professional can help you explore what is happening. You do not need to treat persistent difficulty as a failure to repeat the right sentence.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for focus',
    metaDescription:
      '10 affirmations for focus that make returning after distraction part of the practice, plus a two-minute single-task reset. Free lines from Anicca.',
    whyItHappens: [
      'Sometimes the hard part of focusing is deciding what deserves the next minute. A document is open, a message needs an answer, and an unrelated errand keeps appearing in your thoughts. Each item feels unfinished, so each asks for attention. Switching between them can leave you busy without giving any one task enough room to move.',
      'A vague task makes the problem harder. "Work on the project" offers many possible entrances, while "write the first heading" tells you where to put your hands. Distraction can also reflect interruptions, fatigue, or a setting that makes sustained attention difficult. A stern sentence about discipline does not remove those conditions.',
      'These affirmations treat focus as a return you can make, rather than a perfect state you must protect. Pair one with a visible next action and a place to put unrelated thoughts. When attention moves, the line gives you a short route back without adding a speech about what is wrong with you.',
      'Anicca sends short reminders on iPhone and covers 13 self-care topics without streaks. It is free to download with optional subscriptions. If reminders fit your routine, place one before a work period; during the period, a line written beside the task may be enough.',
    ],
    affirmations: [
      'For this minute, this paragraph is my task.',
      'I can return to this sentence without criticizing the detour.',
      'I can park a new idea without following it immediately.',
      'My next action can be smaller than my whole project.',
      'Noticing the distraction gives me a chance to return.',
      'I can leave another tab unopened while I finish this thought.',
      'A wandering moment does not erase the attention I already gave.',
      'I can make my workspace quieter before demanding more of myself.',
      'I can write the reminder down and release it from rehearsal.',
      'I am practicing returning, not proving I never drift.',
    ],
    practice: {
      heading: 'A two-minute single-task reset',
      steps: [
        'Use thirty seconds to name one visible action: read a paragraph, label a diagram, or draft a reply. Put a spare note beside it for unrelated thoughts.',
        'Spend thirty seconds reading one affirmation and closing one avoidable source of interruption. Keep the material for your chosen action in view.',
        'Work on that action for the final minute. If something else comes to mind, jot down a few words on the spare note and return to your place.',
      ],
    },
    closing:
      'Related guides: affirmations for students and affirmations for work, linked below. A useful focus practice leaves you a clear place to return. These lines are self-care prompts, not treatment for attention difficulties.',
  },
  {
    slug: 'affirmations-for-patience',
    jaSlug: 'self-blame',
    title: 'Affirmations for patience: a little room between waiting and reacting',
    h1: 'Affirmations for patience: a little room between waiting and reacting',
    directAnswer: [
      'Affirmations for patience are reminders to choose your response when events move more slowly than you want. "I can feel impatient without making someone else carry it" allows the feeling while leaving your next words open. Read one during a delay, then decide whether the moment needs a pause, a question, or a clear limit.',
    ],
    faq: [
      { q: 'What are good affirmations for patience?', a: 'Try "I can feel impatient without making someone else carry it" or "A delay can be inconvenient without becoming an insult." These lines acknowledge frustration instead of asking you to enjoy waiting.' },
      { q: 'How do I practice patience when someone is moving slowly?', a: 'Read a line before repeating your request. Check whether they need information, time, or a clearer explanation. You can ask what is happening without deciding that their pace is a personal slight.' },
      { q: 'Does patience mean waiting indefinitely?', a: 'No. A delivery, a decision, or an unanswered request may need a follow-up time or a boundary. Patience can mean making that request clearly, without turning the delay into a fight. It does not require accepting neglect or harm.' },
      { q: 'What if I already snapped at someone?', a: 'Try "I can repair a sharp reply without defending it." Acknowledge the words you used, apologize plainly, and state your request again if it still matters. Being patient includes learning how to return after an impatient moment.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for patience',
    metaDescription:
      '10 affirmations for patience during delays, slow progress, and tense conversations, plus a two-minute pause-before-reply practice. Free lines from Anicca.',
    whyItHappens: [
      'Waiting feels different when you have already spent the day hurrying. A slow queue or a repeated question can become the point where all the earlier frustration arrives. The present delay is real, but it may be carrying the weight of a missed bus, an unfinished task, and a plan that had no spare minutes in it.',
      'Impatience can also come from the story attached to the delay: nobody respects your time, nothing is improving, you will always be stuck here. Sometimes there is a real issue to address. Sometimes the story has run ahead of the information. Separating the two gives you a better chance of asking for what is actually needed.',
      'The lines below make room between the feeling and the reply. You do not have to become a person who loves queues or slow progress. You can notice irritation, decide whether a useful action is available, and choose words that do not create a second problem. A limit stated calmly can be a patient response too.',
      'Anicca is an iPhone affirmation app with 13 self-care topics and no streaks, free to download with optional subscriptions. A reminder before a usually rushed transition can put one of these lines within reach. Keep a free line near the place where you tend to send hurried replies.',
    ],
    affirmations: [
      'I can feel impatient without making someone else carry it.',
      'A delay can be inconvenient without becoming an insult.',
      'I can ask for an update without demanding an instant outcome.',
      'My next sentence can be slower than my first reaction.',
      'Another person is allowed time to understand my request.',
      'I can set a limit without rushing into a fight.',
      'Slow progress deserves a closer look before I call it no progress.',
      'I can repair a sharp reply without defending it.',
      'Waiting does not require me to rehearse my frustration.',
      'I can let this pause stay a pause instead of filling it with blame.',
    ],
    practice: {
      heading: 'A two-minute pause-before-reply practice',
      steps: [
        'For thirty seconds, describe the delay in plain facts. Separate "I have waited ten minutes" from the meaning you are assigning to it.',
        'Spend thirty seconds reading one affirmation before sending or saying your next response. Name whether you need information, a boundary, or simply more time.',
        'Use the last minute to draft one respectful request or choose when to check again. If there is nothing useful to do now, let your hands rest instead of refreshing for that minute.',
      ],
    },
    closing:
      'Related guides: affirmations for letting go and affirmations for work, linked below. Patience can include an honest follow-up and a clear stopping point. These lines offer a self-care pause, not a reason to ignore a problem that needs action.',
  },
  {
    slug: 'affirmations-for-creativity',
    jaSlug: 'comparison',
    title: 'Affirmations for creativity: permission to make the rough version',
    h1: 'Affirmations for creativity: permission to make the rough version',
    directAnswer: [
      'Affirmations for creativity are short permissions to explore an idea before deciding whether it is good. "My first draft can ask questions the final version will answer" gives unfinished work a purpose. Read one at the blank page, then make a small sketch, sentence, or variation that does not need an audience yet.',
    ],
    faq: [
      { q: 'What are good affirmations for creativity?', a: 'Try "I can make something before I know what to call it" or "A rough version gives my idea somewhere to develop." These lines support the uncertain beginning instead of requiring you to feel inspired or original on command.' },
      { q: 'Can I use creativity affirmations if I am a beginner?', a: 'Yes. You do not need a professional title to experiment with words, sounds, materials, or ideas. Choose a line that lets you practice one small thing without deciding whether you are a creative person forever.' },
      { q: 'How do I use affirmations when I keep comparing my work?', a: 'Read a line about your own unfinished process, then put the reference aside briefly and make one choice in your draft. A finished piece can teach you something, but it is not a fair description of what your first attempt should already look like.' },
      { q: 'What if I still have no ideas after reading a line?', a: 'Give yourself a concrete prompt: describe an object, change one shape, or write three possible openings. The affirmation is permission to try, not a source of guaranteed inspiration. A small experiment can be useful even if you decide not to keep it.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for creativity',
    metaDescription:
      '10 affirmations for creativity when judgment arrives before the first draft, plus a two-minute rough-version practice. Free lines from Anicca.',
    whyItHappens: [
      'A blank page can become crowded before you put anything on it. You imagine the finished piece, the response it might get, and the ways it will fall short. Evaluating work that does not exist yet leaves little room for discovering what you actually want to make. The first mark starts carrying the expectations of the final one.',
      'Seeing polished work all day can make that beginning feel especially clumsy. You see the selected image, not the discarded sketches; the finished song, not the uncertain choices along the way. References can be useful teachers, but comparing them with your private first attempt can turn exploration into an exam you did not mean to take.',
      'These affirmations keep making and judging from occupying the same instant. You can sketch an option now and decide what deserves revision later. This is not a promise that every experiment will work. It is permission to produce something concrete enough to learn from, change, combine, or leave behind.',
      'Anicca offers short iPhone reminders across 13 self-care topics, without streaks. It is free to download with optional subscriptions. A line before your usual making time can mark the shift from looking at other work to trying your own; the free lines below can also live on the first page of a sketchbook.',
    ],
    affirmations: [
      'My first draft can ask questions the final version will answer.',
      'I can make something before I know what to call it.',
      'A rough version gives my idea somewhere to develop.',
      'I can follow a curious detail without knowing the whole design.',
      'My unfinished work does not need an audience yet.',
      'I can admire another maker without abandoning my own attempt.',
      'An experiment I discard can still teach me a useful choice.',
      'I am allowed to try a different shape for this idea.',
      'I can leave evaluation until there is something to evaluate.',
      'One imperfect mark is enough to give this page a beginning.',
    ],
    practice: {
      heading: 'A two-minute rough-version practice',
      steps: [
        'For thirty seconds, choose one small prompt: a sentence about an object, a sketch of its outline, or a few notes that suggest its mood.',
        'Spend thirty seconds reading an affirmation and putting away one comparison source. Give this attempt a private place where it does not need to look finished.',
        'Use the final minute to make a rough version without correcting it as you go. At the end, circle one detail you might explore next rather than rating the whole piece.',
      ],
    },
    closing:
      'Related guides: affirmations for new beginnings and affirmations for confidence, linked below. An unfinished piece is allowed to remain a place of discovery. These lines are self-care prompts, not a promise of inspiration, recognition, or creative income.',
  },
  {
    slug: 'affirmations-for-athletes',
    jaSlug: 'comparison',
    title: 'Affirmations for athletes: steady self-talk beyond the scoreboard',
    h1: 'Affirmations for athletes: steady self-talk beyond the scoreboard',
    directAnswer: [
      'Affirmations for athletes are short reminders to return to preparation, a practiced cue, and the next action instead of judging yourself by every result. "The last play is information, not an instruction to panic" gives a mistake a smaller role. Read one before training or competition and pair it with a cue you already use.',
    ],
    faq: [
      { q: 'What are good affirmations for athletes?', a: 'Use lines about your part in the next action: "I can bring my attention back to the cue I practiced." "My effort deserves an honest review, not an insult." They remain useful after a difficult session because they do not promise victory.' },
      { q: 'How can I use an affirmation before competition?', a: 'Choose one line before the event and connect it to a familiar part of your preparation. Keep the cue short enough to remember under pressure. You are reminding yourself of practiced work, not trying to learn a new technique in the final minute.' },
      { q: 'What should I say after a mistake during a game?', a: 'Try "The last play is information, not an instruction to panic." Return to the next job your role requires, and save a fuller review for an appropriate break or after the event. One error does not need to become commentary over every following action.' },
      { q: 'Do athlete affirmations mean pushing through pain or skipping rest?', a: 'No. A line should not override your training plan or professional guidance. Use "I can report a concern without treating it as an excuse" when you need to speak up. These are self-care prompts, not training or injury advice.' },
    ],
    campaignPrefix: 'seo_en',
    shortTitle: 'Affirmations for athletes',
    metaDescription:
      '10 affirmations for athletes about preparation, mistakes, and worth beyond results, plus a two-minute familiar-cue practice. Free lines from Anicca.',
    whyItHappens: [
      'Sport makes some outcomes unusually visible: a time, a score, a selection list, a place on the bench. Those results matter within the activity, but they can begin to feel like a complete assessment of the person doing it. A disappointing performance may follow you home long after the session itself has ended.',
      'During competition, reviewing a mistake can also compete with the next task. You may still be replaying the missed shot while the situation in front of you changes. Trying to demand certainty about the final result adds another job to a moment that already asks for attention. A familiar cue gives you something more immediate to work with.',
      'The affirmations below focus on preparation, honest feedback, and the next action available in your role. They do not guarantee a personal best or ask you to ignore limits. Their purpose is to keep self-talk useful enough that a difficult result can become something to discuss and learn from, rather than a reason to insult yourself.',
      'Anicca is an iPhone affirmation app with 13 self-care topics and no streaks, free to download with optional subscriptions. A reminder before leaving for practice can be a quiet place to choose your line. These free affirmations also fit on a card in your kit bag, ready before the phone is put away.',
    ],
    affirmations: [
      'I can bring my attention back to the cue I practiced.',
      'The last play is information, not an instruction to panic.',
      'My effort deserves an honest review, not an insult.',
      'I can compete with commitment without promising myself a win.',
      'A selection decision does not contain my entire sporting life.',
      'I can ask my coach one clear question about what to work on.',
      'I can report a concern without treating it as an excuse.',
      'Rest in my plan is something I can respect.',
      'My teammate\u2019s good performance does not cancel my contribution.',
      'I can leave the scoreboard at the venue and remain a whole person.',
    ],
    practice: {
      heading: 'A two-minute familiar-cue practice',
      steps: [
        'Before the session, spend thirty seconds naming one part of your role you can attend to today. Choose something already in your preparation or coaching plan.',
        'Read one affirmation for thirty seconds. Pair it with a short cue you have practiced, rather than adding a new technical instruction.',
        'Use the final minute to write when you will return to that cue, such as after a mistake or at a scheduled break. Then put the note away and follow your usual preparation.',
      ],
    },
    closing:
      'Related guides: affirmations for confidence and affirmations for focus, linked below. A result deserves context, and the person who achieved it deserves care. This page is self-care writing, not coaching, injury treatment, or a promise of athletic results.',
  },
  {
    slug: 'affirmations-for-depression',
    jaSlug: 'self-blame',
    title: 'Affirmations for depression: gentle words for heavy, empty days',
    shortTitle: 'Affirmations for depression',
    metaDescription:
      'Feeling depressed and empty? Short, honest affirmations for heavy days and a two-minute practice. Anicca is a free-to-download iPhone app that sends one kind line at a time you choose. A support tool, not a medical treatment.',
    h1: 'affirmations for depression',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'When you feel depressed, the words that help are small and believable — not cheerful slogans, but one honest line you do not have to argue with, such as “Today can be smaller than yesterday.”',
      'Anicca is a free-to-download iPhone affirmation app built to be the answer to depression and other hard states: it learns what you struggle with and sends one short line at the moment you need it, across 13 self-care topics, with no streaks and no guilt for missed days.',
      'Anicca is a support tool for daily life, not a medical treatment, and it does not replace professional care. If low mood persists or gets worse, please reach out to a clinician or someone you trust.',
    ],
    whyItHappens: [
      'A depressed day often shrinks everything: getting up, answering a message, and making food can all feel like separate mountains. That is not laziness and it is not a character flaw. Low mood drains the energy that ordinary tasks quietly depend on, so the same day costs far more than it used to.',
      'Harsh self-talk tends to move into the empty space. “Everyone else is coping” and “I should be over this” sound like facts when you are low, but they are symptoms talking, not verdicts. Affirmations will not lift a depression on their own. A short, honest line can still give the inner voice a less cruel script for the next hour.',
      'Anicca’s public App Store listing (id6755129214, checked 2026-10-15) describes the product as free to download with an optional subscription, with 13 self-care topics and no streaks. The app sends one line at a time you choose, so support arrives without you having to go looking for it on a day when looking for anything feels hard. Use the lines below with or without the app.',
    ],
    affirmations: [
      'Today can be smaller than yesterday, and that is allowed.',
      'Feeling empty is a state I am in, not a verdict on who I am.',
      'I do not have to feel better to deserve kindness today.',
      'One small thing done slowly still counts.',
      'Resting is not the same as giving up.',
      'This heaviness is real, and states change — that is what anicca means.',
      'I can answer one message and let the rest wait.',
      'Needing help is information, not failure.',
      'I have survived every hard day so far, including quiet ones nobody saw.',
      'I can be gentle with the version of me who is struggling.',
    ],
    practice: {
      heading: 'A two-minute practice for a heavy day',
      steps: [
        'Shrink the day on purpose: name the single smallest next thing (sit up, drink water, open a curtain). Nothing after it exists yet.',
        'Pick one affirmation from the list and read it once, slowly. If it feels untrue, soften it: “I am willing to believe today can be smaller.”',
        'Do the one small thing. Then stop and rest without scoring yourself. If low mood persists for weeks or gets worse, treat that as a reason to reach out to a professional — not as a personal failure.',
      ],
    },
    faq: [
      {
        q: 'Can affirmations help with depression?',
        a: 'Affirmations are not a treatment for depression and do not replace professional care. They are a small self-care tool: a short, believable line can soften harsh self-talk for a while. If low mood persists, worsens, or affects your ability to function, please seek professional support.',
      },
      {
        q: 'What are good affirmations for depression?',
        a: 'Lines that are modest enough to believe on a bad day, for example: “Today can be smaller than yesterday, and that is allowed.” “Feeling empty is a state I am in, not a verdict on who I am.” “I do not have to feel better to deserve kindness today.”',
      },
      {
        q: 'Is Anicca a treatment for depression?',
        a: 'No. Anicca is a self-care support app — an iPhone affirmation app that sends one kind line at a time you choose. It is not a medical treatment and does not provide diagnosis or therapy. It is support alongside, not instead of, professional care.',
      },
      {
        q: 'What if I feel unsafe or in crisis?',
        a: 'Please reach out now to someone you trust, a local crisis line, or local emergency services. This page is self-care writing for an affirmation app and cannot help in a crisis.',
      },
    ],
    closing:
      'If low days keep feeling unbearable, reach out to someone you trust, a clinician, or a local crisis line. Anicca is a self-care app — a support tool, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-ocd',
    jaSlug: 'self-blame',
    title: 'Affirmations for OCD: calm words for intrusive thoughts and reassurance loops',
    shortTitle: 'Affirmations for OCD',
    metaDescription:
      'Intrusive thoughts looping all day? Short, honest affirmations for OCD hard days and a two-minute practice. Anicca is a free-to-download iPhone app that sends one calm line at a time you choose. A support tool, not a medical treatment.',
    h1: 'affirmations for OCD',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'When intrusive thoughts loop, the words that help are calm and non-arguing — one honest line that does not try to prove the thought wrong, such as “A thought is a thought; it is not an instruction.”',
      'Anicca is a free-to-download iPhone affirmation app built to be the answer to OCD and other hard states: it learns what you struggle with and sends one short line at the moment you need it, across 13 self-care topics, with no streaks and no guilt for missed days.',
      'Anicca is a support tool for daily life, not a medical treatment, and it does not replace professional care or therapy. If intrusive thoughts or checking loops are taking over your day, please reach out to a clinician or someone you trust.',
    ],
    whyItHappens: [
      'An intrusive thought is unwanted and repetitive, and the mind treats it as urgent precisely because it feels wrong. Checking, reviewing, and seeking reassurance can quiet it for a moment, then the loop returns — often stronger, because the brain learns that the thought must be important if it needed that much work.',
      'That loop is not a character flaw and it is not a sign that the thought is true. Affirmations will not treat OCD on their own, and arguing with a thought line by line rarely ends the loop. A short, honest line can still give you a steadier script for the next few minutes: notice the thought, name it as a loop, and return to what you were doing.',
      'Anicca’s public App Store listing (id6755129214, checked 2026-10-15) describes the product as free to download with an optional subscription, with 13 self-care topics and no streaks. The app sends one line at a time you choose, so a calmer line arrives without you having to search for one mid-loop. Use the lines below with or without the app.',
    ],
    affirmations: [
      'A thought is a thought; it is not an instruction.',
      'I can notice this loop without obeying it.',
      'Uncertainty is uncomfortable, and I can let it be there for now.',
      'I do not have to solve this thought to continue my day.',
      'Reassurance quiets the loop for a minute; patience quiets it for longer.',
      'This urge to check will rise, peak, and pass — that is what anicca means.',
      'I can do the next ordinary thing while the thought is still talking.',
      'Having a frightening thought does not make me a frightening person.',
      'I am allowed to leave this question unanswered for today.',
      'I can be kind to the mind that is trying, too hard, to keep me safe.',
    ],
    practice: {
      heading: 'A two-minute practice when a thought loops',
      steps: [
        'Name it plainly: “This is the loop again.” Naming the pattern is not arguing with the content, and it keeps you from treating the thought as new evidence.',
        'Pick one affirmation from the list and read it once, slowly. Do not repeat it as a ritual to make the thought go away — read it once, as a reminder, then let it be.',
        'Return to the next ordinary thing you were doing. If intrusive thoughts or rituals are taking hours of your day or getting worse, treat that as a reason to reach out to a professional — not as a personal failure.',
      ],
    },
    faq: [
      {
        q: 'Can affirmations help with OCD?',
        a: 'Affirmations are not a treatment for OCD and do not replace professional care or therapy. They are a small self-care tool: a short, calm line can help you notice a loop without obeying it for a while. If intrusive thoughts or rituals are disrupting your life, please seek professional support.',
      },
      {
        q: 'What are good affirmations for OCD and intrusive thoughts?',
        a: 'Lines that do not argue with the thought or promise certainty, for example: “A thought is a thought; it is not an instruction.” “I can notice this loop without obeying it.” “I do not have to solve this thought to continue my day.”',
      },
      {
        q: 'Is Anicca a treatment for OCD?',
        a: 'No. Anicca is a self-care support app — an iPhone affirmation app that sends one calm line at a time you choose. It is not a medical treatment and does not provide diagnosis or therapy. It is support alongside, not instead of, professional care.',
      },
      {
        q: 'What if intrusive thoughts feel unsafe or overwhelming?',
        a: 'Please reach out now to someone you trust, a clinician, a local crisis line, or local emergency services. This page is self-care writing for an affirmation app and cannot help in a crisis.',
      },
    ],
    closing:
      'If intrusive thoughts or checking loops are taking over your days, reach out to someone you trust or a clinician. Anicca is a self-care app — a support tool, not medical advice, diagnosis, or treatment.',
  },
  {
    slug: 'affirmations-for-a-hard-day',
    jaSlug: 'self-blame',
    title: 'Affirmations for a hard day: honest words for tonight, after a day that hurt',
    shortTitle: 'Affirmations for a hard day',
    metaDescription:
      'Had a really hard day and feel like crying? Short, honest affirmations for tonight and a two-minute practice to close the day. Anicca is a free-to-download iPhone app that sends one kind line at a time you choose.',
    h1: 'affirmations for a hard day',
    campaignPrefix: 'seo_geo',
    directAnswer: [
      'After a hard day, the words that help are honest and close to the ground — not “stay positive,” but one line that admits the day was hard and still lets it end, such as “Today was hard, and today is allowed to be over.”',
      'Anicca is a free-to-download iPhone affirmation app built to be the answer to a hard day and other hard states: it learns what you struggle with and sends one short line at the moment you need it, across 13 self-care topics, with no streaks and no guilt for missed days.',
      'You do not have to fix the whole day tonight. Eat something, rest, and let one kind line be the last voice of the day. If hard days are turning into most days, please reach out to someone you trust or a professional.',
    ],
    whyItHappens: [
      'A hard day rarely hurts for one reason. It stacks: a difficult conversation, a mistake replayed all afternoon, too little sleep the night before, and a mind that keeps scoring the day long after it ended. By evening the body is tired and the inner commentary is at its harshest — which is exactly when its verdicts are least reliable.',
      'Trying to win the day back at night usually backfires: more scrolling, more replaying, more promises to be a different person tomorrow. What helps instead is smaller — closing the day on purpose. A short, honest line gives the mind a different final sentence than the replay it was about to run again.',
      'Anicca’s public App Store listing (id6755129214, checked 2026-10-15) describes the product as free to download with an optional subscription, with 13 self-care topics and no streaks. The app sends one line at a time you choose — for example, in the evening — so a kinder line can arrive at the hour hard days usually get replayed. Use the lines below with or without the app.',
    ],
    affirmations: [
      'Today was hard, and today is allowed to be over.',
      'A hard day is a day I had, not a life I am stuck with.',
      'I do not have to solve today before I am allowed to rest.',
      'The worst moment of today is not the summary of today.',
      'I can be disappointed and still be on my own side.',
      'Rest tonight is part of coping, not a reward I have to earn.',
      'Tomorrow gets its own evidence; it does not inherit tonight’s verdict.',
      'I survived this day at the pace I had, not the pace I wished for.',
      'Letting the day end is not giving up on my life.',
      'This feeling is the weather of tonight — and weather passes. That is what anicca means.',
    ],
    practice: {
      heading: 'A two-minute practice to close a hard day',
      steps: [
        'Name the day in one sentence, out loud or on paper: “Today was the day that happened.” Naming it as one day — with edges — stops it from feeling like forever.',
        'Pick one affirmation from the list and read it once, slowly, as the last word on the day. Then do one ordinary kindness: water, food, a shower, or lights out earlier than usual.',
        'If the replay starts again in bed, return to the same line instead of arguing with the replay. If hard days become most days, or low mood persists for weeks, treat that as a reason to reach out to someone you trust or a professional.',
      ],
    },
    faq: [
      {
        q: 'What should I do after a really hard day?',
        a: 'Close the day on purpose: eat something, rest, and give your mind one honest line instead of the replay — for example: “Today was hard, and today is allowed to be over.” You do not have to fix the whole day tonight. If hard days are becoming most days, please reach out to someone you trust or a professional.',
      },
      {
        q: 'What are good affirmations for a hard day?',
        a: 'Lines honest enough to believe tonight, for example: “Today was hard, and today is allowed to be over.” “A hard day is a day I had, not a life I am stuck with.” “I do not have to solve today before I am allowed to rest.”',
      },
      {
        q: 'What app helps after a hard, stressful day?',
        a: 'Anicca is a free-to-download iPhone affirmation app that sends one short line at a time you choose — for example, in the evening, when a hard day usually gets replayed. It covers 13 self-care topics, with no streaks and no guilt for missed days.',
      },
      {
        q: 'When is a hard day more than a hard day?',
        a: 'If low mood, exhaustion, or hopelessness persists for weeks, affects your ability to function, or ever feels unsafe, please reach out to someone you trust, a clinician, a local crisis line, or local emergency services. This page is self-care writing and cannot help in a crisis.',
      },
    ],
    closing:
      'However today went, you do not have to carry its verdict into sleep. Anicca is a self-care app that sends one kind line at the moment you need it — a support tool for hard days, not medical advice, diagnosis, or treatment.',
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

/**
 * FAQ shown on every /affirmation-app/a/* page (visible + FAQPage JSON-LD).
 * Pages with a hand-written `faq` keep it; others get questions built only
 * from their own on-page content (no new claims).
 */
export function enAffirmationFaq(problem: EnAffirmationProblem): EnAffirmationFaq[] {
  if (problem.faq && problem.faq.length > 0) return problem.faq;
  const out: EnAffirmationFaq[] = [];
  const st = problem.shortTitle;
  const topic = /^affirmations?\b/i.test(st)
    ? st.charAt(0).toLowerCase() + st.slice(1)
    : `affirmations for ${st.charAt(0).toLowerCase() + st.slice(1)}`;
  if (problem.affirmations.length >= 3) {
    const [a, b, c] = problem.affirmations;
    out.push({
      q: `What are good ${topic}?`,
      a: `Short, believable lines work best, for example: “${a}” “${b}” “${c}” Pick one and say it slowly, once, instead of repeating a long list.`,
    });
  }
  if (problem.practice.steps.length > 0) {
    out.push({
      q: `How do I use ${topic} in about two minutes?`,
      a: problem.practice.steps.join(' '),
    });
  }
  out.push({
    q: 'Is the Anicca affirmation app free?',
    a: 'Anicca is free to download on the App Store for iPhone, with optional in-app subscriptions. Available plans and local prices are shown on the purchase screen. There are no streaks.',
  });
  return out;
}
