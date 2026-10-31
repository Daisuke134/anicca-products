const test = require('node:test');
const assert = require('node:assert/strict');
const { ebookDownloadHandler } = require('../ebook-download.js');

function session(edition = 'standard', overrides = {}) {
  return {
    id: 'cs_live_ops_readback', status: 'complete', payment_status: 'paid',
    livemode: true, mode: 'payment', currency: 'usd',
    amount_total: edition === 'templates' ? 9900 : 2900,
    metadata: { product: 'ops_playbook', edition }, ...overrides,
  };
}

async function download(receipt, format = 'pdf') {
  const reads = [];
  const response = await ebookDownloadHandler({
    httpMethod: 'GET', queryStringParameters: { session_id: receipt.id, format },
  }, {
    env: { STRIPE_SECRET_KEY: 'sk_live_test_fixture' }, liveMode: true,
    retrieveSession: async () => receipt,
    readFile: (file) => { reads.push(file); return Buffer.from('paid-content-fixture'); },
  });
  return { response, reads };
}

test('paid standard edition receives the operations book PDF', async () => {
  const { response, reads } = await download(session());
  assert.equal(response.statusCode, 200);
  assert.match(reads[0], /zero-human-company-ja\.pdf$/);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
});

test('templates ZIP belongs only to the fully paid templates edition', async () => {
  const premium = await download(session('templates'), 'zip');
  assert.equal(premium.response.statusCode, 200);
  assert.match(premium.reads[0], /zero-human-company-templates\.zip$/);
  const standard = await download(session(), 'zip');
  assert.equal(standard.response.statusCode, 400);
  assert.deepEqual(standard.reads, []);
});

test('unpaid, wrong currency, underpaid, wrong edition, and test receipts cannot read any book bytes', async () => {
  for (const receipt of [
    session('standard', { payment_status: 'unpaid' }),
    session('standard', { currency: 'jpy' }),
    session('templates', { amount_total: 2900 }),
    session('unlisted'),
    session('standard', { livemode: false }),
    session('standard', { mode: 'subscription' }),
  ]) {
    const { response, reads } = await download(receipt);
    assert.equal(response.statusCode, 403);
    assert.deepEqual(reads, []);
  }
});
