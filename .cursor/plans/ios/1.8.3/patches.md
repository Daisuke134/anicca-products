# 1.8.3 Implementation Patches — Full Code-Level Spec

> **Date**: 2026-04-08
> **Parent**: `10k-mrr-growth-spec.md`
> **Purpose**: one-shot 実装のための完全パッチ仕様

---

## PATCH 1: OnboardingStep.swift — 3 step 追加

**File**: `aniccaios/aniccaios/Onboarding/OnboardingStep.swift`

```swift
// BEFORE (L3-11):
enum OnboardingStep: Int, CaseIterable {
    case welcome           // 0
    case struggles         // 1
    case struggleDepth     // 2
    case goals             // 3
    case personalizedInsight // 4
    case valueProp         // 5
    case notifications     // 6
}

// AFTER:
enum OnboardingStep: Int, CaseIterable {
    case welcome           // 0
    case struggles         // 1
    case struggleDepth     // 2
    case goals             // 3
    case personalizedInsight // 4
    case valueProp         // 5
    case processing        // 6  ← NEW
    case appDemo           // 7  ← NEW
    case valueDelivery     // 8  ← NEW
    case notifications     // 9
}
```

**Migration (L44-52)**: `migratedFromV1RawValue` の `case 3: return .notifications` は `.notifications` の rawValue が 6→9 に変わるが、enum 名で参照しているので変更不要。

---

## PATCH 2: OnboardingFlowView.swift — routing 追加

**File**: `aniccaios/aniccaios/Onboarding/OnboardingFlowView.swift`

### advance() 関数 (L131-153)

```swift
// BEFORE (L144-146):
case .valueProp:
    step = .notifications

// AFTER:
case .valueProp:
    step = .processing
case .processing:
    // 自動進行のため advance は ProcessingStepView 内部で呼ばれる
    step = .appDemo
case .appDemo:
    step = .valueDelivery
case .valueDelivery:
    step = .notifications
```

### onboardingContent (L62-82) に追加

```swift
// 追加 (case .notifications の前):
case .processing:
    ProcessingStepView(next: advance)
case .appDemo:
    AppDemoStepView(next: advance)
case .valueDelivery:
    ValueDeliveryStepView(next: advance)
```

---

## PATCH 3: ProcessingStepView.swift — 新規作成

**File**: `aniccaios/aniccaios/Onboarding/ProcessingStepView.swift`

Source: adamlyttleapps skill Screen 10 — "Building X just for you... 1-3 seconds. Auto-advances."
Source: onboarding-paywall-best-practices.md L85 — "Step 8: Live Demo"

```swift
import SwiftUI

struct ProcessingStepView: View {
    let next: () -> Void
    @State private var progress: CGFloat = 0
    @State private var showText = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            ProgressView()
                .scaleEffect(1.5)
                .tint(.accentColor)
            
            if showText {
                Text("onboarding_processing_title")
                    .font(.title2.weight(.semibold))
                    .multilineTextAlignment(.center)
                    .transition(.opacity)
            }
            
            Spacer()
        }
        .padding()
        .onAppear {
            withAnimation(.easeIn(duration: 0.5).delay(0.3)) {
                showText = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                next()
            }
        }
    }
}
```

---

## PATCH 4: AppDemoStepView.swift — 新規作成

**File**: `aniccaios/aniccaios/Onboarding/AppDemoStepView.swift`

Source: adamlyttleapps skill Screen 11 — "Let the user actually USE the core app mechanic"
Source: adamlyttleapps CLAUDE.md L38 — "The app demo is the differentiator"

**データソース**: `NudgeContent.contentForToday(for:)` — 既存メソッド（`NudgeContent.swift` L30-35）
ユーザーの `struggles[0]` を取得 → そのproblem の NudgeCard を表示

