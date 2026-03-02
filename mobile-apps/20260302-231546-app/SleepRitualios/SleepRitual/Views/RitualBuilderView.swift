import SwiftUI

struct RitualBuilderView: View {
    @StateObject private var ritualVM = RitualViewModel()
    @ObservedObject private var subscriptionService = SubscriptionService.shared
    @State private var showingPaywall = false
    @State private var newStepName = ""
    private let maxFreeSteps = 3

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.15).ignoresSafeArea()

            VStack {
                List {
                    ForEach(ritualVM.steps) { step in
                        Text(step.name)
                            .foregroundColor(.white)
                            .listRowBackground(Color.white.opacity(0.07))
                    }
                    .onMove(perform: ritualVM.reorderSteps)
                    .onDelete(perform: ritualVM.deleteStep)

                    addStepRow
                }
                .scrollContentBackground(.hidden)
                .environment(\.editMode, .constant(.active))
            }
        }
        .navigationTitle("Build Your Ritual")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear { ritualVM.load() }
        .sheet(isPresented: $showingPaywall) {
            PaywallView(onDismiss: { showingPaywall = false })
        }
    }

    private var addStepRow: some View {
        HStack {
            TextField("Add a step...", text: $newStepName)
                .foregroundColor(.white)
                .onSubmit { submitNewStep() }
            Button(action: submitNewStep) {
                Image(systemName: "plus.circle.fill")
                    .foregroundColor(Color(red: 0.5, green: 0.4, blue: 1.0))
            }
        }
        .listRowBackground(Color.white.opacity(0.07))
    }

    private func submitNewStep() {
        let trimmed = newStepName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if !subscriptionService.isPro && ritualVM.steps.count >= maxFreeSteps {
            showingPaywall = true
            return
        }

        ritualVM.addStep(name: trimmed)
        AnalyticsService.shared.trackStepAdded()
        newStepName = ""
    }
}
