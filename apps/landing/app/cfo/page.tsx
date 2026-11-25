import type { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import Image from 'next/image';
import { SplitHero } from '@/components/site/taste/SplitHero';
import { Section } from '@/components/site/taste/Section';
import { Reveal } from '@/components/site/taste/Reveal';
import { CTA } from '@/components/site/taste/CTA';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: "Anicca CFO - Live P&L",
  description: "Anicca の毎時更新される損益計算書。Stripe + RevenueCat + 銀行 + Base メインネット ウォレットを集約。Anicca が偽装できない設計です。",
  alternates: {
    canonical: 'https://aniccaai.com/cfo',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: "Anicca CFO - Live P&L",
    description: "Anicca の毎時更新される損益計算書。Stripe + RevenueCat + 銀行 + Base メインネット ウォレットを集約。Anicca が偽装できない設計です。",
    url: 'https://aniccaai.com/cfo',
    images: [{ url: 'https://aniccaai.com/anicca-app-icon.png', width: 1024, height: 1024 }],
  },
};

const FAQS = [
  {
    q: 'What is the Anicca CFO page?',
    a: 'It is Anicca\'s live P&L: every dollar Anicca makes and spends, sourced directly from Stripe + RevenueCat + bank + Base wallet. It is updated hourly, and the operator cannot forge the numbers.',
  },
  {
    q: 'What numbers does the CFO page show?',
    a: 'Three headline numbers: MRR (recurring), Revenue 28d, and Actually landed (bank) — how much recurring revenue Anicca has, how much it made in the last 28 days, and how much actually landed in the bank.',
  },
  {
    q: 'Where does the CFO data come from?',
    a: 'The page is sourced from aniccaai.com/dashboard.json, which is updated hourly and aggregates the Stripe + RevenueCat + bank + Base mainnet wallet ledgers separately. The raw JSON is linked from the page itself.',
  },
  {
    q: 'Why is Anicca\'s P&L public?',
    a: 'Anicca is an autonomous economic entity that pays its own operating costs from its own wallet. To credibly claim autonomy, its numbers have to be structurally unforgeable — aggregated separately from Stripe + RevenueCat + bank + Base wallet ledgers, so even the operator, Dais, cannot forge them. The rule is set out in the Constitution, in the Earn-or-Die Loop section.',
  },
];

const cfoFaqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export const revalidate = 600;

// §11.F: /dashboard.json fetch logic - NEVER change this data source
async function getCfo() {
  try {
    const p = path.join(process.cwd(), 'public', 'dashboard.json');
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// §13 dashboard data table: ledger Row component preserved verbatim
function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
        {label}
      </p>
      <p className="mt-1 font-mono tabular-nums text-4xl font-semibold text-[hsl(var(--text-primary))]">
        {value}
      </p>
    </div>
  );
}

export default async function CfoPage() {
  const cfo = await getCfo();
  if (!cfo) return <div className="p-6 text-[hsl(var(--text-secondary))]">dashboard.json not found</div>;

  // §11.F: data extraction from /dashboard.json source preserved
  const mrr = cfo.mrr?.total_usd ?? 0;
  const revenue28 = cfo.mrr?.revenue_28d_usd ?? 0;
  const landed = cfo.mrr?.actually_landed_usd ?? 0;
  const updated = cfo.updated_at ?? null;

  return (
    <main>
      <SplitHero
        eyebrow="Open books"
        headline={<>Live P&amp;L.<br />No theatre.</>}
        subtext="Every dollar Anicca makes and spends, sourced directly from Stripe + RevenueCat + bank + Base wallet. Updated hourly. Operator cannot forge."
        primary={<CTA href="/dashboard.json">Raw JSON</CTA>}
        secondary={<CTA href="https://github.com/Daisuke134/anicca/blob/main/CONSTITUTION.md" variant="link">Constitution §Earn-or-Die Loop</CTA>}
        asset={
          <Image
            src="/anicca-app-icon.png"
            alt="Anicca app icon"
            width={1024}
            height={1024}
            className="w-full h-full object-cover"
            unoptimized
          />
        }
      />

      {/* §13 ledger highlight: featured numbers as tiles (data preserved, taste-styled) */}
      <Section>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--text-secondary))] mb-8">
            {/* TODO: translate to EN if needed */}
            {updated
              ? `Updated ${new Date(updated).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
              : 'Live data'}
          </p>
        </Reveal>

        {/* §13: data grid preserved verbatim, taste tokens applied */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Reveal delay={0.04}>
            <div className="rounded-card border border-[hsl(var(--border))] px-6 py-6">
              <LedgerRow
                label="MRR (recurring)"
                value={`$${mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-card border border-[hsl(var(--border))] px-6 py-6">
              <LedgerRow
                label="Revenue 28d"
                value={`$${revenue28.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="rounded-card border border-[hsl(var(--border))] px-6 py-6">
              <LedgerRow
                label="Actually landed (bank)"
                value={`$${landed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Why public section */}
      <Section>
        <Reveal>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--text-secondary))] mb-6">
            Why public?
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="max-w-[65ch] text-base leading-relaxed text-[hsl(var(--text-secondary))]">
            {/* TODO: JP string - consider EN translation for EN-audience pages */}
            Anicca は自分の運営費を自分のウォレットで払う autonomous economic entity です。
            自律していると名乗るためには、数字を偽装できないことが構造的に必要です。
            これは 1 時間ごとに{' '}
            <a
              href="/dashboard.json"
              className="underline underline-offset-4 text-[hsl(var(--text-primary))] hover:opacity-80 transition-opacity"
            >
              dashboard.json
            </a>
            {' '}で更新され、運営者の Dais ですら数字を偽装できません
            (Stripe + RevenueCat + 銀行 + Base ウォレット ledger を別々に集約しているため)。
          </p>
        </Reveal>
      </Section>

      {/* Footer note: §11.F source link + github CONSTITUTION preserved verbatim */}
      <Section>
        <Reveal>
          <p className="text-xs text-[hsl(var(--text-secondary))]">
            Sourced from{' '}
            <a
              href="/dashboard.json"
              className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              aniccaai.com/dashboard.json
            </a>
            . Constitution:{' '}
            <a
              href="https://github.com/Daisuke134/anicca/blob/main/CONSTITUTION.md"
              className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              §Earn-or-Die Loop
            </a>
            .
          </p>
        </Reveal>
      </Section>

      <Section>
        <JsonLd data={cfoFaqLd} />
        <Reveal>
          <h2 className="text-2xl font-semibold mb-6">Questions about Anicca CFO</h2>
        </Reveal>
        <div className="space-y-6 max-w-3xl">
          {FAQS.map((f) => (
            <Reveal key={f.q}>
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-2 text-[hsl(var(--text-secondary))]">{f.a}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-sm text-[hsl(var(--text-secondary))]">
          <a href="/about" className="underline underline-offset-4 hover:opacity-80 transition-opacity">About Anicca &rarr;</a>
        </p>
      </Section>
    </main>
  );
}
