import SwiftUI
#if DEBUG
@_spi(Internal) import RevenueCat
#else
import RevenueCat
#endif

@main
struct EyeBreakIslandApp: App {
    @StateObject private var subscriptionService = SubscriptionService()
    @StateObject private var timerService = TimerService()

    init() {
        let apiKey = Bundle.main.infoDictionary?["RC_PUBLIC_KEY"] as? String ?? ""
        if !apiKey.isEmpty {
            #if DEBUG
            Purchases.logLevel = .debug
            let config = Configuration.Builder(withAPIKey: apiKey)
                .with(dangerousSettings: DangerousSettings(uiPreviewMode: true))
                .build()
            Purchases.configure(with: config)
            #else
            let config = Configuration.Builder(withAPIKey: apiKey)
                .with(entitlementVerificationMode: .informational)
                .build()
            Purchases.configure(with: config)
            #endif
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(subscriptionService)
                .environmentObject(timerService)
        }
    }
}
