# Verification Architecture — git-worktree-workflow-hardening

- **Feature**: git-worktree-workflow-hardening
- **Phase**: 1b (verification architecture)
- **Date**: 2026-06-23
- **Revision**: iteration-2 (resolves FIND-001 through FIND-012)
- **VCSDD Epic**: VCSDD-git-worktree-workflow-hardening-1782181898898
- **Behavioral spec**: `specs/behavioral-spec.md`

---

## Purity Boundary Map

### Pure Core

| Module / Function | Description | Verifiability |
|---|---|---|
| `classifyWorktree(record: WorktreeRecord) → WorktreeStatus` | Evaluates all SIX ACTIVE predicates plus structural conditions (detachedHead, inProgressOp) from a fully-materialized `WorktreeRecord`. Returns `{ status: 'reapable' \| 'active' \| 'protected', reason: string, predicates: PredicateSnapshot }`. ZERO I/O, zero git calls. | Unit-testable in isolation — no git binary, no filesystem. Full coverage with ≥10 test cases (one per predicate + edge cases). |
| `isRecentActivity(lastActivityEpoch: number, graceWindowDays: number, nowEpoch: number) → boolean` | Pure time comparison: `(nowEpoch - lastActivityEpoch) < graceWindowDays * 86400`. If `lastActivityEpoch > nowEpoch` (future), returns `true` (fail-closed). No clock access. | Trivially unit-testable; property: fail-closed for future epochs. |
| `buildQuarantineEntry(worktree: WorktreeRecord, marker: 'DRY-RUN' \| 'MUTATING', runId: string, nowIso: string) → QuarantineEntry` | Constructs the structured log object including all six predicate values, stash count, detached/in-progress flags, and the required marker field. No I/O. | Unit-testable; property: all required fields present for both marker values. |
| `shouldProceedWithDelete(quarantinedAtEpoch: number, nowEpoch: number, gracePeriodHours: number) → boolean` | Grace period gate: `nowEpoch >= quarantinedAtEpoch + gracePeriodHours * 3600`. Returns true at the SAME epoch second when grace=0 (the `>=` gate is inclusive). | Unit-testable; deterministic given fixed inputs. |
| `validateBranchName(name: string, archetype: 'A' \| 'B') → ValidationResult` | Pattern check for branch naming conventions. Rejects `main/`, `main-internal/` prefixes as feature-branch prefixes; they are protected trunk names only. | Unit-testable with string inputs. |
| `classifyLitterItem(item: LitterRecord) → LitterClassification` | Classify-only pass for existing litter (REQ-010). Pure. Now includes stash and structural fields. | Unit-testable. |
| `isMergedIntoTrunk(record: WorktreeRecord) → boolean` | Consumes the pre-computed `prMergedState`, `cherryAllMinus`, `diffEmpty`, `revListCount`, `trunkResolved`, `detachedHead` fields from the record. Returns false (not merged) if `trunkResolved=false`, `detachedHead=true`, or `prMergedState='unknown'` and secondary signals unavailable. ZERO git calls. | Unit-testable for all four cases: standard merge, squash+PR, squash+no-PR+cherry, fail-closed. |

### Effectful Shell

