import Link from 'next/link';
import LaunchFrame from '@/components/site/LaunchFrame';
import { LM_JA_GUIDES, lmHref } from '@/lib/lm-ja-guides';

// /lm/guide — index of the Japanese Life Manager guides.
export const dynamic = 'force-static';

export const metadata = {
  title: 'Googleカレンダーの移動時間の入れ方・出発時刻の通知ガイド｜Life Manager',
  description: 'Googleカレンダーには移動時間の専用欄がありません。移動の予定を前後に入れる手動の方法、自動で入れる方法、出発時刻の通知、遅刻しないためのカレンダーの使い方を6本のガイドでまとめました。',
  alternates: { canonical: 'https://aniccaai.com/lm/guide' },
};

const FAQ = [
  {
    q: 'Googleカレンダーに移動時間を入れる機能はありますか？',
    a: 'Googleカレンダーには、Appleカレンダーのような「移動時間」の専用欄はありません。予定の前に「移動」という予定を手で入れるか、移動時間を自動で追加するツールを使います。',
  },
  {
    q: '移動時間を自動で入れるには？',
    a: '予定の場所と前の予定の場所から移動時間を計算し、カレンダーに移動の予定を追加するツールを使います。手動と自動の違いは「Googleカレンダーに移動時間を自動で入れる方法」で比較しています。',
  },
  {
    q: '出発時刻を通知するには？',
    a: '移動の予定を入れ、その開始時刻に通知を設定すると、出発すべき時刻に通知が届きます。手順は「Googleカレンダーで出発時刻を通知する方法」にまとめています。',
  },
];

export default function Page() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <LaunchFrame active="/lm">
      <main lang="ja" className="mx-auto max-w-3xl px-4 pb-24 pt-12 font-noto-sans-jp md:pt-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />
        <h1 className="font-display text-3xl font-semibold text-[hsl(var(--text-primary))] md:text-5xl">Googleカレンダーの移動時間ガイド</h1>
        <p className="mt-6 text-base leading-8 text-[hsl(var(--text-secondary))]">
          Googleカレンダーには移動時間の専用欄がありません。予定の前に「移動」の予定を入れれば、移動時間を確保でき、出発時刻に通知も届きます。手動で入れる方法と自動で入れる方法、出発時刻の通知、遅刻を減らすカレンダーの使い方を、下の6本のガイドで説明します。
        </p>
        <ul className="mt-10 space-y-8">
          {LM_JA_GUIDES.map((g) => (
            <li key={g.slug} className="border-t border-[hsl(var(--border))] pt-6">
              <Link href={`/lm/guide/${g.slug}`} className="text-xl font-semibold text-[hsl(var(--text-primary))] hover:text-[hsl(var(--gold))]">
                {g.title}
              </Link>
              <p className="mt-2 text-sm leading-7 text-[hsl(var(--text-secondary))]">{g.description}</p>
            </li>
          ))}
        </ul>
        <section className="mt-14 border-t border-[hsl(var(--border))] pt-8">
          <h2 className="text-2xl font-semibold text-[hsl(var(--text-primary))]">よくある質問</h2>
          <dl className="mt-6 space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-[hsl(var(--text-primary))]">{f.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-[hsl(var(--text-secondary))]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
        <p className="mt-14 text-sm text-[hsl(var(--text-secondary))]">
          <Link href={lmHref('lm_ja_guide', 'index')} className="underline underline-offset-4 hover:text-[hsl(var(--gold))]">
            Life Manager（Googleカレンダーに移動時間を自動で追加）を見る →
          </Link>
        </p>
      </main>
    </LaunchFrame>
  );
}
