---
name: handover-run
description: Capture a long-running agent session into a restartable handover and an exact user-sent /goal. Use when the user asks for /handover, session restart, context transfer, resume instructions, or preservation before leaving. Reconcile the live spec, agents, processes, git/remotes, deployments, evidence, blockers, and uncommitted work; commit and push scoped state when authorized.
---

# Handover Run

Produce a handover that lets a fresh session continue from evidence without reconstructing the conversation.

## Ground the live state

1. Read the applicable `AGENTS.md`, the active Goal when available, the named canonical spec/live ledger, and the latest handover.
2. Use the project's Goal Setter skill when available; read it completely before drafting `/goal`.
3. Observe current state instead of copying stale claims:
   - active subagents and their final messages;
   - process plus heartbeat/log delta for background executors;
   - relevant worktrees, branches, dirty files, HEAD/upstream, PRs, and remote ancestry;
   - deployment/provider/runtime state;
   - evidence paths, hashes, modes, and the latest test/review results.
4. Treat self-reports as leads. Confirm material claims from the shared filesystem, git remote, runtime, or evidence artifact.

## Stabilize before handing over

- Do not start unrelated implementation.
- Update the sole live-state spec with facts that changed. Never mark blocked or unverified work done.
- Preserve user and executor work; never reset, clean, or mix unrelated changes.
- Stage only scoped handover/spec/order/skill files. Run fresh diff/format checks, fetch, commit, push, and verify the remote SHA.
- If an executor remains active, record its exact task, worktree, heartbeat, release boundary, and how a new session should reattach or replace it. Do not leave duplicate writers on the same worktree.
- Send external email/message only when the user's final instruction still explicitly requests it. A later withdrawal cancels the send.

## Write the handover

Follow the repository convention, normally `.claude/handovers/YYYY-MM-DD_HHMM_<slug>.md`. Keep it concise but include:

- objective and exact Done condition;
- authority split between orchestrator, builders, reviewers, and humans;
- canonical spec and other source-of-truth paths;
- completed facts with exact commits/PRs/deployments/evidence;
- current pending atomic, blocker, failed approaches and false hypotheses;
- active agent/process/worktree/heartbeat state;
- uncommitted or unpushed work and ownership;
- immediate first checks and next allowed action;
- production, privacy, financial, broadcast, and approval boundaries;
- exact restart `/goal`.

Exclude secrets, auth tokens, raw private payloads, and unnecessary PII. Reference protected evidence by path plus hash/mode.

## Draft the restart Goal

- Define the final user-visible outcome, evidence for Done, hard boundaries, iteration policy, and true stop condition—not a verbose implementation plan.
- Name only the mandatory read-first anchors; let the fresh executor discover adjacent files.
- Require progress from fresh tool evidence, SSOT updates, scoped commit/push, and no unverified Done claims.
- For work requiring `spawn_agent` or `create_thread`, emit the exact `/goal …` line for the user to send; do not auto-activate it.
- Keep the Goal below the runtime's 4,000-character limit and validate it once with the Goal Setter validator when available.

## Final response

Return the pushed branch/SHA, a link to the handover file, whether any external message was sent, and the exact `/goal` in a copyable code block. State any live blocker plainly.
