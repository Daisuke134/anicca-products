# Daily Dhamma — Onboarding & Paywall 改善 Implementation Spec

> **目的: Best Practice に100%準拠した onboarding + paywall で CVR を最大化する**
> **参照: `docs/onboarding-paywall-best-practices.md`**

---

## 開発環境

| 項目 | 値 |
|------|-----|
| アプリパス | `web-apps/daily-dhamma-app/` |
| ブランチ | `feature/onboarding-revamp` (worktree) |
| 対象ファイル | `app/onboarding.tsx`, `app/paywall.tsx`, `locales/en.json`, `locales/ja.json`, `providers/AppProvider.tsx` |
| テスト | `__tests__/onboarding.test.ts` (新規), `maestro/onboarding/` (新規) |

---

## 現状 vs 改善後

### オンボーディングフロー比較

```
現状（3スライド + paywall）:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Slide 1 │ → │ Slide 2 │ → │ Slide 3 │ → │ Paywall │
│ 機能紹介 │   │ 機能紹介 │   │ 通知許可 │   │ 汎用的  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
  ❌ パーソナライズなし
  ❌ 投資感ゼロ
  ❌ perceived value 低い

改善後（7スライド + personalized paywall）:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────────┐
│ Welcome │ → │ Q1:目的 │ → │ Value   │ → │ Q2:時間 │ → │ Building │ → │ Notif   │ → │ Personalized │
│ Hero    │   │ 選択式  │   │ Social  │   │ 選択式  │   │ Plan     │   │ Request │   │ Paywall      │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └──────────┘   └─────────┘   └──────────────┘
  ✅ パーソナライズ即開始
  ✅ 投資感（質問に答えた = 自分ごと）
  ✅ perceived value MAX → paywall
```

### Paywall 比較

```
現状:
┌────────────────────────┐
│      [X] (即表示)       │
│    🌸 アイコン          │
│  "Deepen Your Practice" │  ← 汎用
│  "Unlock more verses"   │  ← 弱い
│                         │
│  ✅ Premium Verses      │
│  ✅ More Reminders      │
│  ✅ Bookmarking         │
│                         │
│  [Monthly] [Yearly]     │  ← バッジなし
│  [Subscribe Now]        │  ← trial なし
│  "Continue with Free"   │
│  "Restore Purchases"    │
└────────────────────────┘

改善後:
┌────────────────────────┐
│      [X] (3秒遅延)     │
│    🌸 アイコン          │
│  "Your Mindful Journey  │  ← パーソナライズ
│   Starts Today"         │
│  "Join 10,000+ who..."  │  ← ソーシャルプルーフ
│                         │
│  ┌─FREE──┬─PREMIUM──┐  │  ← 比較表
│  │ 10法句│ 全法句経  │  │
│  │ 3通知 │ 10通知    │  │
│  │  ❌   │ ブックマーク│  │
│  └───────┴──────────┘  │
│                         │
│  [Monthly]              │
│  [Yearly ⭐ BEST VALUE] │  ← バッジ＋Save%
│                         │
│  [Start Free Trial]     │  ← trial CTA
│  "Maybe later"          │  ← 控えめ
│  "Restore Purchases"    │
└────────────────────────┘
```

---

## タスク一覧

### Phase 1: Onboarding リニューアル

| # | タスク | ファイル | テスト |
|---|--------|---------|--------|
| T1 | `AppProvider` に `onboardingAnswers` state 追加（goal, preferredTime） | `providers/AppProvider.tsx` | unit |
| T2 | Welcome Hero スライド作成（アプリアイコン + 1行ベネフィット + progress dots） | `app/onboarding.tsx` | unit |
| T3 | Q1 スライド: 「What brings you?」4択（emoji + label） | `app/onboarding.tsx` | unit |
| T4 | Value Proposition スライド: social proof + 統計 | `app/onboarding.tsx` | unit |
| T5 | Q2 スライド: 「When do you want wisdom?」4択 | `app/onboarding.tsx` | unit |
| T6 | Building Your Plan スライド: loading animation（1.5秒） | `app/onboarding.tsx` | unit |
| T7 | Notification Permission スライド（ベネフィット明示 → permission request） | `app/onboarding.tsx` | unit |
| T8 | Progress bar コンポーネント（全スライド共通） | `app/onboarding.tsx` | unit |
| T9 | EN/JA ローカライズ: 全新規テキスト追加 | `locales/en.json`, `locales/ja.json` | unit (i18n test) |

### Phase 2: Paywall リニューアル

