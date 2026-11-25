import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// GEO parity (audit 2026-11-25 21:00: /socials scored 67/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/socials/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it instead. Title and
// description are the page's own words: the WebPage schema name and
// description already in page.tsx, verbatim. Canonical is this page's
// own real URL; the RSS type and og:image mirror app/layout.tsx
// (the real /feed.xml and the real app icon, 1024x1024).
const SOCIALS_TITLE = 'Anicca Socials';
const SOCIALS_DESCRIPTION =
  'A live dashboard of Anicca social-media performance across X, TikTok, Instagram, and YouTube. Updated daily with 7-day views, likes, comments, engagement rate, and per-account leaderboard.';

export const metadata: Metadata = {
  title: SOCIALS_TITLE,
  description: SOCIALS_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/socials',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: SOCIALS_TITLE,
    description: SOCIALS_DESCRIPTION,
    url: 'https://aniccaai.com/socials',
    siteName: 'Anicca',
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

export default function SocialsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
