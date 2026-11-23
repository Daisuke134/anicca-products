import Image from 'next/image';
import type { Metadata } from 'next';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';
import JsonLd from '@/components/JsonLd';

// GEO parity (audit 2026-11-23: this page's live HTML had no
// rel="canonical" and no About link; live baseline 22,197 bytes,
// canonical x0, About x0 via pinned-DNS fetch; page audit 75/100
// with google_ai 16/20, G-CANONICAL fail, brand_entity 3/12).
// The canonical is this page's own real URL; the RSS type and
// og:image mirror app/layout.tsx (the real /feed.xml and the
// real app icon, 1024x1024, already this page's hero asset).
// Title and description are unchanged, so nothing about the
// page content or its facts changes.
export const metadata: Metadata = {
  title: 'ImpulseLog - Anger & ADHD Diary',
  description:
    'Log your emotional explosions in 30 seconds. Discover your ADHD/HSP triggers. Break the cycle of regret.',
  alternates: {
    canonical: 'https://aniccaai.com/impulse-log',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'ImpulseLog - Anger & ADHD Diary',
    description:
      'Log your emotional explosions in 30 seconds. Discover your ADHD/HSP triggers. Break the cycle of regret.',
    url: 'https://aniccaai.com/impulse-log',
    type: 'website',
    images: [
      {
        url: 'https://aniccaai.com/anicca-app-icon.png',
        width: 1024,
        height: 1024,
        alt: 'ImpulseLog app icon',
      },
    ],
  },
};

const features = [
  { icon: '⚡', title: '30-Second Log', body: 'Capture emotional surges before they fade. Designed for impulsive moments.' },
  { icon: '📊', title: 'Pattern Reports', body: 'Weekly reports reveal your top triggers and most vulnerable times.' },
  { icon: '🔒', title: '100% Private', body: 'All data stays on your device. No cloud sync, no sharing.' },
];


const FAQS = [
  {
    question: 'What is ImpulseLog?',
    answer:
      'ImpulseLog is an iOS app by Anicca that helps people with ADHD and HSP track anger, impulses, and emotional surges - and discover the hidden triggers behind them. You log an emotional explosion in 30 seconds. ImpulseLog is a tracking diary, not a medical treatment.',
  },
  {
    question: 'How long does it take to log an entry in ImpulseLog?',
    answer:
      'An entry takes 30 seconds. The log is designed for impulsive moments, so you can capture emotional surges before they fade.',
  },
  {
    question: 'What do ImpulseLog pattern reports show?',
    answer:
      'Weekly pattern reports reveal your top triggers and most vulnerable times.',
  },
  {
    question: 'Is ImpulseLog private?',
    answer:
      'Yes. All data stays on your device. There is no cloud sync and no sharing.',
  },
] as const;

const impulseLogLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ImpulseLog',
    operatingSystem: 'iOS',
    applicationCategory: 'HealthApplication',
    url: 'https://aniccaai.com/impulse-log',
    description:
      'Log your emotional explosions in 30 seconds. Discover your ADHD/HSP triggers. Break the cycle of regret.',
    downloadUrl: 'https://apps.apple.com/app/id6746798349',
    publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
];

export default function ImpulseLogLanding() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <JsonLd data={impulseLogLd} />
      <SplitHero
        eyebrow="Available on iOS"
        headline={
          <>
            Emotional Explosion?<br />Log it in 30 seconds.
          </>
        }
        subtext="ImpulseLog helps people with ADHD and HSP track anger, impulses, and emotional surges - and discover the hidden triggers behind them."
        primary={
          <CTA href="https://apps.apple.com/app/id6746798349">
            Download on App Store
          </CTA>
        }
        asset={
          <Image
            src="/anicca-app-icon.png"
            alt="ImpulseLog app icon"
            width={400}
            height={400}
            className="w-full h-auto object-cover"
            priority
          />
        }
      />

      <Section>
        <Reveal>
          <h2 className="text-3xl font-bold text-center text-[hsl(var(--text-primary))] mb-12">
            Break the Cycle
          </h2>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-[hsl(var(--text-primary))]">{f.title}</h3>
                <p className="text-sm text-[hsl(var(--text-secondary))]">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-2xl font-semibold">What is ImpulseLog?</h2>
          <p className="text-base text-[hsl(var(--text-secondary))] max-w-2xl mt-4">
            ImpulseLog is an iOS app by Anicca for people with ADHD and HSP: log an
            emotional explosion in 30 seconds, track anger, impulses, and emotional
            surges, and discover the hidden triggers behind them. Weekly pattern
            reports reveal your top triggers and most vulnerable times. ImpulseLog
            is a tracking diary, not a medical treatment.
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-2xl font-semibold">Questions about ImpulseLog</h2>
          <div className="max-w-2xl mt-6">
            {FAQS.map((f) => (
              <div key={f.question} className="mt-6">
                <h3 className="text-lg font-medium">{f.question}</h3>
                <p className="text-base text-[hsl(var(--text-secondary))] mt-2">{f.answer}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-[hsl(var(--border))] px-4 py-12 text-center">
        <p className="text-sm text-[hsl(var(--text-secondary))] mb-4">
          ImpulseLog by Anicca
        </p>
        <div className="flex justify-center gap-6 text-sm text-[hsl(var(--text-secondary))]">
          <a href="/about" className="hover:text-[hsl(var(--text-primary))] transition-colors">About Anicca</a>
          <a href="/impulse-log/privacy/en" className="hover:text-[hsl(var(--text-primary))] transition-colors">Privacy Policy</a>
          <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" className="hover:text-[hsl(var(--text-primary))] transition-colors">Terms of Use</a>
        </div>
      </footer>
    </main>
  );
}
