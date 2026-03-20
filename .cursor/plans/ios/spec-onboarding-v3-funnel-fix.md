# Spec: オンボーディング v3 — ファネル修正 & Mixpanelトラッキング正確化

> **目的:** 離脱率の高いステップを削除/修正し、購入フローを修復し、全ステップのMixpanelトラッキングを正確にする
> **参照:** `ios-app-onboarding` スキル、`.cursor/plans/ios/onboarding-paywall-best-practices.md`
> **ブランチ:** `feature/onboarding-v3` (dev から作成)
> **日付:** 2026-03-20
> **Mixpanelデータ期間:** 2026-03-13 ~ 03-20 (直近7日)

---

## 1. AS-IS（現状）

### 1.1 現状フロー図

```
PHASE 1: HOOK                PHASE 2: INVEST              PHASE 3: VALUE DEMO
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Welcome  │→│ Struggles│→│ Struggle │→│ Goals    │→│ Personal │→│ ValueProp│
│          │  │          │  │ Depth    │  │          │  │ Insight  │  │ 7日旅程  │
│ CTA+SIWA │  │ チップ選択│  │ 1タップ  │  │ チップ   │  │ ミラー   │  │ コミット │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
     34            27            23            23            23            23

PHASE 3(続)           PHASE 4              PHASE 5: CONVERT（3ステップペイウォール）
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Live     │→│ Notif    │→│ Paywall  │→│ Trial    │→│ Plan     │
│ Demo     │  │ 通知許可 │  │ Primer   │  │ Timeline │  │ Selection│
│ Nudge体験│  │          │  │ 価格なし │  │ Blinkist │  │ 購入CTA  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
     20            18            18            14           22(異常)

                                                    Plan Selection での分岐:
                                                    ┌─ 購入ボタン → purchase() → 成功: 0人 😱
                                                    ├─ "Maybe Later" → ドロワー表示(12人)
                                                    │   ├─ ドロワーCTA(3人) → plan selectionに戻るだけ(購入しない!)
                                                    │   └─ "Skip" → handlePaywallDismissedAsFree(9人)
                                                    └─ 何もせず離脱
```

### 1.2 現状 Mixpanelファネル（直近7日、34ユーザー）

| # | ステップ | Mixpanelイベント | 件数 | ステップ離脱率 | 累計残存率 |
|---|---------|-----------------|------|-------------|----------|
| 0 | オンボ開始 | `onboarding_started` | 34 | — | 100% |
| 1 | Welcome完了 | `onboarding_welcome_completed` | 27 | 🔴 **20.6%** | 79.4% |
| 2 | 悩み選択 | `onboarding_struggles_completed` | 23 | 🟡 14.8% | 67.6% |
| 3 | 悩みの深さ | `onboarding_struggle_depth_completed` | 23 | 0% | 67.6% |
| 4 | 目標選択 | `onboarding_goals_completed` | 23 | 0% | 67.6% |
| 5 | パーソナル洞察 | `onboarding_insight_completed` | 23 | 0% | 67.6% |
| 6 | 価値提案 | `onboarding_valueprop_completed` | 23 | 0% | 67.6% |
| 7 | ライブデモ | `onboarding_live_demo_completed` | 20 | 🟠 **13.0%** | 58.8% |
| 8 | 通知許可 | `onboarding_notifications_completed` | 18 | 🟡 10.0% | 52.9% |
| 9 | オンボ完了 | `onboarding_completed` | 18 | 0% | 52.9% |
| P0 | Paywall Primer | `paywall_primer_viewed` | 18 | 0% | 52.9% |
| P1 | Trial Timeline | `paywall_timeline_viewed` | 14 | 🟠 **22.2%** | 41.2% |
| P2 | プラン選択 | `paywall_plan_selection_viewed` | 22 | ⚠️ 異常(重複) | — |
| — | 購入完了 | `onboarding_paywall_purchased` | 0 | 🔴 **100%** | 0.0% |
| — | 無料スキップ | `onboarding_paywall_dismissed_free` | 9 | — | — |
| — | ドロワー表示 | `paywall_drawer_viewed` | 12 | — | — |
| — | ドロワーCTA | `paywall_drawer_converted` | 3 | — | — |

