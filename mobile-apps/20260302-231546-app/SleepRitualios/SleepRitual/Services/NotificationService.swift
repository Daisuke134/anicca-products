import UserNotifications

final class NotificationService {
    static let shared = NotificationService()

    func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        return (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    func scheduleReminder(at hour: Int, minute: Int) {
        cancelAllReminders()
        var components = DateComponents()
        components.hour = hour
        components.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let content = UNMutableNotificationContent()
        content.title = "Time for your sleep ritual 🌙"
        content.body = "Start your bedtime routine to build your streak."
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "sleep_ritual_reminder",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    func cancelAllReminders() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["sleep_ritual_reminder"])
    }
}