| # | タスク | ファイル | テスト |
|---|--------|---------|--------|
| T10 | Headline をパーソナライズ化（onboardingAnswers.goal に基づく） | `app/paywall.tsx` | unit |
| T11 | Social proof テキスト追加（「Join 10,000+...」） | `app/paywall.tsx`, `locales/*` | unit |
| T12 | Free vs Premium 比較表コンポーネント | `app/paywall.tsx` | unit |
| T13 | Yearly プランに「BEST VALUE」バッジ + 「Save X%」表示 | `app/paywall.tsx`, `locales/*` | unit |
| T14 | CTA テキスト変更: 「Subscribe Now」→「Start Free Trial」 | `app/paywall.tsx`, `locales/*` | unit |
| T15 | X ボタン 3秒遅延表示 | `app/paywall.tsx` | unit |
| T16 | 「Continue with Free」→「Maybe later」+ スタイル控えめ化 | `app/paywall.tsx`, `locales/*` | unit |

### Phase 3: テスト & 提出

| # | タスク | ファイル | テスト |
|---|--------|---------|--------|
| T17 | Onboarding unit tests（全スライド遷移、state 保存） | `__tests__/onboarding.test.ts` | - |
| T18 | Maestro E2E: onboarding full flow | `maestro/onboarding/01-full-flow.yaml` | - |
| T19 | Maestro E2E: paywall display + plan selection | `maestro/paywall/02-paywall-revamp.yaml` | - |
| T20 | EAS Build + App Store submission | - | - |

---

## 新規テキスト（EN/JA）

### Onboarding 新規テキスト

| Key | EN | JA |
|-----|----|----|
| `onboarding.welcome.title` | "Find Your Daily\nMoment of Peace" | "毎日の\n心の安らぎを見つける" |
| `onboarding.welcome.subtitle` | "Ancient wisdom, personalized for you" | "あなたのための、古代の智慧" |
| `onboarding.q1.title` | "What brings you here?" | "あなたの目的は？" |
| `onboarding.q1.option.peace` | "Inner peace" | "心の平穏" |
| `onboarding.q1.option.wisdom` | "Daily wisdom" | "毎日の智慧" |
| `onboarding.q1.option.routine` | "Morning routine" | "朝のルーティン" |
| `onboarding.q1.option.mindfulness` | "Mindfulness" | "マインドフルネス" |
| `onboarding.value.title` | "You're in good company" | "多くの人が実践しています" |
| `onboarding.value.stat` | "10,000+ people start each day\nwith ancient wisdom" | "1万人以上が毎朝\n古代の智慧で1日を始めています" |
| `onboarding.q2.title` | "When would you like\nyour daily wisdom?" | "毎日の智慧を\nいつ受け取りますか？" |
| `onboarding.q2.option.morning` | "Morning" | "朝" |
| `onboarding.q2.option.midday` | "Midday" | "昼" |
| `onboarding.q2.option.evening` | "Evening" | "夕方" |
| `onboarding.q2.option.custom` | "Custom time" | "カスタム" |
| `onboarding.building.title` | "Creating your practice..." | "あなた専用のプランを作成中..." |
| `onboarding.building.subtitle` | "Personalizing your daily wisdom" | "毎日の智慧をパーソナライズしています" |
| `onboarding.notif.title` | "Never miss your\ndaily wisdom" | "毎日の智慧を\n見逃さない" |
| `onboarding.notif.subtitle` | "Get a gentle reminder at your preferred time" | "お好みの時間にやさしい通知をお届けします" |

### Paywall 新規・変更テキスト

| Key | EN | JA |
|-----|----|----|
| `paywall.title.personalized.peace` | "Your Path to\nInner Peace" | "心の平穏への\nあなたの道" |
| `paywall.title.personalized.wisdom` | "Your Daily Wisdom\nAwaits" | "あなたの毎日の\n智慧が待っています" |
| `paywall.title.personalized.routine` | "Your Morning\nRitual is Ready" | "あなたの朝の\n儀式が整いました" |
| `paywall.title.personalized.mindfulness` | "Your Mindful Journey\nStarts Today" | "マインドフルな旅が\n今日始まる" |
| `paywall.title.default` | "Your Mindful Journey\nStarts Today" | "マインドフルな旅が\n今日始まる" |
| `paywall.socialProof` | "Join 10,000+ mindful practitioners" | "1万人以上の実践者と一緒に" |
| `paywall.compare.free` | "Free" | "無料" |
| `paywall.compare.premium` | "Premium" | "プレミアム" |
| `paywall.compare.verses.free` | "10 verses" | "10の法句経" |
| `paywall.compare.verses.premium` | "All 423 verses" | "全423の法句経" |
| `paywall.compare.reminders.free` | "3x / day" | "1日3回" |
| `paywall.compare.reminders.premium` | "Up to 10x / day" | "1日最大10回" |
| `paywall.compare.bookmark.free` | "—" | "—" |
| `paywall.compare.bookmark.premium` | "Unlimited" | "無制限" |
| `paywall.plan.bestValue` | "BEST VALUE" | "最もお得" |
| `paywall.plan.savePercent` | "Save {percent}%" | "{percent}%お得" |
| `paywall.cta` | "Start Free Trial" | "無料トライアルを始める" |
| `paywall.free` | "Maybe later" | "あとで" |

