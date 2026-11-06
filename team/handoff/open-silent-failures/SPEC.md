# PR #887: public dashboard follow-up

## Scope and acceptance

Extend the existing `feat/open-silent-failures-886` branch, preserving commit
`a72119d1de04e7f9d1b3d67587ac5761091ab669`. Only the public dashboard UI,
its focused tests/fixtures, and this handoff spec change. No collector, published
JSON, X/R1 operations, private-source reads, merge, or deployment changes.
This path is absent from the local checkout and branch readback; this document
establishes the requested handoff spec and explicitly authorizes the optional
`public_work[]` and aggregate usage follow-up.

Source: https://github.com/Daisuke134/anicca-products/pull/887#issuecomment-6677645626
Culture source: repo `CULTURE.md`, “Transparency Is the Default” and
“Measure everything, estimate nothing.” No invented culture copy.

## Optional published portfolio fields

`metrics.json.public_work` is an optional array. Render only these seven fields:
`priority`, `owner`, `action`, `quantity_goal`, `done_criteria`,
`last_evidence_public`, `blocker_public`. Preserve source order and exact public
text; missing/empty values are `unknown`, never zero. Missing/empty arrays show
“Shared targets are not published yet”. The fixture contains the six scrubbed
rows in the source comment. The last row's private SSOT URL is omitted (null,
rendered unknown) under the user's explicit prohibition on private source paths.
Never infer rows from private data or put fixture rows into production HTML.
Render text escaped, ignore extra fields, suppress personal-track rows and
redact contacts, credential material, and private paths at the UI boundary.
Upstream public data must still be scrubbed; UI filtering is no authorization
to publish private source data. Existing public portfolio lists apply the same
personal/private text boundary; this does not change any underlying work.

`metrics.json.usage_snapshot` is an optional object, separate from costs:
- `source`: public tool name, e.g. `CheckSubscriptionUsage`.
- `measured_at`: ISO timestamp with explicit UTC offset; `timezone`: IANA zone.
- `plan`: plan name.
- `weekly_usage_percent`: percent of the shared weekly limit used.
- `grok_bot_share_percent`: Grok Bot share of total usage, not weekly limit.
- `bots[]`: `owner`, `percent` (share within Grok Bot, not total usage).
- `reset_at`: ISO timestamp with explicit UTC offset, in the stated zone.
- `fixture_only`: true labels screenshot/test data as fixture only.

No existing usage measurement schema is present in the checked-in published
JSON; `grok_ultra` contains billed/recurring costs, not usage. This optional UI
contract extends the same portfolio JSON envelope without modifying its current
contents or collectors. Missing usage shows “Usage snapshot is not published
yet”; invalid/missing percentages or timestamps remain unknown. Never calculate
unreported usage, residual bot shares, live rates, or zeros.

## Safe fixture measurement (not published JSON)

Measured 2026-11-05 21:27 America/Los_Angeles
(`2026-11-05T21:27:00-08:00`), Plan Ultra. Weekly usage limit 10.6% used,
shared with other plan apps. Grok Bot share of that total 10.4%. Within Grok Bot:
参謀 39%, Codex 21%, X Operator 10%, Applications 6%, dr eggbot 6%.
Reset Thu Nov 12 20:30 local (`2026-11-12T20:30:00-08:00`).
These values replace the comment's older snapshot only in the test fixture.

## Execution / validation cursor

1. Specify optional fields and privacy/unknown rules (this document).
2. Add failing UI behavior tests and safe fixture; implement minimal rendering.
3. Run focused existing/new tests and a real local browser screenshot with only
   safe fixture responses, no external telemetry or private browser profile.
4. Commit and push to the same PR; no merge/deploy. Record actual results here.

Completion means pushed follow-up, passing UI tests, actual screenshot path,
and explicit remaining published-data limitations; it never means deployed.

## Verified results and remaining blockers

- New behavior tests: 8 failures before implementation, 8 passes afterward.
- Related UI/data regression command: 66 tests passed, 0 failed:
  `node --test apps/landing/scripts/open/*test.mjs apps/landing/scripts/check-open-data.test.mjs apps/landing/scripts/stage-open-data.test.mjs apps/landing/scripts/open-team-activity.test.mjs apps/landing/lib/dashboard-core.test.mjs`.
- `git diff --check`: pass. Published JSON and collectors remain unchanged.
- Actual browser screenshot: NOT obtained. Playwright with installed Chrome
  aborts with SIGABRT immediately on launch, including an isolated temporary
  profile and crash directory. Native Safari is rejected by automatic approval
  review (Safari not approved). Shared CDP is refused by the lease guard; no
  shared browser is used and no guard is bypassed. No screenshot file is claimed.
- Screenshot fixture: `apps/landing/scripts/open/fixtures/public-follow-up.json`;
  all measurement values are test-only and visibly labeled by the UI.
- Current published JSON has neither optional field. The public page therefore
  shows the unpublished-state messages until a separately owned publisher adds
  scrubbed data. No deployment or merge occurs in this follow-up.
- Original `.git` is read-only in this environment (`FETCH_HEAD` write denied).
  Commit/push uses a writable temporary Git metadata directory with this same
  worktree and branch, preserving the original parent commit. The original
  checkout's local ref/index cannot be advanced here; remote PR readback is the
  authoritative result. This is a local metadata limitation, not a second UI PR.

Current cursor: push verified follow-up to PR #887; screenshot remains unverified
under the concrete browser/approval constraints above.
