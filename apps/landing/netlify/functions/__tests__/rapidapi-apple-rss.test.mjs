import test from 'node:test';
import assert from 'node:assert';
import handler, { upstreamPath } from '../rapidapi-apple-rss.mjs';
test('paths', () => {
  assert.equal(upstreamPath('/apple-rss/api/v2/jp/apps/top-free/10/apps.json'), '/api/v2/jp/apps/top-free/10/apps.json');
  assert.equal(upstreamPath('/apple-rss/us/apps/top-paid/25/apps.json'), '/api/v2/us/apps/top-paid/25/apps.json');
  assert.equal(upstreamPath('/apple-rss/../etc'), null);
});
test('auth', async () => {
  delete process.env.RAPIDAPI_PROXY_SECRET;
  assert.equal((await handler(new Request('https://x/apple-rss/jp/apps/top-free/10/apps.json'))).status, 503);
  process.env.RAPIDAPI_PROXY_SECRET = 's';
  assert.equal((await handler(new Request('https://x/apple-rss/jp/apps/top-free/10/apps.json', { headers: { 'x-rapidapi-proxy-secret': 'no' } }))).status, 403);
});
