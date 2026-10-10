import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import { JA_AFFIRMATION_PROBLEMS } from '@/lib/ja-affirmation-problems';

const PAGE_URL = 'https://aniccaai.com/affirmation-app/ja/a';

export const metadata: Metadata = {
  title: '悩み別アファメーション一覧｜アニッチャ',
  description:
    '寝る前の不安・自己肯定感・燃え尽き・失恋など、悩み別に短い日本語アファメーションを集めました。アニッチャは心が崩れ始めた瞬間に一行を届ける iOS アプリです。',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: '悩み別アファメーション一覧｜アニッチャ',
    description:
      '短い日本語アファメーションを悩み別に。アニッチャは一行のやさしさを届ける iOS アプリです。',
    url: PAGE_URL,
    locale: 'ja_JP',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '悩み別アファメーション一覧',
  description:
    '寝る前の不安・自己肯定感・燃え尽きなど、悩み別の短い日本語アファメーション集。',
  url: PAGE_URL,
  inLanguage: 'ja',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Anicca',
    url: 'https://aniccaai.com',
  },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Anicca',
    operatingSystem: 'iOS',
    applicationCategory: 'HealthApplication',
    url: 'https://aniccaai.com/affirmation-app/ja',
  },
};

export default function JaAffirmationIndexPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <JaAffirmationSeoLayout>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
          悩み別アファメーション
        </h1>
        <p className="mt-5 text-[17px] leading-[1.75] text-[#5c5956]">
          心が崩れやすい瞬間向けに、短い日本語のアファメーションを集めました。保存して読み返しても、
          <Link href="/affirmation-app/ja" className="underline underline-offset-2">
            アニッチャ
          </Link>
          のアプリから一行が届くのを待っても構いません。ストリークも記録の義務もありません。
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#898783]">
          このページは医療アドバイスではありません。
        </p>

        <div className="mt-8 rounded-[20px] border border-[#c9b382]/40 bg-[rgba(201,179,130,0.08)] px-5 py-5">
          <p className="text-[16px] font-semibold text-[#393634]">まず心のクセを診断（無料・12問）</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5c5956]">
            約2分で8タイプのどれに近いかわかります。医療的な診断ではありません。
          </p>
          <Link
            href="/affirmation-app/ja/shindan"
            className="mt-3 inline-flex text-[14px] font-medium underline underline-offset-2 hover:text-[#393634]"
          >
            心のクセ診断をはじめる →
          </Link>
        </div>

        <ul className="mt-12 space-y-4">
          {JA_AFFIRMATION_PROBLEMS.map((problem) => (
            <li key={problem.slug}>
              <Link
                href={`/affirmation-app/ja/a/${problem.slug}`}
                className="block rounded-[20px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-5 transition hover:border-[#393634]/25"
              >
                <span className="block text-[18px] font-semibold text-[#393634]">
                  {problem.shortTitle}
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[#898783]">
                  {problem.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </JaAffirmationSeoLayout>
    </>
  );
}
