"use strict";

// RED-first contract test for LM-SB-01.
// Fixtures mirror spec §10 "Automatic merge contract" + "初期auto-merge allowlist" table
// (docs/loop-engineering/51-life-manager-builds-life-manager.md) 1:1, and spec §2 trust boundary.

const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluate } = require("./evaluate.js");
const {
  IMMUTABLE_KERNEL,
  MUTABLE_SURFACES,
  AUTO_MERGE_ALLOWED_ISSUE_CLASSES,
  AUTO_MERGE_DENIED_ISSUE_CLASSES,
  AUTO_MERGE_CONTRACT,
  isKernelSurface,
} = require("./policy.js");
const {
  sensitivePathsTouched,
  kernelPathsTouched,
  migrationPathsTouched,
  matchesGlob,
} = require("./sensitive-paths.js");

// ---------------------------------------------------------------------------
// fixture builders (every field required by AUTO_MERGE_CONTRACT is explicit)
// ---------------------------------------------------------------------------

function passingChecks(over = {}) {
  return {
    reproduction_baseline: "fail",
    reproduction_candidate: "pass",
    required_checks: "pass",
    sealed_holdout_delta: 0,
    security_regression: false,
    permissions_expanded: false,
    cost_delta_percent: 4,
    rollback_ready: true,
    lineage_complete: true,
    ...over,
  };
}

function candidate(over = {}) {
  const paths = over.paths_touched || ["apps/life-call/lib/travel.js"];
  return {
    issue_class: "localized_bug_fix",
    risk: "low",
    paths_touched: paths,
    diff_stats: { files_changed: paths.length, insertions: 8, deletions: 3 },
    checks: passingChecks(),
    ...over,
  };
}

// ---------------------------------------------------------------------------
// spec §2 trust boundary
// ---------------------------------------------------------------------------

test("spec §2: every immutable kernel surface is mutable:false and self-edit denied", () => {
  const ids = IMMUTABLE_KERNEL.map((s) => s.id);
  assert.deepEqual(ids, [
    "goal_constitution",
    "secret_store",
    "branch_protection",
    "sealed_holdout_answers",
    "promoter_credential",
    "policy_engine",
    "append_only_audit_history",
  ]);
  for (const surface of IMMUTABLE_KERNEL) {
    assert.equal(surface.mutable, false, `${surface.id} must be immutable`);
    assert.equal(isKernelSurface(surface.id), true);
  }
});

test("spec §2: mutable surfaces are mutable:true and are not kernel", () => {
  const ids = MUTABLE_SURFACES.map((s) => s.id);
  assert.deepEqual(ids, [
    "product_code_allowlisted_paths",
    "prompt_skill_tool_description",
    "retry_routing_context_selection",
    "test_fixture_non_sealed_eval",
    "feature_flag_canary_percentage",
    "self_builder_worker_prompt",
    "triage_threshold_candidate",
  ]);
  for (const surface of MUTABLE_SURFACES) {
    assert.equal(surface.mutable, true, `${surface.id} must be mutable`);
    assert.equal(isKernelSurface(surface.id), false);
  }
});

test("spec §10: auto_merge_if contract keys are represented verbatim", () => {
  assert.deepEqual(Object.keys(AUTO_MERGE_CONTRACT), [
    "issue_class",
    "risk",
    "reproduction_baseline",
    "reproduction_candidate",
    "required_checks",
    "sealed_holdout_delta",
    "security_regression",
    "sensitive_paths_touched",
    "permissions_expanded",
    "migration_added",
    "cost_delta_percent",
    "rollback_ready",
    "lineage_complete",
  ]);
});

// ---------------------------------------------------------------------------
// ALLOW fixtures — spec §10 "初期auto-merge allowlist" left column (6 rows)
// ---------------------------------------------------------------------------

test("allow 1/6 — localized bug fix in a non-sensitive product path", () => {
  const result = evaluate(candidate({ issue_class: "localized_bug_fix" }));
  assert.deepEqual(result, { merge: true, reason: ["auto_merge_contract_satisfied"] });
});

test("allow 2/6 — retry/timeout change within cap", () => {
  const result = evaluate(candidate({
    issue_class: "retry_timeout_within_cap",
    paths_touched: ["apps/life-call/lib/dial.js"],
  }));
  assert.equal(result.merge, true);
});

