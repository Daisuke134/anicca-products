import SwiftUI
import RevenueCat

@main
struct DeskStretchApp: App {
    @State private var appState: AppState

    init() {
        guard let apiKey = Bundle.main.infoDictionary?["RevenueCatAPIKey"] as? String,
              !apiKey.isEmpty else {
            fatalError("RevenueCatAPIKey not configured in xcconfig")
        }

        let subscriptionService: SubscriptionServiceProtocol = SubscriptionService.shared
        subscriptionService.configure(apiKey: apiKey)

        let libraryService = StretchLibraryService()
        try? libraryService.loadFromBundle()

        _appState = State(initialValue: AppState(
            subscriptionService: subscriptionService,
            libraryService: libraryService,
            routineService: StretchRoutineService(libraryService: libraryService),
            progressService: ProgressService(),
            notificationService: NotificationService()
        ))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .task {
                    appState.loadPersistedState()
                    appState.isPremium = await appState.subscriptionService.checkPremiumStatus()
                }
        }
    }
}
