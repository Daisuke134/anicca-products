import Image from 'next/image';
import Link from 'next/link';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';

export const metadata = {
  title: 'Honne — Chat Intent Revealed by AI',
  description:
    'Paste any LINE or chat message to reveal hidden emotions and get a reply that won’t damage the relationship. Free: 3 analyses per day.',
  alternates: {
    languages: {
      en: 'https://aniccaai.com/honne',
      ja: 'https://aniccaai.com/honne/ja',
    },
  },
};

const APP_STORE_URL =
  'https://apps.apple.com/app/honne/id6759667221?pt=93486075&ct=site_honne&mt=8';

const FEATURES = [
  'Paste any LINE or chat message and get an instant read on what they may really mean',
  'AI analysis of hidden emotions — anger, anxiety, loneliness, hope — behind the words',
  'Suggested replies aimed at protecting the relationship, not just translating text',
  'Relationship contexts: partner/couple, friend, family, colleague/boss',
  'Free: 3 analyses per day · Premium: unlimited analyses, full history, priority speed, deeper insights',
];

const SCREENSHOTS = [
  { src: '/honne/screenshot-1.jpg', alt: 'Honne onboarding screen' },
  { src: '/honne/screenshot-2.jpg', alt: 'Honne message analysis screen' },
  { src: '/honne/screenshot-3.jpg', alt: 'Honne analysis result screen' },
  { src: '/honne/screenshot-4.jpg', alt: 'Honne history screen' },
];

export default function HonneLandingEn() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <SplitHero
        eyebrow="iOS · Utilities · by Daisuke Narita"
        headline={
          <>
            Chat intent,
            <br />
            revealed by AI
          </>
        }
        subtext="Paste a LINE or chat message. Honne surfaces the emotion behind the words and a reply that won’t wreck the relationship."
        primary={<CTA href={APP_STORE_URL}>Download on the App Store</CTA>}
        secondary={
          <Link
            href="/honne/ja"
            className="text-sm text-[hsl(var(--text-secondary))] underline-offset-4 hover:underline"
          >
            日本語
          </Link>
        }
        asset={
          <Image
            src="/honne/app-icon.png"
            alt="Honne app icon"
            width={512}
            height={512}
            className="mx-auto h-auto w-full max-w-[280px] object-contain"
            priority
          />
        }
      />

      <Section>
        <Reveal>
          <h2 className="mb-8 text-2xl font-semibold text-[hsl(var(--text-primary))]">
            What Honne does
          </h2>
        </Reveal>
        <ul className="space-y-3 text-lg text-[hsl(var(--text-primary))]">
          {FEATURES.map((item, i) => (
            <Reveal key={item} delay={i * 0.06}>
              <li className="ml-6 list-disc">{item}</li>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <Reveal>
          <h2 className="mb-8 text-2xl font-semibold text-[hsl(var(--text-primary))]">
            Inside the app
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SCREENSHOTS.map((shot, i) => (
            <Reveal key={shot.src} delay={i * 0.06}>
              <Image
                src={shot.src}
                alt={shot.alt}
                width={320}
                height={693}
                className="h-auto w-full rounded-card border border-[hsl(var(--border))] object-cover"
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg text-[hsl(var(--text-secondary))]">
              Requires iOS 18 or later. Free to download with optional in-app subscriptions.
            </p>
            <CTA href={APP_STORE_URL}>Get Honne</CTA>
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--text-secondary))]">
        <div className="mx-auto max-w-[1400px] space-y-2">
          <p>
            <a href="/honne/privacy" className="underline hover:text-[hsl(var(--text-primary))]">
              Privacy Policy
            </a>
            {' · '}
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              className="underline hover:text-[hsl(var(--text-primary))]"
            >
              Terms of Use (EULA)
            </a>
            {' · '}
            <a href="/honne/support" className="underline hover:text-[hsl(var(--text-primary))]">
              Support
            </a>
            {' · '}
            <a href="/honne/ja" className="underline hover:text-[hsl(var(--text-primary))]">
              日本語
            </a>
          </p>
          <p>© 2026 Daisuke Narita. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
