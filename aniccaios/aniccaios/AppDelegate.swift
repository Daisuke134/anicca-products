// v1.8.2 — Singular SDK 再統合 + RevenueCat→Singular→TikTok SAN
import UIKit
import UserNotifications
import OSLog
import BackgroundTasks
import PostHog
import RevenueCat

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        // ④/⑥/⑦ 1.9.3 UITest: skip onboarding so Maestro can reach Feed + Settings.
        // Must run BEFORE AppState.shared init reads the onboarding flag. DEBUG-only dead code.
        #if DEBUG
        if ProcessInfo.processInfo.environment["UITEST_SKIP_ONBOARDING"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-uiTestSkipOnboarding") {
            UserDefaults.standard.set(true, forKey: "com.anicca.onboardingComplete")
        }
        #endif

        let proxy = Bundle.main.object(forInfoDictionaryKey: "ANICCA_PROXY_BASE_URL") as? String ?? "nil"
        print("ANICCA_PROXY_BASE_URL =", proxy)

        let resetFlag = (Bundle.main.object(forInfoDictionaryKey: "RESET_ON_LAUNCH") as? NSString)?.boolValue == true
        let shouldReset = resetFlag || ProcessInfo.processInfo.arguments.contains("-resetOnLaunch")
        if shouldReset {
            UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier ?? "")
            UserDefaults.standard.synchronize()
            AppState.shared.resetState()
        }

        // ④ 1.9.3: UITest launch arg/env parse (DEBUG only, dead code in production)
        #if DEBUG
        let uiArgs = ProcessInfo.processInfo.arguments
        let uiEnv = ProcessInfo.processInfo.environment
        if let idx = uiArgs.firstIndex(of: "-pendingQuoteIdOnLaunch"), idx + 1 < uiArgs.count {
            AppState.shared.pendingQuoteId = uiArgs[idx + 1]
        } else if let qid = uiEnv["PENDING_QUOTE_ID_ON_LAUNCH"] {
            AppState.shared.pendingQuoteId = qid
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
        // RevenueCat 未 configure 時 (UITest skip) に Purchases.shared が crash するのを防ぐ。
        if SubscriptionManager.shared.isConfigured {
            PostHogSDK.shared.identify(Purchases.shared.appUserID)
        }
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
            // ① 1.9.3 fix: register UNCONDITIONALLY (旧 if-authorized gate 除去 = 土曜から通知停止の真因)。
            // iOS が permission を内部処理: 許可なしなら didRegisterForRemoteNotifications が発火しないだけ (無害)。
            await registerForRemoteNotifications()
            await SubscriptionManager.shared.refreshOfferings()
            await AuthHealthCheck.shared.warmBackend()
            // 前回 register POST が失敗していたら次起動で再試行。
            if UserDefaults.standard.bool(forKey: "com.anicca.pushTokenRegistrationPending") {
                await registerForRemoteNotifications()
            }
        }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Best-effort: recover APNs token registration on every foreground (idempotent).
        Task { await registerForRemoteNotifications() }
    }

    /// ① 1.9.3: Unconditionally register for remote notifications. iOS de-dupes internally.
    /// The resulting token is sent to the backend by `didRegisterForRemoteNotificationsWithDeviceToken`.
    /// If the user has no permission, the callback simply never fires (safe).
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
            // warm path: FeedRootView.onReceive が既に購読していれば拾う
            NotificationCenter.default.post(
                name: .aniccaScrollToQuote,
                object: nil,
                userInfo: ["quoteId": quoteId]
            )
            // ④ cold-launch queue: FeedRootView.onAppear が pull するまで AppState に保持
            Task { @MainActor in AppState.shared.pendingQuoteId = quoteId }
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
