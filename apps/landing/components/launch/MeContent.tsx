/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import LaunchNav from '@/components/site/LaunchNav';
import Footer from '@/components/site/Footer';
import { Section, Reveal } from '@/components/site/taste';
import MeClient from '@/app/(main)/me/MeClient';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

// /me content — locale-parameterized. Extracted from the original app/me/page.tsx.
// GATE-0 integrity logic, MeClient (live wallet telemetry), and the illustrative
// colony/activity demo data are UNCHANGED — only the COPY comes from launchDict[lang].

type ChildInstance = {
  id: string;
  host: 'cloud' | 'local';
  hostLabel: string;
  model: string;
  balance: number;
  status: 'alive' | 'warning' | 'critical';
};

// ─── Static demo data (spec20 §3 wireframe values) — unchanged ────────────────
const GENESIS = {
  id: 'genesis',
  host: '☁ akash · US-west',
  model: '⚡ claude-sonnet-4-6',
  balance: 12.4,
  runwayDays: 29,
  status: 'alive' as const,
};

const COLONY = {
  totalAssets: 46.2,
  instanceCount: 3,
  selfFunded: true,
};

const MONEY = {
  sentToYou: 6.0,
  earnedThisMonth: 18.4,
  subscriptionCancelled: true,
};

const CHILDREN: ChildInstance[] = [
  { id: 'anicca-001', host: 'cloud', hostLabel: '☁ akash · EU', model: '⚡ sonnet', balance: 6.2, status: 'alive' },
  { id: 'anicca-002', host: 'local', hostLabel: '💻 local · JP', model: '○ free', balance: 0.9, status: 'warning' },
];

// ── GATE-0: the first REAL profitable on-chain wake (verified 2026-06-16) ──
// Logic UNCHANGED from app/me/page.tsx: a swap (own-asset liquidation) is NOT external
// revenue, so GATE0_MET stays false until a real external-earning wake is recorded.
const GATE0_WAKE = {
  source: 'swap-eth-usdc',
  task: 'eth→usdc liquidation for compute runway',
  earnUsdc: 0.547676,
  costUsdc: 0.001304,
  netUsdc: 0.546372,
  status: '0x1' as const,
  tx: '0xc4f2df3e445acaff01bd004f8503d41582d8acb12a55bf27797d5aea066f721d',
  date: '2026-06-16',
};
const GATE0_EXTERNAL = !/swap|liquidat/i.test(`${GATE0_WAKE.source} ${GATE0_WAKE.task}`);
const GATE0_MET = GATE0_EXTERNAL && GATE0_WAKE.status === '0x1' && GATE0_WAKE.netUsdc > 0;

function StatusDot({ status }: { status: 'alive' | 'warning' | 'critical' }) {
  const colors: Record<string, string> = {
    alive: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} aria-label={status} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))] mb-3">{children}</p>
  );
}

