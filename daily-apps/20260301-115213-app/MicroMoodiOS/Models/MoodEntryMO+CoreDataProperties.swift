import Foundation
import CoreData

extension MoodEntryMO {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MoodEntryMO> {
        return NSFetchRequest<MoodEntryMO>(entityName: "MoodEntryMO")
    }

    @NSManaged public var id: UUID
    @NSManaged public var timestamp: Date
    @NSManaged public var moodLevel: Int16
    @NSManaged public var note: String?
    @NSManaged public var createdAt: Date
}

extension MoodEntryMO: Identifiable {}
