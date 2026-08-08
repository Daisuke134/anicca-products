import Foundation
import XCTest
@testable import LifeManager

final class PushDeviceServiceTests: XCTestCase {
    func testAPNsTokenConversionRequires32BytesAndUsesLowercaseHex() async throws {
        let token = Data((0..<32).map(UInt8.init))
        let api = PushAPI()
        let service = DeviceService(api: api, tokenStore: TestDeviceTokenStore())

        try await service.register(
            token: token,
            environment: .sandbox,
            locale: .ja,
            timezone: "Asia/Tokyo",
            idempotencyKey: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
        )

        let requests = await api.requests()
        let request = try XCTUnwrap(requests.first)
        let body = try XCTUnwrap(request.endpoint.body)
        let registration = try JSONDecoder.lifeManager.decode(DeviceRegistrationRequest.self, from: body)
        XCTAssertEqual(registration.token, "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")
        XCTAssertEqual(registration.environment, .sandbox)
        XCTAssertEqual(registration.locale, .ja)
        XCTAssertEqual(registration.timezone, "Asia/Tokyo")
        let registrationJSON = try XCTUnwrap(
            try JSONSerialization.jsonObject(with: body) as? [String: Any]
        )
        XCTAssertEqual(registrationJSON["environment"] as? String, "development")

        do {
            try await service.register(
                token: Data(repeating: 1, count: 31),
                environment: .sandbox,
                locale: .en,
                timezone: "UTC",
                idempotencyKey: UUID()
            )
            XCTFail("expected invalid APNs token length")
        } catch {
            XCTAssertEqual(error as? APIError, .invalidAPNsToken)
        }
    }

    func testDeviceRegistrationUsesAuthenticatedPutAndLogoutUsesDelete() async throws {
        let api = PushAPI()
        let service = DeviceService(api: api, tokenStore: TestDeviceTokenStore())
        let key = UUID(uuidString: "00000000-0000-0000-0000-000000000002")!

        try await service.register(
            token: Data(repeating: 7, count: 32),
            environment: .production,
            locale: .en,
            timezone: "America/Los_Angeles",
            idempotencyKey: key
        )
        try await service.unregister(idempotencyKey: key)

        let requests = await api.requests()
        XCTAssertEqual(requests.map(\.endpoint.path), ["/devices/apns", "/devices/apns"])
        XCTAssertEqual(requests.map(\.endpoint.method), [.put, .delete])
        let deleteBody = try XCTUnwrap(requests[1].endpoint.body)
        let deleteJSON = try XCTUnwrap(
            try JSONSerialization.jsonObject(with: deleteBody) as? [String: Any]
        )
        XCTAssertEqual(deleteJSON["token"] as? String, String(repeating: "07", count: 32))
        XCTAssertTrue(requests.allSatisfy { $0.endpoint.requiresAuthentication })
        XCTAssertTrue(requests.allSatisfy { $0.endpoint.requiresIdempotencyKey })
        XCTAssertEqual(requests.map(\.idempotencyKey), [key, key])
    }

