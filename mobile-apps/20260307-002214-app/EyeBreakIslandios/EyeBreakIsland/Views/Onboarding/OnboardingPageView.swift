import SwiftUI

struct OnboardingPageView: View {
    let page: OnboardingPageData
    let pageIndex: Int

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: page.iconName)
                .font(.system(size: 80))
                .foregroundStyle(Color.accentColor)

            Text(LocalizedStringKey(page.titleKey))
                .font(.title.bold())
                .multilineTextAlignment(.center)

            Text(LocalizedStringKey(page.subtitleKey))
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
        }
        .accessibilityIdentifier(accessibilityID(for: pageIndex))
    }

    private func accessibilityID(for index: Int) -> String {
        switch index {
        case 0: return AccessibilityID.onboardingPage1
        case 1: return AccessibilityID.onboardingPage2
        case 2: return AccessibilityID.onboardingPage3
        default: return ""
        }
    }
}
