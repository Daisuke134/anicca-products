import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/open/index.html', import.meta.url), 'utf8');

test('RevenueCat cards resolve provider summaries by their source measure name', () => {
  const match = html.match(/const rcSummary=(.*?);\s*const rcUnit=/s);
  assert.ok(match, 'Open page must define the RevenueCat summary resolver');

  const rcSummary = vm.runInNewContext(`(${match[1]})`);
  const rows = rcSummary({
    measures: [{ display_name: 'Actives' }],
    summary: {
      average: {
        Total: { Actives: 5 },
        'anicca (App Store)': { Actives: 5 },
      },
    },
  }, 'Active Subscriptions', 'average');

  assert.equal(JSON.stringify(rows), JSON.stringify([
    ['Total', 5],
    ['anicca (App Store)', 5],
  ]));
});
