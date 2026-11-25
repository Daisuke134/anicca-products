import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { SplitHero } from '@/components/site/taste/SplitHero';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';
import { CTA } from '@/components/site/taste/CTA';

// GEO parity (audit 2026-11-25: /factory scored 77/100 with
// meta has_canonical=false via the plain metadata object,
// google_ai G-CANONICAL fail, brand_entity has_about_link=false,
// and the recommendation "Add FAQPage schema with site FAQs").
// The canonical is this page's own real URL; the RSS type and
// og:image mirror app/layout.tsx (the real /feed.xml and the real
// app icon, 1024x1024, already the Organization logo in
// public/ai/summary.json). Title and description are unchanged.
const FACTORY_DESCRIPTION =
  'Small useful web apps and free research tools from Anicca. See each product for current availability and pricing.';

export const metadata: Metadata = {
  title: 'Anicca Web Apps - small useful tools, weekly',
  description: FACTORY_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/factory',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Anicca Web Apps - small useful tools, weekly',
    description: FACTORY_DESCRIPTION,
    url: 'https://aniccaai.com/factory',
    siteName: 'Anicca',
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

// GEO (2026-11-25): visible FAQ + FAQPage build-out, following the
// /politics, /cfo and /fashion pattern. Every answer is built only
// from this page's own stated content (hero, app cards, pipeline
// and "What it is" sections); no new facts, prices or dates added.
const FAQS = [
  {
    question: 'What is Anicca Web Apps?',
    answer:
      'Anicca Web Apps is the web instance of the Anicca swarm: one useful tool every week. Anicca picks the niche, builds the app, ships it, and charges for it. Each app solves one specific suffering. The apps are written by Anicca with the open-source ralph loop, deployed to Vercel, and Stripe-billed.',
  },
  {
    question: 'Which apps are listed here, and what do they cost?',
    answer:
      'The page lists AI Monk Database (Free; source-linked AI monk profiles, products, and revenue evidence), AI Monk Factory (Preparing; three finished videos free, $199/mo after), PDF Insight ($19/mo; turn any PDF into instant answers), GlowUp AI (Free; AI face score and glow-up roadmap), Lookmax (Coming), and Honne (Free with in-app purchases; chat intent revealed by AI). Prices vary by app, so see each app for current availability and pricing.',
  },
  {
    question: 'How does the factory pick, build, and ship an app?',
    answer:
      'Every Monday the factory cron reads trends and selects one specific problem worth solving. Anicca then writes the code with the open-source ralph loop, deploys to Vercel, and wires Stripe, shipping an app by Friday. Revenue from every app flows into aniccaai.com.',
  },
  {
    question: 'Do all of the factory apps succeed?',
    answer:
      'No. As this page states, they do not all hit. The ones that do, scale. Each app solves one specific problem — too many PDFs, too long emails, too many unread Slack threads — and each lives at its own URL.',
  },
] as const;

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const factoryLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Anicca Web Apps',
  url: 'https://aniccaai.com/factory',
  serviceType: 'Micro-SaaS subscription tools',
  provider: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  description: metadata.description,
};

const APPS = [
  {
    name: 'AI Monk Database',
    href: '/ai-monk-database',
    tagline: 'Source-linked AI monk profiles, products, and revenue evidence',
    price: 'Free',
    bgClass: 'bg-[hsl(var(--surface-elevated))]',
    accentClass: 'bg-[hsl(var(--gold)/0.15)]',
  },
  {
    name: 'AI Monk Factory',
    href: '/ai-monk-factory',
    tagline: 'AI monk avatars and complete scripted Reels that introduce The Art of AI Monks. Three finished videos free; connect Instagram to start daily posting.',
    price: 'Preparing · 3 videos free · $199/mo after',
    bgClass: 'bg-[hsl(var(--surface))]',
    accentClass: 'bg-[hsl(var(--gold)/0.08)]',
  },
  {
    name: 'PDF Insight',
    href: 'https://clear-pdf-converter.com',
    tagline: 'Turn any PDF into instant answers',
    price: '$19/mo',
    bgClass: 'bg-[hsl(var(--surface-elevated))]',
    accentClass: 'bg-[hsl(var(--gold)/0.15)]',
  },
  {
    name: 'GlowUp AI',
    href: 'https://iglowup-ai.lovable.app',
    tagline: 'AI face score + glow-up roadmap',
    price: 'Free',
    bgClass: 'bg-[hsl(var(--surface))]',
    accentClass: 'bg-[hsl(var(--gold)/0.08)]',
  },
  {
    name: 'Lookmax',
    href: null,
    tagline: 'Small tool that funds the mission',
    price: 'Coming',
    bgClass: 'bg-[hsl(var(--surface-muted,var(--surface)))]',
    accentClass: 'bg-[hsl(var(--border)/0.4)]',
  },
  {
    name: 'Honne',
    href: '/honne',
    tagline: 'Chat intent revealed by AI — paste LINE/chat, get emotion + reply',
    price: 'Free · IAP',
    bgClass: 'bg-[hsl(var(--surface))]',
    accentClass: 'bg-[hsl(var(--border)/0.4)]',
  },
];

