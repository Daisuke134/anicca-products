import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import KokoroTypeResult from '@/components/affirmation/KokoroTypeResult';
import {
  allKokoroTypeIds,
  DISCLAIMER_JA,
  isKokoroTypeId,
  KOKORO_TYPES,
  type KokoroTypeId,
} from '@/lib/kokoro-quiz';

type PageProps = {
  params: { type: string };
};

export function generateStaticParams() {
  return allKokoroTypeIds().map((type) => ({ type }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isKokoroTypeId(params.type)) {
    return { title: 'ページが見つかりません｜心のクセ診断' };
  }
  const t = KOKORO_TYPES[params.type];
  const url = `https://aniccaai.com/affirmation-app/ja/shindan/${t.id}`;
  const title = `${t.name}｜心のクセ診断（無料）｜アニッチャ`;
  const description = `${t.freeBlurb.slice(0, 90)}… ${DISCLAIMER_JA}`;
  const og = `https://aniccaai.com/shindan/og-${t.id}.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      locale: 'ja_JP',
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

export default function KokoroTypePage({ params }: PageProps) {
  if (!isKokoroTypeId(params.type)) notFound();
  const typeId = params.type as KokoroTypeId;
  const t = KOKORO_TYPES[typeId];
  const pageUrl = `https://aniccaai.com/affirmation-app/ja/shindan/${typeId}`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t.name,
    description: t.freeBlurb,
    inLanguage: 'ja',
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
    publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JaAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/ja/shindan', label: '心のクセ診断' }}
        breadcrumbCurrent={t.name}
      >
        <KokoroTypeResult typeId={typeId} />
      </JaAffirmationSeoLayout>
    </>
  );
}
