import Link from 'next/link';
import type { ReactNode } from 'react';

export default function JaAffirmationSeoLayout({
  children,
  breadcrumbCurrent,
}: {
  children: ReactNode;
  breadcrumbCurrent?: string;
}) {
  return (
    <div lang="ja" className="font-serif-jp min-h-dvh bg-[#fdf7ee] text-[#393634]">
      <header className="sticky top-0 z-40 border-b border-[#393634]/8 bg-[#fdf7ee]/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-5">
          <Link
            href="/affirmation-app/ja"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#898783] hover:text-[#393634]"
          >
            ← アニッチャ
          </Link>
          <Link
            href="/affirmation-app/ja/a"
            className="font-mono text-[11px] tracking-[0.12em] text-[#898783] hover:text-[#393634]"
          >
            アファメーション一覧
          </Link>
        </div>
      </header>

      <nav
        aria-label="パンくず"
        className="mx-auto max-w-3xl px-5 pt-6 text-[13px] text-[#898783]"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/affirmation-app/ja" className="hover:text-[#393634]">
              アファメーションアプリ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            {breadcrumbCurrent ? (
              <Link href="/affirmation-app/ja/a" className="hover:text-[#393634]">
                悩み別アファメーション
              </Link>
            ) : (
              <span className="text-[#393634]">悩み別アファメーション</span>
            )}
          </li>
          {breadcrumbCurrent ? (
            <>
              <li aria-hidden="true">/</li>
              <li className="text-[#393634]">{breadcrumbCurrent}</li>
            </>
          ) : null}
        </ol>
      </nav>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">{children}</main>

      <footer className="border-t border-[#393634]/8 py-10">
        <div className="mx-auto max-w-3xl space-y-3 px-5 text-[13px] leading-relaxed text-[#898783]">
          <p>
            このページは医療アドバイスではありません。つらい気持ちが続くときは、専門家や相談窓口への相談を検討してください。
          </p>
          <p>
            <Link href="/affirmation-app/ja" className="underline underline-offset-2 hover:text-[#393634]">
              アニッチャ（アファメーションアプリ）について
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
