# Behavioral Specification — git-worktree-workflow-hardening

- **Feature**: git-worktree-workflow-hardening
- **Phase**: 1a (EARS behavioral spec)
- **Date**: 2026-06-23
- **VCSDD Epic**: VCSDD-git-worktree-workflow-hardening-1782181898898
- **Design source**: `docs/superpowers/specs/2026-06-23-git-worktree-workflow-hardening-design.md`

---

## Purity Boundary Analysis

The system has a clean split between deterministic classification logic and impure git side-effects.

**Pure core** — the reap-decision function `classifyWorktree(worktreeRecord) → WorktreeStatus`:
- Accepts a `WorktreeRecord` (branch, ahead, behind, uncommitted, lastActivityEpoch, isLocked, mergedIntoTrunk, graceWindowDays) as plain data.
- Returns one of `{ status: 'reapable' | 'active' | 'protected', reason: string }`.
- Zero side effects. Fully unit-testable with in-process fixtures.
- Contains ALL five ACTIVE predicate checks — if ANY returns true, status is `active`.

**Impure shell** — everything that touches the filesystem or git:
- `git worktree list --porcelain` (probe)
- `git status --porcelain` (probe)
- `git rev-list --count trunk..branch` (probe)
- `git log -1 --format=%ct` + file mtime (probe)
- `git worktree prune --expire` (mutation)
- `git worktree remove` (mutation)
- `git branch -d` (mutation — refuses unmerged; never `-D`)
- `gh api` / `gh repo edit` (mutation — GitHub settings)
- `lefthook install` (mutation — hook installation)
- Writing to quarantine log file (side effect)

The janitor harness composes: probe → pure classify → log → (after grace) → mutate. The pure core is tested in isolation from git.

---

## Requirements

### REQ-001: Never-Delete-Active-Worktree Invariant (highest priority)

**EARS**: WHEN the worktree-janitor evaluates any worktree for reaping, THE SYSTEM SHALL classify that worktree as ACTIVE and exclude it from all reap actions if ANY ONE of the following five predicates is true:
1. `uncommitted_changes`: `git status --porcelain` in the worktree path returns one or more lines.
2. `unpushed_commits`: the branch has commits ahead of its own tracking upstream (`git rev-list --count @{u}..HEAD > 0`), or no upstream is configured.
3. `unmerged_into_trunk`: `git rev-list --count <trunk>..<branch> > 0` — at least one commit on the branch is not reachable from the repo's trunk ref.
4. `recent_activity`: the timestamp of the latest commit in the worktree OR the most recent file mtime within the worktree path falls within the configured grace window (default 7 days).
5. `git_locked`: the worktree is marked locked by `git worktree lock` (`locked` field present in `git worktree list --porcelain` output).

**Edge Cases**:
- All five predicates false (merged, clean, stale, unlocked): worktree enters dry-run-only quarantine (REQ-003).
- Exactly one predicate true: worktree is ACTIVE — full stop, no further action.
- Upstream ref missing (no tracking branch): treat as `unpushed_commits = true` (conservative).
- Detached HEAD worktree: treat as `unmerged_into_trunk = true` (cannot determine merge status; conservative).
- Worktree directory deleted manually (stale git ref): treat as `git_locked = false`, run `git worktree prune` to clear dangling ref, then skip reap (REQ-007).
- `docs/frank-article` branch (ahead 3048 of trunk, active 45 minutes ago): predicates 3 AND 4 both true → ACTIVE, never auto-deleted.

**Acceptance Criteria**:
- Given a worktree with any single ACTIVE predicate true, the janitor dry-run output log MUST NOT list that worktree in the quarantine set.
- Given a worktree satisfying all five INACTIVE conditions, the janitor lists it in quarantine only after dry-run, never deletes in the same execution.
- The pure `classifyWorktree` function, called with a `WorktreeRecord` where any one field signals ACTIVE, returns `{ status: 'active' }`.
- Force-delete (`git branch -D`) MUST NOT appear anywhere in automated janitor code paths; it is operator-only.

---

### REQ-002: Reap-Decision Purity

**EARS**: WHEN the janitor invokes the worktree classification step, THE SYSTEM SHALL compute the reap/active/protected decision entirely within a pure function that receives only serializable data (no git command execution), so that the decision is reproducible and unit-testable without a live git repository.

**Edge Cases**:
- `graceWindowDays = 0`: recent_activity predicate is always false (disables grace, useful for tests only).
- `lastActivityEpoch = 0` (unknown): treat as recent (conservative — recent_activity = true).
- All numeric fields are non-negative integers; function must not call git, read files, or produce side effects.

