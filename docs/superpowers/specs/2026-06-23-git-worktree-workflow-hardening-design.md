# Git Worktree / Branch Workflow Hardening — Design Spec

- **Date**: 2026-06-23
- **Author**: Dais + Claude Code (this session)
- **Status**: DESIGN (pre-implementation)
- **Method**: superpowers (HARD RULE #0) + VCSDD verification spine (HARD RULE 0.37)
- **Related**: `.claude/rules/worktree.md`, `.claude/rules/git-workflow.md`, `lefthook.yml`, CLAUDE.md "git 運用 BP", memory `feedback_push_constantly_or_die`

---

## 1. Goal

Make worktree/branch hygiene **structurally impossible to get wrong**, so the 2026-06-09 "3074-commit garbage branch" class of incident never recurs — **without ever deleting a worktree/branch that an agent is actively working on**.

The fix is NOT "another rule to remember". It is **defense-in-depth enforcement**: server-side (unbypassable) + local hook (advisory entry guard) + automated janitor (gated exit cleanup) + one atomic helper command (so the flow is one call, not five remembered steps).

## 2. Non-negotiable Safety Constraint (★ Dais 2026-06-23 ★)

> "there are all the ones working on each worktree and branch. so dont delete immediately."

- **NEVER auto-delete a worktree/branch that is ACTIVE.** A worktree is ACTIVE if ANY of:
  1. uncommitted changes (`git status --porcelain` non-empty), OR
  2. unpushed commits ahead of its own upstream, OR
  3. commits not yet merged into trunk (`git rev-list --count trunk..branch > 0`), OR
  4. recent activity (last commit / file mtime within the GRACE window, default 7 days), OR
  5. the worktree is `locked` (`git worktree lock`).
- The janitor **only ever reaps** worktrees that are `merged ∧ clean ∧ stale ∧ unlocked` AND it does so via **dry-run → quarantine list → grace period → confirmed delete**, never a one-shot `rm`.
- Every reap is **logged with full evidence** (branch, ahead/behind, last activity, merged-into-sha) before action. Silent deletion = forbidden.
- Hard delete of branch uses `git branch -d` (merged-only, refuses unmerged); `-D` (force) is **operator-only, never automated**.

## 3. As-Is (current state, measured 2026-06-23)

| repo | local | remote / trunk | lefthook | delete_branch_on_merge | worktree litter |
|---|---|---|---|---|---|
| anicca-project | `~/anicca-project` | anicca-products / `main` | ✅ (1 of 4) | ❌ false | 4 worktrees (2 merged, 1 = `docs/frank-article` ahead 3048) + 220 untracked mirror files |
| anicca | `~/anicca` | anicca / `main` | ❌ none | ❌ false | 6 stale `feature/*` (3wk old, ~448 behind) under a **duplicate clone** `~/anicca-oss` |
| .openclaw | `~/.openclaw` | anicca-dais / `main-internal` | ❌ none | ❌ false | worktree-forbidden (correct); .gitignore hole fixed earlier today |
| anicca-monk-factory | `~/anicca-monk-factory` | anicca-monk-factory-state / `main` | ❌ none | ❌ false | 162 regenerable image junk |

**Enforcement gaps**: server-side auto-delete OFF on all repos; no main-protection ruleset; lefthook only in 1 repo and advisory (`--no-verify` bypass); claimed "drift detection" not actually implemented; **zero automated exit cleanup**; mirror dirs (`.kiro/.windsurf/.claude/skills`) not blocked.

## 4. To-Be — Two Archetypes (the core design)

The mistake was treating all repos as one workflow. There are **two**:

### Archetype A — Dev repos (`anicca`, `anicca-project`)
```
latest trunk → cut 1 worktree+branch per task → commit-as-you-go+push →
PR → squash-merge → GitHub auto-deletes remote branch →
janitor auto-removes the local worktree+branch (ONLY if merged∧clean∧stale)
```
Guarded by: (A1) GitHub `delete_branch_on_merge=true` + main protection ruleset, (A2) lefthook entry-guard (branch-name/protected/drift/mirror-block), (A3) gated worktree-janitor cron, (A4) `wt` atomic helper.

### Archetype B — Runtime state repos (`.openclaw`, `anicca-monk-factory`)
```
single checkout, NO worktrees, gateway auto-commit+push to trunk
(.openclaw trunk = main-internal; never `git checkout main`)
```
Guarded by: (B1) `.gitignore` hygiene (regenerable/junk never tracked), (B2) secret-guard pre-push (existing), (B3) "never checkout main" guard, (B4) large-blob pre-commit block.

## 5. Components to Build

| ID | Component | What it does | Bypassable? |
|---|---|---|---|
| C1 | GitHub repo settings | `delete_branch_on_merge=true` on all 3 repos | No (server) |
| C2 | GitHub ruleset | main / main-internal = PR-only, no direct push, no force-push | No (server) |
| C3 | lefthook everywhere | install in anicca + monk; openclaw variant (main-internal protected, worktree-forbidden) | Yes (`--no-verify`) → advisory |
| C4 | lefthook drift-guard | pre-push: `git fetch`; block if branch base is >N behind trunk (actually implement the claimed feature) | advisory |
| C5 | lefthook mirror/blob block | reject `.kiro/`, `.windsurf/`, `.claude/skills/` and >5MB binaries in product repos | advisory |
| C6 | **worktree-janitor** cron | per dev repo: `fetch` → `worktree prune --expire` → list reapable (merged∧clean∧stale∧unlocked) → **dry-run log → quarantine → grace → delete**; delete merged remote branches | n/a (gated automation) |
| C7 | `wt` helper (`~/bin/wt`) | `wt new <name>` = worktree+branch off latest trunk; `wt done` = diff→PR→merge→remove→prune in ONE command | the canonical path |
| C8 | `GIT_WORKFLOW.md` + CLAUDE.md fix | one-page 2-archetype doc; correct the false "lefthook does drift detection" claim | docs |

## 6. Existing-litter remediation (GATED — agents may be working)

**Do NOT bulk-delete.** For each litter item, classify then act per the §2 safety gate:

| item | classify first | action if SAFE (merged∧clean∧stale) | action if ACTIVE |
|---|---|---|---|
| anicca-project `feature/web-i18n`, `feature/landing-ui-polish` (ahead 0) | confirm ahead 0 + clean + no live agent | `git worktree remove` + `git branch -d` | leave, notify owner |
| anicca-project `docs/tool-articles` (ahead 10) | has unmerged work | extract via PR, then remove | leave |
| anicca-project `docs/frank-article` (ahead 3048) | **never merge**; extract article files only to fresh branch off main | quarantine, PR the files | leave if active (it was active 45m ago → treat as ACTIVE) |
| anicca-project mirror 220 untracked | not a worktree | `.gitignore` + never commit | — |
| anicca `feature/*` ×6 (3wk, 448 behind) | per-branch `git diff trunk...branch` review | rebase+PR if valuable, else `-D`+remote del | leave if any active |
| `~/anicca-oss` duplicate clone | only after its 6 worktrees resolved | delete clone | leave |

## 7. Verification Architecture (VCSDD spine)

- **Behavioral spec (EARS)** authored via `/vcsdd:vcsdd-spec` — covers: janitor NEVER deletes active worktree (the critical invariant), `wt done` atomicity, lefthook blocks, GitHub settings applied.
- **RED tests first**: a test harness repo/fixture with (a) an active worktree (uncommitted), (b) a merged-clean-stale worktree, (c) an unmerged worktree, (d) a locked worktree → assert janitor reaps ONLY (b), in dry-run produces correct quarantine list, and a grace-period gate.
- **Adversarial gate** (`vcsdd:vcsdd-adversary`, fresh context): forced to find a path where the janitor deletes something an agent was working on. Binary PASS/FAIL with file:line.
- **No-mock E2E**: run janitor `--dry-run` against the REAL repos; assert the quarantine list contains ONLY the §6 SAFE items and ZERO active worktrees, before any real delete.
- **Done = 4-D convergence**: spec ✓ + tests ✓ + impl ✓ + E2E dry-run on real repos shows no active worktree in reap set ✓.

## 8. Out of scope (this spec)

- Rewriting existing `.git` history to reclaim the 3.5GB openclaw bloat (separate, irreversible, operator-gated).
- Purging ID images / secrets from openclaw git history (separate security task).
- Migrating monk-factory off image-in-git (light, P2).

## 9. Rollout order

P0 server (C1,C2) → P0 gated litter triage (§6, classify-only first) → P1 janitor build+VCSDD verify (C6) → P1 helper (C7) → P1 lefthook spread (C3,C4,C5) → P2 docs+memory (C8). Server settings are safe and unbypassable, so they go first; destructive cleanup waits behind the verified janitor + classification.
