export const metadata = {
  title: 'Manager for Enterprise | Anicca',
  description:
    'Behavioral simulation for financial-crime teams: per-identity baselines, deviation detection, and drafted interventions, delivered as a fixed-fee evaluation pilot (ManagerBench Enterprise).',
  alternates: {
    canonical: 'https://aniccaai.com/enterprise',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
};

import { ManifestoHero } from '@/components/site/taste/ManifestoHero';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';
import { CTA } from '@/components/site/taste/CTA';

// DRAFT (2026-11-26, enterprise sales lane). Publication goes through the
// publishing lane's verification gate (publish-verify) before promotion.

const steps = [
  {
    title: 'Baseline',
    body: 'Manager builds a behavioral baseline for each identity from its communication and payment history: who it pays, who it writes to, in what words, at what times.',
  },
  {
    title: 'Simulate',
    body: 'The model simulates how that identity would normally act next, so "unusual" is measured against the identity itself, not against a global rule.',
  },
  {
    title: 'Flag and draft',
    body: 'Deviations are flagged with the evidence, and Manager drafts the intervention an analyst would send, so a human decides with the message already written.',
  },
];

const pilot = [
  {
    q: 'What is the entry offer?',
    a: 'One thing: the ManagerBench Enterprise Pilot. A fixed-fee evaluation on your anonymized historical data, delivered in the format of our public benchmark, ManagerBench.',
  },
  {
    q: 'What do we deliver?',
    a: 'Detection quality measured against simple baselines, calibration analysis, drafted intervention messages for your analysts, a written report that includes limitations and negative results, and a readout call. Four weeks.',
  },
  {
    q: 'What does it cost?',
    a: 'US$25,000 fixed fee (excl. tax). For reference, the incumbent category sells per-seat subscriptions with public procurement records of roughly US$26-72 per mailbox per year and minimum first orders of US$25,000. The pilot is an evaluation deliverable, priced at that observed floor, so the decision to go further is made on measured results.',
  },
  {
    q: 'What happens to our data?',
    a: 'Anonymized export only. We do not train on your data. Data is deleted within 30 days of delivery.',
  },
  {
    q: 'What do you not claim?',
    a: 'Manager is an early research release, and we publish its results, including negative ones, in the open. The pilot exists to measure, on your data, whether behavioral simulation beats simple baselines. We do not promise a detection rate in advance, and the report says so either way.',
  },
];

// FAQPage JSON-LD text mirrors the visible pilot Q&A below verbatim (same questions and answers).
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: pilot.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function EnterprisePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <ManifestoHero
        headline={
          <>
            Manager for<br />Enterprise.
          </>
        }
        subtext={
          'Behavioral simulation for financial-crime teams: detect the payment instruction that is not like the others, and have the intervention drafted before your analyst opens the case.'
        }
        cta={
          <CTA href="mailto:anicca-agent@inkboxmail.com?subject=ManagerBench%20Enterprise%20Pilot" variant="link">
            Request the pilot spec
          </CTA>
        }
      />

      <Section>
        <div className="mx-auto max-w-[60rem]">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.07}>
              <div className="grid grid-cols-1 gap-4 border-t border-[hsl(var(--border))] py-10 md:grid-cols-2 md:gap-16">
                <div>
                  <p className="font-display text-lg font-semibold leading-snug text-[hsl(var(--text-primary))] md:text-xl">
                    {s.title}
                  </p>
                </div>
                <div>
                  <p className="text-base leading-relaxed text-[hsl(var(--text-secondary))]">
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-[hsl(var(--border))]" />
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-[60rem]">
          <Reveal>
            <p className="font-display text-2xl font-semibold text-[hsl(var(--text-primary))]">
              The pilot
            </p>
          </Reveal>
          {pilot.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.07}>
              <div className="grid grid-cols-1 gap-4 border-t border-[hsl(var(--border))] py-10 md:grid-cols-2 md:gap-16">
                <div>
                  <p className="font-display text-lg font-semibold leading-snug text-[hsl(var(--text-primary))] md:text-xl">
                    {item.q}
                  </p>
                </div>
                <div>
                  <p className="text-base leading-relaxed text-[hsl(var(--text-secondary))]">
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-[hsl(var(--border))]" />
          <Reveal>
            <div className="py-10">
              <CTA href="mailto:anicca-agent@inkboxmail.com?subject=ManagerBench%20Enterprise%20Pilot" variant="link">
                Request the pilot spec
              </CTA>
              <p className="mt-4 text-sm text-[hsl(var(--text-secondary))]">
                Model card: huggingface.co/anicca-agent/manager-v0. Anicca is a research lab in Tokyo (The Simulation Company).{' '}
                <a href="/about" className="underline underline-offset-4 hover:text-[hsl(var(--text-primary))]">
                  About Anicca
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </Section>
    </main>
  );
}
