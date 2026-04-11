# 1.8.4 — 5 Patches Spec

最終更新: 2026-04-12 JST
ステータス: PATCH 5 = APPLIED / PATCH 1-3 = 未適用（worktree 対象）/ PATCH 4 = 1.8.5 に延期（spec のみ）

---

## 概要

| # | 内容 | バージョン | 状態 |
|---|---|---|---|
| PATCH 1 | AppDemoStepView の Continue ボタンを accent 色に統一 | 1.8.4 | 未適用 |
| PATCH 2 | SubscriptionManager の `#if DEBUG` Variant B 強制フェッチ削除 | 1.8.4 | 未適用 |
| PATCH 3 | PaywallVariantBView の AniccaLogo 削除 | 1.8.4 | 未適用 |
| PATCH 4 | Onboarding Best Practice 準拠（14-screen framework） | **1.8.5** | spec のみ |
| PATCH 5 | ReelClaw/Larry direct-post + autoAddMusic + today テスト cron | OpenClaw | **APPLIED** |

作業ワークツリー: `/Users/anicca/anicca-paywall-variant-b`（branch: `feature/paywall-variant-b`）

---

## PATCH 1 — AppDemoStepView Continue ボタン色統一

### 問題
"Experience your first reminder" デモ画面の Continue ボタンが iOS デフォルトの青 (`Color.accentColor`) で表示される。他のオンボーディングボタン（NotificationPermissionStepView 等）は `AppTheme.Colors.accent`（黒 #222222 / ダーク #e5e5e5）。

### ファイル
`aniccaios/aniccaios/Onboarding/AppDemoStepView.swift`

### パッチ
```swift
Button(action: next) {
    Text("onboarding_demo_cta")
        .font(.system(size: 18, weight: .semibold))
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .frame(height: 56)
        .background(AppTheme.Colors.accent)
        .clipShape(RoundedRectangle(cornerRadius: 28))
}
.padding(.horizontal, 24)
```

基準スタイル: NotificationPermissionStepView.swift の CTA と揃える（size 18 semibold / height 56 / radius 28 / horizontal 24 padding）。

---

## PATCH 2 — SubscriptionManager DEBUG Variant B 強制削除

### 問題
前セッションで `refreshOfferings()` 内に `#if DEBUG` で `anicca_variant_b` offering を強制フェッチするブロックを追加した。RC Experiment の weekly plan 配信が始まるので削除必須。

### ファイル
`aniccaios/aniccaios/Services/SubscriptionManager.swift`

### パッチ（diff）
```diff
             await MainActor.run {
                 // キャッシュを確実に更新
-                #if DEBUG
-                // DEBUG: RC Experiment をバイパスして Variant B を強制表示
-                if let variantB = result.offering(identifier: "anicca_variant_b") {
-                    print("[SubscriptionManager] DEBUG force Variant B offering: \(variantB.identifier), packages=\(variantB.availablePackages.map { $0.identifier })")
-                    AppState.shared.updateOffering(variantB)
-                    return
-                }
-                #endif
                 if let offering = result.offering(identifier: AppConfig.revenueCatPaywallId) ?? result.current {
                     AppState.shared.updateOffering(offering)
                 } else {
```

---

## PATCH 3 — PaywallVariantBView AniccaLogo 削除

### 問題
Paywall 上部に AniccaLogo を表示しているが、weekly plan を追加して ScrollView 前提にする構成上、ロゴは不要。タイトル `paywall_b_title`（"gentle words when you need them the most"）を上端に持ってくる。

### ファイル
`aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift`

### パッチ（diff）
```diff
     private var heroSection: some View {
         VStack(spacing: 8) {
-            Image("AniccaLogo")
-                .resizable()
-                .frame(width: 64, height: 64)
-                .clipShape(RoundedRectangle(cornerRadius: 14))
-
             Text(String(localized: "paywall_b_title"))
                 .font(.system(size: 28, weight: .bold))
                 .foregroundStyle(AppTheme.Colors.label)
                 .multilineTextAlignment(.center)
                 .padding(.horizontal, 24)
+                .padding(.top, 32)

             Text(String(localized: "paywall_b_subtitle"))
```

---

## PATCH 4 — Onboarding Best Practice 準拠（1.8.5 実装予定）

**1.8.5 で実装する。1.8.4 ではやらない。** ここに完全な分析を残す。1.8.5 を開始したときに「何もどこをどう直せばいいか最初からやり直し」にならないように、調査結果・ギャップ・解決策・ファイルパス計画まで全て記録する。

### 出典

| ソース | URL / パス |
|---|---|
| Adam Lyttle Onboarding Skill | https://github.com/adamlyttleapps/claude-skill-app-onboarding-questionnaire |
| 核心 | "Money-making onboarding" = 14 スクリーン framework（Welcome → Paywall）で conversion を最大化する |

