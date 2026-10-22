'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Search, SlidersHorizontal } from 'lucide-react';
import {
  filterAiMonkAccounts,
  rankAiMonkAccounts,
  type AiMonkAccount,
  type AiMonkDirectoryFilters,
} from '@/lib/ai-monk-directory.mjs';

const ARTICLE_LINKS = [
  { href: '/blog/ebook-publishing-yang-mun-video-to-product', label: 'The Yang Mun Shock · EN' },
  { href: '/blog/ebook-publishing-yang-mun-case-study-ja', label: 'Yang Munの衝撃 · JA' },
  { href: '/blog/ebook-publishing-ai-monk-economy-2026', label: 'The Art of AI Monks · EN' },
  { href: '/blog/ai-monk-avatar-field-guide-ja-2026', label: 'AI僧侶列伝 · JA' },
];

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  reported: 'Reported',
  unverified: 'Unverified',
} as const;

const STATUS_STYLES = {
  confirmed: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  reported: 'border-amber-300 bg-amber-50 text-amber-950',
  unverified: 'border-stone-300 bg-stone-100 text-stone-700',
} as const;

type FilterField = keyof AiMonkDirectoryFilters;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function metricValue(value: number | string) {
  if (typeof value !== 'number') return value;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}K`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

function sourceLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function ProfileCard({ account }: { account: AiMonkAccount }) {
  const languages = account.languages?.map(({ label }) => label) ?? [];
  const snapshots = (account.platforms ?? []).flatMap((platform) =>
    (platform.snapshots ?? []).map((snapshot) => ({ ...snapshot, platform: platform.platform }))
  ).slice(0, 3);
  const sources = [...new Set(account.source_urls ?? [])];

  return (
    <article className="flex h-full flex-col rounded-[1.6rem] border border-[#ded9ce] bg-white p-6 shadow-[0_12px_35px_rgba(40,34,22,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(40,34,22,0.12)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-[#766f60]">{account.persona_type}</p>
          <h2 className="break-words text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#22231f]">{account.display_name}</h2>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[account.ai_status]}`}>
          {STATUS_LABELS[account.ai_status]}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(account.platforms ?? []).map((platform, index) => platform.profile_url ? (
          <a
            key={`${platform.platform}-${platform.handle ?? index}`}
            href={platform.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#f1eee7] px-3 py-1.5 text-xs font-medium text-[#35362f] hover:bg-[#e7e1d5]"
          >
            {platform.platform}{platform.handle ? ` · @${platform.handle}` : ' · archived profile'} <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        ) : (
          <span key={`${platform.platform}-${index}`} className="rounded-full border border-dashed border-[#c9c2b4] px-3 py-1.5 text-xs text-[#6b675e]">
            {platform.platform} · handle unconfirmed
          </span>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-[#eeeae2] py-5 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-[#827b6d]">Creator</dt>
          <dd className="mt-1 font-medium text-[#292a25]">
            {account.creator?.name ?? 'Unknown'}
            {account.creator?.public_profile_url && (
              <a className="ml-1 inline-flex align-middle text-[#7b5b11]" href={account.creator.public_profile_url} target="_blank" rel="noopener noreferrer" aria-label={`${account.creator.name} creator profile`}>
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-[#827b6d]">Language</dt>
          <dd className="mt-1 font-medium text-[#292a25]">{languages.length ? languages.join(', ') : 'Unknown'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-[0.12em] text-[#827b6d]">Region signal</dt>
          <dd className="mt-1 font-medium text-[#292a25]">{account.region_evidence?.label ?? 'Unknown'}</dd>
          {account.region_evidence && <p className="mt-1 text-xs leading-relaxed text-[#777164]">{account.region_evidence.basis}</p>}
        </div>
      </dl>

      {snapshots.length > 0 && (
        <section className="mt-5" aria-label={`${account.display_name} dated public metrics`}>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#827b6d]">Public snapshots</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {snapshots.map((snapshot, index) => (
              <span key={`${snapshot.metric}-${snapshot.as_of ?? 'undated'}-${index}`} className="rounded-xl bg-[#f7f5f0] px-3 py-2 text-xs text-[#49483f]">
                <strong className="text-sm text-[#24251f]">{metricValue(snapshot.value)}</strong> {snapshot.metric.replaceAll('_', ' ')}
                <span className="block text-[0.68rem] text-[#827b6d]">{snapshot.as_of ?? 'date not supplied'} · {snapshot.platform}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {(account.offers ?? []).length > 0 && (
        <section className="mt-5 rounded-2xl bg-[#fbf6e8] p-4" aria-label={`${account.display_name} visible offers`}>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#78602b]">Visible offer · not sales data</p>
          <ul className="mt-2 space-y-2 text-sm text-[#353229]">
            {(account.offers ?? []).map((offer, index) => (
              <li key={`${offer.name ?? offer.type}-${index}`} className="flex items-start justify-between gap-3">
                <span>{offer.url ? <a href={offer.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{offer.name ?? offer.type} ↗</a> : offer.name ?? offer.type}</span>
                <strong className="shrink-0">{typeof offer.price === 'number' ? `${offer.currency === 'USD' ? '$' : ''}${offer.price.toFixed(2)}${offer.currency && offer.currency !== 'USD' ? ` ${offer.currency}` : ''}` : 'Price not stated'}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto pt-6">
        <details className="group border-t border-[#eeeae2] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#393930] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#99751b]">
            Evidence, creative notes & unknowns
            <span className="text-lg transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="space-y-4 pt-4">
            {account.ai_evidence && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Why this status</p>
                <ul className="space-y-2 text-sm leading-relaxed text-[#504e45]">
                  {account.ai_evidence.map((item, index) => <li key={`${item.source_id}-${index}`}>{item.summary}</li>)}
                </ul>
              </div>
            )}
            {(account.identity_conflicts ?? []).length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-900">Conflicting public claim</p>
                <ul className="space-y-2 text-sm leading-relaxed text-rose-950">
                  {account.identity_conflicts?.map((item, index) => <li key={`${item.source_id}-${index}`}>{item.summary}</li>)}
                </ul>
              </div>
            )}
            {(account.seller_counters ?? []).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Seller-displayed counters · not audited</p>
                <ul className="space-y-1 text-xs leading-relaxed text-[#625e53]">
                  {account.seller_counters?.map((counter, index) => <li key={`${counter.metric}-${index}`}>{counter.value} · {counter.metric.replaceAll('_', ' ')} · {counter.status.replaceAll('_', ' ')}</li>)}
                </ul>
              </div>
            )}
            {(account.creator_claims ?? []).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Creator claims · not audited</p>
                <ul className="space-y-1 text-xs leading-relaxed text-[#625e53]">
                  {account.creator_claims?.map((claim, index) => <li key={`${account.id}-claim-${index}`}>{claim.claim}</li>)}
                </ul>
              </div>
            )}
            {(account.creative_samples ?? []).map((sample, index) => (
              <div key={`${sample.url}-${index}`} className="rounded-xl bg-[#f7f5f0] p-3">
                <a className="inline-flex items-center gap-1 text-sm font-semibold text-[#6d5010] underline underline-offset-4" href={sample.url} target="_blank" rel="noopener noreferrer">
                  {sample.title} <ArrowUpRight size={13} aria-hidden="true" />
                </a>
                <p className="mt-2 text-xs leading-relaxed text-[#5f5b51]">{sample.structure_summary}</p>
                {sample.views != null && <p className="mt-2 text-[0.68rem] text-[#827b6d]">{metricValue(sample.views)} views · captured {sample.views_captured_at ?? 'date not supplied'}</p>}
              </div>
            ))}
            {(account.unknowns ?? []).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Still unknown</p>
                <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-[#625e53]">
                  {account.unknowns?.map((item, index) => <li key={`${account.id}-unknown-${index}`}>{item}</li>)}
                </ul>
              </div>
            )}
            {sources.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#827b6d]">Open the sources</p>
                <ul className="grid gap-2 text-xs sm:grid-cols-2">
                  {sources.map((url) => (
                    <li key={url}>
                      <a className="inline-flex items-center gap-1 text-[#6d5010] underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">
                        {sourceLabel(url)} <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

export default function AiMonkDatabase({
  accounts,
  sourceCount,
  updatedAt,
}: {
  accounts: AiMonkAccount[];
  sourceCount: number;
  updatedAt: string;
}) {
  const [filters, setFilters] = useState<AiMonkDirectoryFilters>({
    query: '', status: 'all', language: 'all', platform: 'all', region: 'all',
  });

  const [sortBy, setSortBy] = useState('audience');

  const languages = useMemo(() => unique(accounts.flatMap((account) => account.languages?.map(({ label }) => label) ?? [])), [accounts]);
  const platforms = useMemo(() => unique(accounts.flatMap((account) => account.platforms?.map(({ platform }) => platform) ?? [])), [accounts]);
  const regions = useMemo(() => unique(accounts.flatMap((account) => account.region_evidence ? [account.region_evidence.label] : [])), [accounts]);
  const results = useMemo(() => {
    const matching = filterAiMonkAccounts(accounts, filters);
    return sortBy === 'audience' ? rankAiMonkAccounts(matching, filters.platform) : matching;
  }, [accounts, filters, sortBy]);
  const languageCount = languages.length;
  const leadCount = accounts.filter((account) => account.persona_type.includes('account lead')).length;
  const researchedCount = accounts.length - leadCount;

  function changeFilter(field: FilterField, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function clearFilters() {
    setFilters({ query: '', status: 'all', language: 'all', platform: 'all', region: 'all' });
  }

  const hasFilters = Object.entries(filters).some(([key, value]) => key === 'query' ? Boolean(value) : value !== 'all');

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-16 sm:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#20221e] px-7 py-10 text-[#f7f2e7] sm:px-12 sm:py-14 lg:px-16" aria-labelledby="directory-heading">
          <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-[#c6a044]/30 sm:right-16 sm:top-[-9rem] sm:h-[30rem] sm:w-[30rem]">
            <div className="absolute inset-8 rounded-full border border-[#c6a044]/25" />
            <div className="absolute inset-16 rounded-full border border-[#c6a044]/20" />
            <div className="absolute inset-0 grid place-items-center text-[6rem] font-serif font-light text-[#d4ad51]/20 sm:text-[9rem]">禅</div>
          </div>
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="max-w-3xl">
              <p className="mb-5 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#d8b65c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d8b65c]" /> Anicca · The Art of AI Monks · Open Index
              </p>
              <h1 id="directory-heading" className="max-w-[14ch] text-5xl font-semibold leading-[0.99] tracking-[-0.055em] sm:text-7xl">
                Who&apos;s behind<br className="hidden sm:block" /> the robe?
              </h1>
              <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-[#dedbd2] sm:text-lg">
                A monk appears in your feed. Who made the character, what language does it speak, and what does it sell? Start with English-speaking profiles, compare public audiences, and follow the evidence.
              </p>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/15 pt-5 text-sm text-[#d7d2c7]">
                <span><strong className="mr-1.5 text-2xl font-semibold text-white">{researchedCount}</strong> researched profiles</span>
                <span><strong className="mr-1.5 text-2xl font-semibold text-white">{languageCount}</strong> documented languages</span>
                <span><strong className="mr-1.5 text-2xl font-semibold text-white">{leadCount}</strong> unverified leads</span>
              </div>
            </div>
            <figure className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#f4eddb] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <img
                src="/assets/ai-monk-directory-illustration.webp"
                alt=""
                aria-hidden="true"
                className="aspect-[3/2] w-full object-cover"
              />
              <figcaption className="bg-[#f4eddb] px-4 py-2 text-[0.68rem] text-[#5f594c]">Original illustration · no real account portraits</figcaption>
            </figure>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-6 max-w-[900px] rounded-2xl border border-[#e5dfd2] bg-white p-3 shadow-[0_20px_55px_rgba(41,35,22,0.14)] sm:-mt-8 sm:p-4" aria-label="Search and filter the directory">
          <label htmlFor="monk-search" className="sr-only">Search profiles, creators, languages, and platforms</label>
          <div className="flex items-center gap-3 rounded-xl px-3 sm:px-4">
            <Search className="shrink-0 text-[#7b6a3f]" size={21} aria-hidden="true" />
            <input
              id="monk-search"
              type="search"
              value={filters.query ?? ''}
              onChange={(event) => changeFilter('query', event.target.value)}
              placeholder="Search names, creators, handles… try “Yang Mun” or “Spanish”"
              className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-[#24251f] outline-none placeholder:text-[#918b7f] focus:ring-0 sm:text-lg"
            />
            <span className="hidden rounded-lg bg-[#f5f2eb] px-3 py-2 text-xs text-[#716a5d] sm:inline">{results.length} found</span>
          </div>
          <div className="mt-2 grid gap-2 border-t border-[#eeeae2] px-2 pt-3 sm:grid-cols-4 sm:px-3">
            <label className="block">
              <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#817a6e]">Evidence</span>
              <select aria-label="Filter by evidence status" value={filters.status} onChange={(event) => changeFilter('status', event.target.value)} className="w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2.5 text-sm text-[#34342d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="reported">Reported</option><option value="unverified">Unverified</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#817a6e]">Language</span>
              <select aria-label="Filter by language" value={filters.language} onChange={(event) => changeFilter('language', event.target.value)} className="w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2.5 text-sm text-[#34342d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <option value="all">All languages</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}<option value="unknown">Language not confirmed</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#817a6e]">Platform</span>
              <select aria-label="Filter by platform" value={filters.platform} onChange={(event) => changeFilter('platform', event.target.value)} className="w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2.5 text-sm text-[#34342d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <option value="all">All platforms</option>{platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#817a6e]">Region signal</span>
              <select aria-label="Filter by region evidence" value={filters.region} onChange={(event) => changeFilter('region', event.target.value)} className="w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2.5 text-sm text-[#34342d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <option value="all">All regions</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}<option value="unknown">Region not confirmed</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="profiles-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#8a733b]">The open index</p>
              <h2 id="profiles-heading" className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Profiles, with receipts.</h2>
              <p className="mt-2 text-sm text-[#706b60]">Updated {updatedAt} · {sourceCount} evidence references · {researchedCount} researched profiles and {leadCount} unverified leads, not a census.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#5e5a50]">
              Sort
              <select aria-label="Sort profiles" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-[#d7d0c2] bg-white px-3 py-2 text-sm">
                <option value="audience">Largest public audience</option>
                <option value="evidence">Research order</option>
              </select>
            </label>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 rounded-full border border-[#cfc8b8] px-4 py-2 text-sm font-medium text-[#45443c] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <SlidersHorizontal size={15} aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>

          <p className="mb-5 max-w-3xl text-xs leading-relaxed text-[#777164]">Audience order uses the latest numeric followers or subscribers on the selected platform. With all platforms selected, it uses the largest single audience, without adding accounts together. Counts are dated snapshots, not sales or proof of AI origin.</p>
          <p className="sr-only" aria-live="polite">{results.length} profiles match the current search.</p>
          {results.length ? (
            <div className="grid items-stretch gap-5 lg:grid-cols-2">
              {results.map((account) => <ProfileCard key={account.id} account={account} />)}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#cfc8b8] bg-white/70 px-6 py-14 text-center">
              <p className="text-xl font-semibold text-[#303129]">No monk in this corner of the archive.</p>
              <p className="mt-2 text-sm text-[#716c61]">Try another name or loosen one of the filters.</p>
              <button type="button" onClick={clearFilters} className="mt-5 rounded-full bg-[#282a24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#42443b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ae8a32]">Clear search</button>
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-6 border-t border-[#ded8ca] pt-8 md:grid-cols-[1fr_1.2fr]" aria-labelledby="about-index">
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8a733b]">Read the field notes</p>
            <h2 id="about-index" className="text-2xl font-semibold tracking-[-0.035em]">Start with the monk everyone knows.</h2>
            <div className="mt-4 flex flex-col items-start gap-2">
              {ARTICLE_LINKS.map((article) => <Link key={article.href} href={article.href} className="inline-flex items-center gap-1 text-sm font-medium text-[#6f5111] underline underline-offset-4 hover:text-[#372b0f]">{article.label} <BookOpen size={14} aria-hidden="true" /></Link>)}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-[#eae5d9] p-6 sm:p-7">
            <p className="text-lg font-semibold text-[#303129]">A robe is a visual cue. It is not proof.</p>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[#5e5a50]">“Confirmed” means a creator, platform, or credible report identifies a synthetic persona. “Reported” preserves an investigation's classification where the public identity is still incomplete. “Unverified” means we have a screenshot or visual clue without an independent readback.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/data/ai-monk-avatar-database-2026.json" className="inline-flex items-center gap-2 rounded-full bg-[#282a24] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#42443b]">Open the dataset <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/Daisuke134/anicca-products/blob/main/apps/landing/public/data/ai-monk-avatar-database-2026.json" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#bcb5a7] px-4 py-2.5 text-sm font-semibold text-[#38382f] hover:bg-white">View on GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/Daisuke134/anicca-products/issues/new?title=AI%20monk%20profile%20suggestion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#bcb5a7] px-4 py-2.5 text-sm font-semibold text-[#38382f] hover:bg-white">Suggest a profile <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
          </div>
        </section>
        <p className="mt-6 text-xs text-[#817a6e]">Anicca-authored summaries are shared under <a className="underline underline-offset-2" href="/data/ai-monk-avatar-database-license.md">CC BY 4.0</a>; the index code is under the <a className="underline underline-offset-2" href="https://github.com/Daisuke134/anicca-products/blob/main/apps/landing/AI-MONK-INDEX-LICENSE.md" target="_blank" rel="noopener noreferrer">MIT License</a>. Third-party names, marks, and linked media belong to their owners. Updated {updatedAt}.</p>
    </div>
  );
}
