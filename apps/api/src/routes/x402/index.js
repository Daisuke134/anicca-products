import { Router } from 'express';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { facilitator as cdpFacilitator } from '@coinbase/x402';
import buddhistCounselRouter from './buddhistCounsel.js';
import emotionDetectorRouter from './emotionDetector.js';

const router = Router();

const PAY_TO = process.env.X402_WALLET_ADDRESS;

if (PAY_TO) {
  const network = process.env.X402_NETWORK || 'eip155:84532';
  const isMainnet = network === 'eip155:8453';

  const facilitatorClient = isMainnet
    ? new HTTPFacilitatorClient(cdpFacilitator)
    : new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' });
  const server = new x402ResourceServer(facilitatorClient);
  server.register(network, new ExactEvmScheme());

  router.use(
    paymentMiddleware(
      {
        'POST /emotion-detector': {
          accepts: {
            scheme: 'exact',
            price: '$0.01',
            network,
            payTo: PAY_TO,
          },
          description: 'Emotion detection for AI agents — identify primary emotion, intensity, and response strategy',
          mimeType: 'application/json',
          extensions: {
            ...declareDiscoveryExtension({
              output: {
                example: {
                  emotion_id: 'emo_a1b2c3',
                  primary_emotion: 'anxiety',
                  secondary_emotion: 'fear',
                  intensity: 'high',
                  valence: 'negative',
                  confidence: 0.92,
                  response_strategy: 'Acknowledge the anxiety with empathy before offering solutions.',
                  safe_t_flag: false,
                },
                schema: {
                  properties: {
                    emotion_id: { type: 'string' },
                    primary_emotion: { type: 'string' },
                    secondary_emotion: { type: 'string' },
                    intensity: { type: 'string' },
                    valence: { type: 'string' },
                    confidence: { type: 'number' },
                    response_strategy: { type: 'string' },
                    safe_t_flag: { type: 'boolean' },
                  },
                },
              },
            }),
          },
        },
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
router.use('/emotion-detector', emotionDetectorRouter);

export default router;
