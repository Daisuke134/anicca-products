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