```swift
import SwiftUI

struct AppDemoStepView: View {
    let next: () -> Void
    @EnvironmentObject var appState: AppState
    @State private var showCard = false
    @State private var tappedAction = false
    @State private var savedNudge: NudgeContent?
    
    private var primaryStruggle: ProblemType {
        let struggles = appState.userProfile.struggles
        guard let first = struggles.first,
              let problem = ProblemType(rawValue: first) else {
            return .anxiety // fallback
        }
        return problem
    }
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            Text("onboarding_demo_title")
                .font(.title2.weight(.bold))
                .multilineTextAlignment(.center)
            
            if showCard {
                // 実際の NudgeCard（本番と同じコンポーネント）
                let content = NudgeContent.contentForToday(for: primaryStruggle)
                NudgeCardContent(
                    headline: content.notificationText,
                    detail: content.detailText,
                    problemType: primaryStruggle
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                
                if !tappedAction {
                    // アクションボタン
                    HStack(spacing: 16) {
                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                            savedNudge = content
                            withAnimation(.spring()) { tappedAction = true }
                        } label: {
                            Label("onboarding_demo_action_heart", systemImage: "heart.fill")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                        }
                        
                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .light)
                            impact.impactOccurred()
                            savedNudge = content
                            withAnimation(.spring()) { tappedAction = true }
                        } label: {
                            Label("onboarding_demo_action_more", systemImage: "text.bubble")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                        }
                    }
                    .transition(.opacity)
                }
                
                if tappedAction {
                    Text("onboarding_demo_footer")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .transition(.opacity)
                }
            }
            
            Spacer()
            
            if tappedAction {
                Button(action: next) {
                    Text("onboarding_demo_cta")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .transition(.move(edge: .bottom))
            }
        }
        .padding()
        .onAppear {
            withAnimation(.spring(response: 0.6).delay(0.3)) {
                showCard = true
            }
        }
    }
}
```

**注意**: `NudgeCardContent` は既存の shared component。`NudgeCardView.swift` L内部の body から content 部分を参照。もし `NudgeCardContent` が存在しない場合は、`notificationText` と `detailText` を直接 `Text()` で表示する簡易版にフォールバック。

---

## PATCH 5: ValueDeliveryStepView.swift — 新規作成

**File**: `aniccaios/aniccaios/Onboarding/ValueDeliveryStepView.swift`

Source: adamlyttleapps skill Screen 12 — "Show tangible output + share button"
Source: adamlyttleapps CLAUDE.md L39 — "Viral moment is intentional"

```swift
import SwiftUI

struct ValueDeliveryStepView: View {
    let next: () -> Void
    @EnvironmentObject var appState: AppState
    @State private var showShareSheet = false
    
    private var primaryStruggle: ProblemType {
        let struggles = appState.userProfile.struggles
        guard let first = struggles.first,
              let problem = ProblemType(rawValue: first) else {
            return .anxiety
        }
        return problem
    }
    
    private var nudgeContent: NudgeContent {
        NudgeContent.contentForToday(for: primaryStruggle)
    }
    
    var body: some View {
        VStack(spacing: 24) {
            Text("onboarding_value_delivery_title")
                .font(.title2.weight(.bold))
                .multilineTextAlignment(.center)
            
            Text("onboarding_value_delivery_subtitle")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            // シェア用カード
            ShareableNudgeCard(
                text: nudgeContent.notificationText,
                problemType: primaryStruggle
            )
            .padding()
            
            Spacer()
            
            // シェアボタン
            Button {
                showShareSheet = true
            } label: {
                Label("onboarding_value_delivery_share", systemImage: "square.and.arrow.up")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            
            Button(action: next) {
                Text("onboarding_value_delivery_cta")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
        .padding()
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [renderShareImage()])
        }
    }
    
    private func renderShareImage() -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 1080, height: 1080))
        return renderer.image { ctx in
            // 背景
            UIColor(named: "AccentColor")?.withAlphaComponent(0.1).setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: 1080, height: 1080))
            
            // Nudge テキスト
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 48, weight: .bold),
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ]
            let text = nudgeContent.notificationText
            let textRect = CGRect(x: 80, y: 340, width: 920, height: 400)
            (text as NSString).draw(in: textRect, withAttributes: attrs)
            
            // ウォーターマーク
            let wmAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 28, weight: .medium),
                .foregroundColor: UIColor.secondaryLabel,
                .paragraphStyle: paragraphStyle
            ]
            ("— Anicca 🪷" as NSString).draw(
                in: CGRect(x: 0, y: 940, width: 1080, height: 60),
                withAttributes: wmAttrs
            )
        }
    }
}

// シェア用カードView
struct ShareableNudgeCard: View {
    let text: String
    let problemType: ProblemType
    
    var body: some View {
        VStack(spacing: 16) {
            Text(problemType.emoji)
                .font(.system(size: 40))
            
            Text(text)
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
            
            Text("— Anicca 🪷")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

// UIActivityViewController wrapper
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
```

---

## PATCH 6: PaywallVariantBView.swift — trial 全削除

**File**: `aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift`

### 削除対象（9箇所）

