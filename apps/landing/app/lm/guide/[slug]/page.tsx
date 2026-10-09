import Link from 'next/link';
import { notFound } from 'next/navigation';
import LaunchFrame from '@/components/site/LaunchFrame';
import LmJaCta from '@/components/lm/LmJaCta';
import { LM_JA_GUIDES, LM_JA_SITE, getLmJaGuide, lmHref, type GuideBlock } from '@/lib/lm-ja-guides';

// /lm/guide/<slug> — hand-written Japanese search guides for Life Manager.
// Separate from the daily Writer (/blog/<slug>). Content lives in lib/lm-ja-guides.ts.

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return LM_JA_GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const g = getLmJaGuide(params.slug);
  if (!g) return {};
  const url = `${LM_JA_SITE}/lm/guide/${g.slug}`;
  return {
    title: `${g.title}｜Life Manager`,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, url, locale: 'ja_JP', type: 'article' },
  };
}

const CAMPAIGN = 'lm_ja_guide';

function Block({ b }: { b: GuideBlock }) {
  switch (b.type) {
    case 'h2':
      return <h2 className="mt-12 font-display text-2xl text-[hsl(var(--text-primary))] md:text-3xl">{b.text}</h2>;
    case 'p':
      return <p className="mt-5 text-base leading-8 text-[hsl(var(--text-secondary))]">{b.text}</p>;
    case 'ul':
      return (
        <ul className="mt-5 list-disc space-y-2 pl-6 text-base leading-8 text-[hsl(var(--text-secondary))]">
          {b.items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mt-5 list-decimal space-y-2 pl-6 text-base leading-8 text-[hsl(var(--text-secondary))]">
          {b.items.map((i) => <li key={i}>{i}</li>)}
        </ol>
      );
  }
}

export default function Page({ params }: { params: { slug: string } }) {
  const g = getLmJaGuide(params.slug);
  if (!g) notFound();
  const url = `${LM_JA_SITE}/lm/guide/${g.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        inLanguage: 'ja',
        datePublished: g.date,
        dateModified: g.date,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Anicca', url: LM_JA_SITE },
        publisher: { '@type': 'Organization', name: 'Anicca', url: LM_JA_SITE },
      },
      {
        '@type': 'FAQPage',
        mainEntity: g.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };
  const others = LM_JA_GUIDES.filter((o) => o.slug !== g.slug);
  return (
    <LaunchFrame active="/lm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article lang="ja" className="mx-auto max-w-3xl px-4 pb-24 pt-12 font-noto-sans-jp md:pt-20">
        <p className="font-mono text-xs tracking-[0.2em] text-[hsl(var(--gold))]">
          <Link href="/lm/ja">Life Manager</Link> · ガイド · {g.date}
        </p>
        <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.3] text-[hsl(var(--text-primary))] md:text-5xl">{g.title}</h1>
        <p className="mt-7 text-base leading-8 text-[hsl(var(--text-secondary))] md:text-lg">{g.lead}</p>

        {g.blocks.map((b, i) => <Block key={i} b={b} />)}

        <aside className="mt-12 rounded-card border border-[hsl(var(--gold)/0.5)] bg-[hsl(var(--gold)/0.06)] p-7">
          <p className="text-lg font-semibold text-[hsl(var(--text-primary))]">次の予定に、いつ出ればいいかを。</p>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--text-secondary))]">
            Googleカレンダーを一度接続すると、対象の対面予定の前に移動時間を追加し、出発時刻をカレンダーでお知らせします。7日間無料（開始にはカード登録が必要。以降は月$29、いつでも解約できます）。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LmJaCta campaign={CAMPAIGN} content={g.slug} />
            <Link
              href={lmHref(CAMPAIGN, g.slug)}
              className="inline-flex items-center justify-center rounded-pill border border-[hsl(var(--border))] px-7 py-3 text-sm font-semibold text-[hsl(var(--text-primary))] transition-all hover:border-[hsl(var(--gold))]"
            >
              Life Manager を見る
            </Link>
          </div>
        </aside>

        <section className="mt-14">
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))]">よくある質問</h2>
          <dl className="mt-6 space-y-6">
            {g.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-[hsl(var(--text-primary))]">{f.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-[hsl(var(--text-secondary))]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14 border-t border-[hsl(var(--border))] pt-10">
          <h2 className="font-display text-xl text-[hsl(var(--text-primary))]">関連ガイド</h2>
          <ul className="mt-5 space-y-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/lm/guide/${o.slug}`} className="text-sm text-[hsl(var(--text-primary))] underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </LaunchFrame>
  );
}
