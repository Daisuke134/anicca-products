import SwiftUI
import RevenueCat
import RevenueCatUI
import UserNotifications
import StoreKit

/// v7 onboarding: 11 steps + 2-step SOFT paywall.
/// Paywall presented via .fullScreenCover + .interactiveDismissDisabled (スワイプ離脱は防止)。
/// 右上の × (paywall-close-button) タップでのみ課金せずメイン画面へ遷移する。
struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @State private var step: OnboardingStep = .welcome
    @State private var showPaywall: Bool = false
    @State private var didPurchaseOnPaywall = false

    var body: some View {
        ZStack {
            AppBackground()

            VStack(spacing: 0) {
                OnboardingProgressBar(step: step)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                Group {
                    onboardingContent(for: step)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onAppear {
            if appState.onboardingQuestionsCompleted && !appState.subscriptionInfo.isEntitled {
                showPaywall = true
                return
            }

            step = appState.onboardingStep

            // Guideline 5.6.3: the rating step was removed from the onboarding flow
            // (must not request App Store review before the user reaches the paywall/app).
            // The enum case + rawValue are kept for saved-progress / v6-migration
            // compatibility, so a returning or v6-migrated user can still be restored
            // onto it — redirect straight past it instead of surfacing the rating screen.
            if step == .ratingPrompt, let next = Self.nextStep(after: step) {
                step = next
                appState.setOnboardingStep(step)
            }

            if step == .welcome {
                AnalyticsManager.shared.track(.onboardingStarted)
            }

            Task {
                await SubscriptionManager.shared.refreshOfferings()
            }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallFlowContainer(
                onPurchaseSuccess: { customerInfo in
                    handlePaywallSuccess(customerInfo: customerInfo)
                },
                onDismiss: {
                    handlePaywallDismissedAsFree()
                }
            )
            .interactiveDismissDisabled(true)
        }
    }

    // MARK: - Onboarding Steps

    @ViewBuilder
    private func onboardingContent(for step: OnboardingStep) -> some View {
        switch step {
        case .welcome:          WelcomeStepView(next: advance)
        case .goal:             GoalStepView(next: advance)
        case .painPoints:       StrugglesStepView(next: advance)
        case .struggleFreq:     StruggleDepthStepView(next: advance)
        case .nudgeTimes:       PreferredNudgeTimesView(next: advance)
        case .processing:       ProcessingStepView(next: advance)
        case .planReveal:       PersonalizedInsightStepView(next: advance)
        case .comparison:       ComparisonTableStepView(next: advance)
        // Guideline 5.6.3: rating step removed from the flow. This case is unreachable
        // in normal navigation (advance()/onAppear both skip it) — kept only so the
        // switch stays exhaustive over OnboardingStep; falls back to the next real step
        // instead of ever presenting RatingPrePromptStepView (SKStoreReviewController).
        case .ratingPrompt:     NotificationPermissionStepView(next: advance)
        case .notifications:    NotificationPermissionStepView(next: advance)
        }
    }

    // MARK: - Navigation

    private func advance() {
        AnalyticsManager.shared.track(.onboardingStepAdvanced, properties: ["step": step.analyticsName])

        if step == .notifications {
            appState.markOnboardingQuestionsCompleted()
            AnalyticsManager.shared.track(.onboardingCompleted)
            AnalyticsManager.shared.updateSKANConversionValue(1)

            if appState.subscriptionInfo.isEntitled {
                completeOnboardingForExistingPro()
                return
            }

            showPaywall = true
            return
        }

        if let next = Self.nextStep(after: step) {
            step = next
            appState.setOnboardingStep(step)
        }
    }

    /// Guideline 5.6.3: `.ratingPrompt` (rawValue 8) is never surfaced — the enum case is
    /// kept only for saved-progress / v6-migration rawValue compatibility (see
    /// OnboardingStep.swift). Normal `+1` navigation skips straight over it.
    private static func nextStep(after current: OnboardingStep) -> OnboardingStep? {
        guard var candidate = OnboardingStep(rawValue: current.rawValue + 1) else { return nil }
        if candidate == .ratingPrompt {
            candidate = OnboardingStep(rawValue: current.rawValue + 2) ?? candidate
        }
        return candidate
    }

    private func completeOnboardingForExistingPro() {
        // v1.8.7: remote-only notifications. APNs registration is triggered on
        // permission grant and on app foreground — nothing to schedule locally.
        appState.markOnboardingComplete()
    }

    private func handlePaywallSuccess(customerInfo: CustomerInfo) {
        didPurchaseOnPaywall = true
        appState.updateSubscriptionInfo(from: customerInfo)
        appState.markOnboardingComplete()
        showPaywall = false
    }

    /// ソフトペイウォール: 右上 × で課金せずメイン画面へ。
    private func handlePaywallDismissedAsFree() {
        AnalyticsManager.shared.track(.onboardingPaywallDismissedFree)
        appState.markOnboardingComplete()
        showPaywall = false
    }
}