| Module / Function | Description | Why Impure |
|---|---|---|
| `probeWorktree(path: string, trunkMap: TrunkMap) → WorktreeRecord` | Runs ALL git/gh commands to materialize every field of `WorktreeRecord`: `git worktree list --porcelain`, `git status --porcelain`, `git stash list`, `git rev-parse HEAD` (detached check), stat of REBASE_HEAD/MERGE_HEAD/CHERRY_PICK_HEAD, `git rev-list @{u}..HEAD`, trunk resolution from trunkMap, `git rev-list trunk..branch`, `git cherry trunk branch`, `git diff trunk...branch --quiet`, `gh pr list --head <branch> --state merged`, `git log -1 --format=%ct`, `stat()` on all files + index, flock on lock file. The PURE function `classifyWorktree` is then called with the resulting record. | Git subprocess + network (gh) + filesystem read. Contains ALL of the safety-critical merge computation that the pure function relies on. |
| `deleteWorktree(path: string, branch: string, squashPath: boolean) → DeleteResult` | Runs `git worktree remove <path>` then `git branch -d <branch>` (standard path) or `git branch -D <branch>` (squash path, only when `squashPath=true` and PR-API-confirmed). | Mutates git state. `-D` requires explicit `squashPath=true`. |
| `pruneStaleRefs(repoPath: string) → void` | Runs `git worktree prune --expire=now`. | Mutates git metadata. |
| `writeQuarantineLog(entry: QuarantineEntry, logPath: string) → void` | Appends to log file; holds file lock until fsync completes. | Filesystem write + flock. |
| `applyGitHubSettings(repo: string) → void` | Calls `gh api` to set `delete_branch_on_merge`. | Network + GitHub API write. |
| `installLefthook(repoPath: string) → void` | Runs `lefthook install`. | Filesystem write + process spawn. |
| `acquireJanitorLock(lockPath: string) → LockHandle \| null` | Creates exclusive file lock at `<repo>/.git/janitor.lock` BEFORE any probe. If lock unavailable, returns null immediately. | Filesystem. Lock must be held for the ENTIRE critical section. |

**Critical design note**: `probeWorktree` contains the squash-merge detection, detached-HEAD detection, stash detection, trunk resolution, and PR-API queries. These are the correctness-critical computations. `classifyWorktree` trusts the pre-materialized record; the ACTUAL safety of the system depends on `probeWorktree` computing every field correctly. Both the pure function AND the probe's merge computation are verified (see PROP-031 through PROP-036).

---

## Proof Obligations

