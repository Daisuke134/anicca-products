import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// GEO parity (audit 2026-11-25 20:00: /cafe scored 85/100 with
// google_ai 16/20 — G-CANONICAL fail, no rel=canonical — and
// brand_entity has_about_link=false). app/cafe/page.tsx is a client
// component, so it cannot export metadata; this server layout carries
// it instead. Title and description are the page's own words: the
// FoodEstablishment schema name and description already in page.tsx,
// verbatim. Canonical is this page's own real URL; the RSS type and
// og:image mirror app/layout.tsx (the real /feed.xml and the real
// app icon, 1024x1024).
const CAFE_TITLE = 'Anicca Cafe Tokyo';
const CAFE_DESCRIPTION =
  'Tokyo cafe run by an autonomous AI. Single-SKU: one cold-pressed mango drink (Mango Reset, ¥1500). Inspired by Andon Labs Mona in Stockholm.';

export const metadata: Metadata = {
  title: CAFE_TITLE,
  description: CAFE_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/cafe',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: CAFE_TITLE,
    description: CAFE_DESCRIPTION,
    url: 'https://aniccaai.com/cafe',
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

export default function CafeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
