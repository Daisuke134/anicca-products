'use strict';

const crypto = require('crypto');

const MAX_EVIDENCE = 500;
const MAX_LEASE_SECONDS = 15 * 60;
const MAX_TOKEN_TTL_SECONDS = 10 * 60;
const HMAC_KEYS = ['actor', 'body_sha256', 'exp', 'method', 'path'];
const PROOF_KEYS = ['actor', 'evidence', 'exp', 'priority'];
const ENDPOINT_PATH = '/.netlify/functions/open-claim';

function canonical(keys, value) {
  const out = {};
  for (const key of keys) out[key] = value[key];
  return JSON.stringify(out);
}

function encodePart(text) {
  return Buffer.from(text).toString('base64url');
}

function parseV1(token, keys) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  let json;
  try {
    json = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  if (encodePart(canonical(keys, json)) !== parts[1]) return null;
  return { json, payloadPart: parts[1], sig: parts[2] };
}

function freshExp(exp, nowMs) {
  if (!Number.isInteger(exp)) return false;
  const nowSec = Math.floor(nowMs / 1000);
  return exp >= nowSec && exp <= nowSec + MAX_TOKEN_TTL_SECONDS;
}

function signHmac(secret, payload) {
  const payloadPart = encodePart(canonical(HMAC_KEYS, payload));
  const sig = crypto.createHmac('sha256', secret).update(payloadPart).digest('base64url');
  return `v1.${payloadPart}.${sig}`;
}

