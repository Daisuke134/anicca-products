import SwiftUI

struct HomeView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @StateObject private var sessionStore = SessionStore.shared
    @State private var selectedSession: SessionType?
    @State private var showPaywall = false
    @State private var showSOSSession = false

    private let sessions: [SessionType] = [.breathing478, .box, .coherent, .sos, .walking]

    var body: some View {
        ZStack {
            Color.bcBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(NSLocalizedString("home.title", comment: ""))
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(Color.bcText)
                            Text("\(sessionStore.currentStreak()) \(NSLocalizedString("home.streak", comment: ""))")
                                .font(.system(size: 15))
                                .foregroundColor(Color.bcAccentSecondary)
                        }
                        Spacer()
                        Text("🔥 \(sessionStore.currentStreak())")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(Color.bcAccentSecondary)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)

                    // SOS Button
                    Button(action: {
                        if subscriptionManager.isPro {
                            showSOSSession = true
                        } else {
                            showPaywall = true
                        }
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 24))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(NSLocalizedString("home.sos.button", comment: ""))
                                    .font(.system(size: 18, weight: .bold))
                                Text(NSLocalizedString("home.sos.hint", comment: ""))
                                    .font(.system(size: 13))
                                    .opacity(0.8)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .foregroundColor(.white)
                        .padding(20)
                        .background(Color.bcSOS)
                        .cornerRadius(20)
                        .padding(.horizontal, 24)
                    }
                    .accessibilityIdentifier("home-sos-button")

                    // Session List
                    VStack(alignment: .leading, spacing: 16) {
                        Text(NSLocalizedString("home.sessions.title", comment: ""))
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color.bcText)
                            .padding(.horizontal, 24)

                        ForEach(sessions) { session in
                            if session != .sos {
                                SessionCard(
                                    session: session,
                                    isPro: subscriptionManager.isPro,
                                    canStartFree: subscriptionManager.canStartFreeSession,
                                    onTap: {
                                        if session.requiresPro && !subscriptionManager.isPro {
                                            showPaywall = true
                                        } else if !session.requiresPro && !subscriptionManager.canStartFreeSession && !subscriptionManager.isPro {
                                            showPaywall = true
                                        } else {
                                            selectedSession = session
                                        }
                                    }
                                )
                                .padding(.horizontal, 24)
                            }
                        }
                    }

                    Spacer().frame(height: 20)
                }
            }
        }
        .sheet(item: $selectedSession) { session in
            SessionView(sessionType: session)
                .environmentObject(subscriptionManager)
        }
        .sheet(isPresented: $showSOSSession) {
            SessionView(sessionType: .sos)
                .environmentObject(subscriptionManager)
        }
        .sheet(isPresented: $showPaywall) {
            PaywallView(isPresented: $showPaywall)
                .environmentObject(subscriptionManager)
        }
    }
}

struct SessionCard: View {
    let session: SessionType
    let isPro: Bool
    let canStartFree: Bool
    let onTap: () -> Void

    var locked: Bool {
        session.requiresPro && !isPro
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(locked ? Color.bcCard : Color.bcAccent.opacity(0.2))
                        .frame(width: 50, height: 50)
                    Image(systemName: session.symbolName)
                        .font(.system(size: 22))
                        .foregroundColor(locked ? Color.bcTextSecondary : Color.bcAccent)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(session.localizedName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(locked ? Color.bcTextSecondary : Color.bcText)
                    Text(session.localizedDescription)
                        .font(.system(size: 13))
                        .foregroundColor(Color.bcTextSecondary)
                }

                Spacer()

                if locked {
                    Text(NSLocalizedString("home.locked", comment: ""))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color.bcAccent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.bcAccent, lineWidth: 1)
                        )
                }
            }
            .padding(16)
            .background(Color.bcCard)
            .cornerRadius(16)
        }
    }
}
