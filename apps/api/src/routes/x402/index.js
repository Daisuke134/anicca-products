import { Router } from 'express';
import buddhistCounselRouter from './buddhistCounsel.js';
import emotionDetectorRouter from './emotionDetector.js';
import focusCoachRouter from './focusCoach.js';
import habitDesignerRouter from './habitDesigner.js';

const router = Router();

const PAY_TO = process.env.X402_WALLET_ADDRESS;

if (PAY_TO) {
  try {
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

    try {
      await server.initialize();
      console.log('✅ x402 server initialized successfully');
    } catch (initErr) {
      console.error('⚠️ x402 server.initialize() failed:', initErr.message);
    }

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
          'POST /focus-coach': {
            accepts: {
              scheme: 'exact',
              price: '$0.01',
              network,
              payTo: PAY_TO,
            },
            description: 'Focus coach for AI agents — diagnose focus blockers using B=MAP and return one tiny action',
            mimeType: 'application/json',
            extensions: {
              ...declareDiscoveryExtension({
                output: {
                  example: {
                    focus_id: 'fcs_a1b2c3d4',
                    diagnosis: {
                      primary_blocker: 'ability',
                      explanation: 'The task is too vague to start.',
                    },
                    tiny_action: {
                      action: 'Write just the first sentence of your report.',
                      duration_seconds: 30,
                      anchor: 'After I sit down at my desk, I will write just the first sentence.',
                    },
                    environment_design: 'Close all browser tabs except the one you need.',
                    safe_t_flag: false,
                  },
                  schema: {
                    properties: {
                      focus_id: { type: 'string' },
                      diagnosis: { type: 'object' },
                      tiny_action: { type: 'object' },
                      environment_design: { type: 'string' },
                      safe_t_flag: { type: 'boolean' },
                    },
                  },
                },
              }),
            },
          },
          'POST /habit-designer': {
            accepts: {
              scheme: 'exact',
              price: '$0.01',
              network,
              payTo: PAY_TO,
            },
            description: 'Habit designer for AI agents — design tiny habits using BJ Fogg + Atomic Habits frameworks',
            mimeType: 'application/json',
            extensions: {
              ...declareDiscoveryExtension({
                output: {
                  example: {
                    habit_id: 'hab_a1b2c3d4',
                    goal_reframe: 'I am the type of person who moves their body every day.',
                    anchor_moment: 'After I pour my morning coffee',
                    tiny_behavior: 'Do two push-ups',
                    celebration: 'Say "I am strong!" and smile',
                    scaling_path: ['5 push-ups', '10 push-ups', '15-minute workout'],
                    b_map_analysis: {
                      motivation: 'Medium intrinsic — health identity',
                      ability: 'Very high — 2 push-ups requires no equipment',
                      prompt: 'Action prompt anchored to coffee ritual',
                    },
                    implementation_intention: 'When I pour my morning coffee, I will do two push-ups, in my kitchen.',
                    safe_t_flag: false,
                  },
                  schema: {
                    properties: {
                      habit_id: { type: 'string' },
                      goal_reframe: { type: 'string' },
                      anchor_moment: { type: 'string' },
                      tiny_behavior: { type: 'string' },
                      celebration: { type: 'string' },
                      scaling_path: { type: 'array' },
                      b_map_analysis: { type: 'object' },
                      implementation_intention: { type: 'string' },
                      safe_t_flag: { type: 'boolean' },
                    },
                  },
                },
              }),
            },
          },
        },
        server,
        undefined,
        undefined,
        false,
      ),
    );

    console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
  } catch (err) {
    console.error('⚠️ x402 payment middleware failed to initialize (routes will work without payment gate):', err.message);
  }
} else {
  console.log('ℹ️ x402 routes: no wallet configured, running without payment gate');
}

router.use('/buddhist-counsel', buddhistCounselRouter);
router.use('/emotion-detector', emotionDetectorRouter);
router.use('/focus-coach', focusCoachRouter);
router.use('/habit-designer', habitDesignerRouter);

export default router;
