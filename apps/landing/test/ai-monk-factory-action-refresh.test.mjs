import test from 'node:test';
import assert from 'node:assert/strict';

const { refreshFactoryActionStatus } = await import('../app/ai-monk-factory/action-readiness.mjs');

test('a failed status refresh after an accepted action is kept separate from the action result', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => { throw new Error('private refresh detail'); },
    () => notices.push('action accepted; latest status not confirmed'),
    () => notices.push('action succeeded'),
  );

  assert.equal(refreshed, false);
  assert.deepEqual(notices, ['action accepted; latest status not confirmed']);
});

test('success is announced only after the status refresh succeeds', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => ({ ready: true }),
    () => notices.push('unexpected'),
    () => notices.push('action succeeded'),
  );

  assert.equal(refreshed, true);
  assert.deepEqual(notices, ['action succeeded']);
});