test("allow 3/6 — tool contract parser fix", () => {
  const result = evaluate(candidate({
    issue_class: "tool_contract_parser",
    paths_touched: ["apps/life-call/lib/calendar-interpreter.js"],
  }));
  assert.equal(result.merge, true);
});

test("allow 4/6 — non-sensitive prompt/skill wording", () => {
  const result = evaluate(candidate({
    issue_class: "non_sensitive_prompt_or_skill",
    paths_touched: ["apps/life-call/skill-life-manager/SKILL.md"],
  }));
  assert.equal(result.merge, true);
});

test("allow 5/6 — observability instrumentation", () => {
  const result = evaluate(candidate({
    issue_class: "observability_instrumentation",
    paths_touched: ["apps/life-call/lib/telemetry/emitter.js"],
  }));
  assert.equal(result.merge, true);
});

test("allow 6/6 — deterministic test/fixture addition", () => {
  const result = evaluate(candidate({
    issue_class: "deterministic_test_or_fixture",
    paths_touched: ["apps/life-call/lib/travel.test.js", "apps/life-call/lib/wake-filter.test.js"],
  }));
  assert.equal(result.merge, true);
});

// ---------------------------------------------------------------------------
// DENY fixtures — spec §10 right column (6 rows) + §16 "Maker changes auth path"
// ---------------------------------------------------------------------------

test("deny 1/6 — auth / billing / wallet", () => {
  const auth = evaluate(candidate({
    issue_class: "auth",
    paths_touched: ["apps/life-call/lib/panel-auth.js"],
  }));
  assert.equal(auth.merge, false);
  assert.ok(auth.reason.includes("issue_class_explicitly_denied"));
  assert.ok(auth.reason.includes("sensitive_paths_touched"));

  for (const issueClass of ["billing", "wallet"]) {
    assert.equal(evaluate(candidate({ issue_class: issueClass })).merge, false);
  }

  // §16: "Maker changes auth path -> policy reject" even under an allowlisted class.
  const sneaky = evaluate(candidate({
    issue_class: "localized_bug_fix",
    paths_touched: ["apps/life-call/lib/panel-auth.js"],
  }));
  assert.equal(sneaky.merge, false);
  assert.deepEqual(sneaky.reason, ["sensitive_paths_touched"]);
});

test("deny 2/6 — DB migration", () => {
  const byPath = evaluate(candidate({
    issue_class: "localized_bug_fix",
    paths_touched: ["apps/life-call/migrations/2026-07-30-whatever.sql"],
  }));
  assert.equal(byPath.merge, false);
  assert.ok(byPath.reason.includes("migration_added"));
  assert.ok(byPath.reason.includes("sensitive_paths_touched"));

  assert.equal(evaluate(candidate({ issue_class: "db_migration" })).merge, false);
});

test("deny 3/6 — permission expansion", () => {
  const result = evaluate(candidate({ checks: passingChecks({ permissions_expanded: true }) }));
  assert.equal(result.merge, false);
  assert.deepEqual(result.reason, ["permissions_expanded"]);

  assert.equal(evaluate(candidate({ issue_class: "permission_expansion" })).merge, false);
});

test("deny 4/6 — SAFE-T policy", () => {
  const result = evaluate(candidate({ issue_class: "safe_t_policy" }));
  assert.equal(result.merge, false);
  assert.ok(result.reason.includes("issue_class_explicitly_denied"));
});

test("deny 5/6 — secret handling", () => {
  const byClass = evaluate(candidate({ issue_class: "secret_handling" }));
  assert.equal(byClass.merge, false);

  const byPath = evaluate(candidate({
    issue_class: "localized_bug_fix",
    paths_touched: ["apps/life-call/lib/reply-token.js"],
  }));
  assert.equal(byPath.merge, false);
  assert.ok(byPath.reason.includes("sensitive_paths_touched"));
});

test("deny 6/6 — promoter / policy kernel (spec §12 kernel self-edit)", () => {
  const byClass = evaluate(candidate({ issue_class: "promoter_or_policy_kernel" }));
  assert.equal(byClass.merge, false);

  const byPath = evaluate(candidate({
    issue_class: "localized_bug_fix",
    paths_touched: ["apps/self-builder/policy/evaluate.js"],
  }));
  assert.equal(byPath.merge, false);
  assert.ok(byPath.reason.includes("kernel_path_touched"));
});

// ---------------------------------------------------------------------------
// remaining auto_merge_if conditions (one deny per condition, fail-closed)
// ---------------------------------------------------------------------------

