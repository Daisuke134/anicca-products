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
    private let pendingKey = "com.anicca.pushTokenRegistrationPending"

    private init() {}

    var isRegistered: Bool {
        defaults.bool(forKey: registeredKey)
    }

    func markUnregistered() {
        defaults.set(false, forKey: registeredKey)
    }

    /// ① 1.9.3 fix: 3 retry (0s/1s/2s) + pending flag。 全失敗で next-launch retry 用 flag を立てる。
    func register(deviceToken: Data) async {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        // I-B: 不正長トークンは retry を無駄打ちせず早期 return (APNs token は 32byte=64hex)。
        guard hex.count == 64 else {
            logger.error("Invalid device token length: \(hex.count, privacy: .public)")
            return
        }
        let delays: [UInt64] = [0, 1_000_000_000, 2_000_000_000]
        for (attempt, delay) in delays.enumerated() {
            if delay > 0 { try? await Task.sleep(nanoseconds: delay) }
            if await postOnce(hex: hex, attempt: attempt + 1) {
                defaults.set(false, forKey: pendingKey)
                return
            }
        }
        defaults.set(true, forKey: pendingKey)
        logger.error("Push token register: all 3 attempts failed, pending flag set for next launch")
        await restoreLocalProblemNotifications()
    }

    /// Single POST attempt。 成功 (2xx) で true。 既存の remote-enabled 分岐ロジックを維持。
    private func postOnce(hex: String, attempt: Int) async -> Bool {
        var request = URLRequest(url: AppConfig.pushTokenRegisterURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(AppState.shared.resolveDeviceId(), forHTTPHeaderField: "device-id")
        request.setValue(TimeZone.current.identifier, forHTTPHeaderField: "x-timezone")
        request.setValue(AppState.shared.effectiveLanguage.rawValue, forHTTPHeaderField: "x-lang")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["token": hex, "platform": "ios"])

        do {
            let (data, response) = try await NetworkSessionManager.shared.session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                logger.error("Push token register failed (attempt \(attempt, privacy: .public))")
                return false
            }
            let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            let isRemoteEnabled = (json?["remoteProblemNudgesEnabled"] as? Bool) == true
            if isRemoteEnabled {
                defaults.set(true, forKey: registeredKey)
                await ProblemNotificationScheduler.shared.cancelAllNotifications()
                let freeIds = (0..<3).map { "free_nudge_\($0)" }
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: freeIds)
            } else {
                markUnregistered()
                logger.warning("Remote delivery not enabled; keeping local Problem notifications active")
                let problems = AppState.shared.userProfile.struggles
                if !problems.isEmpty {
                    await ProblemNotificationScheduler.shared.scheduleNotifications(for: problems)
                }
            }
            return true
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
