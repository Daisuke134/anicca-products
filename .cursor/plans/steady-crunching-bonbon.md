# Daily Dhamma v1.1.0 — Multi-Step Paywall + 正語コピー + スキル改善

## Context

3-step paywall（Cravotta Method）は `docs/onboarding-paywall-implementation-spec.md` に設計済みだが**コード未実装**。
現状の `paywall.tsx` は単一画面。Fix 1（error.code）と Fix 3（通知i18n）は実装済み・push済み（release/1.7.0直接 = ルール違反）。

残り問題：
1. **設定/ブックマークからPaywall → Step 3（本体）だけ出すべき** → 3ステップ実装 + source routing
2. **「1万人以上の実践者」は虚偽 → Right Speech違反** → Authority + Content Volume Proof に変更
3. **ios-app-onboarding スキルが `.claude/skills/` にない** → 移動 + 不足項目追加

**作業ブランチ:** release/1.7.0 直接（ワークツリー不使用、ユーザー承認済み）

---

## TODO

### 環境整備

| # | タスク | ファイル |
|---|--------|---------|
| T1 | スキル移動: `skills/ios-app-onboarding/` → `.claude/skills/ios-app-onboarding/` | SKILL.md |
| T2 | メモリ更新:「ios-app-onboarding = オンボーディング+ペイウォールBPの決定版スキル」 | MEMORY.md |

### スキル改善（T1 の後）

| # | タスク | 追加内容 |
|---|--------|---------|
| T3 | Social Proof Phase戦略セクション追加 | Phase 1（0-100）: Authority+Content Volume、Phase 2（100-1000）: App Store Rating、Phase 3（1000+）: 実数 |
| T4 | Source routing セクション追加 | onboarding→3ステップ全表示、設定/機能制限→Step 3直行（X即表示、dotsなし） |
| T5 | 倫理ガイドライン追加 | Banned Patternsに「虚偽ソーシャルプルーフ（検証不可能なユーザー数）→ BANNED」 |
| T6 | Prayer Lock 3項目追加 | Answer Mirroring、Review Modal After Core Experience、Anti-Patterns テーブル |

### Paywall実装

| # | タスク | ファイル |
|---|--------|---------|
| T7 | `paywall.tsx` を3ステップ構成にリファクタ（PaywallStep state管理） | `app/paywall.tsx` |
| T8 | Step 1: Risk-Free Primer UI（価格なし、CTA "次へ"） | `app/paywall.tsx` |
| T9 | Step 2: Transparency Promise UI（timeline、CTA "了解しました"） | `app/paywall.tsx` |
| T10 | Step 3: Hard Close UI（比較表、BEST VALUE、Social Proof、CTA変更） | `app/paywall.tsx` |
| T11 | Source routing: `source=onboarding` → Step 1開始、それ以外 → Step 3直行 | `app/paywall.tsx` |
| T12 | X ボタン制御: Step 1/2 非表示、Step 3 onboarding=3秒遅延/設定=即表示 | `app/paywall.tsx` |
| T13 | Step dots（● ○ ○）onboarding時のみ表示 | `app/paywall.tsx` |
| T14 | Trial Reminder 通知（Day 5）スケジュール関数追加 | `utils/notifications.ts` |

### コピー変更

| # | タスク | ファイル |
|---|--------|---------|
| T15 | ソーシャルプルーフ変更:「1万人」→「2,500年の智慧。423の教え。」 | `locales/*.json` |
| T16 | CTA変更:「登録する」→「無料トライアルを始める」 | `locales/*.json` |
| T17 | Skip変更:「無料で続ける」→「あとで」 | `locales/*.json` |
| T18 | 全新規キー追加（step1/step2/compare/bestValue/trialReminder） | `locales/*.json` |
| T19 | 日本語テキスト「デイリーダンマ」統一 | `locales/ja.json` |

### 検証

| # | タスク |
|---|--------|
| T20 | `npm test` 全パス |
| T21 | シミュレーター JA: オンボーディング→Step 1→2→3（X 3秒遅延、dots、比較表、BEST VALUE） |
| T22 | メイン→ブックマーク→Step 3直行（X即表示、dotsなし） |
| T23 | 設定→プレミアム→Step 3直行 |
| T24 | ソーシャルプルーフ「2,500年」確認、CTA「無料トライアル」確認 |
| T25 | コミット & push |

### 別タスク

| # | タスク |
|---|--------|
| T26 | App Store表示名: **JA のみ**「デイリーダンマ」に変更（EN は "Daily Dhamma" のまま）（`asc metadata update`） |

---

## Paywall 3ステップ構造

```
type PaywallStep = 'risk-free' | 'transparency' | 'hard-close';

source === 'onboarding' → Step 1 → Step 2 → Step 3
source !== 'onboarding' → Step 3 直行
```

### Step 1: Risk-Free Primer

| 要素 | EN | JA |
|------|-----|-----|
| Icon | 🌸 | 🌸 |
| Title | Try Daily Dhamma\nfor free | デイリーダンマを\n無料でお試しください |
| Subtitle | Experience the full power of ancient wisdom — at no cost | 古代の智慧の力を、まずは無料で体験してください |
| 価格 | **なし** | **なし** |
| CTA | Continue | 次へ |
| Dots | ● ○ ○ | ● ○ ○ |

### Step 2: Transparency Promise

