import SwiftUI
import RevenueCatUI
import Mixpanel

struct InsightsView: View {
    @StateObject private var viewModel = InsightsViewModel()
    @EnvironmentObject private var subscriptionManager: SubscriptionManager
    @State private var showingPaywall = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color("BackgroundColor").ignoresSafeArea()

                if !subscriptionManager.isPro {
                    proTeaser
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            weeklyInsightCard
                            moodDistributionCard
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                    }
                }
            }
            .navigationTitle("Insights")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingPaywall) {
            if let offering = subscriptionManager.currentOffering {
                PaywallView(offering: offering)
                    .onPurchaseCompleted { _ in showingPaywall = false }
                    .onRestoreCompleted { _ in showingPaywall = false }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            if !subscriptionManager.isPro, let offering = subscriptionManager.currentOffering {
                Mixpanel.mainInstance().track(event: "paywall_viewed", properties: [
                    "offering_id": offering.identifier,
                    "source": "insights"
                ])
            }
        }
    }

    private var proTeaser: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("📊")
                .font(.system(size: 80))
            Text("Weekly AI Insights")
                .font(.title2.bold())
                .foregroundColor(.white)
            Text("See patterns in your mood data.\nDiscover what helps and what doesn't.")
                .font(.body)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            Button(action: { showingPaywall = true }) {
                Text("Unlock with Pro")
                    .font(.headline)
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color("AccentColor"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 32)
            .accessibilityIdentifier("insights_unlock_button")
            Spacer()
        }
        .padding()
    }

    private var weeklyInsightCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Weekly Insight", systemImage: "lightbulb.fill")
                .font(.subheadline.bold())
                .foregroundColor(Color("AccentColor"))

            Text(viewModel.weeklyInsight)
                .font(.body)
                .foregroundColor(.white)
                .lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .accessibilityIdentifier("weekly_insight_card")
    }

    private var moodDistributionCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("30-Day Mood Distribution")
                .font(.subheadline.bold())
                .foregroundColor(.white)

            HStack(alignment: .bottom, spacing: 12) {
                ForEach(MoodLevel.allCases, id: \.self) { mood in
                    let count = viewModel.moodTrend.filter { $0.moodLevel == mood }.count
                    let maxCount = max(1, viewModel.moodTrend.count)
                    VStack(spacing: 6) {
                        Text("\(count)")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(hex: mood.colorHex))
                            .frame(height: max(4, CGFloat(count) / CGFloat(maxCount) * 80))
                        Text(mood.emoji)
                            .font(.caption)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(20)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