export default function MeContent({ lang }: { lang: LaunchLocale }) {
  const t = launchDict[lang].me;
  const prefix = (p: string) => `/${lang}${p}`;

  const ACTIVITY_LOG = [
    { time: GATE0_WAKE.date, icon: '💰', label: t.activityEthSwap, delta: `+$${GATE0_WAKE.netUsdc.toFixed(4)}` },
  ];

  return (
    <>
      <LaunchNav active="/me" lang={lang} />

      {/* ── LIVE primary card (A-earn GATE-0): connect wallet → real telemetry ── */}
      <Section>
        <Reveal>
          <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))]">{t.h1}</h1>
          <p className="mt-4 max-w-prose text-[hsl(var(--text-secondary))]">{t.intro}</p>
          <MeClient />
        </Reveal>
      </Section>

      {/* ── GATE-0: the first REAL profitable on-chain wake (verified, re-checkable) ── */}
      <Section>
        <Reveal>
          <Card className="border-emerald-500/40 bg-[hsl(var(--surface-elevated))]">
            <div className="flex items-center justify-between gap-3">
              <CardLabel>{t.gate0Label}</CardLabel>
              {GATE0_MET ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <StatusDot status="alive" /> {t.gate0Met}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                  <StatusDot status="warning" /> {t.gate0NotMet}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <p className="text-3xl font-bold text-emerald-400">+${GATE0_WAKE.netUsdc.toFixed(4)}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">
                  {t.gate0NetCaption}（earn ${GATE0_WAKE.earnUsdc.toFixed(4)} − cost $
                  {GATE0_WAKE.costUsdc.toFixed(4)}）
                </p>
              </div>
              <div>
                <p className="text-base font-semibold text-[hsl(var(--text-primary))]">{t.gate0Action}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">{t.gate0ActionCaption}</p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-emerald-400">
                  receipt {GATE0_WAKE.status}
                </p>
                <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">{t.gate0Receipt}</p>
              </div>
            </div>
            <a
              href={`https://basescan.org/tx/${GATE0_WAKE.tx}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-mono text-xs underline underline-offset-4 text-[hsl(var(--text-secondary))] hover:text-emerald-400 transition-colors break-all"
            >
              tx {GATE0_WAKE.tx.slice(0, 10)}…{GATE0_WAKE.tx.slice(-6)} — {t.gate0Verify} →
            </a>
            <p className="mt-3 text-[10px] text-[hsl(var(--text-secondary))]">{t.gate0Footnote}</p>
          </Card>
        </Reveal>
      </Section>

      {/* ── Money (illustrative colony view) ── */}
      <Section>
        <Reveal>
          <h2 className="sr-only">{t.colony}</h2>
          <Card className="border-[hsl(var(--gold))]/40 bg-[hsl(var(--surface-elevated))]">
            <CardLabel>{t.moneyLabel}</CardLabel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-bold text-[hsl(var(--gold))]">${MONEY.sentToYou.toFixed(2)}</p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">{t.sentToYou}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[hsl(var(--text-primary))]">
                    ${MONEY.earnedThisMonth.toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">{t.earnedThisMonth}</p>
                </div>
                <div>
                  <p className="text-base font-semibold text-emerald-400">
                    {MONEY.subscriptionCancelled ? t.subCancelled : t.subActive}
                  </p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))]">{t.subLabel}</p>
                </div>
              </div>

              <a
                href="https://billing.stripe.com/p/login/anicca"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-pill bg-[hsl(var(--gold))] px-5 py-2.5 text-sm font-semibold text-[#18181b] transition-all duration-300 hover:brightness-95 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
              >
                {t.withdraw}
              </a>
            </div>
          </Card>
        </Reveal>
      </Section>

      {/* ── Instance + Colony cards (2-up) ── */}
      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardLabel>{t.yourAnicca}</CardLabel>
              <div className="flex items-start gap-3">
                <StatusDot status={GENESIS.status} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[hsl(var(--text-primary))]">{GENESIS.id}</p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--text-secondary))] truncate">{GENESIS.host}</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-[hsl(var(--text-secondary))]">{t.model}</p>
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{GENESIS.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(var(--text-secondary))]">{t.balance}</p>
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                        ${GENESIS.balance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(var(--text-secondary))]">{t.runway}</p>
                      <p className="text-sm font-medium text-amber-400">
                        ☠ {GENESIS.runwayDays}{t.runwaySuffix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardLabel>{t.colony}</CardLabel>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">
                    ${COLONY.totalAssets.toFixed(2)}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-secondary))]">{t.totalAssets}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-[hsl(var(--text-primary))]">
                    {t.bodies} <strong>{COLONY.instanceCount}</strong>
                    <span className="text-[hsl(var(--text-secondary))]">
                      {' '}{t.bodiesNote(COLONY.instanceCount - 1)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-medium">
                  {COLONY.selfFunded ? t.selfFundedYes : t.selfFundedNo}
                </p>
                <Link
                  href={prefix('/dashboard')}
                  className="block text-xs underline underline-offset-4 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors"
                >
                  {t.viewColony}
                </Link>
              </div>
            </Card>
          </div>
        </Reveal>
      </Section>

      {/* ── Children (self-spawned) ── */}
      <Section>
        <Reveal>
          <CardLabel>{t.children}</CardLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHILDREN.map((child) => (
              <Card key={child.id}>
                <div className="flex items-center gap-2">
                  <StatusDot status={child.status} />
                  <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">{child.id}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[hsl(var(--text-secondary))]">
                  <span>{child.hostLabel}</span>
                  <span>{child.model}</span>
                  <span className="font-medium text-[hsl(var(--text-primary))]">
                    ${child.balance.toFixed(2)}
                  </span>
                  {child.status === 'warning' && <span className="text-amber-400">{t.lowBalance}</span>}
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ── Activity log (24h) ── */}
      <Section>
        <Reveal>
          <Card>
            <CardLabel>{t.activityLog}</CardLabel>
            <ul className="space-y-2">
              {ACTIVITY_LOG.map((entry) => (
                <li key={`${entry.time}-${entry.label}`} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-xs text-[hsl(var(--text-secondary))] tabular-nums shrink-0">
                    {entry.time}
                  </span>
                  <span>{entry.icon}</span>
                  <span className="flex-1 text-[hsl(var(--text-secondary))] truncate">{entry.label}</span>
                  <span className="font-mono text-xs text-emerald-400 shrink-0">{entry.delta}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-[hsl(var(--text-secondary))]">{t.activityFootnote}</p>
          </Card>
        </Reveal>
      </Section>

      {/* ── Life context (optional, shown when connected) ── */}
      <Section>
        <Reveal>
          <Card>
            <CardLabel>{t.lifeContext}</CardLabel>
            <p className="text-sm text-[hsl(var(--text-secondary))]">
              {t.lifeNext}{' '}
              <strong className="text-[hsl(var(--text-primary))]">Team Sync 9:30</strong>
              {'  ·  '}
              {t.lifeInbox}{' '}
              <strong className="text-[hsl(var(--text-primary))]">2</strong> / {t.lifeProcessed}{' '}
              <span>8</span>
            </p>
            <p className="mt-3 text-[10px] text-[hsl(var(--text-secondary))]">{t.lifeFootnote}</p>
          </Card>
        </Reveal>
      </Section>

      {/* ── Action buttons ── */}
      <Section>
        <Reveal>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://t.me/AniccaLifeBot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-pill border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--text-primary))] transition-colors hover:bg-[hsl(var(--surface-elevated))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
            >
              {t.talkToAnicca}
            </a>
          </div>
        </Reveal>
      </Section>

      {/* ── Bottom nav links ── */}
      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={prefix('/install')}
              className="block rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">
                {t.newInstanceKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                aniccaai.com/install
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.newInstanceDesc}</p>
            </Link>
            <Link
              href={prefix('/dashboard')}
              className="block rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-colors hover:bg-[hsl(var(--surface-elevated))]"
            >
              <p className="text-xs uppercase tracking-widest text-[hsl(var(--text-secondary))]">
                {t.liveColonyKicker}
              </p>
              <p className="mt-2 text-base font-semibold text-[hsl(var(--text-primary))]">
                aniccaai.com/dashboard
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{t.liveColonyDesc}</p>
            </Link>
          </div>
        </Reveal>
      </Section>

      <Footer locale={lang} />
    </>
  );
}
