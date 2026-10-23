'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/site/taste';
import { useLaunchLocale } from '@/lib/launchLocale';
import { LIFE_MANAGER_WEB_APP_URL, lifeManagerCtaHref } from '@/lib/writer-cta-url';
import { launchStrings } from '@/lib/launchStrings';

const REPOSITORY_URL = 'https://github.com/Daisuke134/life-manager';

const RUNS_ON = {
  en: {
    eyebrow: 'Works with any agent',
    title: 'Prefer to run it yourself? Life Manager runs on the agent you already use.',
    body: 'The open-source Life Manager is a GitHub repository with agent instructions (AGENTS.md). Run it locally with your ChatGPT subscription, or hand it to a hosted agent.',
    prompt:
      'Clone https://github.com/Daisuke134/life-manager, read AGENTS.md and docs/getting-started.md, then set up the agents I pick and report results to me here.',
    promptLabel: 'Prompt for hosted agents',
    note: 'The local Mac install is the supported path. Hosted agents follow the same instructions, but scheduling and Mac-only steps can differ by platform.',
    repo: 'Open the repository',
    platforms: [
      { name: 'Local · ChatGPT / Codex', steps: ['Run the one-line installer from the README', 'Sign in with ChatGPT (no API key)', 'Connect the services you want'] },
      { name: 'Grok Bot', steps: ['Open a chat with your bot', 'Paste the prompt below', 'Approve account connections when asked'] },
      { name: 'Dots', steps: ['Open a chat with your agent', 'Paste the prompt below', 'Approve account connections when asked'] },
      { name: 'Muse', steps: ['Open a chat with your agent', 'Paste the prompt below', 'Approve account connections when asked'] },
    ],
  },
  ja: {
    eyebrow: 'どのエージェントでも動きます',
    title: '自分で動かしたい方へ。Life Managerは、いま使っているエージェントで動きます。',
    body: 'オープンソース版のLife Managerは、エージェント向けの指示（AGENTS.md）付きのGitHubリポジトリです。ChatGPTのサブスクでローカルに動かすことも、クラウドのエージェントに任せることもできます。',
    prompt:
      'https://github.com/Daisuke134/life-manager をクローンして、AGENTS.md と docs/getting-started.md を読み、私が選んだエージェントを設定して、結果をここで報告して。',
    promptLabel: 'クラウドのエージェントに貼るプロンプト',
    note: '正式にサポートしているのはローカルのMacへのインストールです。クラウドのエージェントも同じ手順に従いますが、定期実行やMac専用の手順はサービスによって異なる場合があります。',
    repo: 'リポジトリを見る',
    platforms: [
      { name: 'ローカル · ChatGPT / Codex', steps: ['READMEの1行インストールを実行', 'ChatGPTでログイン（APIキー不要）', '使いたいサービスを接続'] },
      { name: 'Grok Bot', steps: ['Botとのチャットを開く', '下のプロンプトを貼る', '聞かれたらアカウント接続を許可'] },
      { name: 'Dots', steps: ['エージェントとのチャットを開く', '下のプロンプトを貼る', '聞かれたらアカウント接続を許可'] },
      { name: 'Muse', steps: ['エージェントとのチャットを開く', '下のプロンプトを貼る', '聞かれたらアカウント接続を許可'] },
    ],
  },
} as const;

