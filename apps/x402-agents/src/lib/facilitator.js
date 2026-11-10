/**
 * Facilitator client wrapper that keeps the unpaid (402) path off the network.
 *
 * Root cause of the production 502 ("Facilitator supported request timed out
 * after 90000ms" on unpaid GET /funding-rates):
 *
 * Building a 402 Payment Required response requires the resource server's
 * supported-kinds map, which `@x402/core` populates only from a live
 * `GET {facilitator}/supported` call inside `x402ResourceServer.initialize()`.
 * `createApp()` awaited that call before mounting the payment middleware, so
 * every cold start — and therefore the first unpaid request — synchronously
 * depended on the facilitator being reachable. When it timed out, unpaid
 * requests never received their 402.
 *
 * That dependency is artificial for the `exact` EVM scheme:
 * `ExactEvmScheme.enhancePaymentRequirements()` ignores the supported kind,
 * and `parsePrice()` resolves the asset (USDC) and amount locally from a
 * static per-network table. The supported kind is used only as an existence
 * check plus an (unused) facilitator-extensions lookup.
 *
 * So this wrapper answers `getSupported()` from static local configuration
 * (scheme + network are already configured locally), with zero network I/O.
 * The real facilitator is contacted only for `verify`/`settle` of an actual
 * payment payload, and those calls are bounded by a timeout so a hung
 * facilitator cannot hang a paid request either.
 */

export const DEFAULT_FACILITATOR_TIMEOUT_MS = 15_000;

export function buildStaticSupportedResponse({ network, scheme = 'exact', x402Version = 2 } = {}) {
  if (!network || typeof network !== 'string') {
    throw new TypeError('network is required to build the static supported response');
  }
  return {
    kinds: [{ x402Version, scheme, network, extra: {} }],
    extensions: [],
    signers: {},
  };
}

export function withTimeout(promise, timeoutMs, label) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class StaticSupportedFacilitatorClient {
  constructor(delegate, { network, scheme = 'exact', timeoutMs = DEFAULT_FACILITATOR_TIMEOUT_MS } = {}) {
    if (!delegate) throw new TypeError('a delegate facilitator client is required');
    this.delegate = delegate;
    this.timeoutMs = timeoutMs;
    this.supportedResponse = buildStaticSupportedResponse({ network, scheme });
  }

  /**
   * Answers from static local configuration. Never touches the network, so
   * `x402ResourceServer.initialize()` — and with it every unpaid 402 — cannot
   * block or fail on facilitator reachability.
   */
  async getSupported() {
    return JSON.parse(JSON.stringify(this.supportedResponse));
  }

  async verify(paymentPayload, paymentRequirements) {
    return withTimeout(
      this.delegate.verify(paymentPayload, paymentRequirements),
      this.timeoutMs,
      'Facilitator verify request',
    );
  }

  async settle(paymentPayload, paymentRequirements) {
    return withTimeout(
      this.delegate.settle(paymentPayload, paymentRequirements),
      this.timeoutMs,
      'Facilitator settle request',
    );
  }

  async createAuthHeaders(path) {
    if (typeof this.delegate.createAuthHeaders === 'function') {
      return this.delegate.createAuthHeaders(path);
    }
    return { headers: {} };
  }
}
