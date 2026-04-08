import SwiftUI
import RevenueCat
import RevenueCatUI
import UserNotifications
import StoreKit
import PostHog

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @State private var step: OnboardingStep = .welcome
    @State private var paywallStep: PaywallStep? = nil
    @State private var didPurchaseOnPaywall = false

    var body: some View {
        ZStack {
            AppBackground()

            VStack(spacing: 0) {
                // Progress bar — hidden during paywall steps
                if paywallStep == nil {
                    OnboardingProgressBar(step: step)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                }

                Group {
                    if let paywallStep {
                        paywallContent(for: paywallStep)
                    } else {
                        onboardingContent(for: step)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

        }
        .onAppear {
            step = appState.onboardingStep

            if step == .notifications {
                Task {
                    let settings = await UNUserNotificationCenter.current().notificationSettings()
                    if settings.authorizationStatus != .notDetermined {
                        await MainActor.run {
                            completeOnboarding()
                        }
                        return
                    }
                }
            }

            if step == .welcome {
                AnalyticsManager.shared.track(.onboardingStarted)
            }

            Task {
                await SubscriptionManager.shared.refreshOfferings()
            }
        }
    }

    // MARK: - Onboarding Steps

    @ViewBuilder
    private func onboardingContent(for step: OnboardingStep) -> some View {
        switch step {
        case .welcome:
            WelcomeStepView(next: advance)
        case .struggles:
            StrugglesStepView(next: advance)
        case .struggleDepth:
            StruggleDepthStepView(next: advance)
        case .personalizedInsight:
            PersonalizedInsightStepView(next: advance)
        case .processing:
            ProcessingStepView(next: advance)
        case .valueProp:
            ValuePropStepView(next: advance)
        case .appDemo:
            AppDemoStepView(next: advance)
        case .notifications:
            NotificationPermissionStepView(next: advance)
        }
    }

    // MARK: - Paywall Steps

    @ViewBuilder
    private func paywallContent(for step: PaywallStep) -> some View {
        switch step {
        case .primer:
            PaywallPrimerStepView(next: {
                withAnimation {
                    paywallStep = .planSelection
                }
            })
        case .planSelection:
            if !appState.featureFlagsReady {
                // PostHog フラグ到着待ち（初回起動時のみ発生）
                // Source: https://posthog.com/docs/libraries/ios/usage — "Ensuring flags are loaded before usage"
                VStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
                .background(AppBackground())
            } else {
                let variant: String = {
                    if let forced = ProcessInfo.processInfo.environment["PAYWALL_VARIANT"] {
                        return forced
                    }
                    return PostHogSDK.shared.getFeatureFlag("paywall-ab-test") as? String ?? "test"
                }()
                if variant == "test" {
                    PaywallVariantBView(
                        variant: variant,
                        onPurchaseSuccess: { customerInfo in handlePaywallSuccess(customerInfo: customerInfo) },
                        onDismiss: { handlePaywallDismissedAsFree() }
                    )
                } else {
                    PlanSelectionStepView(
                        onPurchaseSuccess: { customerInfo in handlePaywallSuccess(customerInfo: customerInfo) },
                        onDismiss: { handlePaywallDismissedAsFree() },
                        variant: variant
                    )
                }
            }
        }
    }

    // MARK: - Navigation

    private func advance() {
        switch step {
        case .welcome:
            AnalyticsManager.shared.track(.onboardingWelcomeCompleted)
            step = .struggles
        case .struggles:
            AnalyticsManager.shared.track(.onboardingStrugglesCompleted)
            step = .struggleDepth
        case .struggleDepth:
            step = .personalizedInsight
        case .personalizedInsight:
            step = .processing
        case .processing:
            step = .valueProp
        case .valueProp:
            step = .appDemo
        case .appDemo:
            step = .notifications
        case .notifications:
            AnalyticsManager.shared.track(.onboardingNotificationsCompleted)
            completeOnboarding()
            return
        }
        appState.setOnboardingStep(step)
    }

    private func completeOnboarding() {
        AnalyticsManager.shared.track(.onboardingCompleted)
        AnalyticsManager.shared.updateSKANConversionValue(1)
        NudgeWidgetDataStore.sync(struggles: appState.userProfile.struggles)

        // Existing Pro user (reinstall etc.) → skip paywall
        if appState.subscriptionInfo.isEntitled {
            completeOnboardingForExistingPro()
            return
        }

        // Not subscribed → show 2-step paywall
        withAnimation {
            paywallStep = .primer
        }
    }

    private func completeOnboardingForExistingPro() {
        Task {
            await ProblemNotificationScheduler.shared
                .scheduleNotifications(for: appState.userProfile.struggles)
            appState.markOnboardingComplete()
        }
    }

    private func handlePaywallSuccess(customerInfo: CustomerInfo) {
        didPurchaseOnPaywall = true
        appState.updateSubscriptionInfo(from: customerInfo)
        appState.markOnboardingComplete()
        requestReviewIfNeeded()
        Task {
            await ProblemNotificationScheduler.shared
                .scheduleNotifications(for: appState.userProfile.struggles)
        }
    }

    private func handlePaywallDismissedAsFree() {
        guard !didPurchaseOnPaywall else { return }

        AnalyticsManager.shared.track(.onboardingPaywallDismissedFree)
        AnalyticsManager.shared.trackPostHog("paywall_dismissed", properties: [
            "variant": PostHogSDK.shared.getFeatureFlag("paywall-ab-test") as? String ?? "control"
        ])

        let problems = appState.userProfile.struggles.compactMap { ProblemType(rawValue: $0) }
        FreePlanService.shared.scheduleFreePlanNudges(problems: problems)

        appState.markOnboardingComplete()
        requestReviewIfNeeded()
    }

    private func requestReviewIfNeeded() {
        guard !appState.hasRequestedReview else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }
        }
        appState.markReviewRequested()
    }

}
