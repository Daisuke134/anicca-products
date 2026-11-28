import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import KokoroTypeResult from '@/components/affirmation/KokoroTypeResult';
import {
  allKokoroTypeIds,
  DISCLAIMER_JA,
  isKokoroTypeId,
  KOKORO_PRICE_JPY,
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

  const faq = [
    {
      q: `「${t.name}」という結果はどういう意味ですか？`,
      a: t.freeBlurb,
    },
    {
      q: `「${t.name}」の今夜の一行は何ですか？`,
      a: `「${t.tonightAffirmation}」`,
    },
    {
      q: 'この結果はどうすれば受け取れますか？',
      a: '無料の心のクセ診断（12問・約2分）に答えると、8タイプの心のクセのうち、あなたに合うタイプがわかります。無料の結果ではタイプ説明・今夜の一行・シェア用カードが受け取れます。',
    },
    {
      q: 'これは医療的な診断ですか？',
      a: `${DISCLAIMER_JA}アニッチャはセルフケアのための支援ツールであり、治療や医療的な助言ではありません。つらい気持ちが強いときは、専門家や相談窓口への相談を検討してください。`,
    },
    {
      q: '詳しい取扱説明書はいくらですか？',
      a: `詳しい取扱説明書は¥${KOKORO_PRICE_JPY}（税込・買い切り）です。このページの診断結果は無料です。`,
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
    inLanguage: 'ja',
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
    publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={faqLd} />
      <JaAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/ja/shindan', label: '心のクセ診断' }}
        breadcrumbCurrent={t.name}
      >
        <KokoroTypeResult typeId={typeId} />
        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tight">
            {t.name}についての質問
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
              アニッチャについて
            </Link>
          </p>
        </section>
      </JaAffirmationSeoLayout>
    </>
  );
}
