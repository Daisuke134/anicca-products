import SwiftUI

struct ProcessingStepView: View {
    let next: () -> Void
    @State private var progress: CGFloat = 0
    @State private var showText = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            ProgressView()
                .scaleEffect(1.5)
                .tint(.accentColor)

            if showText {
                Text("onboarding_processing_title")
                    .font(.title2.weight(.semibold))
                    .multilineTextAlignment(.center)
                    .transition(.opacity)
            }

            Spacer()
        }
        .padding()
        .onAppear {
            withAnimation(.easeIn(duration: 0.5).delay(0.3)) {
                showText = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                next()
            }
        }
    }
}
