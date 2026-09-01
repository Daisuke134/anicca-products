import fs from 'node:fs'; import path from 'node:path';
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';
const home=process.env.ANICCA_HOME;
const w=JSON.parse(fs.readFileSync(path.join(home,'wallet.json'),'utf8'));
const raw=w.private_key||w.privateKey; const pk=raw.startsWith('0x')?raw:'0x'+raw;
const account=privateKeyToAccount(pk);
console.log('buyer:', account.address);
const f=wrapFetchWithPaymentFromConfig(fetch,{schemes:[{network:'eip155:8453',client:new ExactEvmScheme(account)}]});
const res=await f('https://anicca-x402-discovery-production.up.railway.app/rent-a-box',{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({image:'docker.io/nginxinc/nginx-unprivileged:alpine',durationMinutes:10,port:8080})});
console.log('HTTP',res.status);
console.log('body:',(await res.text()).slice(0,400));
const pr=res.headers.get('x-payment-response')||res.headers.get('payment-response');
if(pr){const d=JSON.parse(Buffer.from(pr,'base64').toString());console.log('PAID tx:',d.transaction,'success:',d.success);}
