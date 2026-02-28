import SwiftUI

struct SessionView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @Environment(\.dismiss) private var dismiss

    let sessionType: SessionType

    @State private var phase: SessionPhase = .moodBefore
    @State private var moodBefore: Int = 5
    @State private var moodAfter: Int = 5
    @State private var currentPhaseIndex = 0
    @State private var timeElapsed = 0
    @State private var timer: Timer?
    @State private var phaseTimeLeft: Int = 0

    enum SessionPhase {
        case moodBefore, active, moodAfter, complete
    }

    var currentBreathPhase: BreathPhase {
        sessionType.phases[currentPhaseIndex % sessionType.phases.count]
    }

    var progress: Double {
        guard phaseTimeLeft > 0 else { return 0 }
        let duration = Double(currentBreathPhase.duration)
        return (duration - Double(phaseTimeLeft)) / duration
    }

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            switch phase {
            case .moodBefore:
                MoodScoreView(
                    title: NSLocalizedString("session.mood.before.title", comment: ""),
                    subtitle: NSLocalizedString("session.mood.before.subtitle", comment: ""),
                    score: $moodBefore,
                    ctaTitle: NSLocalizedString("session.mood.start", comment: ""),
                    onContinue: {
                        startSession()
                    }
                )
            case .active:
                activeSessionView
            case .moodAfter:
                MoodScoreView(
                    title: NSLocalizedString("session.mood.after.title", comment: ""),
                    subtitle: NSLocalizedString("session.mood.after.subtitle", comment: ""),
                    score: $moodAfter,
                    ctaTitle: NSLocalizedString("common.done", comment: ""),
                    onContinue: {
                        completeSession()
                    }
                )
            case .complete:
                completeView
            }
        }
        .onDisappear {
            timer?.invalidate()
        }
    }

    private var activeSessionView: some View {
        VStack(spacing: 40) {
            HStack {
                Button(action: {
                    timer?.invalidate()
                    dismiss()
                }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 18))
                        .foregroundColor(Color.bcTextSecondary)
                }
                Spacer()
                Text(sessionType.localizedName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color.bcTextSecondary)
                Spacer()
                Color.clear.frame(width: 18, height: 18)
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)

            Spacer()

            // Breath circle
            ZStack {
                Circle()
                    .stroke(Color.bcCard, lineWidth: 8)
                    .frame(width: 220, height: 220)

                Circle()
                    .trim(from: 0, to: CGFloat(progress))
                    .stroke(Color.bcAccent, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 220, height: 220)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: progress)

                VStack(spacing: 8) {
                    Text(currentBreathPhase.localizedName)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color.bcText)
                    Text("\(phaseTimeLeft)s")
                        .font(.system(size: 20))
                        .foregroundColor(Color.bcTextSecondary)
                }
            }

            Text(String(format: NSLocalizedString("session.remaining", comment: ""),
                        timeString(timeElapsed)))
                .font(.system(size: 16))
                .foregroundColor(Color.bcTextSecondary)

            Spacer()
        }
    }

    private var completeView: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 72))
                .foregroundColor(Color.bcAccentSecondary)

            Text(NSLocalizedString("session.complete.title", comment: ""))
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(Color.bcText)

            if moodBefore > moodAfter {
                Text(String(format: NSLocalizedString("session.improvement", comment: ""),
                            moodBefore - moodAfter))
                    .font(.system(size: 18))
                    .foregroundColor(Color.bcAccentSecondary)
            }

            Spacer()

            Button(action: { dismiss() }) {
                Text(NSLocalizedString("session.done", comment: ""))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(Color.bcAccent)
                    .cornerRadius(16)
            }
            .padding(.horizontal, 32)

            Spacer().frame(height: 20)
        }
    }

    private func startSession() {
        phase = .active
        phaseTimeLeft = currentBreathPhase.duration
        AnalyticsManager.shared.trackSessionStarted(type: sessionType)

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            timeElapsed += 1
            phaseTimeLeft -= 1

            if phaseTimeLeft <= 0 {
                currentPhaseIndex += 1
                phaseTimeLeft = currentBreathPhase.duration
            }

            if timeElapsed >= sessionType.durationSeconds {
                timer?.invalidate()
                phase = .moodAfter
            }
        }
    }

    private func completeSession() {
        phase = .complete
        let session = BreathSession(
            sessionType: sessionType,
            moodBefore: moodBefore,
            moodAfter: moodAfter,
            durationSeconds: timeElapsed
        )
        SessionStore.shared.add(session)
        AnalyticsManager.shared.trackSessionCompleted(
            type: sessionType,
            moodBefore: moodBefore,
            moodAfter: moodAfter
        )
    }

    private func timeString(_ seconds: Int) -> String {
        let remaining = max(0, sessionType.durationSeconds - seconds)
        let m = remaining / 60
        let s = remaining % 60
        return String(format: "%d:%02d", m, s)
    }
}
