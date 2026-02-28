import XCTest
@testable import BreathCalm

final class SessionStoreTests: XCTestCase {
    var store: SessionStore!

    override func setUp() {
        super.setUp()
        // Clear UserDefaults for testing
        UserDefaults.standard.removeObject(forKey: "breath_sessions")
        store = SessionStore.shared
    }

    func testAddSession() {
        let session = BreathSession(
            sessionType: .breathing478,
            moodBefore: 7,
            moodAfter: 3,
            durationSeconds: 360
        )
        store.add(session)
        XCTAssertEqual(store.sessions.count, 1)
    }

    func testImprovementCalculation() {
        let session = BreathSession(
            sessionType: .breathing478,
            moodBefore: 8,
            moodAfter: 3,
            durationSeconds: 360
        )
        XCTAssertEqual(session.improvement, 5)
    }

    func testTodayCount() {
        let session = BreathSession(
            sessionType: .breathing478,
            moodBefore: 5,
            moodAfter: 3,
            durationSeconds: 360
        )
        store.add(session)
        XCTAssertEqual(store.todayCount(), 1)
    }

    func testSessionTypeRequiresPro() {
        XCTAssertFalse(SessionType.breathing478.requiresPro)
        XCTAssertTrue(SessionType.box.requiresPro)
        XCTAssertTrue(SessionType.coherent.requiresPro)
        XCTAssertTrue(SessionType.sos.requiresPro)
        XCTAssertTrue(SessionType.walking.requiresPro)
    }

    func testBreathPhases() {
        XCTAssertEqual(SessionType.breathing478.phases.count, 3)
        XCTAssertEqual(SessionType.box.phases.count, 4)
        XCTAssertEqual(SessionType.coherent.phases.count, 2)
    }
}
