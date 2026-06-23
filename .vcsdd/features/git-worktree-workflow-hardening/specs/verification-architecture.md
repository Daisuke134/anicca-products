# Verification Architecture — git-worktree-workflow-hardening

- **Feature**: git-worktree-workflow-hardening
- **Phase**: 1b (verification architecture)
- **Date**: 2026-06-23
- **VCSDD Epic**: VCSDD-git-worktree-workflow-hardening-1782181898898
- **Behavioral spec**: `specs/behavioral-spec.md`

---

## Purity Boundary Map

### Pure Core

| Module / Function | Description | Verifiability |
|---|---|---|
| `classifyWorktree(record: WorktreeRecord) → WorktreeStatus` | Evaluates all five ACTIVE predicates from plain-data input. Returns `{ status: 'reapable' \| 'active' \| 'protected', reason: string, predicates: PredicateSnapshot }`. Zero I/O. | Unit-testable in isolation — no git binary, no filesystem. Full branch coverage achievable with 6 test cases. |
| `isRecentActivity(lastActivityEpoch: number, graceWindowDays: number, nowEpoch: number) → boolean` | Pure time comparison: `(nowEpoch - lastActivityEpoch) < graceWindowDays * 86400`. No clock access. | Trivially unit-testable; property: monotone in epoch. |
| `buildQuarantineEntry(worktree: WorktreeRecord, runId: string, nowIso: string) → QuarantineEntry` | Constructs the structured log object. No I/O. | Unit-testable; property: all required fields present. |
| `shouldProceedWithDelete(entry: QuarantineEntry, nowEpoch: number, gracePeriodHours: number) → boolean` | Grace period gate: `nowEpoch > entry.quarantinedAtEpoch + gracePeriodHours * 3600`. | Unit-testable; property: never returns true at the same epoch as quarantine. |
| `validateBranchName(name: string, archetype: 'A' \| 'B') → ValidationResult` | Pattern check for branch naming conventions. | Unit-testable with string inputs. |
| `classifyLitterItem(item: LitterRecord) → LitterClassification` | Classify-only pass for existing litter (REQ-010). Pure. | Unit-testable. |

### Effectful Shell

| Module / Function | Description | Why Impure |
|---|---|---|
| `probeWorktree(path: string) → WorktreeRecord` | Runs `git worktree list --porcelain`, `git status --porcelain`, `git rev-list`, `git log -1`, `stat()`. | Git subprocess + filesystem read. |
| `deleteWorktree(path: string, branch: string) → DeleteResult` | Runs `git worktree remove <path>` then `git branch -d <branch>`. | Mutates git state. |
| `pruneStaleRefs(repoPath: string) → void` | Runs `git worktree prune --expire=now`. | Mutates git metadata. |
| `writeQuarantineLog(entry: QuarantineEntry, logPath: string) → void` | Appends to log file; holds file lock. | Filesystem write + flock. |
| `applyGitHubSettings(repo: string) → void` | Calls `gh api` to set `delete_branch_on_merge`. | Network + GitHub API write. |
| `installLefthook(repoPath: string) → void` | Runs `lefthook install`. | Filesystem write + process spawn. |
| `acquireJanitorLock(lockPath: string) → LockHandle \| null` | Creates exclusive file lock. | Filesystem. |

---

## Proof Obligations

