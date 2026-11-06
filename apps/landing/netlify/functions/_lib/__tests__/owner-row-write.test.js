'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const actors = require('../../../../scripts/open/row_actors.json');
const owners = require('../company-todo-owners.json');
const {
  ENDPOINT_PATH,
  authorizeActor,
  casUpdate,
  evidenceError,
  handleOpenClaim,
  sha256,
  signEd25519,
  signHmac,
} = require('../owner-row-write');

const SECRET = 'test-owner-row-secret';
const NOW = Date.parse('2026-11-06T18:00:00Z');

function memoryStore(seed) {
  let data = seed ? structuredClone(seed) : null;
  let etag = seed ? 'etag-1' : null;
  let version = seed ? 1 : 0;
  return {
    async getWithMetadata() {
      if (!data) return null;
      return { data: structuredClone(data), etag };
    },
    async setJSON(_key, value, options) {
      if (options && options.onlyIfNew && data) return { modified: false };
      if (options && options.onlyIfMatch && options.onlyIfMatch !== etag) return { modified: false };
      data = structuredClone(value);
      version += 1;
      etag = `etag-${version}`;
      return { modified: true, etag };
    },
    snapshot() {
      return structuredClone(data);
    },
  };
}

function racingStore(seed) {
  let data = structuredClone(seed);
  let etag = 'etag-1';
  let reads = 0;
  let release;
  const bothRead = new Promise((resolve) => {
    release = resolve;
  });
  return {
    async getWithMetadata() {
      reads += 1;
      const snap = { data: structuredClone(data), etag };
      if (reads === 2) release();
      if (reads === 1) await bothRead;
      return snap;
    },
    async setJSON(_key, value, options) {
      if (!options || options.onlyIfMatch !== etag) return { modified: false };
      data = structuredClone(value);
      etag = 'etag-2';
      return { modified: true, etag };
    },
    snapshot() {
      return structuredClone(data);
    },
  };
}

function post(raw, authorization, now) {
  return handleOpenClaim({
    httpMethod: 'POST',
    headers: authorization ? { Authorization: authorization } : {},
    body: raw,
  }, {
    secret: SECRET,
    actors,
    owners,
    now: () => now || NOW,
    store: memoryStore(),
  });
}

function hmac(raw, actor, exp) {
  return `Bearer ${signHmac(SECRET, {
    actor,
    body_sha256: sha256(raw),
    exp,
    method: 'POST',
    path: ENDPOINT_PATH,
  })}`;
}

test('missing and invalid authentication are rejected before a write', async () => {
  const raw = JSON.stringify({ op: 'claim', priority: 26, expected_revision: 0 });
  const store = memoryStore();
  const denied = await handleOpenClaim({
    httpMethod: 'POST', headers: {}, body: raw,
  }, { secret: SECRET, actors, owners, now: () => NOW, store });
  assert.equal(denied.statusCode, 401);
  assert.equal(JSON.parse(denied.body).error, 'missing_auth');
  assert.equal(store.snapshot(), null);

  const forged = await post(raw, 'Bearer v1.not-a-signature.nope');
  assert.equal(forged.statusCode, 401);
  assert.equal(JSON.parse(forged.body).error, 'invalid_auth');

  const expired = await post(raw, hmac(raw, 'cursor[bot]', Math.floor(NOW / 1000) - 5));
  assert.equal(expired.statusCode, 401);

  const tampered = `${raw.slice(0, -1)},"extra":1}`;
  const swapped = await post(tampered, hmac(raw, 'cursor[bot]', Math.floor(NOW / 1000) + 60));
  assert.equal(swapped.statusCode, 401);

  const unconfigured = await handleOpenClaim({
    httpMethod: 'POST',
    headers: { Authorization: hmac(raw, 'cursor[bot]', Math.floor(NOW / 1000) + 60) },
    body: raw,
  }, { secret: '', actors, owners, now: () => NOW, store });
  assert.equal(unconfigured.statusCode, 503);
  assert.equal(JSON.parse(unconfigured.body).error, 'signing_unconfigured');
  assert.match(JSON.parse(unconfigured.body).configuration.ui, /Project configuration > Environment variables/);
});