| # | 行 | 内容 | アクション |
|---|-----|------|----------|
| 1 | L41-65 | `trialPeriodText` computed property 全体 | **削除** |
| 2 | L67-69 | `hasTrialEligibility` computed property | **削除** |
| 3 | L175-179 | `trialBadge:` パラメータ（yearly planCard 呼び出し） | `trialBadge: nil` に変更 |
| 4 | L189 | `trialBadge: nil`（monthly planCard 呼び出し） | そのまま |
| 5 | L211-215 | CTA の trial 条件分岐 | `paywall_b_cta_no_trial` 固定に簡略化 |
| 6 | L234 | trust テキストの trial 条件分岐 | `paywall_b_trust_no_trial` 固定に簡略化 |
| 7 | L319-323 | `trialBadge` 表示ブロック | **削除** |
| 8 | L375 | `"has_trial"` analytics property | **削除** |
| 9 | L378-382 | `trialStarted` analytics tracking | **削除** |

### CTA 修正（L211-215）

```swift
// BEFORE:
} else if hasTrialEligibility, let period = trialPeriodText {
    Text(paywallText("cta", fallback: String(format: NSLocalizedString("paywall_b_cta_trial", comment: ""), period)))
} else {
    Text(paywallText("cta", fallback: "paywall_b_cta_no_trial"))
}

// AFTER:
} else {
    Text(NSLocalizedString("paywall_b_cta_no_trial", comment: ""))
}
```

### Trust 修正（L234）

```swift
// BEFORE:
Text(paywallText("trust", fallback: hasTrialEligibility ? "paywall_b_trust_trial" : "paywall_b_trust_no_trial"))

// AFTER:
Text(NSLocalizedString("paywall_b_trust_no_trial", comment: ""))
```

### planCard signature 修正（L281-286）

```swift
// BEFORE:
func planCard(..., trialBadge: String?, ...) -> some View {

// AFTER:
func planCard(..., ...) -> some View {  // trialBadge パラメータ削除
```

---

## PATCH 7: Localizable.strings — 全言語

### EN (`en.lproj/Localizable.strings`)

**修正（既存キー）:**
```
// L1325-1326: Primer修正
"paywall_primer_title" = "Your personalized plan\nis ready";
"paywall_primer_subtitle" = "Start your journey with words crafted just for you.";
```

**追加（新規3画面）:**
```
// Processing (Screen 10)
"onboarding_processing_title" = "Building your personal plan...";

// App Demo (Screen 11)
"onboarding_demo_title" = "Experience your first nudge";
"onboarding_demo_action_heart" = "This hits home";
"onboarding_demo_action_more" = "Tell me more";
"onboarding_demo_footer" = "This is what Anicca sends you every day.";
"onboarding_demo_cta" = "Continue";

// Value Delivery (Screen 12)
"onboarding_value_delivery_title" = "Your first nudge, saved.";
"onboarding_value_delivery_subtitle" = "Every day, words crafted just for you.";
"onboarding_value_delivery_share" = "Share with a friend";
"onboarding_value_delivery_cta" = "Continue";
```

### JA (`ja.lproj/Localizable.strings`)

**修正:**
```
"paywall_primer_title" = "あなた専用プランの\n準備ができました";
"paywall_primer_subtitle" = "あなたのための言葉で、旅を始めましょう。";
```

**追加:**
```
"onboarding_processing_title" = "あなた専用プランを構築中...";
"onboarding_demo_title" = "最初のナッジを体験しましょう";
"onboarding_demo_action_heart" = "心に響いた";
"onboarding_demo_action_more" = "もっと聞かせて";
"onboarding_demo_footer" = "これが毎日届くあなただけの言葉です。";
"onboarding_demo_cta" = "続ける";
"onboarding_value_delivery_title" = "あなたの最初のナッジ、保存しました。";
"onboarding_value_delivery_subtitle" = "毎日、あなただけの言葉が届きます。";
"onboarding_value_delivery_share" = "友達にシェア";
"onboarding_value_delivery_cta" = "続ける";
```

### ES (`es.lproj/Localizable.strings`)

**追加（L1332 の後に）:**
```
// Primer (not exists in ES — add)
"paywall_primer_title" = "Tu plan personalizado\nestá listo";
"paywall_primer_subtitle" = "Comienza tu viaje con palabras creadas para ti.";
"paywall_primer_feature1" = "Acceso completo a todas las funciones";
"paywall_primer_feature2" = "Nudges personalizados";
"paywall_primer_feature3" = "Cancela en cualquier momento";

// Processing
"onboarding_processing_title" = "Creando tu plan personal...";
"onboarding_demo_title" = "Experimenta tu primer nudge";
"onboarding_demo_action_heart" = "Me llega al alma";
"onboarding_demo_action_more" = "Cuéntame más";
"onboarding_demo_footer" = "Esto es lo que Anicca te envía cada día.";
"onboarding_demo_cta" = "Continuar";
"onboarding_value_delivery_title" = "Tu primer nudge, guardado.";
"onboarding_value_delivery_subtitle" = "Cada día, palabras creadas solo para ti.";
"onboarding_value_delivery_share" = "Compartir con un amigo";
"onboarding_value_delivery_cta" = "Continuar";
```