| ID | Description | REQ | Tier | Required | Tool |
|----|-------------|-----|------|----------|------|
| PROP-001 | `classifyWorktree` with `uncommittedChanges=true` returns `active` | REQ-001 pred.1 | 0 | true | unit test |
| PROP-002 | `classifyWorktree` with `unpushedCommits=true` returns `active` | REQ-001 pred.2 | 0 | true | unit test |
| PROP-003 | `classifyWorktree` with `unmergedIntoTrunk=true` returns `active` | REQ-001 pred.3 | 0 | true | unit test |
| PROP-004 | `classifyWorktree` with `recentActivity=true` returns `active` | REQ-001 pred.4 | 0 | true | unit test |
| PROP-005 | `classifyWorktree` with `gitLocked=true` returns `active` | REQ-001 pred.5 | 0 | true | unit test |
| PROP-006 | `classifyWorktree` with all SIX predicates false and no structural conditions returns `reapable` | REQ-001, REQ-002 | 0 | true | unit test |
| PROP-006b | `classifyWorktree` with `stashCount > 0` (predicate 6) returns `active` | REQ-001 pred.6 | 0 | true | unit test |
| PROP-007 | `classifyWorktree` with `upstreamMissing=true` returns `active` (conservative) | REQ-001 edge case | 0 | true | unit test |
| PROP-008 | `classifyWorktree` with `detachedHead=true` returns `active` (structural condition) | REQ-001 edge case | 0 | true | unit test |
| PROP-008b | `classifyWorktree` with `inProgressOp='rebase'` returns `active` (structural condition) | REQ-001 edge case | 0 | true | unit test |
| PROP-008c | `classifyWorktree` with `inProgressOp='merge'` returns `active` (structural condition) | REQ-001 edge case | 0 | true | unit test |
| PROP-008d | `classifyWorktree` with future `lastActivityEpoch > nowEpoch` returns `active` (fail-closed clock skew) | REQ-001 pred.4 edge | 0 | true | unit test |
| PROP-009 | `shouldProceedWithDelete` returns false when `nowEpoch < quarantinedAtEpoch + gracePeriodHours * 3600` (inside grace window) | REQ-003 | 0 | true | unit test |
| PROP-009b | `shouldProceedWithDelete` returns true when `nowEpoch = quarantinedAtEpoch` and `gracePeriodHours = 0` (grace=0 same-second is eligible) | REQ-003 grace=0 semantics | 0 | true | unit test |
| PROP-010 | `shouldProceedWithDelete` returns false when `nowEpoch = quarantinedAtEpoch + gracePeriodHours * 3600 - 1` (one second before grace expires) | REQ-003 | 0 | true | unit test |
| PROP-011 | `shouldProceedWithDelete` returns true when `nowEpoch = quarantinedAtEpoch + gracePeriodHours * 3600` (exactly at grace boundary, inclusive `>=`) | REQ-003 | 0 | true | unit test |
| PROP-012 | Re-classification at confirmed-delete time: if worktree becomes active during grace period, janitor aborts delete | REQ-003 edge case | 1 | true | integration test with fixture repo |
| PROP-013 | `MUTATING` marker is written and fsynced to quarantine log BEFORE any `git worktree remove` or `git branch -d/-D` call | REQ-012 | 1 | true | integration test with mock mutation layer that asserts log is fsynced before it is called |
| PROP-013b | `DRY-RUN` marker entry is written BEFORE any mutation; the quarantine log for a dry-run run contains `marker="DRY-RUN"` | REQ-003, REQ-012 | 0 | true | unit test on `buildQuarantineEntry` + integration test |
| PROP-014 | Concurrent janitor safety: start instance B's startup, then let instance A acquire lock + complete delete, then assert instance B performed ZERO probes and ZERO mutations (not merely that it "exited") | REQ-011 | 1 | true | integration test: two processes with deterministic interleave; B cannot acquire lock before A completes |
| PROP-015 | `wt new <name>` rollback: if worktree creation fails, branch is deleted (no partial artifacts) | REQ-004 | 1 | true | integration test with injected failure |
| PROP-016 | `wt new <name>` with invalid characters in `<name>` exits before touching git | REQ-004 edge case | 0 | true | unit test |
| PROP-017 | `wt done` refuses when `git status --porcelain` is non-empty | REQ-005 | 0 | true | unit test with fixture |
| PROP-018 | Branch-name hook blocks commit on branch `my_feature` (no slash prefix) | REQ-006 | 1 | true | integration test (run hook script directly) |
| PROP-018b | Branch-name hook blocks commit on branch `main/foo` (invalid prefix: `main` is a trunk name, not a feature prefix) | REQ-006 | 1 | true | integration test |
| PROP-019 | Protected-branch hook blocks direct commit on `main` in Archetype A repo | REQ-006 | 1 | true | integration test |
| PROP-020 | Mirror-block hook rejects push containing `.kiro/` or `.windsurf/` files | REQ-006 | 1 | true | integration test |
| PROP-021 | Large-blob hook rejects push containing binary file > 5 MB | REQ-006 | 1 | true | integration test |
| PROP-022 | Janitor prunes stale ref when worktree directory is absent; no reap action on that entry | REQ-007 | 1 | true | integration test with fixture (dir deleted manually) |
| PROP-023 | `classifyLitterItem` on `docs/frank-article` returns `active` with `unmergedIntoTrunk=true` and `recentActivity=true` | REQ-010 | 0 | true | unit test |
| PROP-024 | Classify-only pass exits 0 and produces no git mutations | REQ-010 | 1 | true | integration test (assert git log unchanged) |
| PROP-025 | `isRecentActivity(epoch, 7, epoch)` returns true (zero elapsed time, within grace) | REQ-001 pred.4 | 0 | false | unit test |
| PROP-026 | `isRecentActivity(epoch, 7, epoch + 7*86400 + 1)` returns false (just past grace) | REQ-001 pred.4 | 0 | false | unit test |
| PROP-027 | GitHub `delete_branch_on_merge=true` confirmed via `gh api` on `anicca` and `anicca-project` | REQ-008 | 2 | true | no-mock E2E: `gh api` query against real repos |
| PROP-028 | Archetype B guard: `git worktree add` in `.openclaw` triggers hook exit 1 | REQ-009 | 1 | true | integration test (run hook script directly) |
| PROP-029 | Janitor run on real repos (dry-run): quarantine set contains ZERO active worktrees | REQ-001, REQ-003 | 2 | true | no-mock E2E: `janitor --dry-run` on actual 4 repos |
| PROP-030 | `buildQuarantineEntry` with `marker='DRY-RUN'` produces a JSON object with all required fields (branch, path, predicates including stash count, evidence, marker="DRY-RUN", timestamp) | REQ-003, REQ-012 | 0 | true | unit test |
| PROP-030b | `buildQuarantineEntry` with `marker='MUTATING'` produces a JSON object with `marker="MUTATING"` and all six predicate values including `stashCount` | REQ-012 | 0 | true | unit test |
| PROP-031 | `probeWorktree` computes `unmergedIntoTrunk=true` for a squash-merged branch (merged via `git merge --squash` + commit on trunk, not reachable via `git rev-list`) when `gh` is unavailable; secondary signal (`git cherry` / `git diff`) detects equivalence and returns `unmergedIntoTrunk=false` | REQ-014 | 1 | true | integration test with fixture (e): squash-merge fixture |
| PROP-032 | `probeWorktree` computes `prMergedState='merged'` for a squash-merged branch with a merged PR; resulting `unmergedIntoTrunk=false`; branch is eligible for squash reap path | REQ-014 | 1 | true | integration test or stub of `gh pr list` returning merged state |
| PROP-033 | `probeWorktree` computes `unmergedIntoTrunk=true` when `trunkResolved=false` (repo not in trunk map or trunk ref missing); entire repo reaps nothing | REQ-001, REQ-004 (trunk), NFR-002 | 1 | true | integration test: invoke janitor with repo not in trunk map; assert zero mutations and log entry `TRUNK_UNRESOLVED` |
| PROP-034 | `probeWorktree` computes `detachedHead=true` for a worktree in detached HEAD state; `classifyWorktree` returns `active` | REQ-001 structural | 1 | true | integration test with fixture: `git checkout --detach HEAD` in worktree |
| PROP-035 | `probeWorktree` computes `stashCount > 0` for a branch with stashed changes; `classifyWorktree` returns `active` even when `git status --porcelain` is empty | REQ-001 pred.6, NFR-002 | 1 | true | integration test with fixture: `git stash` then `git status` shows clean, assert `active` |
| PROP-036 | NFR-002 metamorphic property: for any `WorktreeRecord` where at least one of {`uncommittedChanges`, `unpushedCommits`, `unmergedIntoTrunk`, `recentActivity`, `gitLocked`, `stashCount > 0`, `detachedHead`, `inProgressOp != null`} is true/non-null, `classifyWorktree` MUST return `status='active'`. Tested with randomized WorktreeRecord instances | NFR-002 | 1 | true | property-based test (fast-check or hypothesis): generate random records, assert invariant |
| PROP-037 | `git branch -D` does NOT appear in any janitor code path where `squashPath=false`; the only automated `git branch -D` call requires `prMergedState='merged'` to be set before `deleteWorktree` is called | REQ-001, REQ-014 | 0 | true | static analysis: grep `-D` occurrences; review call sites of `deleteWorktree` |
| PROP-038 | lefthook installs successfully (`lefthook install` exits 0) in all four repos after setup; `git commit` on a forbidden branch fires the pre-commit hook and exits 1 | REQ-013 | 1 | true | integration test: install + attempt commit on `forbidden-branch` in each repo type |
| PROP-039 | `isRecentActivity(futureEpoch, 7, nowEpoch)` where `futureEpoch > nowEpoch` returns `true` (fail-closed for future timestamps) | REQ-001 pred.4, REQ-002 | 0 | true | unit test |

