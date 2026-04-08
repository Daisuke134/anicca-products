import SwiftUI

struct ProcessingStepView: View {
    let next: () -> Void
    @EnvironmentObject var appState: AppState

    @State private var progress: CGFloat = 0
    @State private var stepIndex = 0

    private let steps = [
        "onboarding_processing_step1",
        "onboarding_processing_step2",
        "onboarding_processing_step3"
    ]

    private var struggles: [String] {
        appState.userProfile.struggles.prefix(5).compactMap {
            ProblemType(rawValue: $0)?.displayName
        }
    }

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Big percentage
            Text("\(Int(progress * 100))%")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(AppTheme.Colors.label)

            // Title
            Text("onboarding_processing_title")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            // Horizontal progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.Colors.accent.opacity(0.15))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.Colors.accent)
                        .frame(width: geo.size.width * progress, height: 8)
                }
            }
            .frame(height: 8)
            .padding(.horizontal, 40)

            // Step text
            Text(String(localized: String.LocalizationValue(steps[stepIndex])))
                .font(.system(size: 16))
                .foregroundStyle(.secondary)

            // Struggles card
            if !struggles.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("onboarding_processing_struggles_header")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.label)

                    ForEach(struggles, id: \.self) { name in
                        HStack(spacing: 8) {
                            Circle()
                                .fill(AppTheme.Colors.accent)
                                .frame(width: 6, height: 6)
                            Text(name)
                                .font(.system(size: 14))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(AppTheme.Colors.buttonUnselected)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 32)
            }

            Spacer()
        }
        .background(AppBackground())
        .onAppear {
            withAnimation(.easeInOut(duration: 2.5)) { progress = 1.0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { withAnimation { stepIndex = 1 } }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { withAnimation { stepIndex = 2 } }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.7) { next() }
        }
    }
}
