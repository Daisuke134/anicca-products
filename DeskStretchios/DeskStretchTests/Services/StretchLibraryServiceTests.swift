import XCTest
@testable import DeskStretch

final class StretchLibraryServiceTests: XCTestCase {
    private var service: StretchLibraryService!

    override func setUp() {
        super.setUp()
        service = StretchLibraryService()
    }

    func testLoadFromValidData() throws {
        let json = """
        [{"id":"t1","name":"Test","category":"neck","instructions":"Do it","durationSeconds":30,"sfSymbol":"star","isPremium":false}]
        """.data(using: .utf8)!

        try service.loadFromData(json)
        XCTAssertEqual(service.all.count, 1)
        XCTAssertEqual(service.all.first?.id, "t1")
    }

    func testLoadFromInvalidDataThrows() {
        let badJson = "not json".data(using: .utf8)!
        XCTAssertThrowsError(try service.loadFromData(badJson))
    }

    func testIsEmptyBeforeLoad() {
        XCTAssertTrue(service.isEmpty)
    }

    func testFilterByPainArea() throws {
        let json = """
        [
            {"id":"n1","name":"Neck Roll","category":"neck","instructions":"Roll","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"b1","name":"Back Bend","category":"back","instructions":"Bend","durationSeconds":30,"sfSymbol":"star","isPremium":false}
        ]
        """.data(using: .utf8)!
        try service.loadFromData(json)

        let neckOnly = service.exercises(for: [.neck])
        XCTAssertEqual(neckOnly.count, 1)
        XCTAssertEqual(neckOnly.first?.category, .neck)
    }

    func testFreeExercisesExcludesPremium() throws {
        let json = """
        [
            {"id":"n1","name":"Free","category":"neck","instructions":"Do","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"n2","name":"Premium","category":"neck","instructions":"Do","durationSeconds":30,"sfSymbol":"star","isPremium":true}
        ]
        """.data(using: .utf8)!
        try service.loadFromData(json)

        let free = service.freeExercises(for: [.neck])
        XCTAssertEqual(free.count, 1)
        XCTAssertFalse(free.first!.isPremium)
    }
}
