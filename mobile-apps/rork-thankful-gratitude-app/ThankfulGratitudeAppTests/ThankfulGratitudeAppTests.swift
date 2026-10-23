import Testing
import Foundation
@testable import ThankfulGratitudeApp

// MARK: - Fix 1: Config API Key Tests

struct ConfigTests {
    @Test func apiKey_isNotEmpty() {
        #expect(!Config.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY.isEmpty)
    }

    @Test func apiKey_startsWithAppl() {
        #expect(Config.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY.hasPrefix("appl_"))
    }

    @Test func testApiKey_isNotEmpty() {
        #expect(!Config.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY.isEmpty)
    }
}

// MARK: - Fix T4-T5: AppViewModel Streak Tests

@MainActor
struct AppViewModelTests {
    @Test func calculateStreak_emptyEntries_returnsZero() {
        let vm = AppViewModel()
        let streak = vm.calculateStreak(entries: [])
        #expect(streak == 0)
    }

    @Test func calculateStreak_singleToday_returnsOne() {
        let vm = AppViewModel()
        let today = Date()
        let entry = GratitudeEntry(date: today, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        let streak = vm.calculateStreak(entries: [entry])
        #expect(streak == 1)
    }

    @Test func calculateStreak_consecutiveDays_returnsCorrectCount() {
        let vm = AppViewModel()
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let dayBefore = calendar.date(byAdding: .day, value: -2, to: today)!

        let entries = [
            GratitudeEntry(date: today, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x"),
            GratitudeEntry(date: yesterday, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x"),
            GratitudeEntry(date: dayBefore, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        ]
        let streak = vm.calculateStreak(entries: entries)
        #expect(streak == 3)
    }

    @Test func calculateStreak_gapInEntries_returnsPartialStreak() {
        let vm = AppViewModel()
        let calendar = Calendar.current
        let today = Date()
        let twoDaysAgo = calendar.date(byAdding: .day, value: -2, to: today)!

        let entries = [
            GratitudeEntry(date: today, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x"),
            GratitudeEntry(date: twoDaysAgo, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        ]
        let streak = vm.calculateStreak(entries: entries)
        #expect(streak == 1)
    }

    @Test func hasTodayEntry_withTodayEntry_returnsTrue() {
        let vm = AppViewModel()
        let entry = GratitudeEntry(date: Date(), gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        #expect(vm.hasTodayEntry(entries: [entry]) == true)
    }

    @Test func hasTodayEntry_withOldEntry_returnsFalse() {
        let vm = AppViewModel()
        let old = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        let entry = GratitudeEntry(date: old, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        #expect(vm.hasTodayEntry(entries: [entry]) == false)
    }
}

// MARK: - Fix T6: Localization Tests

struct StringsTests {
    @Test func allStrings_returnNonEmptyForEnglish() {
        let lang = AppLanguage.english
        #expect(!L10n.greeting(for: lang).isEmpty)
        #expect(!L10n.gratefulPlaceholder(lang).isEmpty)
        #expect(!L10n.save(lang).isEmpty)
        #expect(!L10n.homeTab(lang).isEmpty)
        #expect(!L10n.historyTab(lang).isEmpty)
        #expect(!L10n.settingsTab(lang).isEmpty)
        #expect(!L10n.paywallHeadline(lang).isEmpty)
        #expect(!L10n.startTrial(L10n.trialPeriod(value: 7, unit: .day, lang), lang).isEmpty)
        #expect(!L10n.restorePurchase(lang).isEmpty)
        #expect(!L10n.finePrintTrial(period: L10n.trialPeriod(value: 7, unit: .day, lang), renewal: "$29.99/year", lang).isEmpty)
        #expect(!L10n.perYear("$29.99", lang).isEmpty)
        #expect(!L10n.perMonth("$4.99", lang).isEmpty)
    }

    @Test func allStrings_returnNonEmptyForJapanese() {
        let lang = AppLanguage.japanese
        #expect(!L10n.greeting(for: lang).isEmpty)
        #expect(!L10n.gratefulPlaceholder(lang).isEmpty)
        #expect(!L10n.save(lang).isEmpty)
        #expect(!L10n.homeTab(lang).isEmpty)
        #expect(!L10n.historyTab(lang).isEmpty)
        #expect(!L10n.settingsTab(lang).isEmpty)
        #expect(!L10n.paywallHeadline(lang).isEmpty)
        #expect(!L10n.startTrial(L10n.trialPeriod(value: 7, unit: .day, lang), lang).isEmpty)
        #expect(!L10n.restorePurchase(lang).isEmpty)
        #expect(!L10n.finePrintTrial(period: L10n.trialPeriod(value: 7, unit: .day, lang), renewal: "$29.99/year", lang).isEmpty)
        #expect(!L10n.perYear("$29.99", lang).isEmpty)
        #expect(!L10n.perMonth("$4.99", lang).isEmpty)
    }

    // Fix T7: Privacy Policy strings (will fail until Fix 5 is implemented)
    @Test func privacyPolicy_returnsNonEmptyForEnglish() {
        #expect(!L10n.privacyPolicy(.english).isEmpty)
    }

    @Test func privacyPolicy_returnsNonEmptyForJapanese() {
        #expect(!L10n.privacyPolicy(.japanese).isEmpty)
    }

    @Test func termsOfUse_returnsNonEmptyForEnglish() {
        #expect(!L10n.termsOfUse(.english).isEmpty)
    }

    @Test func termsOfUse_returnsNonEmptyForJapanese() {
        #expect(!L10n.termsOfUse(.japanese).isEmpty)
    }
}

// MARK: - GratitudeEntry Model Tests

struct GratitudeEntryTests {
    @Test func entry_storesGratitude1() {
        let entry = GratitudeEntry(date: Date(), gratitude1: "sunshine", gratitude2: "b", gratitude3: "c", affirmation: "x")
        #expect(entry.gratitude1 == "sunshine")
    }

    @Test func entry_storesDate() {
        let date = Date()
        let entry = GratitudeEntry(date: date, gratitude1: "a", gratitude2: "b", gratitude3: "c", affirmation: "x")
        #expect(Calendar.current.isDate(entry.date, inSameDayAs: date))
    }
}

// MARK: - Paywall gate (docs/team/specs/thankful-paywall.md)

@MainActor
struct PaywallGateTests {
    private func makeVM() -> AppViewModel {
        AppViewModel(defaults: UserDefaults(suiteName: "test-\(UUID().uuidString)")!)
    }

    private func entry(daysAgo: Int) -> GratitudeEntry {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
        return GratitudeEntry(date: date, gratitude1: "a", gratitude2: "", gratitude3: "", affirmation: "x")
    }

    @Test func free_canAddFirstEntryOfDay_butNotSecond() {
        let vm = makeVM()
        #expect(vm.canAddEntry(entries: [entry(daysAgo: 1)]))
        #expect(!vm.canAddEntry(entries: [entry(daysAgo: 0)]))
    }

    @Test func pro_canAddUnlimitedEntries() {
        let vm = makeVM()
        vm.isPro = true
        #expect(vm.canAddEntry(entries: [entry(daysAgo: 0)]))
    }

    @Test func free_historyLocksEntriesOlderThanSevenDays() {
        let vm = makeVM()
        #expect(!vm.isLocked(entry(daysAgo: 6)))
        #expect(vm.isLocked(entry(daysAgo: 7)))
        vm.isPro = true
        #expect(!vm.isLocked(entry(daysAgo: 30)))
    }

    @Test func free_refreshAffirmation_opensPaywallInsteadOfChanging() {
        let vm = makeVM()
        let before = vm.currentAffirmation.english
        vm.refreshAffirmation()
        #expect(vm.showPaywall)
        #expect(vm.currentAffirmation.english == before)
    }

    @Test func free_threeDayStreak_opensPaywallOnce() {
        let vm = makeVM()
        let threeDays = [entry(daysAgo: 0), entry(daysAgo: 1), entry(daysAgo: 2)]
        vm.didSaveEntry(entries: [entry(daysAgo: 0), entry(daysAgo: 1)])
        #expect(!vm.showPaywall)
        vm.didSaveEntry(entries: threeDays)
        #expect(vm.showPaywall)
        vm.showPaywall = false
        vm.didSaveEntry(entries: threeDays)
        #expect(!vm.showPaywall)
    }

    @Test func trialPeriod_keepsStoreUnit() {
        #expect(L10n.trialPeriod(value: 1, unit: .month, .japanese) == "1か月間")
        #expect(L10n.trialPeriod(value: 7, unit: .day, .english) == "7-day")
    }

    @Test func isPro_isCachedAcrossLaunches() {
        let defaults = UserDefaults(suiteName: "test-\(UUID().uuidString)")!
        let vm = AppViewModel(defaults: defaults)
        vm.isPro = true
        #expect(AppViewModel(defaults: defaults).isPro)
    }

    @Test func free_alwaysShowsTodaysAffirmation() {
        let vm = makeVM()
        #expect(vm.displayedAffirmation.english == AffirmationData.forDay().english)
    }

    @Test func annualSavingsPercent_comparesToTwelveMonths() {
        #expect(PaywallPricing.annualSavingsPercent(annual: 29.99, monthly: 4.99) == 50)
        #expect(PaywallPricing.annualSavingsPercent(annual: 60, monthly: 4.99) == nil)
    }
}
