import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @State private var showNotificationSettings = false

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
    }

    private var privacyURL: String {
        let lang = Locale.current.languageCode ?? "en"
        return lang == "ja"
            ? "https://aniccaai.com/breath-calm/privacy/ja"
            : "https://aniccaai.com/breath-calm/privacy/en"
    }

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Text(NSLocalizedString("settings.title", comment: ""))
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color.bcText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 24)
                        .padding(.top, 16)

                    VStack(spacing: 0) {
                        settingsRow(
                            icon: "bell.fill",
                            title: NSLocalizedString("settings.notifications", comment: ""),
                            action: { openSystemNotificationSettings() }
                        )
                        Divider().background(Color.bcCard)

                        settingsLinkRow(
                            icon: "lock.shield.fill",
                            title: NSLocalizedString("settings.privacy", comment: ""),
                            url: privacyURL
                        )
                        Divider().background(Color.bcCard)

                        settingsLinkRow(
                            icon: "doc.text.fill",
                            title: NSLocalizedString("settings.terms", comment: ""),
                            url: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                        )
                        Divider().background(Color.bcCard)

                        settingsRow(
                            icon: "arrow.clockwise",
                            title: NSLocalizedString("settings.restore", comment: ""),
                            action: { subscriptionManager.restore() }
                        )

                        if subscriptionManager.isPro {
                            Divider().background(Color.bcCard)
                            settingsRow(
                                icon: "creditcard.fill",
                                title: NSLocalizedString("settings.subscription", comment: ""),
                                action: { openSubscriptionManagement() }
                            )
                        }
                    }
                    .background(Color.bcCard)
                    .cornerRadius(16)
                    .padding(.horizontal, 24)

                    Text(String(format: NSLocalizedString("settings.version", comment: ""), appVersion))
                        .font(.system(size: 13))
                        .foregroundColor(Color.bcTextSecondary)

                    Spacer().frame(height: 20)
                }
            }
        }
    }

    private func settingsRow(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(Color.bcAccent)
                    .frame(width: 28)
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(Color.bcText)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13))
                    .foregroundColor(Color.bcTextSecondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }

    private func settingsLinkRow(icon: String, title: String, url: String) -> some View {
        settingsRow(icon: icon, title: title, action: {
            if let u = URL(string: url) {
                UIApplication.shared.open(u)
            }
        })
    }

    private func openSystemNotificationSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }

    private func openSubscriptionManagement() {
        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
            UIApplication.shared.open(url)
        }
    }
}
