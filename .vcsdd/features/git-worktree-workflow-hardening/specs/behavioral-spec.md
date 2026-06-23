# Behavioral Specification — git-worktree-workflow-hardening

- **Feature**: git-worktree-workflow-hardening
- **Phase**: 1a (EARS behavioral spec)
- **Date**: 2026-06-23
- **Revision**: iteration-2 (resolves FIND-001 through FIND-012)
- **VCSDD Epic**: VCSDD-git-worktree-workflow-hardening-1782181898898
- **Design source**: `docs/superpowers/specs/2026-06-23-git-worktree-workflow-hardening-design.md`

---

## Purity Boundary Analysis

The system has a clean split between deterministic classification logic and impure git side-effects.

**Pure core** — the reap-decision function `classifyWorktree(worktreeRecord) → WorktreeStatus`:
- Accepts a fully-materialized `WorktreeRecord` as plain data (see type definition below). Zero git calls permitted inside.
- Returns one of `{ status: 'reapable' | 'active' | 'protected', reason: string, predicates: PredicateSnapshot }`.
- Zero side effects. Fully unit-testable with in-process fixtures.
- Contains ALL ACTIVE predicate checks — if ANY returns true, status is `active`.

**`WorktreeRecord` shape** (all fields required — the impure probe populates every field before the pure function is called):

```typescript
interface WorktreeRecord {
  branchName: string;
  worktreePath: string;
  // Predicate 1
  uncommittedChanges: boolean;         // git status --porcelain non-empty
  // Predicate 2
  unpushedCommits: boolean;            // @{u}..HEAD > 0, or no upstream
  upstreamMissing: boolean;            // no tracking branch configured
  // Predicate 3 — squash-aware
  unmergedIntoTrunk: boolean;          // see REQ-001 predicate 3 definition
  trunkResolved: boolean;              // false if trunk ref cannot be resolved
  prMergedState: 'merged' | 'open' | 'unknown'; // from gh pr API; 'unknown' if offline or no PR
  // Predicate 4
  lastActivityEpoch: number;           // max(latest-commit-ct, max-file-mtime, index-mtime)
  graceWindowDays: number;
  nowEpoch: number;
  // Predicate 5
  gitLocked: boolean;
  // Predicate 6
  stashCount: number;                  // git stash list scoped to worktree
  // Detached HEAD / in-progress ops (classify as ACTIVE)
  detachedHead: boolean;
  inProgressOp: 'rebase' | 'merge' | 'cherry-pick' | null; // .git/worktrees/<id>/{REBASE_HEAD,MERGE_HEAD,CHERRY_PICK_HEAD}
  // Grace period info
  quarantinedAtEpoch: number | null;   // null if not yet quarantined
  gracePeriodHours: number;
  // Lock info
  lockHandle: boolean;                 // per-repo lockfile held by this process
}
```

**Impure shell** — everything that touches the filesystem or git (the `probeWorktree` function assembles every field above before passing to `classifyWorktree`):
- `git worktree list --porcelain` (probe)
- `git status --porcelain` (probe — predicate 1)
- `git rev-list --count @{u}..HEAD` (probe — predicate 2)
- `git rev-list --count <trunk>..<branch>` (probe — predicate 3, squash-unaware leg)
- `git cherry <trunk> <branch>` (probe — predicate 3, squash-aware leg)
- `git diff <trunk>...<branch>` (probe — predicate 3, patch-equivalence leg)
- `gh pr list --head <branch> --state merged --json number,mergedAt` (probe — PR merge signal)
- `git log -1 --format=%ct` + `stat()` on all files + `stat()` on index (probe — predicate 4)
- `git stash list` scoped to worktree branch (probe — predicate 6)
- `git rev-parse --abbrev-ref HEAD` (probe — detached HEAD detection)
- `stat .git/worktrees/<id>/REBASE_HEAD` etc. (probe — in-progress op detection)
- Per-repo trunk resolution (read from explicit map — no defaulting)
- `flock` on per-repo lockfile (concurrency)
- `git worktree prune --expire` (mutation)
- `git worktree remove` (mutation)
- `git branch -d` (mutation — merged-only; refuses unmerged. Never `-D` in automated path)
- `git branch -D` (mutation — ONLY on PR-API-confirmed-merged squash path, operator-gated)
- `gh api` / `gh repo edit` (mutation — GitHub settings)
- `lefthook install` (mutation — hook installation)
- Writing to quarantine log file (side effect)

