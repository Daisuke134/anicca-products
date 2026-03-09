// OnboardingStepMigrationTests.swift
// Soft Paywall: OnboardingStep enum + legacy migration tests (updated for v2)

import XCTest
@testable import aniccaios

final class OnboardingStepMigrationTests: XCTestCase {

    // MARK: - New Enum Raw Values (v2: 8-step)

    func test_welcome_rawValue_is0() {
        XCTAssertEqual(OnboardingStep.welcome.rawValue, 0)
    }

    func test_struggles_rawValue_is1() {
        XCTAssertEqual(OnboardingStep.struggles.rawValue, 1)
    }

    func test_struggleDepth_rawValue_is2() {
        XCTAssertEqual(OnboardingStep.struggleDepth.rawValue, 2)
    }

    func test_goals_rawValue_is3() {
        XCTAssertEqual(OnboardingStep.goals.rawValue, 3)
    }

    func test_personalizedInsight_rawValue_is4() {
        XCTAssertEqual(OnboardingStep.personalizedInsight.rawValue, 4)
    }

    func test_valueProp_rawValue_is5() {
        XCTAssertEqual(OnboardingStep.valueProp.rawValue, 5)
    }

    func test_liveDemo_rawValue_is6() {
        XCTAssertEqual(OnboardingStep.liveDemo.rawValue, 6)
    }

    func test_notifications_rawValue_is7() {
        XCTAssertEqual(OnboardingStep.notifications.rawValue, 7)
    }

    // MARK: - Legacy Migration (v1.6.0 以前 → v2)

    func test_migration_raw0_returnsWelcome() {
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(0), .welcome)
    }

    func test_migration_raw1_returnsStruggles() {
        // 旧 value(1) → struggles（value 削除のため）
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(1), .struggles)
    }

    func test_migration_raw2_returnsStruggles() {
        // 旧 struggles(2) → struggles（legacy only）
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(2), .struggles)
    }

    func test_migration_raw3_returnsNotifications() {
        // v1.6.0 の .notifications=3 を保護（現行ユーザー優先）
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(3), .notifications)
    }

    func test_migration_raw4_returnsNotifications() {
        // v1.6.0の.att → notifications（ATT削除後）
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(4), .notifications)
    }

    func test_migration_raw5_returnsStruggles() {
        // 旧 name → struggles
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(5), .struggles)
    }

    func test_migration_raw6_returnsStruggles() {
        // 旧 gender → struggles
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(6), .struggles)
    }

    func test_migration_raw7_returnsStruggles() {
        // 旧 age → struggles
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(7), .struggles)
    }

    func test_migration_raw8_returnsStruggles() {
        // 旧 ideals → struggles
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(8), .struggles)
    }

    func test_migration_raw9to12_returnsNotifications() {
        for raw in 9...12 {
            XCTAssertEqual(
                OnboardingStep.migratedFromLegacyRawValue(raw),
                .notifications,
                "rawValue \(raw) should map to .notifications"
            )
        }
    }

    func test_migration_rawNegative_returnsWelcome() {
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(-1), .welcome)
    }

    func test_migration_rawLargeValue_returnsWelcome() {
        XCTAssertEqual(OnboardingStep.migratedFromLegacyRawValue(999), .welcome)
    }

    // MARK: - Value case should not exist

    func test_value_case_doesNotExist() {
        // OnboardingStep(rawValue: 1) should be .struggles, not .value
        let step = OnboardingStep(rawValue: 1)
        XCTAssertEqual(step, .struggles)
    }

    // MARK: - v1.6.1 → v2 Migration

    func test_v1Migration_old0_maps_to_welcome() {
        XCTAssertEqual(OnboardingStep.migratedFromV1RawValue(0), .welcome)
    }

    func test_v1Migration_old1_maps_to_struggles() {
        XCTAssertEqual(OnboardingStep.migratedFromV1RawValue(1), .struggles)
    }

    func test_v1Migration_old2_maps_to_liveDemo() {
        // Old rawValue 2 (liveDemo) → New rawValue 6 (liveDemo)
        XCTAssertEqual(OnboardingStep.migratedFromV1RawValue(2), .liveDemo)
    }

    func test_v1Migration_old3_maps_to_notifications() {
        // Old rawValue 3 (notifications) → New rawValue 7 (notifications)
        XCTAssertEqual(OnboardingStep.migratedFromV1RawValue(3), .notifications)
    }
}
