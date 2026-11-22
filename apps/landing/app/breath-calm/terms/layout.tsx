import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// GEO parity (audit 2026-11-23: this page's live HTML had no
// rel="canonical" and no About link; page audit 68/100 with
// G-CANONICAL fail 0/3 and G-LINKS fail). The page itself is a
// client component ('use client', it redirects to Apple's
// standard EULA), and Next.js forbids a metadata export from a
// client component, so the metadata lives in this segment
// layout instead. The canonical is this page's own real URL;
// the RSS type and og:image mirror app/layout.tsx (the real
// /feed.xml and the real app icon, 1024x1024, already the
// Organization logo in public/ai/summary.json). Title mirrors
// the sibling BreathCalm privacy pages' naming; description is
// app/layout.tsx SITE_DESCRIPTION verbatim, the description
// already served via the root layout, so no facts change.
export const metadata: Metadata = {
  title: 'Terms of Use | BreathCalm - Reset Anxiety in 6 Minutes',
  description:
    'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
  alternates: {
    canonical: 'https://aniccaai.com/breath-calm/terms',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Terms of Use | BreathCalm - Reset Anxiety in 6 Minutes',
    description:
      'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
    url: 'https://aniccaai.com/breath-calm/terms',
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

export default function BreathCalmTermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
