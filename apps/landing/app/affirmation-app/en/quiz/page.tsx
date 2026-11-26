import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import EnAffirmationSeoLayout from '@/components/affirmation/EnAffirmationSeoLayout';
import KokoroQuizEn from '@/components/affirmation/KokoroQuizEn';
import {
  DISCLAIMER_EN,
  KOKORO_PRICE_USD,
  KOKORO_TYPES_EN,
} from '@/lib/kokoro-quiz-en';

const CANONICAL = 'https://aniccaai.com/affirmation-app/en/quiz';
const TITLE = 'Mind Habits Quiz (free · 12 questions) | Anicca';
const DESCRIPTION =
  'A free 12-question self-check (~2 minutes). See which of 8 mind-habit patterns fits you, get a tonight one-liner and a share card. Not a medical diagnosis.';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'mind habits quiz',
    'thinking patterns quiz',
    'self-check affirmation',
    'anxiety habit quiz free',
  ],
  alternates: { canonical: CANONICAL, languages: { en: CANONICAL } },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    locale: 'en_US',
    type: 'website',
    images: [{ url: 'https://aniccaai.com/quiz/og-night-anxiety.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://aniccaai.com/quiz/og-night-anxiety.png'],
  },
};

const FAQ_ITEMS = [
  {
    q: 'What is the Mind Habits Quiz?',
    a: 'A free 12-question self-check that takes about two minutes. You answer how much each statement sounds like you, and the quiz shows which of 8 mind-habit patterns fits you.',
  },
  {
    q: 'What do I get for free?',
    a: 'The free result includes a short type note, a tonight one-liner, and a share card. The full Field Guide is $4.99 USD (one-time).',
  },
  {
    q: 'What are the 8 mind-habit patterns?',
    a: 'Midnight Spiral, Proof Seeker, Running on Fumes, Inner Court, Open Heart, Slow Start, What-If Mind, and Highlight Trap.',
  },
  {
    q: 'Is the Mind Habits Quiz a medical diagnosis?',
    a: 'No. It is not a medical diagnosis — it is a short self-check to notice your patterns. Anicca is a self-care app, not medical advice. If you are in crisis, contact local emergency services or a crisis line in your country.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const webAppLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Mind Habits Quiz',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  url: CANONICAL,
  inLanguage: 'en',
  description: DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

export default function MindHabitsQuizPage() {
  return (
    <>
      <JsonLd data={webAppLd} />
      <JsonLd data={faqLd} />
      <EnAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/en/quiz', label: 'Mind Habits Quiz' }}
      >
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
          Mind Habits Quiz
        </h1>
        <p className="mt-4 text-[17px] leading-[1.8] text-[#5c5956]">
          Answer 12 questions and see which of 8 mind-habit patterns fits you. About two minutes.
          The free result includes a short type note, a tonight one-liner, and a share card. The
          full Field Guide is ${KOKORO_PRICE_USD.toFixed(2)} USD (one-time).
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[#898783]">{DISCLAIMER_EN}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {Object.values(KOKORO_TYPES_EN).map((t) => (
            <li key={t.id}>
              <Link
                href={`/affirmation-app/en/quiz/${t.id}`}
                className="inline-block rounded-full border border-[#393634]/12 px-3 py-1 text-[12px] text-[#5c5956] hover:border-[#393634]/30"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>

        <KokoroQuizEn />

        <section className="mt-14">
          <h2 className="text-[22px] font-semibold tracking-tight">
            Questions about the Mind Habits Quiz
          </h2>
          <div className="mt-5 space-y-6">
            {FAQ_ITEMS.map((f) => (
              <div key={f.q}>
                <h3 className="text-[16px] font-semibold">{f.q}</h3>
                <p className="mt-1 text-[15px] leading-[1.8] text-[#5c5956]">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[14px]">
            <Link href="/about" className="underline underline-offset-2 hover:text-[#393634]">
              About Anicca
            </Link>
          </p>
        </section>
      </EnAffirmationSeoLayout>
    </>
  );
}
