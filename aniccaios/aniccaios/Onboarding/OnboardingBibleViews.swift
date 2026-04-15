import SwiftUI
import StoreKit
import RevenueCat

// MARK: - S2 Name

struct NameInputStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    @State private var name: String = ""
    @FocusState private var focused: Bool

    var body: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)
            Text("What should we call you?")
                .font(.system(size: 32, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            TextField("Your name", text: $name)
                .font(.system(size: 22, weight: .medium))
                .multilineTextAlignment(.center)
                .focused($focused)
                .padding()
                .background(AppTheme.Colors.buttonUnselected)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 24)

            Spacer()

            Button {
                var profile = appState.userProfile
                profile.displayName = name.trimmingCharacters(in: .whitespaces)
                appState.updateUserProfile(profile, sync: true)
                next()
            } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(name.trimmingCharacters(in: .whitespaces).isEmpty ? AppTheme.Colors.label.opacity(0.4) : AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
        .onAppear {
            name = appState.userProfile.displayName
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { focused = true }
        }
    }
}

// MARK: - S3 Age

struct AgeRangeStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    private let options = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"]
    private let labels = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"]

    var body: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 40)
            Text("How old are you?")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)

            VStack(spacing: 12) {
                ForEach(Array(options.enumerated()), id: \.offset) { idx, key in
                    Button {
                        var profile = appState.userProfile
                        profile.ageRange = key
                        appState.updateUserProfile(profile, sync: true)
                        next()
                    } label: {
                        Text(labels[idx])
                            .font(.system(size: 18, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.label)
                            .frame(maxWidth: .infinity).frame(height: 56)
                            .background(AppTheme.Colors.buttonUnselected)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)
            Spacer()
        }
        .background(AppBackground())
    }
}

// MARK: - S4 Goal

struct GoalStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    @State private var selected: String? = nil

    private let options: [(key: String, emoji: String, label: String)] = [
        ("break_habit", "🚫", "Break a bad habit"),
        ("build_discipline", "💪", "Build discipline"),
        ("reduce_anxiety", "🧘", "Reduce anxiety"),
        ("sleep_better", "😴", "Sleep better"),
        ("focus_more", "🎯", "Focus more"),
        ("feel_peace", "☮️", "Feel inner peace")
    ]

    var body: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 40)
            Text("What do you want to change?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            ScrollView {
                VStack(spacing: 12) {
                    ForEach(options, id: \.key) { opt in
                        Button {
                            selected = opt.key
                            var profile = appState.userProfile
                            profile.goals = [opt.key]
                            appState.updateUserProfile(profile, sync: true)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { next() }
                        } label: {
                            HStack {
                                Text(opt.emoji).font(.system(size: 24))
                                Text(opt.label).font(.system(size: 17, weight: .medium))
                                    .foregroundStyle(AppTheme.Colors.label)
                                Spacer()
                            }
                            .padding(.horizontal, 20)
                            .frame(maxWidth: .infinity).frame(height: 64)
                            .background(selected == opt.key ? AppTheme.Colors.accent.opacity(0.2) : AppTheme.Colors.buttonUnselected)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 24)
            }
            Spacer()
        }
        .background(AppBackground())
    }
}

// MARK: - S7 Tinder Pain Cards

struct TinderPainCardsView: View {
    let next: () -> Void

    private let cards = [
        "I waste hours scrolling and regret it every night.",
        "I say I'll change tomorrow, but tomorrow never comes.",
        "I know what I should do, but I just can't make myself do it.",
        "I feel anxious for no clear reason, almost every day.",
        "I start things full of energy, then lose motivation fast."
    ]
    @State private var index = 0
    @State private var offset: CGSize = .zero

