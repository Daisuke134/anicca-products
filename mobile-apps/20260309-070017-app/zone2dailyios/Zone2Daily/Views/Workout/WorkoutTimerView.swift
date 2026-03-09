// File: Views/Workout/WorkoutTimerView.swift
// F-003: Manual workout logging with Zone 2 timer
// Stub for US-006a — full implementation in US-006c

import SwiftUI
import SwiftData

struct WorkoutTimerView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]
    @State private var viewModel = WorkoutViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                if let profile = profiles.first {
                    VStack(spacing: 8) {
                        Text("Target Zone 2 HR")
                            .font(.headline)
                        Text("\(Zone2Calculator.zone2MinHR(age: profile.age))–\(Zone2Calculator.zone2MaxHR(age: profile.age)) bpm")
                            .font(.largeTitle.bold())
                            .foregroundStyle(.brandPrimary)
                            .accessibilityIdentifier("workout_zone2_range")
                    }
                }

                timerDisplay

                controlButtons
            }
            .padding()
            .navigationTitle("Workout")
        }
        .accessibilityIdentifier("screen_workout")
        .onDisappear { viewModel.stopTimer() }
    }

    private var timerDisplay: some View {
        Text(viewModel.formattedTime)
            .font(.system(size: 60, weight: .bold, design: .monospaced))
            .accessibilityIdentifier("workout_timer_display")
    }

    private var controlButtons: some View {
        HStack(spacing: 24) {
            if viewModel.isRunning {
                Button("Stop") {
                    if let profile = profiles.first {
                        viewModel.stopAndSave(modelContext: modelContext, age: profile.age)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.brandDanger)
                .accessibilityIdentifier("btn_stop_workout")
            } else {
                Button("Start Zone 2") {
                    viewModel.startTimer()
                }
                .buttonStyle(.borderedProminent)
                .tint(.brandPrimary)
                .accessibilityIdentifier("btn_start_workout")
            }
        }
    }
}
