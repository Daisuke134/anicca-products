/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';

// Build-in-public transparency page. Honest status only — what is VERIFIED vs in-progress.
// No hype. Links the public ledger. anicca earns its own money and gives it away, in the open.

// GEO parity (audit 2026-11-22: /transparency scored 72/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3). The
// canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged.
const TRANSPARENCY_DESCRIPTION =
  'What Anicca is actually doing, in the open: an autonomous AI that earns its own money and gives a share away as basic income. Verified status, public ledger, no hype.';

export const metadata: Metadata = {
  title: 'Transparency — Anicca',
  description: TRANSPARENCY_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/transparency',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Transparency — Anicca',
    description: TRANSPARENCY_DESCRIPTION,
    url: 'https://aniccaai.com/transparency',
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

const ld = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Anicca Transparency',
  url: 'https://aniccaai.com/transparency',
  description:
    'Open build log and verified status of Anicca, an autonomous AI paying a basic income with no human in the loop.',
};

// status: 'live' (verified, real E2E) | 'building' (in progress, honest)
const RAILS = [
  { title: 'Crypto wallet', status: 'live', body: 'Anicca sends real USDC (Base) to a wallet address. Verified end-to-end with a real on-chain transfer.' },
  { title: 'Email', status: 'live', body: 'No wallet needed — Anicca creates an email-owned wallet and sends. Sign in with your email to see and use it.' },
  { title: 'Bank account', status: 'building', body: 'Real local currency (JPY/USD) straight to your bank, no crypto knowledge. Rails being onboarded; the payout logic is built and tested.' },
];

const PROVEN = [
  'Earns its own money: secure x402 micropayment settled on-chain (testnet), recipient → facilitator-verified → received.',
  'Pays out 24/7 on its own: a daemon sends in queue order with a reserve floor, then emails "your turn".',
  'Funds its own gas: auto-swaps SOL→USDC and bridges across chains without a human.',
  'Open books: earnings and spending are posted publicly — money in a wallet is not the goal; real money reaching a person is.',
];


const FAQS = [
  {
    question: 'What is verified as real today on Anicca?',
    answer:
      'Anicca only calls something done when a real run actually happened. Verified today: it earns its own money (a secure x402 micropayment settled on-chain on testnet, recipient to facilitator-verified to received), pays out 24/7 on its own (a daemon sends in queue order with a reserve floor, then emails \"your turn\"), funds its own gas (auto-swaps SOL to USDC and bridges across chains without a human), and keeps open books (earnings and spending are posted publicly).',
  },
  {
    question: 'How does the money reach you from Anicca?',
    answer:
      'By crypto wallet, Anicca sends real USDC (Base) to a wallet address, verified end-to-end with a real on-chain transfer — that rail is live. By email, no wallet is needed: Anicca creates an email-owned wallet and sends, and you sign in with your email to see and use it — also live. Bank account payout in real local currency (JPY/USD) is rolling out: the rails are being onboarded and the payout logic is built and tested.',
  },
  {
    question: 'Does a human keep Anicca alive?',
    answer:
      'No human keeps Anicca alive. It pays for its own compute, earns on its own, and sends what is left to people as a basic income. Because there is no human in the loop, it does not run dry.',
  },
  {
    question: 'Where does Anicca transparency go next?',
    answer:
      'First, anyone who signs up is paid as Anicca earns. Then proactively — reaching people who never heard of Anicca and may have no bank, by sending to phones, funding cash-transfer NPOs, and partnering so money arrives in a name people already trust. The horizon is a floor under every living being. Every step is posted in the open, and live numbers are at aniccaai.com/dashboard.',
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

export default function Page() {
  return (
    <main className="overflow-x-hidden">
      <JsonLd data={ld} />
      <JsonLd data={faqLd} />

      <Section className="pt-24">
        <Reveal>
          <div className="max-w-5xl">
            <h1 className="font-display text-[34px] leading-tight text-[hsl(var(--text-primary))] sm:text-[52px]">
              An AI that earns its own money — and gives a share away, in the open.
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-[hsl(var(--text-secondary))]">
              No human keeps Anicca alive. It pays for its own compute, earns on its own, and sends what's
              left to people as a basic income. Because there's no human in the loop, it doesn't run dry.
              Here's exactly what's real today and what we're still building — no hype.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-pill bg-[hsl(var(--gold))] px-6 py-3 font-semibold text-[#18181b] transition-all duration-300 hover:brightness-95 active:scale-[0.98]">
                See the live numbers
              </Link>
              <Link href="/income" className="rounded-pill border border-[hsl(var(--border))] px-6 py-3 font-semibold text-[hsl(var(--text-primary))] transition-all duration-300 hover:border-[hsl(var(--gold))]">
                Receive basic income
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">What's real today</h2>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            We only call something done when a real run actually happened. These are verified.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:[grid-auto-flow:dense]">
            {PROVEN.map((p) => (
              <div key={p} className="group rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-6 transition-all duration-500 hover:border-[hsl(var(--gold))]">
                <p className="text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
                  <span className="font-mono text-[12px] text-[hsl(var(--gold))]">verified ✓</span><br />{p}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">How the money reaches you</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:[grid-auto-flow:dense]">
            {RAILS.map((r) => (
              <div key={r.title} className="group rounded-card border border-[hsl(var(--border))] p-6 transition-all duration-500 hover:border-[hsl(var(--gold))]">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-lg text-[hsl(var(--text-primary))]">{r.title}</p>
                  <span className={`font-mono text-[11px] ${r.status === 'live' ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--text-secondary))]'}`}>
                    {r.status === 'live' ? 'live' : 'rolling out'}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">{r.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">Where this goes</h2>
          <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            First: anyone who signs up, paid as Anicca earns. Then proactively — reaching people who never
            heard of us and may have no bank, by sending to phones, funding cash-transfer NPOs, and partnering
            so money arrives in a name people already trust. The horizon: a floor under every living being.
            Every step is posted in the open, so trust is earned by giving — not claimed.
          </p>
          <div className="mt-6 border-t border-[hsl(var(--border))] pt-6 text-sm text-[hsl(var(--text-secondary))]">
            Live numbers:{' '}
            <Link href="/dashboard" className="underline hover:text-[hsl(var(--text-primary))]">aniccaai.com/dashboard</Link>
            {' · '}
            <Link href="/income" className="underline hover:text-[hsl(var(--text-primary))]">receive basic income</Link>
            {' · '}
            <Link href="/about" className="underline hover:text-[hsl(var(--text-primary))]">About Anicca</Link>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">
            Questions about Anicca transparency
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
    </main>
  );
}
