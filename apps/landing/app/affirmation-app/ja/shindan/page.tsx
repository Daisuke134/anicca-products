import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import KokoroQuiz from '@/components/affirmation/KokoroQuiz';
import { DISCLAIMER_JA, KOKORO_PRICE_JPY, KOKORO_TYPES } from '@/lib/kokoro-quiz';

const CANONICAL = 'https://aniccaai.com/affirmation-app/ja/shindan';
const TITLE = '心のクセ診断（無料・12問）｜アニッチャ';
const DESCRIPTION =
  '12問・約2分の無料セルフチェック。8タイプの心のクセがわかり、今夜使えるアファメーションとシェア用カードが受け取れます。医療的な診断ではありません。';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['心のクセ', '考え方のクセ 診断', '自己肯定感 診断 無料', 'アファメーション 診断'],
  alternates: { canonical: CANONICAL, languages: { ja: CANONICAL } },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: 'https://aniccaai.com/shindan/og-night-anxiety.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://aniccaai.com/shindan/og-night-anxiety.png'],
  },
};

const webAppLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '心のクセ診断',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  url: CANONICAL,
  inLanguage: 'ja',
  description: DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

export default function KokoroShindanPage() {
  return (
    <>
      <JsonLd data={webAppLd} />
      <JaAffirmationSeoLayout
        breadcrumbMiddle={{ href: '/affirmation-app/ja/shindan', label: '心のクセ診断' }}
      >
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
          心のクセ診断
        </h1>
        <p className="mt-4 text-[17px] leading-[1.8] text-[#5c5956]">
          12の質問に答えると、8タイプのうちあなたの「心のクセ」がわかります。所要時間は約2分。無料の結果ではタイプ説明・今夜の一行・シェア用カードが受け取れます。詳しい取扱説明書は¥
          {KOKORO_PRICE_JPY}（税込・買い切り）です。
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[#898783]">{DISCLAIMER_JA}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {Object.values(KOKORO_TYPES).map((t) => (
            <li key={t.id}>
              <Link
                href={`/affirmation-app/ja/shindan/${t.id}`}
                className="inline-block rounded-full border border-[#393634]/12 px-3 py-1 text-[12px] text-[#5c5956] hover:border-[#393634]/30"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>

        <KokoroQuiz />
      </JaAffirmationSeoLayout>
    </>
  );
}
