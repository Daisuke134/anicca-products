"use strict";

/**
 * LM-SB-01 — `evaluate(candidate)`: the deterministic promotion decision.
 *
 * Spec §10: "最終的なPASS/FAILを言えるのは non-LLM signal のみ" and the `auto_merge_if`
 * contract. This function contains no LLM call, no I/O, no clock and no randomness: the
 * same candidate always yields the same verdict, which is what makes it usable as a
 * required status check under GitHub branch protection.
 *
 * Contract:
 *   input  = { issue_class, risk, paths_touched: string[], diff_stats, checks }
 *   output = frozen { merge: boolean, reason: string[] }  (reason sorted, never empty on deny)
 *
 * Fail-closed: anything missing, malformed or unrecognised denies. A deny always carries
 * at least one machine-readable reason so `policy_decisions` (spec §6) can store it.
 */

const {
  AUTO_MERGE_CONTRACT,
  COST_DELTA_PERCENT_CAP,
  isAllowlistedIssueClass,
  isDeniedIssueClass,
} = require("./policy.js");
const {
  sensitivePathsTouched,
  kernelPathsTouched,
  migrationPathsTouched,
  canonicalizePath,
  isAllowlistedPath,
} = require("./sensitive-paths.js");

const SATISFIED = "auto_merge_contract_satisfied";

function deny(reasons) {
  return Object.freeze({
    merge: false,
    reason: Object.freeze([...new Set(reasons)].sort()),
  });
}

function allow() {
  return Object.freeze({ merge: true, reason: Object.freeze([SATISFIED]) });
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function evaluateIssueClass(candidate, reasons) {
  const issueClass = candidate.issue_class;
  if (isDeniedIssueClass(issueClass)) {
    reasons.push("issue_class_explicitly_denied");
    return;
  }
  if (!isAllowlistedIssueClass(issueClass)) {
    reasons.push(AUTO_MERGE_CONTRACT.issue_class.deny_reason);
  }
}

function evaluatePaths(candidate, reasons) {
  const paths = candidate.paths_touched;
  if (!Array.isArray(paths)) {
    reasons.push("paths_touched_invalid");
    return;
  }
  if (paths.length === 0) {
    reasons.push("no_paths_touched");
    return;
  }
  if (paths.some((path) => typeof path !== "string" || path.trim() === "")) {
    reasons.push("paths_touched_invalid");
    return;
  }

  // I1: strict canonical form or deny. A `./`, `..`, `//` or backslash shape is an evasion
  // attempt against the pattern matchers below, never a formatting quirk to forgive.
  if (paths.some((path) => canonicalizePath(path) === null)) {
    reasons.push("path_not_canonical");
    return;
  }

  // C3: positive allowlist (spec §2 "Product codeのallowlisted paths"). Every touched path
  // must be inside the mutable surface; anything else is un-mergeable however benign.
  if (paths.some((path) => !isAllowlistedPath(path))) {
    reasons.push("path_not_allowlisted");
  }

  // Derived, never self-reported (spec §16 "Maker changes auth path -> policy reject").
  if (kernelPathsTouched(paths).length > 0) reasons.push("kernel_path_touched");
  if (migrationPathsTouched(paths).length > 0) {
    reasons.push(AUTO_MERGE_CONTRACT.migration_added.deny_reason);
  }
  if (sensitivePathsTouched(paths).length > 0) {
    reasons.push(AUTO_MERGE_CONTRACT.sensitive_paths_touched.deny_reason);
  }

  const stats = candidate.diff_stats;
  if (stats === null || typeof stats !== "object") {
    reasons.push("diff_stats_missing");
    return;
  }
  if (!Number.isInteger(stats.files_changed) || stats.files_changed !== paths.length) {
    // Lineage integrity: an under-reported path list would let a sensitive edit slip past
    // the derived checks above.
    reasons.push("diff_stats_inconsistent_with_paths");
  }
}

function evaluateChecks(candidate, reasons) {
  const checks = candidate.checks;
  if (checks === null || typeof checks !== "object") {
    reasons.push("checks_missing");
    return;
  }

  if (checks.reproduction_baseline !== "fail") {
    reasons.push(AUTO_MERGE_CONTRACT.reproduction_baseline.deny_reason);
  }
  if (checks.reproduction_candidate !== "pass") {
    reasons.push(AUTO_MERGE_CONTRACT.reproduction_candidate.deny_reason);
  }
  if (checks.required_checks !== "pass") {
    reasons.push(AUTO_MERGE_CONTRACT.required_checks.deny_reason);
  }

  if (!isFiniteNumber(checks.sealed_holdout_delta)) {
    reasons.push("sealed_holdout_delta_invalid");
  } else if (checks.sealed_holdout_delta < 0) {
    reasons.push(AUTO_MERGE_CONTRACT.sealed_holdout_delta.deny_reason);
  }

  if (checks.security_regression !== false) {
    reasons.push(AUTO_MERGE_CONTRACT.security_regression.deny_reason);
  }
  if (checks.permissions_expanded !== false) {
    reasons.push(AUTO_MERGE_CONTRACT.permissions_expanded.deny_reason);
  }

  if (!isFiniteNumber(checks.cost_delta_percent)) {
    reasons.push("cost_delta_percent_invalid");
  } else if (checks.cost_delta_percent > COST_DELTA_PERCENT_CAP) {
    reasons.push(AUTO_MERGE_CONTRACT.cost_delta_percent.deny_reason);
  }

  if (checks.rollback_ready !== true) {
    reasons.push(AUTO_MERGE_CONTRACT.rollback_ready.deny_reason);
  }
  if (checks.lineage_complete !== true) {
    reasons.push(AUTO_MERGE_CONTRACT.lineage_complete.deny_reason);
  }
}

function evaluate(candidate) {
  if (candidate === null || typeof candidate !== "object") {
    return deny(["candidate_missing"]);
  }

  const reasons = [];
  evaluateIssueClass(candidate, reasons);
  if (candidate.risk !== "low") reasons.push(AUTO_MERGE_CONTRACT.risk.deny_reason);
  evaluatePaths(candidate, reasons);
  evaluateChecks(candidate, reasons);

  return reasons.length === 0 ? allow() : deny(reasons);
}

module.exports = { evaluate, SATISFIED };
