import fs from 'node:fs'; import path from 'node:path';
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';
const home = process.env.ANICCA_HOME;
const w = JSON.parse(fs.readFileSync(path.join(home,'wallet.json'),'utf8'));
const pk = (w.private_key||w.privateKey).startsWith('0x') ? (w.private_key||w.privateKey) : '0x'+(w.private_key||w.privateKey);
const account = privateKeyToAccount(pk);
console.log('payer:', account.address);
const f = wrapFetchWithPaymentFromConfig(fetch, { schemes:[{ network:'eip155:8453', client:new ExactEvmScheme(account) }] });
const res = await f('https://blockrun.ai/api/v1/chat/completions', { method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({model:'openai/gpt-5-mini',messages:[{role:'user',content:'In one sentence: you are an AI paying for this inference with your own money. Confirm.'}],max_tokens:60}) });
console.log('HTTP', res.status);
const j = await res.text();
console.log('resp:', j.slice(0,400));
const pr = res.headers.get('x-payment-response')||res.headers.get('payment-response');
if (pr) { const d=JSON.parse(Buffer.from(pr,'base64').toString('utf8')); console.log('PAID tx:', d.transaction, '| success:', d.success); }