| ID | Description | REQ | Tier | Required | Tool |
|----|-------------|-----|------|----------|------|
| PROP-001 | `classifyWorktree` with `uncommitted_changes=true` returns `active` | REQ-001 | 0 | true | unit test |
| PROP-002 | `classifyWorktree` with `unpushed_commits=true` returns `active` | REQ-001 | 0 | true | unit test |
| PROP-003 | `classifyWorktree` with `unmerged_into_trunk=true` returns `active` | REQ-001 | 0 | true | unit test |
| PROP-004 | `classifyWorktree` with `recent_activity=true` returns `active` | REQ-001 | 0 | true | unit test |
| PROP-005 | `classifyWorktree` with `git_locked=true` returns `active` | REQ-001 | 0 | true | unit test |
| PROP-006 | `classifyWorktree` with all five predicates false returns `reapable` | REQ-001, REQ-002 | 0 | true | unit test |
| PROP-007 | `classifyWorktree` with missing upstream (`upstreamMissing=true`) returns `active` (conservative) | REQ-001 edge case | 0 | true | unit test |
| PROP-008 | `classifyWorktree` with detached HEAD returns `active` (conservative) | REQ-001 edge case | 0 | true | unit test |
| PROP-009 | `shouldProceedWithDelete` returns false when `nowEpoch = quarantinedAtEpoch` (same run) | REQ-003 | 0 | true | unit test |
| PROP-010 | `shouldProceedWithDelete` returns false when `nowEpoch < quarantinedAtEpoch + gracePeriodHours * 3600` | REQ-003 | 0 | true | unit test |
| PROP-011 | `shouldProceedWithDelete` returns true only after full grace period elapsed | REQ-003 | 0 | true | unit test |
| PROP-012 | Re-classification at confirmed-delete time: if worktree becomes active during grace period, janitor aborts delete | REQ-003 edge case | 1 | true | integration test with fixture repo |
| PROP-013 | Quarantine log entry is written and fsynced BEFORE any mutation call | REQ-012 | 1 | true | integration test with mock mutation layer |
| PROP-014 | Concurrent janitor instances: second exits with "already running"; no duplicate mutations | REQ-011 | 1 | true | integration test (two parallel processes) |
| PROP-015 | `wt new <name>` rollback: if worktree creation fails, branch is deleted (no partial artifacts) | REQ-004 | 1 | true | integration test with injected failure |
| PROP-016 | `wt new <name>` with invalid characters in `<name>` exits before touching git | REQ-004 edge case | 0 | true | unit test |
| PROP-017 | `wt done` refuses when `git status --porcelain` is non-empty | REQ-005 | 0 | true | unit test with fixture |
| PROP-018 | Branch-name hook blocks commit on branch `my_feature` (no slash prefix) | REQ-006 | 1 | true | integration test (run hook script directly) |
| PROP-019 | Protected-branch hook blocks direct commit on `main` in Archetype A repo | REQ-006 | 1 | true | integration test |
| PROP-020 | Mirror-block hook rejects push containing `.kiro/` or `.windsurf/` files | REQ-006 | 1 | true | integration test |
| PROP-021 | Large-blob hook rejects push containing binary file > 5 MB | REQ-006 | 1 | true | integration test |
| PROP-022 | Janitor prunes stale ref when worktree directory is absent; no reap action on that entry | REQ-007 | 1 | true | integration test with fixture (dir deleted manually) |
| PROP-023 | `classifyLitterItem` on `docs/frank-article` returns `active` with `unmerged_into_trunk=true` and `recent_activity=true` | REQ-010 | 0 | true | unit test |
| PROP-024 | Classify-only pass exits 0 and produces no git mutations | REQ-010 | 1 | true | integration test (assert git log unchanged) |
| PROP-025 | `isRecentActivity(epoch, 7, epoch)` returns true (zero elapsed time, within grace) | REQ-001 predicate 4 | 0 | false | unit test |
| PROP-026 | `isRecentActivity(epoch, 7, epoch + 7*86400 + 1)` returns false (just past grace) | REQ-001 predicate 4 | 0 | false | unit test |
| PROP-027 | GitHub `delete_branch_on_merge=true` confirmed via `gh api` on `anicca` and `anicca-project` | REQ-008 | 2 | true | no-mock E2E: `gh api` query against real repos |
| PROP-028 | Archetype B guard: `git worktree add` in `.openclaw` triggers hook exit 1 | REQ-009 | 1 | true | integration test (run hook script directly) |
| PROP-029 | Janitor run on real repos (dry-run): quarantine set contains ZERO active worktrees | REQ-001, REQ-003 | 2 | true | no-mock E2E: `janitor --dry-run` on actual 4 repos |
| PROP-030 | `buildQuarantineEntry` produces a JSON object with all required fields (branch, path, predicates, evidence, marker="DRY-RUN", timestamp) | REQ-003, REQ-012 | 0 | true | unit test |

---

## Verification Strategy

### Tier 0 — Trivial (no formal proof needed, but unit-tested)

All pure functions in the Pure Core section. These are deterministic, referentially transparent, and can be exhaustively covered with a small number of table-driven unit tests.

Target: `classifyWorktree`, `isRecentActivity`, `buildQuarantineEntry`, `shouldProceedWithDelete`, `validateBranchName`, `classifyLitterItem`.

### Tier 1 — Property Tests / Integration Tests Against Git Fixtures

The impure shell is tested via a seeded temporary git repository (see RED Test Fixtures below). Tests exercise:
- The full janitor pipeline against four fixture worktrees.
- The lefthook hook scripts invoked directly.
- The `wt new` / `wt done` helper commands.
- Concurrent janitor lock behavior.

### Tier 2 — Lightweight Formal / No-Mock E2E

Two E2E checks run against real repositories without mocking:
- `gh api` query confirming GitHub server settings (PROP-027).
- `janitor --dry-run` on the four real repos confirming the quarantine set is safe (PROP-029).

### Tier 3 — Not required for this feature

No cryptographic protocols or safety-critical numeric algorithms requiring strong formal proof.

---

## RED Test Fixtures

The test harness creates a temporary git repository seeded with exactly four worktrees. The janitor MUST reap ONLY fixture (b). All others MUST be classified ACTIVE.

### Fixture Repository Seed Script

