import SwiftUI
import Combine
import UIKit

/// Anicca app root: full-bleed vertical paging feed.
/// Background = single theme image shared across ALL 100 quotes. Swiping changes the quote text only.
/// User changes the background via Settings sheet (pull-down) → Theme picker.
/// 1:1 clone of i.am app / mantra.app pattern.
struct FeedRootView: View {
    @StateObject private var themeStore = ThemeStore()
    @StateObject private var likedStore = LikedQuotesStore()
    @State private var quotes: [Quote] = []
    @State private var currentIndex: Int = 0
    @State private var showSettings = false

    var body: some View {
        ZStack {
            // SHARED background (does NOT change across swipes).
            themeStore.image
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
                .accessibilityHidden(true)

            // Vertical paging via TabView (.page) + 90° rotation hack (works on iOS 15+).
            GeometryReader { geo in
                TabView(selection: $currentIndex) {
                    ForEach(quotes.indices, id: \.self) { idx in
                        QuoteCardView(quote: quotes[idx])
                            .rotationEffect(.degrees(-90))
                            .frame(width: geo.size.height, height: geo.size.width)
                            .tag(idx)
                    }
                }
                .frame(width: geo.size.height, height: geo.size.width)
                .rotationEffect(.degrees(90), anchor: .topLeading)
                .offset(x: geo.size.width)
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .ignoresSafeArea()
            .accessibilityIdentifier("feed-scroll")
        }
        .environmentObject(themeStore)
        .environmentObject(likedStore)
        .onAppear {
            if quotes.isEmpty {
                quotes = QuoteProvider.shared.all()
            }
        }
        // Pull-down from top opens Settings.
        .simultaneousGesture(
            DragGesture(minimumDistance: 40, coordinateSpace: .global)
                .onEnded { g in
                    if g.startLocation.y < 80 && g.translation.height > 120 {
                        showSettings = true
                    }
                }
        )
        .sheet(isPresented: $showSettings) {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    SettingsSheet()
                        .environmentObject(themeStore)
                        .environmentObject(likedStore)
                }
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
            } else {
                NavigationView {
                    SettingsSheet()
                        .environmentObject(themeStore)
                        .environmentObject(likedStore)
                }
                .navigationViewStyle(.stack)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .aniccaScrollToQuote)) { note in
            guard let qid = note.userInfo?["quoteId"] as? String else { return }
            if let idx = quotes.firstIndex(where: { $0.id == qid }) {
                withAnimation { currentIndex = idx }
            }
        }
    }
}

extension Notification.Name {
    /// Posted when a notification is tapped or `anicca://quote/<id>` is opened.
    /// userInfo: ["quoteId": "qNNN"]
    static let aniccaScrollToQuote = Notification.Name("AniccaScrollToQuote")
}
