import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/open/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../public/open/data.json', import.meta.url), 'utf8'));

test('shows recorded team activity without treating unobserved work as zero completed tasks', async () => {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
    return elements.get(id);
  } };
  data.by_agent = [{ agent: 'Muse', board_updates_today: 2, surfaces: 'Dashboard', status: 'Observed' },
                   { agent: 'Dots', board_updates_today: 0, surfaces: 'No new action observed', status: 'Not observed' }];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { document, fetch: async () => ({ json: async () => data }), Date, URLSearchParams });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(html, /id="team-activity"/);
  const rendered = elements.get('team-activity').innerHTML;
  assert.match(rendered, /Muse/);
  assert.match(rendered, /Dashboard/);
  assert.match(rendered, /No new action observed/);
  assert.doesNotMatch(rendered, /0 tasks completed/);
});
