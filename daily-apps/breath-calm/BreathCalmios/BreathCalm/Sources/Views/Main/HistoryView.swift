import SwiftUI

struct HistoryView: View {
    @StateObject private var sessionStore = SessionStore.shared

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    HStack {
                        Text(NSLocalizedString("history.title", comment: ""))
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(Color.bcText)
                        Spacer()
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)

                    // Stats
                    HStack(spacing: 16) {
                        StatCard(
                            icon: "flame.fill",
                            value: "\(sessionStore.currentStreak())",
                            label: NSLocalizedString("home.streak", comment: ""),
                            color: Color.bcAccentSecondary
                        )
                        StatCard(
                            icon: "arrow.up.circle.fill",
                            value: String(format: "+%.1f", sessionStore.averageImprovement()),
                            label: "avg mood",
                            color: Color.bcAccent
                        )
                    }
                    .padding(.horizontal, 24)

                    // Sessions
                    if sessionStore.sessions.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "wind")
                                .font(.system(size: 48))
                                .foregroundColor(Color.bcTextSecondary)
                            Text(NSLocalizedString("history.empty", comment: ""))
                                .font(.system(size: 16))
                                .multilineTextAlignment(.center)
                                .foregroundColor(Color.bcTextSecondary)
                        }
                        .padding(.top, 60)
                    } else {
                        VStack(spacing: 12) {
                            ForEach(sessionStore.sessions.reversed()) { session in
                                SessionHistoryRow(session: session)
                            }
                        }
                        .padding(.horizontal, 24)
                    }

                    Spacer().frame(height: 20)
                }
            }
        }
    }
}

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(Color.bcText)
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(Color.bcTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(Color.bcCard)
        .cornerRadius(16)
    }
}

struct SessionHistoryRow: View {
    let session: BreathSession

    private var dateString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: session.date)
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: session.sessionType.symbolName)
                .font(.system(size: 20))
                .foregroundColor(Color.bcAccent)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(session.sessionType.localizedName)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(Color.bcText)
                Text(dateString)
                    .font(.system(size: 12))
                    .foregroundColor(Color.bcTextSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(session.moodBefore) → \(session.moodAfter)")
                    .font(.system(size: 13))
                    .foregroundColor(Color.bcTextSecondary)
                if session.improvement > 0 {
                    Text("+\(session.improvement)")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Color.bcAccentSecondary)
                }
            }
        }
        .padding(16)
        .background(Color.bcCard)
        .cornerRadius(12)
    }
}
