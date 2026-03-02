import SwiftUI

struct ContentView: View {
    @State private var hasCompletedOnboarding: Bool = UserDefaults.standard.bool(forKey: "onboarding_complete")

    var body: some View {
        if hasCompletedOnboarding {
            MainTabView()
        } else {
            OnboardingView(hasCompletedOnboarding: Binding(
                get: { hasCompletedOnboarding },
                set: { newValue in
                    hasCompletedOnboarding = newValue
                    UserDefaults.standard.set(newValue, forKey: "onboarding_complete")
                }
            ))
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationView { HomeView() }
                .tabItem {
                    Label("Tonight", systemImage: "moon.stars.fill")
                }

            NavigationView { RitualBuilderView() }
                .tabItem {
                    Label("Ritual", systemImage: "list.bullet")
                }

            NavigationView { SettingsView() }
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
        .accentColor(Color(red: 0.5, green: 0.4, blue: 1.0))
    }
}
