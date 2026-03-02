import XCTest
@testable import SleepRitual

final class RitualStoreTests: XCTestCase {
    var store: RitualStore!

    override func setUp() {
        super.setUp()
        store = RitualStore()
        // Clear UserDefaults before each test
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
    }
}
