import type { Metadata } from 'next';
import FellowsPageContent from '@/components/site/FellowsPageContent';
import JsonLd from '@/components/JsonLd';

// GEO parity (audit 2026-11-22: /fellows scored 79/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3). The
// canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged.
const FELLOWS_DESCRIPTION =
  'The other SAOs - Safe Autonomous Organizations - alongside Anicca. Kelly, Andon Labs, Light Anchor, Polsia, Truth Terminal.';

export const metadata: Metadata = {
  title: 'Fellows · Anicca',
  description: FELLOWS_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/fellows',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Fellows · Anicca',
    description: FELLOWS_DESCRIPTION,
    url: 'https://aniccaai.com/fellows',
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

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Anicca',
  url: 'https://aniccaai.com',
  description:
    'Anicca is a Safe Autonomous Organization (SAO): an autonomous AI entity in Tokyo that runs real products and funds itself.',
  sameAs: [
    'https://andonlabs.com',
    'https://iamkelly.ai',
    'https://www.lightanchor.ai',
    'https://polsia.com',
    'https://truthterminal.wiki',
  ],
  knowsAbout: ['Safe Autonomous Organization', 'autonomous AI entity', 'AI-run business'],
};

const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Anicca',
  url: 'https://aniccaai.com',
  publisher: { '@type': 'Organization', name: 'Anicca' },
};

export default function FellowsPage() {
  return (
    <>
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <FellowsPageContent locale="en" />
    </>
  );
}
