// File: Views/Workout/WorkoutLogView.swift
// SCR-008: Post-workout log entry
// F-003: Zone 2 manual workout logging

import SwiftUI
import SwiftData

struct WorkoutLogView: View {
    let session: WorkoutSession
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                summaryCard

                Text("Workout saved!")
                    .font(.title2.bold())
                    .accessibilityIdentifier("label_workout_saved")

                Button("Done") { dismiss() }
                    .buttonStyle(.borderedProminent)
                    .tint(.brandPrimary)
                    .accessibilityIdentifier("btn_save_workout")
            }
            .padding()
            .navigationTitle("Workout Summary")
            .navigationBarTitleDisplayMode(.inline)
        }
        .accessibilityIdentifier("screen_workout_log")
    }

    private var summaryCard: some View {
        VStack(spacing: 16) {
            HStack {
                statItem(
                    label: "Duration",
                    value: formatDuration(session.durationSeconds),
                    id: "log_duration"
                )
                Divider()
                statItem(
                    label: "Zone 2",
                    value: String(format: "%.0f min", session.zone2Minutes),
                    id: "log_zone2_minutes"
                )
                Divider()
                statItem(
                    label: "Zone 2 %",
                    value: String(format: "%.0f%%", session.zone2Percentage),
                    id: "log_zone2_percent"
                )
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(.surfaceCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func statItem(label: String, value: String, id: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .accessibilityIdentifier(id)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
