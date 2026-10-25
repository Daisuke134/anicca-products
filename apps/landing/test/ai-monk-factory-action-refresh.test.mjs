import test from 'node:test';
import assert from 'node:assert/strict';

const { refreshFactoryActionStatus } = await import('../app/ai-monk-factory/action-readiness.mjs');

test('a failed status refresh after an accepted action is kept separate from the action result', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => { throw new Error('private refresh detail'); },
    () => notices.push('action accepted; latest status not confirmed'),
  );

  assert.equal(refreshed, false);
  assert.deepEqual(notices, ['action accepted; latest status not confirmed']);
});

test('a successful status refresh does not report a readback failure', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(async () => ({ ready: true }), () => notices.push('unexpected'));

  assert.equal(refreshed, true);
  assert.deepEqual(notices, []);
});
