import Link from 'next/link';
import LaunchFrame from '@/components/site/LaunchFrame';
import { LM_JA_GUIDES, lmHref } from '@/lib/lm-ja-guides';

// /lm/guide — index of the Japanese Life Manager guides.
export const dynamic = 'force-static';

export const metadata = {
  title: '移動時間・出発時刻・遅刻対策のガイド｜Life Manager',
  description: 'Googleカレンダーで移動時間を確保する方法、出発時刻の通知、遅刻しないためのカレンダーの使い方をまとめたガイドです。',
  alternates: { canonical: 'https://aniccaai.com/lm/guide' },
};

export default function Page() {
  return (
    <LaunchFrame active="/lm">
      <main lang="ja" className="mx-auto max-w-3xl px-4 pb-24 pt-12 font-noto-sans-jp md:pt-20">
        <h1 className="font-display text-3xl font-semibold text-[hsl(var(--text-primary))] md:text-5xl">移動時間と遅刻対策のガイド</h1>
        <p className="mt-6 text-base leading-8 text-[hsl(var(--text-secondary))]">
          Googleカレンダーで移動時間を確保し、出発のタイミングを迷わないためのガイドです。
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
        <p className="mt-14 text-sm text-[hsl(var(--text-secondary))]">
          <Link href={lmHref('lm_ja_guide', 'index')} className="underline underline-offset-4 hover:text-[hsl(var(--gold))]">
            Life Manager（Googleカレンダーに移動時間を自動で追加）を見る →
          </Link>
        </p>
      </main>
    </LaunchFrame>
  );
}