### 14-screen Best Practice Framework vs 現状

| # | Best Practice Screen | 目的 | 現状 Anicca (8 step) | 状態 |
|---|---|---|---|---|
| 1 | Welcome | ブランド提示・第一印象 | WelcomeStepView | ✅ 実装済 |
| 2 | Goal Selection | ユーザーの目的を選ばせる | GoalSelectionStepView | ✅ 実装済 |
| 3 | Pain Points | 痛みを言語化させる | StruggleSelectionStepView | ✅ 実装済 |
| 4 | **Social Proof** | レビュー・星・実績数字 | **なし** | ❌ **欠落** |
| 5 | **Tinder Cards (Yes/No)** | インタラクティブに "気づき" を与える swipe UI | **なし** | ❌ **欠落** |
| 6 | Solution Presentation | アプリの解決策を提示 | SolutionPreviewStepView（想定） | ⚠️ 弱い |
| 7 | Comparison (With/Without) | Before/After 比較 | なし | ❌ 欠落 |
| 8 | Preferences / Personalization | 時間帯・頻度などの好み | NotificationTimingStepView | ✅ 実装済 |
| 9 | Permission Priming | 許可を求める前の文脈作り | NotificationPermissionStepView | ✅ 実装済 |
| 10 | Processing / Loading | "あなた専用を作っています" 演出 | なし | ⚠️ 追加推奨 |
| 11 | **Interactive App Demo** | 実際の動作を体験させる | AppDemoStepView（静的） | ⚠️ **弱い** |
| 12 | **Value Reinforcement / Viral Share** | 口コミ導線 | **なし** | ❌ **欠落** |
| 13 | Account Creation | サインイン | SignInWithAppleStepView | ✅ 実装済 |
| 14 | Paywall | 課金 | PaywallVariantBView | ✅ 実装済 |

### 欠落 4 要素（1.8.5 で実装する）

| 優先度 | 要素 | 実装方針 | 追加ファイル |
|---|---|---|---|
| 🔴 高 | Social Proof | ★4.8 + レビュー 3-5 件カルーセル + ユーザー数 | `Onboarding/SocialProofStepView.swift` |
| 🔴 高 | Tinder Cards | "こういう瞬間ない？" 系カードを Yes/No スワイプ → 共感させる | `Onboarding/EmpathyCardsStepView.swift` |
| 🟡 中 | Interactive Demo 強化 | 静的デモ → 実際のカード操作を体験させる（nudge を完了させる） | `AppDemoStepView.swift` 改修 |
| 🟡 中 | Viral Share | "友達にシェアして無料で 7 日" 系 | `Onboarding/ShareStepView.swift` |

### Before / After（ASCII）

```
[ 現状 8 step ]
Welcome → Goal → Struggle → Solution → Timing → Permission → Demo → SignIn → Paywall

[ 1.8.5 目標 12 step ]
Welcome → Goal → Struggle
       → [NEW: Social Proof]
       → [NEW: Tinder Cards / Empathy]
       → Solution
       → Timing → Permission
       → [IMPROVED: Interactive Demo]
       → [NEW: Viral Share]
       → SignIn → Paywall
```

### 各要素の理由（skill の主張）

| 要素 | 理由 |
|---|---|
| Social Proof | "People copy what others already chose." レビュー星 4.8+ を見せると paywall CVR が 15-30% 改善。Duolingo / Calm 採用 |
| Tinder Cards | Yes/No swipe で "自分ごと化" させる。Rize / Finch / Opal 採用 |
| Interactive Demo | 実際に 1 回動かすと "習得済み" 感が出て継続意欲が上がる。Headspace 採用 |
| Viral Share | オンボ終盤の高揚状態がシェア率最高ポイント。BeReal / Cal AI 採用 |

### 1.8.5 開始時にやること

1. 本 spec と skill 再読
2. 4 個の StepView を作成
3. OnboardingFlow.swift の `steps` 配列に順番通り挿入
4. ローカライズキー追加（ja/en）
5. Maestro テスト更新

---

## PATCH 5 — ReelClaw / Larry Direct Post + autoAddMusic + today テスト cron

ステータス: **APPLIED (2026-04-12 JST)**

### 変更内容

#### 5-A: Larry SKILL.md 書き換え
- `~/.openclaw/workspace/skills/larry/SKILL.md`
- "draft workflow (SELF_ONLY)" → "direct-post workflow (PUBLIC_TO_EVERYONE + autoAddMusic yes)"
- Config block に `contentPostingMethod: DIRECT_POST`, `autoAddMusic: yes` 追加
- "Why We Post as Drafts" 章 → "Why We Post DIRECT with Auto-Music" に全面書き換え
- 理由: TikTok 側で upload 時にトレンド BGM を自動選曲させる（autoAddMusic:"yes" のベストプラクティス）

