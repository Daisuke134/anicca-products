import XCTest
import CoreData
@testable import MicroMoodiOS

final class MoodStoreTests: XCTestCase {
    var moodStore: MoodStore!

    override func setUp() {
        super.setUp()
        let container = PersistenceController.makeTestContainer()
        moodStore = MoodStore(container: container)
    }

    override func tearDown() {
        moodStore = nil
        super.tearDown()
    }

    // T-MS-1: Save entry, fetch, verify all fields
    func testSaveMoodEntry_persistsCorrectly() throws {
        try moodStore.saveMoodEntry(level: 4, note: "Feeling good")
        let entries = moodStore.fetchEntries()
        XCTAssertEqual(entries.count, 1)
        XCTAssertEqual(entries[0].moodLevel, 4)
        XCTAssertEqual(entries[0].note, "Feeling good")
    }

    // T-MS-2: Save 5 entries, fetch — descending timestamp order
    func testFetchEntries_returnsInChronologicalOrder() throws {
        for level in Int16(1)...5 {
            try moodStore.saveMoodEntry(level: level, note: nil)
        }
        let entries = moodStore.fetchEntries()
        XCTAssertEqual(entries.count, 5)
        for i in 0..<(entries.count - 1) {
            XCTAssertGreaterThanOrEqual(entries[i].timestamp, entries[i + 1].timestamp)
        }
    }

    // T-MS-3: Save 10, fetch limit=7 → count == 7
    func testFetchEntries_withLimit_returnsCorrectCount() throws {
        for _ in 0..<10 {
            try moodStore.saveMoodEntry(level: 3, note: nil)
        }
        let entries = moodStore.fetchEntries(limit: 7)
        XCTAssertEqual(entries.count, 7)
    }

    // T-MS-4: Save, delete, fetch → count == 0
    func testDeleteEntry_removesFromStore() throws {
        try moodStore.saveMoodEntry(level: 5, note: nil)
        let before = moodStore.fetchEntries()
        XCTAssertEqual(before.count, 1)
        try moodStore.deleteEntry(before[0])
        let after = moodStore.fetchEntries()
        XCTAssertEqual(after.count, 0)
    }

    // T-MS-5: fetchEntriesSince filters correctly
    func testFetchEntriesSince_filtersCorrectly() throws {
        let context = moodStore.context
        // Old entry (61 days ago)
        let oldEntry = MoodEntryMO(context: context)
        oldEntry.id = UUID()
        oldEntry.moodLevel = 2
        oldEntry.note = nil
        oldEntry.timestamp = Date().addingTimeInterval(-61 * 86400)
        oldEntry.createdAt = oldEntry.timestamp
        // Recent entry (today)
        let recentEntry = MoodEntryMO(context: context)
        recentEntry.id = UUID()
        recentEntry.moodLevel = 4
        recentEntry.note = nil
        recentEntry.timestamp = Date()
        recentEntry.createdAt = Date()
        try context.save()

        let since30d = Date().addingTimeInterval(-30 * 86400)
        let entries = moodStore.fetchEntriesSince(since30d)
        XCTAssertEqual(entries.count, 1)
        XCTAssertEqual(entries[0].moodLevel, 4)
    }
}