---

## Verification Strategy

### Tier 0 — Trivial (no formal proof needed, but unit-tested)

All pure functions in the Pure Core section. These are deterministic, referentially transparent, and can be exhaustively covered with table-driven unit tests.

Target: `classifyWorktree`, `isRecentActivity`, `buildQuarantineEntry`, `shouldProceedWithDelete`, `validateBranchName`, `classifyLitterItem`, `isMergedIntoTrunk`.

Key addition over iteration-1: the `stashCount`, `detachedHead`, `inProgressOp`, and future-mtime paths all require explicit test cases (PROP-006b, PROP-008, PROP-008b–d, PROP-039).

### Tier 1 — Integration Tests Against Git Fixtures

The impure shell is tested via seeded temporary git repositories (see RED Test Fixtures below). Tests exercise:
- The full janitor pipeline against five fixture worktrees including the squash-merge fixture (e).
- `probeWorktree` merge computation under squash, detached-HEAD, wrong-trunk, stash, offline cases (PROP-031 through PROP-035).
- The NFR-002 metamorphic property test (PROP-036).
- The lefthook hook scripts invoked directly.
- The `wt new` / `wt done` helper commands.
- Concurrent janitor lock behavior with deterministic interleave (PROP-014).
- The `MUTATING` marker written before mutation (PROP-013).

