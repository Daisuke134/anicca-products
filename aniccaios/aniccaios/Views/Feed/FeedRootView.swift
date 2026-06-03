import SwiftUI
import Combine
import UIKit

/// Anicca app root: full-bleed vertical paging feed.
/// Background = single theme image shared across ALL quotes. Swiping changes the quote text only.
/// Top chrome (hamburger + settings) is locked in place, never moves on swipe.
struct FeedRootView: View {
    @StateObject private var themeStore = ThemeStore()
    @StateObject private var likedStore = LikedQuotesStore()
    @ObservedObject private var appState = AppState.shared
    @Environment(\.openURL) private var openURL
    @State private var quotes: [Quote] = []
    @State private var currentIndex: Int = 0
    @State private var showSettings = false

    /// v1.9.1: Apple のお支払い更新ページ。 RC managementURL 優先、 fallback で Apple billing center。
    private var managePaymentURL: URL {
        appState.subscriptionInfo.managementURL
            ?? URL(string: "https://apps.apple.com/account/billing")!
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .top) {
                // SHARED background (does NOT change across swipes).
                themeStore.image
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height + geo.safeAreaInsets.top + geo.safeAreaInsets.bottom)
                    .ignoresSafeArea()
                    .accessibilityHidden(true)

                // Vertical paging — each page is forced to screen width.
                VerticalPager(count: quotes.count, currentIndex: $currentIndex) { idx in
                    QuoteCardView(quote: quotes[idx], pageWidth: geo.size.width)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .environmentObject(themeStore)
                        .environmentObject(likedStore)
                }
                .frame(width: geo.size.width, height: geo.size.height)
                .accessibilityIdentifier("feed-scroll")

                // Top chrome — single settings button pinned top-right.
                HStack {
                    Spacer()
                    chromeButton(systemName: "slider.horizontal.3", identifier: "feed-settings") {
                        showSettings = true
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .zIndex(10)

                // v1.9.1: Billing-issue recovery banner (involuntary churn 回収).
                // Apple がカード課金に失敗 (grace/billing retry) している時に表示、 タップで支払い管理ページへ。
                if appState.subscriptionInfo.hasBillingIssue {
                    billingIssueBanner
                        .padding(.horizontal, 16)
                        .padding(.top, 56)
                        .zIndex(11)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .environmentObject(themeStore)
        .environmentObject(likedStore)
        .onAppear {
            if quotes.isEmpty {
                quotes = QuoteProvider.shared.all()
            }
            // v1.9.1 cold-launch path: consume any quoteId queued by AppDelegate.didReceive
            // (notification tap landed before .onReceive subscribed in cold-launch flow)
            if let qid = appState.consumePendingQuoteId(),
               let idx = quotes.firstIndex(where: { $0.id == qid }) {
                withAnimation { currentIndex = idx }
            }
        }
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

    /// v1.9.1: Involuntary churn 回収バナー (Apple "Reducing Involuntary Subscriber Churn" 推奨)
    private var billingIssueBanner: some View {
        Button {
            openURL(managePaymentURL)
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(localized: "billing_issue_title"))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                    Text(String(localized: "billing_issue_action"))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color(red: 0.78, green: 0.27, blue: 0.20))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(.white.opacity(0.18), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.3), radius: 8, y: 2)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("billing-issue-banner")
    }

    @ViewBuilder
    private func chromeButton(systemName: String, identifier: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(.black.opacity(0.45))
                )
                .overlay(
                    Circle()
                        .stroke(.white.opacity(0.25), lineWidth: 0.5)
                )
                .contentShape(Circle())
                .shadow(color: .black.opacity(0.4), radius: 8, y: 2)
        }
        .accessibilityIdentifier(identifier)
    }
}

extension Notification.Name {
    /// Posted when a notification is tapped or `anicca://quote/<id>` is opened.
    /// userInfo: ["quoteId": "qNNN"]
    static let aniccaScrollToQuote = Notification.Name("AniccaScrollToQuote")
}