    func testDeviceUnregistrationSendsExactTokenWithJSONContentType() async throws {
        let transport = DeviceTransport()
        let client = APIClient(
            baseURL: URL(string: "https://life-manager.example/api/mobile/v1")!,
            transport: transport,
            sessionStore: DeviceSessionStore(),
            refresh: { _ in throw APIError.refreshRejected }
        )
        let service = DeviceService(api: client, tokenStore: TestDeviceTokenStore())
        let token = Data((0..<32).map(UInt8.init))
        let key = UUID(uuidString: "00000000-0000-0000-0000-000000000003")!

        try await service.unregister(token: token, idempotencyKey: key)

        let recordedRequest = await transport.requests().first
        let request = try XCTUnwrap(recordedRequest)
        XCTAssertEqual(request.httpMethod, "DELETE")
        XCTAssertEqual(request.httpBody, Data(#"{"token":"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"}"#.utf8))
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Idempotency-Key"), key.uuidString)
    }

    func testFailedRegistrationDoesNotPersistTokenBeforeAPIConfirmation() async throws {
        let tokenStore = TestDeviceTokenStore()
        let service = DeviceService(api: PushAPI(failures: 1), tokenStore: tokenStore)

        do {
            try await service.register(
                token: Data(repeating: 0xAB, count: 32),
                environment: .production,
                locale: .en,
                timezone: "UTC",
                idempotencyKey: UUID()
            )
            XCTFail("expected registration failure")
        } catch {
            XCTAssertEqual(error as? APIError, .transport("offline"))
        }

        let storedToken = try await tokenStore.load()
        XCTAssertNil(storedToken)
    }

    func testUnregisterAfterDeviceServiceRestartLoadsPersistedToken() async throws {
        let token = Data((0..<32).map(UInt8.init))
        let tokenStore = TestDeviceTokenStore()
        let registrationAPI = PushAPI()
        let firstService = DeviceService(api: registrationAPI, tokenStore: tokenStore)
        let key = UUID(uuidString: "00000000-0000-0000-0000-000000000004")!

        try await firstService.register(
            token: token,
            environment: .production,
            locale: .en,
            timezone: "UTC",
            idempotencyKey: key
        )

        let deletionAPI = PushAPI()
        let restartedService = DeviceService(api: deletionAPI, tokenStore: tokenStore)
        try await restartedService.unregister(idempotencyKey: key)

        let requests = await deletionAPI.requests()
        let request = try XCTUnwrap(requests.first)
        let body = try XCTUnwrap(request.endpoint.body)
        XCTAssertEqual(
            body,
            Data(#"{"token":"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"}"#.utf8)
        )
        XCTAssertEqual(request.idempotencyKey, key)
        let storedToken = try await tokenStore.load()
        XCTAssertNil(storedToken)
    }

    func testUnregisterWithoutPersistedTokenIsIdempotentNoOp() async throws {
        let api = PushAPI()
        let service = DeviceService(api: api, tokenStore: TestDeviceTokenStore())

        try await service.unregister(idempotencyKey: UUID())

        let requests = await api.requests()
        XCTAssertTrue(requests.isEmpty)
    }

    func testDeleteFailureRetainsTokenForRetryWithSameIdempotencyKey() async throws {
        let token = Data(repeating: 0xCD, count: 32)
        let tokenStore = TestDeviceTokenStore(initialToken: token)
        let api = PushAPI(failures: 1)
        let service = DeviceService(api: api, tokenStore: tokenStore)
        let key = UUID(uuidString: "00000000-0000-0000-0000-000000000005")!

        do {
            try await service.unregister(idempotencyKey: key)
            XCTFail("expected delete failure")
        } catch {
            XCTAssertEqual(error as? APIError, .transport("offline"))
        }

        let retainedToken = try await tokenStore.load()
        XCTAssertEqual(retainedToken, token)

        try await service.unregister(idempotencyKey: key)

        let requests = await api.requests()
        XCTAssertEqual(requests.map(\.idempotencyKey), [key, key])
        XCTAssertEqual(requests.compactMap(\.endpoint.body).count, 2)
        let clearedToken = try await tokenStore.load()
        XCTAssertNil(clearedToken)
    }

    func testNotificationDestinationAcceptsOnlyStableChatPointer() throws {
        let payload = try JSONSerialization.data(withJSONObject: [
            "type": "chat_message",
            "messageId": "message:v1:stable-1",
            "cursor": "cursor:v1:opaque-1"
        ])

        let destination = try NotificationDestination(data: payload)

        XCTAssertEqual(destination.type, .chatMessage)
        XCTAssertEqual(destination.messageID, "message:v1:stable-1")
        XCTAssertEqual(destination.cursor, "cursor:v1:opaque-1")
        XCTAssertNotNil(NotificationDestination(userInfo: [
            "aps": ["alert": ["title": "New message"]],
            "type": "chat_message",
            "messageId": "message:v1:stable-1",
            "cursor": "cursor:v1:opaque-1"
        ]))
        XCTAssertThrowsError(try NotificationDestination(data: JSONSerialization.data(withJSONObject: [
            "type": "chat_message",
            "messageId": "message:v1:stable-1",
            "route": ["origin": "secret"]
        ])))
        XCTAssertThrowsError(try NotificationDestination(data: JSONSerialization.data(withJSONObject: [
            "type": "chat_message",
            "messageId": "message:v1:stable-1",
            "accessToken": "secret"
        ])))
        XCTAssertThrowsError(try NotificationDestination(data: JSONSerialization.data(withJSONObject: [
            "type": "route",
            "messageId": "message:v1:stable-1"
        ])))
    }
}

private struct RecordedPushRequest: Sendable {
    let endpoint: APIEndpoint
    let idempotencyKey: UUID?
}

private actor PushAPI: APIRequesting {
    private var recorded: [RecordedPushRequest] = []
    private var remainingFailures: Int

    init(failures: Int = 0) {
        remainingFailures = failures
    }

    func send<Response: Decodable & Sendable>(
        _ endpoint: APIEndpoint,
        as responseType: Response.Type,
        idempotencyKey: UUID?
    ) async throws -> Response {
        throw APIError.invalidResponse
    }

    func sendVoid(_ endpoint: APIEndpoint, idempotencyKey: UUID?) async throws {
        recorded.append(RecordedPushRequest(endpoint: endpoint, idempotencyKey: idempotencyKey))
        guard remainingFailures > 0 else { return }
        remainingFailures -= 1
        throw APIError.transport("offline")
    }

    func requests() -> [RecordedPushRequest] { recorded }
}

actor TestDeviceTokenStore: DeviceTokenStoring {
    private var token: Data?

    init(initialToken: Data? = nil) {
        token = initialToken
    }

    func load() async throws -> Data? { token }

    func save(_ token: Data) async throws {
        self.token = token
    }

    func clear() async throws {
        token = nil
    }
}

private actor DeviceTransport: HTTPTransport {
    private var recorded: URLRequest?

    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        recorded = request
        return (
            Data(),
            HTTPURLResponse(
                url: request.url!,
                statusCode: 204,
                httpVersion: nil,
                headerFields: nil
            )!
        )
    }

    func requests() -> [URLRequest] { recorded.map { [$0] } ?? [] }
}

private struct DeviceSessionStore: SessionStoring {
    let session = Session(accessToken: "access-token", refreshToken: "refresh-token", tokenType: "Bearer", expiresAt: .distantFuture, refreshExpiresAt: .distantFuture)

    func load() async throws -> Session? { session }
    func save(_ session: Session) async throws {}
    func clear() async throws {}
}
