import CoreData
import Foundation

class MoodStore: ObservableObject {
    let container: NSPersistentContainer

    init(container: NSPersistentContainer = PersistenceController.shared.container) {
        self.container = container
    }

    var context: NSManagedObjectContext { container.viewContext }

    // MARK: - Save

    @discardableResult
    func saveMoodEntry(level: Int16, note: String?) throws -> MoodEntryMO {
        let entry = MoodEntryMO(context: context)
        entry.id = UUID()
        entry.timestamp = Date()
        entry.moodLevel = level
        entry.note = note.flatMap { $0.isEmpty ? nil : $0 }
        entry.createdAt = Date()
        try context.save()
        return entry
    }

    // MARK: - Fetch

    func fetchEntries(limit: Int? = nil) -> [MoodEntryMO] {
        let request: NSFetchRequest<MoodEntryMO> = MoodEntryMO.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MoodEntryMO.timestamp, ascending: false)]
        if let limit { request.fetchLimit = limit }
        return (try? context.fetch(request)) ?? []
    }

    func fetchEntriesSince(_ date: Date) -> [MoodEntryMO] {
        let request: NSFetchRequest<MoodEntryMO> = MoodEntryMO.fetchRequest()
        request.predicate = NSPredicate(format: "timestamp >= %@", date as NSDate)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MoodEntryMO.timestamp, ascending: false)]
        return (try? context.fetch(request)) ?? []
    }

    func fetchEntriesCount() -> Int {
        let request: NSFetchRequest<MoodEntryMO> = MoodEntryMO.fetchRequest()
        return (try? context.count(for: request)) ?? 0
    }

    // MARK: - Delete

    func deleteEntry(_ entry: MoodEntryMO) throws {
        context.delete(entry)
        try context.save()
    }
}