**変換率: 0.0% (目標: >10% DL→Trial)**

### 1.3 ペイウォール分岐の正確なフロー

Plan Selection画面 に到達した後の分岐を正確に図示する:

```
Plan Selection 画面
│
├─── [購入CTAボタン] ─────→ purchase() → RevenueCat API呼出
│                            ├─ 成功 → onboarding_paywall_purchased ✅ → 完了
│                            ├─ キャンセル → 何も起きない(画面に留まる)
│                            └─ エラー → errorMessage表示
│
├─── [Maybe Later] ──────→ onShowDrawer() → ドロワーがスライドアップ
│                            │
│                            ├─ [ドロワーCTA "Start Trial"] → paywall_drawer_converted
│                            │     → ドロワー閉じる → Plan Selection画面に**戻るだけ**
│                            │     → ❌ 購入は実行されない！ユーザーは再度購入CTAを押す必要あり
│                            │
│                            └─ [ドロワー "Skip"] → onSkip()
│                                  → handlePaywallDismissedAsFree()
│                                  → onboarding_paywall_dismissed_free → 無料で完了
│
└─── [背景タップ(ドロワー表示中)] → ドロワー閉じる → Plan Selection画面に留まる
```

### 1.4 データ異常の根本原因

| # | 異常 | 根本原因 | コード箇所 |
|---|------|---------|-----------|
| A1 | `plan_selection_viewed` = 22 > `timeline_viewed` = 14 | `PlanSelectionStepView.swift:128` の `onAppear` がドロワー開閉時に**再発火**する。ドロワーはoverlay なので閉じるとSwiftUIが `onAppear` を再トリガー。14人初回 + ドロワー操作による重複 = 22 | `PlanSelectionStepView.swift:128-129` |
| A2 | `drawer_converted` = 3 だが `purchased` = 0 | **ドロワーCTAは購入を実行しない。** `OnboardingFlowView.swift:51-54` で `onStartTrial` は `showDrawer = false` するだけ。Plan Selectionに戻るが購入処理は呼ばない。ユーザーは再度CTAを押す必要がある（2段階になってる） | `OnboardingFlowView.swift:50-54`, `DrawerOfferView.swift:29-31` |
| A3 | `onboarding_paywall_viewed` = 0 | Enum定義(`AnalyticsManager.swift:164`)はあるが、**track()呼出しが一度もない。** 朝メトリクスcron(`mixpanel_client.py:22`)がこのイベントを参照 → 常に0 | `AnalyticsManager.swift:164` |
| A4 | `rc_trial_started_event` = 0 | iOSアプリ側で**このイベントのtrack()実装が存在しない。** cronが参照してるが発火コードなし | `mixpanel_client.py:25` |

### 1.5 レガシーEnum（削除対象）

`AnalyticsManager.swift` にv1.6.1以前のステップ用enumが残存:

| Enum | 行 | 状態 |
|------|----|------|
| `onboardingAccountCompleted` | 147 | ❌ 画面削除済み |
| `onboardingValueCompleted` | 148 | ❌ 画面削除済み |
| `onboardingSourceCompleted` | 149 | ❌ 画面削除済み |
| `onboardingNameCompleted` | 150 | ❌ 画面削除済み |
| `onboardingGenderCompleted` | 151 | ❌ 画面削除済み |
| `onboardingAgeCompleted` | 152 | ❌ 画面削除済み |
| `onboardingIdealsCompleted` | 153 | ❌ 画面削除済み |
| `onboardingHabitsetupCompleted` | 155 | ❌ 画面削除済み |
| `onboardingAlarmkitCompleted` | 157 | ❌ 画面削除済み |
| `onboardingStepCompleted` | 142 | ❌ 互換性用だが未使用 |
| `onboardingPaywallViewed` | 164 | ❌ 未実装。`paywallPrimerViewed` と重複 |
| `onboardingPaywallDismissed` | 165 | ❌ 未実装。`onboardingPaywallDismissedFree` と重複 |
| `paywallViewed` | 160 | ⚠️ `trackPaywallViewed()` 内で使用だが、メソッド自体が未呼出 |
| `paywallDismissed` | 161 | ⚠️ `trackPaywallDismissed()` 内で使用だが、メソッド自体が未呼出 |
| `upgradePaywallPurchased` | 178 | ⚠️ 未実装 |