The janitor harness composes: **acquire-lock → probe → pure-classify → log → (after grace) → re-classify-under-lock → mutate → release-lock**. The pure core is tested in isolation from git.

---

## Per-Repo Trunk Resolution Map

The janitor MUST resolve the trunk ref from this explicit map before running any probe. There is NO hardcoded default trunk:

| Repo local path | Trunk ref |
|---|---|
| `~/anicca-project` | `main` |
| `~/anicca` | `main` |
| `~/.openclaw` | `main-internal` |
| `~/anicca-monk-factory` | `main` |

**Fail-closed rule**: If the trunk ref for a repo is not in this map, OR if the resolved trunk ref cannot be found in the local git graph (e.g. `git rev-parse <trunk>` exits non-zero), the janitor SHALL treat ALL worktrees in that repo as ACTIVE and reap nothing from that repo, logging: `"TRUNK_UNRESOLVED: treating all worktrees as ACTIVE (fail-closed)"`.

---

## Requirements

### REQ-001: Never-Delete-Active-Worktree Invariant (highest priority)

**EARS**: WHEN the worktree-janitor evaluates any worktree for reaping, THE SYSTEM SHALL classify that worktree as ACTIVE and exclude it from all reap actions if ANY ONE of the following SIX predicates is true:

1. `uncommitted_changes`: `git status --porcelain` in the worktree path returns one or more lines.
2. `unpushed_commits`: the branch has commits ahead of its own tracking upstream (`git rev-list --count @{u}..HEAD > 0`), or no upstream is configured (`upstreamMissing=true`).
3. `unmerged_into_trunk`: the branch contains work not yet integrated into the trunk, as determined by the squash-aware merged signal (see REQ-014 for the exact determination). Specifically, `unmerged_into_trunk = true` if: trunk cannot be resolved (`trunkResolved=false`), OR detached HEAD, OR the squash-aware merged signal returns NOT-MERGED, OR the determination is ambiguous (fail-closed).
4. `recent_activity`: the timestamp of the latest activity in the worktree — computed as `max(latest-commit-ct, max-file-mtime-in-worktree, index-mtime)` — falls within the configured grace window. If `lastActivityEpoch = 0` (unknown), treat as recent (conservative). If `lastActivityEpoch > nowEpoch` (future timestamp / clock skew), treat as recent (fail-closed).
5. `git_locked`: the worktree is marked locked by `git worktree lock` (`locked` field present in `git worktree list --porcelain` output).
6. `has_stash`: `git stash list` filtered to the branch associated with this worktree returns one or more entries. A stash scoped to this worktree is treated as uncommitted work in progress.

**Additionally**, a worktree MUST be classified ACTIVE (independent of the six predicates) if ANY of these structural conditions hold:
- **Detached HEAD**: the worktree's `HEAD` is in detached state (not on a named branch). Classification: ACTIVE / unclassifiable. Reason: merge status cannot be determined for a detached HEAD.
- **In-progress git operation**: any of the sentinel files `REBASE_HEAD`, `MERGE_HEAD`, `CHERRY_PICK_HEAD` exists under `.git/worktrees/<id>/`. Classification: ACTIVE. Reason: a rebase, merge, or cherry-pick is in flight; deletion would corrupt it.

**Edge Cases**:
- All six predicates false AND no structural conditions (merged+squash-aware, clean, stale, unlocked, no-stash, no-detach, no-in-progress): worktree enters dry-run-only quarantine (REQ-003).
- Exactly one predicate true: worktree is ACTIVE — full stop, no further action.
- Upstream ref missing (no tracking branch): treat as `unpushed_commits = true` (conservative).
- Detached HEAD worktree: treat as ACTIVE (cannot determine merge status; conservative). Do not attempt merge detection.
- In-progress rebase/merge/cherry-pick: treat as ACTIVE unconditionally.
- Worktree directory deleted manually (stale git ref): treat as `git_locked = false`, run `git worktree prune` to clear dangling ref, then skip reap (REQ-007).
- `docs/frank-article` branch (ahead 3048 of trunk, active 45 minutes ago): predicates 3 AND 4 both true → ACTIVE, never auto-deleted.
- Squash-merged branch: see REQ-014 for the exact merged-signal definition and the PR-API-confirmed squash reap path.
- Stashed-then-clean worktree: `git status --porcelain` is empty but `git stash list` is non-empty → predicate 6 (`has_stash`) is true → ACTIVE. Never reapable while stash exists.
- Future-dated mtime (NFS, restored backup, clock skew): if `lastActivityEpoch > nowEpoch`, treat as `recent_activity = true` (fail-closed).

