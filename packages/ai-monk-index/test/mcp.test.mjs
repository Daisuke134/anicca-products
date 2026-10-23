import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { getAccount, getStats, searchAccounts } from '../dist/index.mjs';

test('a real SDK client initializes over stdio, lists read-only tools, and retrieves source-linked data', async t => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL('../dist/stdio.mjs', import.meta.url).pathname],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'ai-monk-index-acceptance', version: '1.0.0' });
  t.after(() => client.close());
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), ['get_ai_monk', 'search_ai_monks', 'ai_monk_index_stats', 'top_formats', 'how_they_monetize', 'winning_playbooks'].sort());
  for (const tool of tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
  }
  for (const [name, args, expected] of [
    ['search_ai_monks', { language: 'English', limit: 2 }, searchAccounts({ language: 'English', limit: 2 })],
    ['get_ai_monk', { id: 'yang-mun' }, getAccount('yang-mun')],
    ['ai_monk_index_stats', {}, getStats()],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, expected);
    assert.deepEqual(JSON.parse(result.content[0].text), expected);
  }
  const invalid = await client.callTool({ name: 'search_ai_monks', arguments: { limit: 51 } });
  assert.equal(invalid.isError, true);
  const missing = await client.callTool({ name: 'get_ai_monk', arguments: { id: 'missing-monk' } });
  assert.equal(missing.isError, true);
});
