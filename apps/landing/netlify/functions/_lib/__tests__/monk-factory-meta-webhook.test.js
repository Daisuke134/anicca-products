const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { webhookResult } = require('../../monk-factory-meta-webhook.js');

const env = {
  MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN: 'private-webhook-verification-token',
  MONK_FACTORY_META_APP_SECRET: 'private-meta-app-secret',
};

test('Meta webhook verification returns the challenge only for the configured token', () => {
  const event = { httpMethod: 'GET', queryStringParameters: {
    'hub.mode': 'subscribe', 'hub.verify_token': env.MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN, 'hub.challenge': 'challenge-123',
  } };
  assert.deepEqual(webhookResult(event, { env }), {
    statusCode: 200, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }, body: 'challenge-123',
  });
  assert.equal(webhookResult({ ...event, queryStringParameters: { ...event.queryStringParameters, 'hub.verify_token': 'wrong' } }, { env }).statusCode, 403);
});

test('Meta event notifications require the raw-body SHA256 signature and acknowledge without retaining payload', () => {
  const body = JSON.stringify({ object: 'instagram', entry: [{ id: 'account-id', changes: [] }] });
  const signature = createHmac('sha256', env.MONK_FACTORY_META_APP_SECRET).update(body).digest('hex');
  const event = { httpMethod: 'POST', body, headers: { 'X-Hub-Signature-256': `sha256=${signature}` } };
  assert.deepEqual(webhookResult(event, { env }), {
    statusCode: 200, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }, body: 'EVENT_RECEIVED',
  });
  assert.equal(webhookResult({ ...event, headers: { 'x-hub-signature-256': 'sha256=00' } }, { env }).statusCode, 403);
  assert.equal(webhookResult({ ...event, headers: {} }, { env }).statusCode, 403);
});

test('Meta webhook fails closed when configuration is missing or the method is unsupported', () => {
  assert.equal(webhookResult({ httpMethod: 'GET' }, { env: {} }).statusCode, 503);
  assert.equal(webhookResult({ httpMethod: 'POST', body: '{}' }, { env: {} }).statusCode, 503);
  assert.equal(webhookResult({ httpMethod: 'DELETE' }, { env }).statusCode, 405);
});