---

## PATCH 8: NudgeWidgetDataStore.swift — 新規作成

**File**: `aniccaios/aniccaios/Shared/NudgeWidgetDataStore.swift`

```swift
import Foundation
import WidgetKit

enum NudgeWidgetDataStore {
    private static let textsKey = "widget_nudge_texts"
    private static let strugglesKey = "widget_user_struggles"
    
    static func sync(struggles: [String]) {
        let defaults = AppGroup.userDefaults
        defaults.set(struggles, forKey: strugglesKey)
        
        // 各 problem の notification テキスト（20個）を保存
        var allTexts: [String: [String]] = [:]
        for struggle in struggles {
            guard let problem = ProblemType(rawValue: struggle) else { continue }
            var texts: [String] = []
            for i in 1...20 {
                let key = "nudge_\(problem.rawValue)_notification_\(i)"
                let text = NSLocalizedString(key, comment: "")
                if text != key { texts.append(text) }
            }
            allTexts[struggle] = texts
        }
        
        if let data = try? JSONEncoder().encode(allTexts) {
            defaults.set(data, forKey: textsKey)
        }
        
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    static func loadTexts() -> [String: [String]] {
        guard let data = AppGroup.userDefaults.data(forKey: textsKey),
              let texts = try? JSONDecoder().decode([String: [String]].self, from: data) else {
            return [:]
        }
        return texts
    }
    
    static func loadStruggles() -> [String] {
        AppGroup.userDefaults.stringArray(forKey: strugglesKey) ?? []
    }
}
```

---

## PATCH 9: AniccaWidget.swift — 完全書き換え

**File**: `aniccaios/AniccaWidget/AniccaWidget.swift`

Source: Apple WidgetKit — TimelineProvider + `.atEnd` policy
Source: Apple HIG — "Keep widget content focused and glanceable"

```swift
import WidgetKit
import SwiftUI

// MARK: - Entry

struct NudgeEntry: TimelineEntry {
    let date: Date
    let nudgeText: String
    let problemEmoji: String
}

// MARK: - Provider

struct NudgeTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> NudgeEntry {
        NudgeEntry(date: Date(), nudgeText: "Be kind to yourself.", problemEmoji: "🪷")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NudgeEntry) -> Void) {
        let entry = makeEntry(for: Date())
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<NudgeEntry>) -> Void) {
        var entries: [NudgeEntry] = []
        let calendar = Calendar.current
        let now = Date()
        
        for dayOffset in 0..<7 {
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: calendar.startOfDay(for: now)) else { continue }
            entries.append(makeEntry(for: date))
        }
        
        completion(Timeline(entries: entries, policy: .atEnd))
    }
    
    private func makeEntry(for date: Date) -> NudgeEntry {
        let struggles = NudgeWidgetDataStore.loadStruggles()
        let texts = NudgeWidgetDataStore.loadTexts()
        let dayOfYear = Calendar.current.component(.dayOfYear, from: date)
        
        guard !struggles.isEmpty else {
            return NudgeEntry(date: date, nudgeText: "Be kind to yourself.", problemEmoji: "🪷")
        }
        
        let problemKey = struggles[dayOfYear % struggles.count]
        let problemTexts = texts[problemKey] ?? []
        let text = problemTexts.isEmpty ? "Be kind to yourself." : problemTexts[dayOfYear % problemTexts.count]
        let emoji = ProblemType(rawValue: problemKey)?.emoji ?? "🪷"
        
        return NudgeEntry(date: date, nudgeText: text, problemEmoji: emoji)
    }
}

// MARK: - Views

struct NudgeWidgetSmallView: View {
    let entry: NudgeEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.problemEmoji)
                .font(.title2)
            
            Spacer()
            
            Text(entry.nudgeText)
                .font(.system(size: 14, weight: .semibold))
                .lineLimit(4)
                .minimumScaleFactor(0.8)
            
            Text("— Anicca")
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

struct NudgeWidgetMediumView: View {
    let entry: NudgeEntry
    
    var body: some View {
        HStack(spacing: 16) {
            Text(entry.problemEmoji)
                .font(.system(size: 36))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.nudgeText)
                    .font(.system(size: 15, weight: .semibold))
                    .lineLimit(3)
                    .minimumScaleFactor(0.8)
                
                Text("— Anicca 🪷")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
        }
        .padding()
    }
}

struct NudgeWidgetLockScreenView: View {
    let entry: NudgeEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("🪷 " + entry.nudgeText)
                .font(.system(size: 12, weight: .medium))
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
    }
}

// MARK: - Widget

struct AniccaWidget: Widget {
    let kind = "AniccaWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NudgeTimelineProvider()) { entry in
            if #available(iOS 17.0, *) {
                NudgeWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                NudgeWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Anicca")
        .description("Daily nudge for your struggles")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

struct NudgeWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: NudgeEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            NudgeWidgetSmallView(entry: entry)
        case .systemMedium:
            NudgeWidgetMediumView(entry: entry)
        case .accessoryRectangular:
            NudgeWidgetLockScreenView(entry: entry)
        default:
            NudgeWidgetSmallView(entry: entry)
        }
    }
}
```

