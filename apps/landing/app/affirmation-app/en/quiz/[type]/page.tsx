import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import EnAffirmationSeoLayout from '@/components/affirmation/EnAffirmationSeoLayout';
import KokoroTypeResultEn from '@/components/affirmation/KokoroTypeResultEn';
import Link from 'next/link';
import {
  allKokoroTypeIdsEn,
  DISCLAIMER_EN,
  isKokoroTypeId,
  KOKORO_PRICE_USD,
  KOKORO_TYPES_EN,
  type KokoroTypeId,
} from '@/lib/kokoro-quiz-en';

type PageProps = {
  params: { type: string };
};

export function generateStaticParams() {
  return allKokoroTypeIdsEn().map((type) => ({ type }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isKokoroTypeId(params.type)) {
    return { title: 'Not found | Mind Habits Quiz' };
  }
  const t = KOKORO_TYPES_EN[params.type];
  const url = `https://aniccaai.com/affirmation-app/en/quiz/${t.id}`;
  const title = `${t.name} | Mind Habits Quiz (free) | Anicca`;
  const description = `${t.freeBlurb.slice(0, 90)}… ${DISCLAIMER_EN}`;
  const og = `https://aniccaai.com/quiz/og-${t.id}.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      locale: 'en_US',
      type: 'article',
      images: [{ url: og, width: 1200, height: 630, alt: t.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [og],
    },
  };
}

export default function MindHabitsTypePage({ params }: PageProps) {
  if (!isKokoroTypeId(params.type)) notFound();
  const typeId = params.type as KokoroTypeId;
  const t = KOKORO_TYPES_EN[typeId];
  const pageUrl = `https://aniccaai.com/affirmation-app/en/quiz/${typeId}`;

  const faq = [
    {
      q: `What does the ${t.name} result mean?`,
      a: t.freeBlurb,
    },
    {
      q: `What is the tonight one-liner for the ${t.name} pattern?`,
      a: `\u201c${t.tonightAffirmation}\u201d`,
    },
    {
      q: 'How do I get this result?',
      a: 'Take the free Mind Habits Quiz: 12 questions, about two minutes. It shows which of the 8 mind-habit patterns fits you, with a short type note, a tonight one-liner, and a share card.',
    },
    {
      q: 'Is this a medical diagnosis?',
      a: DISCLAIMER_EN,
    },
    {
      q: 'What does the full Field Guide cost?',
      a: `The full Field Guide is $${KOKORO_PRICE_USD.toFixed(2)} USD (one-time). The quiz result on this page is free.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t.name,
    description: t.freeBlurb,
    inLanguage: 'en',
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
    publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={faqLd} />
      <EnAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/en/quiz', label: 'Mind Habits Quiz' }}
        breadcrumbCurrent={t.name}
      >
        <KokoroTypeResultEn typeId={typeId} />
        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-5">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-[16px] font-semibold">{item.q}</h3>
                <p className="mt-1 text-[15px] leading-[1.8] text-[#5c5956]">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px]">
            <Link href="/about" className="underline underline-offset-4">
              About Anicca
            </Link>
          </p>
        </section>
      </EnAffirmationSeoLayout>
    </>
  );
}
