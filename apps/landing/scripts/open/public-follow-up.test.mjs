import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/open/index.html', import.meta.url), 'utf8');
const fixture = JSON.parse(await readFile(new URL('./fixtures/public-follow-up.json', import.meta.url)));
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

async function render(feed) {
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', style: {} });
    return nodes.get(id);
  } };
  const context = vm.createContext({ document, fetch: async (url='') => {
    const href = String(url);
    if (href.includes('usage-snapshot.json')) {
      const body = feed && typeof feed === 'object' && 'usage_snapshot' in feed ? feed.usage_snapshot : (feed && feed.source === 'CheckSubscriptionUsage' ? feed : null);
      return { ok: !!body, json: async () => body };
    }
    if (href.includes('claims-snapshot.json')) {
      return { ok: false, json: async () => null };
    }
    return { ok: true, json: async () => feed };
  } });
  vm.runInContext(script.slice(0, script.indexOf('const loadData=')) + script.slice(script.indexOf('const loadPortfolio='), script.indexOf('\nloadPortfolio();')), context);
  await vm.runInContext('loadPortfolio()', context);
  return { nodes, context };
}

test('absent and empty optional targets and usage stay unpublished, not zero', async () => {
  for (const feed of [{}, { public_work: [], usage_snapshot: null }]) {
    const { nodes } = await render(feed);
    assert.match(nodes.get('public-work')?.innerHTML || '', /Shared targets are not published yet/);
    assert.match(nodes.get('usage-snapshot')?.innerHTML || '', /Usage snapshot is not published yet/);
    assert.doesNotMatch(nodes.get('usage-snapshot').innerHTML, /0%|Ultra/);
  }
});

