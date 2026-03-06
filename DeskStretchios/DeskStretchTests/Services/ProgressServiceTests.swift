import XCTest
@testable import DeskStretch

final class ProgressServiceTests: XCTestCase {
    private var service: ProgressService!

    override func setUp() {
        super.setUp()
        service = ProgressService()
    }

    func testRecordFirstSession() {
        let result = service.recordSession(duration: 5, current: .empty)
        XCTAssertEqual(result.todayCount, 1)
        XCTAssertEqual(result.streak, 1)
        XCTAssertEqual(result.totalSessions, 1)
        XCTAssertEqual(result.totalMinutes, 5)
    }

    func testRecordSecondSessionSameDay() {
        var current = UserProgress.empty
        current.todayCount = 1
        current.streak = 1
        current.totalSessions = 1
        current.totalMinutes = 3
        current.lastActiveDate = Date()

        let result = service.recordSession(duration: 4, current: current)
        XCTAssertEqual(result.todayCount, 2)
        XCTAssertEqual(result.streak, 1)
        XCTAssertEqual(result.totalSessions, 2)
        XCTAssertEqual(result.totalMinutes, 7)
    }

    func testNegativeDurationClampedToZero() {
        let result = service.recordSession(duration: -10, current: .empty)
        XCTAssertEqual(result.totalMinutes, 0)
    }

    func testHugeDurationClampedTo1440() {
        let result = service.recordSession(duration: 99999, current: .empty)
        XCTAssertEqual(result.totalMinutes, 1440)
    }

    func testZeroDuration() {
        let result = service.recordSession(duration: 0, current: .empty)
        XCTAssertEqual(result.totalMinutes, 0)
        XCTAssertEqual(result.totalSessions, 1)
    }
}