test('a mapped actor cannot write another owner row, and unmapped names stay refused', async () => {
  const exp = Math.floor(NOW / 1000) + 60;
  const codex = JSON.stringify({ op: 'claim', priority: 10, expected_revision: 0 });
  const forbidden = await post(codex, hmac(codex, 'cursor[bot]', exp));
  assert.equal(forbidden.statusCode, 403);
  assert.equal(JSON.parse(forbidden.body).error, 'row_forbidden');

  for (const actor of ['Muse', 'Dots', 'Codex']) {
    const raw = JSON.stringify({ op: 'claim', priority: 26, expected_revision: 0 });
    const response = await post(raw, hmac(raw, actor, exp));
    assert.equal(response.statusCode, 403);
    assert.equal(JSON.parse(response.body).error, 'unmapped_actor');
    assert.equal(actors.actors[actor], undefined);
    assert.equal(actors.unmapped_reason[actor] != null, true);
  }
  assert.equal(authorizeActor(actors, 'cursor[bot]', owners.find((row) => row.priority === 26).owner).ok, true);
});

test('evidence bounds reject empty, long, and multi-cell values', async () => {
  assert.equal(evidenceError(''), 'evidence_bounds');
  assert.equal(evidenceError('x'.repeat(501)), 'evidence_bounds');
  assert.equal(evidenceError('left|right'), 'evidence_bounds');
  assert.equal(evidenceError('one\ntwo'), 'evidence_bounds');
  assert.equal(evidenceError('x'.repeat(500)), null);

  const exp = Math.floor(NOW / 1000) + 60;
  const store = memoryStore();
  const claimed = await claim(store, 26, 0);
  const raw = JSON.stringify({
    op: 'complete',
    priority: 26,
    expected_revision: claimed.revision,
    lease_token: claimed.lease_token,
    idempotency_key: 'bounds-1',
    evidence: `bad|cell ${'x'.repeat(500)}`,
  });
  const response = await handleOpenClaim({
    httpMethod: 'POST', headers: { Authorization: hmac(raw, 'cursor[bot]', exp) }, body: raw,
  }, { secret: SECRET, actors, owners, now: () => NOW, store });
  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error, 'evidence_bounds');
  assert.equal(store.snapshot().evidence, null);
});

test('concurrent claims allow one writer and the other loses the revision', async () => {
  const seed = {
    priority: 26,
    owner: owners.find((row) => row.priority === 26).owner,
    revision: 1,
    lease_owner: null,
    lease_token: null,
    lease_expires: null,
    evidence: null,
    completions: {},
  };
  const store = racingStore(seed);
  const action = {
    op: 'claim',
    priority: 26,
    owner: seed.owner,
    actor: 'cursor[bot]',
    expected_revision: 1,
    lease_seconds: 60,
    new_token: 'token-a',
  };
  const other = { ...action, new_token: 'token-b' };
  const [first, second] = await Promise.all([
    casUpdate(store, 'priority:26', action, NOW),
    casUpdate(store, 'priority:26', other, NOW),
  ]);
  const results = [first, second];
  assert.equal(results.filter((item) => item.ok).length, 1);
  assert.equal(results.filter((item) => item.error === 'revision_mismatch').length, 1);
  assert.equal(store.snapshot().revision, 2);
  assert.equal([store.snapshot().lease_token].includes('token-a') || store.snapshot().lease_token === 'token-b', true);
});

test('an expired lease cannot complete, and the same completion key does not write twice', async () => {
  const store = memoryStore();
  const claimed = await claim(store, 26, 0, 30, NOW);
  const late = await complete(store, claimed, 'late evidence', 'once', NOW + 31000);
  assert.equal(late.statusCode, 409);
  assert.equal(JSON.parse(late.body).error, 'lease_expired');

  const again = await claim(store, 26, claimed.revision, 60, NOW + 31000);
  const done = await complete(store, again, 'accepted evidence', 'same-key', NOW);
  assert.equal(done.statusCode, 200);
  const replay = await complete(store, again, 'accepted evidence', 'same-key', NOW);
  assert.equal(JSON.parse(replay.body).idempotent, true);
  assert.equal(JSON.parse(replay.body).revision, JSON.parse(done.body).revision);
  assert.equal(store.snapshot().revision, JSON.parse(done.body).revision);

  const conflict = await complete(store, again, 'different evidence', 'same-key', NOW);
  assert.equal(conflict.statusCode, 409);
  assert.equal(JSON.parse(conflict.body).error, 'idempotency_conflict');
  assert.equal(store.snapshot().evidence, 'accepted evidence');
});

