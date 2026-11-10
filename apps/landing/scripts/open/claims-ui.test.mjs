import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/open/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

async function render(metrics, claims) {
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', style: {} });
    return nodes.get(id);
  } };
  const context = vm.createContext({
    document,
    fetch: async (url) => {
      const name = String(url).split('?')[0].split('/').at(-1);
      if (name === 'claims-snapshot.json') {
        if (claims === null) return { ok: false, json: async () => ({}) };
        return { ok: true, json: async () => claims };
      }
      return { ok: true, json: async () => metrics };
    },
    Date,
    setInterval: () => 1,
  });
  const start = script.indexOf('const loadPortfolio=');
  const end = script.indexOf('\nloadPortfolio();');
  vm.runInContext(script.slice(0, script.indexOf('const loadData=')) + script.slice(start, end), context);
  await vm.runInContext('loadPortfolio()', context);
  return nodes;
}

test('absent claims snapshot stays unpublished, not zero success', async () => {
  const nodes = await render({}, null);
  assert.match(nodes.get('claims-snapshot')?.innerHTML || '', /Claims snapshot unavailable|not published yet|unknown/i);
});

test('blocked publish with quantity 0 is red and not treated as posted', async () => {
  const nodes = await render({ loops: [], metric_gaps: [], businesses: [] }, {
    generated_at: '2026-11-06T05:00:00Z',
    note: 'public snapshot not application permission',
    claim_api: 'local',
    tasks: [{
      task_id: 'x-15min-engine',
      title: 'X 15m engine',
      lease_state: 'open',
      owner: null,
      revision: 0,
      last_public_at: 'unknown',
      blocker_public: 'review card',
      quantity_done: 0,
      publish_blocked_zero: true,
    }],
    alerts: [{ kind: 'silent_failure', message: 'x-15min-engine last_public_at unknown', created_at: '2026-11-06T05:00:00Z' }],
  });
  const claims = nodes.get('claims-snapshot').innerHTML;
  assert.match(claims, /x-15min-engine/);
  assert.match(claims, /unknown/);
  assert.match(claims, /0 posted|yes \(0 posted\)/);
  assert.match(claims, /public snapshot not application permission/);
  assert.doesNotMatch(claims, /lease_token/);
  const silent = nodes.get('silent-failures').innerHTML;
  assert.match(silent, /last_public_at unknown/);
  assert.match(silent, /quantity_done=0|0 posted|blocked publish/i);
});
