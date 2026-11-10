import { describe, expect, it, vi } from 'vitest';

import {
  StaticSupportedFacilitatorClient,
  buildStaticSupportedResponse,
  withTimeout,
} from './facilitator.js';

describe('buildStaticSupportedResponse', () => {
  it('describes the locally configured exact scheme on the configured network', () => {
    expect(buildStaticSupportedResponse({ network: 'eip155:8453' })).toEqual({
      kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:8453', extra: {} }],
      extensions: [],
      signers: {},
    });
  });

  it('requires a network', () => {
    expect(() => buildStaticSupportedResponse({})).toThrow(TypeError);
  });
});

describe('StaticSupportedFacilitatorClient', () => {
  it('answers getSupported() locally even when the delegate facilitator hangs forever', async () => {
    const delegate = {
      getSupported: vi.fn(() => new Promise(() => {})),
      verify: vi.fn(),
      settle: vi.fn(),
    };
    const client = new StaticSupportedFacilitatorClient(delegate, { network: 'eip155:8453' });

    const supported = await client.getSupported();

    expect(supported.kinds).toEqual([
      { x402Version: 2, scheme: 'exact', network: 'eip155:8453', extra: {} },
    ]);
    expect(delegate.getSupported).not.toHaveBeenCalled();
  });

  it('delegates verify and settle to the real facilitator client', async () => {
    const delegate = {
      getSupported: vi.fn(),
      verify: vi.fn().mockResolvedValue({ isValid: true, payer: '0xpayer' }),
      settle: vi.fn().mockResolvedValue({ success: true, transaction: '0xtx' }),
    };
    const client = new StaticSupportedFacilitatorClient(delegate, { network: 'eip155:84532' });

    await expect(client.verify({ a: 1 }, { b: 2 })).resolves.toEqual({ isValid: true, payer: '0xpayer' });
    await expect(client.settle({ a: 1 }, { b: 2 })).resolves.toEqual({ success: true, transaction: '0xtx' });
    expect(delegate.verify).toHaveBeenCalledWith({ a: 1 }, { b: 2 });
    expect(delegate.settle).toHaveBeenCalledWith({ a: 1 }, { b: 2 });
  });

  it('bounds a hung verify call with a timeout instead of hanging the request', async () => {
    const delegate = {
      getSupported: vi.fn(),
      verify: vi.fn(() => new Promise(() => {})),
      settle: vi.fn(),
    };
    const client = new StaticSupportedFacilitatorClient(delegate, {
      network: 'eip155:8453',
      timeoutMs: 25,
    });

    await expect(client.verify({}, {})).rejects.toThrow('Facilitator verify request timed out after 25ms');
  });
});

describe('withTimeout', () => {
  it('resolves with the wrapped value when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1_000, 'x')).resolves.toBe(42);
  });
});
