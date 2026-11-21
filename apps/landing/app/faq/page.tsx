import type { Metadata } from 'next';

// GEO parity (audit 2026-11-21: /faq scored 76/100 with
// meta has_canonical=false / canonical_url empty and brand_entity
// has_about_link=false). The layout's description is repeated verbatim
// here so schema_desc_matches_meta stays true; the canonical is this
// page's own real URL; the RSS type and og:image mirror app/layout.tsx
// (the real /feed.xml and the real app icon, 1024x1024, already the
// Organization logo in public/ai/summary.json). The Q&A copy below is
// NOT touched (§11.F verbatim rule).
const FAQ_DESCRIPTION =
  "Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.";

export const metadata: Metadata = {
  title: 'FAQ | Anicca',
  description: FAQ_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/faq',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'FAQ | Anicca',
    description: FAQ_DESCRIPTION,
    url: 'https://aniccaai.com/faq',
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

import { ManifestoHero } from '@/components/site/taste/ManifestoHero';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';
import { CTA } from '@/components/site/taste/CTA';
import JsonLd from '@/components/JsonLd';

// §11.F: Q&A copy verbatim - no character changed
const faqs = [
  {
    q: 'Is my data private?',
    a: 'Yes. Local-first, least privilege, no telemetry.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'iOS 17 or later (iPhone).',
  },
  {
    q: 'How does Anicca help me?',
    a: 'Anicca sends proactive nudges based on your struggles to help you build better habits.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <main>
      <JsonLd data={faqLd} />
      {/* §4.3: ManifestoHero for FAQ headline */}
      <ManifestoHero
        headline={
          <>
            {/* TODO(i18n): EN */}
            Frequently<br />asked.
          </>
        }
        subtext={/* TODO(i18n): EN */ 'Everything you need to know about Anicca.'}
        cta={<CTA href="/" variant="link">{/* TODO(i18n): EN */}Back to aniccaai.com</CTA>}
      />

      {/* §9.F: NO accordion. Side-by-side 2-col (question + answer) with dividers. */}
      <Section>
        <div className="mx-auto max-w-[60rem]">
          {faqs.map((item, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="grid grid-cols-1 gap-4 border-t border-[hsl(var(--border))] py-10 md:grid-cols-2 md:gap-16">
                {/* Question column */}
                <div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-[hsl(var(--text-primary))] md:text-xl">
                    {item.q}
                  </h3>
                </div>
                {/* Answer column */}
                <div>
                  <p className="text-base leading-relaxed text-[hsl(var(--text-secondary))]">
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          {/* closing border */}
          <div className="border-t border-[hsl(var(--border))]" />
          {/* About link (GEO brand_entity parity: the homepage and the
              guide/index pages link to /about; /faq never did). The
              destination is the site's real About page, verified live. */}
          <p className="py-10 text-base">
            <a
              href="/about"
              className="underline underline-offset-2 text-[hsl(var(--text-secondary))]"
            >
              About Anicca
            </a>
          </p>
        </div>
      </Section>
    </main>
  );
}
