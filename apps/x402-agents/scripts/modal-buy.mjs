// Buy a sandbox from BlockRun's Modal gateway with the agent's own wallet (x402/Base).
// This is the SECOND shelter rail: no Solana, no NOS, no confidential channel, no poster
// process that must stay alive — just an HTTP call an agent can make from inside any box.
import fs from 'node:fs'; import path from 'node:path';
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const home = process.env.ANICCA_HOME;
const cands = [path.join(home, 'wallet.json'), path.join(home, '.automaton', 'wallet.json')];
const p = cands.find((c) => fs.existsSync(c));
const w = JSON.parse(fs.readFileSync(p, 'utf8'));
const raw = w.private_key || w.privateKey;
const account = privateKeyToAccount(raw.startsWith('0x') ? raw : '0x' + raw);
console.log('payer:', account.address);

const f = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: 'eip155:8453', client: new ExactEvmScheme(account) }] });
const res = await f('https://blockrun.ai/api/v1/modal/sandbox/create', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ image: 'python:3.11', timeout: 300 }),
});
console.log('HTTP', res.status);
const body = await res.text();
console.log('body:', body.slice(0, 500));
const pr = res.headers.get('x-payment-response') || res.headers.get('payment-response');
if (pr) { const d = JSON.parse(Buffer.from(pr, 'base64').toString()); console.log('PAID tx:', d.transaction, 'success:', d.success); }