function verifyHmac(secret, token, expected) {
  if (!secret) return { ok: false, status: 503, error: 'signing_unconfigured' };
  const parsed = parseV1(token, HMAC_KEYS);
  if (!parsed) return { ok: false, status: 401, error: 'invalid_auth' };
  const digest = crypto.createHmac('sha256', secret).update(parsed.payloadPart).digest('base64url');
  const left = Buffer.from(digest);
  const right = Buffer.from(parsed.sig);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  const body = parsed.json;
  if (body.actor !== expected.actorClaim && typeof expected.actorClaim === 'string') {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  if (body.method !== 'POST' || body.path !== ENDPOINT_PATH) {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  if (body.body_sha256 !== expected.bodySha256 || !freshExp(body.exp, expected.now)) {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  if (typeof body.actor !== 'string' || body.actor.length < 1 || body.actor.length > 80) {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  return { ok: true, actor: body.actor };
}

function ed25519KeyFromRaw(publicKey) {
  const raw = Buffer.from(publicKey, 'base64url');
  if (raw.length !== 32) return null;
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]);
  try {
    return crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
  } catch {
    return null;
  }
}

function signEd25519(privateKey, payload) {
  const payloadPart = encodePart(canonical(PROOF_KEYS, payload));
  const sig = crypto.sign(null, Buffer.from(payloadPart), privateKey).toString('base64url');
  return `v1.${payloadPart}.${sig}`;
}

function verifyEd25519Proof(actorMap, proof, expected) {
  const parsed = parseV1(proof, PROOF_KEYS);
  if (!parsed) return { ok: false, status: 401, error: 'invalid_auth' };
  const body = parsed.json;
  if (body.priority !== expected.priority || body.evidence !== expected.evidence) {
    return { ok: false, status: 401, error: 'invalid_auth' };
  }
  if (!freshExp(body.exp, expected.now)) return { ok: false, status: 401, error: 'invalid_auth' };
  if (typeof body.actor !== 'string') return { ok: false, status: 401, error: 'invalid_auth' };
  const record = actorMap.actors && actorMap.actors[body.actor];
  if (!record) {
    return {
      ok: false,
      status: 403,
      error: 'unmapped_actor',
      reason: (actorMap.unmapped_reason && actorMap.unmapped_reason[body.actor]) || 'actor is not mapped',
    };
  }
  if (!record.ed25519_public_key) {
    return {
      ok: false,
      status: 403,
      error: 'actor_key_unregistered',
      reason: (actorMap.unmapped_reason && actorMap.unmapped_reason[body.actor]) || 'no ed25519_public_key is recorded',
    };
  }
  const key = ed25519KeyFromRaw(record.ed25519_public_key);
  const sig = Buffer.from(parsed.sig, 'base64url');
  if (!key || sig.length !== 64) return { ok: false, status: 401, error: 'invalid_auth' };
  let valid = false;
  try {
    valid = crypto.verify(null, Buffer.from(parsed.payloadPart), key, sig);
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, status: 401, error: 'invalid_auth' };
  return { ok: true, actor: body.actor };
}

function authorizeActor(actorMap, actor, owner) {
  const record = actorMap.actors && actorMap.actors[actor];
  if (!record) {
    return {
      ok: false,
      status: 403,
      error: 'unmapped_actor',
      reason: (actorMap.unmapped_reason && actorMap.unmapped_reason[actor]) || 'actor is not mapped',
    };
  }
  if (!Array.isArray(record.owners) || !record.owners.includes(owner)) {
    return { ok: false, status: 403, error: 'row_forbidden' };
  }
  if (!record.verification_only) {
    return { ok: false, status: 403, error: 'direct_main_write_forbidden' };
  }
  return { ok: true, mode: 'pull_request' };
}

function ownerForPriority(owners, priority) {
  if (!Number.isInteger(priority) || priority === 15 || priority < 1 || priority > 30) return null;
  const row = owners.find((item) => item.priority === priority);
  return row ? row.owner : null;
}

function evidenceError(evidence) {
  if (typeof evidence !== 'string' || evidence.trim() === '' || evidence.length > MAX_EVIDENCE) return 'evidence_bounds';
  if (/[|\r\n]/.test(evidence)) return 'evidence_bounds';
  return null;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function emptyRow(priority, owner) {
  return {
    priority,
    owner,
    revision: 0,
    lease_owner: null,
    lease_token: null,
    lease_expires: null,
    evidence: null,
    completions: {},
  };
}

function iso(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function publicRow(row) {
  const now = Date.now();
  const expires = row.lease_expires ? Date.parse(row.lease_expires) : NaN;
  let leaseState = 'open';
  if (row.lease_owner && expires > now) leaseState = 'claimed';
  else if (row.lease_owner && expires <= now) leaseState = 'expired';
  return {
    priority: row.priority,
    owner: row.owner,
    revision: row.revision,
    lease_state: leaseState,
    evidence: row.evidence,
  };
}

function reduceRow(existing, action, nowMs) {
  const row = existing || emptyRow(action.priority, action.owner);
  if (action.op === 'complete' && action.idempotency_key && row.completions[action.idempotency_key]) {
    const prior = row.completions[action.idempotency_key];
    if (prior.actor === action.actor && prior.evidence === action.evidence && prior.body_sha256 === action.body_sha256) {
      return {
        write: false,
        result: { ok: true, status: 200, idempotent: true, revision: prior.revision, evidence: prior.evidence },
      };
    }
    return { write: false, result: { ok: false, status: 409, error: 'idempotency_conflict' } };
  }
  if (row.revision !== action.expected_revision) {
    return { write: false, result: { ok: false, status: 409, error: 'revision_mismatch', revision: row.revision } };
  }
  const expires = row.lease_expires ? Date.parse(row.lease_expires) : NaN;
  const held = Boolean(row.lease_owner) && expires > nowMs;
  if (action.op === 'claim') {
    if (held && (row.lease_owner !== action.actor || row.lease_token !== action.lease_token)) {
      return { write: false, result: { ok: false, status: 409, error: held && row.lease_owner !== action.actor ? 'already_claimed' : 'lease_rejected' } };
    }
    const token = held ? row.lease_token : action.new_token;
    const next = {
      ...row,
      lease_owner: action.actor,
      lease_token: token,
      lease_expires: iso(nowMs + action.lease_seconds * 1000),
      revision: row.revision + 1,
    };
    return {
      write: true,
      next,
      result: { ok: true, status: 200, revision: next.revision, lease_token: token, lease_expires: next.lease_expires },
    };
  }
  if (!row.lease_owner || row.lease_token !== action.lease_token || row.lease_owner !== action.actor) {
    return { write: false, result: { ok: false, status: 409, error: 'lease_rejected' } };
  }
  if (!(expires > nowMs)) {
    return { write: false, result: { ok: false, status: 409, error: 'lease_expired' } };
  }
  if (action.op === 'release') {
    const next = { ...row, lease_owner: null, lease_token: null, lease_expires: null, revision: row.revision + 1 };
    return { write: true, next, result: { ok: true, status: 200, revision: next.revision } };
  }
  const completions = { ...row.completions };
  const revision = row.revision + 1;
  completions[action.idempotency_key] = {
    actor: action.actor,
    evidence: action.evidence,
    body_sha256: action.body_sha256,
    revision,
  };
  const keys = Object.keys(completions);
  while (keys.length > 20) delete completions[keys.shift()];
  const next = {
    ...row,
    evidence: action.evidence,
    lease_owner: null,
    lease_token: null,
    lease_expires: null,
    revision,
    completions,
  };
  return { write: true, next, result: { ok: true, status: 200, revision, evidence: action.evidence, idempotent: false } };
}

async function casUpdate(store, key, action, nowMs) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await store.getWithMetadata(key);
    const decision = reduceRow(current && current.data, action, nowMs);
    if (!decision.write) return decision.result;
    const options = current && current.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
    const written = await store.setJSON(key, decision.next, options);
    if (written && written.modified) return decision.result;
  }
  return { ok: false, status: 409, error: 'claim_lost_race' };
}

function configuration(signingConfigured) {
  return {
    endpoint: ENDPOINT_PATH,
    claim_api_hosted_on_this_response: true,
    authenticated_owner_write_observed: false,
    signing_configured: signingConfigured,
    store: 'netlify-blobs',
    store_name: 'open-owner-rows',
    consistency: 'strong',
    conditional_write: 'setJSON onlyIfMatch or onlyIfNew',
    docs: 'https://docs.netlify.com/build/data-and-storage/netlify-blobs/',
    git_delivery: {
      performed_by_this_function: false,
      workflow: '.github/workflows/company-todo-owner.yml',
      pushes_main: false,
    },
    hmac_identity: 'Possession of OPEN_OWNER_ROW_HMAC_SECRET can sign only an actor already listed in row_actors.json. It is not a GitHub login and cannot name Muse, Dots, or Codex.',
    ed25519_identity: 'An actor proves a call by signing with the private key for ed25519_public_key already stored on that actor. This repository has no key for Muse, Dots, or Codex.',
    owner_configuration: {
      ui: 'Netlify project for aniccaai.com: Project configuration > Environment variables > OPEN_OWNER_ROW_HMAC_SECRET. Scope it to functions and mark it secret. Do not put the value in git or netlify.toml.',
      ui_docs: 'https://docs.netlify.com/build/environment-variables/get-started/',
      api: 'POST https://api.netlify.com/api/v1/accounts/{account_id}/env (createEnvVars). Bind it to the site deployed by .github/workflows/netlify-deploy.yml. This checkout has no Netlify token, so it does not call that API.',
      canonical_hmac_keys: HMAC_KEYS,
      canonical_proof_keys: PROOF_KEYS,
      authorization_header: 'Bearer v1.<payload>.<hmac> or Ed25519 v1.<payload>.<sig>',
    },
  };
}

function readHeader(headers, name) {
  if (!headers) return '';
  const wanted = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === wanted) return headers[key] || '';
  }
  return '';
}

