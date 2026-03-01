import XCTest
@testable import MicroMoodiOS

final class MicroMoodiOSTests: XCTestCase {
    func testMoodLevelEmojis() {
        XCTAssertEqual(MoodLevel.awful.emoji, "😫")
        XCTAssertEqual(MoodLevel.bad.emoji, "😔")
        XCTAssertEqual(MoodLevel.okay.emoji, "😐")
        XCTAssertEqual(MoodLevel.good.emoji, "😊")
        XCTAssertEqual(MoodLevel.great.emoji, "😄")
    }
}
