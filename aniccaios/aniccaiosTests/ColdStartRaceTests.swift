import XCTest
@testable import aniccaios

/// ④ 1.9.3 cold-start race (pull-only) — Test #3
@MainActor
final class ColdStartRaceTests: XCTestCase {

    // Test #3: consumePendingQuoteId is atomic get-and-clear
    func test_consumePendingQuoteId_returnsThenClears() {
        AppState.shared.pendingQuoteId = "q042"
        let first = AppState.shared.consumePendingQuoteId()
        XCTAssertEqual(first, "q042", "first call returns the queued id")
        let second = AppState.shared.consumePendingQuoteId()
        XCTAssertNil(second, "second call returns nil (cleared)")
    }
}