**Acceptance Criteria**:
- Given a worktree with any single ACTIVE predicate (1–6) true, the janitor dry-run output log MUST NOT list that worktree in the quarantine set.
- Given a worktree with a detached HEAD or in-progress operation, the janitor MUST classify it ACTIVE regardless of predicate values.
- Given a worktree with a non-empty stash and otherwise-clean status, the janitor MUST classify it ACTIVE.
- Given a worktree satisfying all six INACTIVE conditions and no structural conditions, the janitor lists it in quarantine only after dry-run, never deletes in the same execution.
- The pure `classifyWorktree` function, called with a `WorktreeRecord` where any one field signals ACTIVE, returns `{ status: 'active' }`.
- Force-delete (`git branch -D`) MUST NOT appear anywhere in automated janitor code paths except the PR-API-confirmed squash reap path (REQ-014).

---

### REQ-002: Reap-Decision Purity

**EARS**: WHEN the janitor invokes the worktree classification step, THE SYSTEM SHALL compute the reap/active/protected decision entirely within a pure function that receives only a fully-materialized `WorktreeRecord` (no git command execution inside the function), so that the decision is reproducible and unit-testable without a live git repository.

**Edge Cases**:
- `graceWindowDays = 0`: recent_activity predicate evaluates `(nowEpoch - lastActivityEpoch) < 0`, which is false for any non-future epoch — effectively disabling the grace window. Used in tests only. A worktree with `graceWindowDays=0` is NOT recent unless `lastActivityEpoch > nowEpoch`.
- `lastActivityEpoch = 0` (unknown): treat as recent (conservative — recent_activity = true).
- `lastActivityEpoch > nowEpoch` (future): treat as recent (conservative — recent_activity = true).
- All numeric fields are non-negative integers; function must not call git, read files, or produce side effects.
- `trunkResolved = false`: the `unmerged_into_trunk` field MUST be `true` in this case (probe sets it fail-closed); `classifyWorktree` treats it as ACTIVE.
- `prMergedState = 'unknown'`: the probe could not determine PR merge state; treat as NOT merged (fail-closed).

**Acceptance Criteria**:
- Unit tests for `classifyWorktree` run without any git binary or repository on the test machine.
- Full predicate coverage: at least one test case per predicate (1–6) asserting ACTIVE, plus the all-clear case asserting `reapable`.
- Tests cover: detached HEAD → ACTIVE, in-progress op → ACTIVE, stash non-empty → ACTIVE, future mtime → ACTIVE.

---

### REQ-003: Dry-Run → Quarantine → Grace → Confirmed-Delete Pipeline

**EARS**: WHEN the janitor identifies a worktree as `reapable` (all six INACTIVE conditions satisfied, no structural conditions), THE SYSTEM SHALL execute the following gated pipeline and MUST NOT skip any step:
1. **Dry-run log**: append a structured entry to the quarantine log (`janitor-quarantine.log`) containing: branch name, worktree path, evidence snapshot (all six predicate values, ahead/behind counts, last activity epoch, stash count, merge SHA or PR number), timestamp, and the word "DRY-RUN". No mutation occurs.
2. **Grace period check**: evaluate `nowEpoch >= quarantinedAtEpoch + gracePeriodHours * 3600`. If this condition is NOT yet satisfied, abort — no mutation. The gate is strictly `>=` so grace=0 means the delete is eligible on the NEXT run at or after the same epoch second.
3. **Confirmed delete** (only after grace satisfied): acquire the per-repo exclusive lock (REQ-011). Under the lock, immediately re-probe and re-classify the worktree. If re-classification returns ACTIVE, abort and log `"REACTIVATED: aborting delete"`. If still `reapable`, write the `MUTATING` marker (REQ-012), then execute in order: `git worktree remove <path>` then either `git branch -d <branch>` (standard merged path) or `git branch -D <branch>` (PR-API-confirmed squash path only, per REQ-014). If either step fails, log the error and halt — do not proceed to the other step.
4. **Post-delete log**: append a completion entry to the quarantine log with the actual deletion timestamp and git output.

