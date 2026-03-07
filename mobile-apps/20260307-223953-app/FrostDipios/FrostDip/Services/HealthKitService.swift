import Foundation
import HealthKit

/// Service classes (reference types) are exempt from the struct immutability rule.
final class HealthKitService: HealthKitServiceProtocol {
    private let healthStore = HKHealthStore()
    private var heartRateQuery: HKAnchoredObjectQuery?
    private var samples: [Double] = []

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async throws {
        let heartRateType = HKQuantityType(.heartRate)
        try await healthStore.requestAuthorization(toShare: [], read: [heartRateType])
    }

    func startHeartRateMonitoring(onUpdate: @escaping (Double) -> Void) {
        samples = []
        let heartRateType = HKQuantityType(.heartRate)
        let predicate = HKQuery.predicateForSamples(withStart: Date(), end: nil)

        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, newSamples, _, _, _ in
            self?.processSamples(newSamples, onUpdate: onUpdate)
        }

        query.updateHandler = { [weak self] _, newSamples, _, _, _ in
            self?.processSamples(newSamples, onUpdate: onUpdate)
        }

        healthStore.execute(query)
        heartRateQuery = query
    }

    func stopHeartRateMonitoring() -> (avg: Double?, max: Double?, samples: [Double]) {
        if let query = heartRateQuery {
            healthStore.stop(query)
            heartRateQuery = nil
        }

        guard !samples.isEmpty else { return (nil, nil, []) }

        let avg = samples.reduce(0, +) / Double(samples.count)
        let max = samples.max()
        let result = (avg: Optional(avg), max: max, samples: samples)
        samples = []
        return result
    }

    private func processSamples(_ newSamples: [HKSample]?, onUpdate: @escaping (Double) -> Void) {
        guard let heartRateSamples = newSamples as? [HKQuantitySample] else { return }
        for sample in heartRateSamples {
            let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            samples.append(bpm)
            DispatchQueue.main.async { onUpdate(bpm) }
        }
    }
}
