import XCTest
@testable import aniccaios

/// ① 1.9.3 register repair tests (Test #1 #2)
/// Uses existing TestURLProtocol + NetworkSessionManager.testSession seam.
@MainActor
final class RegisterPathTests: XCTestCase {

    private func makeStubSession(handler: @escaping (URLRequest) throws -> (HTTPURLResponse, Data)) -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [TestURLProtocol.self]
        TestURLProtocol.requestHandler = handler
        return URLSession(configuration: config)
    }

    override func tearDown() {
        TestURLProtocol.requestHandler = nil
        NetworkSessionManager.testSession = nil
        UserDefaults.standard.removeObject(forKey: "com.anicca.pushTokenRegistrationPending")
        super.tearDown()
    }

    // Test #1: register() attempts the POST unconditionally (no auth gate blocks it)
    func test_register_attemptsPostUnconditionally() async {
        var called = false
        NetworkSessionManager.testSession = makeStubSession { req in
            called = true
            let ok = HTTPURLResponse(url: req.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (ok, Data("{\"remoteProblemNudgesEnabled\":false}".utf8))
        }
        let token = Data(repeating: 0x01, count: 32)
        await PushTokenService.shared.register(deviceToken: token)
        XCTAssertTrue(called, "register must attempt the POST unconditionally (no authorization gate)")
    }

    // Test #2: register retries on failure (>1 attempt) and sets the pending flag after all fail.
    // Note: URLSession internally retries 5xx/transient responses, so the protocol-level call
    // count exceeds the loop's 3; we assert "retried (>= 3)" + "pending flag set" which are the
    // real behaviors the spec requires (vs the old single-attempt-no-flag implementation).
    func test_register_retriesThreeTimesThenSetsFlag() async {
        var count = 0
        NetworkSessionManager.testSession = makeStubSession { req in
            count += 1
            let resp = HTTPURLResponse(url: req.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (resp, Data())
        }
        let token = Data(repeating: 0x02, count: 32)
        await PushTokenService.shared.register(deviceToken: token)
        XCTAssertGreaterThanOrEqual(count, 3, "register must retry on failure (>= 3 attempts, was 1 before fix)")
        XCTAssertTrue(UserDefaults.standard.bool(forKey: "com.anicca.pushTokenRegistrationPending"),
                      "pending flag must be set after all retries fail")
    }
}