// The public landing page enters the browser-based Calendar setup. Writer query identity is
// validated locally and routed through its click-receipt redirect before continuing to the Web app.
export default function LmBody() {
  const { locale } = useLaunchLocale();
  const t = launchStrings[locale].lm;
  const r = locale === 'ja' ? RUNS_ON.ja : RUNS_ON.en;
  const [startHref, setStartHref] = useState(LIFE_MANAGER_WEB_APP_URL);
  useEffect(() => {
    setStartHref(lifeManagerCtaHref(window.location.search));
  }, []);
  return (
    <main className="w-full overflow-hidden px-4 pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <section className="relative border-y border-[hsl(var(--border))] py-10 md:py-16">
            <div className="pointer-events-none absolute -right-24 top-4 h-72 w-72 rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl" />
            <div className="relative grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                  {t.publicEyebrow}
                </p>
                <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-[hsl(var(--text-primary))] md:text-7xl">
                  {t.publicTitle}
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-8 text-[hsl(var(--text-secondary))] md:text-lg">
                  {t.publicBody}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={startHref}
                    className="inline-flex items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-7 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0"
                  >
                    {t.primaryCta}
                  </a>
                  <a
                    href={REPOSITORY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-pill border border-[hsl(var(--border))] px-7 py-3 text-sm font-semibold text-[hsl(var(--text-primary))] transition-all hover:border-[hsl(var(--gold))]"
                  >
                    {t.sourceCta}
                  </a>
                </div>
              </div>

              <aside className="border-l border-[hsl(var(--border))] pl-6 md:pl-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--text-secondary))]">
                  {t.surfacesLabel}
                </p>
                <div className="mt-5 space-y-4">
                  <p className="border-t border-[hsl(var(--border))] pt-4 font-display text-xl text-[hsl(var(--text-primary))]">
                    {t.localSurface}
                  </p>
                  <p className="border-t border-[hsl(var(--border))] pt-4 font-display text-xl text-[hsl(var(--text-primary))]">
                    {t.cloudSurface}
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="py-16 md:py-24">
            <h2 className="max-w-3xl font-display text-3xl tracking-[-0.03em] text-[hsl(var(--text-primary))] md:text-5xl">
              {t.organsTitle}
            </h2>
            <div className="mt-10 grid border-y border-[hsl(var(--border))] md:grid-cols-3">
              {t.organs.map((organ) => (
                <article key={organ.index} className="border-b border-[hsl(var(--border))] py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                  <p className="font-mono text-xs text-[hsl(var(--gold))]">{organ.index}</p>
                  <h3 className="mt-8 font-display text-2xl text-[hsl(var(--text-primary))]">{organ.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[hsl(var(--text-secondary))]">{organ.body}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <section className="h-full rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-7 md:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{t.wedgeEyebrow}</p>
              <h2 className="mt-5 font-display text-3xl tracking-[-0.02em] text-[hsl(var(--text-primary))]">
                {t.wedgeTitle}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[hsl(var(--text-secondary))]">{t.wedgeBody}</p>
            </section>
          </Reveal>
          <Reveal>
            <section className="h-full rounded-card border border-[hsl(var(--gold)/0.5)] bg-[hsl(var(--gold)/0.06)] p-7 md:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{t.proofLabel}</p>
              <h2 className="mt-5 font-display text-3xl tracking-[-0.02em] text-[hsl(var(--text-primary))]">
                {t.evidenceTitle}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[hsl(var(--text-secondary))]">{t.evidenceBody}</p>
              <p className="mt-4 border-t border-[hsl(var(--border))] pt-4 font-mono text-xs leading-6 text-[hsl(var(--text-secondary))]">
                {t.evidenceBoundary}
              </p>
            </section>
          </Reveal>
        </div>

        <Reveal>
          <section className="mt-16 border-t border-[hsl(var(--border))] py-16 md:py-20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{r.eyebrow}</p>
            <h2 className="mt-5 max-w-3xl font-display text-3xl tracking-[-0.02em] text-[hsl(var(--text-primary))] md:text-4xl">
              {r.title}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[hsl(var(--text-secondary))]">{r.body}</p>
            <ul className="mt-8 flex flex-wrap gap-3">
              {r.platforms.map((p) => (
                <li key={p.name} className="rounded-full border border-[hsl(var(--gold)/0.5)] px-4 py-2 text-sm text-[hsl(var(--text-primary))]">
                  {p.name}
                </li>
              ))}
            </ul>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {r.platforms.map((p) => (
                <article key={p.name} className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
                  <h3 className="font-display text-xl text-[hsl(var(--text-primary))]">{p.name}</h3>
                  <ol className="mt-4 space-y-3">
                    {p.steps.map((step, i) => (
                      <li key={step} className="text-sm leading-6 text-[hsl(var(--text-secondary))]">
                        <span className="mr-2 font-mono text-xs text-[hsl(var(--gold))]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
            <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{r.promptLabel}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 font-mono text-xs leading-6 text-[hsl(var(--text-primary))]">
              {r.prompt}
            </pre>
            <p className="mt-4 text-xs leading-6 text-[hsl(var(--text-secondary))]">{r.note}</p>
            <a href={REPOSITORY_URL} className="mt-6 inline-block text-sm text-[hsl(var(--text-primary))] underline underline-offset-4 hover:text-[hsl(var(--gold))]">
              {r.repo} →
            </a>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
