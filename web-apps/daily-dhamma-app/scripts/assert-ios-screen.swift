import Foundation
import Vision

// Observe the rendered Simulator screenshot, not the app's source strings.
// Used only by CI. The screenshot stays on the disposable runner.
guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: assert-ios-screen <screenshot.png> <visible phrase>...\n", stderr)
    exit(2)
}
let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["en-US"]
request.usesLanguageCorrection = true

do {
    try VNImageRequestHandler(url: imageURL, options: [:]).perform([request])
    let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    print("Rendered screen text: \(text)")
    let normalized = text.lowercased().split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    for phrase in CommandLine.arguments.dropFirst(2) {
        if !normalized.contains(phrase.lowercased()) {
            fputs("Missing visible phrase: \(phrase)\n", stderr)
            exit(1)
        }
    }
} catch {
    fputs("Screenshot recognition failed: \(error)\n", stderr)
    exit(1)
}
