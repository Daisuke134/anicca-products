# Design System: Micro Mood

## Color Palette

```swift
// All colors defined in Assets.xcassets
extension Color {
    static let mmBackground = Color("Background")     // #0f1419 (dark)
    static let mmSurface    = Color("Surface")        // #1a2332 (card)
    static let mmAccent     = Color("Accent")         // #F4A261 (warm amber)
    static let mmAccentSoft = Color("AccentSoft")     // #F4A26133 (10% opacity)
    static let mmTextPrimary  = Color("TextPrimary")  // #FFFFFF
    static let mmTextSecondary = Color("TextSecondary")// #8899AA
    static let mmSuccess    = Color("Success")        // #4CAF84
    static let mmDanger     = Color("Danger")         // #E05C5C
}
```

| Token | Hex | Use |
|-------|-----|-----|
| Background | #0f1419 | App background |
| Surface | #1a2332 | Cards, bottom sheets |
| Accent | #F4A261 | CTAs, selected states, brand |
| AccentSoft | #F4A26120 | Highlighted backgrounds |
| TextPrimary | #FFFFFF | Headings, main content |
| TextSecondary | #8899AA | Subtitles, metadata |
| Success | #4CAF84 | Confirmation states |
| Danger | #E05C5C | Errors, warnings |

## Mood Colors

| Level | Emoji | Color | Hex |
|-------|-------|-------|-----|
| 5 — Great | 😊 | Warm Green | #4CAF84 |
| 4 — Good | 🙂 | Soft Blue | #5B9BD5 |
| 3 — Okay | 😐 | Neutral Gray | #8899AA |
| 2 — Bad | 😔 | Muted Orange | #D4876B |
| 1 — Awful | 😰 | Soft Red | #E05C5C |

## Typography

```swift
// Font scale using system fonts (supports Dynamic Type)
// SF Pro Display / SF Pro Text via .font()

extension Font {
    static let mmTitle     = Font.system(size: 28, weight: .bold, design: .rounded)
    static let mmHeading   = Font.system(size: 20, weight: .semibold, design: .rounded)
    static let mmBody      = Font.system(size: 16, weight: .regular, design: .default)
    static let mmCaption   = Font.system(size: 13, weight: .regular, design: .default)
    static let mmMoodEmoji = Font.system(size: 40)
}
```

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Title | 28pt | Bold | Screen headings |
| Heading | 20pt | Semibold | Section titles |
| Body | 16pt | Regular | Main content |
| Caption | 13pt | Regular | Metadata, timestamps |
| MoodEmoji | 40pt | — | Mood picker |

## Spacing (8pt grid)

| Token | Value | Use |
|-------|-------|-----|
| xs | 4pt | Inline gaps |
| sm | 8pt | Component padding |
| md | 16pt | Section padding |
| lg | 24pt | Screen padding |
| xl | 32pt | Section separation |

## Corner Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 8pt | Buttons, chips |
| md | 12pt | Cards |
| lg | 20pt | Bottom sheets |
| full | 9999pt | Pills, tags |

## Shadows

```swift
// Card shadow
.shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)

// Subtle shadow
.shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
```

## Components

### MoodButton

```swift
// Mood selection button — 64x64pt, emoji + optional label
struct MoodButton: View {
    let level: MoodLevel
    let isSelected: Bool
    let action: () -> Void
}
// Selected state: border(mmAccent, 2) + scale(1.2)
// Unselected: opacity(0.6)
```

### MoodChart

7-day bar chart using Swift Charts (iOS 16+). Bars colored by mood level.

### EntryCard

```
┌──────────────────────┐
│ 😊  Monday, Feb 26   │
│     Great            │
│     "Had a great..." │
└──────────────────────┘
```
Background: mmSurface, cornerRadius: md, padding: md.

### ProBadge

Small "PRO" chip with accent color background. Used to label Pro-only features.

## App Icon

- 1024×1024px PNG (required for App Store)
- Design: Simple emoji-style face on dark background with amber glow
- Tool: ImageMagick (magick command — CRITICAL RULE 31)
- Export via: `magick -size 1024x1024 ...`