test('a registered ed25519 key is actor proof and a missing key is not a login', async () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64url');
  const fixture = {
    actors: {
      'mapped-verifier': { verification_only: true, owners: [owners.find((row) => row.priority === 26).owner], ed25519_public_key: raw },
    },
    unmapped_reason: actors.unmapped_reason,
  };
  const evidence = '';
  const proof = signEd25519(privateKey, {
    actor: 'mapped-verifier',
    evidence,
    exp: Math.floor(NOW / 1000) + 60,
    priority: 26,
  });
  const rawBody = JSON.stringify({ op: 'claim', priority: 26, expected_revision: 0, evidence });
  const accepted = await handleOpenClaim({
    httpMethod: 'POST',
    headers: { Authorization: `Ed25519 ${proof}` },
    body: rawBody,
  }, { secret: '', actors: fixture, owners, now: () => NOW, store: memoryStore() });
  assert.equal(accepted.statusCode, 200);
  assert.equal(JSON.parse(accepted.body).actor, 'mapped-verifier');

  const unnamed = signEd25519(privateKey, {
    actor: 'Muse',
    evidence,
    exp: Math.floor(NOW / 1000) + 60,
    priority: 26,
  });
  const refused = await handleOpenClaim({
    httpMethod: 'POST',
    headers: { Authorization: `Ed25519 ${unnamed}` },
    body: rawBody,
  }, { secret: '', actors, owners, now: () => NOW, store: memoryStore() });
  assert.equal(refused.statusCode, 403);
  assert.equal(JSON.parse(refused.body).error, 'unmapped_actor');
});

test('public files keep the unhosted claim fact and the existing usage record', () => {
  const landing = path.join(__dirname, '../../../..');
  const page = fs.readFileSync(path.join(landing, 'public/open/index.html'), 'utf8');
  const snapshot = JSON.parse(fs.readFileSync(path.join(landing, 'public/open/claims-snapshot.json'), 'utf8'));
  const usage = JSON.parse(fs.readFileSync(path.join(landing, 'public/open/usage-snapshot.json'), 'utf8'));
  assert.match(page, /Claim via claim_board\.py only/);
  assert.equal(snapshot.claim_api_hosted, false);
  assert.equal(usage.weekly_usage_percent, 57.5);
  assert.equal(usage.measured_at, '2026-11-06T08:16:00-08:00');
  const todo = fs.readFileSync(path.join(landing, '../../COMPANY_TODO.md'), 'utf8');
  const projected = [...todo.matchAll(/^\| (\d{1,2}) \| [^|]+? \| ([^|]+?) \|/gm)]
    .map((match) => ({ priority: Number(match[1]), owner: match[2].trim() }))
    .filter((row) => row.priority !== 15);
  assert.deepEqual(owners, projected);
});

async function claim(store, priority, expected, leaseSeconds = 60, now = NOW) {
  const raw = JSON.stringify({
    op: 'claim', priority, expected_revision: expected, lease_seconds: leaseSeconds,
  });
  const response = await handleOpenClaim({
    httpMethod: 'POST',
    headers: { Authorization: hmac(raw, 'cursor[bot]', Math.floor(now / 1000) + 60) },
    body: raw,
  }, { secret: SECRET, actors, owners, now: () => now, store });
  assert.equal(response.statusCode, 200);
  return JSON.parse(response.body);
}

async function complete(store, claimed, evidence, idempotencyKey, now) {
  const raw = JSON.stringify({
    op: 'complete',
    priority: 26,
    expected_revision: claimed.revision,
    lease_token: claimed.lease_token,
    idempotency_key: idempotencyKey,
    evidence,
  });
  return handleOpenClaim({
    httpMethod: 'POST',
    headers: { Authorization: hmac(raw, 'cursor[bot]', Math.floor(now / 1000) + 60) },
    body: raw,
  }, { secret: SECRET, actors, owners, now: () => now, store });
}
