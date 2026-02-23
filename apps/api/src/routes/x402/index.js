/**
 * x402 Routes
 *
 * Payment-gated API endpoints for external AI agents.
 * Uses @x402/express v2.4 middleware for USDC micropayment verification.
 *
 * Pattern: coinbase/x402 official E2E server (e2e/servers/express/index.ts)
 * - Static import (NOT dynamic import — paymentMiddleware is synchronous)
 * - app.use(paymentMiddleware) BEFORE route handlers
 *
 * Middleware order (CRITICAL — Issues #236, #752):
 * 1. CORS (already applied globally in server.js)
 * 2. express.json() (already applied globally in server.js)
 * 3. x402 paymentMiddleware (applied here, per-route)
 */

import { Router } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm';
import buddhistCounselRouter from './buddhistCounsel.js';

const router = Router();

// x402 payment gate: static import + synchronous registration (official pattern)
if (process.env.X402_WALLET_ADDRESS) {
  const isMainnet = process.env.X402_NETWORK === 'mainnet';
  const network = isMainnet ? 'eip155:8453' : 'eip155:84532';

  const facilitatorClient = new HTTPFacilitatorClient();
  const server = new x402ResourceServer(facilitatorClient);
  server.register(network, new ExactEvmScheme());

  const routes = {
    'POST /buddhist-counsel': {
      accepts: [{
        scheme: 'exact',
        price: '$0.01',
        network,
        payTo: process.env.X402_WALLET_ADDRESS,
      }],
      description: 'Buddhist counsel for AI agents — reduce suffering with wisdom',
      mimeType: 'application/json',
    },
  };

  // MUST be registered BEFORE route handlers (Express executes middleware in add order)
  router.use(paymentMiddleware(routes, server));

  console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
} else {
  console.log('ℹ️ x402 routes: no wallet configured, running without payment gate');
}

// Mount sub-routes (AFTER payment middleware)
router.use('/buddhist-counsel', buddhistCounselRouter);

export default router;
