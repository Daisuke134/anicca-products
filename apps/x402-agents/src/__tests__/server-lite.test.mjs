// node:test — server-lite: the pure sanitizer + a live 402-shape check. The sanitizer is the
// real value a buyer pays for (must be deterministic, no network); the 402 body is what the
// x402scan/Bazaar registry probe reads (must carry payTo + the discovery extension).
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.X402_WALLET_ADDRESS = process.env.X402_WALLET_ADDRESS || '0x810F6D61F7606dEEE2657d3083E150a222Bc29C5';
process.env.X402_NETWORK = 'eip155:84532'; // testnet facilitator for the local probe — no CDP creds needed

const { sanitize, createLiteApp } = await import('../server-lite.mjs');

test('sanitize masks each PII class and flags it', () => {
  const r = sanitize('mail me at a@b.com or 415-555-1234, ssn 123-45-6789, ip 10.0.0.1');
  assert.match(r.sanitized_text, /\[EMAIL\]/);
  assert.match(r.sanitized_text, /\[PHONE\]/);
  assert.match(r.sanitized_text, /\[SSN\]/);
  assert.match(r.sanitized_text, /\[IP_ADDRESS\]/);
  assert.equal(r.safe_to_send, false);
  assert.equal(r.risk_score, 0.75);
});

test('sanitize leaves clean text untouched and safe', () => {
  const r = sanitize('summarize the quarterly report please');
  assert.equal(r.sanitized_text, 'summarize the quarterly report please');
  assert.deepEqual(r.flags, []);
  assert.equal(r.safe_to_send, true);
});

test('sanitize rejects non-string', () => {
  assert.throws(() => sanitize(null), /must be a string/);
});

test('unpaid POST returns a 402 carrying payTo + discovery extension (registry probe shape)', async () => {
  const app = await createLiteApp();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/prompt-sanitizer`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x' }),
    });
    assert.equal(res.status, 402);
    // x402 v2 puts the payment requirements (payTo, accepts, discovery extension) in the
    // base64url PAYMENT-REQUIRED header — the body is `{}`. This header is exactly what the
    // x402scan/Bazaar registry probe decodes.
    const header = res.headers.get('payment-required');
    assert.ok(header, 'PAYMENT-REQUIRED header present');
    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    assert.equal(decoded.accepts[0].payTo, '0x810F6D61F7606dEEE2657d3083E150a222Bc29C5');
    assert.equal(decoded.accepts[0].scheme, 'exact');
    assert.ok(decoded.extensions && decoded.extensions.bazaar, 'bazaar discovery extension present');
  } finally {
    server.close();
  }
});
