import XCTest
@testable import DeskStretch

final class StretchRoutineServiceTests: XCTestCase {
    private var libraryService: StretchLibraryService!
    private var service: StretchRoutineService!

    override func setUp() {
        super.setUp()
        libraryService = StretchLibraryService()
        let json = """
        [
            {"id":"n1","name":"Neck Roll","category":"neck","instructions":"Roll","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"n2","name":"Neck Tilt","category":"neck","instructions":"Tilt","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"n3","name":"Chin Tuck","category":"neck","instructions":"Tuck","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"n4","name":"Neck Stretch","category":"neck","instructions":"Stretch","durationSeconds":30,"sfSymbol":"star","isPremium":false},
            {"id":"np1","name":"Deep Neck","category":"neck","instructions":"Deep","durationSeconds":30,"sfSymbol":"star","isPremium":true}
        ]
        """.data(using: .utf8)!
        try! libraryService.loadFromData(json)
        service = StretchRoutineService(libraryService: libraryService)
    }

    func testSelectRoutineReturnsRequestedCount() {
        let exercises = service.selectRoutine(painAreas: [.neck], history: [])
        XCTAssertEqual(exercises.count, 3)
    }

    func testSelectRoutineFreeOnly() {
        let exercises = service.selectRoutine(painAreas: [.neck], history: [], isPremium: false)
        XCTAssertTrue(exercises.allSatisfy { !$0.isPremium })
    }

    func testSelectRoutineIncludesPremium() {
        let exercises = service.selectRoutine(painAreas: [.neck], history: [], exerciseCount: 5, isPremium: true)
        XCTAssertTrue(exercises.contains { $0.isPremium })
    }

    func testSelectRoutineDedupsRecentHistory() {
        let recentExercises = libraryService.freeExercises(for: [.neck]).prefix(2).map { $0 }
        let session = StretchSession(exercises: recentExercises)
        let result = service.selectRoutine(painAreas: [.neck], history: [session], exerciseCount: 2)
        let recentIds = Set(recentExercises.map(\.id))
        let resultIds = Set(result.map(\.id))
        let overlap = recentIds.intersection(resultIds)
        // With 4 free exercises and 2 in recent history, 2 non-overlapping should be available
        XCTAssertTrue(overlap.isEmpty)
    }

    func testSelectRoutineEmptyPainAreas() {
        let exercises = service.selectRoutine(painAreas: [], history: [])
        XCTAssertTrue(exercises.isEmpty)
    }
}
