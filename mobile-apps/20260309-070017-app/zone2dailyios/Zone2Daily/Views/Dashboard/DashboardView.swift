// File: Views/Dashboard/DashboardView.swift
// F-004: Weekly Zone 2 progress dashboard

import SwiftUI
import SwiftData

struct DashboardView: View {
    @Query private var sessions: [WorkoutSession]
    @Query private var profiles: [UserProfile]
    @Environment(SubscriptionService.self) private var subscriptionService
    @State private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    weeklyProgressSection
                    recentSessionsSection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .onAppear { viewModel.loadWeeklyData(sessions: sessions) }
            .onChange(of: sessions.count) { viewModel.loadWeeklyData(sessions: sessions) }
        }
        .accessibilityIdentifier("screen_dashboard")
    }

    private var weeklyProgressSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly Zone 2 Goal")
                .font(.headline)
                .accessibilityIdentifier("dashboard_weekly_goal_label")

            ProgressView(value: viewModel.progressFraction)
                .tint(.brandPrimary)
                .accessibilityIdentifier("dashboard_progress_bar")

            HStack {
                Text("\(Int(viewModel.weeklyZone2Minutes)) min")
                    .font(.title2.bold())
                Spacer()
                Text("/ \(viewModel.weeklyGoalMinutes) min")
                    .foregroundStyle(.secondary)
            }
            .accessibilityIdentifier("dashboard_weekly_minutes")

            Text("🔥 \(viewModel.streak) day streak")
                .font(.subheadline)
                .accessibilityIdentifier("dashboard_streak")
        }
        .padding()
        .background(.surfaceCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var recentSessionsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)
            ForEach(sessions.sorted { $0.date > $1.date }.prefix(5)) { session in
                SessionRowView(session: session)
            }
        }
    }
}

struct SessionRowView: View {
    let session: WorkoutSession

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(session.date, style: .date)
                    .font(.subheadline)
                Text("\(Int(session.zone2Minutes)) min Zone 2")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(String(format: "%.0f%%", session.zone2Percentage))
                .font(.subheadline.bold())
                .foregroundStyle(session.zone2Percentage > 60 ? .brandSuccess : .brandWarning)
        }
        .padding(.vertical, 4)
    }
}
