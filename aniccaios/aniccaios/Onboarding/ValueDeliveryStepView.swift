import SwiftUI

struct ValueDeliveryStepView: View {
    let next: () -> Void
    @EnvironmentObject var appState: AppState
    @State private var showShareSheet = false

    private var primaryStruggle: ProblemType {
        let struggles = appState.userProfile.struggles
        guard let first = struggles.first,
              let problem = ProblemType(rawValue: first) else {
            return .anxiety
        }
        return problem
    }

    private var nudgeContent: NudgeContent {
        NudgeContent.contentForToday(for: primaryStruggle)
    }

    var body: some View {
        VStack(spacing: 24) {
            Text("onboarding_value_delivery_title")
                .font(.title2.weight(.bold))
                .multilineTextAlignment(.center)

            Text("onboarding_value_delivery_subtitle")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            ShareableNudgeCard(
                text: nudgeContent.notificationText,
                problemType: primaryStruggle
            )
            .padding()

            Spacer()

            Button {
                showShareSheet = true
            } label: {
                Label("onboarding_value_delivery_share", systemImage: "square.and.arrow.up")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }

            Button(action: next) {
                Text("onboarding_value_delivery_cta")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
        .padding()
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [renderShareImage()])
        }
    }

    private func renderShareImage() -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 1080, height: 1080))
        return renderer.image { ctx in
            UIColor(named: "AccentColor")?.withAlphaComponent(0.1).setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: 1080, height: 1080))

            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 48, weight: .bold),
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ]
            let text = nudgeContent.notificationText
            let textRect = CGRect(x: 80, y: 340, width: 920, height: 400)
            (text as NSString).draw(in: textRect, withAttributes: attrs)

            let wmAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 28, weight: .medium),
                .foregroundColor: UIColor.secondaryLabel,
                .paragraphStyle: paragraphStyle
            ]
            ("— Anicca 🪷" as NSString).draw(
                in: CGRect(x: 0, y: 940, width: 1080, height: 60),
                withAttributes: wmAttrs
            )
        }
    }
}

struct ShareableNudgeCard: View {
    let text: String
    let problemType: ProblemType

    var body: some View {
        VStack(spacing: 16) {
            Text(problemType.icon)
                .font(.system(size: 40))

            Text(text)
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            Text("— Anicca 🪷")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
