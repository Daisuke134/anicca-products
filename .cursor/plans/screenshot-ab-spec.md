# Spec: screenshot-ab — App Store スクリーンショット A/B テスト

**Status:** E2E テスト済み → スキル修正中
**Date:** 2026-04-01
**Author:** Claude Code + ダイス
**ファイルパス:** `.cursor/plans/screenshot-ab-spec.md`

---

## 1. 概要

App Store の Product Page Optimization (PPO) 実験を完全自動で回すクローズドループ。
前回結果チェック → ヘッドライン生成 → スクショ生成 → QA → 承認 → アップロード → 実験開始。

| 項目 | 値 |
|------|-----|
| App | Daily Self Care - Anicca (`6755129214`) |
| Bundle ID | `ai.anicca.app.ios` |
| ロケール | `en-US` + `ja` |
| 画面数 | 4画面 × 2言語 = 8スクリーン |
| cron | `0 10 * * 1`（隔週月曜 10:00 JST） |
| ASC CLI | **0.48.0**（`--started true` で実験開始可能） |
| スクショ生成 | ParthJadhav/app-store-screenshots（Next.js + html-to-image） |
| iPhone フレーム | ParthJadhav 同梱 `mockup.png`（1022x2082, 透明スクリーン領域） |
| デザインサイズ | **1320x2868 (6.9")** でデザイン → 4サイズに自動スケール |
| ASC upload device-type | **APP_IPHONE_67** |
| 実行環境 | Mac Mini（OpenClaw cron） |

---

## 2. 4画面の定義と raw 素材

### 現在の App Store スクショ（Control）

| # | 画面 | EN ヘッドライン | JA ヘッドライン | アプリ画面の内容 |
|---|------|---------------|---------------|----------------|
| 1 | Nudge カード（自己慈悲系） | "Gentle Words For Your Hardest Moments" | "一番辛い時に優しい言葉を" | SELF-COMPASSION / 自分を許せ カード |
| 2 | 悩み選択（Onboarding） | "What weighs on you? We'll be there." | "何が苦しい？そばにいるよ" | Struggle Selection 画面 |
| 3 | My Path | "Your pain. We get it." | "一人で抱え込まなくていい" | My Path 課題一覧画面 |
| 4 | Nudge カード（就寝系） | "Protecting tomorrow's you." | "明日のあなたを守る" | BEDTIME / 大丈夫 カード |

### raw 素材の所在

| # | 画面 | EN raw | JA raw | ソース |
|---|------|--------|--------|--------|
| 1 | Nudge カード | `assets/card-screenshots/en/self_loathing_*.png` (780x1688, 14バリアント) | `assets/card-screenshots/ja/self_loathing_*.png` (780x1688) | CardScreenshotGenerator |
| 2 | 悩み選択 | `.cursor/plans/ios/1.6.3/screenshot-ab-pipeline/raw/02-struggle-selection.png` (1206x2622) | **なし → シミュレータ撮影必要** | pipeline/raw |
| 3 | My Path | **なし → シミュレータ撮影必要** | **なし → シミュレータ撮影必要** | シミュレータ |
| 4 | Nudge カード | `assets/card-screenshots/en/staying_up_late_*.png` (780x1688, 21バリアント) | `assets/card-screenshots/ja/staying_up_late_*.png` (780x1688) | CardScreenshotGenerator |

### カードスクショの生成方法

```bash
# CardScreenshotGenerator（Swift CLI）でアプリ内 NudgeCardView を直接 PNG レンダリング
cd /Users/anicca/anicca-project/aniccaios/CardScreenshotGenerator

# EN全カード生成
swift run CardScreenshotGenerator --language en --output assets/card-screenshots/en

# JA全カード生成
swift run CardScreenshotGenerator --language ja --output assets/card-screenshots/ja

# テスト（1枚だけ）
swift run CardScreenshotGenerator --language en --output /tmp --test-mode
```

**カードスクショ詳細:**
- 780x1688 PNG（ステータスバーなし、フレームなし、純粋なカード画面）
- 13テーマ × 14バリアント = 189枚/言語
- テーマ: alcohol_dependency, anger, anxiety, bad_mouthing, cant_wake_up, loneliness, lying, obsessive, porn_addiction, procrastination, rumination, self_loathing, staying_up_late
- EN/JA 両方あり

### シミュレータでの raw キャプチャ方法

**Screen 2（悩み選択）JA版:**
```bash
# 1. 6.9" シミュレータ起動
xcrun simctl boot 1D9F5D85-7C93-447F-A62E-1DA07A490E93  # iPhone16ProMax-69

# 2. 言語をJAに設定
xcrun simctl spawn booted defaults write NSGlobalDomain AppleLanguages -array ja
xcrun simctl spawn booted defaults write NSGlobalDomain AppleLocale -string ja_JP

# 3. Maestro でオンボーディング → 悩み選択画面まで navigate → スクショ
maestro test << 'YAML'
appId: ai.anicca.app.ios
---
- clearState
- launchApp:
    arguments:
      UITESTING: "true"
- extendedWaitUntil:
    visible:
      id: "onboarding-welcome-cta"
    timeout: 60000
- tapOn:
    id: "onboarding-welcome-cta"
- extendedWaitUntil:
    visible:
      id: "onboarding-struggle-staying_up_late"
    timeout: 15000
- takeScreenshot: "screen2-struggle-ja"
YAML
```

**Screen 3（My Path）EN/JA版:**
```bash
# Maestro でオンボーディング完了 → My Path タブまで navigate
maestro test << 'YAML'
appId: ai.anicca.app.ios
---
- clearState
- launchApp:
    arguments:
      UITESTING: "true"
# オンボーディング通過
- extendedWaitUntil:
    visible:
      id: "onboarding-welcome-cta"
    timeout: 60000
- tapOn:
    id: "onboarding-welcome-cta"
# 悩み選択（複数選択して My Path にデータを入れる）
- extendedWaitUntil:
    visible:
      id: "onboarding-struggle-staying_up_late"
    timeout: 15000
- tapOn:
    id: "onboarding-struggle-staying_up_late"
- tapOn:
    id: "onboarding-struggle-procrastination"
- tapOn:
    id: "onboarding-struggle-rumination"
- tapOn:
    id: "onboarding-struggle-self_loathing"
- tapOn:
    id: "onboarding-struggle-cant_wake_up"
- tapOn:
    id: "onboarding-struggles-next"
# Live Demo 通過
- extendedWaitUntil:
    visible:
      id: "live_demo_trigger_button"
    timeout: 15000
- tapOn:
    id: "live_demo_trigger_button"
- extendedWaitUntil:
    visible:
      id: "nudge-primary-action"
    timeout: 5000
- tapOn:
    id: "nudge-primary-action"
# 通知許可スキップ
- extendedWaitUntil:
    visible:
      id: "onboarding-notifications-allow"
    timeout: 15000
- tapOn:
    id: "onboarding-notifications-skip"
# My Path タブに navigate
- extendedWaitUntil:
    visible: "My Path"
    timeout: 10000
- tapOn: "My Path"
- extendedWaitUntil:
    visible: "Current Struggles"
    timeout: 5000
- takeScreenshot: "screen3-mypath"
YAML
```

**直接 simctl でのスクショ撮影（Maestro の代替）:**
```bash
# アプリが既に目的の画面にある場合
xcrun simctl io booted screenshot ~/Desktop/screen3-mypath.png
```

---

## 3. ツールスタック

| ツール | 役割 | インストール |
|--------|------|------------|
| ASC CLI 0.48.0 | 実験 CRUD + スクショアップロード + 実験開始 | `brew install asc`（0.48.0 確認済み） |
| ParthJadhav/app-store-screenshots | Next.js page.tsx 生成 + mockup.png + html-to-image エクスポート | `npx skills add ParthJadhav/app-store-screenshots`（インストール済み） |
| Playwright | cron 用ヘッドレス PNG エクスポート | `npx playwright install chromium`（インストール済み） |
| bun | パッケージマネージャ（ParthJadhav 推奨優先順位: bun > pnpm > yarn > npm） | 既存 |
| CardScreenshotGenerator | Nudge カード PNG レンダリング | `aniccaios/CardScreenshotGenerator/`（既存） |
| Maestro | シミュレータ画面 navigate + スクショ撮影 | `brew install maestro`（既存） |
| xcrun simctl | シミュレータ起動 + 言語設定 + スクショ撮影 | Xcode 同梱 |

### ParthJadhav/app-store-screenshots の仕組み

```
1. Next.js プロジェクトをスキャフォールド
   bunx create-next-app@latest . --typescript --tailwind --app --src-dir
   bun add html-to-image

2. ファイル構成:
   public/mockup.png           ← iPhone フレーム（スキル同梱、1022x2082）
   public/screenshots/{locale}/ ← raw キャプチャ配置
   src/app/page.tsx             ← 全スライド生成（単一ファイル）
   src/app/layout.tsx           ← フォント設定

3. page.tsx の中身:
   - LOCALES = ["en", "ja"]
   - THEMES = { "calm-premium": { bg, fg, accent, muted } }
   - COPY_BY_LOCALE = { en: { slide1: "...", ... }, ja: { ... } }
   - Phone コンポーネント: mockup.png の透明エリアに raw スクショをオーバーレイ
   - Caption コンポーネント: ヘッドライン表示（canvasW ベースのフォントサイズ）
   - html-to-image の toPng() で DOM → PNG 変換

4. エクスポート:
   - ブラウザ: スライドクリック → PNG ダウンロード
   - ヘッドレス: Playwright で URL アクセス → スクショ
   - ?locale=ja&slide=2&theme=calm-premium で URL パラメータ対応

5. デザインサイズ: 1320x2868 (6.9") → 自動リサイズ 4サイズ
```

### mockup.png の座標（SKILL.md の Phone コンポーネントに使用）

```typescript
const MK_W = 1022;  // mockup 幅
const MK_H = 2082;  // mockup 高さ
const SC_L = (52 / MK_W) * 100;   // スクリーン左オフセット %
const SC_T = (46 / MK_H) * 100;   // スクリーン上オフセット %
const SC_W = (918 / MK_W) * 100;  // スクリーン幅 %
const SC_H = (1990 / MK_H) * 100; // スクリーン高さ %
```

### ASC CLI 0.48.0 コマンド（E2E テストで確認済み）

| コマンド | フラグ | 注意 |
|---------|--------|------|
| `asc localizations list` | `--version $VER_ID`（`--version-id` ではない！） | E2E で判明 |
| `asc product-pages experiments list` | `--v2 --app $APP_ID` | OK |
| `asc product-pages experiments create` | `--v2 --app $APP_ID --platform IOS --name "X" --traffic-proportion 50` | 未テスト |
| `asc screenshots upload` | `--version-localization $LOC_ID --path ./export/ --device-type APP_IPHONE_67 --replace` | Treatment loc 対応は未テスト |

---

## 4. E2E フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    cron: 毎週月曜 10:00 JST                    │
│                    OpenClaw → screenshot-ab                   │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
         ┌── PHASE 0 ──┐
         │ asc apps list │ → APP_ID=6755129214
         │ asc versions  │ → VERSION_ID
         │ asc localizations list --version $VER │ → EN_LOC, JA_LOC
         └──────┬───────┘
                ▼
         ┌── PHASE 1 ──┐
         │ experiments.json → current.experiment_id あるか？
         │ asc product-pages experiments list --v2
         └──────┬───────┘
                ▼
         ┌─────────────────────┐
         │ ID なし?             │──Yes──→ PHASE 3（初回）
         │ 経過 < 7日?         │──Yes──→ EXIT
         │ T CVR > C × 1.2?   │──Yes──→ WINNER → PHASE 2
         │ T CVR ≤ C & 14日+? │──Yes──→ NULL → PHASE 2
         │ 90日?               │──Yes──→ TIMEOUT → PHASE 2
         └─────────┬───────────┘
                   ▼
         ┌── PHASE 2 ──┐
         │ update-experiments-json.py archive │
         │ add-pattern --type winning/losing  │
         └──────┬───────┘
                ▼
         ┌── PHASE 3: ヘッドライン生成 ──────────┐
         │ references/headline-gen.md 参照         │
         │ references/anicca-app-context.md 参照   │
         │ experiments.json の patterns 参照       │
         │ 10案 → 自己採点 → 8/10+ 採用           │
         │ 4画面 × EN + JA = 8ヘッドライン        │
         └──────┬────────────────────────────────┘
                ▼
         ┌── PHASE 4: スクショ生成 ───────────────────────────┐
         │                                                      │
         │ Step 4-1: raw キャプチャ確認                          │
         │   Screen 1,4: assets/card-screenshots/{en,ja}/        │
         │   Screen 2: pipeline/raw/ (EN) or Maestro (JA)       │
         │   Screen 3: Maestro でシミュレータ撮影 (EN + JA)      │
         │                                                      │
         │ Step 4-2: ParthJadhav スキルで page.tsx 生成          │
         │   bunx create-next-app → bun add html-to-image       │
         │   cp mockup.png public/                               │
         │   raw を public/screenshots/{en,ja}/ に配置           │
         │   LOCALES, THEMES, COPY_BY_LOCALE 設定                │
         │                                                      │
         │ Step 4-3: bun dev → ブラウザ or Playwright エクスポート │
         │   1320x2868 (6.9") で全8枚エクスポート                │
         │   → workspace/export/{en,ja}/screen1~4.png           │
         └──────┬───────────────────────────────────────────────┘
                ▼
         ┌── PHASE 5: visual-qa ──┐
         │ 50点採点（5カテゴリ×10pt）│
         │ 40+ = PASS → PHASE 6    │
         │ 39- = FAIL → PHASE 3    │
         │ 3回連続 FAIL → EXIT     │
         └──────┬─────────────────┘
                ▼
         ┌── PHASE 6: Slack 承認 ──┐
         │ PNG 8枚を #metrics アップ │
         │ Slack Files v2 API で実画像表示 │
         │ ✅ Approve → PHASE 7    │
         │ ❌ Deny → PHASE 3       │
         └──────┬──────────────────┘
                ▼
         ┌── PHASE 7: ASC アップロード + 実験開始 ─────────────┐
         │ 7-1: asc product-pages experiments create --v2       │
         │ 7-2: treatments create                               │
         │ 7-3: treatments localizations create ×2 (en-US, ja)  │
         │ 7-4: asc screenshots upload --version-localization    │
         │      --device-type APP_IPHONE_67 --replace ×2        │
         │      (fallback: upload-treatment-screenshots.py)      │
         │ 7-5: experiments update --started true --v2           │
         │ 7-6: update-experiments-json.py set-current           │
         │ 7-7: Slack レポート（実験ID + ヘッドライン + Traffic） │
         └──────────────────────────────────────────────────────┘
```

---

## 5. スキルフォルダ構造

### メイン（OpenClaw — Anicca が使う）

```
~/.openclaw/skills/screenshot-ab/
├── SKILL.md                              ← メインフロー（7 PHASE）
├── references/
│   ├── headline-gen.md                   ← ヘッドライン生成→採点→改善ループ
│   ├── visual-qa.md                      ← 50点 QA 採点プロンプト
│   ├── asc-commands.md                   ← ASC CLI 0.48.0 PPO コマンド
│   └── anicca-app-context.md             ← アプリ概要 + 4画面説明 + ペルソナ
├── scripts/
│   ├── setup-workspace.sh                ← 初回セットアップ + 依存チェック
│   ├── export-screenshots.sh             ← bun dev + Playwright ヘッドレスエクスポート
│   ├── upload-treatment-screenshots.py   ← Apple API 直接アップロード（フォールバック）
│   ├── update-experiments-json.py        ← experiments.json CRUD
│   └── slack-upload.sh                   ← Slack Files v2 API で PNG アップロード
├── assets/
│   └── experiments-template.json
└── workspace/                            ← .gitignore、実行時生成
    ├── screenshot-generator/             ← ParthJadhav スキャフォールド先
    │   ├── public/
    │   │   ├── mockup.png               ← iPhone フレーム（ParthJadhav 同梱）
    │   │   └── screenshots/
    │   │       ├── en/screen1~4.png     ← raw キャプチャ（EN）
    │   │       └── ja/screen1~4.png     ← raw キャプチャ（JA）
    │   ├── src/app/
    │   │   ├── layout.tsx
    │   │   └── page.tsx                 ← 全スライド + ロケール切替 + テーマ
    │   └── package.json
    ├── export/
    │   ├── en/screen1~4.png             ← 最終 PNG（1320x2868 = 6.9"）
    │   └── ja/screen1~4.png
    └── experiments.json
```

### コピー（CC）

```
/Users/anicca/anicca-project/.claude/skills/screenshot-ab/
└── (SKILL.md + references/ + scripts/ + assets/ の同一内容)
```

### raw 素材の場所（プロジェクト内）

```
/Users/anicca/anicca-project/
├── assets/card-screenshots/
│   ├── en/   (189枚: 13テーマ × 14バリアント)
│   │   ├── self_loathing_0.png ~ _13.png    ← Screen 1 用
│   │   ├── staying_up_late_0.png ~ _20.png  ← Screen 4 用
│   │   └── ... (全テーマ)
│   └── ja/   (189枚: 同構成)
│
├── .cursor/plans/ios/1.6.3/screenshot-ab-pipeline/raw/
│   ├── 01-nudge-card-morning.png   (1206x2622, EN)
│   ├── 02-struggle-selection.png   (1206x2622, EN)  ← Screen 2 EN 用
│   └── 04-nudge-card-bedtime.png   (1206x2622, EN)
│
├── .cursor/plans/ios/1.6.3/AppScreens-Anicca-1771826223384.render/
│   └── apple/{locale}/iPhones  6.9/01~04.png  ← 現在の完成品（Control）
│
└── .agents/skills/app-store-screenshots/
    ├── SKILL.md    ← ParthJadhav スキル本体
    └── mockup.png  ← iPhone フレーム（1022x2082）
```

---

## 6. 要修正（E2E テストで判明）

| # | ファイル | 修正内容 |
|---|---------|---------|
| 1 | `SKILL.md` PHASE 0 | `--version-id` → `--version` |
| 2 | `SKILL.md` PHASE 4 | ParthJadhav = Next.js + html-to-image の正確な手順に書き直し |
| 3 | `SKILL.md` PHASE 4 | raw キャプチャ: CardScreenshotGenerator + Maestro の手順追加 |
| 4 | `SKILL.md` 全体 | 1284x2778 → 1320x2868（デザイン）、APP_IPHONE_65 → APP_IPHONE_67 |
| 5 | `anicca-app-context.md` | 4画面説明を実際の画面に更新 |
| 6 | `asc-commands.md` | `--version-id` → `--version`、device-type 修正 |
| 7 | `export-screenshots.sh` | ParthJadhav dev server + Playwright 方式に全書き直し |
| 8 | `setup-workspace.sh` | ParthJadhav チェック修正 + bun + playwright install 追加 |
| 9 | `upload-treatment-screenshots.py` | device_type デフォルト APP_IPHONE_65 → APP_IPHONE_67 |
| 10 | 新規: `slack-upload.sh` | Slack Files v2 API で PNG アップロード |

---

## 7. 利用可能なシミュレータ

| デバイス | UDID | 画面サイズ | 用途 |
|---------|------|----------|------|
| iPhone16ProMax-69 | 1D9F5D85-7C93-447F-A62E-1DA07A490E93 | 6.9" (1320x2868) | メイン撮影用 |
| iPhone16Plus-Screenshots | D04EBBAB-8114-43AC-8351-670785312546 | 6.7" | 予備 |
| iPhone14Plus-65 | 10641A78-9C80-4884-A0DF-1D2FCF178F41 | 6.5" | 予備 |

---

## 8. cron 設定

```json
{
  "name": "screenshot-ab",
  "schedule": "0 10 * * 1",
  "tz": "Asia/Tokyo",
  "enabled": true,
  "payload": {
    "skill": "screenshot-ab",
    "message": "screenshot-ab を実行。PHASE 0 から順番に。experiments.json を読んで前回結果をチェック。ParthJadhav/app-store-screenshots で新スクショ生成。ASC CLI 0.48.0 で実験作成 + 開始。全ロケール（en-US + ja）。Slack #metrics にレポート。"
  }
}
```

---

最終更新: 2026-04-01（E2E テスト後の修正反映）