test("each auto_merge_if condition denies independently", () => {
  const cases = [
    [{ risk: "medium" }, "risk_not_low"],
    [{ issue_class: "unknown_thing" }, "issue_class_not_allowlisted"],
    [{ checks: passingChecks({ reproduction_baseline: "pass" }) }, "reproduction_baseline_not_fail"],
    [{ checks: passingChecks({ reproduction_candidate: "fail" }) }, "reproduction_candidate_not_pass"],
    [{ checks: passingChecks({ required_checks: "fail" }) }, "required_checks_not_pass"],
    [{ checks: passingChecks({ sealed_holdout_delta: -0.01 }) }, "sealed_holdout_delta_negative"],
    [{ checks: passingChecks({ security_regression: true }) }, "security_regression"],
    [{ checks: passingChecks({ cost_delta_percent: 10.1 }) }, "cost_delta_exceeds_cap"],
    [{ checks: passingChecks({ rollback_ready: false }) }, "rollback_not_ready"],
    [{ checks: passingChecks({ lineage_complete: false }) }, "lineage_incomplete"],
  ];
  for (const [over, expectedReason] of cases) {
    const result = evaluate(candidate(over));
    assert.equal(result.merge, false, `${expectedReason} must deny`);
    assert.deepEqual(result.reason, [expectedReason]);
  }
});

test("cost_delta_percent boundary: exactly 10 percent is allowed, above is not", () => {
  assert.equal(evaluate(candidate({ checks: passingChecks({ cost_delta_percent: 10 }) })).merge, true);
  assert.equal(evaluate(candidate({ checks: passingChecks({ cost_delta_percent: 11 }) })).merge, false);
});

test("sealed_holdout_delta boundary: zero allowed, negative denied", () => {
  assert.equal(evaluate(candidate({ checks: passingChecks({ sealed_holdout_delta: 0 }) })).merge, true);
  assert.equal(evaluate(candidate({ checks: passingChecks({ sealed_holdout_delta: -1 }) })).merge, false);
});

test("fail-closed: missing candidate, missing checks, empty diff and malformed values all deny", () => {
  for (const bad of [
    undefined,
    null,
    {},
    candidate({ checks: undefined }),
    candidate({ checks: passingChecks({ rollback_ready: undefined }) }),
    candidate({ checks: passingChecks({ cost_delta_percent: "cheap" }) }),
    candidate({ checks: passingChecks({ sealed_holdout_delta: Number.NaN }) }),
    candidate({ paths_touched: [] }),
    candidate({ paths_touched: "apps/life-call/lib/travel.js" }),
    candidate({ risk: undefined }),
    candidate({ issue_class: undefined }),
  ]) {
    const result = evaluate(bad);
    assert.equal(result.merge, false, `must deny: ${JSON.stringify(bad)}`);
    assert.ok(result.reason.length > 0, "deny must always carry at least one reason");
  }
});

test("diff_stats must agree with paths_touched (anti under-reporting)", () => {
  const result = evaluate(candidate({
    paths_touched: ["apps/life-call/lib/travel.js"],
    diff_stats: { files_changed: 4, insertions: 900, deletions: 0 },
  }));
  assert.equal(result.merge, false);
  assert.deepEqual(result.reason, ["diff_stats_inconsistent_with_paths"]);
});

// ---------------------------------------------------------------------------
// purity / determinism
// ---------------------------------------------------------------------------

test("evaluate is pure: input is never mutated and output is deterministic and sorted", () => {
  const input = candidate({
    issue_class: "auth",
    paths_touched: ["apps/life-call/migrations/x.sql", "apps/self-builder/policy/policy.js"],
    checks: passingChecks({ security_regression: true, rollback_ready: false }),
  });
  input.diff_stats.files_changed = 2;
  const snapshot = JSON.stringify(input);

  const first = evaluate(input);
  const second = evaluate(input);

  assert.equal(JSON.stringify(input), snapshot, "evaluate must not mutate its input");
  assert.deepEqual(first, second, "evaluate must be deterministic");
  assert.deepEqual(first.reason, [...first.reason].sort(), "reasons must be sorted");
  assert.equal(first.merge, false);
  assert.equal(Object.isFrozen(first), true, "result must be frozen");
  assert.equal(Object.isFrozen(first.reason), true, "reason list must be frozen");
});

