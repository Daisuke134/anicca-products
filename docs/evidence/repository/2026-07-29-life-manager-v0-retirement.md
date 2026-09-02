# Life Manager v0 retirement evidence

## Outcome

`Daisuke134/life-manager-v0` (repository ID `1273052304`) is a public,
read-only historical archive. Current development, issues, and installation
live only in `Daisuke134/life-manager` (repository ID `1248111245`).

No history rewrite, force-push, source deletion, or production cutover was
used. The v0 Git history remains fetchable.

## Source inventory and history

Fresh GitHub tree readback returned 35 tracked blobs / 184,580 bytes. The ten
commits preserve these behavior groups:

| v0 group | Historical behavior | Canonical counterpart / adjudication |
|---|---|---|
| `planner.js`, `call/` | pre-event escalation and Telnyx/Gemini call bridge | `apps/life-call/scheduler.js`, `lib/wake-filter.js`, `lib/call-bridge.cjs` |
| `travel/` | location resolution and travel block insertion | `apps/life-call/lib/travel.js`, transit/routes adapters, daily journey contract |
| `ask/` | ask only after location resolution fails | `apps/life-call/lib/ask.js`; issue-#11 regression test |
| `notify/`, `locate/` | late-risk, approval, and motion gate | canonical wake/late/notify modules and scheduler |
| config/adapters | local/cloud transport boundary | canonical `apps/life-call/lib/transport/` and runtime configuration |
| README/SKILL/E2E spec | original product contract | preserved in archive; current documentation is canonical repo only |

Fresh legacy verification before changing the README:

| Contract | Result |
|---|---|
| `node --test` | 48/48 PASS |
| `python3 travel/__tests__/test_travel_fill.py` | 9/9 PASS |
| v0 current-tree gitleaks | PASS |

Fresh canonical equivalence suite covered onboarding/context, travel,
transit/routes, return travel, ask/autofill, wake/call, ledger, feature
discovery, scheduler, and the controlled daily journey: 146/146 PASS.
This is behavioral evidence for not copying the old implementation wholesale;
it does not erase open production-outcome gates.

## Issue transfer and adjudication

All 11 open v0 issues were transferred to the canonical tracker. GitHub
retained their bodies/comments and the old URLs redirect:

| v0 | Canonical | Adjudication |
|---:|---:|---|
| 1 | 1277 | implementation present; generalized-tenant outcome remains open |
| 2 | 1278 | travel implementation/tests present; real calendar ratio remains open |
| 3 | 1279 | wake/call implementation/tests present; provider call IDs remain open |
| 4 | 1280 | Luma proof exists; generalized/connpass contract remains open |
| 5 | 1281 | dedicated consented outreach loop not found; pending |
| 6 | 1282 | partial feedback surfaces/history; canonical self-contained E2E pending |
| 7 | 1283 | marketing machinery exists; product URL/metrics outcome remains open |
| 8 | 1284 | cost/outcome ledger contracts present; production summary readback remains open |
| 9 | 1285 | design preserved; cloud personal CEO remains outside current bounded slice |
| 10 | 1286 | T-10/T-5 controlled proof present; three real provider events remain open |
| 11 | 1287 | candidate-first autofill regression passes; ten-real-event ratio remains open |

Each canonical issue has a public adjudication comment separating implemented
machinery from its remaining real-world success metric. After transfer,
v0 returned open issues `0`; old issue #1 resolved to canonical #1277 and old
issue #11 resolved to canonical #1287.

## Redirect and archive readback

PR [life-manager-v0 #12](https://github.com/Daisuke134/life-manager-v0/pull/12)
replaced only the README with a redirect-only notice and merged as
`210adead08afbb5a19902b5b107fcf0601fad387`.

Final repository API readback:

| Field | Value |
|---|---|
| repository ID | `1273052304` |
| visibility | public |
| archived | true |
| default branch | main |
| open issues | 0 |
| main / remote HEAD | `210adead08afbb5a19902b5b107fcf0601fad387` |

## Primary-source basis

GitHub's archive documentation says: “You can archive a repository to make it
read-only for all users and indicate that it's no longer actively maintained.”
It also recommends updating the README and closing issues/PRs before archive.
Source:
[GitHub — Archiving repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories).

GitHub's issue-transfer documentation says: “When you transfer an issue,
comments and assignees are retained,” and the original URL redirects to the
new issue. Source:
[GitHub — Transferring an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/transferring-an-issue-to-another-repository).