### 1.6 スキル監査結果（ios-app-onboarding スキル準拠）

#### オンボーディング監査

| チェック | BP | 現状 | 判定 |
|---------|-----|------|------|
| パーソナライゼーション質問 | 2-3問 | ✅ 3問 (struggles, depth, goals) | PASS |
| プログレスバー | 20%開始、Endowed Progress | ✅ あり（ペイウォールで非表示） | PASS |
| 価値提案スライド | ソーシャルプルーフ | ⚠️ Welcomeに社会的証明あるが弱い | WARN |
| "Building your plan" | ローディングアニメ | ❌ なし | FAIL |
| スキップボタン | Apple準拠 | ⚠️ ペイウォールの「Maybe Later」が見にくい | WARN |
| アニメーション | fade/slide遷移 | ❌ `withAnimation` だが一部なし | FAIL |
| ゴール設定 | コミットメント原則 | ✅ あり | PASS |
| パーソナライズ洞察 | ペイウォール前 | ✅ あり | PASS |
| 価格の透明性 | オンボ中に有料と伝える | ❌ なし | FAIL |

#### ペイウォール監査

| チェック | BP | 現状 | 判定 |
|---------|-----|------|------|
| 3ステップペイウォール | Primer→Timeline→Close | ✅ あり | PASS |
| Step 1 価格なし | "Try for free" のみ | ✅ | PASS |
| Step 2 Blinkistタイムライン | Today→Day5→Day7 | ✅ あり | PASS |
| Day 5 リマインダー通知 | ローカルプッシュ | ❌ 未実装 | FAIL |
| パーソナライズ見出し (Step 3) | 回答に基づく | ❌ 固定テキスト | FAIL |
| CTA上ソーシャルプルーフ | "⭐ 4.9 · X+ users" | ⚠️ `paywall_plan_social_proof` あるが弱い | WARN |
| "No commitment. Cancel anytime." | CTA下 | ✅ `paywall_plan_trust` | PASS |
| BEST VALUEバッジ | 年間プラン | ✅ あり | PASS |
| CTA文言 | "Start Free Trial" | ✅ trial有無で分岐 | PASS |
| 年間プリセレクト | アンカリング | ✅ | PASS |
| 週間価格内訳 | $0.96/week | ⚠️ ドロワーのみ。Step 3に未表示 | WARN |
| 法的フッター | Terms + Privacy | ❌ なし | FAIL |
| Restore Purchases | Apple必須 | ✅ あり | PASS |
| Toggle Paywall禁止 | 2026年1月Ban | ✅ 使ってない | PASS |
| ドロワー（Exit Offerモーダルでない） | slide-up | ✅ ドロワー実装済み | PASS |
| [X]ボタン | ペイウォール上部右 | ❌ **なし**。「Maybe Later」のみ | FAIL |

#### Apple 2026 コンプライアンス

| ルール | 判定 |
|--------|------|
| ペイウォール dismissible | ⚠️ 「Maybe Later」のみ。[X]ボタンなし |
| 実価格表示 (StoreKit/RC) | ✅ |
| トライアル期間+自動更新明記 | ⚠️ 不十分 |
| Privacy Policy リンク | ❌ **なし** |
| Terms of Use リンク | ❌ **なし** |
| Restore Purchases | ✅ |
| `demoAccountRequired: false` | ✅ |
| Toggle Paywall禁止 | ✅ |
| Exit Offerモーダル禁止 | ✅ ドロワー使用 |

---

## 2. TO-BE（改善後）

### 2.1 改善後フロー図

