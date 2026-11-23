// Synthetic-only contract suite. Run: node --test apps/api/tests-standalone/notificationSentEvidence.check.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureEvent, notificationSentEvent } from '../src/services/analytics/posthogCapture.js';

const valid = {
  profileId: 'profile-test-1', deliveryId: 'delivery-test-1', sendRowId: 'send-test-1',
  scheduledTime: '09:00', lang: 'en',
  decision: { backend: 'manager-v1', assigned_probability: 0.5, chosen: { kind: 'reflection' } },
  apnsResult: { ok: true, apnsId: 'apns-test-1' },
};

test('APNs acceptance is not device delivery or notification open', () => {
  const x = notificationSentEvent(valid);
  assert.equal(x.event, 'notification_sent');
  assert.equal(x.distinctId, valid.profileId);
  assert.equal(x.properties.nudge_id, valid.deliveryId);
  assert.equal(x.properties.delivery_id, valid.deliveryId);
  assert.equal(x.properties.send_row_id, valid.sendRowId);
  assert.equal(x.properties.variant, 'reflection');
  assert.equal(x.properties.local_hour, 9);
  assert.equal(x.properties.event_scope, 'APNS_PROVIDER_ACCEPTED');
  assert.equal(Object.hasOwn(x.properties, 'opened'), false);
  assert.equal(Object.hasOwn(x.properties, 'delivered_to_device'), false);
  assert.equal(Object.hasOwn(x.properties, 'device_token'), false);
  assert.equal(Object.hasOwn(x.properties, 'message_text'), false);
});

test('APNs rejection / unobserved acceptance is NOT a send', () => {
  for (const status of [undefined, null, { ok: false }, { apnsId: 'made-up' }]) {
    assert.equal(notificationSentEvent({ ...valid, apnsResult: status }), null);
  }
});

test('missing source identifiers are NOT_EVALUABLE, not zero evidence', () => {
  for (const key of ['profileId', 'deliveryId', 'sendRowId', 'scheduledTime']) {
    assert.equal(notificationSentEvent({ ...valid, [key]: null }), null);
  }
  assert.equal(notificationSentEvent({ ...valid, scheduledTime: '25:00' }), null);
  assert.equal(notificationSentEvent({ ...valid, scheduledTime: '9:00' }), null);
});

test('unobserved variant/assigned probability are null, not inferred', () => {
  const x = notificationSentEvent({ ...valid, decision: { backend: 'manager-v1', chosen: {} } });
  assert.equal(x.properties.variant, null);
  assert.equal(x.properties.assigned_probability, null);
});

test('missing PostHog project token emits no network request', async () => {
  const old = process.env.POSTHOG_API_KEY;
  delete process.env.POSTHOG_API_KEY;
  let calls = 0;
  try {
    assert.equal(await captureEvent({ ...notificationSentEvent(valid), fetchImpl: async () => { calls++; } }), false);
    assert.equal(calls, 0);
  } finally {
    if (old === undefined) delete process.env.POSTHOG_API_KEY;
    else process.env.POSTHOG_API_KEY = old;
  }
});

test('capture accepts a mocked PostHog HTTP success, not an ingestion claim', async () => {
  const old = process.env.POSTHOG_API_KEY;
  process.env.POSTHOG_API_KEY = 'phc_synthetic';
  let request;
  try {
    const ok = await captureEvent({
      ...notificationSentEvent(valid),
      fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, status: 200 }; },
    });
    assert.equal(ok, true);
    assert.match(request.url, /\/i\/v0\/e\/$/);
    const payload = JSON.parse(request.options.body);
    assert.equal(payload.event, 'notification_sent');
    assert.equal(payload.distinct_id, valid.profileId);
    assert.equal(payload.properties.nudge_id, valid.deliveryId);
    assert.equal(payload.properties.$process_person_profile, false);
    assert.equal(payload.properties.opened, undefined);
  } finally {
    if (old === undefined) delete process.env.POSTHOG_API_KEY;
    else process.env.POSTHOG_API_KEY = old;
  }
});

test('PostHog network failure, non-2xx and absent event fail closed', async () => {
  const old = process.env.POSTHOG_API_KEY;
  process.env.POSTHOG_API_KEY = 'phc_synthetic';
  try {
    assert.equal(await captureEvent({ ...notificationSentEvent(valid), fetchImpl: async () => { throw Error('offline'); } }), false);
    assert.equal(await captureEvent({ ...notificationSentEvent(valid), fetchImpl: async () => ({ ok: false, status: 402 }) }), false);
    assert.equal(await captureEvent({ event: 'notification_sent', distinctId: '', properties: {}, fetchImpl: async () => ({ ok: true }) }), false);
  } finally {
    if (old === undefined) delete process.env.POSTHOG_API_KEY;
    else process.env.POSTHOG_API_KEY = old;
  }
});
