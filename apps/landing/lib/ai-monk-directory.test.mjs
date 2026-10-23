import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAiMonkAccounts } from './ai-monk-directory.mjs';

const accounts = [
  {
    id: 'yang-mun',
    display_name: 'Yang Mun',
    ai_status: 'confirmed',
    languages: [{ label: 'English' }],
    region_evidence: { label: 'Israel', basis: 'creator location' },
    creator: { name: 'Shalev Hani', public_profile_url: 'https://x.com/shalevhvs' },
    platforms: [{ platform: 'Instagram', handle: 'yangmunus' }],
    offers: [{ name: 'Complete Collection with three eBooks', type: 'eBook bundle' }],
    creative_samples: [{ title: 'Words of Motivation from Yang Mun' }],
  },
  {
    id: 'monjechen',
    display_name: 'Yan Chen',
    ai_status: 'unverified',
    languages: [{ label: 'Spanish' }],
    region_evidence: null,
    creator: { name: null },
    platforms: [{ platform: 'Instagram', handle: 'monjechen' }],
  },
  {
    id: 'leo-chen',
    display_name: 'Leo Chen',
    ai_status: 'reported',
    languages: [],
    region_evidence: null,
    creator: { name: null },
    platforms: [{ platform: 'Instagram', handle: null }],
  },
];

test('search matches names, handles, creators, and languages case-insensitively', () => {
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'YANGMUNUS' }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'shalev hani' }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'shalevhvs' }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'complete collection' }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'words of motivation' }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'SPANISH' }).map((a) => a.id), ['monjechen']);
});

