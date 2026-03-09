// File: Views/Settings/SettingsView.swift
// F-007: Settings with Upgrade → PaywallView navigation
// Stub for US-006a — full implementation in US-006d

import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]
    @Environment(SubscriptionService.self) private var subscriptionService
    @State private var showPaywall = false

    var body: some View {
        NavigationStack {
            Form {
                if let profile = profiles.first {
                    Section("Profile") {
                        Stepper("Age: \(profile.age)", value: Bindable(profile).age, in: 10...100)
                            .accessibilityIdentifier("input_age_settings")
                        Stepper("Weekly Goal: \(profile.weeklyGoalMinutes) min",
                                value: Bindable(profile).weeklyGoalMinutes, in: 30...600, step: 30)
                            .accessibilityIdentifier("settings_weekly_goal_stepper")
                    }
                }
                if !subscriptionService.isPremium {
                    Section {
                        Button("Upgrade to Premium") { showPaywall = true }
                            .accessibilityIdentifier("btn_upgrade")
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showPaywall) {
                PaywallView(subscriptionService: subscriptionService)
            }
        }
        .accessibilityIdentifier("screen_settings")
    }
}
