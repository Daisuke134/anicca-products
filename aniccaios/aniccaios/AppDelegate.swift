// v1.8.2 — Singular SDK 再統合 + RevenueCat→Singular→TikTok SAN
import UIKit
import UserNotifications
import OSLog
import BackgroundTasks
import PostHog
import RevenueCat

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let proxy = Bundle.main.object(forInfoDictionaryKey: "ANICCA_PROXY_BASE_URL") as? String ?? "nil"
        print("ANICCA_PROXY_BASE_URL =", proxy)

        let resetFlag = (Bundle.main.object(forInfoDictionaryKey: "RESET_ON_LAUNCH") as? NSString)?.boolValue == true
        let shouldReset = resetFlag || ProcessInfo.processInfo.arguments.contains("-resetOnLaunch")
        if shouldReset {
            UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier ?? "")
            UserDefaults.standard.synchronize()
            AppState.shared.resetState()
        }

        // v1.9.1: UITest launch arg parse (DEBUG only, dead code in production builds)
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if let idx = args.firstIndex(of: "-pendingQuoteIdOnLaunch"), idx + 1 < args.count {
            AppState.shared.pendingQuoteId = args[idx + 1]
        }
        if let idx = args.firstIndex(of: "-uiTestForceBillingStatus"), idx + 1 < args.count {
            UserDefaults.standard.set(args[idx + 1], forKey: "com.anicca.uitest.forceBillingStatus")
        }
        #endif

        UNUserNotificationCenter.current().delegate = self
        NotificationScheduler.shared.registerCategories()
        SubscriptionManager.shared.configure()

        // Widget data sync
        let struggles = AppState.shared.userProfile.struggles
        if !struggles.isEmpty {
            NudgeWidgetDataStore.sync(struggles: struggles)
        }

        // Mixpanelは常に初期化（ファーストパーティAnalytics、IDFAを使用しない）
        AnalyticsManager.shared.configure()

        // PostHog: A/B テスト + Session Replay（RevenueCat configure の後）
        let phConfig = PostHogConfig(
            apiKey: "phc_Mw4K3aByYDRuAlfe55u5OYJrTwTcwhPextZjOw8z2nw",
            host: "https://us.i.posthog.com"
        )
        phConfig.sessionReplay = true
        phConfig.sessionReplayConfig.maskAllTextInputs = true
        phConfig.sessionReplayConfig.maskAllImages = false
        PostHogSDK.shared.setup(phConfig)
        PostHogSDK.shared.identify(Purchases.shared.appUserID)
        // identify() 後にフラグを明示リロード（ユーザーコンテキスト変更でpreload分が無効になるため）
        // completion callback で featureFlagsReady を立てる → Paywall が nil を読まない
        // Source: https://posthog.com/docs/libraries/ios/usage — "Ensuring flags are loaded before usage"
        PostHogSDK.shared.reloadFeatureFlags {
            Task { @MainActor in
                AppState.shared.featureFlagsReady = true
            }
        }

        // Singular SDK: Install attribution + SKAN 管理（ATT なし、IDFV + SKAN 運用）
        // Purchase は RevenueCat → Singular S2S で自動送信（アプリ側不要）
        SingularManager.shared.configure(launchOptions: launchOptions)

        // ASA Attribution取得 → app_opened トラック（この順序が重要）
        Task {
            await ASAAttributionManager.shared.fetchAttributionIfNeeded()
            AnalyticsManager.shared.track(.appOpened)
        }

        Task {
            // v1.9.1 fix: call registerForRemoteNotifications UNCONDITIONALLY (was: gated on isAuthorizedForAlerts).
            // The previous gate caused some users on 1.9.0 to never trigger APNs registration
            // (week_new=0 in push_tokens DB for 7 days after 1.9.0 release). iOS handles
            // permission internally: if user has no permission, didRegisterForRemoteNotifications
            // simply doesn't fire — no harm done.
            await registerForRemoteNotifications()
            await SubscriptionManager.shared.refreshOfferings()
            await AuthHealthCheck.shared.warmBackend()

            // v1.9.1: If a prior register POST failed, retry on next launch.
            if UserDefaults.standard.bool(forKey: "com.anicca.pushTokenRegistrationPending") {
                await MainActor.run { UIApplication.shared.registerForRemoteNotifications() }
            }
        }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Best-effort: recover APNs token registration on every foreground (idempotent).
        Task { await registerForRemoteNotifications() }
    }

    /// v1.9.1: Unconditionally register for remote notifications. iOS de-dupes internally.
    /// The resulting token is sent to the backend by `didRegisterForRemoteNotificationsWithDeviceToken`.
    /// If user has no notification permission, callback simply never fires (safe).
    private func registerForRemoteNotifications() async {
        await MainActor.run { UIApplication.shared.registerForRemoteNotifications() }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .list, .sound])
        } else {
            completionHandler([.alert, .sound])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        defer { completionHandler() }

        let userInfo = response.notification.request.content.userInfo

        // v1.8.7: Affirmation quote tap (remote APNs) → scroll Feed to that quote.
        // If quoteId is missing/unknown the Feed simply opens at the top (graceful).
        if let quoteId = userInfo["quoteId"] as? String, !quoteId.isEmpty {
            // Warm path: FeedRootView.onReceive picks this up if already subscribed.
            NotificationCenter.default.post(
                name: .aniccaScrollToQuote,
                object: nil,
                userInfo: ["quoteId": quoteId]
            )
            // v1.9.1 cold-launch path: AppState queue survives until FeedRootView.onAppear consumes.
            // Fixes race where cold-launch posts before .onReceive subscribes.
            Task { @MainActor in
                AppState.shared.pendingQuoteId = quoteId
            }
        }
    }

    // MARK: - APNs registration

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { await PushTokenService.shared.register(deviceToken: deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // v1.8.7: notifications are remote-only. On registration failure we simply mark
        // the token unregistered; there is no local-notification fallback by design.
        print("APNs registration failed: \(error)")
        Task { @MainActor in
            PushTokenService.shared.markUnregistered()
        }
    }
}