    var body: some View {
        VStack {
            Spacer().frame(height: 24)
            Text("Which of these sound like you?")
                .font(.system(size: 24, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            Text("Swipe right if it hits. Swipe left if not.")
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .padding(.top, 8)

            Spacer()

            if index < cards.count {
                ZStack {
                    Text("\"\(cards[index])\"")
                        .font(.system(size: 22, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(AppTheme.Colors.label)
                        .padding(32)
                        .frame(maxWidth: .infinity, minHeight: 280)
                        .background(AppTheme.Colors.buttonUnselected)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .padding(.horizontal, 24)
                        .offset(offset)
                        .rotationEffect(.degrees(Double(offset.width / 20)))
                        .gesture(
                            DragGesture()
                                .onChanged { offset = $0.translation }
                                .onEnded { value in
                                    if value.translation.width > 100 {
                                        AnalyticsManager.shared.track(.tinderPainCardAgreed, properties: ["card": index])
                                        advance()
                                    } else if value.translation.width < -100 {
                                        AnalyticsManager.shared.track(.tinderPainCardDismissed, properties: ["card": index])
                                        advance()
                                    } else {
                                        withAnimation { offset = .zero }
                                    }
                                }
                        )
                }
            }

            Spacer()

            HStack(spacing: 32) {
                Button {
                    AnalyticsManager.shared.track(.tinderPainCardDismissed, properties: ["card": index])
                    advance()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(.red)
                        .frame(width: 64, height: 64)
                        .background(Color.white)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
                Button {
                    AnalyticsManager.shared.track(.tinderPainCardAgreed, properties: ["card": index])
                    advance()
                } label: {
                    Image(systemName: "checkmark")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(.green)
                        .frame(width: 64, height: 64)
                        .background(Color.white)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
            }
            .padding(.bottom, 64)
        }
        .background(AppBackground())
    }

    private func advance() {
        withAnimation {
            offset = .zero
            index += 1
        }
        if index >= cards.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { next() }
        }
    }
}

// MARK: - S8 What Tried

struct WhatTriedStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    @State private var selected: Set<String> = []

    private let options: [(key: String, label: String)] = [
        ("willpower", "Pure willpower"),
        ("habit_apps", "Habit tracker apps"),
        ("meditation", "Meditation apps"),
        ("therapy", "Therapy"),
        ("journaling", "Journaling"),
        ("books", "Self-help books"),
        ("nothing", "Nothing yet")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 40)
            Text("What have you already tried?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            ScrollView {
                VStack(spacing: 12) {
                    ForEach(options, id: \.key) { opt in
                        let isSelected = selected.contains(opt.key)
                        Button {
                            if isSelected { selected.remove(opt.key) } else { selected.insert(opt.key) }
                        } label: {
                            HStack {
                                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                                    .foregroundStyle(isSelected ? AppTheme.Colors.accent : .secondary)
                                Text(opt.label).font(.system(size: 17, weight: .medium))
                                    .foregroundStyle(AppTheme.Colors.label)
                                Spacer()
                            }
                            .padding(.horizontal, 20)
                            .frame(maxWidth: .infinity).frame(height: 56)
                            .background(AppTheme.Colors.buttonUnselected)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 24)
            }

            Button {
                next()
            } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(selected.isEmpty ? AppTheme.Colors.label.opacity(0.4) : AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .disabled(selected.isEmpty)
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }
}

// MARK: - S9 Stress Slider

struct StressSliderStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    @State private var value: Double = 5

    var body: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)
            Text("How stressed do you feel right now?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            Text("\(Int(value))")
                .font(.system(size: 80, weight: .bold))
                .foregroundStyle(AppTheme.Colors.accent)

            Slider(value: $value, in: 0...10, step: 1)
                .tint(AppTheme.Colors.accent)
                .padding(.horizontal, 32)

            HStack {
                Text("Calm").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("Overwhelmed").font(.caption).foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)

            Spacer()

            Button { next() } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }
}

// MARK: - S10 Social Proof

struct SocialProofStepView: View {
    let next: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)
            Text("You're not alone.")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(AppTheme.Colors.label)

            VStack(spacing: 4) {
                HStack(spacing: 2) {
                    ForEach(0..<5) { _ in
                        Image(systemName: "star.fill").foregroundStyle(.yellow)
                    }
                }
                Text("4.9 · 12,400+ people like you")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                VStack(spacing: 16) {
                    testimonial(
                        name: "Marcus, 28",
                        tag: "Late-night scroller",
                        text: "I used to stay up until 3am scrolling. Anicca nudged me right when I'd reach for my phone. Two weeks in, I'm sleeping again."
                    )
                    testimonial(
                        name: "Sarah, 34",
                        tag: "Anxious overthinker",
                        text: "The voice sessions feel like talking to someone who actually gets it. My anxiety dropped in ways therapy alone couldn't crack."
                    )
                }
                .padding(.horizontal, 24)
            }

            Button { next() } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }

    private func testimonial(name: String, tag: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(name).font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.label)
                Text("· \(tag)").font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }
            Text(text).font(.system(size: 14))
                .foregroundStyle(AppTheme.Colors.label.opacity(0.85))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AppTheme.Colors.buttonUnselected)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - S11 Preferred Nudge Times

struct PreferredNudgeTimesView: View {
    let next: () -> Void
    @State private var selected: Set<String> = ["morning", "evening"]

