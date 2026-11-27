'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Reveal } from '@/components/site/taste';
import { useLaunchLocale } from '@/lib/launchLocale';
import {
  COPY,
  INTEREST_KEYS,
  LANG_OPTIONS,
  SAMPLE_ISSUE,
  type InterestKey,
  type Lang,
} from './content';

// /lm/newsletter body. Static export, so the language is resolved in the browser:
//   ?lang=ja|en|es → localStorage → navigator.language → 'en'
// The picked language is also onboarding answer ①, so the switcher and the form
// stay one decision instead of two.
const STORAGE_KEY = 'anicca.lm-newsletter.lang';

function normalizeLang(value: string | null | undefined): Lang | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.startsWith('ja')) return 'ja';
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en';
  return null;
}

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const fromParam = normalizeLang(new URLSearchParams(window.location.search).get('lang'));
    if (fromParam) return fromParam;
    const fromStore = normalizeLang(window.localStorage.getItem(STORAGE_KEY));
    if (fromStore) return fromStore;
    const fromNav = normalizeLang(window.navigator.language);
    if (fromNav) return fromNav;
  } catch {
    /* storage / location unavailable */
  }
  return 'en';
}

const CARD = 'rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--card))]';
const LABEL = 'font-mono text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--text-secondary))]';

export default function NewsletterBody() {
  const { setLocale } = useLaunchLocale();
  const [lang, setLang] = useState<Lang>('en');
  const [interests, setInterests] = useState<InterestKey[]>([]);
  const [device, setDevice] = useState<'phone' | 'both'>('phone');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    const next = detectLang();
    setLang(next);
    // Keep the shared launch shell (nav, footer) in step: JA follows JA, everything
    // else uses its English shell until the shell itself ships Spanish.
    setLocale(next === 'ja' ? 'ja' : 'en');
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, [setLocale]);

  const t = COPY[lang];

  function chooseLang(next: Lang) {
    setLang(next);
    setLocale(next === 'ja' ? 'ja' : 'en');
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function toggleInterest(key: InterestKey) {
    setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const value = email.trim();
    if (!value.includes('@')) {
      setStatus('error');
      setErrorMessage(t.errorBody);
      return;
    }
    setStatus('sending');
    setErrorMessage('');
    try {
      const response = await fetch('/.netlify/functions/lm-newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          lang,
          interests,
          device,
          source: 'aniccaai.com/lm/newsletter',
          company: honeypot,
        }),
      });
      if (response.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setErrorMessage(t.errorBody);
      }
    } catch {
      setStatus('error');
      setErrorMessage(t.errorBody);
    }
  }

  const interestLabels = useMemo(
    () => INTEREST_KEYS.map((key) => ({ key, label: t.interests[key] })),
    [t],
  );

  return (
    <main className="w-full px-4 pb-24 pt-10 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm">
          <Link
            href="/lm"
            className="text-[hsl(var(--text-secondary))] underline underline-offset-4 hover:text-[hsl(var(--text-primary))]"
          >
            ← {t.navBack}
          </Link>
        </p>

        {/* Hero */}
        <Reveal>
          <section className="relative mt-6 border-y border-[hsl(var(--border))] py-10 md:py-16">
            <div className="pointer-events-none absolute -right-24 top-4 h-72 w-72 rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                  {t.eyebrow}
                </p>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[hsl(var(--text-primary))] md:text-6xl">
                  {t.h1}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-[hsl(var(--text-secondary))] md:text-lg">
                  {t.sub}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#subscribe"
                    className="inline-flex items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-7 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0"
                  >
                    {t.cta}
                  </a>
                  <a
                    href="#issue"
                    className="inline-flex items-center justify-center rounded-pill border border-[hsl(var(--border))] px-7 py-3 text-sm font-semibold text-[hsl(var(--text-primary))] transition-all hover:border-[hsl(var(--gold))]"
                  >
                    {t.ctaSecondary}
                  </a>
                </div>
              </div>
              <aside className="border-l border-[hsl(var(--border))] pl-6 md:pl-8">
                <p className={LABEL}>Life Manager</p>
                <ul className="mt-5 space-y-3">
                  {t.heroPoints.map((point) => (
                    <li
                      key={point}
                      className="border-t border-[hsl(var(--border))] pt-3 font-display text-lg text-[hsl(var(--text-primary))]"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </section>
        </Reveal>

        {/* How it works */}
        <Reveal>
          <section className="py-14 md:py-20">
            <h2 className="max-w-3xl font-display text-3xl tracking-[-0.03em] text-[hsl(var(--text-primary))] md:text-4xl">
              {t.howTitle}
            </h2>
            <div className="mt-9 grid border-y border-[hsl(var(--border))] md:grid-cols-3">
              {t.how.map((step) => (
                <article
                  key={step.index}
                  className="border-b border-[hsl(var(--border))] py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                >
                  <p className="font-mono text-xs text-[hsl(var(--gold))]">{step.index}</p>
                  <h3 className="mt-6 font-display text-xl text-[hsl(var(--text-primary))]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--text-secondary))]">{step.body}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Sample issue */}
        <Reveal>
          <section id="issue" className="scroll-mt-20 pb-14 md:pb-20">
            <p className={LABEL}>{t.issueEyebrow}</p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl tracking-[-0.03em] text-[hsl(var(--text-primary))] md:text-4xl">
              {t.issueTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[hsl(var(--text-secondary))]">{t.issueSub}</p>

            <ol className="mt-8 space-y-4">
              {SAMPLE_ISSUE.map((gig, index) => (
                <li key={gig.id} className={`${CARD} p-6 md:p-7`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-[hsl(var(--gold))]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
                          {gig.platformAlt ? gig.platformAlt[lang] : gig.platform}
                        </p>
                        <h3 className="mt-1 font-display text-xl text-[hsl(var(--text-primary))]">
                          {gig.title[lang]}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold text-[hsl(var(--text-primary))]">{gig.pay}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{gig.payNote[lang]}</p>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-4 border-t border-[hsl(var(--border))] pt-5 text-sm md:grid-cols-2">
                    <div>
                      <dt className={LABEL}>{t.issueLabels.time}</dt>
                      <dd className="mt-1 text-[hsl(var(--text-primary))]">{gig.time[lang]}</dd>
                    </div>
                    <div>
                      <dt className={LABEL}>{t.issueLabels.phone}</dt>
                      <dd className="mt-1 text-[hsl(var(--text-primary))]">{gig.phone[lang]}</dd>
                    </div>
                    <div>
                      <dt className={LABEL}>{t.issueLabels.deadline}</dt>
                      <dd className="mt-1 text-[hsl(var(--text-primary))]">{gig.deadline[lang]}</dd>
                    </div>
                    <div>
                      <dt className={LABEL}>{t.issueLabels.payout}</dt>
                      <dd className="mt-1 text-[hsl(var(--text-primary))]">{gig.payout[lang]}</dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    <p className={LABEL}>{t.issueLabels.steps}</p>
                    <ol className="mt-2 flex flex-wrap gap-2">
                      {gig.steps[lang].map((step, i) => (
                        <li
                          key={step}
                          className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs text-[hsl(var(--text-primary))]"
                        >
                          <span className="mr-1.5 font-mono text-[hsl(var(--gold))]">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <p className="mt-5 border-t border-[hsl(var(--border))] pt-3 font-mono text-[11px] leading-5 text-[hsl(var(--text-secondary))]">
                    {t.issueLabels.source}:{' '}
                    <a
                      href={gig.source}
                      target="_blank"
                      rel="noreferrer nofollow"
                      className="underline underline-offset-4 hover:text-[hsl(var(--text-primary))]"
                    >
                      {new URL(gig.source).hostname}
                    </a>{' '}
                    · {t.issueLabels.checked} {gig.checked}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-xs leading-6 text-[hsl(var(--text-secondary))]">{t.issueNote}</p>
          </section>
        </Reveal>

        {/* Onboarding */}
        <Reveal>
          <section
            id="subscribe"
            className="scroll-mt-20 rounded-card border border-[hsl(var(--gold)/0.45)] bg-[hsl(var(--gold)/0.06)] p-6 md:p-10"
          >
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className={LABEL}>{t.formEyebrow}</p>
                <h2 className="mt-4 font-display text-3xl tracking-[-0.02em] text-[hsl(var(--text-primary))]">
                  {t.formTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[hsl(var(--text-secondary))]">{t.formBody}</p>
                <p className="mt-6 text-xs leading-6 text-[hsl(var(--text-secondary))]">{t.consent}</p>
              </div>

              {status === 'done' ? (
                <div className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6">
                  <p className="font-display text-2xl text-[hsl(var(--text-primary))]">{t.successTitle}</p>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--text-secondary))]">{t.successBody}</p>
                  <p className="mt-4 font-mono text-xs text-[hsl(var(--text-secondary))]">{email}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ① language */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-[hsl(var(--text-primary))]">{t.q1}</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {LANG_OPTIONS.map((option) => {
                        const active = lang === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => chooseLang(option.value)}
                            className={`rounded-pill border px-4 py-2 text-sm transition-colors ${
                              active
                                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))] font-semibold text-black'
                                : 'border-[hsl(var(--border))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* ② interests */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-[hsl(var(--text-primary))]">{t.q2}</legend>
                    <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.q2Hint}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interestLabels.map(({ key, label }) => {
                        const active = interests.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleInterest(key)}
                            className={`rounded-pill border px-4 py-2 text-sm transition-colors ${
                              active
                                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.18)] font-semibold text-[hsl(var(--text-primary))]'
                                : 'border-[hsl(var(--border))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* ③ device */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-[hsl(var(--text-primary))]">{t.q3}</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          { value: 'phone' as const, label: t.devicePhone },
                          { value: 'both' as const, label: t.deviceBoth },
                        ]
                      ).map((option) => {
                        const active = device === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setDevice(option.value)}
                            className={`rounded-pill border px-4 py-2 text-sm transition-colors ${
                              active
                                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))] font-semibold text-black'
                                : 'border-[hsl(var(--border))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* ④ email */}
                  <div>
                    <label htmlFor="newsletter-email" className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                      {t.q4}
                    </label>
                    <input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="mt-2 w-full rounded-input border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--text-primary))] outline-none focus:border-[hsl(var(--gold))]"
                    />
                    {/* Honeypot: real people never fill this; bots usually do. */}
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                      name="company"
                      className="hidden"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="inline-flex w-full items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-7 py-3 text-sm font-semibold text-black transition-all hover:brightness-95 disabled:opacity-60 sm:w-auto"
                    >
                      {status === 'sending' ? t.submitting : t.submit}
                    </button>
                    {status === 'error' ? (
                      <p role="alert" className="mt-3 text-sm text-[hsl(var(--destructive))]">
                        {errorMessage || t.errorBody}
                      </p>
                    ) : null}
                  </div>
                </form>
              )}
            </div>
          </section>
        </Reveal>

        {/* Free / Pro */}
        <Reveal>
          <section className="py-14 md:py-20">
            <h2 className="font-display text-3xl tracking-[-0.03em] text-[hsl(var(--text-primary))] md:text-4xl">
              {t.planTitle}
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {t.plans.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`${CARD} p-7 ${index === 1 ? 'border-[hsl(var(--gold)/0.5)]' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl text-[hsl(var(--text-primary))]">{plan.name}</h3>
                    {plan.tag ? (
                      <span className="rounded-pill border border-[hsl(var(--gold)/0.6)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--gold))]">
                        {plan.tag}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-mono text-sm text-[hsl(var(--text-secondary))]">{plan.price}</p>
                  <ul className="mt-5 space-y-2 border-t border-[hsl(var(--border))] pt-5">
                    {plan.lines.map((line) => (
                      <li key={line} className="text-sm leading-6 text-[hsl(var(--text-primary))]">
                        <span className="mr-2 font-mono text-xs text-[hsl(var(--gold))]">—</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[hsl(var(--text-secondary))]">{t.planNote}</p>
          </section>
        </Reveal>

        {/* What we won't do */}
        <Reveal>
          <section className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 md:p-10">
            <h2 className="font-display text-2xl text-[hsl(var(--text-primary))]">{t.limitsTitle}</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {t.limits.map((limit) => (
                <li key={limit} className="text-sm leading-7 text-[hsl(var(--text-secondary))]">
                  <span className="mr-2 font-mono text-xs text-[hsl(var(--gold))]">×</span>
                  {limit}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
          <section className="py-14 md:py-20">
            <h2 className="font-display text-3xl tracking-[-0.03em] text-[hsl(var(--text-primary))]">
              {t.faqTitle}
            </h2>
            <dl className="mt-8 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
              {t.faq.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="font-display text-lg text-[hsl(var(--text-primary))]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-7 text-[hsl(var(--text-secondary))]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
