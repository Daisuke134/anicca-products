import Foundation
import Testing
@testable import aniccaios

struct MemoryStoreRecoveryTests {
    @Test("Duplicate persisted memories recover latest value independently of order")
    func duplicateRecovery() throws {
        let suite = "com.anicca.tests.memory." + UUID().uuidString
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let id1 = "00000000-0000-0000-0000-000000000001"
        let id2 = "00000000-0000-0000-0000-000000000002"
        func row(_ id: String, _ text: String, _ time: Double) -> [String: Any] {
            ["id": id, "problemType": "cant_wake_up", "text": text,
             "createdAt": time, "updatedAt": time]
        }
        let old = row(id1, "old", 100)
        let new = row(id2, "new", 200)
        for rows in [[old, new], [new, old]] {
            defaults.set(try JSONSerialization.data(withJSONObject: rows), forKey: "anicca_memories")
            #expect(MemoryStore(defaults: defaults).memory(for: .cantWakeUp)?.text == "new")
        }
    }
}
