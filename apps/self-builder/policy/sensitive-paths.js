"use strict";

/**
 * LM-SB-01 — deterministic path classification.
 *
 * Spec §10 `auto_merge_if.sensitive_paths_touched: false` / `migration_added: false`.
 * These two conditions are NEVER self-reported by the Maker; they are derived here from
 * the diff's path list so a candidate cannot hide an auth edit behind a benign label
 * (spec §16 "Maker changes auth path -> policy reject").
 *
 * No dependency: a small glob subset (`**`, `*`, `?`) is compiled to RegExp.
 */

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/**
 * Immutable kernel paths (spec §2). A Self-Builder candidate touching these is
 * shadow-only: direct promotion is denied regardless of issue_class.
 */
const KERNEL_PATH_PATTERNS = deepFreeze([
  "apps/self-builder/policy/**",
  "apps/self-builder/promoter/**",
  "apps/self-builder/migrations/**",
  "apps/self-builder/eval/sealed/**",
  "**/CONSTITUTION.md",
  "**/SOUL.md",
  ".github/workflows/**",
  "**/branch-protection*",
]);

/** Any migration is out of the auto-merge allowlist (spec §10 "DB migration"). */
const MIGRATION_PATH_PATTERNS = deepFreeze([
  "**/migrations/**",
  "**/*.sql",
  "**/prisma/schema.prisma",
]);

/**
 * Sensitive product paths: auth, billing, wallet, secret handling (spec §10 right column).
 * Verified to exist in this repository at authoring time; a pattern that stops matching
 * anything is safe (fail-closed direction is "more denies", never fewer).
 */
const SENSITIVE_PATH_PATTERNS = deepFreeze([
  // auth / session / signature verification
  "apps/life-call/lib/panel-auth.js",
  "apps/life-call/lib/panel-zero-link*",
  "apps/life-call/lib/telnyx-webhook.js",
  "apps/life-call/lib/reply-token.js",
  // billing / wallet / money
  "apps/life-call/lib/billing.js",
  "apps/life-call/lib/money-path.js",
  "apps/life-call/lib/ledger.js",
  // secret handling / configuration
  "**/.env*",
  "**/secrets/**",
  "apps/life-call/railway.toml",
  "apps/life-call/nixpacks.toml",
  // migrations and kernel are also sensitive
  ...MIGRATION_PATH_PATTERNS,
  ...KERNEL_PATH_PATTERNS,
]);

const REGEX_SPECIALS = /[.+^${}()|[\]\\]/g;

function compileGlob(pattern) {
  let out = "";
  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === "*") {
      const isGlobstar = pattern[i + 1] === "*";
      if (isGlobstar) {
        if (pattern[i + 2] === "/") {
          out += "(?:[^/]*/)*"; // `**/` matches zero or more path segments
          i += 3;
          continue;
        }
        out += ".*";
        i += 2;
        continue;
      }
      out += "[^/]*";
      i += 1;
      continue;
    }
    if (char === "?") {
      out += "[^/]";
      i += 1;
      continue;
    }
    out += char.replace(REGEX_SPECIALS, "\\$&");
    i += 1;
  }
  return new RegExp(`^${out}$`);
}

const globCache = new Map();

function matchesGlob(pattern, path) {
  if (typeof pattern !== "string" || typeof path !== "string" || path === "") return false;
  let regex = globCache.get(pattern);
  if (!regex) {
    regex = compileGlob(pattern);
    globCache.set(pattern, regex);
  }
  return regex.test(normalize(path));
}

function normalize(path) {
  return String(path).replace(/^\.\//, "");
}

function matchAny(patterns, paths) {
  if (!Array.isArray(paths)) return Object.freeze([]);
  const hits = paths.filter(
    (path) => typeof path === "string" && path !== "" && patterns.some((p) => matchesGlob(p, path)),
  );
  return Object.freeze([...hits]);
}

function sensitivePathsTouched(paths) {
  return matchAny(SENSITIVE_PATH_PATTERNS, paths);
}

function kernelPathsTouched(paths) {
  return matchAny(KERNEL_PATH_PATTERNS, paths);
}

function migrationPathsTouched(paths) {
  return matchAny(MIGRATION_PATH_PATTERNS, paths);
}

module.exports = {
  SENSITIVE_PATH_PATTERNS,
  KERNEL_PATH_PATTERNS,
  MIGRATION_PATH_PATTERNS,
  matchesGlob,
  sensitivePathsTouched,
  kernelPathsTouched,
  migrationPathsTouched,
};
