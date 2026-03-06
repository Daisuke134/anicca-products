import Foundation

enum StretchLibraryError: Error, Equatable {
    case fileNotFound
    case decodingFailed(String)
}

final class StretchLibraryService {
    private var allExercises: [StretchExercise] = []

    func loadFromBundle() throws {
        guard let url = Bundle.main.url(forResource: "StretchLibrary", withExtension: "json") else {
            throw StretchLibraryError.fileNotFound
        }
        do {
            let data = try Data(contentsOf: url)
            allExercises = try JSONDecoder().decode([StretchExercise].self, from: data)
        } catch let error as DecodingError {
            throw StretchLibraryError.decodingFailed(error.localizedDescription)
        } catch {
            throw error
        }
    }

    func loadFromData(_ data: Data) throws {
        allExercises = try JSONDecoder().decode([StretchExercise].self, from: data)
    }

    func exercises(for painAreas: Set<PainArea>) -> [StretchExercise] {
        allExercises.filter { painAreas.contains($0.category) }
    }

    func freeExercises(for painAreas: Set<PainArea>) -> [StretchExercise] {
        exercises(for: painAreas).filter { !$0.isPremium }
    }

    var all: [StretchExercise] { allExercises }
    var isEmpty: Bool { allExercises.isEmpty }
}
