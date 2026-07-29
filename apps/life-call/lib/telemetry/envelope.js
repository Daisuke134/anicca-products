"use strict";

/**
 * LM-SB-02 — the common signal envelope every Life Manager loop emits.
 *
 * Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
 *   §5.2 common signal envelope
 *   §5.4 multi-tenant collection policy ("tenant identity = stable pseudonymous hash",
 *        "raw prompt / Telegram / calendar / location / health data: default export禁止")
 *   §16  "Raw PII enters signal -> redaction gate reject"
 *
 * Design rules:
 *  - CLOSED schema. An unknown key is an error, so a raw payload can never ride along
 *    inside a field nobody reviewed.
 *  - Every identifier field is charset-locked to `[a-z0-9_.:-]`, which structurally makes
 *    an email or a spaced phone number unrepresentable. The PII scan is a second,
 *    independent gate (defence in depth), not the only one.
 *  - Pure: no clock, no randomness, no I/O unless the caller injects it.
 */

const crypto = require("node:crypto");

const REQUIRED_FIELDS = Object.freeze([
  "signal_id",
  "source",
  "observed_at",
  "trace_id",
  "run_id",
  "tenant_ref",
  "graph_version",
  "node",
  "tool",
  "status",
  "failure_class",
  "latency_ms",
  "effect_id",
  "privacy",
]);

const OPTIONAL_FIELDS = Object.freeze(["code_version", "severity", "payload_ref"]);

/** Closed status enum. `denied` covers a policy refusal (spec §17 "policy deny"). */
const STATUSES = Object.freeze(["ok", "failure", "timeout", "denied", "skipped"]);

/** Statuses for which `failure_class` must be null. */
const SUCCESS_STATUSES = Object.freeze(["ok", "skipped"]);

const ALLOWED_FIELDS = Object.freeze([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
const PRIVACY_FIELDS = Object.freeze(["raw_retained", "redaction_version"]);

const TENANT_REF_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_.:-]{0,127}$/;
const REFERENCE_PATTERN = /^(?:receipt|artifact):\/\/[\x21-\x7e]+$/;
const REDACTION_VERSION_PATTERN = /^v[0-9]+(?:\.[0-9]+)?$/;

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// A phone candidate: a digit run (optionally punctuated) not glued to letters or other
// digits. Long hex references are masked out first so a sha256 pseudonym whose leading
// bytes happen to be decimal digits is never mistaken for a phone number.
const PHONE_CANDIDATE_PATTERN = /(?<![0-9A-Za-z])[+(]?[0-9][0-9\s().+-]{7,}[0-9](?![0-9A-Za-z])/g;
const LONG_HEX_PATTERN = /[0-9a-f]{32,}/gi;

const IDENTIFIER_FIELDS = Object.freeze([
  "signal_id",
  "source",
  "trace_id",
  "run_id",
  "graph_version",
  "node",
  "tool",
  "code_version",
]);

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Stable pseudonymous tenant reference (spec §5.4). The salt keeps the mapping
 * un-invertible across environments; the same (id, salt) always yields the same ref so
 * clusters can be counted per tenant without ever storing who the tenant is.
 */
function tenantRef(rawTenantId, salt) {
  if (typeof rawTenantId !== "string" || rawTenantId.trim() === "") {
    throw new Error("tenant id required to build a tenant_ref");
  }
  const effectiveSalt = typeof salt === "string" && salt !== "" ? salt : "life-manager";
  const digest = crypto.createHash("sha256").update(`${effectiveSalt}:${rawTenantId}`).digest("hex");
  return `sha256:${digest}`;
}

/**
 * Call-site safe form of `tenantRef`. Product loops build the envelope inline, so an
 * argument expression that throws would escape the emitter's fail-open boundary. Returning
 * null instead means a signal with no resolvable tenant is DROPPED by the redaction gate
 * rather than faked or crashed — never silently attributed to someone else.
 */
function safeTenantRef(rawTenantId, salt) {
  try {
    return tenantRef(rawTenantId, salt);
  } catch {
    return null;
  }
}

/**
 * Version of the agent graph these signals were produced by (spec §5.2 `graph_version`,
 * §5.4 aggregation unit `release × graph_version × model × tool × failure_class`).
 * Bump when the loop topology changes, so before/after clusters are never averaged together.
 */
const GRAPH_VERSION = "lm.v1";

/**
 * Pseudonym for fleet-level signals that belong to the service rather than to any tenant
 * (e.g. the daily preflight). `tenant_ref` stays non-null so the field is never optional
 * and no aggregation query has to special-case a missing tenant.
 */
const SERVICE_TENANT_REF = tenantRef("service:life-manager");

/**
 * Correlation reference for trace/run ids. Hashing is not decoration: it is the only way a
 * call site can correlate signals without ever putting a raw uid or event key into
 * telemetry (spec §5.4 "tenant identity: stable pseudonymous hash").
 * Never throws — a telemetry helper must not be able to break a product loop.
 */
function correlationRef(prefix, ...parts) {
  const safePrefix = String(prefix === undefined || prefix === null ? "ref" : prefix)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8) || "ref";
  const material = parts.map((part) => (part === undefined || part === null ? "" : String(part))).join("|");
  const digest = crypto.createHash("sha256").update(material).digest("hex").slice(0, 32);
  return `${safePrefix}_${digest}`;
}

function containsEmail(text) {
  return EMAIL_PATTERN.test(text);
}

function containsPhone(text) {
  const masked = String(text).replace(LONG_HEX_PATTERN, "<hex>");
  PHONE_CANDIDATE_PATTERN.lastIndex = 0;
  for (const match of masked.matchAll(PHONE_CANDIDATE_PATTERN)) {
    const digits = match[0].replace(/[^0-9]/g, "");
    if (digits.length >= 10 && digits.length <= 15) return true;
  }
  return false;
}

function collectStrings(value, out) {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) collectStrings(value[key], out);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  }
}

