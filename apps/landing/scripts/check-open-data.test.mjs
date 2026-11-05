import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateOpenData } from './check-open-data.mjs';

test('requires usable Open dashboard data', () => {
  assert.doesNotThrow(() => validateOpenData('{"summary":{"platforms":[]},"kpis":[]}'));
  for (const input of ['', '<html>404</html>', '{}', '{"summary":{},"kpis":[]}']) {
    assert.throws(() => validateOpenData(input));
  }
});
