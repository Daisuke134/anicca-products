# Writer active-six Order 1 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the installed creator and recovery run tested code from one explicit runtime root while sharing the existing explicit live state root, and eliminate the Python-through-bash guard failure.

**Architecture:** Reuse recovery's existing `ARTICLE_ROOT`/`ARTICLE_STATE_DIR` seam. Add the same seam to the creator, resolve wrapper and generated-prompt paths through it, and leave publisher adapters, state, targets, and schedules unchanged.

**Tech Stack:** Bash 3.2, Python 3, pytest, plistlib, launchd.

## Global constraints

- Runtime worktree: `/Users/anicca/profitable-claude/.worktrees/fix-writer-active-six`, branch `fix/writer-active-six`, base `4ee4e4f4d7e2457b8f78a739cc52a32c486c4fab`.
- Modify only the owned files below. Do not edit the shared checkout or runtime state.
- TDD is mandatory: record the failing command/output before production edits.
- `publication-guard.py` is always invoked with Python, never Bash.
- Active-six is Note JA, Zenn JA, Dev.to EN, Substack JA/EN, X Article JA. X Article EN and X Post JA remain dormant.
- Preserve stable targets, identity, receipts, ledger, secrets, PII, safety, deduplication, 06:00, and 300 seconds.
- Do not publish, kickstart, bootout, bootstrap, or edit installed plists from the Luna implementation task.

---

### Task 1: Explicit runtime/state roots and Python guard

**Files:**

- Modify: `skills/writer-agent/article-daily.sh`
- Modify: `tests/art/test_article_daily_single_full_pass.py`

**Interfaces:**

- Consumes: `ARTICLE_ROOT` as the immutable Writer code root and `ARTICLE_STATE_DIR` as the existing mutable state root.
- Produces: the existing daily wrapper behavior and prompt, with all Writer code paths rooted at `ARTICLE_ROOT`, all Writer state paths rooted at `ARTICLE_STATE_DIR`, and `python3 <ARTICLE_ROOT>/scripts/publication-guard.py mark-unavailable ...`.
- Preserves: recovery's current `ARTICLE_ROOT`/`ARTICLE_STATE_DIR` contract, active-six membership, dormant skips, schedules, and every stable target.

- [ ] **Step 1: Extend the real wrapper harness**

Add one test that prepares a fake Writer code tree outside `$HOME/profitable-claude`, supplies a separate explicit state directory, runs the real `article-daily.sh` through the existing fake model boundary, and inspects the generated prompt plus run location. The test must prove these observable behaviors:

```python
assert run_dir.is_relative_to(explicit_state_dir / "runs")
assert str(explicit_runtime_root) in prompt
assert str(explicit_state_dir) in prompt
assert f"python3 {explicit_runtime_root}/scripts/publication-guard.py mark-unavailable" in prompt
assert "bash " + str(explicit_runtime_root / "scripts/publication-guard.py") not in prompt
assert "~/profitable-claude/skills/writer-agent" not in prompt
```

Use a Python-3.9-compatible path containment assertion if `Path.is_relative_to`
is unavailable. Exercise the real wrapper and generated prompt; do not grep the
source as the test oracle.

- [ ] **Step 2: Run RED**

Run:

```bash
python3 -m pytest tests/art/test_article_daily_single_full_pass.py -k explicit_runtime -q
```

Expected: FAIL because the creator writes state and prompt code paths under the
HOME compatibility tree and the prompt contains `bash ...publication-guard.py`.

- [ ] **Step 3: Implement the smallest root-cause fix**

In `article-daily.sh`:

1. Resolve `ARTICLE_ROOT` with the existing compatibility default and resolve `STATE_DIR` from `ARTICLE_STATE_DIR` with `$ARTICLE_ROOT/state` only as the compatibility default.
2. Export the resolved root/state variables for every child process.
3. Replace wrapper-side Writer code paths with `$ARTICLE_ROOT` and mutable state paths with `$STATE_DIR`.
4. In the large single-quoted prompt, use distinct runtime-root and state-root placeholders; materialize them once when writing a new prompt, alongside `RUN_DIR_PLACEHOLDER`. Do not mutate an already-saved resume prompt.
5. Replace the one `bash ...publication-guard.py mark-unavailable` instruction with `python3 ...publication-guard.py mark-unavailable`.
6. Do not change publisher order, membership, retry policy, quality policy, or live-effect authorization.

- [ ] **Step 4: Run GREEN and focused regressions**

Run:

```bash
python3 -m pytest tests/art/test_article_daily_single_full_pass.py -k 'explicit_runtime or wrapper_starts_full_article_at_most_once or leaves_resumable_state or quality_block' -q
python3 -m pytest tests/art/test_article_exact8_schedule.py -k 'launchd_daily_and_resume_contracts_are_durable or pending_worker_routes_repairs_to_same_id_only' -q
bash -n skills/writer-agent/article-daily.sh
bash -n skills/writer-agent/scripts/article-resume-pending.sh
```

Success: all selected tests pass and both scripts parse cleanly.

- [ ] **Step 5: Scope and mutation checks**

Inspect the complete diff. Confirm only the two owned files changed. Mentally
mutate the runtime root back to HOME, state root back under code, or guard
interpreter back to Bash; the new test must fail for each mutation.

- [ ] **Step 6: Commit and push**

```bash
git add skills/writer-agent/article-daily.sh tests/art/test_article_daily_single_full_pass.py
git commit -m "fix(writer): isolate active-six runtime and state roots"
git push -u origin fix/writer-active-six
```

Return the RED evidence, GREEN commands/output, exact commit, pushed upstream,
complete diff summary, and any concern. Do not deploy or publish.

## Primary-only continuation

The primary reruns focused tests and inspects the exact diff, then dispatches
one fresh read-only Sol adversarial verifier on the exact pushed commit. After
acceptance, the primary performs the bounded installed-plist cutover, verifies
one creator/one recovery owner with unchanged schedules/environment, and only
then kickstarts the installed recovery loop to close Orders 2–5.
