'use client';

import { useEffect, useState } from 'react';
import JsonLd from '@/components/JsonLd';
import { ManifestoHero, Section, Reveal } from '@/components/site/taste';
import { buildCheckoutRequest } from '@/lib/checkout-attribution';

const monkBookLd = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: 'The Anicca Reset - 49 Lessons in Impermanence',
  url: 'https://aniccaai.com/monk',
  bookFormat: 'https://schema.org/EBook',
  inLanguage: 'en',
  author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
  description:
    '49 short chapters. Each chapter pairs one Pali term with one modern reframe and one practice. Theravada wisdom meets the neuroscience of emotion: the 90-second rule, memory reconsolidation, the witness practice. PDF, instant delivery, lifetime access.',
  offers: {
    '@type': 'Offer',
    price: '10.99',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://aniccaai.com/monk',
  },
};

const MONK_FAQS = [
  {
    question: 'What is The Anicca Reset?',
    answer:
      'The Anicca Reset is an ebook of 49 short chapters on impermanence. Each chapter pairs one Pali term with one modern reframe and one practice you can do the same day. It brings Theravada wisdom together with the neuroscience of emotion, including the 90-second rule, memory reconsolidation, and the witness practice.',
  },
  {
    question: 'How do I get the book, and what does it cost?',
    answer:
      'The book is a PDF with instant delivery and lifetime access. It is $10.99 at the limited-time release pricing shown on this page, reduced from $16.99. After purchase, the download link is shown on this page and also emailed to you.',
  },
  {
    question: 'Is there anything free I can try first?',
    answer:
      'Yes. You can sign up on this page for a free 3-day letter on impermanence: a short morning email for three days, then nothing, with no spam. There is also the Daily Anicca Letter, one short letter every morning, free for the first 14 days and then $9.99 per month, cancellable at any time.',
  },
  {
    question: 'Is The Anicca Reset a treatment for anxiety or other conditions?',
    answer:
      'No. As this page states, the book is for educational and inspirational purposes only. It is calm guidance about impermanence — the idea summed up in the book as: it is not about not feeling, it is about feeling and watching it leave. It is not medical advice or a treatment.',
  },
];

const monkFaqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: MONK_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

function ebookDownloadHref(sessionId: string) {
  return `/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=pdf`;
}