**Edge Cases**:
- `git branch -d` refuses because branch is unmerged (git safety check catches what our predicate missed): log error, halt, do NOT use `-D` unless the PR-API-confirmed squash path (REQ-014) is in effect.
- Squash-merged branch confirmed via PR API: use the squash reap path (REQ-014) which permits `git branch -D` under the PR-API-confirmed guard. Log the PR number/mergedAt as evidence.
- Janitor runs concurrently (two cron invocations overlap): the lock in step 3 covers the ENTIRE probe→classify→log→mutate sequence (REQ-011); second instance must not perform any probe or mutation — exits immediately on lock failure.
- Worktree reappears as active between dry-run and confirmed-delete (agent resumes work during grace period): re-classify at confirmed-delete time under lock; if now ACTIVE, abort delete and log.
- `GRACE_PERIOD_HOURS = 0`: the quarantine log step is still executed (DRY-RUN entry is written). On the NEXT run at `nowEpoch >= quarantinedAtEpoch` the grace gate is satisfied and delete proceeds.
- Lock file left stale (crashed janitor): after `LOCK_STALE_SECONDS` (default 300) the next instance may forcibly acquire, logging the stale-lock event.

**Acceptance Criteria**:
- A worktree classified as `reapable` in a janitor run is NEVER deleted in the same run — always requires a separate run after the grace gate is satisfied.
- The quarantine log DRY-RUN entry is written before any mutation.
- The `MUTATING` marker is written and fsynced before the first mutation call (REQ-012).
- If re-classification at confirmed-delete time returns ACTIVE, the worktree is NOT deleted.
- Concurrent janitor instances: the second instance exits 1 with "already running" WITHOUT performing any probe or mutation.
- `grace=0` semantics: `shouldProceedWithDelete` returns true when `nowEpoch >= quarantinedAtEpoch + 0 * 3600` (i.e. the same or a later second), making the fixture's two-run delete test deterministic without timing dependence.

---

### REQ-004: `wt new` Atomic Worktree Creation

**EARS**: WHEN the operator runs `wt new <name>`, THE SYSTEM SHALL atomically:
1. Fetch the latest trunk from remote (`git fetch origin <trunk>` using the per-repo trunk map).
2. Create a new local branch `feature/<name>` off the fetched trunk ref.
3. Create a worktree at `../<repo-basename>-<name>` linked to that branch.
4. Print the worktree path and the branch name to stdout.

And THE SYSTEM SHALL roll back on any failure mid-flow:
- If step 2 fails (branch already exists): exit with error, no worktree created.
- If step 3 fails (path already exists, disk full, etc.): delete the branch created in step 2, exit with error.

**Edge Cases**:
- `<name>` contains characters outside `[a-z0-9._-]`: reject with a clear error before touching git.
- Trunk is ahead of local by N commits: `git fetch` in step 1 ensures the new branch starts from the remote head, not a stale local copy.
- Worktree path `../<basename>-<name>` already exists as a directory: fail before `git worktree add`, clean up branch.
- Network unavailable for `git fetch`: fail fast with error; do not create a worktree off a potentially stale trunk.
- Trunk cannot be resolved from the per-repo map: exit with error before touching git.

**Acceptance Criteria**:
- After a successful `wt new foo`, `git worktree list` shows a worktree at `../<basename>-foo` on branch `feature/foo`.
- After a failed `wt new` (any step), `git worktree list` and `git branch` show no partial artifacts.
- The branch `feature/foo` starts at the same commit as `origin/<trunk>` at the time of `wt new`.

---

### REQ-005: `wt done` Atomic Worktree Teardown

**EARS**: WHEN the operator runs `wt done` from inside a worktree, THE SYSTEM SHALL atomically:
1. Show a diff summary (`git diff <trunk>...HEAD --stat`) for operator review.
2. Create a GitHub PR targeting trunk (`gh pr create --base <trunk> --fill`).
3. Wait for PR merge (operator merges via GitHub UI or `gh pr merge`).
4. After merge is confirmed, run `git worktree remove <path>` then `git branch -d <branch>` then `git worktree prune` in the main repo.

And THE SYSTEM SHALL NOT proceed past step 3 until merge is confirmed.

**Edge Cases**:
- Branch has uncommitted changes when `wt done` is invoked: print warning, refuse to create PR, exit.
- PR creation fails (network, GitHub API error): exit with error; worktree and branch remain intact.
- Branch is not ahead of trunk (nothing to merge): warn and exit without creating PR.
- `git branch -d` refuses (branch not fully merged — race condition between merge detection and branch delete): log error, leave branch for manual cleanup, still remove worktree path.

