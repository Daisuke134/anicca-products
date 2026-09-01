import fs from 'node:fs';
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';
const pk = process.env.BASE_KEY || JSON.parse(fs.readFileSync(process.env.KEYFILE,'utf8')).private_key;
const account = privateKeyToAccount(pk);
console.log('cloud-key payer:', account.address);
const f = wrapFetchWithPaymentFromConfig(fetch, { schemes:[{ network:'eip155:8453', client:new ExactEvmScheme(account) }] });
const res = await f('https://blockrun.ai/api/v1/chat/completions', { method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({model:'openai/gpt-5-mini',messages:[{role:'user',content:'Say: FRANKLIN-CLOUD-SELF-PAID'}],max_tokens:20}) });
console.log('HTTP', res.status);
const t = await res.text(); console.log('out:', t.slice(0,200));
const pr = res.headers.get('x-payment-response')||res.headers.get('payment-response');
if (pr) { const d=JSON.parse(Buffer.from(pr,'base64').toString('utf8')); console.log('PAID tx:', d.transaction, 'success:', d.success); }
