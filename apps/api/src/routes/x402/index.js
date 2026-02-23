/**
 * x402 Routes
 *
 * Payment-gated API endpoints for external AI agents.
 * Uses @x402/express middleware for USDC micropayment verification.
 *
 * Middleware order (CRITICAL — Issues #236, #752, #933):
 * 1. CORS (already applied globally in server.js)
 * 2. express.json() (already applied globally in server.js)
 * 3. x402 paymentMiddleware (applied here, per-route)
 */

import { Router } from 'express';
import buddhistCounselRouter from './buddhistCounsel.js';

const router = Router();

// x402 payment middleware setup
// Only enabled when wallet credentials are configured
if (process.env.X402_WALLET_ADDRESS && process.env.X402_WALLET_PRIVATE_KEY) {
  try {
    const { paymentMiddleware } = await import('@x402/express');

    // Issue #933: Use facilitator OBJECT, not URL
    const x402Module = await import('@coinbase/x402');
    const facilitator = x402Module.facilitator || x402Module.default?.facilitator;

    const isMainnet = process.env.X402_NETWORK === 'mainnet';
    const network = isMainnet ? 'eip155:8453' : 'eip155:84532';

    // USDC contract addresses (Issue #6: wrong address = funds lost)
    const usdcAddress = isMainnet
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      : '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

    const paymentConfig = {
      network,
      description: 'Buddhist counsel for AI agents — reduce suffering with wisdom',
      resource: `${process.env.X402_WALLET_ADDRESS}`,
      payTo: process.env.X402_WALLET_ADDRESS,
      maxAmountRequired: '10000', // $0.01 in USDC (6 decimals)
    };

    // Apply payment middleware to all x402 routes
    router.use(paymentMiddleware(
      facilitator,
      paymentConfig,
    ));

    console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
  } catch (err) {
    console.warn('⚠️ x402 middleware failed to initialize:', err.message);
    console.warn('   x402 routes will work WITHOUT payment gate (dev mode)');
  }
} else {
  console.log('ℹ️ x402 routes: no wallet configured, running without payment gate');
}

// Mount sub-routes
router.use('/buddhist-counsel', buddhistCounselRouter);

export default router;