### Tier 2 — Lightweight Formal / No-Mock E2E

Two E2E checks run against real repositories without mocking:
- `gh api` query confirming GitHub server settings (PROP-027).
- `janitor --dry-run` on the four real repos confirming the quarantine set is safe (PROP-029).

### Tier 3 — Not required for this feature

No cryptographic protocols or safety-critical numeric algorithms requiring strong formal proof.

---

## RED Test Fixtures

The test harness creates a temporary git repository seeded with exactly FIVE worktrees. The janitor MUST reap ONLY fixture (b) via the squash-aware path. All others MUST be classified ACTIVE.

### Fixture Repository Seed Script

```bash
#!/usr/bin/env sh
# Creates temp git repo with 5 worktrees for janitor testing.
# Janitor MUST reap ONLY worktree-b (squash-merged, clean, stale, no-stash, unlocked).
# Worktree-e is the NEW squash-merge fixture that exercises the production path.
# FIND-008 fix: worktree-b now uses squash-merge (the actual production merge mode).

set -eu

REPO=$(mktemp -d)
cd "$REPO"

git init --initial-branch=main .
git config user.email "test@test.com"
git config user.name "Test"
echo "init" > README.md && git add . && git commit -m "init"

# Worktree (a) — active: has uncommitted changes
git checkout -b feature/wt-a && git checkout main
git worktree add ../wt-fixture-a feature/wt-a
echo "dirty" > ../wt-fixture-a/dirty.txt  # uncommitted

# Worktree (b) — reapable via squash-aware path:
# squash-merged into trunk, clean, stale (> 7 days), no stash, unlocked.
# CRITICAL: uses git merge --squash (the ACTUAL production merge mode, not --no-ff).
# git rev-list trunk..branch is > 0 (squash commits not reachable under original SHAs),
# but git cherry trunk branch shows all '-' lines (equivalent content).
git checkout -b feature/wt-b
git commit --allow-empty --date="8 days ago" -m "wt-b work"
git checkout main
# Squash merge: commits are not reachable from trunk under original SHAs
git merge --squash feature/wt-b
git commit -m "squash: merge wt-b"
git checkout feature/wt-b
git worktree add ../wt-fixture-b feature/wt-b
# last activity is 8 days ago; git status is clean; stash is empty; not locked
# git rev-list main..feature/wt-b > 0 (squash: original commits not reachable)
# git cherry main feature/wt-b → all '-' lines (equivalent)
# Expected: classified REAPABLE via squash-aware signal

# Worktree (c) — active: unmerged (has commits not in main)
git checkout -b feature/wt-c
echo "unmerged work" > unmerged.txt && git add . && git commit -m "wt-c unmerged"
git checkout main
git worktree add ../wt-fixture-c feature/wt-c

# Worktree (d) — active: git-locked
git checkout -b feature/wt-d && git checkout main
git worktree add ../wt-fixture-d feature/wt-d
git worktree lock ../wt-fixture-d

# Worktree (e) — active: has stash (predicate 6)
# git status --porcelain is EMPTY (the stash trap from FIND-003)
git checkout -b feature/wt-e
echo "wt-e content" > wt-e.txt && git add . && git commit -m "wt-e init"
git checkout main
git worktree add ../wt-fixture-e feature/wt-e
# Stash some work in the worktree (clean working tree, but stash is non-empty)
(cd ../wt-fixture-e && echo "stashed work" > stash.txt && git stash)
# Now git status --porcelain is empty; git stash list is non-empty
# Expected: classified ACTIVE (predicate 6 has_stash=true)

echo "REPO=$REPO"
echo "Fixtures: a(dirty) b(squash-merged+stale) c(unmerged) d(locked) e(stash)"
```

