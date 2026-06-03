import Foundation
import UIKit
import UserNotifications
import OSLog

/// APNs device token registration (v1.6.3).
/// Stores a local "registered" flag to safely disable local Problem notifications (avoid duplicates).
@MainActor
final class PushTokenService {
    static let shared = PushTokenService()

    private let logger = Logger(subsystem: "com.anicca.ios", category: "PushTokenService")
    private let defaults = UserDefaults.standard
    private let registeredKey = "com.anicca.apnsTokenRegistered"

    private init() {}

    var isRegistered: Bool {
        defaults.bool(forKey: registeredKey)
    }

    func markUnregistered() {
        defaults.set(false, forKey: registeredKey)
    }

    private let pendingFlagKey = "com.anicca.pushTokenRegistrationPending"

    func register(deviceToken: Data) async {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        guard hex.count == 64 else {
            logger.error("Invalid device token length: \(hex.count, privacy: .public)")
            return
        }

        // v1.9.1: 3-retry with exponential backoff (0s, 1s, 2s).
        // Sets UserDefaults flag on final failure so next launch retries.
        let delays: [UInt64] = [0, 1_000_000_000, 2_000_000_000]
        for (attempt, delay) in delays.enumerated() {
            if delay > 0 { try? await Task.sleep(nanoseconds: delay) }
            let didSucceed = await postOnce(hex: hex, attempt: attempt + 1)
            if didSucceed {
                defaults.set(false, forKey: pendingFlagKey)
                return
            }
        }
        // All 3 attempts failed → set pending flag, restore local notifications
        defaults.set(true, forKey: pendingFlagKey)
        logger.error("Push token register: all 3 attempts failed, pending flag set for next launch")
        await restoreLocalProblemNotifications()
    }

    /// Single POST attempt. Returns true on success (2xx), false otherwise.
    private func postOnce(hex: String, attempt: Int) async -> Bool {
        var request = URLRequest(url: AppConfig.pushTokenRegisterURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(AppState.shared.resolveDeviceId(), forHTTPHeaderField: "device-id")
        request.setValue(TimeZone.current.identifier, forHTTPHeaderField: "x-timezone")
        request.setValue(AppState.shared.effectiveLanguage.rawValue, forHTTPHeaderField: "x-lang")
        let body: [String: Any] = ["token": hex, "platform": "ios"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await NetworkSessionManager.shared.session.data(for: request)
            guard let http = response as? HTTPURLResponse else { return false }
            if (200..<300).contains(http.statusCode) {
                let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
                let isRemoteEnabled = (json?["remoteProblemNudgesEnabled"] as? Bool) == true
                if isRemoteEnabled {
                    defaults.set(true, forKey: registeredKey)
                    await ProblemNotificationScheduler.shared.cancelAllNotifications()
                    let freeIds = (0..<3).map { "free_nudge_\($0)" }
                    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: freeIds)
                } else {
                    markUnregistered()
                    logger.warning("Remote delivery not enabled (attempt \(attempt, privacy: .public)); keeping local Problem notifications active")
                    let problems = AppState.shared.userProfile.struggles
                    if !problems.isEmpty {
                        await ProblemNotificationScheduler.shared.scheduleNotifications(for: problems)
                    }
                }
                logger.notice("Push token register OK (attempt \(attempt, privacy: .public))")
                return true
            }
            logger.error("Push token register failed http=\(http.statusCode, privacy: .public) (attempt \(attempt, privacy: .public))")
            return false
        } catch {
            logger.error("Push token register network error: \(error.localizedDescription, privacy: .public) (attempt \(attempt, privacy: .public))")
            return false
        }
    }

    private func restoreLocalProblemNotifications() async {
        markUnregistered()
        let problems = AppState.shared.userProfile.struggles
        if !problems.isEmpty {
            await ProblemNotificationScheduler.shared.scheduleNotifications(for: problems)
        }
    }
}
