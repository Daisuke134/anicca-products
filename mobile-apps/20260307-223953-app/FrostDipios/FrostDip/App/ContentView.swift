import SwiftUI

struct ContentView: View {
    @AppStorage("has_completed_onboarding") private var hasCompletedOnboarding = false

    var body: some View {
        if hasCompletedOnboarding {
            MainTabView()
        } else {
            OnboardingContainerView(onComplete: {
                hasCompletedOnboarding = true
            })
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Text("Timer")
                .tabItem {
                    Label("Timer", systemImage: "timer")
                }
                .tag(0)
                .accessibilityIdentifier(AccessibilityID.timerView)

            Text("History")
                .tabItem {
                    Label("History", systemImage: "clock.arrow.circlepath")
                }
                .tag(1)
                .accessibilityIdentifier(AccessibilityID.historyView)

            Text("Progress")
                .tabItem {
                    Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(2)
                .accessibilityIdentifier(AccessibilityID.progressView)

            Text("Settings")
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
                .tag(3)
                .accessibilityIdentifier(AccessibilityID.settingsView)
        }
    }
}
