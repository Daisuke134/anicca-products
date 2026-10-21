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
    creator: { name: 'Shalev Hani' },
    platforms: [{ platform: 'Instagram', handle: 'yangmunus' }],
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
