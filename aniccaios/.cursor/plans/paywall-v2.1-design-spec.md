# Paywall v2.1 デザイン改善スペック

**ステータス: 承認待ち**
**ブランチ: release/1.7.0**
**対象ファイル:** `PlanSelectionStepView.swift`, `en.lproj/Localizable.strings`, `ja.lproj/Localizable.strings`
**スキル更新:** `ios-app-onboarding/SKILL.md`, `ios-app-onboarding/references/onboarding-paywall-best-practices.md`

---

## ソース

| # | Source | 核心 | データ |
|---|--------|------|--------|
| S1 | Blinkist A/B: "How your free trial works" | 解約方法セクション追加 → 信頼感UP | **+23% trial, -55% complaints, push opt-in 6→74%** |
| S2 | Moonly A/B: "Free trial only for annual" | 年間プランのみトライアル付与+CTA変更 | **+39% CVR, +47% revenue/100 installs** |
| S3 | Headspace A/B: "7-day vs 14-day trial" | 年間14日/月間7日+イラスト+タイムライン | **Double-digit CVR increase** |
| S4 | Mojo A/B: "Yearly plan as default" | 年間のみ表示、月間はリンク経由 | **+15-20% yearly proportion** |
| S5 | Instasize A/B: "Optimizing paywall placement" | ヒーロー画像+ベネフィットリスト+Free Trial CTA | **+7% premium subs** |
| S6 | Opal A/B: "Driving motivation" | paywall前に衝撃的数字で動機付け | **7%→17% trial CVR** |
| S7 | Superwall Bootcamp | 週額表示で perception shift | CVR +10-15% |
| S8 | ios-app-onboarding SKILL.md | 日本市場は cancel anxiety が特に強い | CRITICAL |
| S9 | Apple 2026 Guideline 3.1.1 | Terms/Privacy リンク paywall 必須 | 審査リスク回避 |

---

## 現状 vs 改善後

### BEFORE（現在）

```
┌────────────────────────────────┐
│                                │
│   あなたの可能性を               │
│   解き放とう                     │
│                                │
│   ✓ つらい瞬間にパーソナルナッジ    │
│   ✓ AIガイド付き内省セッション     │
│   ✓ 変化の記録・可視化            │
│                                │
│   ┌──────────────────────────┐ │
│   │ Yearly  $49.99/yr       │ │
│   │ BEST VALUE   Save 58%   │ │
│   └──────────────────────────┘ │
│   ┌──────────────────────────┐ │
│   │ Monthly  $9.99/mo       │ │
│   └──────────────────────────┘ │
│                                │
│  ⭐ 5.0 · いつでも解約OK        │
│                                │
│  [=== 無料トライアルを始める ===] │
│  いつでもキャンセル可能。         │
│  あとで    購入を復元             │
│                                │
└────────────────────────────────┘
```

**問題点:**

| # | 問題 | 根拠 |
|---|------|------|
| 1 | ビジュアル要素ゼロ（テキストのみ） | S5: ヒーロー画像追加 → +7% |
| 2 | 週あたり価格の表示なし | S7: $49.99/yr → "$0.96/week" で perception shift |
| 3 | 年間/月間カードの視覚差が小さい | S2/S4: 年間を明確に目立たせる |
| 4 | 年間カードにトライアル明記なし | S2: trial付き年間 → +39% CVR |
| 5 | 解約方法の説明なし | S1: 解約説明追加 → -55% complaints。S8: JP cancel anxiety 特大 |
| 6 | Terms/Privacy リンクなし | S9: Apple 2026 必須 |

### AFTER（改善後）

```
┌────────────────────────────────┐
│                                │
│        [App Icon 40pt]         │  ← NEW: 視覚アンカー
│                                │
│   あなたの可能性を               │
│   解き放とう                     │
│                                │
│   ✓ つらい瞬間にパーソナルナッジ    │
│   ✓ AIガイド付き内省セッション     │
│   ✓ 変化の記録・可視化            │
│                                │
│   ┌─── accent 2px border ────┐ │  ← NEW: 年間カード強調
│   │ ⭐ BEST VALUE             │ │     太枠 + accent 背景 10%
│   │                          │ │
│   │ Annual     $49.99/yr     │ │
│   │ $0.96/week · Save 58%   │ │  ← NEW: 週額表示
│   │ 7-day free trial         │ │  ← NEW: トライアル明記
│   └──────────────────────────┘ │
│   ┌──────────────────────────┐ │  ← 月間: 薄い背景、枠なし
│   │ Monthly    $9.99/mo      │ │
│   └──────────────────────────┘ │
│                                │
│  ⭐ App Store 評価 5.0 ·       │
│     いつでも解約OK              │
│                                │
│  [=== 無料トライアルを始める ===] │
│  いつでもキャンセル可能。         │
│                                │
│  ┌─ secondaryBg rounded 12 ─┐ │  ← NEW: 解約説明セクション
│  │ 📋 解約はかんたん           │ │
│  │ 設定 → サブスクリプション     │ │
│  │ → キャンセル。2タップで完了。 │ │
│  └──────────────────────────┘ │
│                                │
│  あとで       購入を復元         │
│  利用規約 · プライバシーポリシー    │  ← NEW: Legal footer
│                                │
└────────────────────────────────┘
```

---

## 変更一覧

