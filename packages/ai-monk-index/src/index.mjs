import * as z from 'zod/v4';
import { filterAiMonkAccounts, rankAiMonkAccounts } from './ai-monk-directory.mjs';
import { database, snapshotSha256 } from './snapshot.mjs';

export const searchSchema = z.strictObject({
  query: z.string().max(500).optional(),
  status: z.enum(['all', 'confirmed', 'reported', 'unverified', 'unknown']).default('all'),
  language: z.string().min(1).max(200).default('all'),
  platform: z.enum(['all', 'Instagram', 'TikTok', 'YouTube', 'unknown']).default('all'),
  region: z.string().min(1).max(200).default('all'),
  sort: z.enum(['audience', 'directory']).default('audience'),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(10),
});

const metadata = {
  schema_version: database.schema_version,
  updated_at: database.updated_at,
  snapshot_sha256: snapshotSha256,
  source_url: 'https://aniccaai.com/data/ai-monk-avatar-database-2026.json',
  scope: database.scope,
  license: database.license,
  license_url: database.license_url,
  methodology: database.methodology,
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
  const filtered = filterAiMonkAccounts(database.accounts, filters);
  const ordered = filters.sort === 'audience' ? rankAiMonkAccounts(filtered, filters.platform) : filtered;
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
  const account = database.accounts.find(record => record.id === id);
  if (!account) throw new Error(`Unknown account: ${id}`);
  return { metadata, account, sources: sourcesFor([account]) };
}

export function getStats() {
  const ai_status = { confirmed: 0, reported: 0, unverified: 0 };
  for (const account of database.accounts) {
    const status = account.ai_status ?? 'unknown';
    ai_status[status] = (ai_status[status] ?? 0) + 1;
  }
  return { metadata, records: database.accounts.length, sources: database.sources.length, ai_status };
}
