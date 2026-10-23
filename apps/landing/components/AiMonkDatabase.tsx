'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Search } from 'lucide-react';
import {
  filterAiMonkAccounts,
  rankAiMonkAccounts,
  type AiMonkAccount,
  type AiMonkDirectoryFilters,
} from '@/lib/ai-monk-directory.mjs';

const ARTICLE_LINKS = [
  { href: '/the-art-of-ai-monks', label: 'The book · PDF + EPUB · $9.99' },
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
type EvidenceSource = { id: string; title: string; url?: string | null };

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

function ProfileAvatar({ account, src }: { account: AiMonkAccount; src?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = account.display_name.split(/[\s|]+/).filter(Boolean).slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase();
  return src && !failed ? (
    <img src={src} alt={`${account.display_name} profile image`} width={72} height={72} loading="lazy" onError={() => setFailed(true)} className="h-[72px] w-[72px] shrink-0 rounded-full bg-stone-100 object-cover" />
  ) : (
    <span role="img" aria-label={`${account.display_name} initials; profile image unavailable`} className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-2xl font-semibold text-amber-800">{initials}</span>
  );
}

function ProfileCard({ account, sourceById, imageSrc }: { account: AiMonkAccount; sourceById: Record<string, EvidenceSource>; imageSrc?: string }) {
  const languages = account.languages?.map(({ label }) => label) ?? [];
  const snapshots = (account.platforms ?? []).flatMap((platform) =>
    (platform.snapshots ?? []).map((snapshot) => ({ ...snapshot, platform: platform.platform }))
  );
  const audiences = (account.platforms ?? []).flatMap((platform) => {
    const latest = (platform.snapshots ?? [])
      .filter(({ metric, value }) => ['followers', 'subscribers'].includes(metric) && typeof value === 'number' && Number.isFinite(value) && value >= 0)
      .sort((a, b) => (Date.parse(b.as_of ?? '') || 0) - (Date.parse(a.as_of ?? '') || 0))[0];
    return latest ? [{ ...latest, platform: platform.platform }] : [];
  }).sort((a, b) => Number(b.value) - Number(a.value));
  const audience = audiences[0];
  const sources = [...new Set(account.source_urls ?? [])];
  const primaryPlatform = (account.platforms ?? []).find((platform) => platform.handle);

  return (
    <article id={account.id} className="flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-400">
      <div className="flex items-center gap-4">
        <ProfileAvatar account={account} src={imageSrc} />
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold leading-snug tracking-tight text-stone-950">{account.display_name}</h3>
          <p className="mt-1 break-all text-sm text-stone-500">{primaryPlatform?.handle ? `@${primaryPlatform.handle}` : 'Account not identified'}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-md border px-2 py-1 font-medium ${STATUS_STYLES[account.ai_status]}`}>AI: {STATUS_LABELS[account.ai_status]}</span>
        <span className="text-stone-500">{languages.length ? languages.join(', ') : 'Language unknown'}</span>
      </div>
      <div className="mt-5 border-t border-stone-100 pt-4">
        {audience ? <>
          <p className="text-2xl font-semibold tracking-tight text-stone-950">{audience.status?.includes('rounded') ? '≈' : ''}{metricValue(audience.value)} <span className="text-sm font-normal tracking-normal text-stone-500">{audience.metric}</span></p>
          <p className="mt-1 text-xs text-stone-500">{audience.platform} · {audience.as_of ?? 'Date unknown'}</p>
        </> : <p className="py-2 text-sm text-stone-500">Audience not checked</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
        {(account.platforms ?? []).map((platform, index) => platform.profile_url ? (
          <a key={`${platform.platform}-${index}`} href={platform.profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-amber-800">
            {platform.platform}<ArrowUpRight size={12} aria-hidden="true" />
          </a>
        ) : <span key={`${platform.platform}-${index}`} className="text-xs text-stone-400">{platform.platform} · unconfirmed</span>)}
      </div>
      <details className="group mt-5 border-t border-stone-100 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-stone-800 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700">
          View details <span className="text-lg transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-xs text-stone-500">Creator</dt><dd className="mt-1">{account.creator?.public_profile_url ? <a href={account.creator.public_profile_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{account.creator.name ?? 'Creator profile'} ↗</a> : account.creator?.name ?? 'Unknown'}</dd></div>
          <div><dt className="text-xs text-stone-500">Profile type</dt><dd className="mt-1">{account.persona_type}</dd></div>
          <div><dt className="text-xs text-stone-500">Region information</dt><dd className="mt-1">{account.region_evidence?.label ?? 'Unknown'}{account.region_evidence && <p className="mt-1 text-xs text-stone-500">{account.region_evidence.basis}</p>}</dd></div>
        </dl>
        {snapshots.length > 0 && <section className="mt-4" aria-label={`${account.display_name} dated public metrics`}>
          <p className="text-xs font-semibold text-stone-700">Public metrics</p>
          <ul className="mt-2 space-y-3">
            {snapshots.map((snapshot, index) => <li key={`${snapshot.metric}-${index}`} className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
              <strong className="text-sm text-stone-900">{snapshot.status?.includes('rounded') ? '≈' : ''}{metricValue(snapshot.value)}</strong> {snapshot.metric.replaceAll('_', ' ')}
              <span className="mt-1 block">{snapshot.as_of ?? 'Date unknown'} · {snapshot.platform}</span>
              <span className="block">{snapshot.status?.includes('rounded') ? 'Rounded provider snapshot' : snapshot.status?.includes('html_metadata') ? 'Public profile metadata' : 'Source snapshot'}</span>
              {sourceById[snapshot.source_id ?? '']?.url && <a className="mt-1 block underline underline-offset-2" href={sourceById[snapshot.source_id ?? ''].url!} target="_blank" rel="noopener noreferrer">Source: {sourceById[snapshot.source_id ?? ''].title}</a>}
            </li>)}
          </ul>
        </section>}
        {(account.offers ?? []).length > 0 && <section className="mt-4 rounded-lg bg-amber-50 p-3" aria-label={`${account.display_name} visible offers`}>
          <p className="text-xs font-semibold text-amber-900">Products · not sales data</p>
          <ul className="mt-2 space-y-2 text-sm">
            {(account.offers ?? []).map((offer, index) => <li key={index}>
              {offer.url ? <a href={offer.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{offer.name ?? offer.type} ↗</a> : offer.name ?? offer.type}
              <span className="mt-1 block text-xs text-stone-600">{typeof offer.price === 'number' ? `${offer.currency === 'USD' ? '$' : ''}${offer.price.toFixed(2)}${offer.currency && offer.currency !== 'USD' ? ` ${offer.currency}` : ''}` : 'Price unknown'}</span>
            </li>)}
          </ul>
        </section>}
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
    </article>
  );
}

export default function AiMonkDatabase({
  accounts,
  sources = [],
  sourceCount,
  updatedAt,
  profileImages = {},
}: {
  accounts: AiMonkAccount[];
  sources?: EvidenceSource[];
  sourceCount: number;
  updatedAt: string;
  profileImages?: Record<string, string>;
}) {
  const [filters, setFilters] = useState<AiMonkDirectoryFilters>({
    query: '', status: 'all', language: 'all', platform: 'all', region: 'all',
  });

  const [sortBy, setSortBy] = useState('audience');
  const sourceById = useMemo(() => Object.fromEntries(sources.map((source) => [source.id, source])), [sources]);

  const languages = useMemo(() => unique(accounts.flatMap((account) => account.languages?.map(({ label }) => label) ?? [])), [accounts]);
  const platforms = useMemo(() => unique(accounts.flatMap((account) => account.platforms?.map(({ platform }) => platform) ?? [])), [accounts]);
  const regions = useMemo(() => unique(accounts.flatMap((account) => account.region_evidence ? [account.region_evidence.label] : [])), [accounts]);
  const results = useMemo(() => {
    const matching = filterAiMonkAccounts(accounts, filters);
    return sortBy === 'audience' ? rankAiMonkAccounts(matching, filters.platform) : matching;
  }, [accounts, filters, sortBy]);
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
    <div className="mx-auto max-w-[1280px] px-5 pb-16 sm:px-8">
        <header className="pb-7 pt-4 sm:pt-8">
          <h1 id="directory-heading" className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">AI Monk Database</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">Find AI monk accounts. Compare followers, languages, creators, and products.</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500">
            <span><strong className="font-semibold text-stone-900">{accounts.length}</strong> profiles</span>
            <span><strong className="font-semibold text-stone-900">{researchedCount}</strong> researched</span>
            <span><strong className="font-semibold text-stone-900">{leadCount}</strong> unchecked</span>
            <span>Updated {updatedAt}</span>
          </div>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4" aria-label="Search and filter the directory">
          <label htmlFor="monk-search" className="sr-only">Search profiles, creators, languages, and platforms</label>
          <div className="flex items-center gap-3 rounded-xl px-3 sm:px-4">
            <Search className="shrink-0 text-[#7b6a3f]" size={21} aria-hidden="true" />
            <input
              id="monk-search"
              type="search"
              value={filters.query ?? ''}
              onChange={(event) => changeFilter('query', event.target.value)}
              placeholder="Search by name, account, or creator"
              className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-[#24251f] outline-none placeholder:text-[#918b7f] focus:ring-0 sm:text-lg"
            />
            <span className="hidden rounded-lg bg-[#f5f2eb] px-3 py-2 text-xs text-[#716a5d] sm:inline">{results.length} found</span>
          </div>
          <div className="mt-2 grid gap-2 border-t border-[#eeeae2] px-2 pt-3 grid-cols-2 lg:grid-cols-4 sm:px-3">
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
              <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#817a6e]">Region</span>
              <select aria-label="Filter by region evidence" value={filters.region} onChange={(event) => changeFilter('region', event.target.value)} className="w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2.5 text-sm text-[#34342d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ae8a32]">
                <option value="all">All regions</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}<option value="unknown">Region not confirmed</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="profiles-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="profiles-heading" className="text-lg font-semibold text-stone-950">{results.length} profiles</h2>
            <div className="flex flex-wrap items-center gap-3">
              {hasFilters && <button type="button" onClick={clearFilters} className="text-sm text-stone-600 underline underline-offset-4">Clear filters</button>}
              <label className="flex items-center gap-2 text-sm text-stone-500">
                Sort
                <select aria-label="Sort profiles" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="max-w-[210px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800">
                  <option value="audience">Most followers</option>
                  <option value="evidence">Research order</option>
                </select>
              </label>
            </div>
          </div>
          <p className="mb-5 text-xs leading-relaxed text-stone-500">Sorted by the largest single-platform follower or subscriber count. Counts are dated snapshots. AI status may be unverified.</p>
          <p className="sr-only" aria-live="polite">{results.length} profiles match the current search.</p>
          {results.length ? (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((account) => <ProfileCard key={account.id} account={account} sourceById={sourceById} imageSrc={profileImages[account.id]} />)}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#cfc8b8] bg-white/70 px-6 py-14 text-center">
              <p className="text-xl font-semibold text-[#303129]">No profiles found.</p>
              <p className="mt-2 text-sm text-[#716c61]">Try another name or clear the filters.</p>
              <button type="button" onClick={clearFilters} className="mt-5 rounded-full bg-[#282a24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#42443b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ae8a32]">Clear search</button>
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-6 border-t border-[#ded8ca] pt-8 md:grid-cols-[1fr_1.2fr]" aria-labelledby="about-index">
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8a733b]">Articles and book</p>
            <h2 id="about-index" className="text-2xl font-semibold tracking-[-0.035em]">Learn about AI monks.</h2>
            <div className="mt-4 flex flex-col items-start gap-2">
              {ARTICLE_LINKS.map((article) => <Link key={article.href} href={article.href} className="inline-flex items-center gap-1 text-sm font-medium text-[#6f5111] underline underline-offset-4 hover:text-[#372b0f]">{article.label} <BookOpen size={14} aria-hidden="true" /></Link>)}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-[#eae5d9] p-6 sm:p-7">
            <p className="text-lg font-semibold text-[#303129]">About the data</p>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[#5e5a50]">Based on {sourceCount} sources. AI status follows public disclosures and research. Reported profiles have supporting reports but unresolved identity questions. Unverified profiles need further checks. Profile images identify accounts; they do not confirm AI use. Initials appear when an image is unavailable.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/data/ai-monk-avatar-database-2026.json" className="inline-flex items-center gap-2 rounded-full bg-[#282a24] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#42443b]">Download JSON <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/Daisuke134/anicca-products/blob/main/apps/landing/public/data/ai-monk-avatar-database-2026.json" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#bcb5a7] px-4 py-2.5 text-sm font-semibold text-[#38382f] hover:bg-white">GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/Daisuke134/anicca-products/tree/main/packages/ai-monk-index" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#bcb5a7] px-4 py-2.5 text-sm font-semibold text-[#38382f] hover:bg-white">CLI &amp; MCP <ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/Daisuke134/anicca-products/issues/new?title=AI%20monk%20profile%20suggestion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#bcb5a7] px-4 py-2.5 text-sm font-semibold text-[#38382f] hover:bg-white">Suggest a profile <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
          </div>
        </section>
        <p className="mt-6 text-xs text-[#817a6e]">Anicca-authored summaries are shared under <a className="underline underline-offset-2" href="/data/ai-monk-avatar-database-license.md">CC BY 4.0</a>; the index code is under the <a className="underline underline-offset-2" href="https://github.com/Daisuke134/anicca-products/blob/main/apps/landing/AI-MONK-INDEX-LICENSE.md" target="_blank" rel="noopener noreferrer">MIT License</a>. Third-party names, marks, images, and linked media belong to their owners. <a className="underline underline-offset-2" href="/assets/ai-monk-profiles/profiles.json">Image sources</a>. Updated {updatedAt}.</p>
    </div>
  );
}
