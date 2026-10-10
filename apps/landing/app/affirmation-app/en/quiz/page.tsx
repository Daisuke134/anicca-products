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
      </EnAffirmationSeoLayout>
    </>
  );
}
