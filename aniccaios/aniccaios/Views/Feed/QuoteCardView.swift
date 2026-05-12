import SwiftUI
import Combine
import UIKit

/// One full-screen quote card. NO background here — owned by `FeedRootView`.
/// Body: large quote text centered. Bottom-left: ⤴ (share) + ♡ (like). Nothing else.
/// 1:1 clone of i.am app / mantra.app main screen pattern.
struct QuoteCardView: View {
    let quote: Quote

    @EnvironmentObject var themeStore: ThemeStore
    @EnvironmentObject var likedStore: LikedQuotesStore

    @State private var showShareSheet = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Body — centered, large
            VStack {
                Spacer()
                Text(quote.text)
                    .font(.system(size: textSize, weight: .regular))
                    .foregroundStyle(.white.opacity(0.95))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 1)
                    .accessibilityIdentifier("quote-text")
                Spacer()
            }

            // Action rail (bottom-left)
            HStack(spacing: 24) {
                Button {
                    showShareSheet = true
                } label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .accessibilityIdentifier("quote-share")

                Button {
                    likedStore.toggle(quote.id)
                    UIImpactFeedbackGenerator(style: .soft).impactOccurred()
                } label: {
                    Image(systemName: likedStore.isLiked(quote.id) ? "heart.fill" : "heart")
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .accessibilityIdentifier("quote-like")
            }
            .padding(.leading, 24)
            .padding(.bottom, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [
                ShareImageRenderer.render(
                    quote: quote,
                    background: themeStore.selected
                ),
                "aniccaai.com"
            ])
        }
    }

    private var textSize: CGFloat {
        // Shrink for very long quotes so they always fit one screen.
        switch quote.text.count {
        case ...40: return 36
        case 41...80: return 30
        case 81...120: return 26
        default: return 22
        }
    }
}

/// UIActivityViewController wrapper.
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
