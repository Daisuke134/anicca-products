import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const readiness = await import('../app/ai-monk-factory/action-readiness.mjs');
const { FactoryActionNotice } = await import('../app/ai-monk-factory/factory-action-notice.mjs');

test('a blocked CTA renders its reason as an inline status beside that action', () => {
  const notice = { action: 'generate_video', message: 'Generation is not configured. No request was sent.' };
  const html = renderToStaticMarkup(React.createElement(FactoryActionNotice, { notice, action: 'generate_video' }));

  assert.match(html, /class="mf-action-notice"/);
  assert.match(html, /role="status"/);
  assert.match(html, /Generation is not configured\. No request was sent\./);
  assert.equal(renderToStaticMarkup(React.createElement(FactoryActionNotice, { notice, action: 'connect_instagram' })), '');
});

test('a blocked generation CTA explains the blocker without sending an API action', () => {
  assert.equal(typeof readiness.requestFactoryAction, 'function', 'readiness action gate is implemented');

  let sent = 0;
  const notices = [];
  const result = readiness.requestFactoryAction(
    'generate_avatar',
    { generation: { ready: false, reason: 'studio_setup' } },
    false,
    () => { sent += 1; },
    message => notices.push(message),
  );

  assert.equal(result, false);
  assert.equal(sent, 0);
  assert.match(notices[0], /studio is not enabled yet/i);
  assert.match(notices[0], /No request was sent/i);
});

test('a ready generation CTA dispatches once', () => {
  const actions = [];
  const notices = [];
  const result = readiness.requestFactoryAction(
    'generate_avatar',
    { generation: { ready: true } },
    false,
    action => actions.push(action),
    message => notices.push(message),
    { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 3 },
  );

  assert.equal(result, true);
  assert.deepEqual(actions, ['generate_avatar']);
  assert.deepEqual(notices, []);
});

test('a blocked video CTA identifies the missing avatar before dispatch', () => {
  let sent = 0;
  const notices = [];

  const result = readiness.requestFactoryAction(
    'generate_video',
    { generation: { ready: true } },
    false,
    () => { sent += 1; },
    message => notices.push(message),
    { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 3 },
  );

  assert.equal(result, false);
  assert.equal(sent, 0);
  assert.match(notices[0], /create your monk first/i);
});

test('Stop remains actionable when generation readiness is false', () => {
  let sent = 0;
  const notices = [];

  const result = readiness.requestFactoryAction(
    'stop',
    { generation: { ready: false, reason: 'studio_setup' } },
    false,
    action => { assert.equal(action, 'stop'); sent += 1; },
    message => notices.push(message),
  );

  assert.equal(result, true);
  assert.equal(sent, 1);
  assert.deepEqual(notices, []);
});

test('unknown quota is not classified as exhausted', () => {
  assert.equal(typeof readiness.factoryQuotaState, 'function', 'quota state distinguishes unknown from exhausted');

  assert.deepEqual(readiness.factoryQuotaState({ videosRemaining: null, attemptsRemaining: null }), {
    known: false, available: false, exhausted: false,
  });
  assert.deepEqual(readiness.factoryQuotaState({ videosRemaining: 0, attemptsRemaining: 0 }), {
    known: true, available: false, exhausted: true,
  });
});

test('Instagram connection and autopost require both social and generation readiness', () => {
  for (const action of ['connect_instagram', 'autopost']) {
    let sent = 0;
    const notices = [];
    const result = readiness.requestFactoryAction(
      action,
      { social: { ready: true }, generation: { ready: false, reason: 'provider_setup' } },
      true,
      () => { sent += 1; },
      message => notices.push(message),
      { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 3 },
    );

    assert.equal(result, false, `${action} must stay local until generation is ready`);
    assert.equal(sent, 0, `${action} must not send an API request`);
    assert.match(notices[0], /generation services are not ready yet/i);
    assert.match(notices[0], /No request was sent/i);
  }
});

test('Instagram OAuth follows the avatar and first completed video steps', () => {
  const actions = [];
  const notices = [];
  const perform = action => actions.push(action);
  const ready = { generation: { ready: true }, social: { ready: true } };
  assert.equal(readiness.requestFactoryAction('connect_instagram', ready, false, perform, message => notices.push(message), { hasAccess: true, quotaKnown: true }), false);
  assert.match(notices.pop(), /avatar first/i);
  assert.equal(readiness.requestFactoryAction('connect_instagram', ready, true, perform, message => notices.push(message), { hasAccess: true, quotaKnown: true }), false);
  assert.match(notices.pop(), /one full video first/i);
  assert.equal(readiness.requestFactoryAction('connect_instagram', ready, true, perform, message => notices.push(message), { completedVideoReady: true }), true);
  assert.deepEqual(actions, ['connect_instagram']);
});

test('unknown allowance never sends a generation request', () => {
  let sent = 0;
  const notices = [];
  const quota = readiness.factoryQuotaState({ videosRemaining: null, attemptsRemaining: null });

  const result = readiness.requestFactoryAction(
    'generate_avatar',
    { generation: { ready: true } },
    false,
    () => { sent += 1; },
    message => notices.push(message),
    { hasAccess: false, quotaKnown: quota.known, videosRemaining: null, attemptsRemaining: null },
  );

  assert.equal(result, false);
  assert.equal(sent, 0);
  assert.match(notices[0], /could not be confirmed/i);
  assert.match(notices[0], /No request was sent/i);
});

test('an exhausted free allowance blocks new generation actions without consuming quota', () => {
  let sent = 0;
  const notices = [];
  const result = readiness.requestFactoryAction(
    'generate_avatar',
    { generation: { ready: true } },
    false,
    () => { sent += 1; },
    message => notices.push(message),
    { hasAccess: false, quotaKnown: true, videosRemaining: 0, attemptsRemaining: 0 },
  );

  assert.equal(result, false);
  assert.equal(sent, 0);
  assert.match(notices[0], /used your three free videos/i);
});

test('an existing pending video request can still be recovered after quota exhaustion', () => {
  let sent = 0;
  const notices = [];
  const result = readiness.requestFactoryAction(
    'generate_video',
    { generation: { ready: true } },
    true,
    () => { sent += 1; },
    message => notices.push(message),
    { hasAccess: false, quotaKnown: true, videosRemaining: 0, attemptsRemaining: 0, pendingVideo: true },
  );

  assert.equal(result, true);
  assert.equal(sent, 1);
  assert.deepEqual(notices, []);
});
