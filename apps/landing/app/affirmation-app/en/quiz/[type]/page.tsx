import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import EnAffirmationSeoLayout from '@/components/affirmation/EnAffirmationSeoLayout';
import KokoroTypeResultEn from '@/components/affirmation/KokoroTypeResultEn';
import {
  allKokoroTypeIdsEn,
  DISCLAIMER_EN,
  isKokoroTypeId,
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
      <EnAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/en/quiz', label: 'Mind Habits Quiz' }}
        breadcrumbCurrent={t.name}
      >
        <KokoroTypeResultEn typeId={typeId} />
      </EnAffirmationSeoLayout>
    </>
  );
}
