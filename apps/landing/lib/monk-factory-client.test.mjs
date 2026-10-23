import { test } from 'node:test';
import assert from 'node:assert/strict';
import { factoryRequest, factoryDestination } from './monk-factory-client.mjs';

const occurrence = '00000000-0000-4000-8000-000000000001';
test('video retry carries the same occurrence and only the fixed action to the authenticated endpoint', async () => {
  const calls = [];
  const fetchImpl = async (...args) => { calls.push(args); return Response.json({ jobId: 'job-fixture' }, { status: 202 }); };
  for (let n = 0; n < 2; n++) assert.deepEqual(await factoryRequest('fixture-token', 'generate_video', { idempotencyKey: occurrence, fetchImpl }), { jobId: 'job-fixture' });
  assert.equal(calls.length, 2);
  for (const [url, init] of calls) {
    assert.equal(url, '/.netlify/functions/monk-factory');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Bearer fixture-token');
    assert.equal(init.headers['Idempotency-Key'], occurrence);
    assert.deepEqual(JSON.parse(init.body), { action: 'generate_video' });
    assert.equal(init.cache, 'no-store');
  }
});

test('missing auth or occurrence never sends a generation request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('should not send'); };
  await assert.rejects(factoryRequest('', 'generate_avatar', { fetchImpl }), { code: 'sign_in_required' });
  await assert.rejects(factoryRequest('fixture', 'generate_video', { fetchImpl }), { code: 'invalid_request' });
  assert.equal(calls, 0);
});

test('safe machine codes survive, provider bodies and network details do not', async () => {
  await assert.rejects(factoryRequest('fixture', undefined, { fetchImpl: async () => Response.json({ error: 'quota_exhausted', detail: 'private fixture' }, { status: 409 }) }), e => e.code === 'quota_exhausted' && !e.message.includes('private'));
  await assert.rejects(factoryRequest('fixture', undefined, { fetchImpl: async () => new Response('private provider fixture', { status: 503 }) }), e => e.code === 'factory_unavailable' && !e.message.includes('private'));
  await assert.rejects(factoryRequest('fixture', undefined, { fetchImpl: async () => { throw new Error('private transport fixture'); } }), e => e.code === 'connection_interrupted' && !e.message.includes('private'));
  await assert.rejects(factoryRequest('fixture', undefined, { fetchImpl: async () => Response.json('unexpected') }), { code: 'factory_unavailable' });
});

test('dashboard uses GET and cancellation does not inherit a generation occurrence', async () => {
  const calls = [];
  const fetchImpl = async (...args) => { calls.push(args); return Response.json({ account: null, jobs: [], ready: false }); };
  await factoryRequest('fixture', undefined, { fetchImpl });
  await factoryRequest('fixture', 'stop', { idempotencyKey: occurrence, fetchImpl });
  assert.equal(calls[0][1].method, 'GET');
  assert.equal(calls[0][1].body, undefined);
  assert.equal(calls[1][1].headers['Idempotency-Key'], undefined);
});

test('each redirect is limited to its own HTTPS provider and rejects credentials, ports and lookalikes', () => {
  assert.equal(factoryDestination({ url: 'https://checkout.stripe.com/c/pay/fixture' }, 'checkout'), 'https://checkout.stripe.com/c/pay/fixture');
  assert.equal(factoryDestination({ url: 'https://billing.stripe.com/p/session/fixture' }, 'portal'), 'https://billing.stripe.com/p/session/fixture');
  assert.equal(factoryDestination({ url: 'https://app.upload-post.com/connect?token=fixture' }, 'connect_instagram'), 'https://app.upload-post.com/connect?token=fixture');
  for (const value of ['http://checkout.stripe.com/c/pay/fixture', 'https://checkout.stripe.com.evil.test/', 'https://user@checkout.stripe.com/', 'https://checkout.stripe.com:444/', 'https://checkout.stripe.com/#fixture', 'https://billing.stripe.com/']) {
    assert.throws(() => factoryDestination({ url: value }, 'checkout'), { code: 'invalid_destination' });
  }
  assert.throws(() => factoryDestination({ url: 'https://checkout.stripe.com/' }, 'portal'), { code: 'invalid_destination' });
  assert.throws(() => factoryDestination({ url: 'https://billing.stripe.com/' }, 'connect_instagram'), { code: 'invalid_destination' });
});

test('completed checkout resumes without a redirect URL', () => {
  let destination;
  assert.doesNotThrow(() => { destination = factoryDestination({ complete: true }, 'checkout'); });
  assert.equal(destination, null);
});

test('only boolean completed checkout skips provider URL validation', () => {
  for (const complete of [false, 'true', 1]) {
    assert.throws(() => factoryDestination({ complete }, 'checkout'), { code: 'invalid_destination' });
  }
  for (const action of ['portal', 'connect_instagram']) {
    assert.throws(() => factoryDestination({ complete: true }, action), { code: 'invalid_destination' });
  }
});