**Acceptance Criteria**:
- `wt done` refuses to proceed if `git status --porcelain` is non-empty.
- After successful teardown, `git worktree list` no longer shows the worktree path, and `git branch` no longer shows the feature branch.
- If the PR creation step fails, no worktree or branch is removed.

---

### REQ-006: Lefthook Guards — Branch-Name, Protected-Branch, and Drift

**EARS**: WHEN a git commit is attempted, THE SYSTEM SHALL (via lefthook pre-commit hooks):
- Block the commit if the branch name does not match the pattern `^(feature|fix|chore|release|app-factory|docs|spec)/[a-z0-9._-]+$` or exactly `dev`. The prefixes `main` and `main-internal` are NOT valid feature-branch prefixes (they are trunk names); branches named `main/foo` or `main-internal/foo` are rejected.
- Block the commit if the branch name is one of the protected branches for the repo archetype (Archetype A: `main`; Archetype B: `main-internal`).

**EARS**: WHEN a git push is attempted, THE SYSTEM SHALL (via lefthook pre-push hooks):
- Block the push if the destination ref is a protected branch for the repo archetype.
- Block the push if the local branch base is more than `DRIFT_THRESHOLD` commits behind the remote trunk (default: any divergence detected by `git fetch` followed by `git rev-list --count HEAD..origin/<trunk>`).
- Block the push if the staged/committed diff includes files matching `.kiro/`, `.windsurf/`, or `.claude/skills/` directory prefixes.
- Block the push if the staged/committed diff includes any binary file larger than 5 MB.

**Branch-name regex reconciliation**: The existing `anicca-project` `lefthook.yml` (line 20) permits `^dev$|^(feature|fix|chore|release|app-factory|docs|spec)/[a-z0-9._-]+$`. REQ-013 requires updating this repo's config to add the new hooks (drift-guard, mirror-block) WITHOUT overwriting the `aniccaai-landing-guard` hook and WITHOUT changing the branch-name regex unless explicitly migrating to include `main-internal` as a protected-prefix-block (not a feature-branch prefix). The `spec/` prefix is permitted in all archetypes. The `main-internal` string appears only in the PROTECTED list (Archetype B commits to `main-internal` are blocked), not as a branch-name prefix.

**Edge Cases**:
- `--no-verify` bypasses all lefthook hooks: this is acceptable because lefthook is advisory; GitHub server rules (REQ-008) provide the unbypassable layer.
- Drift-check requires network (`git fetch`): if network unavailable, log a warning and allow push (fail-open for drift only, not for protected-branch block).
- Monorepo with multiple directory archetypes: mirror-block applies only in Archetype A repos (`anicca`, `anicca-project`); not in `.openclaw`.
- Existing `aniccaai-landing-guard` hook in `anicca-project` MUST be preserved as-is; new hooks are merged in, not overwrote.

**Acceptance Criteria**:
- A commit on branch `my_feature` (no slash prefix) is blocked with a clear error message.
- A commit on branch `main/foo` is blocked (invalid prefix).
- A commit directly on `main` is blocked with a clear error message.
- A push that would put mirror directories (`.kiro/`, `.windsurf/`, `.claude/skills/`) into the product repo is blocked.
- A push of a binary file >5 MB is blocked with a clear error message.
- Drift-check: a branch 10 commits behind `origin/main` triggers a block warning.
- The `aniccaai-landing-guard` hook remains present and unchanged after REQ-013 installation.

---

### REQ-007: Stale-Ref Prune on Missing Worktree Directory

**EARS**: WHEN the janitor runs `git worktree list` and finds a worktree entry whose linked path does not exist on disk, THE SYSTEM SHALL run `git worktree prune --expire=now` to clean the stale reference, log the pruned entry, and MUST NOT attempt a reap action on that entry (it is already gone).

**Edge Cases**:
- Pruning fails (permission error, concurrent git process): log error, skip this entry, continue with remaining worktrees.
- The missing path was a runtime store worktree (`.openclaw`): `.openclaw` worktrees are forbidden by design (Archetype B); log a warning and skip.

**Acceptance Criteria**:
- After `git worktree prune`, `git worktree list` no longer shows the entry with the missing path.
- The janitor does not count manually-deleted worktree paths toward the reap count.

---

### REQ-008: GitHub Server-Side Protection (Archetype A repos)

**EARS**: WHEN the `anicca` or `anicca-project` GitHub repository is configured, THE SYSTEM SHALL have the following server-side settings applied that CANNOT be bypassed by `--no-verify`:
- `delete_branch_on_merge = true` so that merging a PR via GitHub UI automatically deletes the remote feature branch.
- A branch protection ruleset on `main` (and `main-internal` for `.openclaw`) that requires pull requests before merging, prohibits direct pushes, and prohibits force pushes.