test('six approved rows render only the seven public columns, preserving source text', async () => {
  const feed = structuredClone(fixture);
  feed.public_work[0].private_notes = 'EXTRA_FIELD_MUST_NOT_RENDER';
  const { nodes } = await render(feed);
  const output = nodes.get('public-work')?.innerHTML || '';
  assert.equal((output.match(/<th>/g) || []).length, 7);
  assert.equal((output.match(/<tr>/g) || []).length, 7);
  for (const row of fixture.public_work) for (const value of Object.values(row)) {
    if (value != null) assert.ok(output.includes(String(value)), `Missing public value: ${value}`);
  }
  assert.match(output, /unknown/);
  assert.doesNotMatch(output, /EXTRA_FIELD_MUST_NOT_RENDER|anicca-ops|\/Users\//);
});

test('unsafe personal rows and private cells are withheld; HTML is escaped', async () => {
  const { nodes } = await render({ public_work: [
    { owner: 'Public owner', action: '<img src=x onerror=alert(1)>', last_evidence_public: '/Users/example/private.txt', blocker_public: 'person@example.test' },
    { owner: 'Personal owner', action: 'LINE contacts' },
    { owner: 'Personal owner', action: 'R-1 comedy' },
    { owner: 'Personal owner', action: 'お笑い' },
    { owner: 'Public owner', action: 'credential token=secret' },
    { owner: 'Public owner', action: 'call +1 415 555 1212' },
  ] });
  const output = nodes.get('public-work')?.innerHTML || '';
  assert.match(output, /&lt;img/);
  assert.match(output, /unknown/);
  assert.doesNotMatch(output, /<img|\/Users\/|person@|LINE|R-1|comedy|お笑い|secret|415 555 1212/);
});

test('usage snapshot keeps measured timezone and reset separate from export and percent denominators', async () => {
  const { nodes } = await render(fixture);
  const output = nodes.get('usage-snapshot')?.innerHTML || '';
  for (const text of ['Ultra', 'CheckSubscriptionUsage', '2026-11-05T21:27:00-08:00', 'America/Los_Angeles', '2026-11-12T20:30:00-08:00', '10.6%', '10.4%', '89.4%', '39%', '21%', '10%', '6%', '参謀', 'dr eggbot', 'SNAPSHOT', 'UNAVAILABLE', 'Fixture arithmetic only', 'Michael Fenech']) assert.ok(output.includes(text), text);
  assert.match(output, /shared with other plan apps/);
  assert.match(output, /Grok Bot share of total usage/);
  assert.match(output, /Within Grok Bot/);
  assert.match(output, /Test fixture only/);
  assert.match(output, /Arithmetic remaining-time scenarios/);
  assert.match(output, /Token-detail adapters/);
  assert.doesNotMatch(output, /2026-11-06T05:27:00Z|(?<![0-9])9\.4%|live usage|(?<![0-9])100%/);
});

test('missing, invalid percentages and offset-free timestamps are unknown without reconstructing shares', async () => {
  const { nodes } = await render({ usage_snapshot: {
    measured_at: '2026-11-05 21:27', reset_at: 'invalid', weekly_usage_percent: null,
    grok_bot_share_percent: '', bots: [{ owner: 'Codex', percent: 101 }, { owner: '参謀', percent: -1 }],
  } });
  const output = nodes.get('usage-snapshot')?.innerHTML || '';
  assert.match(output, /unknown/);
  assert.doesNotMatch(output, /0%|101%|-1%|2026-11-05 21:27|invalid|Test fixture only/);
});

test('real published metrics remain unchanged and cannot imply the fixture is published', async () => {
  const url = new URL('../../public/open/metrics.json', import.meta.url);
  const before = await readFile(url, 'utf8');
  const parsed = JSON.parse(before);
  assert.equal((parsed.public_work || []).length, 29);
  assert.equal(parsed.usage_snapshot?.weekly_usage_percent, 21.1);
  const { nodes } = await render(parsed);
  assert.match(nodes.get('public-work')?.innerHTML || '', /priority/);
  assert.match(nodes.get('usage-snapshot')?.innerHTML || '', /21\.1%|21.1%/);
  assert.doesNotMatch(nodes.get('public-work')?.innerHTML || '', /Fixture arithmetic only|Michael Fenech/);
  assert.equal(await readFile(url, 'utf8'), before);
});

test('portfolio fetch failure clears previous targets and measured usage', async () => {
  const { nodes, context } = await render(fixture);
  context.fetch = async () => { throw Error('offline'); };
  await vm.runInContext('loadPortfolio()', context);
  for (const id of ['public-work', 'usage-snapshot']) {
    assert.match(nodes.get(id)?.innerHTML || '', /unavailable.*unknown/);
    assert.doesNotMatch(nodes.get(id).innerHTML, /10\.6%|X @diceai0/);
  }
});

test('existing public portfolio surfaces also withhold personal rows and private paths', async () => {
  const { nodes } = await render({
    loops: [{ loop: 'R-1 comedy', status: 'FAIL' }, { loop: 'Public job', host: '/workspace/private/bin/tool', status: 'FAIL' }],
    businesses: [{ name: 'LINE contacts' }], metric_gaps: [{ item: 'credential', why: 'secret' }], missing: ['person@example.test'],
  });
  const output = ['silent-failures', 'portfolio-loops', 'portfolio-businesses', 'portfolio-gaps'].map(id => nodes.get(id)?.innerHTML || '').join('');
  assert.doesNotMatch(output, /R-1|comedy|LINE|credential|secret|\/workspace\/|person@/);
});

test('company-todo sidecar fills a finance metrics file that has no public_work key', async () => {
  const sidecar = JSON.parse(await readFile(new URL('../../public/open/company-todo.json', import.meta.url), 'utf8'));
  assert.equal(sidecar.public_work.length, 29);
  assert.equal(sidecar.public_work.map(row => row.priority).includes(15), false);
  const finance = { businesses: [], loops: [], metric_gaps: [], agents: [] };
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', style: {} });
    return nodes.get(id);
  } };
  const context = vm.createContext({ document, fetch: async (url='') => {
    const href = String(url);
    if (href.includes('company-todo.json')) return { ok: true, json: async () => sidecar };
    if (href.includes('usage-snapshot.json') || href.includes('claims-snapshot.json')) return { ok: false, json: async () => null };
    return { ok: true, json: async () => finance };
  } });
  vm.runInContext(script.slice(0, script.indexOf('const loadData=')) + script.slice(script.indexOf('const loadPortfolio='), script.indexOf('\nloadPortfolio();')), context);
  await vm.runInContext('loadPortfolio()', context);
  const output = nodes.get('public-work')?.innerHTML || '';
  assert.match(output, /f585e9f599ddff304b20f7f090b238db3f2d5a1da30eaa12f258264134bc03a1/);
  assert.match(output, /a642df1374/);
  assert.equal(Object.hasOwn(finance, 'public_work'), false);
});

test('dedicated usage-snapshot.json wins over stale metrics usage_snapshot', async () => {
  const feed = structuredClone(fixture);
  feed.usage_snapshot = { ...feed.usage_snapshot, weekly_usage_percent: 1.1, fixture_only: true };
  const dedicated = { ...fixture.usage_snapshot, weekly_usage_percent: 10.6, source: 'CheckSubscriptionUsage' };
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', style: {} });
    return nodes.get(id);
  } };
  const context = vm.createContext({ document, fetch: async (url='') => {
    const href = String(url);
    if (href.includes('usage-snapshot.json')) return { ok: true, json: async () => dedicated };
    if (href.includes('claims-snapshot.json')) return { ok: false, json: async () => null };
    return { ok: true, json: async () => feed };
  } });
  vm.runInContext(script.slice(0, script.indexOf('const loadData=')) + script.slice(script.indexOf('const loadPortfolio='), script.indexOf('\nloadPortfolio();')), context);
  await vm.runInContext('loadPortfolio()', context);
  const output = nodes.get('usage-snapshot')?.innerHTML || '';
  assert.match(output, /10\.6%/);
  assert.doesNotMatch(output, /1\.1%/);
});
