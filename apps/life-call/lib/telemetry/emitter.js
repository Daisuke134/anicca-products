"use strict";

/**
 * LM-SB-02 — signal emitter.
 *
 * Two invariants, both load-bearing:
 *
 *  1. FAIL-OPEN. Telemetry must never be able to take down a wake call, a preflight or a
 *     travel block. Every path here is wrapped: `emit` returns a report and never throws,
 *     even if the sink explodes, the envelope has a throwing getter, or the error logger
 *     itself throws.
 *
 *  2. REDACTION GATE. Nothing is written unless `validateEnvelope` passes, so spec §16
 *     ("Raw PII enters signal -> redaction gate reject") holds at the write boundary and
 *     not merely at the call sites.
 *
 * The JSONL sink is the M1 transport. `createEmitter({ sink })` is the seam an OTLP
 * exporter drops into later without touching a single call site (spec §5.4 / OTel).
 *
 * Activation is explicit: `emitSignal` is a no-op unless `LM_TELEMETRY_JSONL` names a
 * path, mirroring how an OTel exporter stays inert without an endpoint. That keeps a
 * freshly deployed loop from writing files nobody asked for.
 */

const fs = require("node:fs");
const path = require("node:path");

const { createEnvelope, validateEnvelope } = require("./envelope.js");

const JSONL_PATH_ENV = "LM_TELEMETRY_JSONL";

function report(emitted, errors) {
  return Object.freeze({ emitted, errors: Object.freeze([...errors]) });
}

/** Append-only JSONL sink. Creates parent directories on first write. */
function jsonlSink(filePath) {
  return function write(line) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    fs.appendFileSync(filePath, `${line}\n`, "utf8");
  };
}

function createEmitter({ sink, validate = validateEnvelope, build = createEnvelope, onError } = {}) {
  function notify(error) {
    if (typeof onError !== "function") return;
    try { onError(error); } catch { /* fail-open: a broken logger must not break the loop */ }
  }

  function emit(fields) {
    let envelope;
    let line;
    try {
      envelope = build(fields);
      const verdict = validate(envelope);
      if (!verdict.valid) return report(false, verdict.errors);
      line = JSON.stringify(envelope);
      if (typeof line !== "string") return report(false, ["serialize_failed"]);
    } catch (error) {
      notify(error);
      return report(false, ["build_failed"]);
    }

    if (typeof sink !== "function") return report(false, ["telemetry_disabled"]);

    try {
      sink(line);
      return report(true, []);
    } catch (error) {
      notify(error);
      return report(false, ["sink_failed"]);
    }
  }

  return Object.freeze({ emit });
}

/**
 * Production entry point used by the five Life Manager loops.
 * Never throws, whatever it is handed.
 */
function emitSignal(fields, options) {
  try {
    const opts = options && typeof options === "object" ? options : {};
    const env = opts.env && typeof opts.env === "object" ? opts.env : process.env;
    const filePath = typeof env[JSONL_PATH_ENV] === "string" ? env[JSONL_PATH_ENV].trim() : "";
    const sink = typeof opts.sink === "function" ? opts.sink : (filePath === "" ? undefined : jsonlSink(filePath));
    if (typeof sink !== "function") return report(false, ["telemetry_disabled"]);
    return createEmitter({ sink }).emit(fields);
  } catch {
    return report(false, ["emit_failed"]);
  }
}

module.exports = { createEmitter, jsonlSink, emitSignal, JSONL_PATH_ENV };