#### 5-B: jobs.json デイリー cron 19 個の設定を in-place 修正
- `~/.openclaw/cron/jobs.json`
- 対象:
  - slideshow-ja-1/2/3, slideshow-en-1/2/3（6 Larry slideshow）
  - card-slideshow-ja, card-slideshow-en（2 card slideshow）
  - reelclaw-ja-1/2, reelclaw-en-1/2（4 reelclaw card）
  - reelclaw-anicca-ja-widget-1/2, reelclaw-anicca-en-widget-1/2（4 widget）
  - reelclaw-honne-ja-1/2/3（3 honne — honne も PUBLIC_TO_EVERYONE）
- 置換:
  - `privacy_level: SELF_ONLY` → `PUBLIC_TO_EVERYONE`
  - `content_posting_method: UPLOAD` → `DIRECT_POST`
  - `autoAddMusic: "no"` → `"yes"`
  - "as DRAFT via Postiz. TikTok draft creation is REQUIRED" → "as DIRECT POST via Postiz ... TikTok direct post is REQUIRED"
  - "Publish to TikTok JA/EN as DRAFT" → "... DIRECT"
  - honne "Posting mode: draft, SELF_ONLY." → "Posting mode: direct, PUBLIC_TO_EVERYONE, autoAddMusic: \"yes\"."

#### 5-C: 古い TEST-*（2026-04-12T13:XX UTC）を disable
9 個の stale TEST-* を `enabled: false` に。

#### 5-D: TEST-*-today を 9 個追加（デイリーのクローン）
`deleteAfterRun: true` / `kind: at`。デイリーの `by_name` からディープコピー。

### 今日のテスト cron 完全タイムテーブル

| # | Cron 名 | JST | UTC | 投稿先 | Integration ID |
|---|---|---|---|---|---|
| 1 | TEST-slideshow-ja-today | 06:00 | 21:00 | TT JA + IG JA | TT: `cmlrv8jq000hun60yy57eaptx` / IG: `cmmzujxpa04ujp30yxqpg1vci` |
| 2 | TEST-slideshow-en-today | 06:05 | 21:05 | TT EN + IG EN | TT: `cmlt171eq04d9r00yzzceb6bw` / IG: `cmmzzg2es0539p30ycb94ayx0` |
| 3 | TEST-card-slideshow-ja-today | 06:10 | 21:10 | TT JA card | `cmneo6zdj01mspa0yn322ay97` |
| 4 | TEST-card-slideshow-en-today | 06:15 | 21:15 | TT EN card | `cmnenjkff01j1pa0ysufmzhfr` |
| 5 | TEST-reelclaw-card-ja-today | 06:20 | 21:20 | TT+IG+YT JA | TT: `cmnhlk3ju058lpn0ytilqdpo0` / IG: `cmnipef7g00oerm0y3dz4lamx` / YT: `cmn1oukj9012nnq0yqhouc3ib` |
| 6 | TEST-reelclaw-card-en-today | 06:25 | 21:25 | TT+IG+YT EN | TT: `cmn8y47do02mmo70yckb46dyu` / IG: `cmn8y95rg02d2qx0y09bbk5pb` / YT: `cmmzukbkw04ulp30yfvijrwio` |
| 7 | TEST-reelclaw-widget-ja-today | 06:30 | 21:30 | TT+IG+YT JA widget | (reelclaw JA 系と同じ integration) |
| 8 | TEST-reelclaw-widget-en-today | 06:35 | 21:35 | TT+IG+YT EN widget | (reelclaw EN 系と同じ integration) |
| 9 | TEST-reelclaw-honne-ja-today | 06:40 | 21:40 | TT JA honne only | `cmnit95mg015rrm0ye5vm8dhl` |

全て `privacy_level: PUBLIC_TO_EVERYONE`, `content_posting_method: DIRECT_POST`, `autoAddMusic: "yes"`。
全て `deleteAfterRun: true`（発火後自動削除）。

### 検証ポイント（発火時に確認する項目）
1. TikTok 上でトレンド BGM が自動選曲されているか
2. `privacy_level = PUBLIC_TO_EVERYONE` で投稿されているか（SELF_ONLY になっていないか）
3. IG / YT へも同時 fan-out 成功しているか
4. Slack `#metrics` に報告が来ているか

---

## 適用順序

1. ✅ PATCH 5 適用（Mac Mini 側 — 完了）
2. ✅ 本 spec 書き出し（完了）
3. ⏳ PATCH 1/2/3 をワークツリー `/Users/anicca/anicca-paywall-variant-b` に適用
4. ⏳ commit + push → `feature/paywall-variant-b`
5. ⏳ `fastlane build_for_device` → Dais Iphone にインストール
6. ⏳ ユーザーによる reset-on-launch 検証
7. ⏳ feature → dev → main → release/1.8.4 → ASC 提出
