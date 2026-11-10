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

const REQUIRED_GROK = [
  '参謀', 'Anicca Marketer', 'Fucker', 'dr eggbot', 'Forensic Writing', 'Muse Relay',
  'Muse（中継 bot）', 'Codex（中継 bot）', 'Dots（中継 bot）', 'Pause', 'Applications', 'Reporter', 'X Operator',
];
const REQUIRED_LEGACY = ['Codex CLI (Mac mini)', 'Muse VM', 'Reason Dots'];

test('live owners board keeps 16 owners, 92 loops, and unknown current tasks', () => {
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  assert.equal(data.owners.length, 16);
  assert.equal(data.loops.length, 92);
  const names = data.owners.map(owner => owner.owner);
  assert.ok(names.includes('X Operator'));
  assert.equal(names.filter(name => name === 'X Operator').length, 1);
  assert.equal(data.owners.at(-1).owner, 'Reason Dots');
  for (const owner of data.owners) {
    assert.equal(owner.current_task.text, 'unknown');
    assert.equal(owner.cadence.kind, 'schedule');
  }
});

test('team.json lists every known Grok bot and legacy Codex/Muse/Dots contacts', () => {
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  assert.ok(Array.isArray(data.owners), 'owners array present');
  const names = data.owners.map(o => o.owner);
  for (const name of REQUIRED_GROK) assert.ok(names.includes(name), `missing grok bot ${name}`);
  for (const name of REQUIRED_LEGACY) assert.ok(names.includes(name), `missing legacy ${name}`);
});

test('current tasks stay unknown; cadence is schedule; outcomes are labeled', () => {
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  for (const owner of data.owners) {
    assert.equal(owner.current_task.kind, 'unknown');
    assert.equal(owner.current_task.text, 'unknown');
    assert.equal(owner.cadence.kind, 'schedule');
    assert.ok(owner.task?.kind === 'assigned_lane');
    assert.ok(['observed', 'unknown'].includes(owner.latest_outcome.kind));
    assert.ok(owner.latest_outcome.freshness);
  }
  for (const name of REQUIRED_LEGACY) {
    const row = data.owners.find(o => o.owner === name);
    assert.equal(row.kind, 'legacy_contact');
    assert.equal(row.current_task.text, 'unknown');
  }
  for (const name of ['Muse（中継 bot）', 'Codex（中継 bot）', 'Dots（中継 bot）']) {
    const row = data.owners.find(o => o.owner === name);
    assert.equal(row.kind, 'legacy_standin');
    assert.equal(row.current_task.text, 'unknown');
  }
});

test('team page distinguishes schedule from observed work and renders owners', async () => {
  const html = readFileSync(teamHtmlPath, 'utf8');
  const data = JSON.parse(readFileSync(teamJsonPath, 'utf8'));
  assert.match(html, /cadence = schedule/);
  assert.match(html, /outcome = observed/);
  assert.match(html, /current task = unknown unless live/);
  assert.match(html, /id=owners/);
  assert.match(html, /Legacy board cards \(not live current-task claims\)/);

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
  const rendered = elements.get('owners').innerHTML;
  assert.match(rendered, /参謀/);
  assert.match(rendered, /Codex CLI \(Mac mini\)/);
  assert.match(rendered, /Muse VM/);
  assert.match(rendered, /Reason Dots/);
  assert.match(rendered, /schedule/);
  assert.match(rendered, /unknown/);
  assert.doesNotMatch(rendered, /invented/);
});

test('builder keeps unrelated loops/accounts and refuses invented current tasks', () => {
  const tmp = path.resolve(here, 'fixtures/team-owners-out.json');
  // Seed with loops so merge preserves them
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
});
