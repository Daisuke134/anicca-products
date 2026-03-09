// File: Views/Onboarding/AgeInputView.swift
// Onboarding Step 1: Age input for Maffetone calculation
// Stub for US-006a — full implementation in US-006b

import SwiftUI
import SwiftData

struct AgeInputView: View {
    @Bindable var viewModel: OnboardingViewModel
    @Environment(\.modelContext) private var modelContext

    var isValid: Bool { viewModel.age >= 10 && viewModel.age <= 100 }

    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            Text("How old are you?")
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
                .accessibilityIdentifier("onboarding_age_title")

            Text("We use this to calculate your Zone 2 heart rate target.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            HStack {
                Button("-") { if viewModel.age > 10 { viewModel.age -= 1 } }
                    .font(.title)
                    .buttonStyle(.bordered)
                Text("\(viewModel.age)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .frame(minWidth: 120)
                    .accessibilityIdentifier("onboarding_age_value")
                Button("+") { if viewModel.age < 100 { viewModel.age += 1 } }
                    .font(.title)
                    .buttonStyle(.bordered)
            }

            if isValid {
                Text("Your Zone 2: \(Zone2Calculator.zone2MinHR(age: viewModel.age))–\(Zone2Calculator.zone2MaxHR(age: viewModel.age)) bpm")
                    .font(.headline)
                    .foregroundStyle(.brandPrimary)
            }

            Spacer()

            Button("Continue") {
                saveProfile()
                viewModel.goNext()
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isValid)
            .tint(.brandPrimary)
            .accessibilityIdentifier("btn_continue_age")
        }
        .padding(32)
    }

    private func saveProfile() {
        let profile = UserProfile(age: viewModel.age)
        modelContext.insert(profile)
        try? modelContext.save()
    }
}