function scanForPii(envelope, errors) {
  const strings = [];
  collectStrings(envelope, strings);
  if (strings.some(containsEmail)) errors.push("pii_detected:email");
  if (strings.some(containsPhone)) errors.push("pii_detected:phone");
}

function validateIdentifierFields(envelope, errors) {
  for (const field of IDENTIFIER_FIELDS) {
    if (!hasOwn(envelope, field)) continue;
    const value = envelope[field];
    if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) errors.push(`invalid:${field}`);
  }
}

function validateStatusAndFailureClass(envelope, errors) {
  const status = envelope.status;
  if (!STATUSES.includes(status)) errors.push("invalid:status");

  if (!hasOwn(envelope, "failure_class")) return;
  const failureClass = envelope.failure_class;
  const isSuccess = SUCCESS_STATUSES.includes(status);
  if (isSuccess) {
    if (failureClass !== null) errors.push("failure_class_unexpected");
    return;
  }
  if (failureClass === null || failureClass === undefined) {
    errors.push("failure_class_required");
    return;
  }
  if (typeof failureClass !== "string" || !IDENTIFIER_PATTERN.test(failureClass)) {
    errors.push("invalid:failure_class");
  }
}

function validatePrivacy(envelope, errors) {
  if (!hasOwn(envelope, "privacy")) return;
  const privacy = envelope.privacy;
  if (!isPlainObject(privacy)) {
    errors.push("invalid:privacy");
    return;
  }
  for (const key of Object.keys(privacy)) {
    if (!PRIVACY_FIELDS.includes(key)) errors.push(`unknown_field:privacy.${key}`);
  }
  if (privacy.raw_retained !== false) errors.push("raw_retained_forbidden");
  if (typeof privacy.redaction_version !== "string" || !REDACTION_VERSION_PATTERN.test(privacy.redaction_version)) {
    errors.push("invalid:privacy.redaction_version");
  }
}