---

## 状態管理の変更

### AppProvider 追加 interface

```typescript
interface OnboardingAnswers {
  goal: 'peace' | 'wisdom' | 'routine' | 'mindfulness' | null;
  preferredTime: 'morning' | 'midday' | 'evening' | 'custom' | null;
}
```

| フィールド | 用途 | 保存先 |
|-----------|------|--------|
| `goal` | paywall ヘッドライン分岐 + analytics | AsyncStorage |
| `preferredTime` | 通知デフォルト時刻設定 | AsyncStorage |

---

## Paywall ヘッドライン分岐ロジック

```typescript
function getPaywallTitle(goal: string | null): TranslationKey {
  switch (goal) {
    case 'peace':       return 'paywall.title.personalized.peace';
    case 'wisdom':      return 'paywall.title.personalized.wisdom';
    case 'routine':     return 'paywall.title.personalized.routine';
    case 'mindfulness': return 'paywall.title.personalized.mindfulness';
    default:            return 'paywall.title.default';
  }
}
```

---

## X ボタン遅延表示ロジック

```typescript
const [showClose, setShowClose] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setShowClose(true), 3000);
  return () => clearTimeout(timer);
}, []);

// JSX
{showClose && (
  <TouchableOpacity onPress={handleSkip}>
    <X size={20} />
  </TouchableOpacity>
)}
```

---

## Building Your Plan アニメーション

```typescript
// 1.5秒のローディングアニメーション後に自動遷移
useEffect(() => {
  if (currentStep === 'building') {
    const timer = setTimeout(() => goToNext(), 1500);
    return () => clearTimeout(timer);
  }
}, [currentStep]);
```

表示要素:
- 🌸 蓮のアイコン（回転アニメーション）
- "Creating your practice..." テキスト（フェードイン）
- プログレスバー（1.5秒で 0→100%）

---

## E2E テストシナリオ

### Maestro: Full Onboarding Flow

```yaml
# maestro/onboarding/01-full-flow.yaml
appId: com.dailydhamma.app
---
- assertVisible: "Find Your Daily"
- tapOn: "Continue"
- assertVisible: "What brings you here?"
- tapOn: "Inner peace"
- tapOn: "Continue"
- assertVisible: "good company"
- tapOn: "Continue"
- assertVisible: "When would you"
- tapOn: "Morning"
- tapOn: "Continue"
- assertVisible: "Creating your practice"
- waitForAnimationToEnd
- assertVisible: "Never miss"
- tapOn: "Enable Notifications"
# Paywall
- assertVisible: "Inner Peace"
- assertVisible: "BEST VALUE"
- assertVisible: "Start Free Trial"
- tapOn: "Maybe later"
# Main screen
- assertVisible: "Daily Dhamma"
```

---

## チェックリスト（GATE 3 前）

| # | チェック項目 | 状態 |
|---|------------|------|
| 1 | 全7スライド + paywall が正しく遷移する | ⬜ |
| 2 | Q1/Q2 の回答が AsyncStorage に保存される | ⬜ |
| 3 | Paywall ヘッドラインが goal に基づいて分岐する | ⬜ |
| 4 | X ボタンが 3秒後に表示される | ⬜ |
| 5 | EN/JA 両方のテキストが正しく表示される | ⬜ |
| 6 | 「BEST VALUE」バッジが Yearly に表示される | ⬜ |
| 7 | Free vs Premium 比較表が表示される | ⬜ |
| 8 | CTA が「Start Free Trial」 | ⬜ |
| 9 | Social proof テキストが表示される | ⬜ |
| 10 | Maestro E2E が全 PASS | ⬜ |
| 11 | Unit tests が全 PASS | ⬜ |
| 12 | Apple 審査ガイドライン準拠（Skip可、価格明示、Terms/Privacy リンク） | ⬜ |

---

最終更新: 2026-03-10