### 1. App アイコン追加（タイトル上）

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift` |
| 位置 | `paywall_plan_title` の上 |
| 実装 | `Image("AppIcon")` or SF Symbol `person.crop.circle.fill` 40pt |
| 根拠 | S5: ヒーロー画像追加 → +7%。ios-app-onboarding Step 3 テンプレート: `🎯 App Icon` |

### 2. 週額表示（年間カード内）

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift`, `Localizable.strings` (en/ja) |
| 位置 | 年間カードの価格行の下 |
| 計算 | `yearlyPrice / 52` → `$0.96/week` |
| 新キー EN | `paywall_plan_weekly_breakdown` = `%@/week · Save 58%%` |
| 新キー JA | `paywall_plan_weekly_breakdown` = `%@/週 · 58%%お得` |
| 根拠 | S7: weekly breakdown = perception shift, CVR +10-15% |

### 3. 年間カードにトライアル表示

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift`, `Localizable.strings` (en/ja) |
| 位置 | 年間カードの最下行 |
| 新キー EN | `paywall_plan_trial_label` = `7-day free trial` |
| 新キー JA | `paywall_plan_trial_label` = `7日間無料トライアル` |
| 条件 | `introductoryDiscount != nil` の場合のみ表示 |
| 根拠 | S2: trial付き年間 → **+39% CVR, +47% revenue/100 installs** |

### 4. 年間カードの視覚強調

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift` |
| 変更 | 年間カード: accent 2px border（常時）+ accent 10% 背景 |
| 変更 | 月間カード: border なし + buttonUnselected 背景 |
| 変更 | BEST VALUE バッジをカード上部に移動（HStack 内から VStack 先頭へ） |
| 根拠 | S2/S4: 年間を視覚的に明確に目立たせる → +15-20% yearly |

### 5. 解約説明セクション

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift`, `Localizable.strings` (en/ja) |
| 位置 | CTA + trust テキストの下、Maybe Later の上 |
| デザイン | `secondarySystemBackground` 背景、12pt 角丸、padding 12 |
| 新キー EN | `paywall_cancel_title` = `Easy to cancel` |
| 新キー JA | `paywall_cancel_title` = `解約はかんたん` |
| 新キー EN | `paywall_cancel_description` = `Settings → Subscriptions → Cancel. Done in 2 taps.` |
| 新キー JA | `paywall_cancel_description` = `設定 → サブスクリプション → キャンセル。2タップで完了。` |
| 根拠 | S1: Blinkist "How can I cancel?" → **+23% CVR, -55% complaints**。S8: JP cancel anxiety 特大 |

### 6. Legal footer（Terms/Privacy）

| 項目 | 値 |
|------|-----|
| ファイル | `PlanSelectionStepView.swift`, `Localizable.strings` (en/ja) |
| 位置 | Maybe Later / Restore の下 |
| 実装 | `Link` で Terms URL / Privacy URL を開く。font 11pt, secondary color |
| 新キー EN | `paywall_legal_terms` = `Terms of Use` |
| 新キー JA | `paywall_legal_terms` = `利用規約` |
| 新キー EN | `paywall_legal_privacy` = `Privacy Policy` |
| 新キー JA | `paywall_legal_privacy` = `プライバシーポリシー` |
| URL | Terms: `https://anicca.ai/terms` / Privacy: `https://anicca.ai/privacy` |
| 根拠 | S9: Apple 2026 Guideline 3.1.1 必須 |

---

## 新規ローカライズキー一覧

| Key | EN | JA |
|-----|----|----|
| `paywall_plan_weekly_breakdown` | `%@/week · Save 58%%` | `%@/週 · 58%%お得` |
| `paywall_plan_trial_label` | `7-day free trial` | `7日間無料トライアル` |
| `paywall_cancel_title` | `Easy to cancel` | `解約はかんたん` |
| `paywall_cancel_description` | `Settings → Subscriptions → Cancel. Done in 2 taps.` | `設定 → サブスクリプション → キャンセル。2タップで完了。` |
| `paywall_legal_terms` | `Terms of Use` | `利用規約` |
| `paywall_legal_privacy` | `Privacy Policy` | `プライバシーポリシー` |

---

## スキル更新

### ios-app-onboarding に追加する内容

| セクション | 追加内容 |
|-----------|---------|
| **A/Bテスト実証データ（新セクション）** | 6ケーススタディ表（Blinkist/Moonly/Headspace/Mojo/Instasize/Opal） |
| **Step 3 Hard Close テンプレート更新** | 週額表示、トライアル明記、解約方法セクション、Legal footer を追加 |
| **年間カードデザインルール（新セクション）** | バッジ位置上部、太枠常時、週額計算式、トライアル条件表示 |
| **日本市場: 解約説明** | CRITICAL に昇格（「解約方法セクション必須」を Audit チェックリストに追加） |

### paywall-upgrade-cro の扱い

| 方針 | 理由 |
|------|------|
| そのまま残す。Settings/Feature gate 経由の課金画面で使用 | オンボーディングペイウォールとは文脈が違う |
| ios-app-onboarding がオンボーディング〜ペイウォールの SSOT | 一連のフローなので1スキルで完結させる |

---

## 実装順序

1. ローカライズキー追加（en/ja）
2. `PlanSelectionStepView.swift` デザイン改修（6変更）
3. `ios-app-onboarding` スキル更新
4. `fastlane build_for_simulator` → シミュレータ確認
5. 承認後 → `fastlane build` → push → App Store 提出

---

## 検証

1. シミュレータで PlanSelection 画面を EN/JA 両方確認
2. App アイコンが表示されること
3. 年間カードに週額 + トライアル + BEST VALUE バッジが表示
4. 解約説明セクションが表示
5. Terms/Privacy リンクが動作
6. 月間カードは控えめなデザイン

---

最終更新: 2026-03-11