| 要素 | EN | JA |
|------|-----|-----|
| Icon | 📅 | 📅 |
| Title | We'll remind you\nbefore any charge | 課金前に\n必ずお知らせします |
| Timeline ✅ | Today — Start your free trial | 今日 — 無料トライアル開始 |
| Timeline 🔔 | Day 5 — We'll send you a reminder | 5日目 — リマインダーをお送りします |
| Timeline 💳 | Day 7 — Trial ends, subscription begins | 7日目 — トライアル終了、サブスクリプション開始 |
| CTA | Got it | 了解しました |
| Dots | ○ ● ○ | ○ ● ○ |

### Step 3: Hard Close

| 要素 | EN | JA |
|------|-----|-----|
| X button | onboarding: 3秒遅延 / 設定: 即表示 | 同左 |
| Icon | 🌸 | 🌸 |
| Title | Your Mindful Journey\nStarts Today | マインドフルな旅が\n今日始まる |
| Social Proof | 2,500 years of wisdom. 423 verses for daily practice. | 2,500年の智慧。毎日の修行のための423の教え。 |
| 比較表 Free | 10 verses / 3x day / — | 10の法句経 / 1日3回 / — |
| 比較表 Premium | All 423 / Up to 10x / Unlimited | 全423 / 最大10回 / 無制限 |
| Yearly バッジ | ⭐ BEST VALUE | ⭐ 最もお得 |
| CTA | Start Free Trial | 無料トライアルを始める |
| Skip | Maybe later | あとで |
| Dots | ○ ○ ●（onboardingのみ） | ○ ○ ●（onboardingのみ） |

---

## スキル改善パッチ詳細

対象: `skills/ios-app-onboarding/SKILL.md` → `.claude/skills/ios-app-onboarding/SKILL.md`

### P1: Social Proof Phase戦略（Conversion Optimization セクション後に追加）

```markdown
## Social Proof Phase Strategy

| Phase | Condition | What to Show | Source |
|-------|-----------|-------------|--------|
| **Phase 1 (0-100 users)** | No credible user count | Authority Proof + Content Volume Proof | NN/Group Authority Principle |
| **Phase 2 (100-1000 users)** | 10+ App Store reviews | Add "Rated X.X on App Store" | CXL: verifiable social proof is most effective |
| **Phase 3 (1,000+ users)** | Credible number | Real user count social proof | Standard best practice |

### Phase 1 Alternatives (When User Count is Too Low)

| Type | Example (EN) | Example (JA) | Source |
|------|-------------|-------------|--------|
| Authority Proof | "2,500 years of wisdom" | "2,500年の智慧" | NN/Group Authority Principle |
| Content Volume | "423 verses from the Pali Canon" | "パーリ聖典から423の教え" | Cialdini: specific verifiable numbers |
| Risk Removal | "7-day free trial. Cancel anytime." | "7日間無料。いつでもキャンセル可能。" | Cravotta: CVR 2x |

> **NEVER use fake user numbers.** Unverifiable claims destroy trust — the highest-leverage variable.
```

### P2: Source Routing（Multi-Step Paywall セクション後に追加）

```markdown
## Paywall Source Routing

| Access Point | Flow | X Button | Step Dots |
|-------------|------|----------|-----------|
| Onboarding completion | Step 1 → 2 → 3 | Step 3 only, 3s delay | Visible |
| Settings / Feature gate | Step 3 only | Immediate | Hidden |
```

### P3: Banned Patterns に追加

```markdown
| **Fake social proof** | **BANNED** | Right Speech / trust destruction. Use Authority Proof instead |
```

### P4: Prayer Lock 3項目（Workflow セクション後に追加）

```markdown
## Additional Design Rules (Prayer Lock / Mau)

| Rule | Detail |
|------|--------|
| **Answer Mirroring** | Mirror user's onboarding answers back in subsequent screens to create personalization feeling |
| **Review Modal After Core Experience** | Request App Store review RIGHT AFTER user completes core feature (peak satisfaction) |

### Anti-Patterns

| Bad | Good |
|-----|------|
| Skip straight to paywall | 3-act structure with value delivery first |
| Ask questions without using answers | Mirror answers back in later screens |
| Describe features in text | Let users experience the core feature |
| Hard paywall (no skip) | Soft paywall with [Maybe Later] |
| Generic "Welcome to AppName" | Problem-focused hook that resonates |
| Request review on first launch | Request after core feature completion |
| Fake user numbers | Authority/Content Volume proof |
```

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `.claude/skills/ios-app-onboarding/SKILL.md` | 移動 + P1-P4 追加 |
| `mobile-apps/daily-dhamma-app/app/paywall.tsx` | 3ステップ state + Step 1/2/3 UI + source routing + X制御 + dots + 比較表 |
| `mobile-apps/daily-dhamma-app/locales/en.json` | 全新規キー + cta/free/socialProof変更 |
| `mobile-apps/daily-dhamma-app/locales/ja.json` | 同上（日本語、「デイリーダンマ」統一） |
| `mobile-apps/daily-dhamma-app/utils/notifications.ts` | `scheduleTrialReminder()` 追加 |
| MEMORY.md | スキル記録追加 |

---

## 検証手順

| Step | やること |
|------|---------|
| 1 | release/1.7.0 で直接コード修正 |
| 2 | `npm test` — 既存48テスト全パス |
| 3 | シミュレーター JA アンインストール → 再インストール |
| 4 | オンボーディング完走 → Step 1→2→3（X 3秒遅延、dots、比較表、BEST VALUE）確認 |
| 5 | メイン→ブックマーク→Step 3直行（X即表示、dotsなし）確認 |
| 6 | 設定→プレミアム→Step 3直行 確認 |
| 7 | 「2,500年の智慧」確認、「無料トライアルを始める」確認 |
| 8 | コミット & push |
