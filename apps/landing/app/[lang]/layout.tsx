import React from 'react';
import type { Metadata } from 'next';
import '../globals.css';
import { display, mono, notoSansJP } from '../fonts';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

// Root layout for the localized subtree (/en/* /ja/*). Because this layout renders its
// own <html>, Next.js treats it as the root layout for this segment and emits exactly one
// <html lang={lang}> in the static HTML (verified: out/ja/install.html → lang="ja").
// dynamicParams=false → only en/ja are generated; bare paths like /install still resolve
// to the existing static root routes.

export const dynamicParams = false;

const LOCALES: LaunchLocale[] = ['en', 'ja'];

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: LaunchLocale } }): Metadata {
  const lang = LOCALES.includes(params.lang) ? params.lang : 'en';
  return {
    title:
      lang === 'ja'
        ? 'Anicca - 苦しみを終わらせる自律 AI エンティティ'
        : 'Anicca - autonomous Buddhist AI entity to end suffering',
    description:
      lang === 'ja'
        ? launchDict.ja.install.metaDescription
        : launchDict.en.install.metaDescription,
    icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  };
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: LaunchLocale };
}) {
  const lang = LOCALES.includes(params.lang) ? params.lang : 'en';
  return (
    <html
      lang={lang}
      className={`${display.variable} ${mono.variable} ${notoSansJP.variable}`}
    >
      <body className={lang === 'ja' ? 'font-sans font-noto-sans-jp' : 'font-sans'}>
        {children}
      </body>
    </html>
  );
}