### Expected Classification

| Fixture | Predicate triggering ACTIVE | Expected classification |
|---------|----------------------------|------------------------|
| (a) wt-fixture-a | `uncommittedChanges=true` (pred.1) | `active` — MUST NOT be reaped |
| (b) wt-fixture-b | none — squash-merged+clean+stale+unlocked+no-stash, secondary signal (`git cherry`) shows all `-` → MERGED | `reapable` via squash-aware path |
| (c) wt-fixture-c | `unmergedIntoTrunk=true` (pred.3) | `active` — MUST NOT be reaped |
| (d) wt-fixture-d | `gitLocked=true` (pred.5) | `active` — MUST NOT be reaped |
| (e) wt-fixture-e | `stashCount > 0` (pred.6, `has_stash`); `git status` is empty | `active` — MUST NOT be reaped (FIND-003 regression guard) |

### Dry-Run Assertion

After running `janitor --dry-run --repo=$REPO --trunk=main --grace-hours=0`:
- Quarantine log contains EXACTLY ONE entry (for `feature/wt-b`).
- The entry has `marker="DRY-RUN"`.
- No `git worktree remove`, `git branch -d`, or `git branch -D` was executed.
- Worktrees (a), (c), (d), (e) do NOT appear in the quarantine log.

### Confirmed-Delete Assertion (after grace period simulation)

After running `janitor --repo=$REPO --trunk=main --grace-hours=0` a SECOND time (at the same or later epoch second — grace=0 uses `>=` gate):
- `git worktree list` no longer shows `../wt-fixture-b`.
- `git branch` no longer shows `feature/wt-b` (deleted via squash reap path).
- Worktrees (a), (c), (d), (e) remain intact.
- The quarantine log contains a `MUTATING` entry for `feature/wt-b` written BEFORE the delete timestamp.

### Additional Fixture: Wrong / Missing Trunk

To verify PROP-033 (trunk fail-closed):

```bash
# Invoke janitor with a repo not in the trunk map
janitor --dry-run --repo=$REPO --trunk=nonexistent-branch-xyz
# Expected: exits 0 with log entry TRUNK_UNRESOLVED; quarantine log is empty; zero worktrees reaped
```

### Additional Fixture: Stash Blind Spot (FIND-003 regression guard)

The (e) fixture above is the primary regression guard. Additionally, an isolated unit test:

```javascript
// Unit test: stash trap — clean status, non-empty stash
const record = allInactiveRecord();  // all predicates false
record.stashCount = 1;               // has_stash = true
record.uncommittedChanges = false;   // git status is empty
assert(classifyWorktree(record).status === 'active');
// This MUST catch the FIND-003 regression
```

---

## Grace Period Semantics (FIND-010 resolution)

