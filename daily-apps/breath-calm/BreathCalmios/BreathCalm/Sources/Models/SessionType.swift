import Foundation

enum SessionType: String, CaseIterable, Codable, Identifiable {
    case breathing478 = "478"
    case box = "box"
    case coherent = "coherent"
    case sos = "sos"
    case walking = "walking"

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .breathing478: return NSLocalizedString("home.session.478", comment: "")
        case .box: return NSLocalizedString("home.session.box", comment: "")
        case .coherent: return NSLocalizedString("home.session.coherent", comment: "")
        case .sos: return NSLocalizedString("home.session.sos", comment: "")
        case .walking: return NSLocalizedString("home.session.walking", comment: "")
        }
    }

    var localizedDescription: String {
        switch self {
        case .breathing478: return NSLocalizedString("home.session.478.desc", comment: "")
        case .box: return NSLocalizedString("home.session.box.desc", comment: "")
        case .coherent: return NSLocalizedString("home.session.coherent.desc", comment: "")
        case .sos: return NSLocalizedString("home.session.sos.desc", comment: "")
        case .walking: return NSLocalizedString("home.session.walking.desc", comment: "")
        }
    }

    var durationSeconds: Int {
        switch self {
        case .breathing478: return 360
        case .box: return 300
        case .coherent: return 360
        case .sos: return 180
        case .walking: return 480
        }
    }

    var requiresPro: Bool {
        switch self {
        case .breathing478: return false
        case .box, .coherent, .sos, .walking: return true
        }
    }

    var symbolName: String {
        switch self {
        case .breathing478: return "wind"
        case .box: return "square"
        case .coherent: return "heart.fill"
        case .sos: return "exclamationmark.triangle.fill"
        case .walking: return "figure.walk"
        }
    }

    var phases: [BreathPhase] {
        switch self {
        case .breathing478:
            return [
                BreathPhase(name: "session.inhale", duration: 4),
                BreathPhase(name: "session.hold", duration: 7),
                BreathPhase(name: "session.exhale", duration: 8)
            ]
        case .box:
            return [
                BreathPhase(name: "session.inhale", duration: 4),
                BreathPhase(name: "session.hold", duration: 4),
                BreathPhase(name: "session.exhale", duration: 4),
                BreathPhase(name: "session.rest", duration: 4)
            ]
        case .coherent:
            return [
                BreathPhase(name: "session.inhale", duration: 5),
                BreathPhase(name: "session.exhale", duration: 5)
            ]
        case .sos:
            return [
                BreathPhase(name: "session.inhale", duration: 4),
                BreathPhase(name: "session.hold", duration: 2),
                BreathPhase(name: "session.exhale", duration: 6)
            ]
        case .walking:
            return [
                BreathPhase(name: "session.inhale", duration: 3),
                BreathPhase(name: "session.exhale", duration: 3)
            ]
        }
    }
}

struct BreathPhase {
    let name: String
    let duration: Int

    var localizedName: String {
        NSLocalizedString(name, comment: "")
    }
}
