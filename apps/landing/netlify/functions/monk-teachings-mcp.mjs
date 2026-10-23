// Remote MCP (stateless Streamable HTTP, JSON responses) for the Anicca Monk teachings DB.
// Source of truth: Daisuke134/life-manager apps/monk-mcp. Data: Dhammapada, Bhikkhu Sujato, CC0 (SuttaCentral).
import { handle } from './_lib/monk-teachings/server.mjs';
export default (request) => handle(request);
