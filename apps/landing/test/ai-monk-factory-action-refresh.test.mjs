import test from 'node:test';
import assert from 'node:assert/strict';

const { refreshFactoryActionStatus } = await import('../app/ai-monk-factory/action-readiness.mjs');

test('a failed status refresh after an accepted action is kept separate from the action result', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => { throw new Error('private refresh detail'); },
    'generate_avatar',
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
    'generate_avatar',
    () => notices.push('unexpected'),
    () => notices.push('action succeeded'),
  );

  assert.equal(refreshed, true);
  assert.deepEqual(notices, ['action succeeded']);
});

test('autopost is not announced on when a successful GET still reports it off', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => ({ account: { auto_post: false, auto_post_intent: false } }),
    'autopost',
    () => notices.push('status unconfirmed'),
    () => notices.push('daily posting on'),
  );

  assert.equal(refreshed, false);
  assert.deepEqual(notices, ['status unconfirmed']);
});

test('stop is not announced off while the API still reports an active autopost intent', async () => {
  const notices = [];
  const refreshed = await refreshFactoryActionStatus(
    async () => ({ account: { auto_post: false, auto_post_intent: true } }),
    'stop',
    () => notices.push('status unconfirmed'),
    () => notices.push('daily posting off'),
  );

  assert.equal(refreshed, false);
  assert.deepEqual(notices, ['status unconfirmed']);
});

test('matching autopost and stop snapshots allow explicit status notices', async () => {
  for (const [action, account, expected] of [
    ['autopost', { auto_post: true, auto_post_intent: true, auto_post_paused: false }, 'daily posting on'],
    ['stop', { auto_post: false, auto_post_intent: false, auto_post_paused: false }, 'daily posting off'],
  ]) {
    const notices = [];
    const refreshed = await refreshFactoryActionStatus(
      async () => ({ account }),
      action,
      () => notices.push('status unconfirmed'),
      () => notices.push(expected),
    );

    assert.equal(refreshed, true);
    assert.deepEqual(notices, [expected]);
  }
});

test('pause and resume notices require the saved automation flags to match', async () => {
  for (const [action, account] of [
    ['pause', { auto_post: false, auto_post_intent: true, auto_post_paused: true }],
    ['resume', { auto_post: true, auto_post_intent: true, auto_post_paused: false }],
  ]) {
    const notices = [];
    const refreshed = await refreshFactoryActionStatus(async () => ({ account }), action,
      () => notices.push('status unconfirmed'), () => notices.push(`${action} confirmed`));
    assert.equal(refreshed, true);
    assert.deepEqual(notices, [`${action} confirmed`]);
  }

  for (const [action, account] of [
    ['pause', { auto_post: false, auto_post_intent: false, auto_post_paused: false }],
    ['resume', { auto_post: false, auto_post_intent: true, auto_post_paused: true }],
  ]) {
    const notices = [];
    const refreshed = await refreshFactoryActionStatus(async () => ({ account }), action,
      () => notices.push('status unconfirmed'), () => notices.push(`${action} confirmed`));
    assert.equal(refreshed, false);
    assert.deepEqual(notices, ['status unconfirmed']);
  }
});