**Acceptance Criteria**:
- Unit tests for `classifyWorktree` run without any git binary or repository on the test machine.
- Full predicate coverage: at least one test case per predicate asserting ACTIVE, plus the all-clear case asserting `reapable`.

---

### REQ-003: Dry-Run → Quarantine → Grace → Confirmed-Delete Pipeline

**EARS**: WHEN the janitor identifies a worktree as `reapable` (all five INACTIVE conditions satisfied), THE SYSTEM SHALL execute the following gated pipeline and MUST NOT skip any step:
1. **Dry-run log**: append a structured entry to the quarantine log (`janitor-quarantine.log`) containing: branch name, worktree path, evidence snapshot (ahead/behind counts, last activity epoch, merge SHA), timestamp, and the word "DRY-RUN". No mutation occurs.
2. **Grace period check**: if the quarantine log entry for this worktree was written less than `GRACE_PERIOD_HOURS` ago (default 24h), abort — no mutation.
3. **Confirmed delete**: only after the grace period has elapsed, execute in order: `git worktree remove <path>` then `git branch -d <branch>`. If either step fails, log the error and halt — do not proceed to the other step.
4. **Post-delete log**: append a completion entry to the quarantine log with the actual deletion timestamp and git output.

**Edge Cases**:
- `git branch -d` refuses because branch is unmerged (git safety check catches what our predicate missed): log error, halt, do NOT use `-D`.
- Janitor runs concurrently (two cron invocations overlap): each instance must hold a file lock on the quarantine log before writing; second instance exits if lock is unavailable.
- Worktree reappears as active between dry-run and confirmed-delete (agent resumes work during grace period): re-classify at confirmed-delete time; if now ACTIVE, abort delete and log.
- `GRACE_PERIOD_HOURS = 0`: allowed in dry-run-only mode (for test fixtures); still does not skip the quarantine log step.

**Acceptance Criteria**:
- A worktree classified as `reapable` in a janitor run is NEVER deleted in the same run — always requires a separate run after the grace period.
- The quarantine log entry is written before any mutation.
- If re-classification at confirmed-delete time returns ACTIVE, the worktree is NOT deleted.
- Concurrent janitor instances: second instance exits cleanly (no duplicate mutations).

---

### REQ-004: `wt new` Atomic Worktree Creation

**EARS**: WHEN the operator runs `wt new <name>`, THE SYSTEM SHALL atomically:
1. Fetch the latest trunk from remote (`git fetch origin <trunk>`).
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
- Block the commit if the branch name does not match the pattern `^(dev|main|main-internal|feature|fix|chore|release|app-factory|docs|spec)/[a-z0-9._-]+$` (or exactly `dev`).
- Block the commit if the branch name is one of the protected branches for the repo archetype (Archetype A: `main`; Archetype B: `main-internal`).

**EARS**: WHEN a git push is attempted, THE SYSTEM SHALL (via lefthook pre-push hooks):
- Block the push if the destination ref is a protected branch for the repo archetype.
- Block the push if the local branch base is more than `DRIFT_THRESHOLD` commits behind the remote trunk (default: any divergence detected by `git fetch` followed by `git rev-list --count HEAD..origin/<trunk>`).
- Block the push if the staged/committed diff includes files matching `.kiro/`, `.windsurf/`, or `.claude/skills/` directory prefixes.
- Block the push if the staged/committed diff includes any binary file larger than 5 MB.

**Edge Cases**:
- `--no-verify` bypasses all lefthook hooks: this is acceptable because lefthook is advisory; GitHub server rules (REQ-008) provide the unbypassable layer.
- Drift-check requires network (`git fetch`): if network unavailable, log a warning and allow push (fail-open for drift only, not for protected-branch block).
- Monorepo with multiple directory archetypes: mirror-block applies only in Archetype A repos (`anicca`, `anicca-project`); not in `.openclaw`.

**Acceptance Criteria**:
- A commit on branch `my_feature` (no slash prefix) is blocked with a clear error message.
- A commit directly on `main` is blocked with a clear error message.
- A push that would put mirror directories (`.kiro/`, `.windsurf/`, `.claude/skills/`) into the product repo is blocked.
- A push of a binary file >5 MB is blocked with a clear error message.
- Drift-check: a branch 10 commits behind `origin/main` triggers a block warning.

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
1. First run a classification-only pass: for each litter item, record its five ACTIVE predicates and produce a classify report without any mutation.
2. Only after operator reviews the classify report, act on items whose classification is `reapable` (all five inactive).
3. For items classified as ACTIVE, produce a per-item action recommendation (leave / PR-extract / quarantine) but take no automated action.

