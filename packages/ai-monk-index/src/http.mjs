import { WebStandardStreamableHTTPServerTransport, hostHeaderValidationResponse, originValidationResponse } from '@modelcontextprotocol/server';
import { createServer } from './mcp.mjs';

export function createHttpHandler({
  allowedHostnames = ['aniccaai.com', 'www.aniccaai.com'],
  allowedOriginHostnames = ['aniccaai.com', 'www.aniccaai.com', 'chatgpt.com', 'chat.openai.com'],
} = {}) {
  return async request => {
    const rejected = hostHeaderValidationResponse(request, allowedHostnames)
      ?? originValidationResponse(request, allowedOriginHostnames);
    if (rejected) return rejected;
    const origin = request.headers.get('origin');
    let response;
    if (request.method === 'OPTIONS') {
      response = new Response(null, { status: 204 });
    } else if (request.method !== 'POST') {
      response = new Response(null, { status: 405, headers: { allow: 'POST, OPTIONS' } });
    } else {
      const server = createServer();
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
        maxRequestBodySize: 65536,
      });
      await server.connect(transport);
      try { response = await transport.handleRequest(request); }
      finally { await server.close(); }
    }
    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store');
    if (origin) {
      headers.set('access-control-allow-origin', origin);
      headers.set('vary', 'Origin');
      headers.set('access-control-allow-methods', 'POST, OPTIONS');
      headers.set('access-control-allow-headers', request.headers.get('access-control-request-headers') ?? 'content-type,mcp-protocol-version');
    }
    return new Response(response.body, { status: response.status, headers });
  };
}
