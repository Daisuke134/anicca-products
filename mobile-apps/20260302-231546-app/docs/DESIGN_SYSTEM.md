# Design System: SleepRitual

**App**: SleepRitual
**Date**: 2026-03-02

---

## 1. Brand Identity

| Attribute | Value |
|-----------|-------|
| Tone | Calm, encouraging, non-judgmental |
| Personality | A wise friend who helps you wind down — not a productivity drill sergeant |
| Visual mood | Soft, dark-mode-first, nighttime palette |

---

## 2. Color Palette

### Primary Colors (Dark Mode Base)

| Name | Hex | Usage |
|------|-----|-------|
| `backgroundPrimary` | `#0D0F14` | Main background |
| `backgroundCard` | `#1A1D25` | Cards, surfaces |
| `backgroundElevated` | `#242836` | Modal sheets, elevated elements |
| `accentIndigo` | `#6C7BF7` | Primary CTA, streak highlight |
| `accentMoon` | `#A78BFA` | Secondary accent, paywall highlight |
| `textPrimary` | `#F0F2FF` | Primary text |
| `textSecondary` | `#8B93B0` | Secondary text, subtitles |
| `successGreen` | `#34D399` | Check marks, completion state |
| `streakOrange` | `#F97316` | Streak flame, streak number |

### Light Mode Variants

| Dark | Light |
|------|-------|
| `#0D0F14` | `#F8F9FF` |
| `#1A1D25` | `#FFFFFF` |
| `#6C7BF7` | `#4F5FE8` |

**Implementation**: Use SwiftUI's `Color("colorName")` with asset catalog, or `@Environment(\.colorScheme)` for adaptive colors.

---

## 3. Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| `displayTitle` | SF Pro Rounded | 32pt | Bold |
| `title1` | SF Pro Rounded | 24pt | Semibold |
| `title2` | SF Pro | 20pt | Semibold |
| `body` | SF Pro | 17pt | Regular |
| `bodyEmphasized` | SF Pro | 17pt | Medium |
| `caption` | SF Pro | 13pt | Regular |
| `streakNumber` | SF Pro Rounded | 48pt | Bold |

**Note**: SF Pro Rounded is system font — use `.design(.rounded)` in SwiftUI:
```swift
Font.system(size: 32, weight: .bold, design: .rounded)
```

---

## 4. Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4pt | Micro gaps |
| `sm` | 8pt | Tight spacing |
| `md` | 16pt | Standard padding |
| `lg` | 24pt | Section spacing |
| `xl` | 32pt | Large gaps |
| `xxl` | 48pt | Screen-level padding |

---

## 5. Component Library

### 5.1 RitualStepRow

```
┌────────────────────────────────┐
│ ○  Dim the lights         ≡   │
│ ✓  Read 10 pages (checked) ≡  │
└────────────────────────────────┘
```

- Checkbox: circle → checkmark with spring animation
- Drag handle: `≡` symbol, right-aligned
- Background: `backgroundCard` with `md` corner radius (12pt)
- Checked state: `successGreen` fill, strikethrough text at 0.5 opacity

### 5.2 StreakBadge

```
┌──────────────┐
│  🔥  14      │
│  day streak  │
└──────────────┘
```

- Icon: SF Symbol `flame.fill` in `streakOrange`
- Number: `streakNumber` typography
- Label: `caption` + `textSecondary`
- Background: `backgroundCard` with `lg` radius

### 5.3 PrimaryButton

```swift
Button(title) { action }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 16)
    .background(Color("accentIndigo"))
    .foregroundColor(.white)
    .font(.system(size: 17, weight: .semibold))
    .cornerRadius(14)
```

### 5.4 SecondaryButton (Maybe Later)

```swift
Button("Maybe Later") { dismiss }
    .font(.system(size: 15, weight: .regular))
    .foregroundColor(Color("textSecondary"))
```

---

## 6. Animation Tokens

| Animation | Type | Duration |
|-----------|------|---------|
| Step completion | Spring (damping: 0.7, velocity: 0.5) | — |
| Confetti burst | Custom particle | 1.5s |
| Screen transitions | SwiftUI default + `.easeInOut` | 0.3s |
| Paywall sheet | `.sheet` standard | system |

---

## 7. Icons

Use SF Symbols exclusively:
- `moon.stars.fill` — app icon concept, home screen
- `flame.fill` — streak
- `checkmark.circle.fill` — completed step
- `circle` — incomplete step
- `line.3.horizontal` — drag handle
- `bell.fill` — reminder setting
- `gear` — settings tab
- `house.fill` — home tab
- `pencil` — ritual builder tab
