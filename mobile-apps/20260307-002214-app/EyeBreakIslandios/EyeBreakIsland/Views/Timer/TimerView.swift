import SwiftUI

struct TimerView: View {
    @EnvironmentObject private var timerService: TimerService
    @EnvironmentObject private var subscriptionService: SubscriptionService
    @StateObject private var viewModel = TimerViewModelContainer()

    var body: some View {
        NavigationView {
            VStack(spacing: AppSpacing.lg) {
                Spacer()

                TimerRing(
                    progress: progress,
                    timerState: timerService.timerState,
                    formattedTime: formattedTime
                )

                statusLabel

                breakCountLabel

                actionButtons

                Spacer()
            }
            .padding(.horizontal, AppSpacing.md)
            .background(AppColors.bgPrimary.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        viewModel.showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .foregroundStyle(AppColors.textSecondary)
                    }
                }
            }
            .sheet(isPresented: $viewModel.showSettings) {
                SettingsView(subscriptionService: subscriptionService)
            }
            .fullScreenCover(isPresented: $viewModel.showBreakOverlay) {
                BreakOverlayView(
                    timerState: timerService.timerState,
                    remainingSeconds: timerService.remainingSeconds,
                    breakInterval: timerService.breakInterval
                )
            }
            .onChange(of: timerService.timerState) { newState in
                viewModel.showBreakOverlay = (newState == .breaking)
            }
        }
        .accessibilityIdentifier(AccessibilityID.timerView)
    }

    private var formattedTime: String {
        let minutes = timerService.remainingSeconds / 60
        let seconds = timerService.remainingSeconds % 60
        return "\(minutes):\(String(format: "%02d", seconds))"
    }

    private var progress: Double {
        let total: Int
        if timerService.timerState == .breaking {
            total = timerService.breakInterval
        } else {
            total = timerService.workInterval
        }
        guard total > 0 else { return 0.0 }
        return 1.0 - (Double(timerService.remainingSeconds) / Double(total))
    }

    private var statusLabel: some View {
        Group {
            switch timerService.timerState {
            case .idle:
                Text("Ready to start")
            case .running:
                Text("Next break in")
            case .paused:
                Text("Paused")
            case .breaking:
                Text("Take a break!")
            }
        }
        .font(AppTypography.body)
        .foregroundStyle(AppColors.textSecondary)
    }

    private var breakCountLabel: some View {
        Text("Today: \(timerService.breakCount) breaks")
            .font(AppTypography.subheadline)
            .foregroundStyle(AppColors.textSecondary)
            .accessibilityIdentifier(AccessibilityID.timerBreakCount)
    }

    @ViewBuilder
    private var actionButtons: some View {
        switch timerService.timerState {
        case .idle:
            PrimaryButton(title: "Start Eye Break") {
                timerService.startSession()
            }
            .accessibilityIdentifier(AccessibilityID.timerStartButton)

        case .running:
            PrimaryButton(title: "Pause") {
                timerService.pauseSession()
            }
            .accessibilityIdentifier(AccessibilityID.timerPauseButton)

            SecondaryButton(title: "Stop") {
                timerService.stopSession()
            }
            .accessibilityIdentifier(AccessibilityID.timerStopButton)

        case .paused:
            PrimaryButton(title: "Resume") {
                timerService.resumeSession()
            }
            .accessibilityIdentifier(AccessibilityID.timerPauseButton)

            SecondaryButton(title: "Stop") {
                timerService.stopSession()
            }
            .accessibilityIdentifier(AccessibilityID.timerStopButton)

        case .breaking:
            EmptyView()
        }
    }
}

@MainActor
final class TimerViewModelContainer: ObservableObject {
    @Published var showSettings = false
    @Published var showBreakOverlay = false
}
