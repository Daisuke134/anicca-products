import * as z from 'zod/v4';
import { filterAiMonkAccounts, rankAiMonkAccounts, getAiMonkAvatarAccounts } from './ai-monk-directory.mjs';
import { database, snapshotSha256 } from './snapshot.mjs';

const directoryAccounts = getAiMonkAvatarAccounts(database.accounts);

export const searchSchema = z.strictObject({
  query: z.string().max(500).optional(),
  status: z.enum(['all', 'confirmed', 'reported', 'unverified', 'unknown']).default('all'),
  language: z.string().min(1).max(200).default('all'),
  platform: z.enum(['all', 'Instagram', 'TikTok', 'YouTube', 'unknown']).default('all'),
  region: z.string().min(1).max(200).default('all'),
  sort: z.enum(['audience', 'views', 'revenue', 'directory']).default('audience'),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(10),
});

const metadata = {
  schema_version: database.schema_version,
  updated_at: database.updated_at,
  snapshot_sha256: snapshotSha256,
  source_url: 'https://aniccaai.com/data/ai-monk-avatar-database-2026.json',
  scope: database.scope,
  research_archive_records: database.accounts.length,
  excluded_from_directory: database.accounts.length - directoryAccounts.length,
  license: database.license,
  license_url: database.license_url,
  methodology: database.methodology,
  views_order: 'Largest observed view count among sampled videos on the selected platform, not channel totals or recent-period reach. See each sample date and source.',
  revenue_order: 'Latest reported three-month USD gross-revenue observation, descending. Other currencies, periods, profit, buyout offers, seller counters and prices are excluded. Missing values sort last; claims are not audited sales.',
  audience_order: 'Latest numeric followers/subscribers per platform; largest single audience when platform=all. Audiences are not added. Views and revenue claims are not audience counts. See each snapshot for date, source and rounding.',
};

function sourcesFor(records) {
  const ids = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'source_id' && typeof item === 'string') ids.add(item);
      else if (key === 'source_ids' && Array.isArray(item)) item.forEach(id => ids.add(id));
      else visit(item);
    }
  }
  records.forEach(visit);
  return database.sources.filter(source => ids.has(source.id));
}

export function searchAccounts(options = {}) {
  const filters = searchSchema.parse(options);
  const filtered = filterAiMonkAccounts(directoryAccounts, filters);
  const ordered = filters.sort === 'directory' ? filtered : rankAiMonkAccounts(filtered, filters.platform, filters.sort);
  const accounts = ordered.slice(filters.offset, filters.offset + filters.limit);
  return {
    metadata,
    filters,
    total: ordered.length,
    next_offset: filters.offset + accounts.length < ordered.length ? filters.offset + accounts.length : null,
    accounts,
    sources: sourcesFor(accounts),
  };
}

export function getAccount(id) {
  const account = directoryAccounts.find(record => record.id === id);
  if (!account) throw new Error(`Unknown account: ${id}`);
  return { metadata, account, sources: sourcesFor([account]) };
}

export function getStats() {
  const ai_status = { confirmed: 0, reported: 0, unverified: 0 };
  for (const account of directoryAccounts) {
    const status = account.ai_status ?? 'unknown';
    ai_status[status] = (ai_status[status] ?? 0) + 1;
  }
  return { metadata, records: directoryAccounts.length, sources: database.sources.length, ai_status };
}

const latestViews = sample => {
  const m = (sample.metrics ?? []).filter(x => x.metric === 'views' && Number.isFinite(x.value));
  return m.length ? m.sort((a, b) => String(b.as_of).localeCompare(String(a.as_of)))[0].value : (Number.isFinite(sample.views) ? sample.views : null);
};

export const topFormatsSchema = z.strictObject({
  limit: z.number().int().min(1).max(50).default(10),
  account_id: z.string().min(1).max(200).optional(),
});

/** Observed video samples (formats, hooks, structure) ranked by latest public view count. */
export function getTopFormats(options = {}) {
  const { limit, account_id } = topFormatsSchema.parse(options);
  const samples = [];
  for (const a of directoryAccounts) {
    if (account_id && a.id !== account_id) continue;
    for (const s of a.creative_samples ?? []) samples.push({ account_id: a.id, display_name: a.display_name, ai_status: a.ai_status, directory_scope: a.directory_scope, latest_views: latestViews(s), ...s });
  }
  samples.sort((x, y) => (y.latest_views ?? -1) - (x.latest_views ?? -1));
  const out = samples.slice(0, limit);
  return { metadata, total_samples: samples.length, note: 'Views are dated public observations of sampled videos, not channel totals. structure_summary describes the format/hook/script pattern observed.', samples: out, sources: sourcesFor(directoryAccounts.filter(a => out.some(s => s.account_id === a.id))) };
}

export const monetizeSchema = z.strictObject({ account_id: z.string().min(1).max(200).optional() });

/** How AI monk accounts monetize: offers and prices, seller counters, creator revenue claims, revenue observations. */
export function getMonetization(options = {}) {
  const { account_id } = monetizeSchema.parse(options);
  const accounts = directoryAccounts
    .filter(a => (!account_id || a.id === account_id) && ((a.offers ?? []).length || (a.creator_claims ?? []).length || (a.revenue_observations ?? []).length || (a.seller_counters ?? []).length))
    .map(a => ({ account_id: a.id, display_name: a.display_name, ai_status: a.ai_status, directory_scope: a.directory_scope, offers: a.offers ?? [], seller_counters: a.seller_counters ?? [], creator_claims: a.creator_claims ?? [], revenue_observations: a.revenue_observations ?? [] }));
  const offerTypes = {};
  for (const a of accounts) for (const o of a.offers) offerTypes[o.type] = (offerTypes[o.type] ?? 0) + 1;
  return { metadata, note: 'Prices are displayed prices, not orders. Creator claims and seller counters are unaudited and are kept separate.', offer_type_counts: offerTypes, accounts, sources: sourcesFor(accounts.map(x => directoryAccounts.find(a => a.id === x.account_id))) };
}
