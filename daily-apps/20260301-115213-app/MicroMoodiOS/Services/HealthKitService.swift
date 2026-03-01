import Foundation
import HealthKit

class HealthKitService {
    static let shared = HealthKitService()
    private let healthStore = HKHealthStore()

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        try await healthStore.requestAuthorization(toShare: [mindfulType], read: [])
    }

    func writeMindfulSession(startDate: Date, duration: TimeInterval = 60) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        let endDate = startDate.addingTimeInterval(duration)
        let sample = HKCategorySample(
            type: mindfulType,
            value: HKCategoryValue.notApplicable.rawValue,
            start: startDate,
            end: endDate
        )
        try await healthStore.save(sample)
    }
}
