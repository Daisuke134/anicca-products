#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { searchAccounts, getAccount, getStats } from './index.mjs';

const help = `AI Monk Index — offline, source-linked research snapshot

ai-monk-index search [--query TEXT] [--status all|confirmed|reported|unverified|unknown]
  [--language English|unknown|all] [--platform Instagram|TikTok|YouTube|unknown|all]
  [--region TEXT] [--sort audience|views|revenue|directory] [--offset N] [--limit 1..50]
ai-monk-index get ACCOUNT_ID
ai-monk-index stats

JSON output includes coverage limits, snapshot date, license and source URLs.
Use ai-monk-mcp for the read-only stdio MCP server.
`;

try {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ['--help', '-h', 'help'].includes(command)) {
    process.stdout.write(help);
  } else {
    let result;
    if (command === 'search') {
      const { values } = parseArgs({ args, options: Object.fromEntries(
        ['query', 'status', 'language', 'platform', 'region', 'sort', 'offset', 'limit'].map(name => [name, { type: 'string' }])
      ) });
      for (const key of ['offset', 'limit']) {
        if (values[key] !== undefined) values[key] = Number(values[key]);
      }
      result = searchAccounts(values);
    } else if (command === 'get' && args.length === 1 && !args[0].startsWith('-')) {
      result = getAccount(args[0]);
    } else if (command === 'stats' && args.length === 0) {
      result = getStats();
    } else {
      throw new Error('Invalid command or arguments. Run ai-monk-index --help.');
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`ai-monk-index: ${error.message}\n`);
  process.exitCode = 1;
}
