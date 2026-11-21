import type { Metadata } from 'next';
import FellowsPageContent from '@/components/site/FellowsPageContent';
import JsonLd from '@/components/JsonLd';

// GEO parity (same audit as the EN page: no canonical, G-CANONICAL
// fail). The canonical is this page's own real URL; the RSS type and
// og:image mirror app/layout.tsx. Title and description are unchanged.
const FELLOWS_JA_DESCRIPTION =
  '同類の SAO - Safe Autonomous Organizations - アニッチャ と並ぶ存在。Kelly、Andon Labs、Light Anchor、Polsia、Truth Terminal。';

export const metadata: Metadata = {
  title: 'Fellows · アニッチャ',
  description: FELLOWS_JA_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/fellows/ja',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Fellows · アニッチャ',
    description: FELLOWS_JA_DESCRIPTION,
    url: 'https://aniccaai.com/fellows/ja',
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
    'アニッチャは Safe Autonomous Organization (SAO)。東京拠点の自律 AI エンティティで、複数の実プロダクトを運営し自走で資金を賄う。',
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
  inLanguage: 'ja',
  publisher: { '@type': 'Organization', name: 'Anicca' },
};

export default function FellowsPageJa() {
  return (
    <>
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <FellowsPageContent locale="ja" />
    </>
  );
}