**EARS**: WHEN the `docs/frank-article` branch (ahead 3048, active within 45 minutes of last known run) is encountered during litter remediation, THE SYSTEM SHALL classify it as ACTIVE (predicate 3 AND 4 both true), produce a recommendation to extract article files via a fresh branch off main and create a PR, and MUST NOT auto-delete it.

**Edge Cases**:
- An item was ACTIVE at classify time but becomes inactive (merged, cleaned) before the act pass: re-classify at act time.
- The `~/anicca-oss` duplicate clone is not a worktree — it is classified as a filesystem artifact and cleaned only after all six `feature/*` branches in it are resolved.
- Mirror untracked files (220 files in `anicca-project`) are not worktrees — they are handled by `.gitignore` addition, not by the janitor.

**Acceptance Criteria**:
- A classify-only run produces output listing all items with their ACTIVE status and all five predicate values, and exits 0 without modifying any git state.
- `docs/frank-article` appears in the classify report as ACTIVE with predicates `unmerged_into_trunk=true` and `recent_activity=true`.
- No automated delete command is issued during the classify pass.

---

### REQ-011: Concurrent Janitor Safety (file lock)

**EARS**: WHEN two or more instances of the worktree-janitor attempt to run concurrently against the same repository, THE SYSTEM SHALL ensure that only one instance holds the exclusive write lock on the quarantine log at a time; all other instances MUST exit immediately with a non-zero exit code and a clear "already running" message, without performing any dry-run writes or delete mutations.

**Edge Cases**:
- Lock file left behind by a crashed previous janitor instance (stale lock): after `LOCK_STALE_SECONDS` (default 300), the next instance may forcibly acquire the lock, logging the stale-lock event.
- Concurrent instances in different repos: no conflict (each repo has its own lock file).

**Acceptance Criteria**:
- Two concurrent janitor runs on the same repo: exactly one runs to completion; the other exits 1 with "already running" within 1 second.
- After one run completes, the next run starts normally (lock is released).

---

### REQ-012: Full Evidence Logging Before Any Mutation

**EARS**: WHEN the janitor is about to perform any mutation (worktree remove, branch delete), THE SYSTEM SHALL have written to the quarantine log a structured entry containing: branch name, worktree path, predicate snapshot (all five values), evidence counts (ahead/behind/uncommitted file count), last-activity epoch, merged-into SHA, and a "MUTATING" marker — all written and fsynced BEFORE the first mutation call.

**Edge Cases**:
- Log write fails (disk full, permission denied): abort the mutation and raise an error. Never mutate without a preceding log entry.
- Log write succeeds but subsequent mutation fails: log the failure as a separate entry. Leave the branch/worktree intact.

**Acceptance Criteria**:
- Inspecting the quarantine log immediately after a successful reap shows an entry with all required fields written before the deletion timestamp.
- If disk is full during log write, no mutation occurs.

---

### REQ-013: lefthook Installation Across All Repos

**EARS**: WHEN the hardening setup script runs, THE SYSTEM SHALL install lefthook in every repo in the two-archetype map:
- `anicca-project`: update existing `lefthook.yml` to add drift-guard and mirror-block hooks.
- `anicca`: create `lefthook.yml` with the full Archetype A hook set; run `lefthook install`.
- `.openclaw`: create `lefthook.yml` with Archetype B hooks (no-worktree guard, no-checkout-main guard, secret-guard existing); run `lefthook install`.
- `anicca-monk-factory`: create `lefthook.yml` with Archetype B hooks; run `lefthook install`.

**Edge Cases**:
- `lefthook install` fails because lefthook binary is not on PATH: log clear error with install instructions; do not silently skip.
- Existing `lefthook.yml` in `anicca-project` has diverged from the expected schema: merge new hooks into existing file; do not overwrite the `aniccaai-landing-guard` hook.

**Acceptance Criteria**:
- `lefthook install` exits 0 in all four repos after setup.
- `git commit` on a forbidden branch in any repo triggers the appropriate hook error.

---

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | The pure `classifyWorktree` function must complete in < 1 ms per worktree record (CPU only, no I/O). The full janitor probe+classify loop for 10 worktrees must complete in < 30 seconds. |
| NFR-002 | Safety | The janitor must achieve zero false-negative ACTIVE classifications — it is always safer to leave a worktree than to delete it. False positives (leaving a reapable worktree) are acceptable. |
| NFR-003 | Observability | Every janitor run must append a structured JSON summary to `janitor-run.log` (timestamp, repo, worktrees scanned, reapable count, quarantined count, deleted count, errors). |
| NFR-004 | Idempotency | Running the janitor twice in a row on a repo with no changes must produce identical quarantine log output and zero additional mutations. |
| NFR-005 | Portability | All shell scripts must be POSIX sh (no bash-isms). The Node.js janitor core must run on Node 18+. |
