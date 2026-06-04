import XCTest
@testable import aniccaios

/// ⑥ 1.9.3 newsletter lang 変換 — Test #5.5
@MainActor
final class NewsletterLangTests: XCTestCase {
    // I-1: ja → "jp" (lead-magnet が "jp"/"en" を期待、 "ja" 送ると英語 letter になる)
    func test_newsletterLang_jaMapsToJp() {
        XCTAssertEqual(AppState.newsletterLang(for: .ja), "jp")
        XCTAssertEqual(AppState.newsletterLang(for: .en), "en")
    }
}
