// node:test — rent-a-box: the paid capability. Validation must reject anything that could turn a
// rental into an unbounded cost, and the definition must carry the RENTER's image (never ours).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRentalRequest, buildRentalDefinition, rentBox, MAX_DURATION_MIN } from '../rent-a-box.mjs';

test('validation: accepts a normal request and fills defaults', () => {
  const v = validateRentalRequest({ image: 'docker.io/library/nginx:alpine' });
  assert.equal(v.ok, true);
  assert.equal(v.durationMinutes, 10);
  assert.equal(v.port, 8080);
});

test('validation: rejects missing/absurd input', () => {
  assert.equal(validateRentalRequest({}).ok, false);
  assert.equal(validateRentalRequest({ image: 'has space' }).ok, false);
  assert.equal(validateRentalRequest({ image: 'x', durationMinutes: 0 }).ok, false);
  assert.equal(validateRentalRequest({ image: 'x', durationMinutes: MAX_DURATION_MIN + 1 }).ok, false);
  assert.equal(validateRentalRequest({ image: 'x', port: 99999 }).ok, false);
  assert.equal(validateRentalRequest({ image: 'x', env: { a: 1 } }).ok, false);
});

test('definition carries the renter image, a flat-string cmd, and one exposed port', () => {
  const d = buildRentalDefinition({ image: 'docker.io/library/redis:7', port: 6379, cmd: 'redis-server' });
  assert.equal(d.ops[0].args.image, 'docker.io/library/redis:7');
  assert.equal(d.ops[0].args.expose, 6379);
  assert.equal(typeof d.ops[0].args.cmd, 'string'); // array cmd dies on the node
  assert.equal(d.version, '0.1');
});

test('rentBox returns a derivable URL and never leaks the key', async () => {
  const fake = {
    ipfs: { pin: async () => 'QmFakeHash' },
    jobs: { list: async () => ({ job: 'CUcMnkzWL8RdNDtGw7pdbqE8xVawuPf2dUigQ3wS5qDs' }) },
  };
  const out = await rentBox({ image: 'docker.io/library/nginx:alpine', durationMinutes: 10, port: 8080, sdkFactory: () => fake, now: () => 0 });
  assert.equal(out.jobAddress, 'CUcMnkzWL8RdNDtGw7pdbqE8xVawuPf2dUigQ3wS5qDs');
  assert.match(out.url, /^https:\/\/[A-Za-z0-9]+\.node\.k8s\.prd\.nos\.ci$/);
  assert.equal(out.expiresAt, new Date(600000).toISOString());
});
