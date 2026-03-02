import Foundation
import Combine

@MainActor
final class RitualViewModel: ObservableObject {
    @Published var steps: [RitualStep] = []
    private let store = RitualStore()

    var allCompleted: Bool { steps.allSatisfy { $0.isCompleted } }

    func load() {
        steps = store.loadSteps()
    }

    func toggleStep(_ step: RitualStep) {
        guard let idx = steps.firstIndex(of: step) else { return }
        steps[idx] = RitualStep(id: step.id, name: step.name, isCompleted: !step.isCompleted)
        store.saveSteps(steps)
    }

    func addStep(name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        steps.append(RitualStep(name: trimmed))
        store.saveSteps(steps)
    }

    func deleteStep(at offsets: IndexSet) {
        steps.remove(atOffsets: offsets)
        store.saveSteps(steps)
    }

    func reorderSteps(from source: IndexSet, to destination: Int) {
        steps.move(fromOffsets: source, toOffset: destination)
        store.saveSteps(steps)
    }

    func resetForNewDay() {
        steps = steps.map { RitualStep(id: $0.id, name: $0.name, isCompleted: false) }
        store.saveSteps(steps)
    }
}
