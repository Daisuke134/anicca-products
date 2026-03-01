import XCTest
@testable import MicroMoodiOS

// T-ML: MoodLevel tests
final class MoodLevelTests: XCTestCase {
    // T-ML-1: All cases have emoji
    func testMoodLevel_allCasesHaveEmoji() {
        for mood in MoodLevel.allCases {
            XCTAssertFalse(mood.emoji.isEmpty)
        }
    }

    // T-ML-2: Colors are assigned
    func testMoodLevel_colorIsAssigned() {
        let colors = MoodLevel.allCases.map { $0.color }
        XCTAssertEqual(colors.count, 5)
    }

    // T-ML-3: Init from valid range 1-5 succeeds
    func testMoodLevel_initFromInt_validRange() {
        for i: Int16 in 1...5 {
            XCTAssertNotNil(MoodLevel(rawValue: i))
        }
    }

    // T-ML-4: Init from out-of-range returns nil
    func testMoodLevel_initFromInt_outOfRange() {
        XCTAssertNil(MoodLevel(rawValue: 0))
        XCTAssertNil(MoodLevel(rawValue: 6))
    }
}
