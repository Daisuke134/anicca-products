import SwiftUI

struct TimerView: View {
    @Environment(AppState.self) private var appState
    @State private var remainingSeconds: Int = 0
    @State private var totalSeconds: Int = 0
    @State private var isRunning = false
    @State private var timer: Timer?
    @State private var showStretchSession = false

    var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return Double(totalSeconds - remainingSeconds) / Double(totalSeconds)
    }

    var timeString: String {
        let minutes = remainingSeconds / 60
        let seconds = remainingSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var body: some View {
        VStack(spacing: 32) {
            StreakBadge(streak: appState.userProgress.streak)

            TimerRing(progress: progress, timeRemaining: timeString)
                .frame(width: 240, height: 240)
                .accessibilityIdentifier("timer_countdown")

            VStack(spacing: 16) {
                if isRunning {
                    SecondaryButton(title: String(localized: "Pause")) {
                        pauseTimer()
                    }
                } else if remainingSeconds > 0 {
                    PrimaryButton(title: String(localized: "Resume")) {
                        startTimer()
                    }
                } else {
                    PrimaryButton(title: String(localized: "Start Timer")) {
                        resetAndStart()
                    }
                    .accessibilityIdentifier("timer_start")
                }

                Button(String(localized: "Stretch Now")) {
                    startStretchSession()
                }
                .font(.headline)
                .foregroundColor(.accentColor)
                .accessibilityIdentifier("timer_stretch_now")
            }
        }
        .padding()
        .onAppear {
            if remainingSeconds == 0 {
                let interval = max(1, appState.breakSchedule.intervalMinutes)
                totalSeconds = interval * 60
                remainingSeconds = totalSeconds
            }
        }
        .onDisappear { stopTimer() }
        .fullScreenCover(isPresented: $showStretchSession) {
            if let session = appState.currentSession {
                StretchSessionView(session: session)
            }
        }
    }

    private func resetAndStart() {
        let interval = max(1, appState.breakSchedule.intervalMinutes)
        totalSeconds = interval * 60
        remainingSeconds = totalSeconds
        startTimer()
    }

    private func startTimer() {
        isRunning = true
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if remainingSeconds > 0 {
                remainingSeconds -= 1
            } else {
                stopTimer()
                startStretchSession()
            }
        }
    }

    private func pauseTimer() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }

    private func stopTimer() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }

    private func startStretchSession() {
        let exercises = appState.routineService.selectRoutine(
            painAreas: appState.selectedPainAreas,
            history: [],
            isPremium: appState.isPremium
        )
        if !exercises.isEmpty {
            appState.currentSession = StretchSession(exercises: exercises)
            showStretchSession = true
        }
    }
}
