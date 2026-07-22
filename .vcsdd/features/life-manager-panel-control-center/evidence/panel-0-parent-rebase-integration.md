# PANEL-0 parent rebase integration evidence

## Scope and exact revisions

- Old PANEL head: `eb51a2a89f0f86d9f6b9a5268af914e7a5dd8991`.
- Old merge base: `f6129abb5eff30848ed9296abef1cb3d2fe7e977`.
- Measured parent: `c01057a0bfc0d5f1c0e1a308bd3c5de102d659fa` on `origin/feature/lm33d-daily-preflight`.
- Rebased and reviewed code head: `a4c86991469419b8f775cfcb89776e89b832b5df`.
- Local recovery ref: `refs/sol-recovery/panel-rebase-parent-eb51a2a8` resolves to the exact old PANEL head.
- Entry gate: local HEAD, upstream, remote feature branch, and PR #331 head all equal the old PANEL head; the worktree is clean.
- Entry PR state: PR #330 is OPEN/CLEAN at the measured parent; PR #331 is OPEN/DIRTY at the old PANEL head against base `feature/lm33d-daily-preflight`.

This integration does not edit the canonical consolidation spec, deploy, merge a PR, apply a migration, start OAuth, send Telegram/email/calls, or mutate production/staging.

## Rebase and semantic conflict resolution

The exact replay command is:

```text
git rebase --onto c01057a0bfc0d5f1c0e1a308bd3c5de102d659fa f6129abb5eff30848ed9296abef1cb3d2fe7e977 feature/lm-panel-control-center
```

All 14 PANEL-only commits replay. Conflict resolution keeps the complete parent ledger suffix and appends the PANEL ledger events, keeps the parent canonical spec byte-for-byte, keeps global active feature `fable5-config-slimdown`, and adds the PANEL feature to the global index without replacing the parent active feature.

Authoritative Git behavior used for the operation:

- Source: [git-rebase](https://git-scm.com/docs/git-rebase) / Core quote: “transplant a topic branch ... using rebase --onto”.
- Source: [git-range-diff](https://git-scm.com/docs/git-range-diff) / Core quote: “shows the differences between two versions of a patch series”.
- Source: [git-push](https://git-scm.com/docs/git-push) / Core quote: `--force-with-lease` requires the updated remote ref to retain the expected value.

## Replay audit

- `git range-diff f6129abb...eb51a2a8 c01057a0...a4c86991` maps all 14 old commits to all 14 rebased commits.
- Twelve commits are patch-equivalent. The two conflict-bearing commits differ only by removal of the old canonical-spec edits and preservation of parent global VCSDD state/history.
- Canonical consolidation spec diff from the parent: `0`.
- Parent CORE 8d implementation, test, verifier, and evidence path diff from the parent: `0`.
- Old versus rebased `apps/life-call` aggregate patch SHA-256: `3960dec12345b39028ce582acc722ee090cb1f87dec1fbae1028b8249ed8c880` on both sides.
- Old versus rebased PANEL feature artifact patch SHA-256: `c4129d3c4295f5718f3a6aef2f2ff9d0cf59b19ea076bf076e1292e8a90dcf5a` on both sides.
- Changed assertion diff: `27/27` lines identical; deleted or weakened assertions: `0`.
- Ledger preservation: parent CORE feature events `475/475`; PANEL feature events `22/22`.
- Index preservation: `activeFeature=fable5-config-slimdown`, with both `fable5-config-slimdown` and `life-manager-panel-control-center` registered.

No conflict-resolution runtime bug appears, so the order does not require an invented RED test.

## Exact-head verification

All commands run against exact reviewed code head `a4c86991469419b8f775cfcb89776e89b832b5df`.

| Gate | Exact command | Result |
|---|---|---|
| corrective4 logout | `cd apps/life-call && node --test --test-reporter=tap lib/panel-corrective4-logout.test.js` | exit 0; `1/1` pass |
| corrective3 four blockers | `cd apps/life-call && node --test --test-reporter=tap lib/panel-corrective3-four-blockers.test.js` | exit 0; `4/4` pass |
| permanent session | `cd apps/life-call && node --test --test-reporter=tap lib/panel-permanent-session.test.js` | exit 0; `17/17` pass |
| focused PANEL | `cd apps/life-call && node --test --test-reporter=tap lib/panel-permanent-session.test.js lib/panel-ui.test.js lib/panel-auth.test.js lib/panel-api.test.js lib/panel-control-center.test.js lib/user-selector.test.js` | exit 0; `63/63` pass |
| full life-call | `cd apps/life-call && npm test` | exit 0; `390/390` pass (`389` Node tests plus the scheduler script; parent increases the prior `378` count) |
| deterministic eval | `cd apps/life-call && npm run eval` | exit 0; calendar `21/21`, late `12/12`, total `33/33` |
| API smoke | `cd apps/life-call && npm run smoke:panel-api` | exit 0; `5/5` HTTP 200 |
| UI smoke | `cd apps/life-call && npm run smoke:panel-ui` | exit 0; `6/6` sections present; semantic controls wired |
| whitespace/conflict check | `git diff --check` | exit 0 |

The parent CORE 8d focused preservation command is:

```text
node --test --test-concurrency=1 apps/life-call/lib/daily-preflight-final-schema.test.js apps/life-call/lib/daily-preflight-poll-boundaries.test.js apps/life-call/lib/daily-preflight-provenance.test.js apps/life-call/lib/daily-preflight-purity-contract.test.js apps/life-call/lib/transport/mail-gog-receipt.test.js apps/life-call/lib/daily-preflight-abort-lineage.test.js .vcsdd/features/life-manager-daily-preflight/tests/verifier-contracts.test.mjs
```

It reproduces the tracked parent state exactly: exit `1`, `142 total / 136 pass / 6 fail`. The same six inherited review6 RED contracts remain present: tracked closure, injected schema root, recursive privacy scope, same-invocation provenance, receipt send boundary, and non-cooperative timer semantics. This is a parent preservation gate, not a PANEL regression or a claim that CORE 8d review6 is GREEN.

## Fresh artifact-only review

- Reviewed exact head: `a4c86991469419b8f775cfcb89776e89b832b5df`.
- Verdict: `PASS`.
- Critical findings: `0`.
- Important findings: `0`.
- Parent preserved: `yes`.
- Assertions weakened: `no`.
- Five closed blockers preserved: `5/5` — native scoped selects, convergent hash-only rotation, server Max-Age/idle-family behavior, malformed batch fail-closed behavior, and resolved-family CSRF logout.

The reviewer receives only the order, artifacts, and exact SHAs in a fresh context and performs a read-only review.

## Authorization boundary

- Deploy: `0`.
- PR merge: `0`.
- Migration application: `0`.
- OAuth/provider/account mutation: `0`.
- Telegram/email/call send: `0`.
- Production/staging request or mutation: `0`.
- Production L3 claim: `0`.
- Canonical §10 completion claim: `0`.

Post-push PR head equality and mergeability are verified from GitHub after this tracked evidence commit is pushed and are reported in the integration handoff.
