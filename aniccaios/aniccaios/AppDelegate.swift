// v1.6.1 — ATT/Singular削除
// v1.8.0 — TikTok Business SDK追加（ATTなし、IDFAゼロ運用）
import UIKit
import UserNotifications
import OSLog
import BackgroundTasks
import PostHog
import RevenueCat
import TikTokBusinessSDK

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

        UNUserNotificationCenter.current().delegate = self
        NotificationScheduler.shared.registerCategories()
        SubscriptionManager.shared.configure()

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

        // TikTok Business SDK: 全イベント手動送信（ATTなし）
        // automaticTrackingEnabled = false（デフォルト）: SDK自動追跡OFF
        //   理由: automaticTracking ON → サーバー設定が disablePaymentTracking() を上書き
        //         → Purchase 大量発火（TikTokBusiness.m L951）
        // InstallApp / LaunchAPP / Subscribe は全て手動で正確に1回ずつ送信
        if let ttConfig = TikTokConfig(
            accessToken: "TTb5OwyxPDGWM0zYywD5K2tgJMppH0Wb",
            appId: "6755129214",
            tiktokAppId: "7593741049791217671"
        ) {
            ttConfig.disableAutomaticTracking()
            ttConfig.setLogLevel(TikTokLogLevelSuppress)
            TikTokBusiness.initializeSdk(ttConfig)
        }

        // 手動 InstallApp（初回起動のみ、1回だけ）
        if !UserDefaults.standard.bool(forKey: "tiktokInstallTracked") {
            let installEvent = TikTokBaseEvent(eventName: "InstallApp")
            TikTokBusiness.trackTTEvent(installEvent)
            UserDefaults.standard.set(true, forKey: "tiktokInstallTracked")
        }

        // 手動 LaunchAPP（毎回起動、1回だけ）
        let launchEvent = TikTokBaseEvent(eventName: "LaunchAPP")
        TikTokBusiness.trackTTEvent(launchEvent)

        // ASA Attribution取得 → app_opened トラック（この順序が重要）
        Task {
            await ASAAttributionManager.shared.fetchAttributionIfNeeded()
            AnalyticsManager.shared.track(.appOpened)
        }

        Task {
            // APNs token registration is idempotent and may be delayed by iOS.
            // Best-effort: if the user has already granted notification authorization, always (re)register
            // on launch so token registration can recover without extra user actions.
            let authorized = await NotificationScheduler.shared.isAuthorizedForAlerts()
            if authorized {
                await MainActor.run { UIApplication.shared.registerForRemoteNotifications() }
            }
            await SubscriptionManager.shared.refreshOfferings()
            await AuthHealthCheck.shared.warmBackend()
        }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // v1.6.2: poll worker-sent nudges and schedule them locally (best-effort).
        Task { await ServerNudgeInboxService.shared.pullAndScheduleIfAuthorized() }
        // Best-effort: recover APNs token registration if it was delayed on first run.
        Task {
            let authorized = await NotificationScheduler.shared.isAuthorizedForAlerts()
            if authorized {
                await MainActor.run { UIApplication.shared.registerForRemoteNotifications() }
            }
        }
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

        let identifier = response.actionIdentifier
        let notificationIdentifier = response.notification.request.identifier
        let content = response.notification.request.content
        let userInfo = content.userInfo

        // v1.6.3: APNs-delivered Problem Nudge (remote push)
        if let messageId = userInfo["messageId"] as? String, !messageId.isEmpty,
           let problemRaw = userInfo["problemType"] as? String,
           let problem = ProblemType(rawValue: problemRaw) {
            switch identifier {
            case UNNotificationDefaultActionIdentifier,
                 NotificationScheduler.Action.startConversation.rawValue:
                Task { @MainActor in
                    do {
                        let delivery = try await ProblemNudgeDeliveryService.shared.fetchDelivery(id: messageId)
                        let nudgeContent = NudgeContent(
                            problemType: problem,
                            notificationText: delivery.hook,
                            detailText: delivery.detail,
                            variantIndex: delivery.variantIndex,
                            isAIGenerated: false,
                            llmNudgeId: nil
                        )
                        AppState.shared.showNudgeCard(nudgeContent)
                    } catch {
                        // Best-effort fallback: show a card using the APNs alert even if the API is unavailable.
                        // This avoids "tap does nothing" in offline/5xx scenarios.
                        print("Failed to fetch delivery \(messageId): \(error)")
                        let fallback = NudgeContent(
                            problemType: problem,
                            notificationText: content.body,
                            detailText: "",
                            variantIndex: 0,
                            isAIGenerated: false,
                            llmNudgeId: nil
                        )
                        AppState.shared.showNudgeCard(fallback)
                    }
                }
            default:
                break
            }
            return
        }

        // Proactive Agent: Problem Nudge通知のハンドリング
        if ProblemNotificationScheduler.isProblemNudge(identifier: notificationIdentifier) {
            switch identifier {
            case UNNotificationDefaultActionIdentifier,
                 NotificationScheduler.Action.startConversation.rawValue:
                if let nudgeContent = ProblemNotificationScheduler.nudgeContent(from: userInfo) {
                    // nudge_tapped を記録
                    let scheduledHour = userInfo["scheduledHour"] as? Int ?? 0
                    Task { @MainActor in
                        // NudgeStats に記録（isAIGeneratedとllmNudgeIdを含む）
                        NudgeStatsManager.shared.recordTapped(
                            problemType: nudgeContent.problemType.rawValue,
                            variantIndex: nudgeContent.variantIndex,
                            scheduledHour: scheduledHour,
                            isAIGenerated: nudgeContent.isAIGenerated,
                            llmNudgeId: nudgeContent.llmNudgeId
                        )

                        // Phase 7+8: hookFeedback "tapped" をサーバーに送信
                        if let nudgeId = nudgeContent.llmNudgeId {
                            Task {
                                do {
                                    try await NudgeFeedbackService.shared.handleNudgeTapped(nudgeId: nudgeId)
                                } catch {
                                    // エラーは無視（ユーザー体験を妨げない）
                                    print("Failed to send tapped feedback: \(error)")
                                }
                            }
                        }

                        // NudgeCard を表示
                        AppState.shared.showNudgeCard(nudgeContent)
                    }
                }
            case NotificationScheduler.Action.dismissAll.rawValue,
                 UNNotificationDismissActionIdentifier:
                break
            default:
                break
            }
            return
        }

        // Server-driven Nudge
        if let nudgeId = NotificationScheduler.shared.nudgeId(fromIdentifier: notificationIdentifier) {
            Task {
                switch identifier {
                case UNNotificationDismissActionIdentifier,
                     NotificationScheduler.Action.dismissAll.rawValue:
                    await NudgeTriggerService.shared.recordDismissed(nudgeId: nudgeId)
                case NotificationScheduler.Action.startConversation.rawValue,
                     UNNotificationDefaultActionIdentifier:
                    await NudgeTriggerService.shared.recordOpened(nudgeId: nudgeId, actionIdentifier: identifier)
                default:
                    break
                }
            }
        }
    }

    // MARK: - APNs registration

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { await PushTokenService.shared.register(deviceToken: deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs registration failed: \(error)")
        Task { @MainActor in
            PushTokenService.shared.markUnregistered()
            let problems = AppState.shared.userProfile.struggles
            if !problems.isEmpty {
                await ProblemNotificationScheduler.shared.scheduleNotifications(for: problems)
            }
        }
    }
}
