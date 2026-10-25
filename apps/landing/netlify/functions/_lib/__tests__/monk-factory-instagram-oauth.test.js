const test = require('node:test');
const assert = require('node:assert/strict');
const { callbackResult } = require('../../monk-factory-instagram-oauth.js');

const env = { MONK_FACTORY_META_REDIRECT_URI: 'https://aniccaai.com/.netlify/functions/monk-factory-instagram-oauth' };

test('OAuth callback exchanges the code and redirects to the same-site Factory with a safe status', async () => {
  let input;
  const result = await callbackResult({ httpMethod: 'GET', queryStringParameters: { code: 'one-time-code', state: 'opaque-state' } }, {
    env,
    store: {},
    providers: { completeInstagramOAuth: async value => { input = value; return { username: 'monk.mujo' }; } },
  });
  assert.deepEqual(input, { code: 'one-time-code', state: 'opaque-state' });
  assert.equal(result.statusCode, 302);
  const target = new URL(result.headers.Location);
  assert.equal(target.origin, 'https://aniccaai.com');
  assert.equal(target.pathname, '/ai-monk-factory');
  assert.deepEqual([...target.searchParams], [['instagram_oauth', 'connected']]);
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('OAuth callback hides provider failures and ignores an external return destination', async () => {
  const failed = await callbackResult({ httpMethod: 'GET', queryStringParameters: { code: 'private', state: 'state', return_to: 'https://evil.test' } }, {
    env, store: {}, providers: { completeInstagramOAuth: async () => { throw Object.assign(new Error('secret provider detail'), { code: 'provider_secret' }); } },
  });
  assert.equal(new URL(failed.headers.Location).searchParams.get('instagram_oauth'), 'failed');
  assert.equal(JSON.stringify(failed).includes('secret provider detail'), false);
  assert.equal(new URL(failed.headers.Location).origin, 'https://aniccaai.com');
  const invalid = callbackResult({ httpMethod: 'GET' }, { env: { ...env, MONK_FACTORY_META_REDIRECT_URI: 'http://aniccaai.com/callback' } });
  assert.equal(invalid.statusCode, 503);
});

test('OAuth callback accepts GET only and maps Meta cancellation without exposing provider text', () => {
  assert.equal(callbackResult({ httpMethod: 'POST' }, { env }).statusCode, 405);
  const result = callbackResult({ httpMethod: 'GET', queryStringParameters: { error: 'access_denied', error_description: 'private' } }, { env });
  assert.equal(new URL(result.headers.Location).searchParams.get('instagram_oauth'), 'cancelled');
  assert.equal(JSON.stringify(result).includes('private'), false);
});