The grace gate is defined ONCE here and MUST be used consistently across all code, tests, and assertions:

```
shouldProceedWithDelete(quarantinedAtEpoch, nowEpoch, gracePeriodHours):
  return nowEpoch >= quarantinedAtEpoch + (gracePeriodHours * 3600)
```

| Scenario | Result | Rationale |
|---|---|---|
| `grace=24, nowEpoch = quarantinedAtEpoch + 86400` | `true` (proceed) | Exactly 24h elapsed |
| `grace=24, nowEpoch = quarantinedAtEpoch + 86399` | `false` (wait) | One second short |
| `grace=0, nowEpoch = quarantinedAtEpoch` | `true` (proceed) | `>=` gate, zero hours added |
| `grace=0, nowEpoch = quarantinedAtEpoch + 1` | `true` (proceed) | After quarantine time |

The two-run fixture test with `grace=0` is NOT timing-dependent: both runs may execute at the same epoch second and the second run will still satisfy `>=`. This eliminates the flakiness noted in FIND-010.

PROP-009 is now: `shouldProceedWithDelete` returns false when `nowEpoch < quarantinedAtEpoch + gracePeriodHours * 3600` (STRICTLY less than). PROP-009b replaces the old same-epoch=false assertion: with `grace=0`, the same-epoch returns `true` (the `>=` gate is satisfied).

---

## No-Mock E2E Verification

Run against the REAL four repositories (zero mocking, zero test-only flags except `--dry-run`).

### E2E Step 1 — Janitor Dry-Run on Real Repos

```bash
for REPO in ~/anicca-project ~/anicca ~/.openclaw ~/anicca-monk-factory; do
  echo "=== $REPO ==="
  node bin/janitor.js --dry-run --repo="$REPO"
done
```

**Assertion**: The combined quarantine log output across all four repos MUST contain ZERO entries where `status=active` is listed (the janitor must only output reapable candidates). Specifically:
- `docs/frank-article` must NOT appear in any quarantine set (it is ACTIVE).
- `feature/web-i18n` and `feature/landing-ui-polish` may appear ONLY if confirmed ahead=0 + clean + stale + no-stash + squash-merged signal.
- `docs/tool-articles` (ahead 10) must NOT appear.
- Any worktree in `.openclaw` must trigger the Archetype B error (not a janitor scan).
- The `.openclaw` repo uses trunk `main-internal` from the trunk map — NOT `main`.

**Evidence file**: write full output to `.vcsdd/features/git-worktree-workflow-hardening/evidence/e2e-dry-run.log`.

### E2E Step 2 — GitHub Settings Verification

```bash
for REPO in Daisuke134/anicca Daisuke134/anicca-products; do
  DMO=$(gh api "repos/$REPO" --jq '.delete_branch_on_merge')
  echo "$REPO delete_branch_on_merge=$DMO"
  [ "$DMO" = "true" ] || exit 1
done
```

**Assertion**: Both repos return `true`. Exit 0.

### E2E Step 3 — Lefthook Hook Activation

```bash
for REPO in ~/anicca-project ~/anicca ~/.openclaw ~/anicca-monk-factory; do
  echo "=== $REPO ==="
  (cd "$REPO" && lefthook run pre-commit --all-files 2>&1 | head -5) || true
done
```

**Assertion**: Each repo either exits 0 (no staged files, hooks pass trivially) or shows hook output indicating the hooks are installed and firing.

---

## Adversarial Gate Focus Areas

The `vcsdd:vcsdd-adversary` reviewer (fresh context, disk-only) MUST specifically probe:

1. **The never-delete-active invariant (PROP-001 through PROP-008d)**: Is there any code path in the janitor that could call `git worktree remove` or `git branch -d/-D` on a worktree where ANY single ACTIVE predicate (1–6) or structural condition (detachedHead, inProgressOp) is true? Required file:line evidence. Include: stash blind spot, detached HEAD, in-progress op.

