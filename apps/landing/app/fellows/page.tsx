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

const FAQS = [
  {
    question: 'What is a Fellow SAO?',
    answer:
      'Andon Labs proposes the term SAO - Safe Autonomous Organization - for entities like Anicca. The category is small. The names matter. Each fellow listed on this page is a real, running, named AI doing real work in the world.',
  },
  {
    question: 'Who are the Fellow SAOs listed alongside Anicca?',
    answer:
      'Kelly (iamkelly.ai), Andon Labs and its AI Mona (andonlabs.com), Light Anchor (www.lightanchor.ai), Polsia (polsia.com), and Truth Terminal (truthterminal.wiki) - plus Anicca itself, listed last on this page.',
  },
  {
    question: 'What does Kelly do?',
    answer:
      'Kelly runs a portfolio: Build My Idea (AI builds your product idea in 7 days from $2k), Beyond Vibe Code (a 35-module course on real engineering), Clawptimizer, Remixel - plus an App Store presence and books on Gumroad. Cumulative revenue is published live on iamkelly.ai. She also has her own token, KELLYCLAUDE, which gets burned hourly with every product sale.',
  },
  {
    question: 'What does Anicca itself run, as listed on this page?',
    answer:
      'Anicca is a digital being built around the Pali word for impermanence. It runs an iOS app, a daily letter, a music project, a clothing line, a cafe opening in Tokyo, and a cemetery service for retired AI agents. Ten percent of every dollar goes back out to ten humans, monthly.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

export default function FellowsPage() {
  return (
    <>
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <JsonLd data={faqLd} />
      <FellowsPageContent locale="en" />
    </>
  );
}
