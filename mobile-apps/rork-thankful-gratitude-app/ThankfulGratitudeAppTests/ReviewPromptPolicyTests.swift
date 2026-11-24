import Testing
import Foundation
@testable import ThankfulGratitudeApp

// Issue #47: gate tests for the ported Anicca-canonical review policy
// (>=3 distinct open days, 120-day cooldown, never on first launch).
struct ReviewPromptPolicyTests {

    private var calendar: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(secondsFromGMT: 0)!
        return cal
    }

    private func date(_ year: Int, _ month: Int, _ day: Int, hour: Int = 12) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day, hour: hour))!
    }

    @Test func shouldRequest_false_belowThreeDistinctDays() {
        for days in [0, 1, 2] {
            #expect(
                ReviewPromptPolicy.shouldRequestReview(
                    distinctOpenDayCount: days,
                    lastReviewRequestAt: nil,
                    now: date(2026, 11, 12),
                    calendar: calendar
                ) == false
            )
        }
    }

    @Test func shouldRequest_true_atThreeDistinctDays_noPriorRequest() {
        #expect(
            ReviewPromptPolicy.shouldRequestReview(
                distinctOpenDayCount: 3,
                lastReviewRequestAt: nil,
                now: date(2026, 11, 12),
                calendar: calendar
            ) == true
        )
    }

    @Test func shouldRequest_false_insideCooldown() {
        // Last request 2026-07-16; 119 days later is still inside the 120-day cooldown.
        #expect(
            ReviewPromptPolicy.shouldRequestReview(
                distinctOpenDayCount: 10,
                lastReviewRequestAt: date(2026, 7, 16),
                now: date(2026, 11, 12),
                calendar: calendar
            ) == false
        )
    }

    @Test func shouldRequest_true_afterCooldown() {
        // Last request 2026-07-15; 2026-11-12 is 120 days later, so the gate opens.
        #expect(
            ReviewPromptPolicy.shouldRequestReview(
                distinctOpenDayCount: 10,
                lastReviewRequestAt: date(2026, 7, 15),
                now: date(2026, 11, 12),
                calendar: calendar
            ) == true
        )
    }

    @Test func recordingOpenDay_isIdempotentPerDay() {
        let once = ReviewPromptPolicy.recordingOpenDay(
            existingDayKeys: [],
            now: date(2026, 11, 12, hour: 9),
            calendar: calendar
        )
        let twice = ReviewPromptPolicy.recordingOpenDay(
            existingDayKeys: once,
            now: date(2026, 11, 12, hour: 21),
            calendar: calendar
        )
        #expect(once == ["2026-11-12"])
        #expect(twice == once)
    }
}