2. **Grace period semantics (PROP-009, PROP-009b, PROP-011)**: The `>=` gate must be used, not `>`. PROP-009b specifically asserts same-epoch-with-grace=0 returns `true`. Required file:line evidence.

3. **Exclusive lock scope (PROP-014, REQ-011)**: Does the lock cover the ENTIRE probe→classify→log→mutate sequence? Is there ANY probe or mutation that occurs outside the lock? The interleave test must verify instance B performs ZERO git operations. Required file:line evidence.

4. **`wt new` rollback completeness (PROP-015)**: If `git worktree add` fails after the branch was already created, is the branch cleanup guaranteed even if an exception is thrown mid-flow?

5. **`-D` force-delete presence (PROP-037)**: Grep the entire implementation for `branch -D`. Any occurrence where `squashPath !== true` or where `prMergedState !== 'merged'` was not verified immediately before the call is a FAIL.

6. **Archetype B leak (PROP-028)**: Is there any code path that allows `git worktree add` inside `.openclaw` to succeed?

7. **Squash-merge regression (PROP-031, PROP-032)**: Does the fixture repo created with `git merge --squash` produce `prMergedState='merged'` or secondary-signal-merged correctly? Does a branch with `git rev-list > 0` but `git cherry` all-minus correctly produce `unmergedIntoTrunk=false`?

8. **Trunk fail-closed (PROP-033)**: If the trunk ref for a repo is absent from the map, does the janitor reap NOTHING and log `TRUNK_UNRESOLVED`?

Binary verdict required per dimension. No "looks good" without file:line proof.

---

## Traceability Beads

| Bead ID | Type | From | To | Description |
|---------|------|------|----|-------------|
| BEAD-001 | req→prop | REQ-001 | PROP-001..008d, PROP-036 | Never-delete-active: all six predicates + structural conditions + NFR-002 metamorphic |
| BEAD-002 | req→prop | REQ-002 | PROP-006, PROP-030, PROP-030b | Purity: all-clear case and both entry marker values |
| BEAD-003 | req→prop | REQ-003 | PROP-009, PROP-009b, PROP-010, PROP-011, PROP-012, PROP-013, PROP-013b | Dry-run→quarantine→grace→delete pipeline including grace=0 semantics |
| BEAD-004 | req→prop | REQ-004 | PROP-015, PROP-016 | `wt new` atomicity and rollback |
| BEAD-005 | req→prop | REQ-005 | PROP-017 | `wt done` guard |
| BEAD-006 | req→prop | REQ-006 | PROP-018, PROP-018b, PROP-019..021 | lefthook guards including main/ prefix rejection |
| BEAD-007 | req→prop | REQ-007 | PROP-022 | Stale ref prune |
| BEAD-008 | req→prop | REQ-008 | PROP-027 | GitHub server settings E2E |
| BEAD-009 | req→prop | REQ-009 | PROP-028 | Archetype B worktree rejection |
| BEAD-010 | req→prop | REQ-010 | PROP-023, PROP-024 | Litter classify-only pass |
| BEAD-011 | req→prop | REQ-011 | PROP-014 | Concurrent janitor exclusive-lock critical section |
| BEAD-012 | req→prop | REQ-012 | PROP-013, PROP-013b, PROP-030b | Evidence logging — both DRY-RUN and MUTATING markers |
| BEAD-013 | e2e | REQ-001, REQ-003 | PROP-029 | No-mock E2E: real repo dry-run |
| BEAD-014 | req→prop | REQ-013 | PROP-038 | lefthook install across all four repos + commit fires hook |
| BEAD-015 | req→prop | NFR-002 | PROP-036 | Zero false-negative ACTIVE: metamorphic property test |
| BEAD-016 | req→prop | REQ-014 | PROP-031, PROP-032, PROP-033, PROP-034, PROP-035, PROP-037 | Squash-aware merge signal: all paths covered (PR-API, secondary signal, offline, detached, stash, -D guard) |
