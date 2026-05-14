import Foundation
import UserNotifications
import OSLog

/// Schedules daily quote-based affirmation notifications on-device (no server).
///
/// Plan:
///   Free → 1 notification/day at 08:00.
///   Pro  → 4 notifications/day at 08:00 / 12:30 / 17:30 / 21:30.
///
/// Each notification body is a `Quote.text` pulled from `QuoteProvider`. userInfo
/// `{quoteId: "qNNN"}` is consumed by `AppDelegate.userNotificationCenter(_:didReceive:)`
/// which posts `.aniccaScrollToQuote`; `FeedRootView` then scrolls the pager.
///
/// Pre-schedules the next 14 days (≤ 56 requests for Pro, ≤ 14 for Free — well under
/// iOS' 64-pending cap). Refreshed on app foreground and after subscription changes.
final class AffirmationNotificationScheduler {
    static let shared = AffirmationNotificationScheduler()

    private let center = UNUserNotificationCenter.current()
    private let logger = Logger(subsystem: "com.anicca.ios", category: "AffirmationNotificationScheduler")

    private static let installSeedKey = "anicca.installSeed"
    private static let identifierPrefix = "anicca.quote."
    private static let scheduleDaysAhead = 14

    private static let freeSlots: [(Int, Int)] = [(8, 0)]
    private static let proSlots: [(Int, Int)] = [(8, 0), (12, 30), (17, 30), (21, 30)]

    private init() {}

    // MARK: - Public

    /// Recompute today's schedule. Idempotent. Call after onboarding completes,
    /// after subscription state changes, and on app foreground.
    func reschedule() async {
        await removeAllAffirmationNotifications()

        let isEntitled = await MainActor.run { AppState.shared.subscriptionInfo.isEntitled }
        let lang = LanguagePreference.detectDefault()
        let slots: [(Int, Int)] = isEntitled ? Self.proSlots : Self.freeSlots
        let title = String(localized: "app_name")
        let seed = loadOrCreateInstallSeed()

        let now = Date()
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)

        var scheduledCount = 0
        for dayOffset in 0..<Self.scheduleDaysAhead {
            guard let day = calendar.date(byAdding: .day, value: dayOffset, to: today) else { continue }
            let ids = QuoteProvider.shared.notificationIds(
                forDate: day, count: slots.count, installSeed: seed, preferredLanguage: lang, calendar: calendar
            )
            for (slotIndex, (hour, minute)) in slots.enumerated() {
                guard slotIndex < ids.count,
                      let quote = QuoteProvider.shared.byId(ids[slotIndex], preferredLanguage: lang)
                else { continue }
                guard let fireDate = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: day),
                      fireDate > now
                else { continue }
                schedule(at: fireDate, quote: quote, title: title, slotIndex: slotIndex)
                scheduledCount += 1
            }
        }

        logger.info("Affirmation notifications scheduled: count=\(scheduledCount) entitled=\(isEntitled) lang=\(lang.rawValue)")
    }

    /// Called by `AppDelegate.didFinishLaunching` once per upgrade to v1.8.7.
    /// Drops any in-flight legacy Problem Nudge notifications still in the iOS DB.
    func purgeLegacyNotifications() async {
        let pending = await center.pendingNotificationRequests()
        let legacyIds = pending.compactMap { req -> String? in
            let id = req.identifier
            if id.hasPrefix(Self.identifierPrefix) { return nil }
            return id
        }
        if !legacyIds.isEmpty {
            center.removePendingNotificationRequests(withIdentifiers: legacyIds)
            logger.info("Purged \(legacyIds.count) legacy notifications")
        }
    }

    // MARK: - Internals

    private func loadOrCreateInstallSeed() -> UInt64 {
        let defaults = UserDefaults.standard
        let existing = defaults.object(forKey: Self.installSeedKey) as? NSNumber
        if let raw = existing?.uint64Value, raw != 0 { return raw }
        let seed = UInt64.random(in: 1..<UInt64.max)
        defaults.set(NSNumber(value: seed), forKey: Self.installSeedKey)
        return seed
    }

    private func schedule(at fireDate: Date, quote: Quote, title: String, slotIndex: Int) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = quote.text
        content.sound = .default
        content.userInfo = ["quoteId": quote.id]

        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fireDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)

        let dateStamp = ISO8601DateFormatter().string(from: fireDate)
            .replacingOccurrences(of: ":", with: "")
        let id = "\(Self.identifierPrefix)\(dateStamp).slot\(slotIndex)"
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        center.add(request) { [weak self] error in
            if let error {
                self?.logger.error("Failed to schedule \(id, privacy: .public): \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    private func removeAllAffirmationNotifications() async {
        let pending = await center.pendingNotificationRequests()
        let ids = pending.map { $0.identifier }.filter { $0.hasPrefix(Self.identifierPrefix) }
        if !ids.isEmpty {
            center.removePendingNotificationRequests(withIdentifiers: ids)
        }
    }
}
