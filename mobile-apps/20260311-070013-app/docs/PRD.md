# Product Requirements Document: SomaticFlow

Source: [Perforce SRS Best Practices](https://www.perforce.com/blog/alm/how-write-software-requirements-specification-srs-document) — 「A Software Requirements Specification (SRS) document describes what the software will do and how it will work.」
Source: [ProductPlan PRD Guide](https://www.productplan.com/glossary/product-requirements-document/) — 「A PRD defines the product you are building and is the source of truth for all stakeholders.」

---

## 1. App Overview

| フィールド | 値 |
|-----------|-----|
| **app_name** | SomaticFlow |
| **bundle_id** | com.aniccafactory.somaticflow |
| **app_title_aso** | Somatic Exercises - SomaticFlow |
| **subtitle** | Daily Nervous System Reset |
| **one_liner** | 毎日5分のソマティックエクサイズで、体に溜まった緊張とトラウマを穏やかに解放するガイドアプリ |
| **platform** | iOS 17+ |
| **category** | Health & Fitness |
| **age_rating** | 4+ |
| **sku** | somaticflow-001 |
| **locales** | en-US (primary), ja (secondary) |

---

## 2. Target User

**ICP (Ideal Customer Profile):** 25–45歳のデスクワーカー。慢性ストレス・不安を抱え、ヨガ・瞑想を試みたが続かなかった人。TikTokで #somatichealing を視聴して興味を持った。

| 項目 | 値 |
|------|-----|
| 年齢 | 25–45歳 |
| 職業 | IT・金融・医療・教育のデスクワーカー |
| 性別 | 女性60%、男性40% |
| 居住地 | 都市部（US primary, JP secondary） |
| ペインポイント | 慢性ストレス・首肩こり・睡眠障害・不安感 |
| 行動 | TikTok #somatichealing 視聴。健康アプリに月$10–30の支払い実績あり |
| 特徴 | ヨガ・瞑想を試みたが続かなかった。ビジュアルガイドを求める |

Source: [ADAA: Anxiety Statistics](https://adaa.org/understanding-anxiety/facts-statistics) — 「Anxiety disorders affect 40M adults in the US — 18.1% of the population」
Source: [APA: Workplace Stress 2023](https://www.apa.org/topics/healthy-workplaces/work-stress) — 「83% of US workers suffer from work-related stress」

---

## 3. Problem Statement

**Core Problem:** デスクワーカーは日々の精神的・身体的ストレスを体に蓄積するが、ソマティックエクサイズ（体性感覚運動）は既存アプリでは「テキストのみ・UI複雑・不透明課金」により97%が継続できない。

### Why Existing Solutions Fail

| 競合 | レビュー数 | 主な失敗点 | ユーザーの声 |
|------|-----------|-----------|------------|
| Somatic Exercises (6480121385) | 297★4.74 | テキスト指示のみ、キャンセル不可 | 「No video or sound — text-only impossible to follow」 |
| NEUROFIT (1630278170) | 652★4.79 | HRV測定必須・複雑なUI | 「Too complicated for daily use」 |
| Embody (6745105789) | 15★4.73 | コンテンツ量不足 | 実質競合なし |
| Somatic Health (1524733232) | 76★4.42 | UI崩壊・更新停止 | 「App looks abandoned」 |
| Settle (2025年新規) | 51★- | 新規参入、機能未成熟 | — |

Source: iTunes Search API — `https://itunes.apple.com/search?term=somatic+exercises&media=software&entity=software&limit=10&country=us`

**Gap in Market:** ビジュアルアニメーション + シンプルタイマー + 明確な価格表示で毎日継続できるソマティックエクサイズ専用アプリが存在しない。

---

## 4. Goals & Success Metrics

| KPI | Target (6ヶ月) | 計測方法 |
|-----|--------------|---------|
| App Store Rating | ≥ 4.5★ | App Store Connect |
| Monthly Active Users | 2,000+ | UserDefaults session count |
| Trial-to-Paid Conversion | ≥ 5% | RevenueCat Dashboard |
| Day-7 Retention | ≥ 30% | UserDefaults streak data |
| Annual Plan Ratio | ≥ 40% | RevenueCat Dashboard |
| Monthly Revenue | ≥ $650/月 | RevenueCat |

Source: [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — 「H&F apps with annual plans see 20% higher LTV」

---

## 5. Solution Overview

SomaticFlow はアニメーション図解 + CoreHaptics 振動 + タイマーで、テキスト不要・初日から1人でできるソマティックエクサイズルーティンを提供する。7日間入門プログラムから始め、25+ エクサイズライブラリへアクセス。オンボーディング直後にソフトペイウォールを表示（Maybe Later で閉じれる）。完全ローカル・静的コンテンツで外部API不要。

---

## 6. MVP Features

| Feature ID | Feature | Priority | Description |
|-----------|---------|----------|-------------|
| F-001 | オンボーディング（5ステップ） | P0 | ストレスレベル/目標/ペインポイント/通知許可/ソフトペイウォール |
| F-002 | 7日間入門プログラム | P0 | 静的JSONコンテンツ。1日1エクサイズ（5分） |
| F-003 | エクサイズセッション画面 | P0 | SwiftUI アニメーション図解 + カウントダウンタイマー + CoreHaptics 振動キュー |
| F-004 | 毎日リマインダー通知 | P0 | UserNotifications。オンボーディングで許可取得 |
| F-005 | 進捗ストリーク | P0 | UserDefaults。連続日数 + 完了バッジ |
| F-006 | ソフトペイウォール | P0 | オンボーディング直後。Maybe Later で閉じれる（Rule 20） |
| F-007 | 無料 3 エクサイズ（Free Tier） | P0 | Day 1–3 のみアンロック |
| F-008 | 25+ エクサイズライブラリ | P1 | Premium。静的JSON コンテンツ |
| F-009 | 30日間プログラム | P1 | Premium。静的JSONコンテンツ |
| F-010 | 設定画面 | P1 | 通知時間変更、サブスク管理、プライバシーポリシーリンク |

Feature ID は IMPLEMENTATION_GUIDE.md Phase Breakdown と 1:1 対応。

---

## 7. User Stories

| ID | As a | I want to | So that |
|----|------|-----------|---------|
| US-A | 初心者ユーザー | 初日にソマティックエクサイズを正しく行う | テキストを読まなくてもアニメーションで動きが分かる |
| US-B | 毎日継続したいユーザー | 毎朝リマインド通知を受ける | 忘れずにルーティンを実行できる |
| US-C | 進捗を確認したいユーザー | ストリーク日数を見る | 継続のモチベーションを維持できる |
| US-D | 価格を確認したいユーザー | 透明なサブスク価格を見る | 課金前に全費用を把握できる |
| US-E | Premium に興味があるユーザー | 7日間無料トライアルを開始する | リスクなしで全機能を試せる |
| US-F | Maybe Later ユーザー | ペイウォールを閉じる | 無料プランで継続できる |

---

## 8. Monetization

### Subscription Plans

| プラン | 価格 | コンテンツ | RevenueCat Package ID |
|--------|------|----------|----------------------|
| Free | $0 | F-007: Day 1–3 のみ（3エクサイズ） | — |
| Monthly | **$7.99/月** | 全機能（F-001〜F-010） | `com.aniccafactory.somaticflow.monthly` |
| Annual | **$29.99/年** | 全機能 + 優先更新 + **7日間無料トライアル** | `com.aniccafactory.somaticflow.annual` |

- **trial_days:** 7（Annual のみ）
- **free_tier_limit:** 3 exercises/all time（Day 1–3 固定）
- Annual saves: **69%** vs Monthly × 12（$95.88 比）
- 週換算: Monthly $2.00/週、Annual $0.58/週

Source: [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — 「H&F median: $7.73/mo, $29.65/yr」
Source: [Jake Mor Pricing #17](https://www.jake-mor.com/) — 「Two-product strategy: trial-less monthly + trialed annual at 50%+ apparent discount」

### Paywall Design Best Practices

Source: https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/
Source: https://adapty.io/blog/how-to-design-ios-paywall/
Source: https://appagent.com/blog/mobile-app-onboarding-5-paywall-optimization-strategies/

| Element | Requirement | Rule |
|---------|------------|------|
| Paywall Placement | オンボーディング直後（100% visibility rate） | Rule 20 |
| CTA | "Start my journey free" / "Unlock SomaticFlow"（generic "Subscribe" 禁止） | Rule 20.2 |
| Discount Badge | "Save 69%" バッジ + Annual 推奨強調 | Rule 20.3 |
| Trial Copy | "Try all features free for 7 days"（"Start 7-day trial" 禁止） | Rule 20.4 |
| Maybe Later | 必須。ソフトペイウォール（ハードゲート禁止） | Rule 20 |
| Risk Removal | "Cancel anytime" + "No commitment" をCTA近くに配置 | Rule 20.7 |
| RC-UI library | **禁止**。自前 SwiftUI PaywallView のみ | Rule 20 |

---

## 9. Market Context

**TAM/SAM/SOM サマリー:** TAM（ボトムアップ）$18.7M、SAM $4.3M（US iOS 57% × 勝てる確率45%）、SOM Year3 $8.6K（720有料ユーザー @ $12/年ARPU）。POEM スコア 21/25（Strong Opportunity）。

**競合差別化ポイント:** CoreHaptics 振動フィードバック + SwiftUI アニメーション図解 + ソフトペイウォール（全競合が未使用またはハードゲート）。最大競合 297 reviews = 極めて低競合。

Source: iTunes Search API（直接競合レビュー数集計）

---

## 10. Privacy & Compliance

| 項目 | 値 |
|------|-----|
| データ収集 | なし（ローカルのみ） |
| UserDefaults | 進捗・ストリーク・設定（CA92.1 Required Reason 申告必須） |
| ATT | **禁止**（Rule 20b） — AppTrackingTransparency 不使用 |
| behavioral tracking SDK | **禁止**（Rule 17） — 第三者トラッキングSDK一切不使用 |
| AI API | **禁止**（Rule 23） — クラウドAI / オンデバイスML 一切不使用 |
| PrivacyInfo | PrivacyInfo.xcprivacy — NSPrivacyAccessedAPICategoryUserDefaults CA92.1 |
| Encryption | ITSAppUsesNonExemptEncryption = NO |

---

## 11. Localization

| 言語 | ロケール | 優先度 | 理由 |
|------|---------|--------|------|
| English | en-US | Primary | iOS US市場 57% シェア |
| Japanese | ja | Secondary | iOS JP市場 68% シェア |

---

## 12. Technical Constraints

| Rule | 制約 | 詳細 |
|------|------|------|
| Rule 17 | 行動トラッキング SDK 禁止 | 第三者トラッキング SDK 一切不可。Greenlight が検出 = CRITICAL |
| Rule 20 | 自前 SwiftUI PaywallView 必須 | `Purchases.shared.purchase(package:)` 使用。RC-UI library 禁止 |
| Rule 20b | ATT 禁止 | AppTrackingTransparency / NSUserTrackingUsageDescription 不使用 |
| Rule 23 | AI API 禁止 | クラウドAI API / オンデバイスML (iOS 26+) 一切禁止 |
| iOS 17+ | 最小ターゲット | iOS 15/16 互換 API 不使用 |
| 完全自己完結 | バックエンドなし | 静的コンテンツ（exercises.json）のみ。外部APIコストゼロ |

---

## 13. Out of Scope

| 機能 | 理由 |
|------|------|
| Dynamic Island / Live Activities | WidgetKit Extension = Maestro E2E テスト困難 |
| WidgetKit Widgets | Extension Target = ビルド複雑化 |
| HealthKit 連携 | 権限管理複雑・審査追加説明必要 |
| カメラ / マイク | プライバシー審査強化 |
| Sign in with Apple | Maestro E2E 自動化不可 |
| CoreData / CloudKit | UserDefaults で十分 |
| 動画コンテンツ | バイナリサイズ 100MB+ 超過 |
| LLM / AI サービス | Rule 23 — コスト発生 |
| コミュニティ / ソーシャル | v1.1 候補 |

---

## 14. App Store Metadata

### en-US

| 項目 | 値 |
|------|-----|
| **App Name** | Somatic Exercises - SomaticFlow |
| **Subtitle** | Daily Nervous System Reset |
| **Keywords** | somatic exercises,nervous system reset,trauma release,stress relief body,body tension release,vagus nerve exercises,daily wellness routine,anxiety relief,somatic healing,body scan |
| **Promotional Text** | Finally, somatic exercises that actually make sense. Animation-guided routines in 5 minutes a day — no video, no complexity. |
| **Description** | SomaticFlow guides you through daily somatic exercises with SwiftUI animations and haptic feedback — no text instructions needed.\n\nBacked by research on how the body stores and releases tension, SomaticFlow makes nervous system reset accessible to everyone.\n\n**What you'll do:**\n• Follow animated exercise guides — no reading required\n• Feel the rhythm with gentle haptic cues\n• Build a daily streak starting with Day 1\n• Get reminded at your chosen time each day\n\n**Free includes:** 3 somatic exercises (7-day intro, Day 1–3)\n**Premium includes:** 25+ exercises, 7-day + 30-day programs, full progress dashboard\n\nSubscription: $7.99/month or $29.99/year (7-day free trial on annual). Cancel anytime. |

### ja

| 項目 | 値 |
|------|-----|
| **App Name** | ソマティックエクサイズ - SomaticFlow |
| **Subtitle** | 毎日の神経系リセット |
| **Keywords** | ソマティックエクサイズ,神経系リセット,トラウマ解放,ストレス解消,体の緊張解放,迷走神経,ウェルネス習慣,不安解消,ソマティックヒーリング,ボディスキャン |
| **Promotional Text** | ついに、本当に使えるソマティックエクサイズアプリ。アニメーション図解で5分のルーティン — テキスト不要、複雑さゼロ。 |
| **Description** | SomaticFlowは、SwiftUIアニメーションとハプティクス振動で、毎日のソマティックエクサイズをガイドします — テキスト指示は不要です。\n\n体が緊張とトラウマを蓄積・解放する仕組みを研究に基づき、神経系リセットを誰にでもアクセスしやすくします。\n\n**できること:**\n• アニメーション図解でエクサイズをフォロー — 読まなくていい\n• 優しい振動キューでリズムを感じる\n• Day 1からストリークを積み上げる\n• 毎日好きな時間にリマインド\n\n**無料:** ソマティックエクサイズ3種（7日間プログラム Day 1–3）\n**プレミアム:** 25以上のエクサイズ、7日間+30日間プログラム、進捗ダッシュボード\n\nサブスク: 月額¥1,300 または 年額¥4,900（年額は7日間無料トライアル）。いつでもキャンセル可。 |
