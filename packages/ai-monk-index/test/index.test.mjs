import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { searchAccounts, getAccount, getStats } from '../dist/index.mjs';
import { filterAiMonkAccounts, rankAiMonkAccounts } from '../../../apps/landing/lib/ai-monk-directory.mjs';

const raw = await readFile(new URL('../../../apps/landing/public/data/ai-monk-avatar-database-2026.json', import.meta.url));
const canonical = JSON.parse(raw);
const cli = new URL('../dist/cli.mjs', import.meta.url);
const run = (...args) => spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' });

test('CLI search preserves source-linked Yang Mun evidence and snapshot identity', () => {
  const result = run('search', '--query', 'Yang Mun', '--language', 'English', '--limit', '1');
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.accounts[0].id, 'yang-mun');
  assert.equal(output.accounts[0].ai_status, 'reported');
  assert.ok(output.accounts[0].identity_conflicts.length);
  assert.ok(output.sources.some(source => source.id === 'heygen-yangmun-case'));
  assert.equal(output.metadata.snapshot_sha256, createHash('sha256').update(raw).digest('hex'));
  assert.equal(output.metadata.scope, canonical.scope);
  assert.equal(result.stderr, '');
});

test('filters and audience order match the published Web helper; pages cover the same results', () => {
  const filters = { language: 'English', platform: 'Instagram', status: 'all' };
  const expected = rankAiMonkAccounts(filterAiMonkAccounts(canonical.accounts, filters), filters.platform);
  const first = searchAccounts({ ...filters, limit: 2 });
  const rest = searchAccounts({ ...filters, offset: 2, limit: 50 });
  assert.equal(first.total, expected.length);
  assert.deepEqual([...first.accounts, ...rest.accounts].map(a => a.id), expected.map(a => a.id));
  assert.equal(first.next_offset, expected.length > 2 ? 2 : null);
  assert.match(first.metadata.audience_order, /not added/);
});

test('get keeps the complete canonical record, unknown language, and provenance', () => {
  const output = getAccount('leo-chen');
  assert.deepEqual(output.account, canonical.accounts.find(a => a.id === 'leo-chen'));
  assert.deepEqual(output.account.languages, []);
  assert.ok(output.sources.some(s => s.id === 'maldita-2026-07-10'));
  assert.throws(() => getAccount('missing-monk'), /Unknown account/);
});

test('stats counts records and statuses without converting leads into confirmed avatars', () => {
  const stats = getStats();
  assert.equal(stats.records, canonical.accounts.filter(a => a.directory_scope?.status === 'included').length);
  assert.equal(stats.sources, canonical.sources.length);
  assert.equal(stats.ai_status.confirmed ?? 0, 0);
  assert.equal(Object.values(stats.ai_status).reduce((sum, n) => sum + n, 0), stats.records);
});

test('invalid CLI input fails without returning plausible research results', () => {
  for (const args of [
    ['search', '--limit', '0'], ['search', '--limit', '51'], ['search', '--offset', '-1'],
    ['search', '--sort', 'unsupported-sort'], ['search', '--status', 'fake'], ['search', '--typo', 'x'],
    ['get'], ['get', 'missing-monk'], ['stats', '--query', 'ignored'], ['search', 'unexpected'],
  ]) {
    const result = run(...args);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.equal(result.stdout, '', args.join(' '));
    assert.ok(result.stderr.length, args.join(' '));
  }
});

test('CLI and MCP data omit pending leads and illustrations while retaining the research archive', () => {
  const first = searchAccounts({ limit: 50 });
  const second = searchAccounts({ offset: 50, limit: 50 });
  assert.equal(canonical.accounts.length, 75);
  assert.equal(first.total, 4);
  assert.equal(first.accounts.length + second.accounts.length, 4);
  for (const id of ['kai-tsukimi', 'buddha-would-say', 'master-kaizen-tiktok', 'sifuchen-california', 'lead-instagram-lotusfamily1']) {
    assert.ok(canonical.accounts.some(a => a.id === id));
    assert.equal(searchAccounts({ query: id }).total, 0);
    assert.throws(() => getAccount(id), /Unknown account/);
    const cliResult = run('search', '--query', id);
    assert.equal(cliResult.status, 0, cliResult.stderr);
    assert.equal(JSON.parse(cliResult.stdout).total, 0);
  }
  assert.equal(getStats().records, 4);
  assert.equal(getStats().metadata.research_archive_records, 75);
  assert.equal(getStats().metadata.excluded_from_directory, 71);
});


test('business sorts are available to CLI and MCP searches with period and source retained', () => {
  for (const sort of ['views', 'revenue']) {
    const result = run('search', '--sort', sort, '--limit', '1');
    assert.equal(result.status, 0, result.stderr);
    const page = JSON.parse(result.stdout);
    assert.equal(page.accounts[0].id, 'yang-mun');
    assert.equal(page.filters.sort, sort);
  }
  const report = getAccount('yang-mun').account.revenue_observations[0];
  assert.equal(report.amount, 213000);
  assert.equal(report.period_months, 3);
  assert.equal(report.metric, 'gross_revenue');
  assert.equal(report.source_id, 'virtual-humans-yangmun-profile');
});
