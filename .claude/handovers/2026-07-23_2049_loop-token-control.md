# Loop token control handover

- **Spec/TODO SSOT:** `/Users/anicca/anicca-project/.worktrees/loop-token-handover-20260723/docs/loop-engineering/loop-control-plane-token-reduction.md`, section `Remaining TODO (SSOT)`.
- **Spec worktree:** `/Users/anicca/anicca-project/.worktrees/loop-token-handover-20260723`; branch `docs/loop-token-handover-20260723`; base commit `5a61251e35b0cc3eaaa79354e352fd371ba39b11`.
- **Implementation repo:** `/Users/anicca/profitable-claude`; branch `deploy/gig-speedy-reply-cutover`; upstream `origin/deploy/gig-speedy-reply-cutover`; inspected commit `63f1e092f2bf7664a4c73bda937c1f1e8caf57b6`.
- **Protected implementation dirt:** deleted `skills/article-writer/topics/queue/genshijin-codex-token-cost-benchmark.md` and untracked `skills/article-writer/topics/in-progress/genshijin-codex-token-cost-benchmark.md` are user Writer work. Never stage, move, delete, or overwrite them.
- **Runtime repo:** `/Users/anicca/.openclaw`; branch `main-internal`; inspected commit `116e5973f536a23cea5e319f6e558abfcd9d208f`; heavily dirty runtime/user state. Inspect read-only unless an exact runtime change is required.
- **Do not use:** dirty root `/Users/anicca/anicca-project` or unrelated `/Users/anicca/anicca-project/.worktrees/capafy-handover-20260723-root`.
- **Current item:** Gig TODO 1, feedback/artifact idempotency. A valid accepted v7 artifact exists while the same buyer feedback is still pending.
- **Completed evidence:** Gig targeted baseline is 19 pytest cases plus 5 paid-work gate subtests passing. launchd migration tests are 32 passing. OpenClaw has zero enabled SQLite cron jobs.
- **Active failure:** `ai.anicca.hf-gig-pass` is idle and its last exit code is 1. The current state can reconstruct already accepted work instead of reconciling delivery.
- **Live/public side effects:** no customer-visible action is performed by this handover. The latest request remains blocked on `formal_delivery_not_confirmed`; do not force delivery for validation.
- **First safe resume action:** fetch and verify every routed repository, preserve dirty files, then add a failing replay regression proving that unchanged feedback plus the valid artifact invokes the high-value runner zero times. Implement the smallest idempotency/state-routing change and verify with fixtures before any live run.
