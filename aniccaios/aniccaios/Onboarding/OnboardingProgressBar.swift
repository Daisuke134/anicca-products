import SwiftUI

/// Progress bar for onboarding flow with Endowed Progress Effect (starts at 20%).
/// Hidden during paywall steps.
struct OnboardingProgressBar: View {
    let step: OnboardingStep

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(AppTheme.Colors.label.opacity(0.1))
                    .frame(height: 4)

                Rectangle()
                    .fill(AppTheme.Colors.accent)
                    .frame(
                        width: geometry.size.width * Self.progress(for: step),
                        height: 4
                    )
                    .animation(.easeInOut(duration: 0.4), value: step)
            }
        }
        .frame(height: 4)
    }

    /// Calculate progress with Endowed Progress Effect: starts at 20%.
    /// Formula: 0.2 + 0.8 * (step.rawValue / (totalSteps - 1))
    static func progress(for step: OnboardingStep) -> Double {
        let totalSteps = Double(OnboardingStep.allCases.count - 1)
        guard totalSteps > 0 else { return 1.0 }
        return 0.2 + 0.8 * (Double(step.rawValue) / totalSteps)
    }
}
