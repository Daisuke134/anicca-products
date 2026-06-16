/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import LaunchNav from '@/components/site/LaunchNav';
import Footer from '@/components/site/Footer';
import { Section, Reveal, CTA } from '@/components/site/taste';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

// /install content — locale-parameterized. Extracted verbatim from the original
// app/install/page.tsx; only the COPY now comes from launchDict[lang]. The Cloud
// CTA href (real Stripe link) is UNCHANGED and identical across locales.

const STRIPE_CLOUD_CHECKOUT = 'https://buy.stripe.com/cNi7sL0dEdVI0iI7ki2880U';

const installLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: 'Install Anicca',
  url: 'https://aniccaai.com/install',
  description:
    'Install Anicca — AI agent that earns, manages your life, and self-replicates. Choose Cloud (Google login, 1 min) or OSS self-host.',
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

function ColumnCard({
  emoji,
  label,
  sublabel,
  recommended,
  recommendedLabel,
  children,
  cta,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  recommended?: boolean;
  recommendedLabel?: string;
  children: React.ReactNode;
  cta: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-card border p-6 ${
        recommended
          ? 'border-[hsl(var(--gold))]/50 bg-[hsl(var(--surface-elevated))]'
          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))]'
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-5 rounded-full bg-[hsl(var(--gold))] px-3 py-0.5 text-[11px] font-semibold text-[#18181b]">
          {recommendedLabel}
        </span>
      )}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-semibold text-lg text-[hsl(var(--text-primary))]">{label}</p>
          <p className="text-xs text-[hsl(var(--text-secondary))]">{sublabel}</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 text-sm text-[hsl(var(--text-secondary))]">
        {children}
      </div>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

function CheckItem({ html }: { html: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function DotItem({ html }: { html: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[hsl(var(--text-secondary))] shrink-0 mt-0.5">·</span>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function InstallContent({ lang }: { lang: LaunchLocale }) {
  const t = launchDict[lang].install;
  const prefix = (p: string) => `/${lang}${p}`;

  return (
    <>
      <JsonLd data={installLd} />
      <LaunchNav active="/install" lang={lang} />

      {/* ── Hero ── */}
      <Section>
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[hsl(var(--text-primary))]">
              {t.heroTitle}
            </h1>
            <p className="mt-4 text-base text-[hsl(var(--text-secondary))]">{t.heroSubtitle}</p>
          </div>
        </Reveal>
      </Section>

      {/* ── 2-column: CLOUD + OSS ── */}
      <Section>
        <Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {/* ☁ CLOUD — main product / recommended */}
            <ColumnCard
              emoji="☁"
              label={t.cloud.label}
              sublabel={t.cloud.sublabel}
              recommended
              recommendedLabel={t.recommended}
              cta={
                <CTA href={STRIPE_CLOUD_CHECKOUT} variant="primary">
                  {t.cloud.cta}
                </CTA>
              }
            >
              {t.cloud.checks.map((html, i) => (
                <CheckItem key={i} html={html} />
              ))}
              <div className="pt-2 border-t border-[hsl(var(--border))]">
                <p
                  className="text-xs text-[hsl(var(--text-secondary))]"
                  dangerouslySetInnerHTML={{ __html: t.cloud.note }}
                />
              </div>
            </ColumnCard>

            {/* ⌨ OSS — advanced / self-host */}
            <ColumnCard
              emoji="⌨"
              label={t.oss.label}
              sublabel={t.oss.sublabel}
              cta={
                <Link
                  href="https://github.com/Daisuke134/anicca"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 w-full justify-center rounded-pill border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--text-primary))] transition-colors hover:bg-[hsl(var(--surface-elevated))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
                >
                  {t.oss.cta}
                </Link>
              }
            >
              {t.oss.items.map((html, i) => (
                <DotItem key={i} html={html} />
              ))}
              <div className="pt-2 border-t border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-secondary))]">{t.oss.note}</p>
              </div>
            </ColumnCard>
          </div>
        </Reveal>
      </Section>

      {/* ── What Anicca does (shared by both paths) ── */}
      <Section>
        <Reveal>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-[hsl(var(--text-primary))] mb-4">
            {t.whatTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.what.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4"
              >
                <p className="text-lg">{icon}</p>
                <p className="mt-2 text-sm font-semibold text-[hsl(var(--text-primary))]">{title}</p>
                <p className="mt-1 text-xs text-[hsl(var(--text-secondary))] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ── Links section ── */}
      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={prefix('/me')}
              className="block rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">
                {t.linkInstanceKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">aniccaai.com/me</p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.linkInstanceDesc}</p>
            </Link>
            <Link
              href={prefix('/dashboard')}
              className="block rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">
                {t.linkColonyKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                aniccaai.com/dashboard
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.linkColonyDesc}</p>
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ── Footer note ── */}
      <Section>
        <Reveal>
          <div className="border-t border-[hsl(var(--border))] pt-8 text-xs text-[hsl(var(--text-secondary))]">
            <p>
              {t.footerNote}{' '}
              <Link
                href="https://github.com/Daisuke134/anicca"
                target="_blank"
                rel="noreferrer"
                className="underline transition-colors hover:text-[hsl(var(--text-primary))]"
              >
                github.com/Daisuke134/anicca
              </Link>
            </p>
          </div>
        </Reveal>
      </Section>

      <Footer locale={lang} />
    </>
  );
}
