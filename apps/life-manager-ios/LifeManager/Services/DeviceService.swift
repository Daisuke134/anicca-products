import Foundation

enum APNsEnvironment: String, Codable, Equatable, Sendable {
    case development
    case production

    // Keep the old source-level spelling working while using the backend's wire value.
    static var sandbox: Self { .development }
}

struct DeviceRegistrationRequest: Codable, Equatable, Sendable {
    let token: String
    let environment: APNsEnvironment
    let locale: ProductLocale
    let timezone: String
}

struct DeviceUnregistrationRequest: Codable, Equatable, Sendable {
    let token: String
}

protocol DeviceServicing: Sendable {
    func register(
        token: Data,
        environment: APNsEnvironment,
        locale: ProductLocale,
        timezone: String,
        idempotencyKey: UUID
    ) async throws
    func unregister(idempotencyKey: UUID) async throws
    func unregister(token: Data, idempotencyKey: UUID) async throws
}

extension DeviceServicing {
    func unregister(token: Data, idempotencyKey: UUID) async throws {
        try await unregister(idempotencyKey: idempotencyKey)
    }
}

actor DeviceService: DeviceServicing {
    private let api: APIRequesting
    private let tokenStore: DeviceTokenStoring

    init(
        api: APIRequesting,
        tokenStore: DeviceTokenStoring = KeychainDeviceTokenStore()
    ) {
        self.api = api
        self.tokenStore = tokenStore
    }

    func register(
        token: Data,
        environment: APNsEnvironment,
        locale: ProductLocale,
        timezone: String,
        idempotencyKey: UUID
    ) async throws {
        let tokenHex = try Self.hexToken(from: token)
        let body = try JSONEncoder.lifeManager.encode(
            DeviceRegistrationRequest(
                token: tokenHex,
                environment: environment,
                locale: locale,
                timezone: timezone
            )
        )
        try await api.sendVoid(
            .mutation(path: "/devices/apns", method: .put, body: body),
            idempotencyKey: idempotencyKey
        )
        try await tokenStore.save(token)
    }

    func unregister(idempotencyKey: UUID) async throws {
        guard let token = try await tokenStore.load() else { return }
        try await deleteToken(token, idempotencyKey: idempotencyKey)
    }

    func unregister(token: Data, idempotencyKey: UUID) async throws {
        try await deleteToken(token, idempotencyKey: idempotencyKey)
    }

    private func deleteToken(_ token: Data, idempotencyKey: UUID) async throws {
        let tokenHex = try Self.hexToken(from: token)
        let body = try JSONEncoder.lifeManager.encode(DeviceUnregistrationRequest(token: tokenHex))
        try await api.sendVoid(
            .mutation(path: "/devices/apns", method: .delete, body: body),
            idempotencyKey: idempotencyKey
        )

        if let storedToken = try await tokenStore.load(), storedToken == token {
            try await tokenStore.clear()
        }
    }

    private static func hexToken(from token: Data) throws -> String {
        guard token.count == 32 else { throw APIError.invalidAPNsToken }
        return token.map { String(format: "%02x", $0) }.joined()
    }
}
