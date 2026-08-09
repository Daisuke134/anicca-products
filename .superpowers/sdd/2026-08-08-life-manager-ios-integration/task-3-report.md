# Task 3 — Japanese real-staging Maestro slice report

## Result

`BLOCKED`: the Japanese flow and its English symmetry were corrected to preserve
the pre-authorized Keychain boundary, and all local contract tests are green.
The real staging E2E reached the first app assertion but could not continue
because the Simulator had no usable authenticated staging session. The app
showed the localized fatal surface (`Something went wrong` / `Try again`), and
the flow stopped at `profile.name`. No callback, bearer token, refresh token,
production login, provider disconnect, or Calendar event mutation was added.

## Scope and ownership

- Worktree: `/Users/anicca/anicca-project/.worktrees/lm-ios-integration-final`
- Branch: `feat/lm-ios-integration-final`
- Base at start: `eace31095`
- Owned tracked files: `MaestroFlowContractTests.swift`,
  `test_harness.sh`, `english-onboarding-route.yaml`,
  `japanese-onboarding-route.yaml`, and this report.
- The concurrent SDD plan/spec/progress edits and untracked
  `apps/life-manager/supabase/` were preserved.

## Implementation

The locale flows now:

1. launch without `clearState` or `clearKeychain`;
2. begin at the authenticated tenant's profile boundary;
3. never accept or manufacture `STAGING_CALLBACK_URL`;
4. retain the real profile → phone skip → analysis → route → detail →
   paywall → free path → settings journey; and
5. assert Japanese route/detail/paywall/chat/settings chrome and explicitly
   reject corresponding English product labels.

The contract test and static harness now fail closed if either locale flow
reintroduces a callback URL, state/keychain clearing, or missing stable leaf
IDs. The Settings navigation title is asserted as `設定` in the Japanese flow.

## TDD evidence

### RED

Before the flow/harness change:

```text
rtk xcodebuild test -project LifeManager.xcodeproj -scheme LifeManager \
  -destination 'platform=iOS Simulator,id=9ACA3F0A-5A16-4705-A502-0B81DDB7149A' \
  -only-testing:LifeManagerUnitTests/MaestroFlowContractTests/testLocaleFlowsReusePreauthorizedSessionAndCoverRealJourneyLeafIDs \
  CODE_SIGNING_ALLOWED=NO
```

Observed `xcodebuild_rc=65`: the old English flow still contained
`STAGING_CALLBACK_URL`, `clearState`, and `clearKeychain`, the old Japanese
flow still contained `STAGING_CALLBACK_URL`, and the flows had no `chat.list`
leaf assertion. Evidence: `apps/life-manager-ios/build/Evidence/task-3-japanese-red.log`.

### GREEN

```text
bash apps/life-manager-ios/maestro/test_harness.sh
# PASS: real-provider Maestro harness static contracts

maestro check-syntax apps/life-manager-ios/maestro/english-onboarding-route.yaml
maestro check-syntax apps/life-manager-ios/maestro/japanese-onboarding-route.yaml
# OK / OK

rtk xcodebuild test -project LifeManager.xcodeproj -scheme LifeManager \
  -destination 'platform=iOS Simulator,id=9ACA3F0A-5A16-4705-A502-0B81DDB7149A' \
  -only-testing:LifeManagerUnitTests/MaestroFlowContractTests \
  -only-testing:LifeManagerUnitTests/LocalizationConsistencyTests \
  CODE_SIGNING_ALLOWED=NO
# xcodebuild_rc=0; 9 tests, 0 failures; TEST SUCCEEDED
```

`git diff --check` also passed. Focused contract-only GREEN was 7/7 before
the combined 9-test run.

## Isolated staging readback and state mutations

The staging health check succeeded:

```text
GET https://life-call-staging-staging.up.railway.app/health -> HTTP 200
{"ok":true,"service":"life-call","ws":"/ws","build":"lm2a-webhook-retry-v1"}
```

The only staging mutation attempted by this slice was the existing public
one-use state boundary, with an idempotency key supplied in the process only:

```text
POST /api/mobile/v1/session/calendar/start -> HTTP 200
json_keys=authorizationUrl,expiresAt,state
has_state=yes
has_authorization_url=yes
has_expires_at=yes
```

The callback URL and state values were never printed, persisted in the repo,
or passed to Maestro. The state was not exchanged and is allowed to expire at
the server TTL. No profile, locale, analysis, Calendar, route-provider, or
outbox mutation was made by the readback commands.

The repo-external handoff file was inspected by shape only; its values were
never printed:

```text
/tmp/lm-mobile-session-handoff.json: present
keys: accessToken, expiresAt, refreshExpiresAt, refreshToken, tokenType
```

Using those process-only values for isolated staging readback produced:

```text
GET /api/mobile/v1/bootstrap -> HTTP 401
POST /api/mobile/v1/session/refresh -> HTTP 401
error_code=refresh_replay
```