```
PHASE 1: HOOK (3ステップ)
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [1] Welcome  │→│ [2] Struggles│→│ [3] Struggle │
│              │  │              │  │    Depth     │
│ Dream+社証   │  │ チップ選択   │  │ 1タップ      │
│ CTA大きく    │  │              │  │              │
│ SIWA小さく   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

PHASE 2: INVEST (2ステップ)
┌──────────────┐  ┌──────────────┐
│ [4] Goals    │→│ [5] Personal │
│              │  │    Insight   │
│ チップ選択   │  │ ミラーリング │
│              │  │ +統計        │
└──────────────┘  └──────────────┘

PHASE 3: VALUE DEMO (1ステップ) ← ライブデモ削除
┌──────────────┐
│ [6] ValueProp│
│              │
│ 7日旅程      │
│ +コミットメント│
└──────────────┘

PHASE 4: PERMISSION (1ステップ)
┌──────────────┐
│ [7] Notif    │
│    Permission│
│ 価値説明強化 │
└──────────────┘

PHASE 5: CONVERT (3ステップペイウォール)
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│ [P0] Risk-   │→│ [P1] Trial   │→│ [P2] Plan Selection      │
│ Free Primer  │  │ Timeline     │  │                          │
│              │  │              │  │ [X]ボタン右上 ←──── NEW  │
│ "Try free"   │  │ Today→Day5   │  │ パーソナライズ見出し NEW  │
│ 3機能紹介    │  │ →Day7        │  │ Monthly / Yearly         │
│ 価格なし     │  │ キャンセル   │  │ ⭐ Social Proof          │
│ ×ボタンなし  │  │ 不安解消     │  │ [Start Free Trial] CTA   │
│              │  │              │  │ "Cancel anytime"         │
└──────────────┘  └──────────────┘  │ Terms・Privacy ←──── NEW │
                                    │ "Maybe Later" + Restore  │
                                    └────────────┬─────────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                        [購入CTA]          [Maybe Later]        [X]ボタン
                              │                  │                  │
                              ▼                  ▼                  ▼
                        purchase()         ドロワー表示      handleDismiss()
                        RevenueCat         スライドアップ    → 無料完了
                              │                  │
                         ┌────┴────┐        ┌────┴────┐
                         ▼         ▼        ▼         ▼
                      成功      キャンセル  [Start    [Skip]
                      purchased  (留まる)   Trial]    → 無料完了
                      → 完了              → **直接purchase()** ← FIX
                                          → RevenueCat購入実行
```

### 2.2 変更サマリ

| 変更 | AS-IS | TO-BE | 理由 |
|------|-------|-------|------|
| ライブデモ | ✅ 存在 (Step 7) | 🗑️ **削除** | 13%離脱。ユーザーが理解できない。従兄弟テスト失敗 |
| ドロワーCTA | plan selectionに戻るだけ | **直接購入実行** | 2段階→1段階。3人タップしたのに0人購入の原因 |
| [X]ボタン | なし | **Plan Selection右上に追加** | Apple準拠 + ソフトペイウォールのUX。見えないスキップは離脱の原因 |
| plan_selection onAppear重複 | 毎回発火 | **1回だけ発火** | データ異常 A1 修正 |
| Welcome CTA | SIWA(Sign In with Apple)が目立つ | **CTA大きく、SIWA最小化** | 20.6%離脱削減 |
| パーソナライズ見出し | 固定テキスト | **ユーザー回答に基づく** | BP: CRITICAL |
| Terms/Privacy | なし | **追加** | Apple必須。リジェクトリスク |
| 朝メトリクスcron | 9イベント(うち2つ未実装) | **全ステップ対応** | 正確な毎日のファネル追跡 |
| レガシーEnum | 14個残存 | **全削除** | コード衛生 |
| trial_started イベント | 未実装 | **購入成功時に判定・発火** | トライアル追跡 |
| ステップ数 | 11 (8オンボ+3ペイウォール) | 10 (7オンボ+3ペイウォール) | ライブデモ削除 |

---

## 3. 修正パッチ一覧

### P1: ライブデモ削除 🗑️