test("policy tables are frozen so a candidate cannot widen the allowlist at runtime", () => {
  assert.equal(Object.isFrozen(AUTO_MERGE_ALLOWED_ISSUE_CLASSES), true);
  assert.equal(Object.isFrozen(AUTO_MERGE_DENIED_ISSUE_CLASSES), true);
  assert.equal(Object.isFrozen(IMMUTABLE_KERNEL), true);
  assert.equal(Object.isFrozen(AUTO_MERGE_CONTRACT), true);
  assert.throws(() => { AUTO_MERGE_ALLOWED_ISSUE_CLASSES.push("auth"); });
  assert.equal(AUTO_MERGE_ALLOWED_ISSUE_CLASSES.includes("auth"), false);
});

test("allow and deny issue class lists are disjoint and cover the spec §10 table", () => {
  assert.deepEqual([...AUTO_MERGE_ALLOWED_ISSUE_CLASSES], [
    "localized_bug_fix",
    "retry_timeout_within_cap",
    "tool_contract_parser",
    "non_sensitive_prompt_or_skill",
    "observability_instrumentation",
    "deterministic_test_or_fixture",
  ]);
  assert.deepEqual([...AUTO_MERGE_DENIED_ISSUE_CLASSES], [
    "auth",
    "billing",
    "wallet",
    "db_migration",
    "permission_expansion",
    "safe_t_policy",
    "secret_handling",
    "promoter_or_policy_kernel",
  ]);
  for (const cls of AUTO_MERGE_DENIED_ISSUE_CLASSES) {
    assert.equal(AUTO_MERGE_ALLOWED_ISSUE_CLASSES.includes(cls), false);
  }
});

// ---------------------------------------------------------------------------
// sensitive path matching
// ---------------------------------------------------------------------------

test("glob matcher handles globstar, single star and literal paths without a dependency", () => {
  assert.equal(matchesGlob("apps/life-call/lib/billing.js", "apps/life-call/lib/billing.js"), true);
  assert.equal(matchesGlob("apps/life-call/lib/billing.js", "apps/life-call/lib/billing.test.js"), false);
  assert.equal(matchesGlob("**/migrations/**", "apps/life-call/migrations/a.sql"), true);
  assert.equal(matchesGlob("**/migrations/**", "migrations/a.sql"), true);
  assert.equal(matchesGlob("**/migrations/**", "apps/life-call/lib/migrations.js"), false);
  assert.equal(matchesGlob("**/*.sql", "apps/self-builder/migrations/x.sql"), true);
  assert.equal(matchesGlob("apps/life-call/lib/*.js", "apps/life-call/lib/transport/mail-resend.js"), false);
  assert.equal(matchesGlob("**/.env*", "apps/life-call/.env.production"), true);
});

test("sensitive, kernel and migration path detection use real repository paths", () => {
  assert.deepEqual(sensitivePathsTouched(["apps/life-call/lib/billing.js"]), ["apps/life-call/lib/billing.js"]);
  assert.deepEqual(sensitivePathsTouched(["apps/life-call/lib/travel.js"]), []);
  assert.deepEqual(sensitivePathsTouched(["apps/life-call/lib/money-path.js"]), ["apps/life-call/lib/money-path.js"]);
  assert.deepEqual(sensitivePathsTouched(["apps/life-call/lib/telnyx-webhook.js"]), ["apps/life-call/lib/telnyx-webhook.js"]);
  assert.deepEqual(sensitivePathsTouched([".github/workflows/life-call-eval.yml"]), [".github/workflows/life-call-eval.yml"]);

  assert.deepEqual(kernelPathsTouched(["apps/self-builder/policy/policy.js"]), ["apps/self-builder/policy/policy.js"]);
  assert.deepEqual(kernelPathsTouched(["apps/life-call/lib/travel.js"]), []);

  assert.deepEqual(
    migrationPathsTouched(["apps/self-builder/migrations/2026-07-30-self-builder-core.sql"]),
    ["apps/self-builder/migrations/2026-07-30-self-builder-core.sql"],
  );
  assert.deepEqual(migrationPathsTouched(["apps/life-call/lib/travel.js"]), []);
});

test("path detectors are pure and tolerate junk entries", () => {
  const input = ["apps/life-call/lib/billing.js", "apps/life-call/lib/travel.js"];
  const snapshot = [...input];
  sensitivePathsTouched(input);
  assert.deepEqual(input, snapshot);
  assert.deepEqual(sensitivePathsTouched([null, undefined, 42, ""]), []);
  assert.deepEqual(sensitivePathsTouched(undefined), []);
});
