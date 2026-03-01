import SwiftUI

enum MoodLevel: Int16, CaseIterable, Identifiable {
    case awful = 1
    case bad = 2
    case okay = 3
    case good = 4
    case great = 5

    var id: Int16 { rawValue }

    var emoji: String {
        switch self {
        case .awful: return "😰"
        case .bad: return "😔"
        case .okay: return "😐"
        case .good: return "🙂"
        case .great: return "😊"
        }
    }

    var label: String {
        switch self {
        case .awful: return "Awful"
        case .bad: return "Bad"
        case .okay: return "Okay"
        case .good: return "Good"
        case .great: return "Great"
        }
    }

    var color: Color {
        switch self {
        case .awful: return Color(hex: "#E05C5C")
        case .bad: return Color(hex: "#D4876B")
        case .okay: return Color(hex: "#8899AA")
        case .good: return Color(hex: "#5B9BD5")
        case .great: return Color(hex: "#4CAF84")
        }
    }

    init?(rawInt: Int16) {
        self.init(rawValue: rawInt)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
