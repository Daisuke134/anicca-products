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
  /** Explicit JSON-LD article publication date (YYYY-MM-DD). */
  datePublished?: string;
  /** Explicit JSON-LD article update date (YYYY-MM-DD). */
  dateModified?: string;
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

export type EnAffirmationProblemWithDates = Omit<
  EnAffirmationProblem,
  'datePublished' | 'dateModified'
> & {
  datePublished: string;
  dateModified: string;
};

export const EN_AFFIRMATION_APP_STORE_BASE =
  'https://apps.apple.com/app/id6755129214';

export function enAffirmationAppStoreUrl(
  slug: string,
  campaignPrefix: 'seo_en' | 'seo_geo' = 'seo_en',
): string {
  const url = new URL(EN_AFFIRMATION_APP_STORE_BASE);
  url.searchParams.set('pt', '93486075');
  url.searchParams.set('ct', `${campaignPrefix}_${slug}`);
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
  {
    slug: 'affirmations-for-imposter-syndrome',
    jaSlug: 'self-esteem',
    title: 'Affirmations for imposter syndrome (2026): lines that do not ask you to fake confidence',
    shortTitle: 'Affirmations for imposter syndrome',
    metaDescription:
      'Honest affirmations for imposter syndrome, plus a two-minute exercise for when you feel like a fraud at work. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: I make Anicca, an affirmation app, so I have a stake in this topic. Here is the short version first. Imposter syndrome is the persistent feeling that your results are luck or an error, and that people will soon notice. It is not an official diagnosis, and it shows up in people who are objectively doing the work. The practical question is not "how do I feel confident?" but "what can I say to myself that I can actually believe today?"',
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
      'Full disclosure: I make Anicca, an affirmation app, so I am not neutral here. The short version: affirmations cannot fix burnout. If you are worn out because of workload, caring for others, or long stretches without rest, the real fixes are rest, support, and changes to the load. What a short line can do is make a hard evening a little less harsh, so you are not also fighting yourself.',
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
      'Full disclosure: I make Anicca, an affirmation app, so take my view with that in mind. The short version: an affirmation cannot replace people. What it can do is soften the voice that says "something is wrong with me" when you feel alone, so you have a little more energy to reach out.',
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
      'Full disclosure: I make Anicca, an affirmation app, so I am not a neutral source. The short version: when you are genuinely tired, a pep talk will not give you energy. If the tiredness is from lack of sleep or overload, rest comes first. But on an ordinary low-energy day, the right small line can help you make a start, and starting is often the hardest part.',
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
      'Full disclosure: I make Anicca, an affirmation app, so I have a stake in this topic. The short version first: affirmations will not do the task for you. What they can do is soften the self-criticism that often sits on top of procrastination, so starting feels a little less heavy.',
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
      'Full disclosure: I make Anicca, an affirmation app, so I am not neutral. The short version: repeating "I am worthy" will not by itself change how you feel. It tends to help more when the line is believable and you pair it with small actions that match it.',
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
      'Full disclosure: I make Anicca, an affirmation app, so I have a stake here. The short version: affirmations will not remove high standards, and you may not want them to. They can help with the harsh part, the voice that treats every flaw as a failure.',
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
      'Full disclosure: I make Anicca, an affirmation app, so take my view with that in mind. The short version: an affirmation will not guarantee success. It can make the cost of trying feel a little smaller, which is often what is needed to begin.',
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
    title: 'I Am app alternative: a neutral comparison with Anicca',
    shortTitle: 'I Am app alternative',
    metaDescription:
      'Neutral comparison of I am - Daily Affirmations and Anicca, based on public App Store listing facts only (dated). Links to both apps. No invented ratings, counts, or prices.',
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
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    metaDescription:
      'Calm affirmations for Sunday scaries, plus a two-minute exercise for easing Monday dread. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: I make Anicca, an affirmation app, so I have a stake in this topic. The short version first: affirmations will not change your job or your Monday. They can make the dread a little quieter so Sunday evening is less of a loss.',
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
    datePublished: '2026-10-16',
    dateModified: '2026-10-16',
    metaDescription:
      'Steady affirmations for social anxiety at work, plus a two-minute exercise before a meeting or conversation. Anicca is a free-to-download iPhone affirmation app with no streaks.',
    whyItHappens: [
      'Full disclosure: I make Anicca, an affirmation app, so I am not neutral. The short version: affirmations will not remove nerves or replace professional support. They can give you a calmer thing to say to yourself right before a meeting, a message, or a conversation.',
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
];

export function getEnAffirmationProblem(
  slug: string,
): EnAffirmationProblemWithDates | undefined {
  const problem = EN_AFFIRMATION_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return undefined;

  const campaignDate =
    problem.campaignPrefix === 'seo_geo' ? '2026-10-15' : '2026-10-09';
  const datePublished = problem.datePublished ?? campaignDate;

  return {
    ...problem,
    datePublished,
    dateModified: problem.dateModified ?? datePublished,
  };
}

export function allEnAffirmationSlugs(): string[] {
  return EN_AFFIRMATION_PROBLEMS.map((p) => p.slug);
}