The handoff file mtime was `2026-08-09T10:46:26+0900` and its size was 227
bytes. No new session or production test login was created. No provider account
was disconnected, and no Calendar event was created, deleted, or changed.

The safe precondition repair (scoping one isolated UID, then resetting only
`lm_users` profile fields and `lm_mobile_analysis_states`) was not executed:
the process had no staging Supabase service credential, and the local Railway
CLI was linked to the production environment. No Railway variable read/write
or database mutation was attempted because production is forbidden in this
slice.

## Real Japanese E2E attempts

Target: `iPhone 17`, iOS 26.5,
Simulator UDID `9ACA3F0A-5A16-4705-A502-0B81DDB7149A`.

The flow was run with only non-secret profile inputs (`PROFILE_NAME` and
`PROFILE_HOME`) and with the Keychain-preserving `launchApp`. It never used
`clearState`, `clearKeychain`, `openLink`, or a callback URL.

1. First attempt: Maestro iOS driver startup timed out before flow execution:
   `IOSDriverTimeoutException: iOS driver not ready in time`.
2. Retry with `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000`: driver started and the
   flow reached `profile.name`, then failed because the app showed
   `Something went wrong`.
3. Final retry with `MAESTRO_DRIVER_STARTUP_TIMEOUT=180000`: same result at
   `profile.name`. This is a staging-session/bootstrap blocker, not a
   localization assertion failure.

The final run output was:

```text
Running on iPhone 17 - iOS 26.5 - 9ACA3F0A-5A16-4705-A502-0B81DDB7149A
Launch app "ai.anicca.life-manager"... COMPLETED
Assert that id: profile.name is visible... FAILED
Assertion 'id: profile.name is visible' failed
```

Maestro's failure screenshot visibly shows `Something went wrong` and
`Try again`. Because the staging access token was 401 and the refresh token
was replayed, no safe session repair input remained in this slice. Work stops
here rather than manufacturing a callback or bypassing the pre-authorized
boundary.

## Artifact hashes

All local screenshots/videos/logs are outside Git. Relevant SHA-256 values:

```text
task-3-japanese-red.log
  e661f124d0e1839e7dd551f8442399fda68b1f86ece009879c4238e3d58e1abf
task-3-japanese-contract-green.log
  4e7d22434e55fba595eb11e2109a98079a39dd8bf3845a6503cefab210816274
task-3-japanese-focused-tests.log
  58a59e18ed246a10d547068f5cf59bfff6c6950a9ca37ce2cdf8ff00f7e2355f
task-3-japanese-harness-green.log
  91674ecfa83abc79094f8d61e043d46914729889f96fbd54d5676d6f665d3581
task-3-japanese-real-staging-blocked.log
  09e4531da57ff1346127341d90568d4292771b019777ea61a5d429e2fedf76a4
task-3-japanese-real-staging-rerun.log
  0e1cd44c7927cb51f24e884b2d348023e19f6425658b54cf6d24688102108b31
task-3-japanese-real-staging-final.log
  636601708652ac1b026fd2b2baaa6e9ad9ca6c420b653dee7e633de7c26d0906
final Maestro failure screenshot
  200baf77a4ba5861431a8ead0640a326c1bb477275a2eedebffb0bb9f02a8f8b
final Maestro failure hierarchy JSON
  e39bcc7df76b8f989b010d1b3e5d5259fbc76198631af7259149c1bdcd2aec6f
```

The final Maestro debug bundle is at:
`/Users/anicca/.maestro/tests/2026-08-09_150203`.

## Cleanup and readback

- No cleanup endpoint was needed: the one-use OAuth state was not exchanged,
  and it expires automatically.
- No provider proxy DELETE/GET, database DELETE, account DELETE, disconnect,
  or revoke operation ran.
- Simulator state was not cleared. The app was only launched and observed.
- `apps/life-manager-ios/build/Evidence/` remains ignored and contains no
  tracked secret-bearing artifact.
- `apps/life-manager/supabase/` remains untracked and untouched.

## Commit and push

Tracked flow/test/harness, report, and concurrent SDD plan/spec/progress edits
were committed and pushed:

```text
0442e2bfe990dbff416dbccd95e889c0f4d5d087
test(life-manager-ios): preserve staging locale session flows
origin/feat/lm-ios-integration-final: eace31095..0442e2bfe
```

The untracked `apps/life-manager/supabase/` directory was not staged.

## Blocker and next safe action

An operator must provide or freshly establish an isolated pre-authorized
staging session using the existing approved handoff mechanism. Once
`GET /bootstrap` returns 200 for that session and the app is visibly at the
profile/chat boundary, rerun only the Japanese flow and record the route,
detail, paywall, and Settings screenshots. Do not add a fixed callback URL,
create a production login, clear the Keychain, disconnect the shared Google /
Composio account, or mutate unrelated Calendar events.