test('status, language, platform, and region filters combine with AND', () => {
  assert.deepEqual(filterAiMonkAccounts(accounts, {
    status: 'confirmed', language: 'English', platform: 'Instagram', region: 'Israel',
  }).map((a) => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(accounts, {
    status: 'confirmed', language: 'Spanish', platform: 'Instagram', region: 'Israel',
  }), []);
});

test('unknown language and region filters retain records with missing evidence', () => {
  assert.deepEqual(filterAiMonkAccounts(accounts, { language: 'unknown' }).map((a) => a.id), ['leo-chen']);
  assert.deepEqual(filterAiMonkAccounts(accounts, { region: 'unknown' }).map((a) => a.id), ['monjechen', 'leo-chen']);
});

test('no-match search returns an empty list without mutating the source data', () => {
  assert.deepEqual(filterAiMonkAccounts(accounts, { query: 'not-a-profile' }), []);
  assert.deepEqual(accounts.map((a) => a.id), ['yang-mun', 'monjechen', 'leo-chen']);
});

test('illustrated accounts stay outside the avatar directory for every search', () => {
  const records = [accounts[0], ...['kai-tsukimi', 'buddha-would-say'].map(id => ({
    id, display_name: id, ai_status: 'unverified',
    directory_scope: { status: 'excluded', reason: 'Illustrated storytelling' },
  }))];
  assert.deepEqual(filterAiMonkAccounts(records).map(a => a.id), ['yang-mun']);
  assert.deepEqual(filterAiMonkAccounts(records, { query: 'kai-tsukimi', status: 'unverified' }), []);
  assert.deepEqual(filterAiMonkAccounts(records, { query: 'buddha-would-say' }), []);
  assert.equal(records.length, 3);
});


test('audience ranking uses the latest follower snapshot on the selected platform, never views or sums', async () => {
  const { rankAiMonkAccounts } = await import('./ai-monk-directory.mjs');
  assert.equal(typeof rankAiMonkAccounts, 'function');
  const records = [
    { id: 'unknown', platforms: [{ platform: 'Instagram', snapshots: [{ metric: 'views', value: 999999999, as_of: '2026-10-22' }] }] },
    { id: 'large-youtube', platforms: [{ platform: 'Instagram', snapshots: [{ metric: 'followers', value: 10, as_of: '2026-10-22' }] }, { platform: 'YouTube', snapshots: [{ metric: 'subscribers', value: 1000, as_of: '2026-10-22' }] }] },
    { id: 'large-instagram', platforms: [{ platform: 'Instagram', snapshots: [{ metric: 'followers', value: 9000, as_of: '2026-10-01' }, { metric: 'followers', value: 100, as_of: '2026-10-22' }] }] },
    { id: 'known-zero', platforms: [{ platform: 'Instagram', snapshots: [{ metric: 'followers', value: 0, as_of: '2026-10-22' }] }] },
  ];
  assert.deepEqual(rankAiMonkAccounts(records, 'instagram').map(({ id }) => id), ['large-instagram', 'large-youtube', 'known-zero', 'unknown']);
  assert.deepEqual(rankAiMonkAccounts(records).map(({ id }) => id), ['large-youtube', 'large-instagram', 'known-zero', 'unknown']);
  assert.deepEqual(records.map(({ id }) => id), ['unknown', 'large-youtube', 'large-instagram', 'known-zero']);
});


test('video-view order compares sampled videos on the selected platform, not followers or channel totals', async () => {
  const { rankAiMonkAccounts, getAiMonkTopVideo } = await import('./ai-monk-directory.mjs');
  assert.equal(typeof getAiMonkTopVideo, 'function');
  const records = [
    { id: 'unknown', platforms: [{ platform: 'Instagram', snapshots: [{ metric: 'channel_views', value: 99999999 }] }] },
    { id: 'youtube', creative_samples: [{ url: 'https://www.youtube.com/shorts/a', views: 9000, views_captured_at: '2026-10-21' }] },
    { id: 'instagram', creative_samples: [{ url: 'https://www.instagram.com/reel/b/', views: 1000, views_captured_at: '2026-10-22' }] },
    { id: 'zero', creative_samples: [{ url: 'https://www.instagram.com/reel/c/', views: 0, views_captured_at: '2026-10-22' }] },
  ];
  assert.deepEqual(rankAiMonkAccounts(records, 'all', 'views').map(a => a.id), ['youtube', 'instagram', 'zero', 'unknown']);
  assert.deepEqual(rankAiMonkAccounts(records, 'Instagram', 'views').map(a => a.id), ['instagram', 'zero', 'unknown', 'youtube']);
  assert.equal(getAiMonkTopVideo(records[1], 'Instagram'), null);
});

test('revenue order uses only source-linked three-month USD gross revenue and keeps unknowns after real zero', async () => {
  const { rankAiMonkAccounts, getAiMonkRevenue } = await import('./ai-monk-directory.mjs');
  assert.equal(typeof getAiMonkRevenue, 'function');
  const observation = { metric: 'gross_revenue', currency: 'USD', period_months: 3, as_of: '2026-01-28', source_id: 'claim', status: 'creator_reported', comparison: 'greater_than' };
  const records = [
    { id: 'unknown', offers: [{ price: 999999 }], seller_counters: [{ value: 1000000 }] },
    { id: 'profit', revenue_observations: [{ ...observation, metric: 'profit', amount: 9999999 }] },
    { id: 'monthly', revenue_observations: [{ ...observation, period_months: 1, amount: 9999999 }] },
    { id: 'other-currency', revenue_observations: [{ ...observation, currency: 'JPY', amount: 9999999 }] },
    { id: 'revenue', revenue_observations: [{ ...observation, amount: 213000 }, { ...observation, amount: 100000, as_of: '2025-10-01' }] },
    { id: 'zero', revenue_observations: [{ ...observation, amount: 0, comparison: 'exact' }] },
    { id: 'invalid', revenue_observations: [{ ...observation, amount: NaN }] },
  ];
  assert.deepEqual(rankAiMonkAccounts(records, 'all', 'revenue').map(a => a.id), ['revenue', 'zero', 'unknown', 'profit', 'monthly', 'other-currency', 'invalid']);
  assert.equal(getAiMonkRevenue(records[4]).amount, 213000);
  assert.equal(getAiMonkRevenue(records[0]), null);
});
