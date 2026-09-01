// base-subwallet.mjs — create/load a capped BASE sub-wallet for cloud Franklin (S12c).
// Same S8 principle as the Solana sub-wallet: the cap IS the balance, and ONLY this key ships to
// the cloud (the founder key never leaves the Mac). Funds it from the founder wallet on Base.
import fs from 'node:fs'; import path from 'node:path';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, parseUnits, erc20Abi } from 'viem';
import { base } from 'viem/chains';

const HOME = process.env.ANICCA_HOME; if (!HOME) throw new Error('ANICCA_HOME required');
const CAP = Number(process.env.BASE_SUBWALLET_USDC_CAP || '1.0');   // hard cap on what the cloud key can ever hold
const FUND = Number(process.env.FUND_USDC || '0');                   // amount to send this run
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const p = path.join(HOME, '.automaton', 'base_subwallet_key.json');

function loadOrCreate() {
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  fs.mkdirSync(path.dirname(p), { recursive: true, mode: 0o700 });
  const pk = generatePrivateKey();
  const rec = { private_key: pk, address: privateKeyToAccount(pk).address, created: new Date().toISOString() };
  fs.writeFileSync(p, JSON.stringify(rec), { mode: 0o600 });
  return rec;
}
const sub = loadOrCreate();
const w = JSON.parse(fs.readFileSync(path.join(HOME, 'wallet.json'), 'utf8'));
const ownerPk = (w.private_key || w.privateKey).startsWith('0x') ? (w.private_key||w.privateKey) : '0x'+(w.private_key||w.privateKey);
const owner = privateKeyToAccount(ownerPk);
const pub = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
const bal = async (a) => Number(await pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [a] })) / 1e6;

console.log('owner:', owner.address, '$'+(await bal(owner.address)));
console.log('sub  :', sub.address, '$'+(await bal(sub.address)), '| cap $'+CAP, '| keyfile', p);

if (FUND > 0) {
  const subBal = await bal(sub.address);
  if (subBal + FUND > CAP) { console.error(`REFUSED: sub would hold $${(subBal+FUND).toFixed(4)} > cap $${CAP}`); process.exit(1); }
  const wc = createWalletClient({ account: owner, chain: base, transport: http('https://base-rpc.publicnode.com') });
  const hash = await wc.writeContract({ address: USDC, abi: erc20Abi, functionName: 'transfer', args: [sub.address, parseUnits(String(FUND), 6)] });
  const r = await pub.waitForTransactionReceipt({ hash });
  console.log('fund tx:', hash, 'status:', r.status);
  console.log('sub after: $'+(await bal(sub.address)));
}
