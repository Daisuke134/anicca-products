import Testing
@testable import ChiDaily

struct FoundationModelsServiceTests {

    let service = FoundationModelsService()

    @Test func analyzeReturnsResult() async throws {
        let result = await service.analyze(
            energyLevel: 3,
            sleepQuality: 3,
            digestionComfort: 3,
            emotionalState: 3,
            physicalSensation: 3
        )
        #expect(!result.constitutionType.isEmpty)
        #expect(!result.recommendations.isEmpty)
    }

    @Test func lowEnergyLowSleep() async throws {
        let result = await service.analyze(
            energyLevel: 1,
            sleepQuality: 1,
            digestionComfort: 3,
            emotionalState: 3,
            physicalSensation: 3
        )
        #expect(!result.constitutionType.isEmpty)
    }

    @Test func allHighValues() async throws {
        let result = await service.analyze(
            energyLevel: 5,
            sleepQuality: 5,
            digestionComfort: 5,
            emotionalState: 5,
            physicalSensation: 5
        )
        #expect(!result.recommendations.isEmpty)
    }

    @Test func recommendationsHaveAllCategories() async throws {
        let result = await service.analyze(
            energyLevel: 3,
            sleepQuality: 3,
            digestionComfort: 3,
            emotionalState: 3,
            physicalSensation: 3
        )
        let categories = Set(result.recommendations.map { $0.category })
        #expect(categories.contains(.food))
        #expect(categories.contains(.movement))
        #expect(categories.contains(.rest))
    }
}
