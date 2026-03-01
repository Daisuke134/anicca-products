import SwiftUI
import RevenueCatUI
import Mixpanel

struct SettingsView: View {
    @EnvironmentObject private var subscriptionManager: SubscriptionManager
    @State private var showingPaywall = false
    @State private var showingRestoreAlert = false
    @State private var restoreMessage = ""
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = true

    var body: some View {
        NavigationStack {
            ZStack {
                Color("BackgroundColor").ignoresSafeArea()

                List {
                    subscriptionSection
                    dataSection
                    aboutSection
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingPaywall) {
            if let offering = subscriptionManager.currentOffering {
                PaywallView(offering: offering)
                    .onPurchaseCompleted { _ in showingPaywall = false }
                    .onRestoreCompleted { _ in showingPaywall = false }
            }
        }
        .alert("Restore Purchases", isPresented: $showingRestoreAlert) {
            Button("OK") {}
        } message: {
            Text(restoreMessage)
        }
        .preferredColorScheme(.dark)
    }

    private var subscriptionSection: some View {
        Section(header: Text("Subscription").foregroundColor(.white.opacity(0.6))) {
            if subscriptionManager.isPro {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color("AccentColor"))
                    Text("Micro Mood Pro")
                        .foregroundColor(.white)
                    Spacer()
                    Text("Active")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                .listRowBackground(Color.white.opacity(0.08))
            } else {
                Button(action: {
                    if let offering = subscriptionManager.currentOffering {
                        Mixpanel.mainInstance().track(event: "paywall_viewed", properties: [
                            "offering_id": offering.identifier,
                            "source": "settings"
                        ])
                    }
                    showingPaywall = true
                }) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(Color("AccentColor"))
                        Text("Upgrade to Pro")
                            .foregroundColor(Color("AccentColor"))
                        Spacer()
                        Text("$4.99/mo")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .listRowBackground(Color.white.opacity(0.08))
                .accessibilityIdentifier("settings_upgrade_button")
            }

            Button(action: restorePurchases) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.white.opacity(0.7))
                    Text("Restore Purchases")
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .listRowBackground(Color.white.opacity(0.05))
            .accessibilityIdentifier("restore_purchases_button")
        }
    }

    private var dataSection: some View {
        Section(header: Text("Data").foregroundColor(.white.opacity(0.6))) {
            HStack {
                Image(systemName: "lock.fill")
                    .foregroundColor(.white.opacity(0.7))
                Text("All data stored on device")
                    .foregroundColor(.white.opacity(0.7))
            }
            .listRowBackground(Color.white.opacity(0.05))
        }
    }

    private var aboutSection: some View {
        Section(header: Text("About").foregroundColor(.white.opacity(0.6))) {
            Link(destination: URL(string: "https://daisuke134.github.io/anicca-products/micromood/privacy.html")!) {
                HStack {
                    Text("Privacy Policy")
                        .foregroundColor(.white.opacity(0.7))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                }
            }
            .listRowBackground(Color.white.opacity(0.05))

            HStack {
                Text("Version")
                    .foregroundColor(.white.opacity(0.7))
                Spacer()
                Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
                    .foregroundColor(.white.opacity(0.4))
            }
            .listRowBackground(Color.white.opacity(0.05))
        }
    }

    private func restorePurchases() {
        Task {
            do {
                try await subscriptionManager.restorePurchases()
                restoreMessage = subscriptionManager.isPro
                    ? "Your Pro subscription has been restored."
                    : "No active subscription found."
            } catch {
                restoreMessage = "Restore failed. Please try again."
            }
            showingRestoreAlert = true
        }
    }
}
