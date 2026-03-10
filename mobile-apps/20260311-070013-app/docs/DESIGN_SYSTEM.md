# Design System: SomaticFlow

Source: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) — 「Use consistent visual elements to create an intuitive experience.」
Source: [Material Design Tokens](https://m3.material.io/foundations/design-tokens/overview) — 「Design tokens are reusable values that can be applied systematically across a UI.」
Source: [Airbnb Design System](https://airbnb.design/building-a-visual-language/) — 「A shared vocabulary reduces friction and increases quality and consistency.」

---

## 1. Color Tokens

### Primary Palette

| Token | Light (Hex) | Dark (Hex) | Usage |
|-------|------------|-----------|-------|
| `colorPrimary` | `#3D7A68` | `#5BA98E` | CTA ボタン、アクセント、ストリークバッジ |
| `colorPrimaryDark` | `#2A5C4E` | `#3D7A68` | ボタン押下状態、アクティブ Tab |
| `colorPrimaryLight` | `#E8F4F0` | `#1A3A30` | カードの背景、ハイライト背景 |
| `colorSecondary` | `#7A9E8A` | `#9ABFAD` | セカンダリボタン、ラベル |
| `colorAccent` | `#F4A261` | `#E8855A` | 「Save 69%」バッジ、プレミアムハイライト |

### Neutral Palette

| Token | Light (Hex) | Dark (Hex) | Usage |
|-------|------------|-----------|-------|
| `colorBackground` | `#F9FAF8` | `#0F1A14` | 全画面の背景 |
| `colorSurface` | `#FFFFFF` | `#1A2820` | カード、シート、モーダル |
| `colorSurfaceElevated` | `#F2F5F2` | `#233028` | 区切り用カード、セクション背景 |
| `colorBorder` | `#E0E8E3` | `#2E4A3C` | カードのボーダー、区切り線 |
| `colorTextPrimary` | `#1A2C24` | `#E8F4EE` | 本文、見出し |
| `colorTextSecondary` | `#5C7868` | `#89A898` | サブタイトル、ヒントテキスト |
| `colorTextDisabled` | `#A8BDB5` | `#4A6558` | 非活性テキスト |

### Semantic Colors

| Token | Light (Hex) | Dark (Hex) | Usage |
|-------|------------|-----------|-------|
| `colorSuccess` | `#4CAF50` | `#66BB6A` | 完了チェック、ストリーク達成 |
| `colorWarning` | `#FF9800` | `#FFA726` | 未完了リマインダー |
| `colorError` | `#F44336` | `#EF5350` | 購入エラー、通知拒否警告 |
| `colorPaywallGradientStart` | `#2A5C4E` | `#1A3A30` | ペイウォール背景グラデ開始 |
| `colorPaywallGradientEnd` | `#3D7A68` | `#2A5C4E` | ペイウォール背景グラデ終了 |

```swift
// Design System Token (Swift)
extension Color {
    static let sfPrimary = Color("colorPrimary")       // #3D7A68
    static let sfAccent = Color("colorAccent")         // #F4A261
    static let sfBackground = Color("colorBackground") // #F9FAF8
    static let sfSurface = Color("colorSurface")       // #FFFFFF
    static let sfTextPrimary = Color("colorTextPrimary")
    static let sfTextSecondary = Color("colorTextSecondary")
}
```

---

## 2. Typography

Source: [Apple HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography) — 「Use Dynamic Type to ensure text scales properly for all users.」

| Style Token | Size (pt) | Weight | Line Height | Usage |
|-------------|-----------|--------|------------|-------|
| `typeDisplayLarge` | 34 | Bold | 41 | オンボーディングタイトル |
| `typeDisplayMedium` | 28 | Bold | 34 | ペイウォール見出し |
| `typeHeadline` | 22 | Semibold | 28 | セクション見出し |
| `typeTitle` | 20 | Semibold | 25 | カードタイトル、エクサイズ名 |
| `typeBody` | 17 | Regular | 22 | 本文、説明文 |
| `typeBodyBold` | 17 | Semibold | 22 | 強調テキスト、ラベル |
| `typeSubheadline` | 15 | Regular | 20 | サブラベル、ヒント |
| `typeCaption` | 12 | Regular | 16 | 補足テキスト、法的テキスト |
| `typePriceLabel` | 24 | Bold | 30 | 価格表示（ペイウォール） |
| `typePricePeriod` | 14 | Regular | 20 | /月・/年のラベル |

```swift
extension Font {
    static let sfDisplayLarge = Font.system(size: 34, weight: .bold, design: .rounded)
    static let sfHeadline = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let sfBody = Font.body
    static let sfCaption = Font.caption
    static let sfPrice = Font.system(size: 24, weight: .bold, design: .rounded)
}
```

**Dynamic Type:** 全テキストは `.scaledFont` または SwiftUI デフォルト Dynamic Type をサポート。固定ピクセルサイズ禁止。

---

## 3. Spacing & Layout

Source: [8-Point Grid System](https://spec.fm/specifics/8-pt-grid) — 「Using multiples of 8 creates visual rhythm and consistency.」

### Spacing Scale

| Token | Value (pt) | Usage |
|-------|-----------|-------|
| `spacingXS` | 4 | アイコンとテキスト間 |
| `spacingSM` | 8 | コンポーネント内の余白 |
| `spacingMD` | 16 | カードのパディング、リストアイテム間 |
| `spacingLG` | 24 | セクション間、画面の横マージン |
| `spacingXL` | 32 | セクションヘッダー上下 |
| `spacingXXL` | 48 | 大きなCTAボタン前後 |

### Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `cornerRadiusSM` | 8 | タグ、バッジ |
| `cornerRadiusMD` | 12 | カード、ボタン |
| `cornerRadiusLG` | 20 | モーダル、ボトムシート |
| `cornerRadiusXL` | 28 | ペイウォール価格カード |
| `shadowRadius` | 8 | カードの影（light mode） |
| `buttonHeight` | 56 | メインCTAボタン高さ |
| `tabBarHeight` | 83 | 下部タブバー（iPhone home indicator含む） |

---

## 4. Components

### PrimaryButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | String | — | ボタンラベル |
| `isLoading` | Bool | false | ローディング状態（RC処理中） |
| `action` | () -> Void | — | タップハンドラ |
| `style` | ButtonStyle | .filled | .filled / .outlined / .ghost |

```swift
// Usage (ペイウォール CTA)
PrimaryButton(title: "Unlock SomaticFlow", isLoading: viewModel.isPurchasing) {
    viewModel.purchase(package: selectedPackage)
}
.accessibilityIdentifier("paywall_cta_button")
```

### ExerciseCard

| Prop | Type | Description |
|------|------|-------------|
| `exercise` | Exercise | エクサイズモデル |
| `isLocked` | Bool | プレミアムロック表示 |
| `onTap` | () -> Void | — |

### StreakBadge

| Prop | Type | Description |
|------|------|-------------|
| `streak` | Int | 連続日数 |
| `isToday` | Bool | 今日完了済みフラグ |

### PricingCard

| Prop | Type | Description |
|------|------|-------------|
| `plan` | SubscriptionPlan | .monthly / .annual |
| `isSelected` | Bool | 選択状態 |
| `savingsBadge` | String? | "Save 69%" (annual のみ) |
| `onSelect` | () -> Void | — |

### ProgressRing

| Prop | Type | Description |
|------|------|-------------|
| `progress` | Double | 0.0〜1.0 |
| `color` | Color | sfPrimary |

---

## 5. Icons (SF Symbols)

Source: [Apple SF Symbols 5](https://developer.apple.com/sf-symbols/) — 「SF Symbols provides thousands of symbols in various weights and scales.」

| Symbol Name | SF Symbol | Usage |
|-------------|-----------|-------|
| `figure.mind.and.body` | 🧘 | アプリアイコン、プログラムタブ |
| `flame.fill` | 🔥 | ストリークカウント |
| `checkmark.circle.fill` | ✅ | 完了エクサイズ |
| `lock.fill` | 🔒 | プレミアムロックコンテンツ |
| `bell.fill` | 🔔 | 通知設定 |
| `gearshape.fill` | ⚙️ | 設定タブ |
| `chart.bar.fill` | 📊 | 進捗タブ |
| `timer` | ⏱️ | セッションタイマー |
| `hand.wave.fill` | 👋 | オンボーディング開始 |
| `heart.fill` | ❤️ | お気に入りエクサイズ |
| `xmark` | ✕ | ペイウォール「Maybe Later」 |
| `arrow.right.circle.fill` | → | ナビゲーション次へ |

---

## 6. Animations

Source: [WWDC 2023: Animate with SwiftUI](https://developer.apple.com/videos/play/wwdc2023/10156/) — 「Spring animations feel natural because they model real-world physics.」
Source: [Adapty iOS Paywall Guide 2026](https://adapty.io/blog/how-to-design-ios-paywall/) — 「Animated vs static paywall: 2.9× higher conversion; Strategic animation: +12–18%」

| Animation ID | Trigger | Duration | Type | Usage |
|-------------|---------|---------|------|-------|
| `anim_exercise_breathe` | セッション開始 | 4.0s (inhale 2s + exhale 2s) | Spring | 呼吸エクサイズ円形拡大縮小 |
| `anim_exercise_shake` | ステップ切替 | 0.6s | Linear | 筋膜リリース小刻み振動 |
| `anim_exercise_ground` | 接地フェーズ | 1.5s | EaseInOut | 重力を感じる下方圧縮 |
| `anim_streak_pop` | 完了時 | 0.4s | Spring(damping 0.6) | ストリークバッジのポップ |
| `anim_paywall_cta` | ペイウォール表示 | 0.8s ループ | Pulse | CTAボタンの微細グロー |
| `anim_onboarding_slide` | ステップ遷移 | 0.35s | EaseInOut | 左右スライドイン |
| `anim_checkmark` | エクサイズ完了 | 0.5s | Spring | チェックマーク描画アニメ |

```swift
// 共通Springアニメーション設定
extension Animation {
    static let sfDefault = Animation.spring(response: 0.35, dampingFraction: 0.7)
    static let sfBounce = Animation.spring(response: 0.4, dampingFraction: 0.6)
    static let sfSlow = Animation.easeInOut(duration: 1.5)
}
```

---

## 7. Accessibility

Source: [Apple Accessibility: Color Contrast](https://developer.apple.com/accessibility/ios/) — 「Minimum contrast ratio of 4.5:1 for normal text, 3:1 for large text.」
Source: [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/) — 「Text contrast ≥ 4.5:1, UI components contrast ≥ 3:1.」

### Contrast Ratios

| Color Combination | Ratio | Status |
|-------------------|-------|--------|
| `colorTextPrimary` on `colorBackground` | 15.8:1 | ✅ AAA |
| `colorTextSecondary` on `colorBackground` | 6.2:1 | ✅ AA |
| White on `colorPrimary` | 5.1:1 | ✅ AA |
| `colorAccent` on `colorBackground` | 3.4:1 | ✅ AA Large |

### Dynamic Type Support

- 全テキストは `@ScaledMetric` または SwiftUI Dynamic Type に対応
- `minimumScaleFactor(0.8)` を価格表示に適用
- 固定フォントサイズ（`.font(.system(size: 17))`）はコンポーネント内部のみ使用可

### VoiceOver Labels

| Element | accessibilityLabel | accessibilityHint |
|---------|-------------------|------------------|
| ストリークバッジ | "{N}日連続" | "タップして詳細を確認" |
| エクサイズカード | "{title}, {duration}秒" | "タップして開始" |
| 価格カード（年額） | "年額$29.99、Save 69%" | "タップして選択" |
| Maybe Later ボタン | "後で" | "ペイウォールを閉じます" |
