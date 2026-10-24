import assert from 'node:assert/strict';
import test from 'node:test';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createHttpHandler } from '../dist/http.mjs';
import { getAccount, getStats, searchAccounts } from '../dist/index.mjs';

const url = 'https://aniccaai.com/.netlify/functions/ai-monk-mcp';
const headers = { host: 'aniccaai.com', accept: 'application/json, text/event-stream', 'content-type': 'application/json' };
const initialize = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {
  protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'legacy-reader', version: '1' },
} };

test('SDK HTTP client uses the same source-linked tools across stateless requests', async t => {
  const handle = createHttpHandler();
  const statuses = [];
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    fetch: async (input, init) => {
      const request = new Request(input, init);
      request.headers.set('host', new URL(request.url).host);
      const response = await handle(request);
      assert.equal(response.headers.get('mcp-session-id'), null);
      statuses.push(response.status);
      return response;
    },
  });
  const client = new Client({ name: 'http-acceptance', version: '1' });
  t.after(() => client.close());
  await client.connect(transport);
  assert.equal((await client.listTools()).tools.length, 6);
  for (const [name, args, expected] of [
    ['search_ai_monks', { language: 'English', limit: 1 }, searchAccounts({ language: 'English', limit: 1 })],
    ['get_ai_monk', { id: 'yang-mun' }, getAccount('yang-mun')],
    ['ai_monk_index_stats', {}, getStats()],
  ]) {
    const response = await client.callTool({ name, arguments: args });
    assert.deepEqual(response.structuredContent, expected);
  }
  assert.ok(statuses.includes(200));
});

test('legacy MCP initialization works without persistent sessions', async () => {
  const response = await createHttpHandler()(new Request(url, { method: 'POST', headers, body: JSON.stringify(initialize) }));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.result.protocolVersion, '2025-03-26');
  assert.match(payload.result.instructions, /contains no private credentials or private payment details/i);
  assert.match(payload.result.instructions, /never guarantee personal earnings, revenue, or MRR/i);
  assert.equal(response.headers.get('mcp-session-id'), null);
});

test('HTTP boundary rejects hostile origins/hosts and oversized or malformed requests', async () => {
  const handle = createHttpHandler();
  for (const extra of [{ origin: 'https://unrelated.example' }, { host: 'unrelated.example' }]) {
    const response = await handle(new Request(url, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(initialize) }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  const oversized = await handle(new Request(url, { method: 'POST', headers, body: 'x'.repeat(65537) }));
  assert.equal(oversized.status, 413);
  const malformed = await handle(new Request(url, { method: 'POST', headers, body: '{' }));
  assert.equal(malformed.status, 400);
  const get = await handle(new Request(url, { headers: { host: headers.host, accept: 'text/event-stream' } }));
  assert.equal(get.status, 405);
});

test('known browser origin receives CORS without cookies or session state', async () => {
  const response = await createHttpHandler()(new Request(url, { method: 'OPTIONS', headers: {
    host: headers.host, origin: 'https://chatgpt.com', 'access-control-request-headers': 'content-type,mcp-method',
  } }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://chatgpt.com');
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.equal(response.headers.get('set-cookie'), null);
});
