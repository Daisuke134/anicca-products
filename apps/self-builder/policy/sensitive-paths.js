"use strict";

/**
 * LM-SB-01 — deterministic path classification.
 *
 * Spec §10 `auto_merge_if.sensitive_paths_touched: false` / `migration_added: false`.
 * These two conditions are NEVER self-reported by the Maker; they are derived here from
 * the diff's path list so a candidate cannot hide an auth edit behind a benign label
 * (spec §16 "Maker changes auth path -> policy reject").
 *
 * TWO-SIDED MODEL (review C3): a path merges only if it is INSIDE the positive
 * MUTABLE_PATH_PATTERNS allowlist (spec §2 "Product codeのallowlisted paths") AND outside
 * the sensitive denylist. Denylist-only failed real review: apps/api auth routes, iOS
 * keychain code and everything the denylist author never imagined slipped through.
 *
 * CANONICAL PATHS ONLY (review I1): `./`, `..`, duplicate separators, backslashes,
 * absolute paths and trailing slashes are rejected outright by `canonicalizePath` — a
 * non-canonical path is treated as hostile input, never normalized into legitimacy.
 *
 * No dependency: a small glob subset (`**`, `*`, `?`) is compiled to RegExp.
 */

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/**
 * Positive mutable surface (spec §2 left column). Everything NOT matched here is
 * un-mergeable regardless of how harmless it looks. Deliberately narrow for M1: the
 * Life Manager product code, its tests/evals/scripts and its skill prompts. The apps/api
 * service, iOS app, infra, CI and the Self-Builder itself are all OUTSIDE the surface.
 */
const MUTABLE_PATH_PATTERNS = deepFreeze([
  "apps/life-call/lib/**",
  "apps/life-call/scheduler.js",
  "apps/life-call/test/**",
  "apps/life-call/test-support/**",
  "apps/life-call/eval/**",
  "apps/life-call/scripts/**",
  "apps/life-call/skill-life-manager/**",
]);

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
 * Two layers: literal pins for known-critical files (each verified to exist on disk by the
 * test suite — M5), plus name-based globs inside the mutable surface so a NEW auth/billing
 * file is born sensitive instead of born mergeable.
 */
const SENSITIVE_PATH_PATTERNS = deepFreeze([
  // auth / session / signature verification (literal pins)
  "apps/life-call/lib/panel-auth.js",
  "apps/life-call/lib/panel-zero-link*",
  "apps/life-call/lib/telnyx-webhook.js",
  "apps/life-call/lib/reply-token.js",
  // billing / wallet / money (literal pins)
  "apps/life-call/lib/billing.js",
  "apps/life-call/lib/money-path.js",
  "apps/life-call/lib/ledger.js",
  // name-based: anything auth/billing/wallet/secret/keychain-shaped inside the surface,
  // including their tests (a weakened billing test is a billing change)
  "apps/life-call/**/*auth*",
  "apps/life-call/**/*billing*",
  "apps/life-call/**/*wallet*",
  "apps/life-call/**/*secret*",
  "apps/life-call/**/*keychain*",
  "apps/life-call/**/*token*",
  // secret handling / configuration
  "**/.env*",
  "**/secrets/**",
  "apps/life-call/railway.toml",
  "apps/life-call/nixpacks.toml",
  // migrations and kernel are also sensitive
  ...MIGRATION_PATH_PATTERNS,
  ...KERNEL_PATH_PATTERNS,
]);

/**
 * Tracked files that MATCH a sensitive name pattern but are audited as safe to auto-merge.
 * Every entry needs a written justification; the git-ls-files walk test enforces that
 * everything suspicious is either denied or listed here. Empty on purpose.
 */
const ANNOTATED_SENSITIVE_EXCEPTIONS = deepFreeze([]);

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
  return regex.test(path);
}

/**
 * I1: strict canonical form or nothing. Returns the path unchanged when it is already
 * canonical, and null for EVERY other shape — no rewriting. Rejected shapes (all proven
 * bypasses or ambiguity sources): absolute paths, backslashes, `.` / `..` segments,
 * duplicate or trailing separators, leading `./`, whitespace-only and non-strings.
 */
function canonicalizePath(path) {
  if (typeof path !== "string") return null;
  if (path === "" || path.trim() !== path) return null;
  if (path.includes("\\") || path.startsWith("/") || path.endsWith("/")) return null;
  const segments = path.split("/");
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") return null;
  }
  return path;
}

function matchAny(patterns, paths) {
  if (!Array.isArray(paths)) return Object.freeze([]);
  const hits = paths.filter(
    (path) => canonicalizePath(path) !== null && patterns.some((p) => matchesGlob(p, path)),
  );
  return Object.freeze([...hits]);
}

/** C3: true only for a canonical path inside the positive mutable surface. */
function isAllowlistedPath(path) {
  const canonical = canonicalizePath(path);
  if (canonical === null) return false;
  return MUTABLE_PATH_PATTERNS.some((pattern) => matchesGlob(pattern, canonical));
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
  MUTABLE_PATH_PATTERNS,
  SENSITIVE_PATH_PATTERNS,
  KERNEL_PATH_PATTERNS,
  MIGRATION_PATH_PATTERNS,
  ANNOTATED_SENSITIVE_EXCEPTIONS,
  matchesGlob,
  canonicalizePath,
  isAllowlistedPath,
  sensitivePathsTouched,
  kernelPathsTouched,
  migrationPathsTouched,
};
