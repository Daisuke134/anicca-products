import SwiftUI

struct MoodScoreView: View {
    let title: String
    let subtitle: String
    @Binding var score: Int
    let ctaTitle: String
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 40) {
            Spacer()

            VStack(spacing: 16) {
                Text(title)
                    .font(.system(size: 26, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color.bcText)

                Text(subtitle)
                    .font(.system(size: 16))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color.bcTextSecondary)
                    .padding(.horizontal, 32)
            }

            VStack(spacing: 20) {
                Text("\(score)")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundColor(moodColor)

                Slider(value: Binding(
                    get: { Double(score) },
                    set: { score = Int($0) }
                ), in: 0...10, step: 1)
                .tint(moodColor)
                .padding(.horizontal, 32)

                HStack {
                    Text("😌 Calm")
                        .font(.system(size: 13))
                        .foregroundColor(Color.bcTextSecondary)
                    Spacer()
                    Text("😰 Overwhelmed")
                        .font(.system(size: 13))
                        .foregroundColor(Color.bcTextSecondary)
                }
                .padding(.horizontal, 32)
            }

            Spacer()

            Button(action: onContinue) {
                Text(ctaTitle)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(Color.bcAccent)
                    .cornerRadius(16)
            }
            .padding(.horizontal, 32)

            Spacer().frame(height: 20)
        }
    }

    private var moodColor: Color {
        if score <= 3 { return Color.bcAccentSecondary }
        if score <= 6 { return Color.bcAccent }
        return Color.bcSOS
    }
}
