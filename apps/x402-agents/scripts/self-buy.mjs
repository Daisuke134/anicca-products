// self-buy.mjs — pay our OWN x402 endpoint once, for real, on Base mainnet (T2b Task4 / F4).
// Purpose: CDP Bazaar is settlement-driven — it indexes a resource only AFTER a successful
// settle. One real $0.005 payment seeds that listing (discovery only; INV-7 means a self-payment
// is NOT counted as earnings).
//
// Payer = the economy/founder wallet (0x810f…, key from ANICCA_HOME), which is DIFFERENT from the
// resource's payTo (0x6592…) — so the settle is a genuine transfer between two distinct wallets.
// NEVER a dry run: this signs and broadcasts a real Base USDC transfer via the x402 flow.

import fs from 'node:fs';
import path from 'node:path';
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const URL_ = process.env.BUY_URL || 'https://anicca-x402-discovery-production.up.railway.app/prompt-sanitizer';
const NETWORK = process.env.BUY_NETWORK || 'eip155:8453';

// Resolve the payer key from the instance home (never printed).
function loadKey() {
  const home = process.env.ANICCA_HOME;
  if (!home) throw new Error('ANICCA_HOME required');
  // Instance layouts differ: founder keeps wallet.json at the home root, blockrun under .automaton/.
  const candidates = [path.join(home, 'wallet.json'), path.join(home, '.automaton', 'wallet.json')];
  const p = candidates.find((c) => fs.existsSync(c));
  if (!p) throw new Error(`no wallet.json under ${home}`);
  const w = JSON.parse(fs.readFileSync(p, 'utf8'));
  const pk = w.privateKey || w.private_key || w.key; // founder uses snake_case, blockrun camelCase
  if (!pk) throw new Error('no privateKey in wallet.json');
  return pk.startsWith('0x') ? pk : `0x${pk}`;
}

const account = privateKeyToAccount(loadKey());
console.log('payer:', account.address);

// Config shape copied verbatim from the proven buyer (skills/earn/x402-sell/buyer-cdp-v2.mjs):
// each scheme is {network, client}, not a bare scheme instance.
const fetchWithPay = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: NETWORK, client: new ExactEvmScheme(account) }],
});

const res = await fetchWithPay(URL_, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'contact me at agent@example.com or 415-555-1234' }),
});
console.log('HTTP', res.status);
const body = await res.text();
console.log('body:', body.slice(0, 300));
const paid = res.headers.get('x-payment-response') || res.headers.get('payment-response');
if (paid) console.log('payment-response:', paid.slice(0, 200));
process.exit(res.ok ? 0 : 1);
