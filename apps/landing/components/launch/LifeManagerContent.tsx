import LaunchNav from '@/components/site/LaunchNav';
import Footer from '@/components/site/Footer';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

// /life-manager content — locale-parameterized. Extracted from the original
// app/life-manager/page.tsx; copy now comes from launchDict[lang]. Schedule example
// values (times, "Team Sync", "Lunch with Kato") are illustrative data, kept as-is.

type FeatureStatus = 'live' | 'coming';

const STATUS_BADGE: Record<FeatureStatus, string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  coming:
    'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))]',
};

export default function LifeManagerContent({ lang }: { lang: LaunchLocale }) {
  const t = launchDict[lang].lifeManager;
  const prefix = (p: string) => `/${lang}${p}`;
  const statusLabel: Record<FeatureStatus, string> = {
    live: t.statusLive,
    coming: t.statusComing,
  };

  return (
    <>
      <LaunchNav active="/life-manager" lang={lang} />

      <SplitHero
        headline={t.heroTitle}
        subtext={t.heroSubtitle}
        primary={
          <CTA href={prefix('/install')} variant="primary">
            {t.ctaInstall}
          </CTA>
        }
        secondary={
          <a
            href="#features"
            className="text-sm font-medium underline underline-offset-4 text-[hsl(var(--text-secondary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
          >
            {t.ctaSeeHow}
          </a>
        }
        asset={
          <div className="space-y-2 rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-5 font-mono text-sm">
            <p className="text-[hsl(var(--text-secondary))]">08:40 — wake-up call (Charon)</p>
            <p className="text-emerald-400">09:40 — [Travel] Team Sync → 20 min</p>
            <p className="text-[hsl(var(--text-primary))]">10:00 — Team Sync</p>
            <p className="text-emerald-400">11:40 — [Travel] Lunch → 8 min</p>
            <p className="text-[hsl(var(--text-primary))]">11:48 — Lunch with Kato</p>
            <p className="mt-1 text-xs text-[hsl(var(--text-secondary))] not-italic">
              {t.scheduleNote}
            </p>
          </div>
        }
      />

      <Section id="features">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.skillsTitle}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--text-secondary))]">{t.skillsIntro}</p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {t.features.map((f) => (
            <Reveal key={f.label}>
              <div className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 h-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[hsl(var(--text-secondary))]">
                    {f.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[f.status]}`}
                  >
                    {statusLabel[f.status]}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                  {f.headline}
                </h3>
                <p className="mt-2 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.howTitle}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left">
                  <th className="py-2 pr-4 font-semibold text-[hsl(var(--text-primary))]">{t.howStep}</th>
                  <th className="py-2 pr-4 font-semibold text-[hsl(var(--text-primary))]">{t.howWhat}</th>
                  <th className="py-2 font-semibold text-[hsl(var(--text-primary))]">{t.howApi}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {t.howRows.map((row, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4 font-mono text-xs text-[hsl(var(--text-secondary))]">
                      {i + 1}
                    </td>
                    <td className="py-3 pr-4 text-[hsl(var(--text-primary))]">{row.what}</td>
                    <td className="py-3 text-[hsl(var(--text-secondary))] font-mono text-xs">
                      {row.api}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[hsl(var(--text-secondary))]">
            {t.howFootnotePre}
            <code className="rounded-input bg-[hsl(var(--surface-elevated))] px-1 py-0.5">
              {t.howFootnoteCode}
            </code>
            {t.howFootnotePost}
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.triggerTitle}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
            {t.triggerBodyPre}
            <code className="rounded-input bg-[hsl(var(--surface-elevated))] px-1 py-0.5">
              {t.triggerCode}
            </code>
            {t.triggerBodyPost}
          </p>
          <p className="mt-3 text-sm text-[hsl(var(--text-secondary))]">{t.triggerResult}</p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[hsl(var(--text-primary))]">
            {t.startTitle}
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-[hsl(var(--text-primary))]">
            {t.startSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href={prefix('/install')}
              className="block rounded-card border border-[hsl(var(--gold))]/30 bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--gold))]">
                {t.getStartedKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                {t.getStartedTitle}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.getStartedDesc}</p>
            </a>
            <a
              href={prefix('/dashboard')}
              className="block rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">
                {t.ledgerKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                {t.ledgerTitle}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.ledgerDesc}</p>
            </a>
          </div>
        </Reveal>
      </Section>

      <Footer locale={lang} />
    </>
  );
}