    private let options: [(key: String, label: String, icon: String)] = [
        ("morning", "Morning (9 AM)", "sunrise.fill"),
        ("afternoon", "Afternoon (2 PM)", "sun.max.fill"),
        ("evening", "Evening (8 PM)", "moon.stars.fill")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 40)
            Text("When should we nudge you?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            Text("Pick at least 2")
                .font(.system(size: 14))
                .foregroundStyle(.secondary)

            VStack(spacing: 12) {
                ForEach(options, id: \.key) { opt in
                    let isSelected = selected.contains(opt.key)
                    Button {
                        if isSelected { selected.remove(opt.key) } else { selected.insert(opt.key) }
                    } label: {
                        HStack {
                            Image(systemName: opt.icon).foregroundStyle(AppTheme.Colors.accent)
                                .frame(width: 28)
                            Text(opt.label).font(.system(size: 17, weight: .medium))
                                .foregroundStyle(AppTheme.Colors.label)
                            Spacer()
                            Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                                .foregroundStyle(isSelected ? AppTheme.Colors.accent : .secondary)
                        }
                        .padding(.horizontal, 20)
                        .frame(maxWidth: .infinity).frame(height: 64)
                        .background(AppTheme.Colors.buttonUnselected)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)

            Spacer()

            Button { next() } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(selected.count >= 2 ? AppTheme.Colors.accent : AppTheme.Colors.label.opacity(0.4))
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .disabled(selected.count < 2)
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }
}

// MARK: - S12 Meditation Experience

struct MeditationExperienceStepView: View {
    let next: () -> Void
    private let options: [(key: String, label: String)] = [
        ("never", "Never tried"),
        ("few_times", "A few times"),
        ("regularly", "Regularly"),
        ("daily", "Daily practice")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 40)
            Text("Have you meditated before?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            VStack(spacing: 12) {
                ForEach(options, id: \.key) { opt in
                    Button {
                        next()
                    } label: {
                        Text(opt.label)
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.label)
                            .frame(maxWidth: .infinity).frame(height: 56)
                            .background(AppTheme.Colors.buttonUnselected)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)
            Spacer()
        }
        .background(AppBackground())
    }
}

// MARK: - S13 Referral Source

struct ReferralSourceStepView: View {
    let next: () -> Void
    @EnvironmentObject private var appState: AppState
    private let options: [(key: String, label: String)] = [
        ("tiktok", "TikTok"),
        ("instagram", "Instagram"),
        ("twitter", "X / Twitter"),
        ("friend", "A friend"),
        ("app_store", "App Store search"),
        ("other", "Other")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 40)
            Text("Where did you hear about us?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            VStack(spacing: 12) {
                ForEach(options, id: \.key) { opt in
                    Button {
                        var profile = appState.userProfile
                        profile.acquisitionSource = opt.key
                        appState.updateUserProfile(profile, sync: true)
                        AnalyticsManager.shared.setUserProperty("acquisition_source", value: opt.key)
                        next()
                    } label: {
                        Text(opt.label)
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.label)
                            .frame(maxWidth: .infinity).frame(height: 56)
                            .background(AppTheme.Colors.buttonUnselected)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)
            Spacer()
        }
        .background(AppBackground())
    }
}

// MARK: - S16 Comparison Table

struct ComparisonTableStepView: View {
    let next: () -> Void

    private let rows: [(label: String, without: String, with: String)] = [
        ("Clarity on what to change", "Guessing", "Personalized plan"),
        ("When to act", "Whenever you remember", "Nudged at the right moment"),
        ("Support", "Alone", "AI that understands you"),
        ("Progress", "Hit-or-miss", "Tracked & compounding")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 24)
            VStack(spacing: 8) {
                Text("76%")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundStyle(AppTheme.Colors.accent)
                Text("of people who track their habits with AI stick with them.")
                    .font(.system(size: 16, weight: .medium))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(AppTheme.Colors.label)
                    .padding(.horizontal, 24)
            }

            VStack(spacing: 0) {
                HStack {
                    Text("").frame(maxWidth: .infinity, alignment: .leading)
                    Text("Without").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary).frame(width: 90)
                    Text("Anicca").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.accent).frame(width: 90)
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(AppTheme.Colors.buttonUnselected.opacity(0.5))

                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    HStack {
                        Text(row.label)
                            .font(.system(size: 13))
                            .foregroundStyle(AppTheme.Colors.label)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(row.without)
                            .font(.system(size: 12))
                            .foregroundStyle(.red.opacity(0.8))
                            .frame(width: 90)
                            .multilineTextAlignment(.center)
                        Text(row.with)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.green)
                            .frame(width: 90)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 14)
                    Divider()
                }
            }
            .background(AppTheme.Colors.buttonUnselected.opacity(0.2))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 24)

            Spacer()

            Button { next() } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }
}

