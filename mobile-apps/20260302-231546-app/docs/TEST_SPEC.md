# Test Specification: SleepRitual

**App**: SleepRitual
**Date**: 2026-03-02

---

## 1. Test Strategy

| Layer | Tool | Target Coverage |
|-------|------|----------------|
| Unit Tests | XCTest / Swift Testing | Models + Services + ViewModels |
| Integration Tests | XCTest | UserDefaults persistence + RevenueCat mock |
| UI Tests | XCUITest (optional) | Onboarding flow smoke test |

---

## 2. Unit Tests

### 2.1 RitualStep Tests

| Test | Description |
|------|-------------|
| `testRitualStepDefaultsToIncomplete` | New RitualStep.isCompleted == false |
| `testRitualStepToggle` | Toggle changes isCompleted |
| `testRitualStepCodable` | JSON encode/decode round-trips correctly |
| `testRitualStepEquality` | Two steps with same id are equal |

### 2.2 StreakRecord Tests

| Test | Description |
|------|-------------|
| `testStreakDefaultsToZero` | New StreakRecord.currentStreak == 0 |
| `testStreakIncrements` | processCompletion on new day increments streak |
| `testStreakBreaks` | Missing a day resets streak to 0 |
| `testStreakLongestUpdates` | longestStreak updates when currentStreak exceeds it |
| `testGraceRecovery` | Pro user grace period prevents streak break once/week |

### 2.3 RitualStore Tests

| Test | Description |
|------|-------------|
| `testSaveAndLoadSteps` | Save steps → load returns identical array |
| `testEmptyStepsReturnsEmptyArray` | Loading from clean UserDefaults returns [] |
| `testSaveAndLoadStreak` | Save streak → load returns identical record |
| `testClearStepsWorks` | After clear, load returns [] |

### 2.4 NotificationService Tests

| Test | Description |
|------|-------------|
| `testScheduleReminderCreatesRequest` | scheduleReminder adds notification request |
| `testCancelRemovesAllRequests` | cancelAllReminders clears pending requests |
| `testDefaultReminderTime` | Default is 21:00 (9 PM) |

---

## 3. Integration Tests

### 3.1 RitualViewModel Integration

| Test | Description |
|------|-------------|
| `testAddStepPersists` | Add step → relaunch → step exists |
| `testToggleStepPersists` | Toggle step → relaunch → completion state preserved |
| `testDeleteStepPersists` | Delete step → relaunch → step gone |
| `testMaxStepsFreeEnforced` | Free user: 4th step add is rejected |
| `testAllCompletedTrigger` | allCompleted == true when all steps checked |

### 3.2 StreakViewModel Integration

| Test | Description |
|------|-------------|
| `testCompletionTodayIncreasesStreak` | Complete all steps → streak + 1 |
| `testDuplicateCompletionSameDay` | Completing twice same day doesn't double-count |
| `testNewDayResetsStepCompletion` | Steps reset to unchecked at midnight |

---

## 4. Test Execution

```bash
# Run all tests via Fastlane (NEVER xcodebuild directly)
cd SleepRitualios && fastlane test
```

---

## 5. Test Data

| Fixture | Value |
|---------|-------|
| Standard ritual | ["Dim lights", "Read 10 pages", "No screens"] |
| Empty ritual | [] |
| Max ritual (pro) | 5 steps |
| Active streak | currentStreak: 7, lastCompletedDate: yesterday |
| Broken streak | currentStreak: 0, lastCompletedDate: 3 days ago |
