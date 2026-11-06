import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const teamJsonPath = path.resolve(here, '../../public/open/team/team.json');
const teamHtmlPath = path.resolve(here, '../../public/open/team/index.html');
const builderPath = path.resolve(here, 'build_team_owners.py');
const factsPath = path.resolve(here, 'open_team_facts.py');

const REQUIRED_GROK = [
  '参謀', 'Anicca Marketer', 'Fucker', 'dr eggbot', 'Forensic Writing', 'Muse Relay',
  'Muse（中継 bot）', 'Codex（中継 bot）', 'Dots（中継 bot）', 'Pause', 'Applications', 'Reporter', 'X Operator',
];
const REQUIRED_LEGACY = ['Codex CLI (Mac mini)', 'Muse VM', 'Reason Dots'];

test('public team.json is candid current_status from open_team_facts (not stale right_now)', () => {
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  assert.equal(data.schema, 'current_status');
  assert.ok(!Object.prototype.hasOwnProperty.call(data, 'right_now'));
  assert.equal((data.current_status || []).length, 15);
  assert.match(data.honesty || '', /No universal self-update writer/);
  const html = readFileSync(teamHtmlPath, 'utf8');
  assert.match(html, /current_status/);
  assert.match(html, /not “right now working”|not "right now working"|Current status/);
});

test('builder keeps unrelated loops/accounts and refuses invented current tasks', () => {
  const tmp = path.resolve(here, 'fixtures/team-owners-out.json');
  const seed = {
    built_at: 'seed',
    right_now: [],
    loops: [{ id: 1, loop: 'x', owner: '参謀', schedule: '3h', times: ['09:00'] }],
    accounts: [{ platform: 'X', account: '@diceai0', poster: '参謀', followers: 1, followers_7d: 0, posts_7d: 0, views_7d: 0, er_7d: 0, avg_views_last5: '未取得', last_post: 'unknown', winner: '未取得' }],
    seo: ['seed seo'],
  };
  mkdirSync(path.dirname(tmp), { recursive: true });
  writeFileSync(tmp, JSON.stringify(seed));
  const teamRoot = process.env.TEAM_ROOT || '/workspace/team';
  const run = spawnSync('python3', [builderPath, teamRoot, tmp], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const data = JSON.parse(readFileSync(tmp, 'utf8'));
  assert.equal(data.loops.length, 1);
  assert.equal(data.accounts.length, 1);
  assert.equal(data.seo[0], 'seed seo');
  assert.ok(data.owners.length >= 16);
  assert.ok(data.owners.every(o => o.current_task.text === 'unknown'));
  const names = data.owners.map(o => o.owner);
  for (const name of REQUIRED_GROK) assert.ok(names.includes(name), `missing grok bot ${name}`);
  for (const name of REQUIRED_LEGACY) assert.ok(names.includes(name), `missing legacy ${name}`);
});

test('open_team_facts generator writes fail-closed current_status', () => {
  const tmpDir = path.resolve(here, 'fixtures/team-facts-out');
  mkdirSync(tmpDir, { recursive: true });
  const run = spawnSync('python3', [factsPath, tmpDir], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const data = JSON.parse(readFileSync(path.join(tmpDir, 'team', 'team.json'), 'utf8'));
  assert.equal(data.schema, 'current_status');
  assert.ok(!Object.prototype.hasOwnProperty.call(data, 'right_now'));
  for (const loop of data.loops) assert.equal(loop.proof_of_run, false);
});

test('team page renders current_status freshness, not blocked-right-now claims', async () => {
  const html = readFileSync(teamHtmlPath, 'utf8');
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '' });
      return elements.get(id);
    },
  };
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, {
    document,
    fetch: async () => ({ ok: true, json: async () => data }),
  });
  await new Promise(r => setImmediate(r));
  const rendered = elements.get('r').innerHTML;
  assert.match(rendered, /参謀/);
  assert.match(rendered, /X Operator/);
  assert.doesNotMatch(html, /id=owners/);
});
