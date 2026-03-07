import Foundation

/// Service classes (reference types) are exempt from the struct immutability rule.
final class TimerService: TimerServiceProtocol {
    private var timer: Timer?
    private var remaining: TimeInterval = 0
    private var onTickHandler: ((TimeInterval) -> Void)?
    private var onCompleteHandler: (() -> Void)?

    func startTimer(duration: TimeInterval, onTick: @escaping (TimeInterval) -> Void, onComplete: @escaping () -> Void) {
        stopTimer()
        remaining = duration
        onTickHandler = onTick
        onCompleteHandler = onComplete

        onTick(remaining)

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.remaining -= 1
            if self.remaining <= 0 {
                self.remaining = 0
                onTick(0)
                self.stopTimer()
                onComplete()
            } else {
                onTick(self.remaining)
            }
        }
    }

    func pauseTimer() {
        timer?.invalidate()
        timer = nil
    }

    func resumeTimer() {
        guard let onTick = onTickHandler, let onComplete = onCompleteHandler else { return }
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.remaining -= 1
            if self.remaining <= 0 {
                self.remaining = 0
                onTick(0)
                self.stopTimer()
                onComplete()
            } else {
                onTick(self.remaining)
            }
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
        remaining = 0
        onTickHandler = nil
        onCompleteHandler = nil
    }

    func startBreathingPrep(duration: TimeInterval, onPhaseChange: @escaping (BreathPhase) -> Void, onComplete: @escaping () -> Void) {
        stopTimer()

        let cycleLength: TimeInterval = 19 // 4s inhale + 7s hold + 8s exhale
        var elapsed: TimeInterval = 0

        onPhaseChange(.inhale)

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            elapsed += 1

            if elapsed >= duration {
                self.stopTimer()
                onComplete()
                return
            }

            let positionInCycle = elapsed.truncatingRemainder(dividingBy: cycleLength)
            if positionInCycle < 4 {
                onPhaseChange(.inhale)
            } else if positionInCycle < 11 {
                onPhaseChange(.hold)
            } else {
                onPhaseChange(.exhale)
            }
        }
    }
}
