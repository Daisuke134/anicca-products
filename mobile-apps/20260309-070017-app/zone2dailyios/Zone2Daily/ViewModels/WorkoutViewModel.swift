// File: ViewModels/WorkoutViewModel.swift
// F-003: Workout timer with background support
// Stub for US-006a — full implementation in US-006c

import Foundation
import SwiftData
import Observation

@Observable
final class WorkoutViewModel {
    var elapsedSeconds: Int = 0
    var zone2Seconds: Int = 0
    var isRunning: Bool = false

    private var timer: Timer?

    var formattedTime: String {
        let minutes = elapsedSeconds / 60
        let seconds = elapsedSeconds % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    func startTimer() {
        isRunning = true
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.elapsedSeconds += 1
            self?.zone2Seconds += 1
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
        isRunning = false
    }

    func stopAndSave(modelContext: ModelContext, age: Int) {
        stopTimer()
        guard elapsedSeconds > 0 else { return }
        let session = WorkoutSession(
            durationSeconds: elapsedSeconds,
            zone2Seconds: zone2Seconds,
            targetHR: Zone2Calculator.zone2MaxHR(age: age)
        )
        modelContext.insert(session)
        try? modelContext.save()
        elapsedSeconds = 0
        zone2Seconds = 0
    }
}
