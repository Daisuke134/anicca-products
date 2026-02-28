import Foundation

struct Teaching: Identifiable, Codable, Hashable {
    let id: Int
    let text: String
    let source: String
    let category: TeachingCategory
    let paliTerm: String?

    static var today: Teaching {
        let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let index = (dayOfYear - 1) % TeachingData.allTeachings.count
        return TeachingData.allTeachings[index]
    }
}

enum TeachingCategory: String, Codable, CaseIterable, Hashable {
    case dhammapada = "Dhammapada"
    case suttaNipata = "Sutta Nipāta"
    case majjhimaNikaya = "Majjhima Nikāya"
    case samyuttaNikaya = "Saṃyutta Nikāya"
    case anguttaraNikaya = "Aṅguttara Nikāya"
    case digaNikaya = "Dīgha Nikāya"
    case theragatha = "Theragāthā"
    case therigatha = "Therīgāthā"
    case vinaya = "Vinaya"
    case modernTeachers = "Modern Teachers"

    var emoji: String {
        switch self {
        case .dhammapada: return "📜"
        case .suttaNipata: return "🪷"
        case .majjhimaNikaya: return "🧘"
        case .samyuttaNikaya: return "🔗"
        case .anguttaraNikaya: return "📿"
        case .digaNikaya: return "📖"
        case .theragatha: return "🏔️"
        case .therigatha: return "🌸"
        case .vinaya: return "⚖️"
        case .modernTeachers: return "🕊️"
        }
    }
}
