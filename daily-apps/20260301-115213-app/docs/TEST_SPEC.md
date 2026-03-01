# Test Specification: Micro Mood

## Test Pyramid

| Layer | Ratio | Tool | Coverage Target |
|-------|-------|------|----------------|
| Unit Tests | 70% | Swift Testing (Xcode 16) | 80%+ |
| Integration Tests | 20% | XCTest | Key flows |
| E2E Tests | 10% | — (no UI changes in test loop) | N/A for v1 |

## Unit Tests

### MoodStore Tests

| # | Test Name | Description | Assert |
|---|-----------|-------------|--------|
| T-MS-1 | `testSaveMoodEntry_persistsCorrectly` | Save entry, fetch, verify all fields | moodLevel, note, timestamp match |
| T-MS-2 | `testFetchEntries_returnsInChronologicalOrder` | Save 5 entries, fetch | descending timestamp order |
| T-MS-3 | `testFetchEntries_withLimit_returnsCorrectCount` | Save 10, fetch limit=7 | count == 7 |
| T-MS-4 | `testDeleteEntry_removesFromStore` | Save, delete, fetch | count == 0 |
| T-MS-5 | `testFetchEntriesSince_filtersCorrectly` | Save entries across 60 days, fetch since 30d | only entries in range |

### InsightEngine Tests

| # | Test Name | Description | Assert |
|---|-----------|-------------|--------|
| T-IE-1 | `testGenerateInsight_bestDay_isCorrect` | Feed 14 entries (Fridays high, Mondays low) | bestDay == "Friday" |
| T-IE-2 | `testGenerateInsight_worstDay_isCorrect` | Same data | worstDay == "Monday" |
| T-IE-3 | `testGenerateInsight_weekAverage_isCorrect` | 7 entries with known avg 3.4 | weekAverage ≈ 3.4 (±0.1) |
| T-IE-4 | `testGenerateInsight_withNoEntries_returnsDefault` | Empty array | No crash, default values |
| T-IE-5 | `testGenerateInsight_notePattern_isDetected` | 10 entries: 5 with note (avg 4.2), 5 without (avg 2.8) | pattern mentions notes |

### SubscriptionManager Tests

| # | Test Name | Description | Assert |
|---|-----------|-------------|--------|
| T-SM-1 | `testCheckStatus_freeUser_isPro_false` | Mock RC returning free entitlements | isPro == false |
| T-SM-2 | `testCheckStatus_proUser_isPro_true` | Mock RC returning active "pro" entitlement | isPro == true |
| T-SM-3 | `testFetchOfferings_setsCurrentOffering` | Mock RC offering fetch | currentOffering != nil |

### MoodLevel Tests

| # | Test Name | Description | Assert |
|---|-----------|-------------|--------|
| T-ML-1 | `testMoodLevel_allCasesHaveEmoji` | Iterate all MoodLevel cases | emoji != nil for each |
| T-ML-2 | `testMoodLevel_colorIsAssigned` | Each case has distinct color | colors unique per case |
| T-ML-3 | `testMoodLevel_initFromInt_validRange` | Init from 1-5 | all succeed |
| T-ML-4 | `testMoodLevel_initFromInt_outOfRange` | Init from 0, 6 | returns nil |

## Integration Tests

| # | Test Name | Flow Tested |
|---|-----------|-------------|
| T-INT-1 | `testCheckInFlow_savesAndDisplays` | CheckInViewModel → MoodStore → HomeViewModel refresh |
| T-INT-2 | `testPaywallTrigger_onHistoryLimit` | Free user scrolls past 30 entries → paywall shown |
| T-INT-3 | `testHealthKit_writesOnProStatus` | SubscriptionManager.isPro=true → HealthKitService.writeMoodSession called |

## Test File Locations

```
MicroMoodiOS/
└── MicroMoodiOSTests/
    ├── MoodStoreTests.swift
    ├── InsightEngineTests.swift
    ├── SubscriptionManagerTests.swift
    ├── MoodLevelTests.swift
    └── Integration/
        ├── CheckInFlowTests.swift
        └── PaywallTriggerTests.swift
```

## Test Execution

```bash
# Run all tests via Fastlane (CRITICAL RULE 4)
cd MicroMoodiOS && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane test

# Expected output:
# ✓ MoodStoreTests (5 tests)
# ✓ InsightEngineTests (5 tests)
# ✓ SubscriptionManagerTests (3 tests)
# ✓ MoodLevelTests (4 tests)
# ✓ Integration/CheckInFlowTests (3 tests)
# Total: 20 tests PASSED
```

## Coverage Requirements

| Component | Target Coverage |
|-----------|----------------|
| MoodStore | 90% |
| InsightEngine | 85% |
| MoodLevel | 100% |
| SubscriptionManager | 70% (RC SDK mocked) |
| Overall | 80%+ |

## Test Data Setup

```swift
// Helper: InMemory CoreData stack for tests
static func makeTestContainer() -> NSPersistentContainer {
    let container = NSPersistentContainer(name: "MicroMoodCoreData")
    container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
    container.loadPersistentStores { _, error in
        if let error { fatalError("Test store failed: \(error)") }
    }
    return container
}
```
