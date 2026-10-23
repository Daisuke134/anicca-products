import Foundation

nonisolated enum L10n: Sendable {
    static func greeting(for language: AppLanguage) -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch language {
        case .english:
            if hour < 12 { return "Good morning" }
            else if hour < 17 { return "Good afternoon" }
            else { return "Good evening" }
        case .japanese:
            if hour < 12 { return "おはようございます" }
            else if hour < 17 { return "こんにちは" }
            else { return "こんばんは" }
        }
    }

    static func gratefulPlaceholder(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "I'm grateful for..."
        case .japanese: return "感謝していること..."
        }
    }

    static func save(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Save Today's Gratitude"
        case .japanese: return "今日の感謝を保存"
        }
    }

    static func homeTab(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Home"
        case .japanese: return "ホーム"
        }
    }

    static func historyTab(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "History"
        case .japanese: return "履歴"
        }
    }

    static func settingsTab(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Settings"
        case .japanese: return "設定"
        }
    }

    static func streakLabel(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "day streak"
        case .japanese: return "日連続"
        }
    }

    static func onboardingTitle1(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Start Your Gratitude Journey"
        case .japanese: return "感謝の旅を始めよう"
        }
    }

    static func onboardingSubtitle1(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Write 3 things you're grateful for every day and transform your mindset"
        case .japanese: return "毎日3つの感謝を書いて、心を変えよう"
        }
    }

    static func onboardingTitle2(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Daily Affirmations"
        case .japanese: return "毎日のアファメーション"
        }
    }

    static func onboardingSubtitle2(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Start each morning with a powerful affirmation to set your intention"
        case .japanese: return "毎朝パワフルなアファメーションで1日を始めよう"
        }
    }

    static func onboardingTitle3(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Build Your Streak"
        case .japanese: return "ストリークを積み上げよう"
        }
    }

    static func onboardingSubtitle3(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Stay consistent and watch your gratitude habit grow"
        case .japanese: return "続けるほど、感謝の習慣が育つ"
        }
    }

    static func startFreeTrial(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Start Free Trial"
        case .japanese: return "無料トライアルを始める"
        }
    }

    static func paywallHeadline(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Unlock Your\nGratitude Practice"
        case .japanese: return "感謝の習慣を\nアンロック"
        }
    }

    static func paywallBullet1(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Unlimited daily entries"
        case .japanese: return "毎日無制限の記録"
        }
    }

    static func paywallBullet2(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "50 affirmations"
        case .japanese: return "50種類のアファメーション"
        }
    }

    static func paywallBullet3(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Progress insights & streaks"
        case .japanese: return "進捗インサイト＆ストリーク"
        }
    }

    static func bestValue(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "BEST VALUE"
        case .japanese: return "最もお得"
        }
    }

    static func perYear(_ price: String, _ language: AppLanguage) -> String {
        language == .english ? "\(price)/year" : "\(price)/年"
    }

    static func perMonth(_ price: String, _ language: AppLanguage) -> String {
        language == .english ? "\(price)/month" : "\(price)/月"
    }

    // "7-day" / "1-month" (EN), "7日間" / "1か月間" (JA): the store's own unit, never converted.
    static func trialPeriod(value: Int, unit: TrialUnit, _ language: AppLanguage) -> String {
        switch language {
        case .english:
            return "\(value)-\(unit.rawValue)"
        case .japanese:
            switch unit {
            case .day: return "\(value)日間"
            case .week: return "\(value)週間"
            case .month: return "\(value)か月間"
            case .year: return "\(value)年間"
            }
        }
    }

    static func freeTrial(_ period: String, _ language: AppLanguage) -> String {
        language == .english ? "\(period) free trial" : "\(period)無料トライアル"
    }

    static func saveBadge(_ percent: Int, _ language: AppLanguage) -> String {
        language == .english ? "SAVE \(percent)%" : "\(percent)%お得"
    }

    static func startTrial(_ period: String, _ language: AppLanguage) -> String {
        language == .english ? "Start \(period) Free Trial" : "\(period)無料で始める"
    }

    static func subscribeNow(_ language: AppLanguage) -> String {
        language == .english ? "Subscribe Now" : "今すぐ登録"
    }

    static func finePrintTrial(period: String, renewal: String, _ language: AppLanguage) -> String {
        language == .english
            ? "\(period) free trial, then \(renewal). Cancel anytime in Settings before the trial ends to avoid being charged."
            : "\(period)無料、その後 \(renewal)。トライアル終了前に設定からキャンセルすれば請求されません。"
    }

    static func finePrintRenewal(_ renewal: String, _ language: AppLanguage) -> String {
        language == .english
            ? "Auto-renews at \(renewal). Cancel anytime in Settings."
            : "\(renewal)で自動更新。設定からいつでもキャンセルできます。"
    }

    static func plansUnavailable(_ language: AppLanguage) -> String {
        language == .english ? "Plans couldn't be loaded." : "プランを読み込めませんでした。"
    }

    static func retry(_ language: AppLanguage) -> String {
        language == .english ? "Try Again" : "再読み込み"
    }

    static func unlockEntries(_ language: AppLanguage) -> String {
        language == .english ? "Unlock unlimited entries" : "記録を無制限にする"
    }

    static func unlockAffirmations(_ language: AppLanguage) -> String {
        language == .english ? "Unlock 50 affirmations" : "50種類のアファメーションを解放"
    }

    static func unlockHistory(_ language: AppLanguage) -> String {
        language == .english ? "Unlock your full history" : "すべての履歴を解放"
    }

    static func restorePurchase(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Restore Purchase"
        case .japanese: return "購入を復元"
        }
    }

    static func morningReminder(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Morning Reminder"
        case .japanese: return "朝のリマインダー"
        }
    }

    static func eveningReminder(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Evening Reminder"
        case .japanese: return "夜のリマインダー"
        }
    }

    static func languageLabel(_ lang: AppLanguage) -> String {
        switch lang {
        case .english: return "Language"
        case .japanese: return "言語"
        }
    }

    static func manageSubscription(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Manage Subscription"
        case .japanese: return "サブスクリプション管理"
        }
    }

    static func noEntries(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "No entries yet"
        case .japanese: return "まだ記録がありません"
        }
    }

    static func todaysAffirmation(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Today's Affirmation"
        case .japanese: return "今日のアファメーション"
        }
    }

    static func tapForNew(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Tap for a new affirmation"
        case .japanese: return "タップで新しいアファメーション"
        }
    }

    static func alreadySaved(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Today's gratitude saved"
        case .japanese: return "今日の感謝は保存済み"
        }
    }

    static func continueText(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Continue"
        case .japanese: return "続ける"
        }
    }

    static func notifications(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Notifications"
        case .japanese: return "通知"
        }
    }

    static func subscriptionSection(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Subscription"
        case .japanese: return "サブスクリプション"
        }
    }

    static func about(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "About"
        case .japanese: return "アプリについて"
        }
    }

    static func appVersion(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "App Version"
        case .japanese: return "アプリバージョン"
        }
    }

    static func recentEntries(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Recent Entries"
        case .japanese: return "最近の記録"
        }
    }

    static func skipText(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Skip"
        case .japanese: return "スキップ"
        }
    }

    static func privacyPolicy(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Privacy Policy"
        case .japanese: return "プライバシーポリシー"
        }
    }

    static func termsOfUse(_ language: AppLanguage) -> String {
        switch language {
        case .english: return "Terms of Use"
        case .japanese: return "利用規約"
        }
    }
}

enum TrialUnit: String {
    case day, week, month, year
}
