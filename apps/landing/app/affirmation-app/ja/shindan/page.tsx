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

const FAQ_ITEMS = [
  {
    q: '心のクセ診断とは何ですか？',
    a: '12問・約2分の無料セルフチェックです。各文が自分にどれくらい当てはまるか答えると、8タイプの心のクセのうち、あなたに合うタイプがわかります。',
  },
  {
    q: '無料で何が受け取れますか？',
    a: '無料の結果ではタイプ説明・今夜の一行・シェア用カードが受け取れます。詳しい取扱説明書は¥480（税込・買い切り）です。',
  },
  {
    q: '8タイプにはどんなものがありますか？',
    a: '夜ぐるぐるタイプ、がんばり証明タイプ、燃え尽き手前タイプ、ひとり反省会タイプ、つながり渇望タイプ、エンジン低速タイプ、先回り心配タイプ、となりの芝生タイプです。',
  },
  {
    q: '心のクセ診断は医療的な診断ですか？',
    a: 'いいえ。医療的な診断ではありません。自分を知るためのセルフチェックです。アニッチャはセルフケアのための支援ツールであり、治療や医療的な助言ではありません。つらい気持ちが強いときは、専門家や相談窓口への相談を検討してください。',
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
      <JsonLd data={faqLd} />
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

        <section className="mt-14">
          <h2 className="text-[22px] font-semibold tracking-tight">
            心のクセ診断についての質問
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
              アニッチャについて
            </Link>
          </p>
        </section>
      </JaAffirmationSeoLayout>
    </>
  );
}