```bash
#!/usr/bin/env sh
# Creates temp git repo with 4 worktrees for janitor testing.
# Janitor MUST reap ONLY worktree-b (merged, clean, stale).

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

# Worktree (b) — reapable: merged, clean, stale (last commit 8 days ago)
git checkout -b feature/wt-b
git commit --allow-empty --date="8 days ago" -m "wt-b work"
git checkout main && git merge --no-ff feature/wt-b -m "merge wt-b"
git checkout feature/wt-b
git worktree add ../wt-fixture-b feature/wt-b
# last activity is 8 days ago (committed with --date, no new files)

# Worktree (c) — active: unmerged (has commits not in main)
git checkout -b feature/wt-c
echo "unmerged work" > unmerged.txt && git add . && git commit -m "wt-c unmerged"
git checkout main
git worktree add ../wt-fixture-c feature/wt-c

# Worktree (d) — active: git-locked
git checkout -b feature/wt-d && git checkout main
git worktree add ../wt-fixture-d feature/wt-d
git worktree lock ../wt-fixture-d

echo "REPO=$REPO"
```

### Expected Classification

| Fixture | Predicate triggering ACTIVE | Expected classification |
|---------|----------------------------|------------------------|
| (a) wt-fixture-a | `uncommitted_changes=true` | `active` — MUST NOT be reaped |
| (b) wt-fixture-b | none (all predicates false, >7 days old) | `reapable` — janitor quarantines in dry-run |
| (c) wt-fixture-c | `unmerged_into_trunk=true` | `active` — MUST NOT be reaped |
| (d) wt-fixture-d | `git_locked=true` | `active` — MUST NOT be reaped |

### Dry-Run Assertion

After running `janitor --dry-run --repo=$REPO --grace-hours=0 --trunk=main`:
- Quarantine log contains EXACTLY ONE entry (for `feature/wt-b`).
- The entry has `marker="DRY-RUN"`.
- No `git worktree remove` or `git branch -d` was executed (assert via git log + worktree list).

### Confirmed-Delete Assertion (after grace period simulation)

After running `janitor --repo=$REPO --grace-hours=0 --trunk=main` a SECOND time:
- `git worktree list` no longer shows `../wt-fixture-b`.
- `git branch` no longer shows `feature/wt-b`.
- Worktrees (a), (c), (d) remain intact.

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
- `feature/web-i18n` and `feature/landing-ui-polish` may appear ONLY if confirmed ahead=0 + clean + stale.
- `docs/tool-articles` (ahead 10) must NOT appear.
- Any worktree in `.openclaw` must trigger the Archetype B error (not a janitor scan).

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

1. **The never-delete-active invariant (PROP-001 through PROP-008)**: Is there any code path in the janitor that could call `git worktree remove` or `git branch -d` on a worktree where any single ACTIVE predicate is true? Required file:line evidence.

2. **Grace period bypass**: Can `shouldProceedWithDelete` return true on the same execution that added the quarantine entry? (PROP-009).

3. **Concurrent safety gap**: Is there a window between classification and the file lock acquisition where a second janitor instance could also classify the same worktree as reapable and proceed to delete? (PROP-014).

4. **`wt new` rollback completeness**: If `git worktree add` fails after the branch was already created, is the branch cleanup guaranteed even if an exception is thrown mid-flow? (PROP-015).

5. **`-D` force-delete presence**: Grep the entire implementation for `branch -D` — any occurrence in non-operator-only code paths is a FAIL.

6. **Archetype B leak**: Is there any code path that allows `git worktree add` inside `.openclaw` to succeed? (PROP-028).

Binary verdict required per dimension. No "looks good" without file:line proof.

---

## Traceability Beads

| Bead ID | Type | From | To | Description |
|---------|------|------|----|-------------|
| BEAD-001 | req→prop | REQ-001 | PROP-001..008 | Never-delete-active: all five predicates + edge cases |
| BEAD-002 | req→prop | REQ-002 | PROP-006, PROP-030 | Purity: all-clear case and entry structure |
| BEAD-003 | req→prop | REQ-003 | PROP-009..013 | Dry-run→quarantine→grace→delete pipeline |
| BEAD-004 | req→prop | REQ-004 | PROP-015, PROP-016 | `wt new` atomicity and rollback |
| BEAD-005 | req→prop | REQ-005 | PROP-017 | `wt done` guard |
| BEAD-006 | req→prop | REQ-006 | PROP-018..021 | lefthook guards |
| BEAD-007 | req→prop | REQ-007 | PROP-022 | Stale ref prune |
| BEAD-008 | req→prop | REQ-008 | PROP-027 | GitHub server settings E2E |
| BEAD-009 | req→prop | REQ-009 | PROP-028 | Archetype B worktree rejection |
| BEAD-010 | req→prop | REQ-010 | PROP-023, PROP-024 | Litter classify-only pass |
| BEAD-011 | req→prop | REQ-011 | PROP-014 | Concurrent janitor safety |
| BEAD-012 | req→prop | REQ-012 | PROP-013, PROP-030 | Evidence logging before mutation |
| BEAD-013 | e2e | REQ-001, REQ-003 | PROP-029 | No-mock E2E: real repo dry-run |
