'use strict';

const actors = require('../../scripts/open/row_actors.json');
const owners = require('./_lib/company-todo-owners.json');
const { handleOpenClaim } = require('./_lib/owner-row-write');

async function openBlobs(event) {
  const { connectLambda, getStore } = require('@netlify/blobs');
  try {
    connectLambda(event);
  } catch {
    // getStore reports a missing Blobs context.
  }
  const store = getStore({ name: 'open-owner-rows', consistency: 'strong' });
  return {
    async getWithMetadata(key) {
      const got = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      if (!got || got.data == null) return null;
      return { data: got.data, etag: got.etag };
    },
    async setJSON(key, value, options) {
      return store.setJSON(key, value, options);
    },
  };
}

function handler(event) {
  return handleOpenClaim(event, { actors, owners, openStore: openBlobs });
}

exports.handler = handler;
exports.handleOpenClaim = handleOpenClaim;
