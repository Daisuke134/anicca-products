import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// GEO parity (audit 2026-11-22: /comedy had no canonical; the JA
// page is the same 'use client' pattern, so this segment layout
// carries its metadata instead). The canonical is this page's own
// real URL; the title and description are the page's own JsonLd
// name and description, verbatim. The RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024).
export const metadata: Metadata = {
  title: 'アニッチャ お笑い | Anicca',
  description:
    'アニッチャによる東京・サンフランシスコでのお笑いライブとオープンマイク出演情報。大喜利・スキット・漫才・コント・ピンネタ・フリップ芸の各フォーマットで制作中。',
  alternates: {
    canonical: 'https://aniccaai.com/comedy/ja',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'アニッチャ お笑い | Anicca',
    description:
      'アニッチャによる東京・サンフランシスコでのお笑いライブとオープンマイク出演情報。大喜利・スキット・漫才・コント・ピンネタ・フリップ芸の各フォーマットで制作中。',
    url: 'https://aniccaai.com/comedy/ja',
    type: 'website',
    images: [
      {
        url: 'https://aniccaai.com/anicca-app-icon.png',
        width: 1024,
        height: 1024,
        alt: 'Anicca app icon',
      },
    ],
  },
};

export default function ComedyJaLayout({ children }: { children: ReactNode }) {
  return children;
}
