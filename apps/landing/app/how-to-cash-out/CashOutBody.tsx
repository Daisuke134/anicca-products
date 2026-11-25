'use client';

import { Section } from '@/components/site/taste';
import { useLaunchLocale } from '@/lib/launchLocale';

// /how-to-cash-out body (spec31 §E). Renders the locale-matched pre-built HTML
// (server reads content/how-to-cash-out.{en,ja}.md). Locale from LaunchLocale toggle.

type Faq = { question: string; answer: string };

export default function CashOutBody({ htmlEn, htmlJa, faqs }: { htmlEn: string; htmlJa: string; faqs?: Faq[] }) {
  const { locale } = useLaunchLocale();
  const html = locale === 'ja' ? htmlJa : htmlEn;

  return (
    <Section className="pt-24">
      <article
        className="mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {locale !== 'ja' && faqs && faqs.length > 0 && (
        <div className="mx-auto max-w-3xl mt-16">
          <h2 className="font-display text-[24px] sm:text-[30px] leading-tight mb-6 text-[hsl(var(--text-primary))]">
            Questions about how to cash out
          </h2>
          {faqs.map((f) => (
            <div key={f.question} className="mb-6">
              <h3 className="text-[16px] font-semibold text-[hsl(var(--text-primary))] mb-2">{f.question}</h3>
              <p className="text-[15px] leading-relaxed text-[hsl(var(--text-secondary))]">{f.answer}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
