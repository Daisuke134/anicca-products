#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createServer } from './mcp.mjs';

try {
  await createServer().connect(new StdioServerTransport());
} catch (error) {
  process.stderr.write(`ai-monk-mcp: ${error.message}\n`);
  process.exitCode = 1;
}
