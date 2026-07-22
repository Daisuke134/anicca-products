# PANEL-0 delegation honesty corrective — Sol order

## One atomic only

Fix the single reproduced release blocker on `feature/lm-panel-release`: chat/API currently accept `delegation_enabled`, persist nothing, but return `ok=true`, `Setting updated`, and a succeeded receipt while the panel correctly says delegation is unavailable.

Build with genuine RED first, implement the minimal honest-unavailable behavior, run the specified verification, perform one concise focused diff review yourself, update release evidence, commit/push, and open the release PR to `dev`. Do not start another adversarial-review loop.

## Exact baseline

- Worktree: `/Users/anicca/anicca-project/.worktrees/lm-panel-release`
- Branch: `feature/lm-panel-release`
- Required starting HEAD/upstream/remote: `f1fba91a0ff569b9b415db8565153b99502ec21a`
- Product commit: `492174ed2cf43417256842bd87279993cffb9af7`
- Base dev: `5a4ec98e9a4b2919958ad3d2a95ef78fc9970b69`
- Existing evidence: `.vcsdd/features/life-manager-panel-control-center/evidence/panel-0-standalone-release-integration.md`
- Exact manager reproduction: `parseUserCommand("turn delegation on")` returns a setting command; `executeUserCommand` receives an RPC-shaped response without `delegation_enabled` yet returns `ok=true`, message `Setting updated`, receipt `succeeded`, persisted=false.

Read repository rules and the canonical spec §9.5, §10 row 8d.1, §10.0, §10.2. Use the relevant TDD and verification skills. Do not edit the canonical consolidation spec on this branch.

## Product decision

No safe delegated-action runtime exists. Therefore do **not** add a fake DB column or enable delegation. The correct behavior is:

- panel continues to show delegation `unavailable` with a human reason;
- EN/JA chat delegation ON/OFF phrases receive a direct, honest unavailable report;
- the unavailable report contains no question and requests no approval;
- direct panel/API `setting.set:delegation_enabled` is rejected fail-closed;
- no preference mutation, succeeded receipt, OAuth/provider call, or other side effect occurs;
- help/available-action copy must not advertise delegation as executable while unavailable.

Exact user-facing wording may be concise, but must say that delegation is unavailable because no safe delegated-action runtime is active. Do not change §9.11 copy; this is operational error/status copy.

## TDD and implementation

1. Verify exact clean baseline and fetch without rebasing yet. If `origin/dev` or the release remote moved, record it; do not absorb unrelated work until the corrective is green.
2. Add one focused behavior test file (or the smallest existing focused test) that proves RED on the untouched product commit:
   - `turn delegation on`, `turn delegation off`, `委任をオン`, `委任をオフ` resolve to an honest unavailable outcome, not a command;
   - available actions do not claim delegation can be toggled;
   - direct `validateCommand({type:"setting.set",setting:"delegation_enabled",value:true})` rejects;
   - executing a direct delegation command cannot mutate preferences or create/finish a succeeded receipt;
   - the Telegram dispatch path maps the unavailable parse outcome to the honest status message and does not call `executeUserCommand`.
3. Run the focused test against parent `492174ed2...` or before production edits and capture genuine failure output. Commit RED separately.
4. Implement the smallest production change. Prefer a small testable dispatch/response helper shared by `server.js` and the focused test over source-regex assertions. Preserve all other settings, panel/session/logout/provider behavior, and current-dev integration decisions.
5. Run the focused test GREEN and commit implementation separately.

## Verification

Run from `apps/life-call`:

- new delegation honesty test
- `lib/panel-control-center.test.js`
- corrective4 logout `1/1`
- corrective3 four-blocker `4/4`
- permanent session `17/17`
- same focused PANEL suite (previous release result `62/62` before adding the new test)
- full `npm test`
- `npm run eval` (`33/33` expected)
- API smoke (`5/5` expected)
- UI smoke (`6/6` expected)
- `git diff --check`
- scope proof: daily-preflight path 0, canonical spec diff 0, assertion weakening 0

Then do one concise builder-side focused review of only this diff: false-success eliminated, chat/API fail-closed, no success receipt/mutation, no question/approval language, no regression. Do not spawn another reviewer and do not expand into process/coverage/style findings.

Update the existing standalone release evidence with RED SHA, GREEN SHA, exact totals, manager reproduction closure, focused review result, and side effects 0. Commit/push. Fetch and rebase onto latest `origin/dev` only if needed; if rebased, rerun the new test + focused PANEL + full test.

Open a new PR `feature/lm-panel-release -> dev` if one does not exist. State explicitly that unfinished CORE 8d / PR #330 is excluded. Do not merge.

Final report must include HEAD/upstream/remote/PR equality, PR URL/state/checks, RED/GREEN/evidence SHAs, exact verification totals, clean status, and confirmation that migration/merge/deploy/provider/OAuth/TG/email/call/L3 side effects remain zero.

## Stop

Stop only for a genuine destructive/provider/broadcast boundary or three independent failed methods. Ordinary RED, conflict, or tooling issue is not a wait point. Do not ask for approval.

