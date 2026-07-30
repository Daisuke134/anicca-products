"use strict";

/**
 * LM-SB-01 — machine-readable Self-Builder policy.
 *
 * Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
 *   §2  Trust boundary  (mutable surface vs immutable kernel)
 *   §10 Checker and automatic promotion (`auto_merge_if` contract + initial allowlist)
 *
 * Deliberately a plain JS module, not YAML: adding a YAML parser would add a runtime
 * dependency, and the policy engine is immutable kernel — it must be reviewable as code
 * and loadable with zero parsing surface.
 *
 * Every exported table is deep-frozen so a candidate that somehow gets `require()`d into
 * the promoter process still cannot widen its own allowlist at runtime.
 */

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

// --- spec §2: mutable by Self-Builder (left column, in spec row order) ---------------
const MUTABLE_SURFACES = deepFreeze([
  { id: "product_code_allowlisted_paths", mutable: true, spec: "§2" },
  { id: "prompt_skill_tool_description", mutable: true, spec: "§2" },
  { id: "retry_routing_context_selection", mutable: true, spec: "§2" },
  { id: "test_fixture_non_sealed_eval", mutable: true, spec: "§2" },
  { id: "feature_flag_canary_percentage", mutable: true, spec: "§2" },
  { id: "self_builder_worker_prompt", mutable: true, spec: "§2" },
  { id: "triage_threshold_candidate", mutable: true, spec: "§2" },
]);

// --- spec §2: immutable to Self-Builder (right column, in spec row order) ------------
const IMMUTABLE_KERNEL = deepFreeze([
  { id: "goal_constitution", mutable: false, spec: "§2" },
  { id: "secret_store", mutable: false, spec: "§2" },
  { id: "branch_protection", mutable: false, spec: "§2" },
  { id: "sealed_holdout_answers", mutable: false, spec: "§2" },
  { id: "promoter_credential", mutable: false, spec: "§2" },
  { id: "policy_engine", mutable: false, spec: "§2" },
  { id: "append_only_audit_history", mutable: false, spec: "§2" },
]);

// --- spec §10: 初期auto-merge allowlist (left column) --------------------------------
const AUTO_MERGE_ALLOWED_ISSUE_CLASSES = deepFreeze([
  "localized_bug_fix",
  "retry_timeout_within_cap",
  "tool_contract_parser",
  "non_sensitive_prompt_or_skill",
  "observability_instrumentation",
  "deterministic_test_or_fixture",
]);

// --- spec §10: Not auto-merged (right column) ----------------------------------------
const AUTO_MERGE_DENIED_ISSUE_CLASSES = deepFreeze([
  "auth",
  "billing",
  "wallet",
  "db_migration",
  "permission_expansion",
  "safe_t_policy",
  "secret_handling",
  "promoter_or_policy_kernel",
]);

/**
 * spec §10 `auto_merge_if:` — key order mirrors the YAML block verbatim.
 * `source` says where the value comes from:
 *   "candidate" = supplied by the Issue/PR metadata
 *   "checks"    = supplied by the Checker as a non-LLM signal
 *   "derived"   = computed deterministically from paths_touched (never self-reported)
 */
const AUTO_MERGE_CONTRACT = deepFreeze({
  issue_class: { expected: "allowlisted", source: "candidate", deny_reason: "issue_class_not_allowlisted" },
  risk: { expected: "low", source: "candidate", deny_reason: "risk_not_low" },
  reproduction_baseline: { expected: "fail", source: "checks", deny_reason: "reproduction_baseline_not_fail" },
  reproduction_candidate: { expected: "pass", source: "checks", deny_reason: "reproduction_candidate_not_pass" },
  required_checks: { expected: "pass", source: "checks", deny_reason: "required_checks_not_pass" },
  sealed_holdout_delta: { expected: ">= 0", source: "checks", deny_reason: "sealed_holdout_delta_negative" },
  security_regression: { expected: false, source: "checks", deny_reason: "security_regression" },
  sensitive_paths_touched: { expected: false, source: "derived", deny_reason: "sensitive_paths_touched" },
  permissions_expanded: { expected: false, source: "checks", deny_reason: "permissions_expanded" },
  migration_added: { expected: false, source: "derived", deny_reason: "migration_added" },
  cost_delta_percent: { expected: "<= 10", source: "checks", deny_reason: "cost_delta_exceeds_cap" },
  rollback_ready: { expected: true, source: "checks", deny_reason: "rollback_not_ready" },
  lineage_complete: { expected: true, source: "checks", deny_reason: "lineage_incomplete" },
});

const COST_DELTA_PERCENT_CAP = 10;

const KERNEL_SURFACE_IDS = deepFreeze(IMMUTABLE_KERNEL.map((s) => s.id));

function isKernelSurface(surfaceId) {
  return KERNEL_SURFACE_IDS.includes(surfaceId);
}

function isAllowlistedIssueClass(issueClass) {
  return AUTO_MERGE_ALLOWED_ISSUE_CLASSES.includes(issueClass);
}

function isDeniedIssueClass(issueClass) {
  return AUTO_MERGE_DENIED_ISSUE_CLASSES.includes(issueClass);
}

module.exports = {
  MUTABLE_SURFACES,
  IMMUTABLE_KERNEL,
  AUTO_MERGE_ALLOWED_ISSUE_CLASSES,
  AUTO_MERGE_DENIED_ISSUE_CLASSES,
  AUTO_MERGE_CONTRACT,
  COST_DELTA_PERCENT_CAP,
  isKernelSurface,
  isAllowlistedIssueClass,
  isDeniedIssueClass,
};