function validateOptional(envelope, errors) {
  if (hasOwn(envelope, "severity")) {
    const severity = envelope.severity;
    if (typeof severity !== "number" || !Number.isFinite(severity) || severity < 0 || severity > 1) {
      errors.push("invalid:severity");
    }
  }
  if (hasOwn(envelope, "payload_ref")) {
    const ref = envelope.payload_ref;
    if (ref !== null && (typeof ref !== "string" || !REFERENCE_PATTERN.test(ref))) {
      errors.push("invalid:payload_ref");
    }
  }
}

function result(errors) {
  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze([...new Set(errors)].sort()),
  });
}

/**
 * @returns frozen { valid: boolean, errors: string[] } — never throws, never mutates.
 */
function validateEnvelope(envelope) {
  if (!isPlainObject(envelope)) return result(["envelope_not_object"]);

  const errors = [];

  for (const field of Object.keys(envelope)) {
    if (!ALLOWED_FIELDS.includes(field)) errors.push(`unknown_field:${field}`);
  }
  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(envelope, field)) errors.push(`missing_field:${field}`);
  }

  validateIdentifierFields(envelope, errors);

  if (hasOwn(envelope, "tenant_ref")) {
    const ref = envelope.tenant_ref;
    if (typeof ref !== "string" || !TENANT_REF_PATTERN.test(ref)) errors.push("tenant_ref_not_hashed");
  }

  if (hasOwn(envelope, "observed_at")) {
    const observedAt = envelope.observed_at;
    const isIso = typeof observedAt === "string"
      && !Number.isNaN(Date.parse(observedAt))
      && new Date(observedAt).toISOString() === observedAt;
    if (!isIso) errors.push("invalid:observed_at");
  }

  if (hasOwn(envelope, "latency_ms")) {
    const latency = envelope.latency_ms;
    if (typeof latency !== "number" || !Number.isFinite(latency) || latency < 0) errors.push("invalid:latency_ms");
  }

  if (hasOwn(envelope, "effect_id")) {
    const effectId = envelope.effect_id;
    if (effectId !== null && (typeof effectId !== "string" || !REFERENCE_PATTERN.test(effectId))) {
      errors.push("invalid:effect_id");
    }
  }

  validateStatusAndFailureClass(envelope, errors);
  validatePrivacy(envelope, errors);
  validateOptional(envelope, errors);
  scanForPii(envelope, errors);

  return result(errors);
}

const DEFAULT_PRIVACY = Object.freeze({ raw_retained: false, redaction_version: "v1" });

/**
 * Build a §5.2 envelope. Pure when `deps` is injected. Unknown keys are preserved on
 * purpose so `validateEnvelope` can reject them loudly instead of silently dropping a
 * field a caller believed was being recorded.
 */
function createEnvelope(fields, deps = {}) {
  const source = isPlainObject(fields) ? fields : {};
  const now = typeof deps.now === "function" ? deps.now : Date.now;
  const randomId = typeof deps.randomId === "function"
    ? deps.randomId
    : () => crypto.randomBytes(8).toString("hex");

  const envelope = { ...source };
  if (!hasOwn(envelope, "signal_id")) envelope.signal_id = `sig_${randomId()}`;
  if (!hasOwn(envelope, "observed_at")) envelope.observed_at = new Date(now()).toISOString();
  if (!hasOwn(envelope, "failure_class")) envelope.failure_class = null;
  if (!hasOwn(envelope, "effect_id")) envelope.effect_id = null;
  if (!hasOwn(envelope, "privacy")) envelope.privacy = { ...DEFAULT_PRIVACY };

  // Stable key order keeps the JSONL diffable.
  const ordered = {};
  for (const field of ALLOWED_FIELDS) {
    if (hasOwn(envelope, field)) ordered[field] = envelope[field];
  }
  for (const field of Object.keys(envelope)) {
    if (!hasOwn(ordered, field)) ordered[field] = envelope[field];
  }
  return deepFreeze(ordered);
}

module.exports = {
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  ALLOWED_FIELDS,
  STATUSES,
  SUCCESS_STATUSES,
  TENANT_REF_PATTERN,
  GRAPH_VERSION,
  SERVICE_TENANT_REF,
  createEnvelope,
  validateEnvelope,
  tenantRef,
  safeTenantRef,
  correlationRef,
};