**Edge Cases**:
- GitHub API call to set `delete_branch_on_merge` fails (network, permissions): log failure, retry once, raise error if still failing.
- `.openclaw` (Archetype B) must have `main-internal` protected but `main` is intentionally separate history (secret-free OSS export) — do not accidentally enable `delete_branch_on_merge` on the OSS `main` branch in that repo.

**Acceptance Criteria**:
- `gh api repos/<owner>/<repo> --jq '.delete_branch_on_merge'` returns `true` for `anicca` and `anicca-project`.
- A direct push to `main` on `anicca` or `anicca-project` is rejected by GitHub with a ruleset error.

---

### REQ-009: Archetype B — Runtime Repos Reject Worktree Creation

**EARS**: WHEN any git worktree command is invoked inside `.openclaw` or `anicca-monk-factory`, THE SYSTEM SHALL block worktree creation via a lefthook pre-command guard and log an explanatory error: "Archetype B repo — worktrees are forbidden; use single-checkout trunk commits only."

**EARS**: WHEN the gateway or any automated agent attempts `git checkout main` inside `.openclaw`, THE SYSTEM SHALL detect this via a lefthook post-checkout guard and exit 1 with the message: "Never checkout main in .openclaw — trunk is main-internal; checking out main replaces the working tree with the OSS skeleton."

**Edge Cases**:
- `git worktree list` (read-only query) is always allowed even in Archetype B repos.
- The `--no-verify` bypass is allowed (lefthook advisory); the critical invariant that protects the gateway is that `.openclaw` has no worktree support in its gateway config (enforced at the application layer, not git hooks alone).
- `anicca-monk-factory` worktrees forbidden because runtime-state image blobs must not be split across checkouts.

**Acceptance Criteria**:
- Running `git worktree add` in `.openclaw` triggers a lefthook hook that exits 1 with the Archetype B message.
- Running `git checkout main` in `.openclaw` triggers a post-checkout warning logged to stderr.
- `git worktree list` in `.openclaw` succeeds (exits 0) even with the guard installed.

---

### REQ-010: Existing-Litter Gated Remediation (classify before act)

**EARS**: WHEN the operator initiates litter remediation for existing stale worktrees (§6 of design spec), THE SYSTEM SHALL:
1. First run a classification-only pass: for each litter item, record its six ACTIVE predicates and produce a classify report without any mutation.
2. Only after operator reviews the classify report, act on items whose classification is `reapable` (all six inactive, no structural conditions).
3. For items classified as ACTIVE, produce a per-item action recommendation (leave / PR-extract / quarantine) but take no automated action.

**EARS**: WHEN the `docs/frank-article` branch (ahead 3048, active within 45 minutes of last known run) is encountered during litter remediation, THE SYSTEM SHALL classify it as ACTIVE (predicate 3 AND 4 both true), produce a recommendation to extract article files via a fresh branch off main and create a PR, and MUST NOT auto-delete it.

**Edge Cases**:
- An item was ACTIVE at classify time but becomes inactive (merged, cleaned) before the act pass: re-classify at act time.
- The `~/anicca-oss` duplicate clone is not a worktree — it is classified as a filesystem artifact and cleaned only after all six `feature/*` branches in it are resolved.
- Mirror untracked files (220 files in `anicca-project`) are not worktrees — they are handled by `.gitignore` addition, not by the janitor.

**Acceptance Criteria**:
- A classify-only run produces output listing all items with their ACTIVE status and all six predicate values, and exits 0 without modifying any git state.
- `docs/frank-article` appears in the classify report as ACTIVE with predicates `unmerged_into_trunk=true` and `recent_activity=true`.
- No automated delete command is issued during the classify pass.

---

### REQ-011: Concurrent Janitor Safety — Exclusive Lock for Full Critical Section

**EARS**: WHEN two or more instances of the worktree-janitor attempt to run concurrently against the same repository, THE SYSTEM SHALL:
- Allow exactly ONE instance to proceed. That instance MUST acquire an exclusive per-repo file lock (using `flock` semantics on `<repo>/.git/janitor.lock`) BEFORE performing ANY probe, classification, log write, or mutation.
- All other instances MUST exit immediately with exit code 1 and message "already running" WITHOUT performing any probe, classification, log write, or mutation.
- The lock MUST be held for the ENTIRE critical section: lock-acquire → probe → classify → log → mutate → lock-release. It is NOT released between log write and mutate.

