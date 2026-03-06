import SwiftUI

struct OnboardingView: View {
    @StateObject private var viewModel: OnboardingViewModel
    @EnvironmentObject var subscriptionService: SubscriptionService

    init(notificationService: NotificationServiceProtocol = NotificationService()) {
        _viewModel = StateObject(wrappedValue: OnboardingViewModel(notificationService: notificationService))
    }

    var body: some View {
        VStack {
            TabView(selection: $viewModel.currentPage) {
                ForEach(Array(viewModel.pages.enumerated()), id: \.offset) { index, page in
                    VStack {
                        OnboardingPageView(page: page, pageIndex: index)

                        if index == 2 {
                            notificationButton
                        } else {
                            nextButton
                        }

                        pageIndicator
                            .padding(.bottom, 32)
                    }
                    .tag(index)
                }

                paywallPage
                    .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.spring(duration: 0.4), value: viewModel.currentPage)
        }
        .accessibilityIdentifier(AccessibilityID.onboardingContainer)
    }

    // MARK: - Subviews

    private var nextButton: some View {
        Button {
            viewModel.nextPage()
        } label: {
            Text("Next")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal, 24)
        .accessibilityIdentifier(AccessibilityID.onboardingNextButton)
    }

    private var notificationButton: some View {
        Button {
            Task { await viewModel.requestNotificationPermission() }
        } label: {
            Text("Allow Notifications")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal, 24)
        .accessibilityIdentifier(AccessibilityID.onboardingAllowNotifications)
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<viewModel.totalPages, id: \.self) { index in
                Circle()
                    .fill(index == viewModel.currentPage ? Color.accentColor : Color.secondary.opacity(0.3))
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.top, 16)
    }

    private var paywallPage: some View {
        PaywallView(
            subscriptionService: subscriptionService,
            onDismiss: {
                viewModel.completeOnboarding()
            },
            onPurchaseCompleted: {
                viewModel.completeOnboarding()
            }
        )
    }
}