// MARK: - S19 Rating Pre-Prompt

struct RatingPrePromptStepView: View {
    let next: () -> Void
    @State private var showFeedback = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("Are you enjoying Anicca so far?")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            HStack(spacing: 4) {
                ForEach(0..<5) { _ in
                    Image(systemName: "star.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(.yellow)
                }
            }

            Spacer()

            VStack(spacing: 12) {
                Button {
                    AnalyticsManager.shared.track(.ratingPromptYesTapped)
                    requestStoreReview()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { next() }
                } label: {
                    Text("Yes, I love it")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity).frame(height: 56)
                        .background(AppTheme.Colors.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                }

                Button {
                    AnalyticsManager.shared.track(.ratingPromptNoTapped)
                    showFeedback = true
                } label: {
                    Text("Not really")
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(AppTheme.Colors.label)
                        .frame(maxWidth: .infinity).frame(height: 56)
                        .background(AppTheme.Colors.buttonUnselected)
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
        .onAppear { AnalyticsManager.shared.track(.ratingPromptShown) }
        .sheet(isPresented: $showFeedback) {
            FeedbackFormView(done: {
                showFeedback = false
                next()
            })
        }
    }

    private func requestStoreReview() {
        AnalyticsManager.shared.track(.ratingStoreReviewRequested)
        if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            SKStoreReviewController.requestReview(in: scene)
        }
    }
}

// MARK: - Feedback Form

struct FeedbackFormView: View {
    let done: () -> Void
    @State private var text: String = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack {
                TextEditor(text: $text)
                    .padding()
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(AppTheme.Colors.label.opacity(0.2), lineWidth: 1)
                    )
                    .padding()

                Button {
                    AnalyticsManager.shared.track(.feedbackFormSubmitted, properties: ["length": text.count])
                    done()
                } label: {
                    Text("Send feedback")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity).frame(height: 52)
                        .background(AppTheme.Colors.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 26))
                }
                .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
                .padding()
            }
            .navigationTitle("Tell us what's off")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Skip") {
                        AnalyticsManager.shared.track(.feedbackFormSkipped)
                        done()
                    }
                }
            }
        }
    }
}

// MARK: - PW S2 Value Timeline

struct PaywallValueTimelineStepView: View {
    let next: () -> Void

    private let milestones: [(week: String, text: String)] = [
        ("Week 1", "First nudge hits at your weakest moment. You resist. Huge win."),
        ("Week 4", "Morning anxiety drops. Sleep returns."),
        ("Week 8", "You catch yourself before the old habit fires."),
        ("Week 12", "The new default is locked in. You are not the same person.")
    ]

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 32)
            Text("Here's what the next 12 weeks look like")
                .font(.system(size: 26, weight: .bold))
                .multilineTextAlignment(.center)
                .foregroundStyle(AppTheme.Colors.label)
                .padding(.horizontal, 24)

            ScrollView {
                VStack(spacing: 16) {
                    ForEach(Array(milestones.enumerated()), id: \.offset) { _, m in
                        HStack(alignment: .top, spacing: 16) {
                            VStack {
                                Circle().fill(AppTheme.Colors.accent).frame(width: 12, height: 12)
                                Rectangle().fill(AppTheme.Colors.accent.opacity(0.3)).frame(width: 2)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(m.week).font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(AppTheme.Colors.accent)
                                Text(m.text).font(.system(size: 15))
                                    .foregroundStyle(AppTheme.Colors.label)
                            }
                            Spacer()
                        }
                    }
                }
                .padding(.horizontal, 24)
            }

            Button { next() } label: {
                Text("Continue")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).frame(height: 56)
                    .background(AppTheme.Colors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(AppBackground())
    }
}

// MARK: - Paywall Flow Container (Hard Paywall — no dismiss)

struct PaywallFlowContainer: View {
    let onPurchaseSuccess: (CustomerInfo) -> Void
    @State private var step: PaywallStep = .primer

    var body: some View {
        ZStack {
            AppBackground()
            switch step {
            case .primer:
                PaywallPrimerStepView(next: { step = .valueTimeline })
            case .valueTimeline:
                PaywallValueTimelineStepView(next: { step = .planSelection })
            case .planSelection:
                PaywallVariantBView(
                    variant: "b",
                    onPurchaseSuccess: onPurchaseSuccess,
                    onDismiss: { /* hard paywall: no-op */ }
                )
            }
        }
    }
}
