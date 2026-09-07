'use client';

/* eslint-disable react/no-unescaped-entities */
import { QRCodeSVG } from 'qrcode.react';
import { SplitHero, Section, Reveal } from '@/components/site/taste';
import { useLaunchLocale } from '@/lib/launchLocale';
import { launchStrings } from '@/lib/launchStrings';

// Telegram deep link — scanning or tapping opens @LifeManagerBotbot at /start
// (start=lp = landing attribution). Telegram owns the onboarding handoff.
const TG_DEEPLINK = 'https://t.me/LifeManagerBotbot?start=lp';

// /life-manager body — localized EN/JA marketing page for the SEPARATE cloud product
// (spec28/spec29 P-lm-separate). "Get started" routes to /lm. Renders inside <LaunchFrame>
// (locale context + nav + footer). All copy from launchStrings[locale].

export default function LifeManagerBody() {
  const { locale } = useLaunchLocale();
  const t = launchStrings[locale].lifeManager;

  return (
    <>
      <SplitHero
        headline={t.heroHeadline}
        subtext={t.heroSubtext}
        primary={null}
        secondary={
          <a
            href="#features"
            className="text-sm font-medium underline underline-offset-4 text-[hsl(var(--text-secondary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
          >
            {t.heroSecondary}
          </a>
        }
        asset={
          // Above-the-fold start: scan on another device or tap the same Telegram link on this phone.
          <div>
            <p className="mb-3 text-sm font-semibold text-[hsl(var(--text-primary))]">{t.startTitle}</p>
            <div className="flex flex-col items-center rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--gold))]">{t.startPhoneEyebrow}</p>
              <div className="mt-3 rounded-xl bg-white p-3">
                <QRCodeSVG value={TG_DEEPLINK} size={116} level="M" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[hsl(var(--text-primary))]">{t.startPhoneTitle}</p>
              <a
                href={TG_DEEPLINK}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-xs underline underline-offset-4 text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--text-primary))]"
              >
                {t.startPhoneLink}
              </a>
            </div>
          </div>
        }
      />

      <Section id="features">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.featuresTitle}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--text-secondary))]">{t.featuresIntro}</p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {t.features.map((f) => (
            <Reveal key={f.id}>
              <div className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 h-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[hsl(var(--text-secondary))]">{f.label}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {t.liveLabel}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                  {f.headline}
                </h3>
                <p className="mt-2 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.gettingStartedTitle}
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-[hsl(var(--text-primary))]">
            {t.gettingStartedSteps.map((s, i) =>
              'restStrong' in s ? (
                <li key={i}>
                  {s.restPre}
                  <strong className="text-[hsl(var(--text-primary))]">{s.restStrong}</strong>
                  {s.restPost}
                </li>
              ) : (
                <li key={i}>
                  {s.link ? (
                    <a
                      href={TG_DEEPLINK}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-[hsl(var(--text-secondary))] transition-colors"
                    >
                      {s.link}
                    </a>
                  ) : null}
                  {s.rest}
                </li>
              ),
            )}
          </ol>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href={TG_DEEPLINK}
              target="_blank"
              rel="noreferrer"
              className="block rounded-card border border-[hsl(var(--gold))]/30 bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--gold))]">{t.cardGetStartedEyebrow}</p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">{t.cardGetStartedTitle}</p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.cardGetStartedDesc}</p>
            </a>
            <div className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">{t.cardColonyEyebrow}</p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">{t.cardColonyTitle}</p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.cardColonyDesc}</p>
              <div className="mt-3 flex gap-4 text-xs">
                <a href={`/privacy/${locale}`} className="underline underline-offset-4 hover:text-[hsl(var(--text-secondary))]">
                  {t.privacyCta}
                </a>
                <a href={`/support/${locale}`} className="underline underline-offset-4 hover:text-[hsl(var(--text-secondary))]">
                  {t.supportCta}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
