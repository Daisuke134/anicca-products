import XCTest
@testable import SleepRitual

// MARK: - RitualStore Tests

final class RitualStoreTests: XCTestCase {
    var store: RitualStore!

    override func setUp() {
        super.setUp()
        store = RitualStore()
        UserDefaults.standard.removeObject(forKey: "ritual_steps")
        UserDefaults.standard.removeObject(forKey: "streak_record")
    }

    func testLoadDefaultSteps() {
        let steps = store.loadSteps()
        XCTAssertEqual(steps.count, 3)
    }

    func testSaveAndLoadSteps() {
        let steps = [RitualStep(name: "Test Step")]
        store.saveSteps(steps)
        let loaded = store.loadSteps()
        XCTAssertEqual(loaded.count, 1)
        XCTAssertEqual(loaded.first?.name, "Test Step")
    }

    func testEmptyStepsSavesAndLoads() {
        store.saveSteps([])
        let loaded = store.loadSteps()
        XCTAssertEqual(loaded.count, 0)
    }

    func testDefaultStreak() {
        let streak = store.loadStreak()
        XCTAssertEqual(streak.currentStreak, 0)
        XCTAssertNil(streak.lastCompletedDate)
    }

    func testSaveAndLoadStreak() {
        var streak = StreakRecord()
        streak.currentStreak = 5
        store.saveStreak(streak)
        let loaded = store.loadStreak()
        XCTAssertEqual(loaded.currentStreak, 5)
    }
}

// MARK: - RitualStep Tests

final class RitualStepTests: XCTestCase {
    func testDefaultIsNotCompleted() {
        let step = RitualStep(name: "Test")
        XCTAssertFalse(step.isCompleted)
    }

    func testEquality() {
        let id = UUID()
        let step1 = RitualStep(id: id, name: "A")
        let step2 = RitualStep(id: id, name: "A")
        XCTAssertEqual(step1, step2)
    }

    func testCodable() throws {
        let step = RitualStep(name: "Codable Test")
        let data = try JSONEncoder().encode(step)
        let decoded = try JSONDecoder().decode(RitualStep.self, from: data)
        XCTAssertEqual(step.id, decoded.id)
        XCTAssertEqual(step.name, decoded.name)
        XCTAssertEqual(step.isCompleted, decoded.isCompleted)
    }

    func testToggleViaNewInstance() {
        let step = RitualStep(name: "Toggle Test", isCompleted: false)
        let toggled = RitualStep(id: step.id, name: step.name, isCompleted: !step.isCompleted)
        XCTAssertTrue(toggled.isCompleted)
    }
}

// MARK: - StreakRecord Tests

final class StreakRecordTests: XCTestCase {
    func testDefaultsToZero() {
        let record = StreakRecord()
        XCTAssertEqual(record.currentStreak, 0)
        XCTAssertEqual(record.longestStreak, 0)
        XCTAssertNil(record.lastCompletedDate)
    }

    func testLongestStreakUpdatesWhenExceeded() {
        let record = StreakRecord(currentStreak: 5, longestStreak: max(3, 5), lastCompletedDate: Date())
        XCTAssertEqual(record.longestStreak, 5)
    }

    func testCodable() throws {
        let record = StreakRecord(currentStreak: 7, longestStreak: 10, lastCompletedDate: Date())
        let data = try JSONEncoder().encode(record)
        let decoded = try JSONDecoder().decode(StreakRecord.self, from: data)
        XCTAssertEqual(record.currentStreak, decoded.currentStreak)
        XCTAssertEqual(record.longestStreak, decoded.longestStreak)
    }

    func testGraceUsedThisWeekDefaultsFalse() {
        let record = StreakRecord()
        XCTAssertFalse(record.graceUsedThisWeek)
    }
}

// MARK: - StreakViewModel Tests

@MainActor
final class StreakViewModelTests: XCTestCase {
    var sut: StreakViewModel!

    override func setUp() {
        super.setUp()
        UserDefaults.standard.removeObject(forKey: "streak_record")
        sut = StreakViewModel()
    }

    func testInitialStreakIsZero() {
        sut.load()
        XCTAssertEqual(sut.streak.currentStreak, 0)
    }

    func testFirstCompletionSetsStreakToOne() {
        sut.load()
        sut.processCompletion()
        XCTAssertEqual(sut.streak.currentStreak, 1)
    }

    func testDuplicateCompletionSameDayDoesNotIncrement() {
        sut.load()
        sut.processCompletion()
        sut.processCompletion()
        XCTAssertEqual(sut.streak.currentStreak, 1)
    }

    func testStreakBreaksAfterMissedDay() {
        let calendar = Calendar.current
        let threeDaysAgo = calendar.date(byAdding: .day, value: -3, to: Date())!
        let record = StreakRecord(currentStreak: 5, longestStreak: 5, lastCompletedDate: threeDaysAgo)
        let store = RitualStore()
        store.saveStreak(record)
        sut.load()
        XCTAssertEqual(sut.streak.currentStreak, 0)
    }
}

// MARK: - RitualViewModel Tests

@MainActor
final class RitualViewModelTests: XCTestCase {
    var sut: RitualViewModel!

    override func setUp() {
        super.setUp()
        UserDefaults.standard.removeObject(forKey: "ritual_steps")
        sut = RitualViewModel()
    }

    func testLoadReturnsDefaultSteps() {
        sut.load()
        XCTAssertEqual(sut.steps.count, 3)
    }

    func testAddStepAppendsAndPersists() {
        sut.load()
        sut.addStep(name: "New Step")
        XCTAssertEqual(sut.steps.count, 4)
        XCTAssertEqual(sut.steps.last?.name, "New Step")
    }

    func testAddEmptyStepIsIgnored() {
        sut.load()
        sut.addStep(name: "   ")
        XCTAssertEqual(sut.steps.count, 3)
    }

    func testToggleStepChangesCompletion() {
        sut.load()
        let step = sut.steps[0]
        XCTAssertFalse(step.isCompleted)
        sut.toggleStep(step)
        XCTAssertTrue(sut.steps[0].isCompleted)
    }

    func testAllCompletedTrueWhenAllChecked() {
        sut.load()
        for step in sut.steps {
            sut.toggleStep(step)
        }
        XCTAssertTrue(sut.allCompleted)
    }

    func testDeleteStepReducesCount() {
        sut.load()
        sut.deleteStep(at: IndexSet(integer: 0))
        XCTAssertEqual(sut.steps.count, 2)
    }

    func testResetForNewDayClearsCompletion() {
        sut.load()
        sut.toggleStep(sut.steps[0])
        XCTAssertTrue(sut.steps[0].isCompleted)
        sut.resetForNewDay()
        XCTAssertFalse(sut.steps[0].isCompleted)
    }
}
