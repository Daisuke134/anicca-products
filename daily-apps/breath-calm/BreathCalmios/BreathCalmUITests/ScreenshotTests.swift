import XCTest

final class ScreenshotTests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        app.launch()
    }

    func testScreenshot_Onboarding() throws {
        // Reset onboarding for screenshot
        UserDefaults.standard.set(false, forKey: "onboarding_completed")
        app.terminate()
        app.launch()

        let welcomeCTA = app.buttons["onboarding-welcome-cta"]
        XCTAssertTrue(welcomeCTA.waitForExistence(timeout: 5))
        takeScreenshot(name: "01_onboarding_welcome")
    }

    func testScreenshot_Main() throws {
        // Ensure onboarding is completed
        UserDefaults.standard.set(true, forKey: "onboarding_completed")
        app.terminate()
        app.launch()

        // Wait for main tab view
        let homeTab = app.tabBars.buttons.firstMatch
        XCTAssertTrue(homeTab.waitForExistence(timeout: 5))
        takeScreenshot(name: "02_main_home")
    }

    func testScreenshot_Paywall() throws {
        UserDefaults.standard.set(true, forKey: "onboarding_completed")
        app.terminate()
        app.launch()

        // Trigger paywall by tapping a pro session
        let homeTab = app.tabBars.buttons.firstMatch
        _ = homeTab.waitForExistence(timeout: 5)

        // Tap box breathing (requires pro)
        let boxBreathing = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Box'")).firstMatch
        if boxBreathing.waitForExistence(timeout: 3) {
            boxBreathing.tap()
        }

        let paywallSkip = app.buttons["paywall_skip"]
        if paywallSkip.waitForExistence(timeout: 3) {
            takeScreenshot(name: "03_paywall")
        }
    }

    private func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
