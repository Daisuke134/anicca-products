// aniccaiosUITests/ScreenshotTests.swift
// l.md Bible 100% — App Store スクリーンショット撮影
// make generate-store-screenshots から呼ばれる

import XCTest

final class ScreenshotTests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false

        addUIInterruptionMonitor(withDescription: "System Alert") { alert in
            let allowButtons = ["Allow", "許可", "OK", "開く", "Open", "Allow Once"]
            for title in allowButtons {
                if alert.buttons[title].exists {
                    alert.buttons[title].tap()
                    return true
                }
            }
            return false
        }
    }

    // screen1: Nudge カード（最初に見せるコア価値）
    @MainActor
    func testCaptureScreen1() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--screenshot-screen1"]
        app.launch()
        sleep(4)
        takeScreenshot(named: "screen1")
    }

    // screen2: オンボーディング（問題選択画面）
    @MainActor
    func testCaptureScreen2() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--screenshot-screen2"]
        app.launch()
        sleep(3)
        takeScreenshot(named: "screen2")
    }

    // screen3: Nudge カード（別カテゴリ）
    @MainActor
    func testCaptureScreen3() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--screenshot-screen3"]
        app.launch()
        sleep(4)
        takeScreenshot(named: "screen3")
    }

    private func takeScreenshot(named name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
