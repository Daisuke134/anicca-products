import Image from 'next/image';
import type { Metadata } from 'next';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';

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

export default function ImpulseLogLanding() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
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
