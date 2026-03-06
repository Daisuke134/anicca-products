import SwiftUI

struct ContentView: View {
    @AppStorage(Constants.hasCompletedOnboardingKey) private var hasCompletedOnboarding = false

    var body: some View {
        if hasCompletedOnboarding {
            Text("Timer View (US-006c)")
                .accessibilityIdentifier(AccessibilityID.timerView)
        } else {
            OnboardingView()
        }
    }
}