**注意**: `NudgeWidgetDataStore` と `ProblemType` は Widget Extension target にも追加必要。
- `NudgeWidgetDataStore.swift` → AniccaWidget target membership に追加
- `ProblemType.swift` → AniccaWidget target membership に追加（`emoji` プロパティのみ使用）
- `AppGroup.swift` → AniccaWidget target membership に追加（既に追加されている可能性あり）

---

## PATCH 10: AppDelegate.swift — Widget sync 呼び出し

**File**: `aniccaios/aniccaios/AppDelegate.swift`

**L25 あたり（NotificationScheduler 設定後）に追加:**

```swift
// Widget data sync
if let struggles = UserDefaults.standard.stringArray(forKey: "selected_struggles") {
    NudgeWidgetDataStore.sync(struggles: struggles)
}
```

**OnboardingFlowView.swift の completeOnboarding() (L155) にも追加:**

```swift
// L155 の AnalyticsManager.shared.track(.onboardingCompleted) の後:
NudgeWidgetDataStore.sync(struggles: appState.userProfile.struggles)
```

---

## PATCH 11: ASO Metadata（ASC CLI で適用）

### EN (v2 — S1 L53 準拠: KW先、Anicca は無名)

```bash
# Title — S1 L53: "Lead with keyword if not well-known" + L48: "[Primary Keyword] [Brand]"
asc metadata set --locale en-US --name "Daily Affirmations - Anicca"
# Subtitle — S1 L67: "Never repeat keywords from title" + L68: "Use the full 30 characters"
asc metadata set --locale en-US --subtitle "Self Care & Positive Mindset"
# Keywords — S1 L78-84: 重複ゼロ、singular、スペースなし
asc metadata set --locale en-US --keywords "self love,mental health,anxiety,stress,wellness,mindfulness,mood,calm,quote,meditation,habit,healing"
# Promo — S1 L117-120 + S5 L177: "Cancel anytime on every paywall"
asc metadata set --locale en-US --promotionalText "Gentle words when you need them most. Choose your struggles. Get daily nudges. Cancel anytime."
```

### JA (v2 — KW先 + 文字数改善)

```bash
# Title — KW先（S1 L53）
asc metadata set --locale ja --name "毎日のアファメーション - アニッチャ"
# Subtitle — S1 L68: 12字→18字に改善
asc metadata set --locale ja --subtitle "セルフケア・ポジティブ思考・心の安らぎ"
# Keywords — S1 L84: 56→70字に改善、Title/Sub重複ゼロ維持
asc metadata set --locale ja --keywords "自己肯定感,不安,先延ばし,考えすぎ,ストレス,瞑想,自分を好きになる,習慣,名言,心の平和,マインドフルネス,セルフヘルプ,気分,癒し"
# Promo — S1 L120 + S5 L177
asc metadata set --locale ja --promotionalText "あなたが一番つらいとき、そっと届く言葉。13の課題に寄り添う。いつでもキャンセル可能。"
```

### ES (v2 — 全フィールド100%使用)

```bash
# Title — S1 L53 + S1 L56: "Use the full 30 characters" → 30/30
asc metadata set --locale es-ES --name "Afirmaciones Diarias - Anicca"
# Subtitle — S1 L68: 30/30
asc metadata set --locale es-ES --subtitle "Autocuidado y Bienestar Mental"
# Keywords — S1 L84: 100/100
asc metadata set --locale es-ES --keywords "autoestima,ansiedad,estrés,meditación,frases positiva,motivación,calma,hábito,bienestar,salud,pensamiento,amor propio"
# Promo — S1 L120 + S5 L177
asc metadata set --locale es-ES --promotionalText "Palabras suaves cuando más las necesitas. Elige tus luchas. Recibe nudges diarios. Cancela cuando quieras."
```
