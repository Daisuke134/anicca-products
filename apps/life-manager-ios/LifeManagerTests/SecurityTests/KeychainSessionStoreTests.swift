import Foundation
import XCTest
@testable import LifeManager

final class KeychainSessionStoreTests: XCTestCase {
    func testSaveAndLoadRoundTripUsesKeychainAdapter() async throws {
        let adapter = InMemoryKeychainAdapter()
        let store = KeychainSessionStore(adapter: adapter, service: "ai.anicca.life-manager.tests")
        let expected = TestSessionFactory.make()

        try await store.save(expected)
        let loaded = try await store.load()

        XCTAssertEqual(loaded, expected)
        XCTAssertEqual(adapter.lastWriteAccessibility, .afterFirstUnlockThisDeviceOnly)
    }

    func testSavingAgainUpdatesTheExistingKeychainItem() async throws {
        let adapter = InMemoryKeychainAdapter()
        let store = KeychainSessionStore(adapter: adapter, service: "ai.anicca.life-manager.tests")

        try await store.save(TestSessionFactory.make(accessToken: "first"))
        try await store.save(TestSessionFactory.make(accessToken: "rotated"))

        let loaded = try await store.load()
        XCTAssertEqual(loaded?.accessToken, "rotated")
        XCTAssertEqual(adapter.writeOperations, [.add, .update])
    }

    func testClearRemovesTheSessionAndIsIdempotent() async throws {
        let adapter = InMemoryKeychainAdapter()
        let store = KeychainSessionStore(adapter: adapter, service: "ai.anicca.life-manager.tests")

        try await store.save(TestSessionFactory.make())
        try await store.clear()
        try await store.clear()

        let loaded = try await store.load()
        XCTAssertNil(loaded)
        XCTAssertEqual(adapter.deleteCount, 2)
    }

    func testDeviceTokenStoreUsesDedicatedAccountAndRoundTripsToken() async throws {
        let adapter = InMemoryKeychainAdapter()
        let store = KeychainDeviceTokenStore(
            adapter: adapter,
            service: "ai.anicca.life-manager.tests",
            account: "apns-device-token"
        )
        let token = Data(repeating: 0xAB, count: 32)

        try await store.save(token)

        let loaded = try await store.load()
        XCTAssertEqual(loaded, token)
        XCTAssertEqual(adapter.lastQuery?.account, "apns-device-token")
        XCTAssertNotEqual(adapter.lastQuery?.account, "mobile-session")
        XCTAssertEqual(adapter.lastWriteAccessibility, .afterFirstUnlockThisDeviceOnly)
    }

    func testDeviceTokenStoreClearIsIdempotentAndRejectsInvalidLength() async throws {
        let adapter = InMemoryKeychainAdapter()
        let store = KeychainDeviceTokenStore(
            adapter: adapter,
            service: "ai.anicca.life-manager.tests",
            account: "apns-device-token"
        )

        do {
            try await store.save(Data(repeating: 0xAB, count: 31))
            XCTFail("expected invalid APNs token length")
        } catch {
            XCTAssertEqual(error as? DeviceTokenStoreError, .invalidToken)
        }

        try await store.save(Data(repeating: 0xAB, count: 32))
        try await store.clear()
        try await store.clear()

        let loaded = try await store.load()
        XCTAssertNil(loaded)
        XCTAssertEqual(adapter.deleteCount, 2)
    }
}

private enum TestSessionFactory {
    static func make(accessToken: String = "access-token") -> Session {
        Session(
            accessToken: accessToken,
            refreshToken: "refresh-token",
            tokenType: "Bearer",
            expiresAt: Date.iso8601("2026-08-10T08:20:00.000Z"),
            refreshExpiresAt: Date.iso8601("2026-09-09T08:05:00.000Z")
        )
    }
}

private final class InMemoryKeychainAdapter: KeychainSecurityAdapter, @unchecked Sendable {
    enum Operation: Equatable {
        case add
        case update
    }

    private var storage: Data?
    private(set) var writeOperations: [Operation] = []
    private(set) var lastWriteAccessibility: KeychainAccessibility?
    private(set) var lastQuery: KeychainQuery?
    private(set) var deleteCount = 0

    func read(_ query: KeychainQuery) throws -> Data? {
        lastQuery = query
        return storage
    }

    func add(_ data: Data, query: KeychainQuery, accessibility: KeychainAccessibility) throws {
        lastQuery = query
        storage = data
        writeOperations.append(.add)
        lastWriteAccessibility = accessibility
    }

    func update(_ data: Data, query: KeychainQuery, accessibility: KeychainAccessibility) throws {
        lastQuery = query
        storage = data
        writeOperations.append(.update)
        lastWriteAccessibility = accessibility
    }

    func delete(_ query: KeychainQuery) throws {
        lastQuery = query
        storage = nil
        deleteCount += 1
    }
}