export default function MonkPage() {
  const [email, setEmail] = useState('');
  const [optInState, setOptInState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [downloadSessionId, setDownloadSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') !== '1') return;
    const sessionId = params.get('session_id');
    if (sessionId && /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/.test(sessionId)) {
      setDownloadSessionId(sessionId);
    }
  }, []);

  async function handleOptIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setOptInState('sending');
    const ctrl = new AbortController();
    try {
      const r = await fetch('/.netlify/functions/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: 'en' }),
        signal: ctrl.signal,
      });
      setOptInState(r.ok ? 'sent' : 'error');
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (typeof window !== 'undefined') console.warn('[/monk:optIn] fetch failed:', err.message);
      }
      setOptInState('error');
    }
  }

  async function handleCheckout(product: 'ebook' | 'letter', mode: 'payment' | 'subscription') {
    const ctrl = new AbortController();
    try {
      const r = await fetch('/.netlify/functions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCheckoutRequest({
          search: window.location.search, lang: 'en', product, mode,
        })),
        signal: ctrl.signal,
      });
      const { url } = await r.json();
      if (url) window.location.href = url;
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (typeof window !== 'undefined') console.warn('[/monk:checkout] checkout failed:', err.message);
      }
    }
  }

  const BuyButton = ({
    label,
    product = 'ebook',
    mode = 'payment',
  }: {
    label: string;
    product?: 'ebook' | 'letter';
    mode?: 'payment' | 'subscription';
  }) => (
    <button
      onClick={() => handleCheckout(product, mode)}
      className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))] rounded-pill px-6 py-3 bg-[hsl(var(--gold))] text-[#18181b] hover:brightness-95"
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] font-serif">
      <JsonLd data={monkBookLd} />
      <JsonLd data={monkFaqLd} />

      {downloadSessionId && (
        <Section>
          <Reveal>
            <div className="mx-auto max-w-xl text-center rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-secondary))] mb-3">Purchase confirmed</p>
              <h2 className="text-xl font-light mb-3 text-[hsl(var(--text-primary))]">Your copy is ready</h2>
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">
                Download the PDF below. The same link was also emailed to you.
              </p>
              <a
                href={ebookDownloadHref(downloadSessionId)}
                className="inline-flex items-center justify-center rounded-pill px-6 py-3 bg-[hsl(var(--gold))] text-[#18181b] font-medium hover:brightness-95"
              >
                Download the PDF →
              </a>
            </div>
          </Reveal>
        </Section>
      )}

      <ManifestoHero
        headline={
          <>
            Everything passes.<br />
            Your anger. Your anxiety.<br />
            Your heartbreak too.
          </>
        }
        subtext="49 short chapters. Theravada wisdom meets the neuroscience of emotion."
        cta={
          <div className="flex flex-col items-start gap-3">
            <div className="w-44 h-60 bg-[hsl(var(--surface))] rounded-card shadow-md flex items-center justify-center text-[hsl(var(--text-primary))]">
              <div className="px-4 text-center">
                <p className="text-[10px] tracking-widest text-[hsl(var(--text-secondary))]">THE</p>
                <p className="text-2xl tracking-wide mt-1">ANICCA</p>
                <p className="text-2xl tracking-wide">RESET</p>
                <p className="text-[10px] mt-3 italic">49 lessons in impermanence</p>
              </div>
            </div>
            <p className="text-sm text-[hsl(var(--text-secondary))]">by Anicca</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-secondary))]">Limited-Time Offer</p>
            <div className="flex items-baseline gap-2">
              <span className="line-through text-sm text-[hsl(var(--text-secondary))]">$16.99</span>
              <span className="text-2xl font-medium text-[hsl(var(--text-primary))]">$10.99</span>
            </div>
            <p className="text-xs text-[hsl(var(--text-secondary))] -mt-1">Limited-time release pricing</p>
            <BuyButton label="Get Instant Access →" />
            <p className="text-xs text-[hsl(var(--text-secondary))]">PDF · instant delivery · lifetime access</p>
          </div>
        }
      />

      <Section>
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-secondary))] text-center mb-8">What&apos;s inside</p>
        </Reveal>
        <ul className="mx-auto max-w-xl space-y-4 text-base leading-relaxed text-[hsl(var(--text-primary))]">
          {[
            '· 49 short chapters - read one at breakfast.',
            '· Each chapter: one Pali term, one modern reframe, one practice you can do tonight.',
            '· Ancient Theravada wisdom meets neuroscience of emotion.',
            '· The 90-second rule. Memory reconsolidation. The witness practice.',
            '· No fluff. No filler. Calm guidance you\'ll return to forever.',
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <li>{item}</li>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <Reveal>
          <p className="mx-auto max-w-xl text-center italic text-xl leading-relaxed text-[hsl(var(--text-primary))]">
            &ldquo;It&apos;s not about not feeling.<br />It&apos;s about feeling and watching it leave.&rdquo;
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-secondary))] mb-6">Not ready?</p>
            <h2 className="text-xl font-light mb-4 text-[hsl(var(--text-primary))]">Get the free 3-day letter on impermanence.</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">A short morning email for three days. Then nothing. (No spam.)</p>
            {optInState === 'sent' ? (
              <p className="text-sm text-[hsl(var(--text-primary))]">Check your inbox in a minute. 🌿</p>
            ) : (
              <form onSubmit={handleOptIn} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  required
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-input bg-[hsl(var(--background))] border border-[hsl(var(--text-secondary))]/40 px-4 py-3 text-sm focus:outline-none focus:border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))]"
                />
                <button
                  type="submit"
                  disabled={optInState === 'sending'}
                  className="rounded-pill bg-transparent border border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))] px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[hsl(var(--text-primary))] hover:text-[hsl(var(--background))] transition disabled:opacity-60"
                >
                  {optInState === 'sending' ? 'Sending...' : 'Send me the letters'}
                </button>
              </form>
            )}
            {optInState === 'error' && <p className="text-xs text-red-700 mt-2">Something went wrong. Try again.</p>}
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-secondary))] mb-6">Want a daily practice?</p>
            <h2 className="text-xl font-light mb-4 text-[hsl(var(--text-primary))]">Get the Daily Anicca Letter</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">
              One short letter every morning. First 14 days free, then $9.99/month. A payment method is required to start; cancel any time.
            </p>
            <BuyButton label="Start the 14-day free trial" product="letter" mode="subscription" />
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="flex justify-center">
            <BuyButton label="Get the book - $10.99" />
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="mx-auto max-w-xl">
            <h2 className="text-xl font-light mb-4 text-[hsl(var(--text-primary))]">What is The Anicca Reset?</h2>
            <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))] mb-4">
              The Anicca Reset is a 49-chapter ebook about impermanence: the fact that everything passes — your anger,
              your anxiety, and your heartbreak too. Each short chapter gives you one Pali term, one modern reframe,
              and one practice you can do tonight, so the book is built to be read one chapter at a time, for example
              at breakfast, and returned to whenever a feeling feels permanent.
            </p>
            <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
              The book pairs ancient Theravada wisdom with the neuroscience of emotion — the 90-second rule, memory
              reconsolidation, and the witness practice. Its position is simple, in the book&apos;s own words:
              it&apos;s not about not feeling; it&apos;s about feeling and watching it leave. The book is for
              educational and inspirational purposes only and is not a treatment.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="mx-auto max-w-xl">
            <h2 className="text-xl font-light mb-6 text-[hsl(var(--text-primary))]">Questions about The Anicca Reset</h2>
            <div className="space-y-6">
              {MONK_FAQS.map((f) => (
                <div key={f.question}>
                  <h3 className="text-base font-medium mb-2 text-[hsl(var(--text-primary))]">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))]">{f.answer}</p>
                </div>
              ))}
            </div>
            <p className="text-sm mt-8 text-[hsl(var(--text-secondary))]">
              The book is published by <a href="/about" className="underline">About Anicca</a>.
            </p>
          </div>
        </Reveal>
      </Section>

      <footer className="text-center text-xs text-[hsl(var(--text-secondary))] py-8">
        © Anicca · For educational and inspirational purposes only.
      </footer>
    </main>
  );
}
