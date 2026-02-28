import SwiftUI

@main
struct DailyDhammaApp: App {
    @StateObject private var teachingStore = TeachingStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(teachingStore)
                .onAppear {
                    NotificationService.shared.requestPermission()
                    NotificationService.shared.scheduleDailyNotification()
                }
                .onChange(of: scenePhase) { _, newPhase in
                    if newPhase == .active {
                        teachingStore.refreshTodayTeaching()
                    }
                }
        }
    }
}