function rawBody(event) {
  if (!event.body) return '';
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
}

async function handleOpenClaim(event, dependencies) {
  const method = event.httpMethod || 'GET';
  const secret = dependencies.secret === undefined ? process.env.OPEN_OWNER_ROW_HMAC_SECRET : dependencies.secret;
  const signingConfigured = Boolean(secret);
  if (method === 'GET') {
    return json(200, { ok: true, ...configuration(signingConfigured) });
  }
  if (method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  const raw = rawBody(event);
  if (raw.length > 8192) return json(400, { ok: false, error: 'evidence_bounds' });
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }
  const header = readHeader(event.headers, 'authorization').trim();
  const now = dependencies.now ? dependencies.now() : Date.now();
  let actor;
  if (!header) return json(401, { ok: false, error: 'missing_auth' });
  if (header.startsWith('Bearer ')) {
    const verified = verifyHmac(secret, header.slice(7).trim(), {
      bodySha256: sha256(raw),
      now,
    });
    if (!verified.ok) {
      const payload = { ok: false, error: verified.error };
      if (verified.status === 503) payload.configuration = configuration(false).owner_configuration;
      return json(verified.status, payload);
    }
    actor = verified.actor;
  } else if (header.startsWith('Ed25519 ')) {
    const verified = verifyEd25519Proof(dependencies.actors, header.slice('Ed25519 '.length).trim(), {
      priority: body.priority,
      evidence: body.evidence === undefined ? '' : body.evidence,
      now,
    });
    if (!verified.ok) return json(verified.status, { ok: false, error: verified.error, reason: verified.reason });
    actor = verified.actor;
  } else {
    return json(401, { ok: false, error: 'invalid_auth' });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'actor') && body.actor !== actor) {
    return json(401, { ok: false, error: 'invalid_auth' });
  }
  const owner = ownerForPriority(dependencies.owners, body.priority);
  if (!owner) return json(400, { ok: false, error: 'priority_not_public' });
  const allowed = authorizeActor(dependencies.actors, actor, owner);
  if (!allowed.ok) return json(allowed.status, { ok: false, error: allowed.error, reason: allowed.reason });
  if (!Number.isInteger(body.expected_revision) || body.expected_revision < 0) {
    return json(409, { ok: false, error: 'revision_mismatch' });
  }
  const op = body.op;
  if (op !== 'claim' && op !== 'complete' && op !== 'release') return json(400, { ok: false, error: 'unknown_op' });
  if (op === 'complete') {
    const bounds = evidenceError(body.evidence);
    if (bounds) return json(400, { ok: false, error: bounds });
    if (typeof body.idempotency_key !== 'string' || !/^[A-Za-z0-9._:-]{1,80}$/.test(body.idempotency_key)) {
      return json(400, { ok: false, error: 'evidence_bounds' });
    }
  }
  const leaseSeconds = body.lease_seconds === undefined ? MAX_LEASE_SECONDS : body.lease_seconds;
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > MAX_LEASE_SECONDS) {
    return json(400, { ok: false, error: 'evidence_bounds' });
  }
  let store;
  try {
    store = dependencies.store || await dependencies.openStore(event);
  } catch {
    return json(503, { ok: false, error: 'blobs_unavailable' });
  }
  const result = await casUpdate(store, `priority:${body.priority}`, {
    op,
    priority: body.priority,
    owner,
    actor,
    expected_revision: body.expected_revision,
    evidence: body.evidence,
    lease_token: body.lease_token,
    lease_seconds: leaseSeconds,
    idempotency_key: body.idempotency_key,
    body_sha256: sha256(raw),
    new_token: crypto.randomBytes(16).toString('base64url'),
  }, now);
  const response = {
    ok: result.ok,
    error: result.error,
    priority: body.priority,
    owner,
    actor,
    mode: allowed.mode,
    revision: result.revision,
    idempotent: result.idempotent || false,
    lease_expires: result.lease_expires,
    git_delivery: 'not performed; company-todo-owner.yml opens a pull request and does not push main',
    live_company_todo_updated: false,
  };
  if (result.lease_token) response.lease_token = result.lease_token;
  if (result.evidence) response.evidence = result.evidence;
  return json(result.status, response);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

module.exports = {
  ENDPOINT_PATH,
  HMAC_KEYS,
  PROOF_KEYS,
  authorizeActor,
  casUpdate,
  configuration,
  evidenceError,
  handleOpenClaim,
  ownerForPriority,
  publicRow,
  reduceRow,
  sha256,
  signEd25519,
  signHmac,
  verifyEd25519Proof,
  verifyHmac,
};

if (require.main === module) {
  const command = process.argv[2];
  if (command !== 'verify-proof') process.exit(2);
  const actors = require('../../../scripts/open/row_actors.json');
  const result = verifyEd25519Proof(actors, process.env.PROOF || '', {
    priority: Number(process.env.PRIORITY),
    evidence: process.env.EVIDENCE || '',
    now: Date.now(),
  });
  if (!result.ok) {
    process.stderr.write(`${result.error}\n`);
    process.exit(1);
  }
  process.stdout.write(result.actor);
}
