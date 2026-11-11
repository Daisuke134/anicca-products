import SwiftUI
import SwiftData
import RevenueCat

@main
struct ThankfulGratitudeAppApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([GratitudeEntry.self])
        do {
            let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            // Fallback to in-memory to avoid crash. Data won't persist but app stays alive.
            let fallback = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
            return try! ModelContainer(for: schema, configurations: [fallback])
        }
    }()

    init() {
        RevenueCatService.configure()

        // Mixpanel (shared spec: kpi-churn-event-spec-2026-11-11 §3.2/§3.3).
        AnalyticsManager.shared.configure(token: Config.mixpanelToken)
        // Link client events with RevenueCat's server-side rc_* events.
        if let distinctId = AnalyticsManager.shared.distinctId {
            Purchases.shared.setAttributes(["$mixpanel_distinct_id": distinctId])
        }
        AnalyticsManager.shared.trackAppOpened()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(sharedModelContainer)
    }
}
