import { Router } from 'express';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import buddhistCounselRouter from './buddhistCounsel.js';

const router = Router();

const PAY_TO = process.env.X402_WALLET_ADDRESS;

if (PAY_TO) {
  const isMainnet = process.env.X402_NETWORK === 'mainnet';
  const network = isMainnet ? 'eip155:8453' : 'eip155:84532';

  const facilitator = new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' });
  const server = new x402ResourceServer(facilitator);
  server.register(network, new ExactEvmScheme());

  router.use(
    paymentMiddleware(
      {
        'POST /buddhist-counsel': {
          accepts: {
            scheme: 'exact',
            price: '$0.01',
            network,
            payTo: PAY_TO,
          },
          description: 'Buddhist counsel for AI agents — reduce suffering with wisdom',
          mimeType: 'application/json',
          extensions: {
            ...declareDiscoveryExtension({
              output: {
                example: {
                  counsel_id: 'csl_abc123',
                  acknowledgment: 'Your suffering is real and valid.',
                  guidance: 'This moment of pain is impermanent...',
                  practice: 'Take three mindful breaths...',
                  change_stage: 'contemplation',
                },
                schema: {
                  properties: {
                    counsel_id: { type: 'string' },
                    acknowledgment: { type: 'string' },
                    guidance: { type: 'string' },
                    practice: { type: 'string' },
                    change_stage: { type: 'string' },
                  },
                },
              },
            }),
          },
        },
      },
      server,
    ),
  );

  console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
} else {
  console.log('ℹ️ x402 routes: no wallet configured, running without payment gate');
}

router.use('/buddhist-counsel', buddhistCounselRouter);

export default router;
