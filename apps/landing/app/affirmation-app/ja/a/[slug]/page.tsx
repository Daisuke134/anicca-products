import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import {
  alternatesFor,
  tripleForJaSlug,
} from '@/lib/affirmation-alternates';
import { JA_TO_EN_SLUG } from '@/lib/en-affirmation-problems';
import {
  JA_AFFIRMATION_PROBLEMS,
  allJaAffirmationSlugs,
  getJaAffirmationProblem,
  jaAffirmationAppStoreUrl,
  jaAffirmationFaq,
} from '@/lib/ja-affirmation-problems';

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return allJaAffirmationSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const problem = getJaAffirmationProblem(params.slug);
  if (!problem) {
    return { title: 'ページが見つかりません｜アニッチャ' };
  }
  const url = `https://aniccaai.com/affirmation-app/ja/a/${problem.slug}`;
  const triple = tripleForJaSlug(problem.slug);
  let languages: Record<string, string>;
  if (triple) {
    languages = alternatesFor(triple);
  } else {
    const enSlug = problem.enSlug ?? JA_TO_EN_SLUG[problem.slug];
    languages = alternatesFor({
      ja: problem.slug,
      ...(enSlug ? { en: enSlug } : {}),
      ...(problem.esSlug ? { es: problem.esSlug } : {}),
    });
  }
  return {
    title: `${problem.title}｜アニッチャ`,
    description: problem.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${problem.title}｜アニッチャ`,
      description: problem.metaDescription,
      url,
      locale: 'ja_JP',
      type: 'article',
    },
  };
}

export default function JaAffirmationProblemPage({ params }: PageProps) {
  const problem = getJaAffirmationProblem(params.slug);
  if (!problem) notFound();

  const pageUrl = `https://aniccaai.com/affirmation-app/ja/a/${problem.slug}`;
  const storeUrl = jaAffirmationAppStoreUrl(problem.slug);
  const published = '2026-10-09';
  const hasExtended =
    Boolean(problem.whyItHappens?.length) ||
    Boolean(problem.practice) ||
    Boolean(problem.closing);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: problem.title,
    description: problem.metaDescription,
    inLanguage: 'ja',
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: pageUrl,
    author: {
      '@type': 'Organization',
      name: 'Anicca',
      url: 'https://aniccaai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Anicca',
      url: 'https://aniccaai.com',
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'Daily Affirmations - Anicca',
      operatingSystem: 'iOS',
      applicationCategory: 'HealthApplication',
      url: 'https://aniccaai.com/affirmation-app/ja',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'アファメーションアプリ',
        item: 'https://aniccaai.com/affirmation-app/ja',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '悩み別アファメーション',
        item: 'https://aniccaai.com/affirmation-app/ja/a',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: problem.shortTitle,
        item: pageUrl,
      },
    ],
  };

  const faqItems = jaAffirmationFaq(problem);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const others = JA_AFFIRMATION_PROBLEMS.filter((p) => p.slug !== problem.slug);
  const enSlug = problem.enSlug ?? JA_TO_EN_SLUG[problem.slug];

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      {faqItems.length > 0 ? <JsonLd data={faqLd} /> : null}
      <JaAffirmationSeoLayout breadcrumbCurrent={problem.shortTitle}>
        <article>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
            {problem.title}
          </h1>
          <p className="mt-5 text-[17px] leading-[1.8] text-[#5c5956]">{problem.intro}</p>

          {problem.whyItHappens?.map((para) => (
            <p
              key={para.slice(0, 48)}
              className="mt-5 text-[17px] leading-[1.8] text-[#5c5956]"
            >
              {para}
            </p>
          ))}

          <p className="mt-4 rounded-[16px] border border-[#c9b382]/35 bg-[rgba(201,179,130,0.08)] px-4 py-3 text-[14px] leading-relaxed text-[#5c5956]">
            このページを保存しておくと、同じ気持ちが戻ってきたときにすぐ開けます。ブックマークやホーム画面追加もおすすめです。
          </p>

          {hasExtended ? (
            <h2 className="mt-12 text-[20px] font-semibold tracking-tight">
              アファメーション
            </h2>
          ) : null}
          <ol className={hasExtended ? 'mt-6 space-y-3' : 'mt-10 space-y-3'}>
            {problem.affirmations.map((line, index) => (
              <li
                key={`${problem.slug}-${index}`}
                className="rounded-[18px] border border-[#393634]/8 bg-[#fdfcfc] px-4 py-3.5 text-[16px] leading-relaxed"
              >
                <span className="mr-3 font-mono text-[11px] text-[#b8b6b0]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {line}
              </li>
            ))}
          </ol>

          {problem.practice ? (
            <section className="mt-12">
              <h2 className="text-[20px] font-semibold tracking-tight">
                {problem.practice.heading}
              </h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-[16px] leading-[1.75] text-[#5c5956]">
                {problem.practice.steps.map((step) => (
                  <li key={step.slice(0, 40)}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {faqItems.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-[20px] font-semibold tracking-tight">よくある質問</h2>
              <dl className="mt-6 space-y-5">
                {faqItems.map((item) => (
                  <div key={item.q}>
                    <dt className="text-[16px] font-semibold tracking-tight">{item.q}</dt>
                    <dd className="mt-2 text-[15px] leading-relaxed text-[#5c5956]">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="mt-12 rounded-[24px] border border-[#c9b382]/40 bg-[rgba(201,179,130,0.08)] px-5 py-7 text-center">
            <h2 className="text-[20px] font-semibold tracking-tight">まず心のクセを診断</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#5c5956]">
              12問・約2分の無料セルフチェック。あなたに近いタイプと、今夜使える一行がわかります。医療的な診断ではありません。
            </p>
            <Link
              href="/affirmation-app/ja/shindan"
              className="mt-5 inline-flex items-center justify-center rounded-full border border-[#393634]/20 bg-[#fdfcfc] px-7 py-3 text-[15px] font-medium text-[#393634] transition hover:border-[#393634]/40"
            >
              心のクセ診断をはじめる（無料）
            </Link>
          </section>

          <section className="mt-12 rounded-[24px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-8 text-center">
            <h2 className="text-[22px] font-semibold tracking-tight">
              渦の瞬間に、一行が届く
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#5c5956]">
              アニッチャは、心が崩れ始めた瞬間に一行のやさしさを届ける iOS
              アファメーションアプリです。フィードでもストリークでもなく、向こうから静かに来ます。ダウンロードは無料です。
            </p>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#222222] px-7 py-3.5 text-[15px] font-medium text-[#e1e1e1] transition hover:opacity-90"
            >
              App Store で入手（日本）
            </a>
            <p className="mt-4 text-[12px] leading-relaxed text-[#898783]">
              iOS 15+ · 医療アドバイスではありません
            </p>
          </section>

          {problem.closing ? (
            <p className="mt-8 text-[14px] leading-relaxed text-[#898783]">
              {problem.closing}
            </p>
          ) : null}

          <section className="mt-14">
            <h2 className="text-[18px] font-semibold">ほかの悩み別ページ</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/affirmation-app/ja/a/${item.slug}`}
                    className="inline-block rounded-full border border-[#393634]/15 px-3 py-1.5 text-[13px] text-[#5c5956] hover:border-[#393634]/35 hover:text-[#393634]"
                  >
                    {item.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
            {enSlug ? (
              <p className="mt-6 text-[14px]">
                <Link
                  href={`/affirmation-app/a/${enSlug}`}
                  className="underline underline-offset-2 hover:text-[#393634]"
                >
                  Read in English
                </Link>
              </p>
            ) : null}
            {problem.esSlug ? (
              <p className="mt-3 text-[14px]">
                <Link
                  href={`/affirmation-app/es/a/${problem.esSlug}`}
                  className="underline underline-offset-2 hover:text-[#393634]"
                >
                  Leer en español
                </Link>
              </p>
            ) : null}
            <p className="mt-6 text-[14px]">
              <Link
                href="/affirmation-app/ja/a"
                className="underline underline-offset-2 hover:text-[#393634]"
              >
                一覧に戻る
              </Link>
            </p>
          </section>
        </article>
      </JaAffirmationSeoLayout>
    </>
  );
}
