// File: Views/Onboarding/OnboardingContainerView.swift
// F-002: Onboarding flow (Age → Zone2 Explainer → Notification → Paywall)
// Stub for US-006a — full implementation in US-006b

import SwiftUI

struct OnboardingContainerView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var viewModel = OnboardingViewModel()

    var body: some View {
        TabView(selection: $viewModel.currentStep) {
            AgeInputView(viewModel: viewModel)
                .tag(0)
            Zone2ExplainerView(viewModel: viewModel)
                .tag(1)
            NotificationPermissionView(viewModel: viewModel)
                .tag(2)
            PaywallView(subscriptionService: SubscriptionService())
                .tag(3)
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .accessibilityIdentifier("screen_onboarding")
        .onChange(of: viewModel.isComplete) { _, isComplete in
            if isComplete { hasCompletedOnboarding = true }
        }
    }
}
