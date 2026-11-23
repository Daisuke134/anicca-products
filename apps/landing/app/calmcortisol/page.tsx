import { ManifestoHero, Section, Reveal } from '@/components/site/taste';
import JsonLd from '@/components/JsonLd';

export const metadata = {
  title: 'CalmCortisol - Stress Relief in 60 Seconds',
  description:
    'CalmCortisol: 60-second breathing sessions to reset your nervous system. iOS app by Anicca, coming soon to the App Store.',
  alternates: { canonical: 'https://aniccaai.com/calmcortisol', types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' } },
};

const FAQS = [
  {
    question: 'What does CalmCortisol do?',
    answer:
      'CalmCortisol offers 60-second breathing sessions to reset your nervous system. It detects when your cortisol is spiking and steps in before you spiral, using science-backed breathing techniques.',
  },
  {
    question: 'How long is a CalmCortisol session?',
    answer: 'A session lasts 60 seconds.',
  },
  {
    question: 'Is CalmCortisol available now?',
    answer:
      'CalmCortisol is an iOS app by Anicca, coming soon to the App Store. It is not yet on the App Store.',
  },
  {
    question: 'Do I need meditation experience to use CalmCortisol?',
    answer: 'No. CalmCortisol needs no meditation experience.',
  },
] as const;

const calmCortisolLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CalmCortisol',
    operatingSystem: 'iOS',
    applicationCategory: 'HealthApplication',
    url: 'https://aniccaai.com/calmcortisol',
    description: metadata.description,
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

export default function CalmCortisolLanding() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <JsonLd data={calmCortisolLd} />
      <ManifestoHero
        headline={
          <>
            Stressed? Anxious?<br />Can&apos;t sleep?
          </>
        }
        subtext="AI-powered breathing sessions reset your nervous system in 60 seconds."
      />

      <Section>
        <Reveal>
          <h2 className="text-2xl font-semibold">What is CalmCortisol?</h2>
          <p className="text-base text-[hsl(var(--text-secondary))] max-w-2xl mt-4">
            CalmCortisol is an iPhone app by Anicca for stress relief in 60 seconds:
            short AI-powered breathing sessions designed to reset your nervous system
            when you feel stressed, anxious, or can&apos;t sleep. CalmCortisol is a
            breathing tool for stressful moments, not a medical treatment. It is
            coming soon to the App Store.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-base text-[hsl(var(--text-secondary))] max-w-2xl mt-8">
            CalmCortisol detects when your cortisol is spiking and steps in before you spiral.
            Science-backed breathing techniques. No meditation experience needed.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-12">
            Available on iOS - Coming Soon to App Store
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-sm mt-8">
            <a href="/about" className="underline underline-offset-4">About Anicca →</a>
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-2xl font-semibold">Questions about CalmCortisol</h2>
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
    </main>
  );
}
