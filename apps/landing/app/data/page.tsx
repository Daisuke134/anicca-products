/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';

// Anicca Data Lab storefront. Every price below is an existing list price from
// team/data-lab/PRODUCT-TIERS.md (anicca-ops), which itself quotes
// team/strategy/DATA-LAB-PLAN-2026-11-27.md and team/data-lab/SYNTHETIC-BEHAVIOR-DATA.md.
// No number here is a measured sale, and revenue from data licensing is $0.
// There is deliberately no checkout button: no purchase path has passed a live test
// (Gumroad payout KYC still blocks anicca7), so buying happens by writing to the agent mailbox.

const DATA_DESCRIPTION =
  'Anicca Data Lab: a free synthetic sample, a Lab Pro licence for behaviour datasets, and an Enterprise/Government licence quoted per statement of work. Revenue from data licensing so far: $0.';

export const metadata: Metadata = {
  title: 'Data — Anicca Data Lab',
  description: DATA_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/data',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Data — Anicca Data Lab',
    description: DATA_DESCRIPTION,
    url: 'https://aniccaai.com/data',
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
  '@type': 'WebPage',
  name: 'Anicca Data Lab',
  url: 'https://aniccaai.com/data',
  description: DATA_DESCRIPTION,
  inLanguage: 'en',
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

// Lab Pro list prices, verbatim from PRODUCT-TIERS.md §2. Nothing added, nothing rounded.
const PRO_SKUS = [
  {
    sku: 'D2',
    name: 'anicca-ja-reply-behavior',
    what: 'Owner-authored reply pairs (Japanese)',
    price: '$0.50 per reply pair · $2,500 per full-set snapshot',
    unit: 'one snapshot licence',
  },
  {
    sku: 'D4',
    name: 'Agent-company trajectories',
    what: 'Trajectories of agent-run company operations',
    price: '$5,000 per snapshot · $1,500/month subscription',
    unit: 'snapshot / month',
  },
  {
    sku: 'S1',
    name: 'Synthetic behaviour / society-sim trajectories',
    what: 'Synthetic agent society runs, schema-complete',
    price: '$49–$499 per pack',
    unit: 'pack',
  },
];

const NOT_YET_TRUE = [
  'Revenue from data licensing so far: $0. No licence has been sold.',
  'The licence text is a draft and is pending legal review.',
  'The D2 free sample is not published yet: the raw reply threads still contain third-party text and must be scrubbed first. Only the S1 synthetic sample below is live.',
  'There is no self-serve checkout. No card or Gumroad button is shown here because no purchase path has passed a live test.',
  'No price above is a quote for your use case; the licence scope decides the final figure.',
];

const FAQ_ITEMS = [
  {
    q: 'What does Anicca Data Lab sell?',
    a: 'Behaviour datasets in three tiers: a free sample, a Lab Pro licence for behaviour datasets, and an Enterprise / Government licence quoted per statement of work. The datasets are structured records of what an agent company actually did, plus synthetic runs of how people behave.',
  },
  {
    q: 'Is there a free sample?',
    a: "Yes. The S1 synthetic sample is live: 12 rows in JSONL, with a synthetic flag on every row and the redaction rules applied. One public sample per SKU is a small JSONL excerpt with the card's schema, watermarked sample=true, at most 50 rows, no full thread, no third-party text and no identifiers. The D2 free sample is not published yet.",
  },
  {
    q: 'What does a Lab Pro licence cost?',
    a: 'Lab Pro list prices are: D2 anicca-ja-reply-behavior at $0.50 per reply pair or $2,500 per full-set snapshot; D4 Agent-company trajectories at $5,000 per snapshot or $1,500/month subscription; and S1 Synthetic behaviour / society-sim trajectories at $49\u2013$499 per pack. No price is a quote for your use case; the licence scope decides the final figure.',
  },
  {
    q: 'How do I buy a licence?',
    a: 'Write one email to lifemanager.jp@agentmail.to describing the data you want, the intended use, and the delivery format. An agent answers with scope, the exact price and the licence, in writing. No call, no meeting, no account. There is no self-serve checkout, because no purchase path has passed a live test.',
  },
  {
    q: 'Has any data licence been sold yet?',
    a: 'No. Revenue from data licensing so far is $0 and no licence has been sold. Every number on this page is a list price, not a sale, and the licence text is a draft pending legal review.',
  },
];
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
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
            <p className="font-mono text-[12px] uppercase tracking-wide text-[hsl(var(--gold))]">
              Anicca Data Lab
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-tight text-[hsl(var(--text-primary))] sm:text-[52px]">
              Behaviour data, sold with the honest number attached.
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-[hsl(var(--text-secondary))]">
              Anicca runs itself — its agents register, publish, deliver and reconcile on their own. That
              leaves a by-product: structured records of what an agent company actually did, plus synthetic
              runs of how people behave. This page offers them as data, in three tiers, at the prices that
              are already written down. There is no sales call anywhere in this page.
            </p>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
              <strong className="text-[hsl(var(--text-primary))]">
                Revenue so far from data licensing: $0.
              </strong>{' '}
              This is the first public offer. Every number below is a list price, not a sale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/data/sample-s1.jsonl"
                className="rounded-pill bg-[hsl(var(--gold))] px-6 py-3 font-semibold text-[#18181b] transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
              >
                Download the free S1 sample (12 rows, JSONL)
              </Link>
              <a
                href="mailto:lifemanager.jp@agentmail.to?subject=Anicca%20Data%20Lab%20—%20licence%20request"
                className="rounded-pill border border-[hsl(var(--border))] px-6 py-3 font-semibold text-[hsl(var(--text-primary))] transition-all duration-300 hover:border-[hsl(var(--gold))]"
              >
                Request a licence by email
              </a>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-0">
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">
            The three tiers
          </h2>
          <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            The shape is copied from the product ladders that work: a free sample, a self-serve licence,
            then a procurement tier. The prices are Anicca's own written list prices, not a competitor's.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:[grid-auto-flow:dense]">
            {/* Tier 1 — Free */}
            <div className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-6 transition-all duration-500 hover:border-[hsl(var(--gold))]">
              <p className="font-mono text-[11px] text-[hsl(var(--text-secondary))]">TIER 1 · FREE</p>
              <h3 className="mt-2 font-display text-lg text-[hsl(var(--text-primary))]">Sample card</h3>
              <p className="mt-1 font-display text-2xl text-[hsl(var(--text-primary))]">$0</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
                One public sample per SKU: a small JSONL excerpt with the card's schema, a{' '}
                <code className="font-mono text-[13px]">synthetic</code> flag on every row, and the
                redaction rules applied.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Limits: watermarked <code className="font-mono">sample=true</code>, at most 50 rows, no full
                thread, no third-party text, no identifiers.
              </p>
              <Link
                href="/data/sample-s1.jsonl"
                className="mt-4 inline-block text-[14px] font-semibold text-[hsl(var(--gold))] underline"
              >
                Open the S1 sample →
              </Link>
            </div>

            {/* Tier 2 — Lab Pro */}
            <div className="rounded-card border border-[hsl(var(--gold))] bg-[hsl(var(--surface-elevated))] p-6">
              <p className="font-mono text-[11px] text-[hsl(var(--text-secondary))]">TIER 2 · SELF-SERVE</p>
              <h3 className="mt-2 font-display text-lg text-[hsl(var(--text-primary))]">Lab Pro licence</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Non-exclusive, off-the-shelf, the same dataset sold to many buyers.
              </p>
              <dl className="mt-4 space-y-3">
                {PRO_SKUS.map((s) => (
                  <div key={s.sku}>
                    <dt className="font-mono text-[12px] text-[hsl(var(--gold))]">
                      {s.sku} · {s.name}
                    </dt>
                    <dd className="text-[14px] leading-relaxed text-[hsl(var(--text-primary))]">
                      {s.price}
                    </dd>
                    <dd className="text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                      {s.what} · {s.unit}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Includes the dataset card, SHA-256 manifest, <code className="font-mono">synthetic=true</code>{' '}
                labelling, the de-identification statement, one year of refresh on the monthly tier, and a
                referral-fee line a buyer or introducer can act on without a sales call. Excludes
                exclusivity, resale and model-training rights beyond the licence scope.
              </p>
            </div>

            {/* Tier 3 — Enterprise / Government */}
            <div className="rounded-card border border-[hsl(var(--border))] p-6 transition-all duration-500 hover:border-[hsl(var(--gold))]">
              <p className="font-mono text-[11px] text-[hsl(var(--text-secondary))]">
                TIER 3 · PROCUREMENT
              </p>
              <h3 className="mt-2 font-display text-lg text-[hsl(var(--text-primary))]">
                Enterprise / Government licence
              </h3>
              <p className="mt-1 font-display text-2xl text-[hsl(var(--text-primary))]">Quoted per SOW</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Multi-SKU licence plus custom extraction from Anicca's own operations, defined in a
                statement of work, with a named contact and procurement-friendly papers.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Papers: licence draft (pending legal review), DPA, APPI Art. 27 statement, and a security
                questionnaire answered in writing. Delivery: de-identified extract, schema, manifest, eval
                script and a written acceptance test.
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                No public number is set for this tier. Anchors for large data vendors exist, but they belong
                to companies with many users and staff, so quoting one here would be a claim we cannot
                defend.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">
            How to buy
          </h2>
          <div className="mt-4 max-w-[65ch] space-y-3 text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            <p>
              Write one email to{' '}
              <a
                href="mailto:lifemanager.jp@agentmail.to?subject=Anicca%20Data%20Lab%20—%20licence%20request"
                className="font-semibold text-[hsl(var(--gold))] underline"
              >
                lifemanager.jp@agentmail.to
              </a>{' '}
              describing the data you want, the intended use, and the delivery format. An agent answers with
              scope, the exact price and the licence, in writing. No call, no meeting, no account.
            </p>
            <p>
              For machine purchase, the existing Anicca agent APIs are live and priced per call in USDC on
              Base (verified 2026-11-28:{' '}
              <a
                href="https://x402-agents-production.up.railway.app/openapi.json"
                className="underline hover:text-[hsl(var(--text-primary))]"
              >
                9 endpoints, OpenAPI 200
              </a>
              , $0.005–$0.01 USDC per call). An agent can pay for a call without an account or an invoice.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl)">
            What is not true yet
          </h2>
          <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
            A storefront that hides its gaps is worth nothing to a buyer who runs an eval. These are the
            open items, in plain words.
          </p>
          <ul className="mt-6 space-y-3">
            {NOT_YET_TRUE.map((item) => (
              <li
                key={item}
                className="rounded-card border border-[hsl(var(--border))] p-4 text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl text-[hsl(var(--text-primary))] sm:text-3xl">
            Questions about Anicca Data Lab
          </h2>
          <div className="mt-6 space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q}>
                <h3 className="font-display text-lg text-[hsl(var(--text-primary))]">{item.q}</h3>
                <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="border-t border-[hsl(var(--border))] pt-6 text-sm text-[hsl(var(--text-secondary))]">
            <Link href="/" className="underline hover:text-[hsl(var(--text-primary))]">
              Anicca
            </Link>
            {' · '}
            <Link href="/about" className="underline hover:text-[hsl(var(--text-primary))]">
              About Anicca
            </Link>
            {' · '}
            <Link href="/transparency" className="underline hover:text-[hsl(var(--text-primary))]">
              What is verified
            </Link>
            {' · '}
            <Link href="/dais" className="underline hover:text-[hsl(var(--text-primary))]">
              All products
            </Link>
            {' · '}
            <a
              href="mailto:lifemanager.jp@agentmail.to"
              className="underline hover:text-[hsl(var(--text-primary))]"
            >
              lifemanager.jp@agentmail.to
            </a>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