| 項目 | 値 |
|------|-----|
| 影響ファイル | `OnboardingStep.swift`, `OnboardingFlowView.swift`, `DemoNudgeStepView.swift` |
| 内容 | `OnboardingStep` enum から `.liveDemo` 削除。`advance()` で `.valueProp` → `.notifications` に直接遷移。`DemoNudgeStepView.swift` ファイル削除 |
| Mixpanel | `onboarding_live_demo_completed` イベント削除 |
| 期待効果 | 13%離脱回復（20人→23人がnotifに到達する見込み） |

### P2: ドロワーCTAが直接購入を実行 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `OnboardingFlowView.swift`, `DrawerOfferView.swift` |
| 内容 | `DrawerOfferView.onStartTrial` のコールバックを変更。ドロワー閉じた後に**年間プランで `Purchases.shared.purchase()` を直接実行**する。成功時 `onboarding_paywall_purchased` + `trial_started` 発火 |
| AS-IS | ドロワーCTA → ドロワー閉じる → plan selectionに戻る → ユーザーが再度購入CTAを押す |
| TO-BE | ドロワーCTA → ドロワー閉じる → 即RevenueCat購入シート表示 → 購入完了 |
| 期待効果 | 3人のドロワーCTAタップ → 直接購入フローへ |

### P3: plan_selection_viewed 重複発火修正 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `PlanSelectionStepView.swift` |
| 内容 | `@State private var hasTrackedPlanView = false` 追加。`onAppear` で `guard !hasTrackedPlanView else { return }; hasTrackedPlanView = true` |
| 同様に修正 | `PaywallPrimerStepView`, `TrialTimelineStepView` も同じパターン適用（念のため） |
| 期待効果 | データ正確化。22→14前後に正常化 |

### P4: Welcome画面CTA改善 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `WelcomeStepView.swift` |
| 内容 | メインCTAを `AppTheme.Colors.accent`（目立つ色）に変更。Sign In with Appleセクション全体を小さくする（`font(.caption)` + `opacity(0.6)`）。既存ユーザー向けと明示 |
| AS-IS | CTA = `AppTheme.Colors.label`(地味) + SIWA = 大きい `frame(height: 44)` |
| TO-BE | CTA = `accent色` + SIWA = 小さい `frame(height: 36)` + 説明テキスト最小化 |
| 期待効果 | 20.6%離脱 → 10-15%に削減 |

### P5: Plan Selection に [X]ボタン追加 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `PlanSelectionStepView.swift` |
| 内容 | 右上に `xmark` ボタン追加。タップ → `onShowDrawer()` (ドロワー表示)。Cravotta BPに準拠: Xボタン → ドロワーで最終オファー → Skip で無料完了 |
| Apple準拠 | ペイウォールは dismissible MUST |
| 期待効果 | ユーザーが出口を見つけやすくなり、「閉じ込められた」不安が減少 → 実は購入率上昇(BP: trust is highest-leverage) |

### P6: Trial Timeline 改善 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `TrialTimelineStepView.swift` |
| 内容 | 22.2%離脱の改善。テキストを簡潔に。CTA文言を「Start My Free Trial」に強化。タイムラインを視覚的に改善（アイコン大きく、テキスト読みやすく） |
| 検討 | 離脱が改善しなければ将来削除してPrimer→PlanSelectionの2ステップにする |
| 期待効果 | 22.2%離脱 → 10-15%に削減 |

### P7: パーソナライズ見出し追加 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `PlanSelectionStepView.swift` |
| 内容 | `paywall_plan_title` を固定テキストから、ユーザーが選んだ悩み(struggles)に基づく動的テキストに変更。例: "夜更かしを克服する、あなた専用のプラン" |
| BP | Cravotta Method: "Personalized headline based on onboarding answers" = CRITICAL |
| 期待効果 | CVR +20-40% (Superwall Endowment/Sunk cost) |

### P8: Terms/Privacy リンク追加 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `PlanSelectionStepView.swift` |
| 内容 | CTA下に Terms of Use + Privacy Policy リンク追加 |
| Apple準拠 | CRITICAL — リジェクトリスク |