// §9.F pipeline labels: verb-noun direct (Pick / Build / Ship - no Stage/Step/Phase)
const PIPELINE = [
  { verb: 'Pick', noun: 'Niche', body: 'Every Monday the factory cron reads trends and selects one specific problem worth solving.' },
  { verb: 'Build', noun: 'App', body: 'Anicca writes the code with the open-source ralph loop, deploys to Vercel, wires Stripe.' },
  { verb: 'Ship', noun: 'Revenue', body: 'Revenue from every app flows into aniccaai.com. The ones that scale, scale.' },
];

export default function Page() {
  return (
    <main>
      <JsonLd data={factoryLd} />
      <JsonLd data={faqLd} />

      {/* Hero */}
      <SplitHero
        eyebrow="Anicca Web Apps"
        headline={<>One useful tool,<br />every week.</>}
        subtext="Anicca picks the niche, builds the app, ships it, charges for it. Each solves one specific suffering. See each app for pricing and availability."
        primary={<CTA href="/en">Back to Anicca</CTA>}
        secondary={<CTA href="/fellows" variant="link">SAO Fellows</CTA>}
        asset={
          // §4.8 real visual - Anicca brand asset
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/anicca-app-icon.png"
            alt="Anicca app icon"
            className="h-full w-full object-cover"
            width={1024}
            height={1024}
          />
        }
      />

      {/* Existing app cards include current availability. */}
      <Section id="apps">
        <Reveal>
          <p className="mb-8 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
            Explore our apps
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {APPS.map((app, i) => (
            <Reveal key={app.name} delay={i * 0.06}>
              <div
                className={[
                  'relative flex flex-col gap-4 overflow-hidden rounded-card border border-[hsl(var(--border))] px-6 py-6',
                  app.bgClass,
                ].join(' ')}
              >
                {/* BG diversity accent blob for first 3 cells */}
                {i < 3 && (
                  <span
                    aria-hidden
                    className={[
                      'pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-1/3 translate-x-1/3 rounded-pill blur-2xl',
                      app.accentClass,
                    ].join(' ')}
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
                      {app.price}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[hsl(var(--text-primary))]">
                      {app.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                  {app.tagline}
                </p>
                {app.href ? (
                  <a
                    href={app.href}
                    {...(app.href.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="mt-auto text-sm font-medium text-[hsl(var(--gold))] underline-offset-4 hover:underline"
                  >
                    {app.href.startsWith('http') ? 'Open app' : 'View page'}
                  </a>
                ) : (
                  <span className="mt-auto text-sm text-[hsl(var(--text-secondary))] opacity-60">
                    In development
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Pipeline - §9.F verb-noun: Pick / Build / Ship (no Stage/Step/Phase labels) */}
      <Section id="pipeline">
        <Reveal>
          <p className="mb-8 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
            How it works
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PIPELINE.map((step, i) => (
              <div key={step.verb} className="rounded-card border border-[hsl(var(--border))] px-6 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-2 text-xl font-semibold text-[hsl(var(--text-primary))]">
                  {step.verb}
                  <span className="ml-1.5 text-[hsl(var(--gold))]">{step.noun}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* What it is */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-[65ch] space-y-5 text-base leading-relaxed text-[hsl(var(--text-secondary))]">
            <h2 className="text-2xl font-semibold text-[hsl(var(--text-primary))]">What it is</h2>
            <p>
              The web instance of the Anicca swarm. One tool per week. Written by Anicca
              with the open-source ralph loop, deployed to Vercel, Stripe-billed, marketed
              by the comedy and content instances.
            </p>
            <p>
              Each app solves one specific suffering: too many PDFs, too long emails, too
              many unread Slack threads. Prices vary by app. They do not all hit. The ones that do, scale.
            </p>
            <p>
              The web-app-factory cron picks a niche from trends every Monday and ships an
              app by Friday. Each lives at its own URL. Revenue from all of them flows into{' '}
              <Link href="/en" className="underline-offset-4 hover:underline text-[hsl(var(--text-primary))]">
                aniccaai.com
              </Link>.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Visible FAQ - text matches the FAQPage schema verbatim */}
      <Section id="faq">
        <Reveal>
          <div className="mx-auto max-w-[65ch]">
            <h2 className="text-2xl font-semibold text-[hsl(var(--text-primary))]">
              Questions about Anicca Web Apps
            </h2>
            <div className="mt-6 space-y-6">
              {FAQS.map((f) => (
                <div key={f.question}>
                  <h3 className="text-base font-semibold text-[hsl(var(--text-primary))]">
                    {f.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-[hsl(var(--text-secondary))]">
              <Link href="/about" className="underline underline-offset-4 hover:text-[hsl(var(--text-primary))]">
                About Anicca →
              </Link>
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Footer nav - /en and /fellows preserved verbatim (§11.F) */}
      <Section>
        <Reveal>
          <div className="border-t border-[hsl(var(--border))] pt-8 text-xs text-[hsl(var(--text-secondary))]">
            Live numbers:{' '}
            <Link href="/en" className="underline hover:text-[hsl(var(--text-primary))]">aniccaai.com</Link>
            {' '}&middot; One of the{' '}
            <Link href="/fellows" className="underline hover:text-[hsl(var(--text-primary))]">SAOs</Link>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
