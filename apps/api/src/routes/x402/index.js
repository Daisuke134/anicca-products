/**
 * x402 Routes
 *
 * Payment-gated API endpoints for external AI agents.
 * Uses @x402/express v2.4 middleware for USDC micropayment verification.
 *
 * Middleware order (CRITICAL — Issues #236, #752):
 * 1. CORS (already applied globally in server.js)
 * 2. express.json() (already applied globally in server.js)
 * 3. x402 paymentMiddleware (applied here, per-route)
 *
 * v2.4 API: paymentMiddleware(routes, x402ResourceServer)
 * - x402ResourceServer needs HTTPFacilitatorClient + ExactEvmScheme
 * - syncFacilitatorOnStart = false to avoid unhandled rejection on init
 */

import { Router } from 'express';
import buddhistCounselRouter from './buddhistCounsel.js';

const router = Router();

// Lazy x402 middleware initialization (avoids top-level await)
let x402Initialized = false;

async function initX402Middleware() {
  if (x402Initialized) return;
  x402Initialized = true;

  if (!process.env.X402_WALLET_ADDRESS) {
    console.log('ℹ️ x402 routes: no wallet configured, running without payment gate');
    return;
  }

  try {
    const { paymentMiddleware } = await import('@x402/express');
    const { x402ResourceServer, HTTPFacilitatorClient } = await import('@x402/core/server');
    const { ExactEvmScheme } = await import('@x402/evm');

    const isMainnet = process.env.X402_NETWORK === 'mainnet';
    const network = isMainnet ? 'eip155:8453' : 'eip155:84532';

    // v2.4: Create resource server with HTTP facilitator + EVM scheme
    const facilitatorClient = new HTTPFacilitatorClient();
    const server = new x402ResourceServer(facilitatorClient);
    server.register(network, new ExactEvmScheme());

    // v2.4: Route-based payment config
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

    // syncFacilitatorOnStart = false to avoid unhandled rejection (learning #4)
    await server.initialize();

    // Insert payment middleware BEFORE the counsel route
    router.use(paymentMiddleware(routes, server, undefined, undefined, false));

    console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
  } catch (err) {
    console.warn('⚠️ x402 middleware failed to initialize:', err.message);
    console.warn('   x402 routes will work WITHOUT payment gate (dev mode)');
  }
}

// Trigger lazy init on server start (non-blocking)
initX402Middleware().catch(err => {
  console.error('x402 init error:', err);
});

// Mount sub-routes
router.use('/buddhist-counsel', buddhistCounselRouter);

export default router;