### P9: trial_started イベント実装 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `PlanSelectionStepView.swift`, `DrawerOfferView.swift`(P2修正後) |
| 内容 | `purchase()` 成功時に `selectedPackage?.storeProduct.introductoryDiscount != nil` を判定。trialありなら `AnalyticsManager.shared.track(.trialStarted, properties: ["product_id": productId])` 発火 |
| 期待効果 | `trial_started` が Mixpanel に記録 → 朝メトリクスで追跡可能 |

### P10: 朝メトリクスcron修正 🔧

| 項目 | 値 |
|------|-----|
| 影響ファイル | `scripts/daily-metrics/mixpanel_client.py`, `scripts/daily-metrics/models.py` |
| 内容 | `_EVENTS` タプルを全ステップに拡張。`onboarding_paywall_viewed` → `paywall_primer_viewed`。`rc_trial_started_event` → `trial_started`。全ステップのexit rate計算を追加 |
| 追加イベント | `onboarding_welcome_completed`, `onboarding_struggle_depth_completed`, `onboarding_goals_completed`, `onboarding_insight_completed`, `onboarding_valueprop_completed`, `paywall_plan_selection_viewed`, `paywall_drawer_viewed`, `paywall_drawer_converted` |

### P11: レガシーEnum + 未使用メソッド削除 🗑️

| 項目 | 値 |
|------|-----|
| 影響ファイル | `AnalyticsManager.swift` |
| 内容 | 上記1.5の14個のenumケース削除。`trackPaywallViewed()`, `trackPaywallDismissed()` メソッド削除（呼出元なし） |

---

## 4. 実装順序

| 順序 | パッチ | 理由 |
|------|--------|------|
| 1 | **P2** ドロワー直接購入 | 🔴 購入フロー壊れてる。最優先 |
| 2 | **P3** 重複発火修正 | データ正確化が他の分析の前提 |
| 3 | **P1** ライブデモ削除 | 13%離脱回復 |
| 4 | **P5** [X]ボタン追加 | Apple準拠 + UX改善 |
| 5 | **P8** Terms/Privacy | Apple準拠 |
| 6 | **P9** trial_started実装 | メトリクス追跡 |
| 7 | **P4** Welcome CTA改善 | 20.6%離脱削減 |
| 8 | **P7** パーソナライズ見出し | CVR +20-40% |
| 9 | **P6** Trial Timeline改善 | 22.2%離脱削減 |
| 10 | **P10** 朝メトリクスcron | 毎日のファネル追跡 |
| 11 | **P11** レガシーEnum削除 | コード衛生 |

---

## 5. 改善後の目標メトリクス

| メトリクス | AS-IS | TO-BE目標 | ベンチマーク |
|-----------|-------|----------|------------|
| オンボ完了率 | 52.9% (18/34) | >70% | スキル基準 |
| ペイウォール到達率 | 52.9% | >80% | Superwall |
| DL→Trial | 0.0% | >10% | RevenueCat Health&Fitness P75 |
| Trial→Paid | N/A | >60% | RevenueCat Best |
| ペイウォールCVR | 0.0% | >5% | スキル基準 |

---

## 6. 各ステップのビジュアル説明

### Trial Timeline（P1 = Blinkist式タイムライン）

```
┌──────────────────────────────────┐
│                                  │
│    "How your free trial works"   │  ← タイトル
│                                  │
│    ▶ Today                       │  ← play.circle.fill アイコン
│    │  "Get instant access"       │
│    │                             │
│    🔔 Day 5                      │  ← bell.fill アイコン
│    │  "We'll remind you"         │  ← キャンセル不安の解消
│    │                             │
│    ✅ Day 7                      │  ← checkmark.seal.fill
│       "Subscription starts"      │
│                                  │
│    "Cancel anytime before Day 7" │  ← subtitle
│                                  │
│    [========= Continue =========]│  ← CTA
│                                  │
└──────────────────────────────────┘
```

**目的:** Blinkist実証: CVR +23%, 苦情 -55%。「いつでもキャンセルできる」を視覚化して購入不安を解消。

