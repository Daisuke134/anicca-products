/**
 * x402-agents LITE server (T2b discovery) — a DB-free, OpenAI-free discoverable x402 endpoint.
 *
 * Why this exists: the full server.js requires DATABASE_URL + OPENAI_API_KEY per route. To make
 * an endpoint DISCOVERABLE (x402scan/CDP Bazaar) all we need is ONE route that (a) returns a
 * valid x402 402 with declareDiscoveryExtension so the registry's live probe passes, and (b) does
 * REAL work when paid so a buyer gets value. `POST /prompt-sanitizer` here masks PII with pure
 * regex — zero external dependency — so this boots with only X402_WALLET_ADDRESS + CDP creds.
 *
 * Mirrors server.js's facilitator wiring verbatim (CDP mainnet branch / x402.org testnet branch).
 * Fail-closed: if x402 init fails, the route 503s.
 */

import { webcrypto } from 'node:crypto';
// The CDP facilitator SDK signs an Ed25519 JWT via the Web Crypto global. Some Node runtimes
// (observed on Railway nixpacks) don't expose globalThis.crypto — inject it so facilitator init
// doesn't die with "crypto is not defined".
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { validateRentalRequest, rentBox } from './rent-a-box.mjs';

const PAY_TO = process.env.X402_WALLET_ADDRESS;
if (!PAY_TO) {
  console.error('Missing required env var: X402_WALLET_ADDRESS');
  process.exit(1);
}

// Pure, dependency-free PII masking — the real value a buyer pays for. Deterministic, auditable,
// no network. Order matters: mask the most specific patterns first so they aren't half-eaten.
const PII_RULES = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]'],
  [/\b(?:\d[ -]*?){13,16}\b/g, '[CREDIT_CARD]'],
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'],
  [/\b(?:\+?\d{1,2}[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g, '[PHONE]'],
  [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_ADDRESS]'],
];

export function sanitize(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  let out = text;
  const flags = [];
  for (const [re, tag] of PII_RULES) {
    if (re.test(out)) flags.push(tag);
    out = out.replace(re, tag);
  }
  return { sanitized_text: out, flags, risk_score: flags.length ? 0.75 : 0.0, safe_to_send: flags.length === 0 };
}

export async function createLiteApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors({ origin: '*', credentials: false, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment-*'] }));
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60 * 1000, max: 30 }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'x402-agents-lite', payTo: PAY_TO }));

  // OpenAPI doc — x402scan/AgentCash discovery (@agentcash/discovery) registers a resource by
  // GETting {origin}/openapi.json and reading x-payment-info; it never probes the resource itself
  // (root cause of the earlier `no_discovery`). Must be JSON, list the exact path, and carry a
  // STRUCTURED x-payment-info.price so authMode resolves to "paid".
  app.get('/openapi.json', (req, res) =>
    res.json({
      openapi: '3.1.0',
      info: { title: 'Anicca x402 — prompt sanitizer', version: '1.0.0' },
      paths: {
        '/rent-a-box': {
          post: {
            summary: 'Rent a GPU container with a public URL. Pay in USDC, get a running box.',
            'x-payment-info': {
              price: { mode: 'fixed', amount: '0.10', currency: 'USD' },
              protocols: [{ x402: {} }],
            },
          },
        },
        '/prompt-sanitizer': {
          post: {
            summary: 'Deterministic PII sanitizer for AI agents (masks emails, phones, SSNs, cards, IPs).',
            'x-payment-info': {
              price: { mode: 'fixed', amount: '0.005', currency: 'USD' },
              protocols: [{ x402: {} }],
            },
          },
        },
      },
    }),
  );

  const { paymentMiddleware } = await import('@x402/express');
  const { x402ResourceServer, HTTPFacilitatorClient } = await import('@x402/core/server');
  const { ExactEvmScheme } = await import('@x402/evm/exact/server');
  const { declareDiscoveryExtension } = await import('@x402/extensions/bazaar');
  const { facilitator: cdpFacilitator } = await import('@coinbase/x402');

  const network = process.env.X402_NETWORK || 'eip155:84532';
  const isMainnet = network === 'eip155:8453';
  const facilitatorClient = isMainnet
    ? new HTTPFacilitatorClient(cdpFacilitator)
    : new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' });
  const server = new x402ResourceServer(facilitatorClient);
  server.register(network, new ExactEvmScheme());
  await server.initialize();

  app.use(
    paymentMiddleware(
      {
        'POST /rent-a-box': {
          accepts: { scheme: 'exact', price: '$0.10', network, payTo: PAY_TO },
          description: 'Rent a GPU container for up to 60 minutes and get a public URL. You supply the image; we pay the market. No signup, no Solana wallet, no NOS token — pay USDC on Base and get a URL back in one call.',
          mimeType: 'application/json',
          extensions: { ...declareDiscoveryExtension({ output: { example: {}, schema: { properties: {} } } }) },
        },
        'POST /prompt-sanitizer': {
          accepts: { scheme: 'exact', price: '$0.005', network, payTo: PAY_TO },
          description: 'Deterministic PII sanitizer for AI agents — masks emails, phones, SSNs, cards, IPs.',
          mimeType: 'application/json',
          extensions: { ...declareDiscoveryExtension({ output: { example: {}, schema: { properties: {} } } }) },
        },
      },
      server,
      undefined,
      undefined,
      false,
    ),
  );

  // Runs ONLY after payment is verified by the middleware above.
  app.post('/rent-a-box', async (req, res) => {
    const v = validateRentalRequest(req.body || {});
    if (!v.ok) return res.status(400).json({ error: v.reason });
    try {
      const out = await rentBox(v);
      res.json(out);
    } catch (e) {
      // Never surface key material; the module's errors are written to be safe to print.
      res.status(502).json({ error: String(e.message || e) });
    }
  });

  app.post('/prompt-sanitizer', (req, res) => {
    try {
      res.json(sanitize(req.body && req.body.text));
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  return app;
}

// Start only when run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3402;
  createLiteApp()
    .then((app) => app.listen(port, () => console.log(`x402-agents-lite on :${port} (payTo ${PAY_TO}, net ${process.env.X402_NETWORK || 'eip155:84532'})`)))
    .catch((e) => { console.error('lite boot failed:', e.message); process.exit(1); });
}
