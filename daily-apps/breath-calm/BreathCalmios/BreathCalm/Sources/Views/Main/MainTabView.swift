import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager

    var body: some View {
        TabView {
            HomeView()
                .environmentObject(subscriptionManager)
                .tabItem {
                    Label(NSLocalizedString("home.title", comment: ""), systemImage: "house.fill")
                }

            HistoryView()
                .tabItem {
                    Label(NSLocalizedString("history.title", comment: ""), systemImage: "chart.bar.fill")
                }

            SettingsView()
                .environmentObject(subscriptionManager)
                .tabItem {
                    Label(NSLocalizedString("settings.title", comment: ""), systemImage: "gearshape.fill")
                }
        }
        .tint(Color.bcAccent)
        .onAppear {
            let tabBarAppearance = UITabBarAppearance()
            tabBarAppearance.configureWithOpaqueBackground()
            tabBarAppearance.backgroundColor = UIColor(Color.bcSurface)
            UITabBar.appearance().standardAppearance = tabBarAppearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
            }
        }
    }
}
