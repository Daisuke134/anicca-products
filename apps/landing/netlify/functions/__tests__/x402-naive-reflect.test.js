'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { _test } = require('../x402-naive-reflect');

const NAIVE_RECEIVING_ADDRESS = '0x7De1D49Ec3f71f6FF5B920AE15A67aF7410c161c';

test('Naive v2 payment challenge pays the dedicated Naive receiving wallet', () => {
  const requirement = _test.paymentRequired().accepts[0];

  assert.equal(requirement.payTo, NAIVE_RECEIVING_ADDRESS);
  assert.equal(requirement.network, 'eip155:8453');
  assert.equal(requirement.amount, '5000');
});

test('Naive legacy v1 settlement uses the same receiving wallet', () => {
  const requirement = _test.v1Req();

  assert.equal(requirement.payTo, NAIVE_RECEIVING_ADDRESS);
  assert.equal(requirement.network, 'base');
  assert.equal(requirement.maxAmountRequired, '5000');
});