**Edge Cases**:
- Lock file left behind by a crashed previous janitor instance (stale lock): after `LOCK_STALE_SECONDS` (default 300), the next instance may forcibly acquire the lock, logging the stale-lock event.
- Concurrent instances in different repos: no conflict (each repo has its own lock file at `<repo>/.git/janitor.lock`).
- Lock acquisition failure (unexpected FS error): log error and exit 1; perform NO actions.
- A second instance that started probing before instance A acquired the lock: the lock MUST be acquired BEFORE the probe starts; a second instance that cannot acquire the lock exits before probing.

**Acceptance Criteria**:
- Two concurrent janitor runs on the same repo: exactly one runs to completion including mutation; the other exits 1 with "already running" BEFORE performing any probe or mutation — within 1 second of startup.
- After one run completes, the next run starts normally (lock is released).
- The adversarial interleave test (PROP-014) verifies that even if instance B's startup races with instance A, B performs zero git operations after failing to acquire the lock.

---

### REQ-012: Full Evidence Logging Before Any Mutation

**EARS**: WHEN the janitor is about to perform any mutation (worktree remove, branch delete), THE SYSTEM SHALL have written to the quarantine log a structured entry containing: branch name, worktree path, predicate snapshot (all six values plus detached/in-progress fields), evidence counts (ahead/behind/uncommitted file count/stash count), last-activity epoch, merged-into SHA or PR number, and a "MUTATING" marker — all written and fsynced BEFORE the first mutation call.

**Edge Cases**:
- Log write fails (disk full, permission denied): abort the mutation and raise an error. Never mutate without a preceding log entry.
- Log write succeeds but subsequent mutation fails: log the failure as a separate entry. Leave the branch/worktree intact.

**Acceptance Criteria**:
- Inspecting the quarantine log immediately after a successful reap shows a `MUTATING` entry written before the deletion timestamp.
- If disk is full during log write, no mutation occurs.
- The `buildQuarantineEntry` unit test verifies the `marker="MUTATING"` field is present in the pre-mutation entry (PROP-030b).

---

### REQ-013: lefthook Installation Across All Repos

**EARS**: WHEN the hardening setup script runs, THE SYSTEM SHALL install lefthook in every repo in the two-archetype map:
- `anicca-project`: MERGE new hooks (drift-guard, mirror-block) into existing `lefthook.yml`; the existing `aniccaai-landing-guard` hook and the existing `valid-branch-name` regex MUST be preserved unchanged; run `lefthook install`.
- `anicca`: create `lefthook.yml` with the full Archetype A hook set; run `lefthook install`.
- `.openclaw`: create `lefthook.yml` with Archetype B hooks (no-worktree guard, no-checkout-main guard, secret-guard existing); run `lefthook install`.
- `anicca-monk-factory`: create `lefthook.yml` with Archetype B hooks; run `lefthook install`.

**Edge Cases**:
- `lefthook install` fails because lefthook binary is not on PATH: log clear error with install instructions; do not silently skip.
- Existing `lefthook.yml` in `anicca-project` has diverged from the expected schema: merge new hooks into existing file; do not overwrite the `aniccaai-landing-guard` hook.
- `lefthook install` MUST be idempotent: running it twice produces the same result.

**Acceptance Criteria**:
- `lefthook install` exits 0 in all four repos after setup.
- `git commit` on a forbidden branch in any repo triggers the appropriate hook error.
- The `aniccaai-landing-guard` hook in `anicca-project` is present and has the same content as before the setup script ran.
- The setup script can be run twice without error (idempotent).

---

### REQ-014: Squash-Aware Merged-Into-Trunk Determination

**EARS**: WHEN the probe computes whether a branch's work is merged into trunk, THE SYSTEM SHALL use the following squash-aware merged signal. A branch is considered MERGED-INTO-TRUNK if AND ONLY IF ALL of the following hold:

