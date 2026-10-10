import JsonLd from '@/components/JsonLd';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';

// Facts only from /workspace/marketing/pdf-insight/listing-copy.md and
// chatpdf-alternative-page.md (read from clear-pdf-converter.com on 2026-10-09).
// Price rule: only "Pro $15/mo billed yearly ($180/yr)". Never quote a
// monthly-billed price and never say "unlimited".

const TITLE = 'PDF Insight: ChatPDF Alternative for Summaries and Cited Answers';
const DESCRIPTION =
  'Upload a PDF and get clean text, short/medium/long AI summaries, key points, and cited answers. Free to try with 1 PDF. Pro from $15/mo billed yearly.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://aniccaai.com/pdf-insight' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://aniccaai.com/pdf-insight',
    type: 'website',
  },
};

const APP_URL =
  'https://clear-pdf-converter.com/?utm_source=aniccaai&utm_medium=landing&utm_campaign=pdf_insight';

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PDF Insight',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  url: 'https://aniccaai.com/pdf-insight',
  sameAs: ['https://clear-pdf-converter.com'],
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro (billed yearly)', price: '180', priceCurrency: 'USD' },
  ],
};

const FEATURES = [
  'Parsing built for messy layouts: Firecrawl’s Fire-PDF handles complex layouts, tables and multi-column pages and returns clean Markdown',
  'Pick your summary length: short, medium or long, always with bullet-point key takeaways',
  'Ask questions about your PDF and get answers grounded in and cited from the source (Pro)',
  'Large documents: books and long reports are split into chunks and processed',
  'Private by default: files are isolated per user; only you can read your PDFs',
  'Export: copy the summary, download Markdown, or share key points',
];

const FAQ = [
  {
    q: 'Is there a free plan?',
    a: 'Yes. The free plan includes 1 PDF parse in total, with an AI summary, key points and Markdown export.',
  },
  {
    q: 'Can I chat with my PDF?',
    a: 'Yes, on Pro. You can ask questions about the document and get answers cited from the source text.',
  },
  {
    q: 'How much is Pro?',
    a: 'Pro is $15/month billed yearly ($180/year) and includes 50 PDFs per month, all summary lengths, Q&A chat, priority parsing and email support.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes, anytime from the billing portal.',
  },
  {
    q: 'What kinds of PDFs work?',
    a: 'Reports, contracts, books and research papers, including files with tables and multi-column layouts.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const h2 = 'mb-8 text-2xl font-semibold text-[hsl(var(--text-primary))]';

export default function PdfInsightLanding() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <JsonLd data={softwareLd} />
      <JsonLd data={faqLd} />
      <SplitHero
        eyebrow="Web app · PDF summarizer · by Daisuke Narita"
        headline={
          <>
            PDF Insight:
            <br />
            PDFs into answers
          </>
        }
        subtext="Upload a PDF. Get clean text, an AI summary with key points, and answers cited from the source."
        primary={<CTA href={APP_URL}>Try 1 PDF free</CTA>}
        secondary={
          <a
            href="#pricing"
            className="text-sm text-[hsl(var(--text-secondary))] underline-offset-4 hover:underline"
          >
            See pricing
          </a>
        }
        asset={
          <div className="mx-auto w-full max-w-[420px] rounded-card border border-[hsl(var(--border))] p-8">
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
              From one PDF you get
            </p>
            <ul className="space-y-3 text-lg text-[hsl(var(--text-primary))]">
              <li className="ml-6 list-disc">Clean, searchable Markdown text</li>
              <li className="ml-6 list-disc">Short, medium or long AI summary</li>
              <li className="ml-6 list-disc">Bullet-point key takeaways</li>
              <li className="ml-6 list-disc">Cited answers to your questions (Pro)</li>
            </ul>
          </div>
        }
      />

      <Section>
        <Reveal>
          <h2 className={h2}>What PDF Insight does</h2>
        </Reveal>
        <ul className="space-y-3 text-lg text-[hsl(var(--text-primary))]">
          {FEATURES.map((item, i) => (
            <Reveal key={item} delay={i * 0.06}>
              <li className="ml-6 list-disc">{item}</li>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section id="chatpdf-alternative">
        <Reveal>
          <h2 className={h2}>Looking for a ChatPDF alternative?</h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="max-w-3xl text-lg leading-relaxed text-[hsl(var(--text-primary))]">
            Like ChatPDF, PDF Insight lets you ask questions about a PDF and get cited answers. It
            also gives you the full clean Markdown text of the document and a choice of short,
            medium or long summaries with key points, and it is built to keep tables and
            multi-column layouts intact.
          </p>
        </Reveal>
      </Section>

      <Section id="pricing">
        <Reveal>
          <h2 className={h2}>Pricing</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-card border border-[hsl(var(--border))] p-8">
              <h3 className="text-xl font-semibold text-[hsl(var(--text-primary))]">Free</h3>
              <p className="mt-2 text-3xl font-semibold text-[hsl(var(--text-primary))]">$0</p>
              <ul className="mt-6 space-y-2 text-[hsl(var(--text-primary))]">
                <li className="ml-6 list-disc">1 PDF parse in total</li>
                <li className="ml-6 list-disc">AI summary and key points</li>
                <li className="ml-6 list-disc">Markdown export</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="h-full rounded-card border border-[hsl(var(--border))] p-8">
              <h3 className="text-xl font-semibold text-[hsl(var(--text-primary))]">Pro</h3>
              <p className="mt-2 text-3xl font-semibold text-[hsl(var(--text-primary))]">
                $15<span className="text-base font-normal">/mo, billed yearly</span>
              </p>
              <p className="text-sm text-[hsl(var(--text-secondary))]">$180 per year</p>
              <ul className="mt-6 space-y-2 text-[hsl(var(--text-primary))]">
                <li className="ml-6 list-disc">50 PDFs per month</li>
                <li className="ml-6 list-disc">All summary lengths</li>
                <li className="ml-6 list-disc">Ask questions with cited answers</li>
                <li className="ml-6 list-disc">Priority parsing and email support</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section id="faq">
        <Reveal>
          <h2 className={h2}>FAQ</h2>
        </Reveal>
        <dl className="max-w-3xl space-y-6">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <dt className="text-lg font-semibold text-[hsl(var(--text-primary))]">{f.q}</dt>
              <dd className="mt-1 text-lg text-[hsl(var(--text-secondary))]">{f.a}</dd>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section>
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg text-[hsl(var(--text-secondary))]">
              Works in your browser. Try it free with one PDF.
            </p>
            <CTA href={APP_URL}>Open PDF Insight</CTA>
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--text-secondary))]">
        <div className="mx-auto max-w-[1400px] space-y-2">
          <p>
            <a href={APP_URL} className="underline hover:text-[hsl(var(--text-primary))]">
              clear-pdf-converter.com
            </a>
          </p>
          <p>© 2026 Daisuke Narita. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
