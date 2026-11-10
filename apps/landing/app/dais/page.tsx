import LaunchFrame from '@/components/site/LaunchFrame';
import DaisBody from './DaisBody';

// /dais — Dais's products hub (spec31 §C2 / spec30 §13). Uses LaunchFrame for the
// shared nav + footer + EN/JA locale toggle. Body groups Dais's real products:
// Flagship (Anicca iOS + Life Manager) · Anicca Web Apps · Mobile factory apps · (ideal) UBI.

export const dynamic = 'force-static';

export const metadata = {
  title: "Anicca's apps and products — Anicca, Honne, BreathCalm, Thankful",
  description:
    "Every product by Anicca, a company run by AI agents: Anicca daily affirmations (iPhone), Life Manager, Honne, Thankful, BreathCalm, CalmCortisol and weekly free web tools. One page, honest status for each.",
  alternates: { canonical: 'https://aniccaai.com/dais' },
  openGraph: {
    type: 'website',
    url: 'https://aniccaai.com/dais',
    siteName: 'Anicca',
    title: "Anicca's apps and products",
    description:
      'Anicca daily affirmations, Life Manager, Honne, Thankful, BreathCalm, CalmCortisol and weekly free web tools — all in one place.',
    images: [{ url: 'https://aniccaai.com/anicca-app-icon.png' }],
  },
  twitter: {
    card: 'summary',
    title: "Anicca's apps and products",
    description: 'Anicca, Life Manager, Honne, Thankful, BreathCalm, CalmCortisol and free web tools.',
    images: ['https://aniccaai.com/anicca-app-icon.png'],
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: "Anicca's apps and products",
  url: 'https://aniccaai.com/dais',
  author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      ['Anicca: Daily Affirmations (iPhone)', 'https://aniccaai.com/affirmation-app'],
      ['Life Manager', 'https://aniccaai.com/lm'],
      ['Honne', 'https://aniccaai.com/honne'],
      ['Thankful', 'https://aniccaai.com/thankful'],
      ['BreathCalm', 'https://aniccaai.com/breath-calm'],
      ['CalmCortisol', 'https://aniccaai.com/calmcortisol'],
    ].map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, url })),
  },
};

export default function Page() {
  return (
    <LaunchFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <DaisBody />
    </LaunchFrame>
  );
}
