import SwiftUI
import RevenueCat
import RevenueCatUI
import UserNotifications
import StoreKit

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @State private var step: OnboardingStep = .welcome
    @State private var paywallStep: PaywallStep? = nil
    @State private var showDrawer = false
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

            // Drawer overlay
            if showDrawer {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation(.spring(response: 0.3)) {
                            showDrawer = false
                        }
                    }

                VStack {
                    Spacer()
                    DrawerOfferView(
                        weeklyPrice: weeklyPriceString,
                        onStartTrial: {
                            withAnimation(.spring(response: 0.3)) {
                                showDrawer = false
                            }
                            // Go back to plan selection (user can purchase from there)
                        },
                        onSkip: {
                            withAnimation(.spring(response: 0.3)) {
                                showDrawer = false
                            }
                            handlePaywallDismissedAsFree()
                        }
                    )
                    .transition(.move(edge: .bottom))
                }
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
        case .goals:
            GoalsStepView(next: advance)
        case .personalizedInsight:
            PersonalizedInsightStepView(next: advance)
        case .valueProp:
            ValuePropStepView(next: advance)
        case .liveDemo:
            DemoNudgeStepView(next: advance)
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
                    paywallStep = .timeline
                }
            })
        case .timeline:
            TrialTimelineStepView(next: {
                withAnimation {
                    paywallStep = .planSelection
                }
            })
        case .planSelection:
            PlanSelectionStepView(
                onPurchaseSuccess: { customerInfo in
                    handlePaywallSuccess(customerInfo: customerInfo)
                },
                onDismiss: {
                    handlePaywallDismissedAsFree()
                },
                onShowDrawer: {
                    withAnimation(.spring(response: 0.3)) {
                        showDrawer = true
                    }
                }
            )
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
            step = .goals
        case .goals:
            step = .personalizedInsight
        case .personalizedInsight:
            step = .valueProp
        case .valueProp:
            step = .liveDemo
        case .liveDemo:
            AnalyticsManager.shared.track(.onboardingLiveDemoCompleted)
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

        // Existing Pro user (reinstall etc.) → skip paywall
        if appState.subscriptionInfo.isEntitled {
            completeOnboardingForExistingPro()
            return
        }

        // Not subscribed → show 3-step paywall
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
        Task {
            appState.updateSubscriptionInfo(from: customerInfo)
            await ProblemNotificationScheduler.shared
                .scheduleNotifications(for: appState.userProfile.struggles)
            appState.markOnboardingComplete()
            requestReviewIfNeeded()
        }
    }

    private func handlePaywallDismissedAsFree() {
        guard !didPurchaseOnPaywall else { return }

        AnalyticsManager.shared.track(.onboardingPaywallDismissedFree)

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

    // MARK: - Helpers

    private var weeklyPriceString: String {
        if let yearly = appState.cachedOffering?.availablePackages.first(where: { $0.packageType == .annual }) {
            let weeklyPrice = yearly.storeProduct.price as Decimal / 52
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            formatter.locale = yearly.storeProduct.priceFormatter?.locale ?? .current
            return formatter.string(from: weeklyPrice as NSDecimalNumber) ?? yearly.localizedPriceString
        }
        return "$0.96"
    }
}
