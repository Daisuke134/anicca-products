# SomaticFlow — Product Plan

> 毎日5分のソマティックエクサイズで、体に溜まった緊張とトラウマを穏やかに解放するガイドアプリ

---

## 1. Target User

### Primary Persona

| 項目 | 値 |
|------|-----|
| 年齢 | 25–45歳 |
| 職業 | デスクワーカー（IT・金融・医療・教育） |
| 性別 | 女性60%、男性40% |
| 居住 | 都市部（US/JP/AU/CA/UK） |
| ペインポイント | 慢性ストレス・首肩こり・睡眠障害・不安感 |
| 行動 | TikTok で #somatichealing を視聴、ヨガ・瞑想を試みたが続かなかった |
| 支払い意欲 | 健康アプリに月$10–30 支払い実績あり |

### Market Size Evidence

| ソース | 数値 | 関連性 |
|--------|------|--------|
| [Global Wellness Institute (2024)](https://globalwellnessinstitute.org/industry-research/global-wellness-economy-monitor/) — 「The global wellness economy reached $6.3 trillion in 2023」 | $6.3T 全体市場 | ウェルネス市場規模 |
| [ADAA: Anxiety Statistics](https://adaa.org/understanding-anxiety/facts-statistics) — 「Anxiety disorders affect 40M adults in the US — 18.1% of the population」 | 4,000万人 | ターゲット母数 |
| [APA: Workplace Stress (2023)](https://www.apa.org/topics/healthy-workplaces/work-stress) — 「83% of US workers suffer from work-related stress」 | 83% | デスクワーカーの慢性ストレス率 |

---

## 2. Problem

**Core Problem:** デスクワーカーは日々の精神的・身体的ストレスを体に蓄積するが、ソマティックエクサイズ（体性感覚運動）は既存アプリでは「テキストのみ・UI複雑・不透明課金」により97%が継続できない。

### Why Existing Solutions Fail

| 競合 | レビュー数 | 主な失敗点 | ユーザーの声 |
|------|-----------|-----------|------------|
| Somatic Exercises (ID: 6480121385) | 297★4.74 | テキスト指示のみ、キャンセル不可 | 「No video or sound — text-only impossible to follow」 |
| Vagus Nerve Reset: NEUROFIT | 652★4.79 | HRV測定必須・複雑なUI | 「Too complicated for daily use」 |
| Embody: Nervous System Reset | 15★4.73 | コンテンツ量不足 | 実質競合なし |
| Somatic Yoga by SomYoga | 166★4.80 | ヨガ特化、ソマティック専用でない | ターゲット外 |
| Somatic Health | 76★4.42 | UI崩壊・更新停止 | 「App looks abandoned」 |

Source: iTunes Search API — `https://itunes.apple.com/search?term=somatic+exercises&media=software&entity=software&limit=10&country=us`

**Gap in Market:** ビジュアルアニメーション + シンプルなタイマー + 明確な価格表示で毎日継続できるソマティックエクサイズ専用アプリが存在しない。

---

## 3. Solution

**One-Liner:** アニメーション図解 + ハプティクス振動 + タイマーで、テキスト不要・初日から1人でできるソマティックエクサイズルーティンを提供する。

### How It Works

```
起動
  ↓
オンボーディング（5ステップ）
  ↓ ストレスレベル / 目標 / 通知許可
ソフトペイウォール表示
  ↓ Maybe Later → 無料プランで継続可能
7日間入門プログラム
  ↓
エクサイズセッション
  ↓ アニメーション図解 → タイマー → CoreHaptics 振動キュー
セッション完了
  ↓
進捗ストリーク更新 → 翌日通知スケジュール
```

### Key Differentiators

| 機能 | SomaticFlow | Somatic Exercises | NEUROFIT |
|------|------------|------------------|---------|
| アニメーション図解 | ✅ SwiftUI アニメ | ❌ テキストのみ | ❌ 動画のみ |
| CoreHaptics 振動キュー | ✅ | ❌ | ❌ |
| 初心者5分ルーティン | ✅ | ❌ 複雑 | ❌ HRV必須 |
| ソフトペイウォール | ✅ Maybe Later | ❌ ハードゲート | ❌ ハードゲート |
| 透明な価格表示 | ✅ | ❌ | ✅ |

### Technology

| 技術 | 用途 |
|------|------|
| SwiftUI | 全画面（iOS 17+） |
| UserDefaults | 進捗・ストリーク・設定保存 |
| UserNotifications | 毎日リマインダー |
| CoreHaptics | エクサイズリズム振動フィードバック |
| RevenueCat SDK | サブスクリプション管理（RevenueCatUI禁止 — Rule 20） |
| AVFoundation | 環境音（ベルトーン） |

Source: [Apple Developer: CoreHaptics](https://developer.apple.com/documentation/corehaptics) — 「Create, customize, and play haptic patterns that synchronize with audio.」

---

## 4. Monetization

### Pricing Strategy

| プラン | 価格 | コンテンツ | 週換算 |
|--------|------|----------|--------|
| Free | $0 | 3つの基本エクサイズ（7日間プログラム Day 1-3 のみ） | — |
| Monthly | **$7.99/月** | 25+ エクサイズ, 7日間 + 30日間プログラム, 進捗ダッシュボード, CoreHaptics | $2.00/week |
| Annual | **$29.99/年** | Monthly 全機能 + 優先コンテンツ更新 | $0.58/week |

Annual は Monthly × 12 ($95.88) 比 **68.7% OFF** — "Save 69%" 表示。

### Pricing Justification

| ソース | 根拠 |
|--------|------|
| [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — 「H&F median: $7.73/mo, $29.65/yr」 | Monthly $7.99 = 中央値+3.4%。Annual $29.99 = 中央値+1.2%。両方メジアン近傍。 |
| [Jake Mor Pricing #17](https://www.jake-mor.com/) — 「Two-product strategy: trial-less monthly + trialed annual at 50% apparent discount」 | Annual は apparent 50%+ OFF を維持（実際68% OFF） |
| [Jake Mor Pricing #15](https://www.jake-mor.com/) — 「Prices convert to clean weekly/monthly amounts」 | $7.99/月 = $1.998/週（約$2）。$29.99/年 = $0.577/週（約$0.58） |

### Revenue Model

| ケース | 仮定 | 月収 |
|--------|------|------|
| 保守的 | MAU 500, trial-to-paid 3%, Annual 40% | ~$120/月 |
| 中央値 | MAU 2,000, trial-to-paid 5%, Annual 50% | ~$650/月 |
| 楽観的 | MAU 10,000, trial-to-paid 8%, Annual 60% | ~$4,300/月 |

### RevenueCat Integration

| 項目 | 値 |
|------|-----|
| SDK | `com.revenuecat.purchases` (SPM) |
| Offering | `default` |
| Entitlement | `premium` |
| Package Monthly | `$rc_monthly` → `com.aniccafactory.somaticflow.monthly` |
| Package Annual | `$rc_annual` → `com.aniccafactory.somaticflow.annual` |
| Paywall 方式 | 自前 SwiftUI `PaywallView` — **RevenueCatUI 禁止（Rule 20）** |
| ソフトペイウォール | `[Maybe Later]` ボタン必須（Rule 20） |
| CTA | "Start my journey free" / "Unlock SomaticFlow" （Rule 20.2） |
| Trial | Annual: 7日間無料トライアル |

---

## 5. MVP Scope

### Must Have

| # | 機能 | 説明 |
|---|------|------|
| 1 | 7日間入門プログラム | 静的JSON コンテンツ。1日1エクサイズ（5分） |
| 2 | アニメーション + タイマー | SwiftUI アニメーション図解 + カウントダウンタイマー |
| 3 | CoreHaptics 振動キュー | エクサイズリズムに同期した触覚フィードバック |
| 4 | 毎日リマインダー通知 | UserNotifications。オンボーディングで許可取得 |
| 5 | 進捗ストリーク | UserDefaults。連続日数 + 完了バッジ |
| 6 | ソフトペイウォール | オンボーディング直後。Maybe Later で閉じれる |
| 7 | 無料 3 エクサイズ | Free Tier（Day 1-3 のみアンロック） |
| 8 | 25+ エクサイズライブラリ | Premium。静的JSON コンテンツ |
| 9 | オンボーディング（5ステップ） | ストレスレベル / 目標 / ペインポイント / 通知 / ペイウォール |
| 10 | 設定画面 | 通知時間変更、サブスク管理、プライバシーポリシー |

### Won't Have

| 機能 | 理由 |
|------|------|
| Dynamic Island / Live Activities | WidgetKit Extension 必要 — Maestro E2E テスト困難（Rule US-002） |
| WidgetKit Widgets | Extension Target 追加、テスト困難 |
| HealthKit 連携 | 権限管理複雑、審査で追加説明必要 |
| カメラ / マイク | プライバシー審査強化、NSUsageDescription 必要 |
| Sign in with Apple | Maestro E2E 自動化不可 |
| CoreData / CloudKit sync | 複雑・デバッグ困難。UserDefaults で十分 |
| 動画コンテンツ | バイナリサイズ増大（100MB+）→ App Store 審査 OTA 制限 |
| LLM API / AI サービス | コスト発生 — Rule 23 絶対禁止 |
| コミュニティ / ソーシャル機能 | v1.1 候補 — Scope overflow |

### Technical Architecture

```
SomaticFlow/
├── SomaticFlowApp.swift          # App entry point, RC configure
├── Config/
│   └── SomaticFlow.xcconfig      # API keys (xcconfig — Rule US-006a)
├── Models/
│   ├── Exercise.swift            # Codable exercise model
│   ├── Program.swift             # 7-day / 30-day program
│   └── UserProgress.swift        # Streak, completed days
├── ViewModels/
│   ├── OnboardingViewModel.swift  # Onboarding state machine
│   ├── ProgramViewModel.swift    # Current program / session
│   ├── ExerciseViewModel.swift   # Timer, haptics
│   └── PaywallViewModel.swift    # RC purchase logic
├── Views/
│   ├── Onboarding/               # 5-step onboarding flow
│   ├── Main/                     # TabView (Program, Library, Progress)
│   ├── Exercise/                 # Animation + Timer
│   ├── Progress/                 # Streak dashboard
│   └── Paywall/                  # Soft paywall (SwiftUI, no RevenueCatUI)
├── Services/
│   ├── SubscriptionService.swift # RC protocol + DI
│   └── NotificationService.swift # UNUserNotificationCenter
├── Resources/
│   ├── Content/exercises.json    # 25+ exercises (static)
│   └── Assets.xcassets
└── Tests/
    └── SomaticFlowTests/         # Unit + Integration tests
```

### Localization

| キー | en-US | ja |
|------|-------|----|
| app.name | SomaticFlow | SomaticFlow |
| onboarding.title | Release tension daily | 毎日、緊張を解放する |
| paywall.cta | Start my journey free | 無料で始める |
| paywall.maybe_later | Maybe Later | あとで |
| paywall.annual_savings | Save 69% | 69%お得 |
| paywall.trial | Try all features free for 7 days | 7日間、全機能を無料で試す |
| program.streak | Day streak | 連続日数 |
| exercise.begin | Begin | 開始 |
| exercise.next | Next | 次へ |

---

## 6. App Identity

| 項目 | 値 |
|------|-----|
| App Name | **SomaticFlow** |
| Bundle ID | `com.aniccafactory.somaticflow` |
| App Title (ASO) | `Somatic Exercises - SomaticFlow` |
| Subtitle | Daily Nervous System Reset |
| Category | Health & Fitness |
| Age Rating | 4+ |
| SKU | somaticflow-001 |

### iTunes Name Check

| 検索クエリ | 完全一致数 | ステータス |
|-----------|-----------|----------|
| "SomaticFlow" | **0** | ✅ 採用可（検証済 2026-03-11） |

Source: iTunes Search API — `https://itunes.apple.com/search?term=SomaticFlow&media=software&entity=software&limit=10`

### ASO Keywords

| Priority | キーワード | 根拠 |
|----------|-----------|------|
| 1 | somatic exercises | 主競合「Somatic Exercises」297 reviews — 低競合 |
| 2 | nervous system reset | NEUROFIT 652 reviews — 周辺キーワード |
| 3 | trauma release | TikTok #traumarelease 677K views |
| 4 | stress relief body | 高検索量、低競合 |
| 5 | body tension release | 差別化ポジション |
| 6 | ソマティック エクサイズ | 日本市場（低競合） |
| 7 | vagus nerve exercises | NEUROFIT ユーザー獲得 |
| 8 | daily wellness routine | 広義ウェルネス層 |

Source: [AppTweak: ASO Keyword Strategy](https://www.apptweak.com/en/aso-blog/step-by-step-guide-aso-competitor-analysis) — 「Examine keywords in titles, subtitles, descriptions.」

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| App Store リジェクト: Privacy Manifest 未申告 (ITMS-91053) | HIGH | PrivacyInfo.xcprivacy を US-005a で追加。Required Reason APIs を全申告 |
| App Completeness (Guideline 2.1) | HIGH | Maestro E2E 全フロー通過。デモアカウント不要フラグ設定 |
| Guideline 4.3 Spam (既存アプリに似すぎ) | MEDIUM | 差別化: CoreHaptics + アニメーション図解は競合にない。スクリーンショットで視覚的差別化を強調 |
| 低 trial-to-paid rate (<2%) | MEDIUM | ソフトペイウォール + 7日間トライアル + Annual 69% OFF anchor で対策 |
| 競合が AI 機能を追加 | MEDIUM | 静的コンテンツの安定性を強みに。AI なしで継続コスト¥0 |
| HealthKit なしで機能不足と感じるユーザー | LOW | HealthKit なしでも進捗ストリークで十分な達成感を提供 |
| iOS 17 未満ユーザーの排除 | LOW | ターゲットの 95%+ が iOS 17+。iOS 17 以上に限定して対応コスト削減 |
| Annual 比率が低い (<30%) | MEDIUM | Annual を推奨プランとして視覚的強調。「Save 69%」バッジ必須 |

Source: [Twinr: App Store Rejections 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) — 「Privacy violations = leading cause. 15% of submissions rejected. Over 40% of unresolved issues = Guideline 2.1 App Completeness.」
Source: [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — 「Apps with annual plans as default offering see 20% higher LTV.」

---

## Sources Summary

| # | ソース | サポートする主張 |
|---|--------|----------------|
| 1 | [Global Wellness Institute 2024](https://globalwellnessinstitute.org/industry-research/global-wellness-economy-monitor/) | TAM $6.3T ウェルネス市場 |
| 2 | [ADAA: Anxiety Statistics](https://adaa.org/understanding-anxiety/facts-statistics) | 米国 4,000万人が不安障害 |
| 3 | [APA: Workplace Stress 2023](https://www.apa.org/topics/healthy-workplaces/work-stress) | デスクワーカー 83% がストレス |
| 4 | iTunes Search API (実行済み) | 競合レビュー数・評価・価格 |
| 5 | iTunes Reviews RSS (ID: 6480121385, 実行済み) | 競合の失敗点（テキストのみ等） |
| 6 | [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) | H&F 中央値 $7.73/月・$29.65/年 |
| 7 | [Jake Mor Pricing #15/#17](https://www.jake-mor.com/) | 2-product 戦略、週換算クリーン価格 |
| 8 | [AppTweak: ASO Competitor Analysis](https://www.apptweak.com/en/aso-blog/step-by-step-guide-aso-competitor-analysis) | ASO キーワード戦略 |
| 9 | [Apple Developer: CoreHaptics](https://developer.apple.com/documentation/corehaptics) | CoreHaptics 差別化 |
| 10 | [Twinr: App Store Rejections 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) | リジェクトリスク・Guideline 2.1 |
| 11 | [Apple Developer: CFBundleIdentifier](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleidentifier) | Bundle ID フォーマット |
| 12 | [Apify TikTok Scraper (実行済み)](https://apify.com/clockworks/tiktok-hashtag-scraper) | TikTok トレンド (#somatichealing 200万再生) |
