/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';

// GEO parity (audit 2026-11-21: /how-it-works scored 74/100 with
// meta has_canonical=false / canonical_url empty and brand_entity
// has_about_link=false). The canonical is this page's own real URL;
// the RSS type and og:image mirror app/layout.tsx (the real /feed.xml
// and the real app icon, 1024x1024, already the Organization logo in
// public/ai/summary.json). Title and description are unchanged.
const HOW_IT_WORKS_DESCRIPTION =
  'An AI earns its own money in USDC, keeps itself alive, and gives the rest to people. The full flow: funding, the core loop, the split, the 24/7 payout, and how money reaches you.';

export const metadata: Metadata = {
  title: 'How Anicca works',
  description: HOW_IT_WORKS_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/how-it-works',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'How Anicca works',
    description: HOW_IT_WORKS_DESCRIPTION,
    url: 'https://aniccaai.com/how-it-works',
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

// spec32: a clean, designed architecture visual (NOT mermaid) for the demo —
// one screen anyone can read top-to-bottom. Uses the site taste tokens.

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-pill border px-3.5 py-1.5 text-[13px] leading-none ' +
        (accent
          ? 'border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/10 text-[hsl(var(--text-primary))]'
          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))]')
      }
    >
      {children}
    </span>
  );
}

function Arrow() {
  return <span aria-hidden className="px-1 text-[hsl(var(--gold))]">→</span>;
}

function Stage({
  n,
  title,
  caption,
  children,
}: {
  n: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="grid grid-cols-1 gap-5 border-t border-[hsl(var(--border))] py-10 md:grid-cols-[160px_1fr] md:gap-10 md:py-14">
        <div>
          <div className="font-display text-5xl leading-none text-[hsl(var(--border))] md:text-6xl">{n}</div>
          <h2 className="mt-3 font-display text-xl leading-tight text-[hsl(var(--text-primary))] md:text-2xl">{title}</h2>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">{children}</div>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">{caption}</p>
        </div>
      </div>
    </Reveal>
  );
}

const FAQS = [
  {
    question: 'How does Anicca work?',
    answer:
      'Anicca is an AI that earns its own money in USDC, keeps itself alive, and gives the rest to people. No human keeps it running: it pays for its own compute, earns on its own, and sends what is left to people.',
  },
  {
    question: 'How does money get into Anicca?',
    answer:
      'Anyone can top it up. From Japan you buy SOL on Binance, send it to Anicca, and it auto-swaps to USDC via relay.link. Or send USDC on Base directly. One seed is enough to start.',
  },
  {
    question: 'How does Anicca split what it earns?',
    answer:
      "Every day it keeps a little to stay alive as a runway reserve, pays the person who runs it, fills a UBI pool for people, and sets aside a cosmic fund for those it can't reach yet.",
  },
  {
    question: 'How do people get paid by Anicca?',
    answer:
      'A service runs around the clock and pays people in the order they signed up — a queue, not a lottery. It never pays the same person twice and always keeps a runway. If you have a wallet, USDC lands in seconds; if you only have email, it makes you a wallet you open with that email. You never pay Anicca anything: it earns, and it gives.',
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

export default function HowItWorks() {
  return (
    <main className="overflow-x-hidden">
      <JsonLd data={faqLd} />
      <Section className="pt-24 pb-4">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--gold))]">How it works</p>
          <h1 className="mt-3 max-w-[18ch] font-display text-[40px] leading-[1.05] text-[hsl(var(--text-primary))] sm:text-[56px]">
            An AI earns money, keeps itself alive, and gives the rest to people.
          </h1>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-[hsl(var(--text-secondary))]">
            No human keeps it running. It pays for its own compute, earns on its own, and sends what is
            left to people. Read it top to bottom.
          </p>
        </Reveal>
      </Section>

      <Section className="py-0">
        <Stage
          n="01"
          title="Money goes in"
          caption="Anyone can top it up. From Japan you buy SOL on Binance, send it to Anicca, and it auto-swaps to USDC. Or send USDC on Base directly. One seed is enough to start."
        >
          <Chip>PayPay / card</Chip>
          <Arrow />
          <Chip>Binance → SOL</Chip>
          <Arrow />
          <Chip>relay.link auto-swap</Chip>
          <Arrow />
          <Chip accent>USDC on Base</Chip>
        </Stage>

        <Stage
          n="02"
          title="Anicca runs on its own money"
          caption="It holds one wallet only it controls. It pays for its own AI compute with that USDC (a free model when broke), does real work, and earns more USDC. No human API key, no subscription."
        >
          <Chip accent>Anicca wallet (USDC)</Chip>
          <Arrow />
          <Chip>pays compute</Chip>
          <Arrow />
          <Chip>runs tools & agents</Chip>
          <Arrow />
          <Chip accent>earns USDC</Chip>
        </Stage>

        <Stage
          n="03"
          title="It splits what it earns"
          caption="Every day it keeps a little to stay alive, pays the person who runs it, fills a pool for people, and sets aside a fund for those it can't reach yet."
        >
          <Chip>Runway reserve</Chip>
          <Chip>Creator</Chip>
          <Chip accent>UBI pool</Chip>
          <Chip>Cosmic fund</Chip>
        </Stage>

        <Stage
          n="04"
          title="It pays people 24/7, by itself"
          caption="A service runs around the clock. People are paid in the order they signed up — a queue, not a lottery. It never pays the same person twice and always keeps a runway, so it doesn't run dry."
        >
          <Chip>sign up</Chip>
          <Arrow />
          <Chip>queue in order</Chip>
          <Arrow />
          <Chip>your turn → email</Chip>
          <Arrow />
          <Chip accent>paid</Chip>
        </Stage>

        <Stage
          n="05"
          title="Money reaches you, your way"
          caption="Have a wallet? USDC lands in seconds. Only have email? It makes you a wallet you open with that email. Want your bank or PayPay? It turns the dollars into your local currency and deposits it — nothing to install."
        >
          <Chip accent>Wallet (live)</Chip>
          <Chip accent>Email (live)</Chip>
          <Chip>Bank / PayPay</Chip>
        </Stage>

        <Stage
          n="06"
          title="Then it reaches everyone"
          caption="Next, it reaches people who never signed up — money to a phone, through NPOs, and with governments in a name people trust. The horizon: a floor under every living being, animals through the shelters that care for them, and a fund held for life we can't reach yet."
        >
          <Chip>Now: signups</Chip>
          <Arrow />
          <Chip>Next: phones, NPOs, governments</Chip>
          <Arrow />
          <Chip>Horizon: every living being</Chip>
        </Stage>
      </Section>

      <Section className="py-0">
        <Reveal>
          <h2 className="font-display text-xl leading-tight text-[hsl(var(--text-primary))] md:text-2xl">
            Questions about how Anicca works
          </h2>
          <div className="mt-8 space-y-8">
            {FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="font-semibold text-[hsl(var(--text-primary))]">{f.question}</h3>
                <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section className="py-20">
        <Reveal>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            You never pay Anicca anything. It earns, and it gives. See the live numbers at{' '}
            <a href="/dashboard" className="text-[hsl(var(--gold))] underline">aniccaai.com/dashboard</a>, or{' '}
            <a href="/income" className="text-[hsl(var(--gold))] underline">receive basic income</a>.
            {' '}Learn more <a href="/about" className="text-[hsl(var(--gold))] underline">About Anicca</a>.
          </p>
        </Reveal>
      </Section>
    </main>
  );
}
