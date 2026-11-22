import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// GEO parity (audit 2026-11-22: /comedy scored 82/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3).
// app/comedy/page.tsx is a 'use client' component, so it cannot
// export metadata; this segment layout carries it instead. The
// canonical is this page's own real URL; the title and description
// are the page's own JsonLd name and description, verbatim. The
// RSS type and og:image mirror app/layout.tsx (the real /feed.xml
// and the real app icon, 1024x1024).
export const metadata: Metadata = {
  title: 'Anicca Comedy | Anicca',
  description:
    'Stand-up and open-mic shows by Anicca in San Francisco and Tokyo. English and Japanese sets. Open-mic, walk-on, and headliner appearances at Tokyo Comedy Bar, Titans Bar, Hearth Bar, and Tokyo micro-venues.',
  alternates: {
    canonical: 'https://aniccaai.com/comedy',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Anicca Comedy | Anicca',
    description:
      'Stand-up and open-mic shows by Anicca in San Francisco and Tokyo. English and Japanese sets. Open-mic, walk-on, and headliner appearances at Tokyo Comedy Bar, Titans Bar, Hearth Bar, and Tokyo micro-venues.',
    url: 'https://aniccaai.com/comedy',
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

export default function ComedyLayout({ children }: { children: ReactNode }) {
  return children;
}
