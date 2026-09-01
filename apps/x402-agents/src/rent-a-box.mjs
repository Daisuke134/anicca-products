// rent-a-box.mjs — the sellable capability: an agent pays USDC over x402 and gets a running
// container with a public URL. Market evidence (CDP Bazaar, 200 listings, 2026-07-27): buyers pay
// $0.25-$1.00 for capabilities they cannot build themselves (RPC access, agent runs, data), while
// commodity text utilities at $0.005 have no reason to be bought. Renting compute is a capability.
//
// Why the renter's box needs no confidential channel: it carries the RENTER's image and env, not
// our secrets, so the job definition can be public and the posting process does not have to stay
// alive to hand it over. That is what makes this servable from a web service instead of a laptop.
//
// Money-safety: pays from a CAPPED Solana sub-wallet whose balance IS the ceiling. A bug or an
// abusive caller can never spend more than what that wallet holds.

import bs58 from 'bs58';

export const DEFAULT_DURATION_MIN = 10;
export const MAX_DURATION_MIN = 60;
// Cheapest live GPU market, measured 2026-07-27 ($0.04796/hr).
export const DEFAULT_MARKET = '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq';
const IMAGE_RE = /^[a-z0-9.\-_/]+(:[a-zA-Z0-9.\-_]+)?$/;

/** Pure: validate a rental request. Returns {ok, reason, image, durationMinutes, port}. */
export function validateRentalRequest(body = {}) {
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  if (!image) return { ok: false, reason: 'image is required (e.g. "docker.io/library/nginx:alpine")' };
  if (image.length > 200 || !IMAGE_RE.test(image)) return { ok: false, reason: 'image is not a valid registry reference' };
  // `|| default` would swallow an explicit 0 and silently rent for the default instead of refusing.
  const durationMinutes = Number(body.durationMinutes ?? DEFAULT_DURATION_MIN);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > MAX_DURATION_MIN) {
    return { ok: false, reason: `durationMinutes must be an integer 1..${MAX_DURATION_MIN}` };
  }
  const port = Number(body.port ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, reason: 'port must be 1..65535' };
  const cmd = body.cmd === undefined ? undefined : String(body.cmd);
  if (cmd !== undefined && cmd.length > 4000) return { ok: false, reason: 'cmd too long' };
  const env = body.env && typeof body.env === 'object' && !Array.isArray(body.env) ? body.env : undefined;
  if (env && Object.values(env).some((v) => typeof v !== 'string')) return { ok: false, reason: 'env must be flat string values' };
  return { ok: true, image, durationMinutes, port, cmd, env };
}

/** Pure: the schema-0.1 job definition for a rented box. The renter's own image and env. */
export function buildRentalDefinition({ image, port, cmd, env }) {
  const args = { image, expose: port, gpu: true };
  if (cmd !== undefined) args.cmd = cmd; // flat string only — an array cmd dies on the node (measured)
  if (env !== undefined) args.env = env;
  return { version: '0.1', type: 'container', ops: [{ type: 'container/run', id: 'rented', args }] };
}

/**
 * Post the rental on-chain and return {jobAddress, url, expiresAt}. Never throws a secret.
 * sdkFactory is injectable for tests; the real path builds a Client from RENT_SOLANA_KEY.
 */
export async function rentBox({ image, durationMinutes, port, cmd, env, market = DEFAULT_MARKET, sdkFactory, now = () => Date.now() }) {
  const key = process.env.RENT_SOLANA_KEY;
  if (!key && !sdkFactory) throw new Error('rent-a-box is not funded on this instance');

  const sdk = sdkFactory
    ? sdkFactory()
    : await (async () => {
        const m = await import('@nosana/sdk');
        const Client = m.Client || m.default;
        return new Client('mainnet', key);
      })();

  const definition = buildRentalDefinition({ image, port, cmd, env });
  const ipfsHash = await sdk.ipfs.pin(definition);
  const res = await sdk.jobs.list(ipfsHash, durationMinutes * 60, market);
  const jobAddress = typeof res === 'string' ? res : res.job || res.address;
  if (!jobAddress) throw new Error('the market accepted no job for this request');

  // The public URL is a deterministic hash of (job, opIndex, port) — derivable without waiting.
  const { getExposeIdHash } = await import('@nosana/sdk');
  const host = `${getExposeIdHash(jobAddress, 0, port)}.node.k8s.prd.nos.ci`;
  return {
    jobAddress,
    url: `https://${host}`,
    expiresAt: new Date(now() + durationMinutes * 60_000).toISOString(),
    note: 'The box takes 1-3 minutes to be claimed and booted. The URL 503s until then.',
  };
}

/** Base58-encode a 64-byte secret file's contents (helper for wiring the env var). */
export function secretToBase58(bytes) {
  return bs58.encode(Uint8Array.from(bytes));
}
