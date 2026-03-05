# US-007 Testing Recipe — TODO (Improvements to Apply)

**Date:** 2026-03-05
**Target:** `.claude/skills/mobileapp-builder/references/us-007-testing.md` + `docs/TEST_SPEC.md`
**Sources:**
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — "Prompt chaining: trade off latency for higher accuracy"
- [RevenueCat Sandbox Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox) — "Test Store works immediately without platform setup"
- TDD Workflow SKILL.md — "ALWAYS write tests first"
- Maestro UI Testing SKILL.md — "clearState + id: selectors + extendedWaitUntil"
- CLAUDE.md — "xcodebuild direct execution prohibited. Fastlane only"

---

## 1. Recipe Structure Changes

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 1 | Skill references: 4 → 2 | `tdd-feature`, `integration-test-scaffold`, `test-data-factory`, `maestro-e2e` | `/tdd-workflow` + `maestro-ui-testing` only. Inline core rules from each | us-007-testing.md |
| 2 | Add variable section at top | `<AppName>`, `$UDID` undefined | `APP_SCHEME=DeskStretch`, UDID via `xcrun simctl list devices available \| grep "iPhone.*Booted"` | us-007-testing.md |
| 3 | Add dependency check (Gate 0) | No check — runs even with 0 source files | `find DeskStretch -name "*.swift" -not -path "*/Tests/*" \| grep -q . \|\| exit 1` | us-007-testing.md |

## 2. Build Tool Changes (xcodebuild → Fastlane)

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 4 | Quality Gate build command | `xcodebuild -scheme <AppName> build` | `xcodegen generate && cd DeskStretchios && FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build` | us-007-testing.md |
| 5 | Step 2 test command | `xcodebuild test` | `fastlane test` | us-007-testing.md |
| 6 | Step 5 all-test command | `xcodebuild test` + `maestro test flows/` | `fastlane test` + `maestro test maestro/` | us-007-testing.md |
| 7 | Add xcodegen generate step | Not mentioned | Add as first step in Quality Gate (xcodegen projects need .xcodeproj generation) | us-007-testing.md |
| 8 | Add Fastfile template | No Fastfile setup instructions | Add template section with `test`, `build`, `build_for_simulator` lanes | us-007-testing.md |
| 9 | Add env vars to all Fastlane commands | `FASTLANE_OPT_OUT_CRASH_REPORTING=1` missing | Add to all Fastlane invocations | us-007-testing.md + TEST_SPEC.md |
| 10 | TestTarget Info.plist | Not mentioned | Add `GENERATE_INFOPLIST_FILE: YES` in project.yml template | us-007-testing.md |

## 3. StoreKit → RevenueCat Test Store

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 11 | Remove StoreKit Configuration step | Step 3: "Products.storekit — monthly + annual" | Delete Step 3 entirely. RC Test Store handles testing. No .storekit file needed when using RevenueCat | us-007-testing.md |
| 12 | Replace with RC Test Store instructions | N/A | "Use RevenueCat Test Store API Key for development. Switch to production key before launch." | us-007-testing.md |
| 13 | Remove Products.storekit from AC | "Products.storekit exists" | Replace with "RC Test Store purchase flow verified" | us-007-testing.md |

## 4. TDD Workflow Integration

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 14 | Reference /tdd-workflow skill | No TDD cycle mentioned | "Follow `/tdd-workflow` skill: RED → GREEN → REFACTOR for each test file" | us-007-testing.md |
| 15 | Split Step 2 into 2a + 2b | "Unit + Integration" combined | Step 2a: Unit Tests (7 files), Step 2b: Integration Tests (5 files) | us-007-testing.md |
| 16 | Specify execution order | No order | Models first (no deps) → Services → Integration. Order: PainArea → UserProgress → BreakSchedule → StretchExercise → ProgressService → AIStretchService → Notification | us-007-testing.md |
| 17 | Swift Testing framework | Not mentioned | "Use Swift Testing (`@Test`, `#expect`, `@Suite`). XCTest only for Integration tests." | us-007-testing.md |
| 18 | Parameterized tests | Not mentioned | "Use `@Test(arguments:)` for enum iteration (PainArea.allCases, valid intervals)" | us-007-testing.md |
| 19 | Add coverage check | No coverage requirement | "fastlane test with code coverage. Target: 80%+" | us-007-testing.md |

## 5. Maestro E2E Improvements

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 20 | Directory name | `flows/` | `maestro/` (matches actual directory structure) | us-007-testing.md |
| 21 | Add clearState + clearKeychain | Not present | All clean-state flows start with `- clearState` + `- clearKeychain` | us-007-testing.md + TEST_SPEC.md |
| 22 | Add extendedWaitUntil | Not present (immediate taps) | 30000ms for app launch, 10000ms for screen transitions | us-007-testing.md + TEST_SPEC.md |
| 23 | Add takeScreenshot | Not present | `- takeScreenshot: "flow-name"` at end of each flow | us-007-testing.md + TEST_SPEC.md |
| 24 | Use id: selectors only | Mixed text/id | `id:` primary, `text:` fallback only for system dialogs with `optional: true` | us-007-testing.md + TEST_SPEC.md |
| 25 | Add tags | No tags | `smokeTest` (01, 02), `onboarding`, `timer`, `paywall` | us-007-testing.md + TEST_SPEC.md |
| 26 | Maestro execution method | `maestro test flows/` | `maestro test maestro/` (CLI). Note: CLI is the chosen method for this project | us-007-testing.md |
| 27 | Add CI timeout guidance | Not present | "CI machines are slower. Use 30000ms timeouts. Run locally 3x before merge." | us-007-testing.md |

## 6. Rule 21 (AI Prohibition) Fixes

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 28 | Edge Case #7 | "Foundation Models timeout → Fall back to static routine" | Delete. No AI in app (Rule 21). Static content only | TEST_SPEC.md |
| 29 | Performance: AI generation | "AI generation < 3s" | "Routine generation < 500ms" (static filtering is fast) | TEST_SPEC.md |
| 30 | AIStretchService test names | `testFallback*` (implies AI fallback) | `testGenerate*` (normal logic, not fallback) | TEST_SPEC.md |

## 7. Acceptance Criteria Expansion

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 31 | Expand AC from 5 → 10 | 5 items only | Add: TDD cycle compliance, 80%+ coverage, id: selectors, clearState, Edge Case mapping | us-007-testing.md |
| 32 | Add Edge Case → Test mapping | Edge Cases listed but not mapped to test files | Add mapping table: Edge Case # → Test file + test name | TEST_SPEC.md |

## 8. Mock Check Improvement

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 33 | Mock grep precision | `grep -r 'Mock' --include='*.swift' . \| grep -v Tests/` | `grep -rw 'class Mock' --include='*.swift' DeskStretch/ \| grep -v Tests/ \| wc -l` | us-007-testing.md |

## 9. Session Splitting

| # | TODO | Current | Fixed | File |
|---|------|---------|-------|------|
| 34 | Document session split | US-005b/006/007 in one undefined flow | 3 separate ralph sessions: Session 1 = US-005b (RC), Session 2 = US-006 (iOS impl), Session 3 = US-007 (Testing). Each has independent Gate. | us-007-testing.md |

---

## Summary

| Category | Count |
|----------|-------|
| Recipe Structure | 3 |
| Build Tools (→ Fastlane) | 7 |
| StoreKit → RC Test Store | 3 |
| TDD Workflow | 6 |
| Maestro E2E | 8 |
| Rule 21 Fixes | 3 |
| AC Expansion | 2 |
| Mock Check | 1 |
| Session Splitting | 1 |
| **Total** | **34** |
