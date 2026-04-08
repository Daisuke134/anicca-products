import SwiftUI

struct AppDemoStepView: View {
    let next: () -> Void
    @EnvironmentObject var appState: AppState
    @State private var showCard = false
    @State private var tappedAction = false

    private var primaryStruggle: ProblemType {
        let struggles = appState.userProfile.struggles
        guard let first = struggles.first,
              let problem = ProblemType(rawValue: first) else {
            return .anxiety
        }
        return problem
    }

    var body: some View {
        VStack(spacing: 24) {
            Text("onboarding_demo_title")
                .font(.title2.weight(.bold))
                .multilineTextAlignment(.center)

            if showCard {
                let content = NudgeContent.contentForToday(for: primaryStruggle)
                NudgeCardContent(
                    icon: primaryStruggle.icon,
                    title: primaryStruggle.notificationTitle,
                    hookText: content.notificationText,
                    detailText: content.detailText,
                    isAIGenerated: false
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))

                if !tappedAction {
                    HStack(spacing: 16) {
                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                            withAnimation(.spring()) { tappedAction = true }
                        } label: {
                            Label("onboarding_demo_action_heart", systemImage: "heart.fill")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                        }

                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .light)
                            impact.impactOccurred()
                            withAnimation(.spring()) { tappedAction = true }
                        } label: {
                            Label("onboarding_demo_action_more", systemImage: "text.bubble")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                        }
                    }
                    .transition(.opacity)
                }

                if tappedAction {
                    Text("onboarding_demo_footer")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .transition(.opacity)
                }
            }

            Spacer()

            if tappedAction {
                Button(action: next) {
                    Text("onboarding_demo_cta")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .transition(.move(edge: .bottom))
            }
        }
        .padding()
        .onAppear {
            withAnimation(.spring(response: 0.6).delay(0.3)) {
                showCard = true
            }
        }
    }
}
