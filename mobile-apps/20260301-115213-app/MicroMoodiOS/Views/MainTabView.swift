import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Today", systemImage: "house.fill")
                }
                .tag(0)
                .accessibilityIdentifier("tab_home")

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "calendar")
                }
                .tag(1)
                .accessibilityIdentifier("tab_history")

            InsightsView()
                .tabItem {
                    Label("Insights", systemImage: "chart.bar.fill")
                }
                .tag(2)
                .accessibilityIdentifier("tab_insights")

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(3)
                .accessibilityIdentifier("tab_settings")
        }
        .tint(Color("AccentColor"))
        .preferredColorScheme(.dark)
    }
}