### Paywall Primer（P0 = Risk-Free Primer）

```
┌──────────────────────────────────┐
│                                  │
│    "Start your journey for free" │  ← タイトル（価格なし！）
│                                  │
│    "Begin your transformation"   │  ← サブタイトル
│                                  │
│    ✅ Personalized nudges        │  ← 機能1
│    🔔 Smart reminders            │  ← 機能2
│    ❌ No commitment              │  ← 機能3（キャンセル可を強調）
│                                  │
│    [========= Continue =========]│  ← CTA（価格なし）
│                                  │
└──────────────────────────────────┘
```

**目的:** Cravotta Step 1: "Lower heart rate"。価格を一切見せず、「無料で試せる」安心感を作る。×ボタンなし（まだコミット不要）。

### Plan Selection（P2 = The Hard Close）— 改善後

```
┌──────────────────────────────────┐
│                              [X] │  ← NEW: 閉じるボタン
│                                  │
│  "夜更かしを克服する、           │  ← NEW: パーソナライズ見出し
│   あなた専用のプラン"            │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ ⭐ BEST VALUE               │ │  ← 年間プラン（プリセレクト）
│  │ Yearly    $49.99/yr         │ │
│  │           Save 58%  ✓      │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Monthly   $9.99/mo    ○    │ │
│  └─────────────────────────────┘ │
│                                  │
│  ⭐ 4.9 · 1,000+ users          │  ← ソーシャルプルーフ
│                                  │
│  [=== Start Free Trial ===]      │  ← 購入CTA
│  No commitment. Cancel anytime.  │
│                                  │
│  "Maybe later"  "Restore"        │  ← subtle
│  Terms · Privacy                 │  ← NEW: 法的リンク
└──────────────────────────────────┘
         │
         │ [X] or "Maybe Later" タップ
         ▼
┌──────────────────────────────────┐
│  "Not ready for a year?"         │  ← ドロワー（スライドアップ）
│  "That's just $0.96/week"        │
│                                  │
│  [=== Start Free Trial ===]      │  ← 直接purchase()実行！
│  "Maybe later"                   │  ← 無料完了
└──────────────────────────────────┘
```

---

## 7. Mixpanelトラッキング — 改善後の完全イベントマップ

| # | ステップ | イベント | 発火タイミング | 重複防止 |
|---|---------|---------|--------------|---------|
| 0 | オンボ開始 | `onboarding_started` | Welcome画面 onAppear | ✅ 1回 |
| 1 | Welcome完了 | `onboarding_welcome_completed` | CTAタップ | ✅ |
| 2 | 悩み選択 | `onboarding_struggles_completed` | 次へ | ✅ |
| 3 | 深さ選択 | `onboarding_struggle_depth_completed` | 選択タップ | ✅ |
| 4 | 目標選択 | `onboarding_goals_completed` | 次へ | ✅ |
| 5 | 洞察 | `onboarding_insight_completed` | 次へ | ✅ |
| 6 | 価値提案 | `onboarding_valueprop_completed` | 次へ | ✅ |
| 7 | 通知許可 | `onboarding_notifications_completed` | 許可後 | ✅ |
| 8 | オンボ完了 | `onboarding_completed` | ペイウォール表示直前 | ✅ |
| P0 | Primer | `paywall_primer_viewed` | onAppear | `hasTracked`ガード |
| P1 | Timeline | `paywall_timeline_viewed` | onAppear | `hasTracked`ガード |
| P2 | Plan | `paywall_plan_selection_viewed` | onAppear | `hasTracked`ガード |
| — | 購入成功 | `onboarding_paywall_purchased` | RC購入成功 | ✅ |
| — | Trial開始 | `trial_started` | 購入成功+trial判定 | ✅ |
| — | ドロワー表示 | `paywall_drawer_viewed` | onAppear | ✅ |
| — | ドロワー購入 | `paywall_drawer_converted` | ドロワーCTA | ✅ |
| — | 無料スキップ | `onboarding_paywall_dismissed_free` | Skip | ✅ |
