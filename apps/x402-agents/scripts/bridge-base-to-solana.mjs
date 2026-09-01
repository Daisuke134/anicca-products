// bridge-base-to-solana.mjs — the supply line. The colony earns in Base USDC but the cheapest,
// unstoppable shelter market settles in Solana, so without a way across, revenue on one chain
// cannot buy a house on the other. relay.link quotes it and hands back Base transactions to sign.
//
// Money-safety: a hard cap on the amount, and the recipient is passed explicitly so a typo cannot
// silently send the colony's funds to a stranger.
import fs from 'node:fs'; import path from 'node:path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const MAX_USD = Number(process.env.BRIDGE_MAX_USD || 2);
const amountUsd = Number(process.argv[2] || 1);
const recipient = process.argv[3];
if (!recipient) { console.error('usage: node bridge-base-to-solana.mjs <usd> <solana-recipient>'); process.exit(2); }
if (!(amountUsd > 0) || amountUsd > MAX_USD) { console.error(`amount must be 0..${MAX_USD}`); process.exit(2); }

const home = process.env.ANICCA_HOME;
const wf = [path.join(home, 'wallet.json'), path.join(home, '.automaton', 'wallet.json')].find((p) => fs.existsSync(p));
const w = JSON.parse(fs.readFileSync(wf, 'utf8'));
const raw = w.private_key || w.privateKey;
const account = privateKeyToAccount(raw.startsWith('0x') ? raw : '0x' + raw);
console.log('from:', account.address, '-> ', recipient, `$${amountUsd}`);

const q = await (await fetch('https://api.relay.link/quote', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    user: account.address, recipient,
    originChainId: 8453, destinationChainId: 792703809,
    originCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    destinationCurrency: '11111111111111111111111111111111',
    amount: String(Math.round(amountUsd * 1e6)), tradeType: 'EXACT_INPUT',
  }),
})).json();
if (!q.steps) { console.error('no quote:', JSON.stringify(q).slice(0, 200)); process.exit(1); }
console.log('expect out:', q.details?.currencyOut?.amountFormatted, q.details?.currencyOut?.currency?.symbol);

const pub = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
const wc = createWalletClient({ account, chain: base, transport: http('https://base-rpc.publicnode.com') });

let statusEndpoint = null;
for (const step of q.steps) {
  for (const item of step.items || []) {
    const d = item.data;
    const hash = await wc.sendTransaction({ to: d.to, data: d.data, value: BigInt(d.value || 0) });
    const r = await pub.waitForTransactionReceipt({ hash });
    console.log(`${step.id}: ${hash} status=${r.status}`);
    if (item.check?.endpoint) statusEndpoint = item.check.endpoint;
  }
}
if (statusEndpoint) {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const st = await (await fetch(`https://api.relay.link${statusEndpoint}`)).json();
    console.log('status:', st.status);
    if (st.status === 'success') { console.log('delivered:', JSON.stringify(st).slice(0, 200)); break; }
    if (st.status === 'failure' || st.status === 'refund') { console.error('bridge failed:', JSON.stringify(st).slice(0, 200)); process.exit(1); }
  }
}
