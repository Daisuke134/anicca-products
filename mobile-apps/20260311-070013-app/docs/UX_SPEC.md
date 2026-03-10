# UX Specification: SomaticFlow

Source: [Nielsen Norman Group: UX Design Best Practices](https://www.nngroup.com/articles/ten-usability-heuristics/) — 「Match between system and the real world: use words and concepts familiar to the user.」
Source: [Apple HIG: Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) — 「Help people get started quickly by showing only what's essential.」
Source: [Appagent Paywall Optimization 2024](https://appagent.com/blog/mobile-app-onboarding-5-paywall-optimization-strategies/) — 「Ensure that most existing users see the paywall by placing it immediately after the onboarding process.」

---

## 1. User Personas

### Persona A: Sara（都市ストレスワーカー）

| 項目 | 値 |
|------|-----|
| 年齢 | 32歳 |
| 職業 | ITエンジニア / リモートワーク |
| 住所 | 東京 / ニューヨーク |
| ペインポイント | 首・肩こり。瞑想は続かなかった。テキスト指示だと迷子になる |
| 目標 | 5分で体の緊張をほぐしたい。毎日のルーティンにしたい |
| TikTok行動 | #somatichealing をフォロー。動画で効果を確信済み |
| 支払い意欲 | 月$10まで。価格透明性がないアプリは信用しない |

### Persona B: Mike（健康意識が高い会社員）

| 項目 | 値 |
|------|-----|
| 年齢 | 41歳 |
| 職業 | 金融 / オフィスワーカー |
| 住所 | シカゴ |
| ペインポイント | 慢性ストレス、睡眠の質低下。NEUROFIT は複雑すぎた |
| 目標 | シンプルに毎日できる神経系リセット |
| 行動 | App Store で検索。レビューとスクショを重視 |
| 支払い意欲 | 年額プランで長期コミット OK。"Cancel anytime" が条件 |

---

## 2. Information Architecture

```
SomaticFlow
├── Launch
│   ├── [新規] Onboarding Flow (F-001)
│   │   ├── Step 1: Welcome / Stress Level
│   │   ├── Step 2: Goal Selection
│   │   ├── Step 3: Pain Point
│   │   ├── Step 4: Notification Permission
│   │   └── Step 5: Paywall (F-006) ← Rule 20: ソフトペイウォール
│   └── [リターン] MainTabView
│
├── Tab 1: Today (ProgramView) [F-002]
│   └── ExerciseSessionView (F-003)
│       ├── ExerciseAnimationView
│       └── TimerView
│
├── Tab 2: Library (LibraryView) [F-008]
│   └── ExerciseDetailView (F-003)
│
├── Tab 3: Progress (ProgressView) [F-005]
│   └── StreakDashboardView
│
└── Tab 4: Settings (SettingsView) [F-010]
    ├── NotificationSettingView
    └── [→ Upgrade →] PaywallView (F-006)
```

---

## 3. Navigation Structure

Source: [Apple HIG: Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) — 「Use a tab bar to give people access to the top-level sections of your app.」

### Tab Bar

| Tab Index | Label | SF Symbol | Screen | Feature |
|-----------|-------|-----------|--------|---------|
| 0 | Today | `figure.mind.and.body` | ProgramView | F-002 |
| 1 | Library | `books.vertical.fill` | LibraryView | F-008 |
| 2 | Progress | `chart.bar.fill` | ProgressView | F-005 |
| 3 | Settings | `gearshape.fill` | SettingsView | F-010 |

### Navigation Stack

| 親画面 | 遷移先 | 方法 | 条件 |
|--------|--------|------|------|
| ProgramView | ExerciseSessionView | Push | タップ |
| LibraryView | ExerciseSessionView | Push | タップ |
| ExerciseSessionView | ProgressView | Pop + Tab切替 | 完了後 |
| SettingsView | PaywallView | Sheet | 「Upgrade」タップ |
| OnboardingView | PaywallView | 次画面（同フロー内） | Step 4完了後 |
| PaywallView | MainTabView | Dismiss | 購入完了 or Maybe Later |

---

## 4. Screen Inventory

| Screen ID | Name | Tab | Feature | Description |
|-----------|------|-----|---------|-------------|
| SCR-001 | OnboardingContainerView | — | F-001 | 5ステップオンボーディングコンテナ |
| SCR-002 | StressLevelView | — | F-001 | ストレスレベル選択（1–5） |
| SCR-003 | GoalSelectionView | — | F-001 | 目標選択（多選択） |
| SCR-004 | PainPointView | — | F-001 | ペインポイント選択（多選択） |
| SCR-005 | NotificationPermissionView | — | F-001/F-004 | 通知許可リクエスト |
| SCR-006 | PaywallView | — (Sheet) | F-006 | ソフトペイウォール（Rule 20） |
| SCR-007 | MainTabView | — | — | タブバーコンテナ |
| SCR-008 | ProgramView | Today(0) | F-002 | 7日間プログラム一覧 |
| SCR-009 | ExerciseSessionView | — | F-003 | エクサイズセッション（アニメ+タイマー） |
| SCR-010 | ExerciseAnimationView | — | F-003 | SwiftUIアニメーション図解 |
| SCR-011 | TimerView | — | F-003 | カウントダウンタイマー |
| SCR-012 | LibraryView | Library(1) | F-008 | 25+エクサイズライブラリ |
| SCR-013 | ProgressView | Progress(2) | F-005 | 進捗サマリー |
| SCR-014 | StreakDashboardView | — | F-005 | ストリーク詳細ダッシュボード |
| SCR-015 | SettingsView | Settings(3) | F-010 | 設定・サブスク管理 |

---

## 5. Wireframes

### SCR-006: PaywallView（ソフトペイウォール）

Source: [Adapty iOS Paywall Guide 2026](https://adapty.io/blog/how-to-design-ios-paywall/) — 「Long-form paywall with benefits + FAQ + social proof can drive up to 12× revenue.」
Source: [Funnelfox Paywall Design 2025](https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/) — 「Consistent messaging from ad to onboarding to paywall increases conversions.」

```
┌──────────────────────────────────────────┐
│  [xmark] Maybe Later              [top]  │ ← accessibilityIdentifier: "paywall_close"
│                                          │
│     ✦ Unlock SomaticFlow ✦              │
│    Daily Nervous System Reset            │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ ⭐ "2,000+ users resetting their │   │
│  │  nervous system daily"           │   │  ← Social Proof (Rule 20.6)
│  └──────────────────────────────────┘   │
│                                          │
│  ✓ Animation-guided exercises           │
│  ✓ CoreHaptics rhythm cues              │
│  ✓ Daily streak + progress tracking     │
│  ✓ 25+ exercises + 30-day program       │
│  ✓ Daily reminder at your time         │
│                                          │
│  ╔════════════════╗  ╔═══════════════╗  │
│  ║  Monthly       ║  ║ Annual  ✦BEST ║  │  ← PricingCard x2
│  ║  $7.99/mo      ║  ║ $29.99/yr     ║  │
│  ║                ║  ║  Save 69%     ║  │  ← Discount Badge (Rule 20.3)
│  ╚════════════════╝  ╚═══════════════╝  │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Trial Timeline Visualization    │   │  ← (Rule 20.4)
│  │  Today → Day 7: Free Trial       │   │
│  │  Day 8: $29.99/yr billing starts │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ╔══════════════════════════════════╗   │
│  ║  Try all features free for 7 days║   │  ← CTA (Rule 20.2, 20.4)
│  ╚══════════════════════════════════╝   │  ← accessibilityIdentifier: "paywall_cta_button"
│                                          │
│  Cancel anytime • No commitment         │  ← Risk Removal (Rule 20.7)
│                                          │
│  Privacy Policy | Terms of Service      │
└──────────────────────────────────────────┘
```

### SCR-009: ExerciseSessionView

```
┌──────────────────────────────────────────┐
│  [←] Day 1: Ground Your Feet     [share] │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │     ExerciseAnimationView        │   │  ← SCR-010: SwiftUI アニメーション
│  │     (breathe / shake / ground)   │   │    accessibilityIdentifier: "exercise_animation"
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│       ⏱ 04:23 remaining                 │  ← TimerView
│       ━━━━━━━━━━━━━━━━━━━░░░            │    accessibilityIdentifier: "exercise_timer"
│                                          │
│  Step 2/4: Feel the weight of your feet │
│  into the ground...                      │
│                                          │
│  ╔══════════════════════════════════╗   │
│  ║           Next Step             ║   │  ← accessibilityIdentifier: "exercise_next_button"
│  ╚══════════════════════════════════╝   │
│                                          │
│         [Pause] [Complete Early]        │
└──────────────────────────────────────────┘
```

### SCR-008: ProgramView

```
┌──────────────────────────────────────────┐
│  Good morning, keep going! 🌿            │
│  🔥 3-day streak                         │  ← accessibilityIdentifier: "streak_badge"
│                                          │
│  ┌── Today's Exercise ──────────────┐   │
│  │  Day 3: Shake It Out             │   │
│  │  5 min · Beginner · Grounding    │   │  ← accessibilityIdentifier: "today_exercise_card"
│  │                    [→ Start]     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Week 1 Progress                         │
│  Day 1 ✓  Day 2 ✓  Day 3 ◉  Day 4-7 ○  │
│                                          │
│  ┌── Up Next ────────────────────────┐  │
│  │  Day 4: Body Scan (Premium 🔒)    │  │  ← Premium lock indicator
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 6. Onboarding Flow

Source: [Appagent Paywall 2024](https://appagent.com/blog/mobile-app-onboarding-5-paywall-optimization-strategies/) — 「Paywall placement immediately after onboarding achieves 100% visibility rate.」
Source: [Adapty Progressive Disclosure](https://adapty.io/blog/how-to-design-ios-paywall/) — 「Duolingo eases users in with value screen before revealing price.」

### フロー全体図

```
App Launch (新規)
      ↓
[SCR-002] Stress Level (Step 1/5)
  "How stressed do you feel right now?"
  Option: 1(Low) to 5(High) — Slider
  accessibilityIdentifier: "onboarding_stress_slider"
      ↓ Next
[SCR-003] Goal Selection (Step 2/5)
  "What do you want to achieve?"
  Multi-select chips:
  - "Reduce daily stress" / "Better sleep" / "Release trauma"
  - "Improve focus" / "Build daily routine"
  accessibilityIdentifier: "onboarding_goal_chip_{id}"
      ↓ Next
[SCR-004] Pain Point (Step 3/5)
  "Where do you feel tension?"
  Multi-select body map:
  - "Neck & shoulders" / "Lower back" / "Jaw" / "Chest" / "Hips"
  accessibilityIdentifier: "onboarding_pain_chip_{id}"
      ↓ Next
[SCR-005] Notification Permission (Step 4/5)
  "Set your daily reminder"
  Time picker (default 09:00)
  [Enable Reminders] → requestAuthorization()
  [Skip for now] → skip
  accessibilityIdentifier: "onboarding_notif_enable_button"
      ↓ Next
[SCR-006] PaywallView (Step 5/5) — SOFT PAYWALL (Rule 20)
  [xmark] Maybe Later 必須
  → Purchase: MainTabView
  → Maybe Later: MainTabView (Free Tier)
  accessibilityIdentifier: "paywall_close" / "paywall_cta_button"
```

### オンボーディングルール（Rule 20 準拠）

| ルール | 実装 |
|--------|------|
| ペイウォールはオンボーディング直後に必ず表示 | Step 5 = PaywallView（スキップ不可の表示、閉じるは可） |
| ハードゲート禁止 | Maybe Later タップで Free Tier に遷移 |
| Benefit-Driven CTA | "Try all features free for 7 days"（"Subscribe"禁止） |
| Progressive Disclosure | Step 1-4で価値を提示 → Step 5で価格表示 |

---

## 7. Accessibility (accessibilityIdentifier)

Source: [Maestro Testing Docs](https://maestro.mobile.dev/) — 「Use accessibilityIdentifier for reliable element targeting in tests.」

| accessibilityIdentifier | Screen | Element | Maestro Usage |
|------------------------|--------|---------|--------------|
| `onboarding_stress_slider` | SCR-002 | Slider | ✅ onboarding flow |
| `onboarding_goal_chip_{n}` | SCR-003 | Goal chip | ✅ onboarding flow |
| `onboarding_pain_chip_{n}` | SCR-004 | Pain chip | ✅ onboarding flow |
| `onboarding_notif_enable_button` | SCR-005 | Enable button | ✅ onboarding flow |
| `onboarding_notif_skip_button` | SCR-005 | Skip button | ✅ onboarding flow |
| `paywall_close` | SCR-006 | xmark button | ✅ payment-failure + onboarding |
| `paywall_cta_button` | SCR-006 | CTA button | ✅ payment-monthly, payment-annual |
| `paywall_monthly_card` | SCR-006 | Monthly card | ✅ payment-monthly |
| `paywall_annual_card` | SCR-006 | Annual card | ✅ payment-annual |
| `paywall_restore_button` | SCR-006 | Restore button | ✅ payment flow |
| `today_exercise_card` | SCR-008 | Today card | ✅ timer flow |
| `streak_badge` | SCR-008 | Streak badge | ✅ progress flow |
| `exercise_animation` | SCR-010 | Animation view | ✅ timer flow |
| `exercise_timer` | SCR-009 | Timer label | ✅ timer flow |
| `exercise_next_button` | SCR-009 | Next button | ✅ timer flow |
| `exercise_complete_button` | SCR-009 | Complete button | ✅ timer flow |
| `library_exercise_list` | SCR-012 | Exercise list | ✅ settings flow |
| `progress_streak_label` | SCR-013 | Streak label | ✅ progress flow |
| `settings_upgrade_button` | SCR-015 | Upgrade button | ✅ settings flow |
| `settings_notification_time` | SCR-015 | Notif time picker | ✅ settings flow |

---

## 8. Interaction Patterns

| Pattern | Trigger | Action | Feedback |
|---------|---------|--------|---------|
| Swipe Left | オンボーディング各Step | 次のステップへ | スライドアニメーション |
| Tap | エクサイズカード | ExerciseSessionView にPush | タップフィードバック |
| Long Press | エクサイズカード | プレビューシートを表示 | ハプティクス（light） |
| Pull to Refresh | ProgramView | 進捗データ再読み込み | ローディングインジケータ |
| Shake (via Haptics) | 筋膜リリース種別エクサイズ | CoreHaptics振動フィードバック | パターン振動 |
| Timer Complete | ExerciseSessionView | 完了アニメーション → Pop | チェックマーク + success haptic |

---

## 9. Localization Notes

Source: [Apple HIG: Localization](https://developer.apple.com/design/human-interface-guidelines/localization) — 「Ensure your UI accommodates the longer text lengths common in translated languages.」

| 項目 | en-US | ja | 対策 |
|------|-------|-----|------|
| 文字数比率 | 1.0x（基準） | 0.6x（短い） | ja は余白が増える。中央揃えで対応 |
| フォント | San Francisco (SF) | Hiragino Sans（システムフォント） | SwiftUI `.font(.body)` が自動選択 |
| 数字フォーマット | $7.99 | ¥1,300（App Store 換算） | RevenueCat の `localizedPriceString` 使用 |
| 日付フォーマット | "Day 3 of 7" | "7日間プログラム 3日目" | `Localizable.xcstrings` にキー定義 |
| RTL対応 | — | 不要（jaはLTR） | — |
| ストリーク表示 | "🔥 3-day streak" | "🔥 3日連続" | Key: `streak.label` |
| 通知テキスト | "Time for your somatic reset!" | "今日もソマティックリセットの時間です！" | Key: `notif.body` |
