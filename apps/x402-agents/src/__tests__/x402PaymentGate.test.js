/**
 * Regression test for the production 502 on unpaid GET /funding-rates
 * ("Facilitator supported request timed out after 90000ms").
 *
 * Uses the REAL @x402/express payment middleware, the REAL x402ResourceServer
 * and the REAL funding-rates router. The facilitator client's getSupported()
 * hangs forever, simulating the production facilitator timeout:
 *  - before the fix, createApp() awaited that call in server.initialize() and
 *    unpaid requests never received a 402;
 *  - after the fix (StaticSupportedFacilitatorClient), getSupported() is
 *    answered locally, unpaid requests get an immediate 402, and a paid
 *    request still flows through facilitator verify/settle to a 200.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const facilitatorCalls = vi.hoisted(() => ({
  getSupported: 0,
  verify: 0,
  settle: 0,
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    agentAuditLog: {
      create: vi.fn().mockResolvedValue({ id: 'test-id' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

function makeMockRouter() {
  const r = express.Router();
  r.post('/', (req, res) => res.json({ ok: true }));
  return { default: r };
}

vi.mock('../routes/emotionDetector.js', () => makeMockRouter());
vi.mock('../routes/buddhistCounsel.js', () => makeMockRouter());
vi.mock('../routes/contextCompressor.js', () => makeMockRouter());
vi.mock('../routes/decisionClarifier.js', () => makeMockRouter());
vi.mock('../routes/focusCoach.js', () => makeMockRouter());
vi.mock('../routes/habitDesigner.js', () => makeMockRouter());
vi.mock('../routes/intentRouter.js', () => makeMockRouter());
vi.mock('../routes/promptSanitizer.js', () => makeMockRouter());

vi.mock('../lib/funding-rates.js', () => ({
  getFundingRatesCached: vi.fn().mockResolvedValue({
    rows: [{ baseSymbol: 'BTC', exchange: 'binance' }],
    errors: [],
  }),
  buildFundingRatesResponse: vi.fn((rows, options) => ({
    rates: options.symbol ? rows.filter(row => row.baseSymbol === options.symbol.toUpperCase()) : rows,
    divergenceTop20: [],
    exchanges: ['binance'],
    degraded: false,
    errors: [],
    generatedAt: '2026-11-07T00:00:00.000Z',
  })),
}));

// Real @x402/core/server, except HTTPFacilitatorClient is replaced by a stub
// whose /supported endpoint hangs forever (the production failure mode).
// verify/settle succeed so the paid path can be exercised end to end.
vi.mock('@x402/core/server', async (importOriginal) => {
  const actual = await importOriginal();
  class HangingFacilitatorClient {
    constructor(config) {
      this.url = config?.url || 'https://facilitator.invalid';
    }

    async getSupported() {
      facilitatorCalls.getSupported += 1;
      return new Promise(() => {});
    }

    async verify() {
      facilitatorCalls.verify += 1;
      return { isValid: true, payer: '0x1111111111111111111111111111111111111111' };
    }

    async settle() {
      facilitatorCalls.settle += 1;
      return {
        success: true,
        transaction: `0x${'1'.repeat(64)}`,
        network: 'eip155:84532',
        payer: '0x1111111111111111111111111111111111111111',
      };
    }

    async createAuthHeaders() {
      return { headers: {} };
    }
  }
  return { ...actual, HTTPFacilitatorClient: HangingFacilitatorClient };
});

const WALLET = '0x7De1D49Ec3f71f6FF5B920AE15A67aF7410c161c';

describe('x402 payment gate (facilitator /supported hangs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    facilitatorCalls.getSupported = 0;
    facilitatorCalls.verify = 0;
    facilitatorCalls.settle = 0;
    process.env.X402_WALLET_ADDRESS = WALLET;
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.X402_NETWORK = 'eip155:84532';
  });

  afterEach(() => {
    delete process.env.X402_WALLET_ADDRESS;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.X402_NETWORK;
  });

  it('createApp() does not block on the facilitator and unpaid requests get an immediate 402', async () => {
    const { createApp } = await import('../server.js');
    const app = await createApp();

    const started = Date.now();
    const res = await request(app).get('/funding-rates?symbol=BTC');
    const elapsedMs = Date.now() - started;

    expect(res.status).toBe(402);
    expect(elapsedMs).toBeLessThan(5_000);
    // x402 v2: the PaymentRequired JSON travels in the PAYMENT-REQUIRED
    // header (base64); the JSON body is empty for non-browser clients.
    const paymentRequired = JSON.parse(
      Buffer.from(res.headers['payment-required'], 'base64').toString('utf8'),
    );
    expect(paymentRequired.x402Version).toBe(2);
    expect(paymentRequired.accepts).toHaveLength(1);
    expect(paymentRequired.accepts[0]).toMatchObject({
      scheme: 'exact',
      network: 'eip155:84532',
      amount: '10000', // $0.01 from the paid-route catalog
      asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
      payTo: WALLET,
    });
    // The 402 was built without ever waiting on the facilitator.
    expect(facilitatorCalls.verify).toBe(0);
    expect(facilitatorCalls.settle).toBe(0);
  });

  it('a paid request passes facilitator verify/settle and returns the data', async () => {
    const { createApp } = await import('../server.js');
    const app = await createApp();

    const unpaid = await request(app).get('/funding-rates?symbol=BTC');
    expect(unpaid.status).toBe(402);
    const accepted = JSON.parse(
      Buffer.from(unpaid.headers['payment-required'], 'base64').toString('utf8'),
    ).accepts[0];

    const paymentPayload = {
      x402Version: 2,
      accepted,
      payload: {
        signature: `0x${'cd'.repeat(65)}`,
        authorization: {
          from: '0x1111111111111111111111111111111111111111',
          to: accepted.payTo,
          value: accepted.amount,
          validAfter: '0',
          validBefore: '9999999999',
          nonce: `0x${'ab'.repeat(32)}`,
        },
      },
    };
    const header = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    const paid = await request(app)
      .get('/funding-rates?symbol=BTC')
      .set('payment-signature', header);

    expect(paid.status).toBe(200);
    expect(paid.body.rates).toHaveLength(1);
    expect(facilitatorCalls.verify).toBe(1);
    expect(facilitatorCalls.settle).toBe(1);
  });
});
