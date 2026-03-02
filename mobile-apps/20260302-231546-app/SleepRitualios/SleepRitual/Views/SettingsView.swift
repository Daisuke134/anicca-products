import SwiftUI

struct SettingsView: View {
    @ObservedObject private var subscriptionService = SubscriptionService.shared
    @State private var reminderHour: Int = 22
    @State private var reminderMinute: Int = 0
    @State private var notificationsEnabled = false
    @State private var showingPaywall = false

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.15).ignoresSafeArea()

            Form {
                Section("Reminder") {
                    Toggle("Enable Nightly Reminder", isOn: $notificationsEnabled)
                        .tint(Color(red: 0.5, green: 0.4, blue: 1.0))
                        .onChange(of: notificationsEnabled) { _, enabled in
                            if enabled {
                                Task {
                                    let granted = await NotificationService.shared.requestAuthorization()
                                    if granted {
                                        NotificationService.shared.scheduleReminder(at: reminderHour, minute: reminderMinute)
                                    } else {
                                        notificationsEnabled = false
                                    }
                                }
                            } else {
                                NotificationService.shared.cancelAllReminders()
                            }
                        }

                    if notificationsEnabled {
                        DatePicker(
                            "Time",
                            selection: Binding(
                                get: { Calendar.current.date(from: DateComponents(hour: reminderHour, minute: reminderMinute)) ?? Date() },
                                set: { date in
                                    let c = Calendar.current.dateComponents([.hour, .minute], from: date)
                                    reminderHour = c.hour ?? 22
                                    reminderMinute = c.minute ?? 0
                                    NotificationService.shared.scheduleReminder(at: reminderHour, minute: reminderMinute)
                                }
                            ),
                            displayedComponents: .hourAndMinute
                        )
                    }
                }
                .listRowBackground(Color.white.opacity(0.07))

                Section("Subscription") {
                    if subscriptionService.isPro {
                        Label("SleepRitual Pro ✓", systemImage: "star.fill")
                            .foregroundColor(.yellow)
                    } else {
                        Button("Upgrade to Pro") { showingPaywall = true }
                            .foregroundColor(Color(red: 0.5, green: 0.4, blue: 1.0))
                    }

                    Button("Restore Purchases") {
                        Task { try? await subscriptionService.restorePurchases() }
                    }
                    .foregroundColor(.white.opacity(0.6))
                }
                .listRowBackground(Color.white.opacity(0.07))

                Section("Legal") {
                    Link("Privacy Policy", destination: URL(string: "https://daisuke134.github.io/anicca-products/sleepritual/privacy-policy.html")!)
                        .foregroundColor(Color(red: 0.5, green: 0.4, blue: 1.0))
                    Link("Terms of Use", destination: URL(string: "https://daisuke134.github.io/anicca-products/sleepritual/terms.html")!)
                        .foregroundColor(Color(red: 0.5, green: 0.4, blue: 1.0))
                }
                .listRowBackground(Color.white.opacity(0.07))
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .sheet(isPresented: $showingPaywall) {
            PaywallView(onDismiss: { showingPaywall = false })
        }
    }
}
