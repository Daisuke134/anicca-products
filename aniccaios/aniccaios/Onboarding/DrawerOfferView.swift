import SwiftUI
import RevenueCat

/// Phase 5: CONVERT — Drawer that slides up on x press, reframes weekly price.
struct DrawerOfferView: View {
    let weeklyPrice: String
    let onStartTrial: () -> Void
    let onSkip: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            // Drag indicator
            RoundedRectangle(cornerRadius: 2.5)
                .fill(Color.gray.opacity(0.4))
                .frame(width: 36, height: 5)
                .padding(.top, 8)

            Text(String(localized: "paywall_drawer_title"))
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)
                .multilineTextAlignment(.center)

            Text(String(format: NSLocalizedString("paywall_drawer_subtitle", comment: ""), weeklyPrice))
                .font(.system(size: 16))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)

            Button {
                AnalyticsManager.shared.track(.paywallDrawerConverted)
                onStartTrial()
            } label: {
                Text(String(localized: "paywall_drawer_cta"))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .accessibilityIdentifier("paywall-drawer-cta")
            .padding(.horizontal, 24)

            Button(String(localized: "paywall_drawer_skip")) {
                onSkip()
            }
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(.secondary)
            .accessibilityIdentifier("paywall-drawer-skip")
            .padding(.bottom, 16)
        }
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(AppTheme.Colors.cardBackground)
                .shadow(color: .black.opacity(0.15), radius: 20, y: -5)
        )
        .onAppear {
            AnalyticsManager.shared.track(.paywallDrawerViewed)
        }
    }
}
