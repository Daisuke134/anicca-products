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

test('unready action capabilities disable their CTAs while Stop remains available', () => {
  assert.equal(typeof readiness.factoryActionReady, 'function', 'buttons share the action readiness contract');

  const unavailable = {
    generation: { ready: false, reason: 'studio_setup' },
    social: { ready: false, reason: 'social_setup' },
    checkout: { ready: false, reason: 'billing_setup' },
  };
  for (const action of ['generate_avatar', 'generate_video', 'connect_instagram', 'autopost', 'checkout']) {
    assert.equal(readiness.factoryActionReady(action, unavailable), false, `${action} must be disabled`);
  }
  assert.equal(readiness.factoryActionReady('stop', unavailable), true, 'Stop remains available');

  const available = {
    generation: { ready: true },
    social: { ready: true },
    checkout: { ready: true },
  };
  for (const action of ['generate_avatar', 'generate_video', 'connect_instagram', 'autopost', 'checkout']) {
    assert.equal(readiness.factoryActionReady(action, available), true, `${action} is enabled when ready`);
  }
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
    { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 6 },
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
    { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 6 },
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
    known: false, available: false, exhausted: false, attemptsExhausted: false,
  });
  assert.deepEqual(readiness.factoryQuotaState({ videosRemaining: 0, attemptsRemaining: 0 }), {
    known: true, available: false, exhausted: true, attemptsExhausted: true,
  });
  assert.deepEqual(readiness.factoryQuotaState({ videosRemaining: 1, attemptsRemaining: 0, completedVideos: 2 }), {
    known: true, available: false, exhausted: false, attemptsExhausted: true,
  });
});

test('retry exhaustion does not claim all free videos were delivered or start Checkout', () => {
  let sent = 0;
  const notices = [];
  const result = readiness.requestFactoryAction(
    'checkout',
    { checkout: { ready: true } },
    true,
    () => { sent += 1; },
    message => notices.push(message),
    { quotaKnown: true, videosRemaining: 1, attemptsRemaining: 0, completedVideos: 2 },
  );

  assert.equal(result, false);
  assert.equal(sent, 0);
  assert.match(notices[0], /after 2 of 3 completed free videos/i);
  assert.match(notices[0], /No charge will start/i);
  assert.match(notices[0], /No request was sent/i);
});

test('Instagram connection and autopost need social readiness when finished videos are ready to publish', () => {
  for (const action of ['connect_instagram', 'autopost']) {
    let sent = 0;
    const notices = [];
    const result = readiness.requestFactoryAction(
      action,
      { social: { ready: true }, generation: { ready: false, reason: 'provider_setup' } },
      true,
      () => { sent += 1; },
      message => notices.push(message),
    { hasAccess: true, quotaKnown: true, videosRemaining: 3, attemptsRemaining: 6, completedVideoReady: true },
    );

    assert.equal(result, true, `${action} may proceed with completed videos when social is ready`);
    assert.equal(sent, 1, `${action} sends the social request`);
    assert.deepEqual(notices, []);
  }
});

test('autopost can publish an existing free video after quota exhaustion without generation readiness', () => {
  let sent = 0;
  const notices = [];
  const result = readiness.requestFactoryAction(
    'autopost',
    { social: { ready: true }, generation: { ready: false, reason: 'provider_setup' } },
    true,
    () => { sent += 1; },
    message => notices.push(message),
    { hasAccess: false, quotaKnown: true, videosRemaining: 0, attemptsRemaining: 0, postableVideoReady: true },
  );

  assert.equal(result, true);
  assert.equal(sent, 1);
  assert.deepEqual(notices, []);
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
  assert.match(notices[0], /all three completed free videos/i);
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

test('invalid Factory session tells the creator to sign in again instead of showing a generic error', () => {
  assert.equal(typeof readiness.factoryErrorMessage, 'function', 'Factory API errors map to safe user guidance');
  assert.equal(readiness.factoryErrorMessage({ code: 'invalid_session' }, {}), 'Please sign in again to continue.');
  assert.equal(readiness.factoryErrorMessage({ code: 'future_unknown_code' }, {}), 'This action could not finish. Refresh to check its status before trying again.');
});
