import test from 'node:test';
import assert from 'node:assert/strict';
import { getTopFormats, getMonetization } from '../dist/index.mjs';

test('top formats are view-ranked samples with sources', () => {
  const r = getTopFormats({ limit: 3 });
  assert.ok(r.total_samples > 0 && r.samples.length <= 3);
  assert.ok(r.samples[0].structure_summary && r.sources.length > 0);
  for (let i = 1; i < r.samples.length; i++) assert.ok((r.samples[i - 1].latest_views ?? -1) >= (r.samples[i].latest_views ?? -1));
});
test('monetization lists offers and keeps claims separate', () => {
  const r = getMonetization({ account_id: 'yang-mun' });
  assert.equal(r.accounts.length, 1);
  assert.ok(r.accounts[0].offers.length > 0 && r.accounts[0].creator_claims.length > 0);
  assert.throws(() => getMonetization({ bogus: 1 }));
});