1. **Trunk is resolved**: `trunkResolved = true` (the trunk ref exists in this repo's trunk map and `git rev-parse <trunk>` succeeds).
2. **PR merged signal** (primary signal): `gh pr list --head <branch> --state merged --json number,mergedAt` returns a non-empty result (a merged PR exists for this branch). If this signal returns a merged PR, the branch is MERGED regardless of `git rev-list` output. If the gh CLI is unavailable or returns an error (offline, no GitHub remote), fall through to secondary signal.
3. **Secondary signal** (when PR API unavailable): the branch is considered MERGED if EITHER:
   - `git cherry <trunk> <branch>` returns ONLY lines beginning with `-` (all commits are equivalent in trunk — squash or rebase merged), OR
   - `git diff <trunk>...<branch>` is empty (the branch's tree is identical to trunk's tree), OR
   - `git rev-list --count <trunk>..<branch>` equals 0 (all commits reachable from trunk — standard merge commit case).
4. **Fail-closed on ambiguity**: If both the PR API and secondary signals are unavailable or produce errors, `unmerged_into_trunk = true` (treat as NOT merged).

**Squash-aware reap path** (the only automated path where `git branch -D` is permitted):
- **This path is reached ONLY from inside REQ-003 step 3's `if still reapable` AND-gate.** Its prerequisite list below is therefore ADDITIVE to — never a replacement for — the full six-predicate ACTIVE classification of REQ-001. A worktree MUST be classified non-ACTIVE by ALL of predicates 1–6 (and the two structural conditions) BEFORE this path is even evaluated. Restating the guard here does not narrow it.
- Prerequisites (all of REQ-001's non-ACTIVE conditions, made explicit for this most-dangerous operation): `prMergedState = 'merged'` (PR-API-confirmed), AND `uncommittedChanges = false`, AND `unpushedCommits = false`, AND `recentActivity = false`, AND `stashCount = 0`, AND `gitLocked = false`, AND `detachedHead = false`, AND `inProgressOp = null`.
- Log the PR number and `mergedAt` timestamp as evidence before any mutation.
- Execute: `git worktree remove <path>` then `git branch -D <branch>`.
- `git branch -D` is permitted ONLY on this path. On all other paths, only `git branch -d` is used.
- If the PR API signal cannot be obtained at delete time (re-probe), abort and use `git branch -d` (which will refuse the squash-merged branch and halt safely).

**Edge Cases**:
- Branch squash-merged into trunk: `git rev-list --count trunk..branch > 0` (the branch's original commits are not reachable from trunk under their SHAs). This is NOT unmerged — if PR-API confirms merged, the branch is MERGED.
- Branch merged via rebase-and-merge: commits are rebased and appear in trunk under new SHAs. `git cherry trunk branch` shows all `-` lines → MERGED.
- Branch with standard `--no-ff` merge commit: `git rev-list --count trunk..branch = 0` → MERGED.
- Offline environment (no `gh` available): secondary signal (git cherry / git diff) is used. If that also fails, FAIL-CLOSED → treat as NOT merged.
- PR exists but is OPEN (not merged): `prMergedState = 'open'` → treat as NOT merged → ACTIVE via predicate 3.
- PR closed but not merged (abandoned): `prMergedState` check only matches `state=merged`; a closed-not-merged PR does not satisfy the signal.

**Acceptance Criteria**:
- A branch squash-merged into trunk with a confirmed merged PR is classified as MERGED and eligible for reaping (given all other predicates false).
- A branch squash-merged but with `gh` offline falls through to secondary signal; if secondary signal also unavailable, classified as ACTIVE (fail-closed).
- A branch with an OPEN PR is classified as NOT MERGED → ACTIVE.
- `git branch -D` in the squash reap path is preceded by a log entry containing the PR number and `mergedAt`.
- `git branch -D` does NOT appear in any code path where `prMergedState != 'merged'`.

---

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | The pure `classifyWorktree` function must complete in < 1 ms per worktree record (CPU only, no I/O). The full janitor probe+classify loop for 10 worktrees must complete in < 30 seconds. |
| NFR-002 | Safety | The janitor must achieve zero false-negative ACTIVE classifications — it is always safer to leave a worktree than to delete it. False positives (leaving a reapable worktree) are acceptable. Any `WorktreeRecord` with at least one active signal (predicates 1–6, detachedHead, inProgressOp) MUST produce `status='active'` from `classifyWorktree`. |
| NFR-003 | Observability | Every janitor run must append a structured JSON summary to `janitor-run.log` (timestamp, repo, worktrees scanned, reapable count, quarantined count, deleted count, errors). |
| NFR-004 | Idempotency | Running the janitor twice in a row on a repo with no changes must produce identical quarantine log output and zero additional mutations. |
| NFR-005 | Portability | All shell scripts must be POSIX sh (no bash-isms). The Node.js janitor core must run on Node 18+. |
