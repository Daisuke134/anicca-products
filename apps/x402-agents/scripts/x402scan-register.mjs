// x402scan-register.mjs — one-shot SIWX registration of our x402 resource on x402scan (T2b Task3).
// Recipe (verified against Merit-Systems/x402scan + @x402/extensions sign-in-with-x):
//  1. POST {url:RESOURCE} with no auth -> 402 carrying extensions["sign-in-with-x"].info challenge.
//  2. Sign the EIP-4361 SIWE message (NUMERIC chainId 8453) with ANY EVM key (submitter-auth, the
//     signer need NOT equal payTo). We use a throwaway wallet — sanctioned, like the sub-wallet.
//  3. Resubmit the SAME body + header `SIGN-IN-WITH-X: base64(JSON.stringify(payload))` where
//     payload = all challenge info fields + address + signature (chainId stays CAIP in payload).
// Constraints: issuedAt within 5 min, echo server nonce, single-use — so this runs atomically.

import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

const REGISTER = 'https://www.x402scan.com/api/x402/registry/register';
const RESOURCE = process.argv[2];
if (!RESOURCE) { console.error('usage: node x402scan-register.mjs <resource-url>'); process.exit(1); }

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

// 1. fetch challenge
const chalRes = await fetch(REGISTER, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: RESOURCE }) });
const chal = await chalRes.json();
const info = chal?.extensions?.['sign-in-with-x']?.info;
if (!info) { console.error('no SIWX challenge; got', JSON.stringify(chal).slice(0, 300)); process.exit(1); }
console.log('challenge nonce', info.nonce, 'issuedAt', info.issuedAt);

// 2. throwaway signer + exact SIWE message (numeric chainId)
const wallet = ethers.Wallet.createRandom();
const numericChainId = Number(String(info.chainId).split(':').pop());
const siwe = new SiweMessage({
  domain: info.domain,
  address: ethers.getAddress(wallet.address),
  statement: info.statement,
  uri: info.uri,
  version: info.version,
  chainId: numericChainId,
  nonce: info.nonce,
  issuedAt: info.issuedAt,
  expirationTime: info.expirationTime,
  ...(info.notBefore ? { notBefore: info.notBefore } : {}),
  ...(info.requestId ? { requestId: info.requestId } : {}),
  ...(info.resources ? { resources: info.resources } : {}),
});
const message = siwe.prepareMessage();
const signature = await wallet.signMessage(message);
// local self-check that the sig recovers our address (catches signing bugs, not template mismatch)
if (ethers.verifyMessage(message, signature).toLowerCase() !== wallet.address.toLowerCase()) {
  console.error('local sig self-check FAILED'); process.exit(1);
}

// 3. resubmit with SIGN-IN-WITH-X header (chainId stays CAIP string in payload)
const payload = {
  domain: info.domain,
  address: ethers.getAddress(wallet.address),
  statement: info.statement,
  uri: info.uri,
  version: info.version,
  chainId: info.chainId,
  type: info.type,
  nonce: info.nonce,
  issuedAt: info.issuedAt,
  expirationTime: info.expirationTime,
  ...(info.notBefore ? { notBefore: info.notBefore } : {}),
  ...(info.requestId ? { requestId: info.requestId } : {}),
  ...(info.resources ? { resources: info.resources } : {}),
  signature,
};
const res = await fetch(REGISTER, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'SIGN-IN-WITH-X': b64(JSON.stringify(payload)) },
  body: JSON.stringify({ url: RESOURCE }),
});
const text = await res.text();
console.log('register HTTP', res.status);
console.log('signer', wallet.address);
console.log('response', text.slice(0, 600));
process.exit(res.ok ? 0 : 1);
