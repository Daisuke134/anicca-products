# Spec: screenshot-ab — App Store スクリーンショット A/B テスト

**Status:** E2E 検証完了 → 実行準備中
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

## 2. 4画面の定義 — 現在の App Store スクショ（= Control）

| # | 画面 | EN ヘッドライン | JA ヘッドライン | アプリ画面の内容 |
|---|------|---------------|---------------|----------------|
| 1 | Nudge カード（自己慈悲系） | "Gentle Words For Your Hardest Moments" | "一番辛い時に優しい言葉を" | SELF-COMPASSION / 自分を許せ カード |
| 2 | 悩み選択（Onboarding） | "What weighs on you? We'll be there." | "何が苦しい？そばにいるよ" | Struggle Selection 画面 |
| 3 | My Path | "Your pain. We get it." | "一人で抱え込まなくていい" | My Path 課題一覧画面 |
| 4 | Nudge カード（就寝系） | "Protecting tomorrow's you." | "明日のあなたを守る" | BEDTIME / スマホを置け カード |

---

## 3. 素材テーブル — 8枚の raw スクショ

| # | 画面 | EN raw | JA raw | 状態 |
|---|------|--------|--------|------|
| 1 | Nudge カード | `assets/card-screenshots/en/self_loathing_0.png` (780x1688) | `assets/card-screenshots/ja/self_loathing_0.png` (780x1688) | **あるからコピーするだけ** |
| 2 | 悩み選択 | `raw/02-struggle-selection.png` (1206x2622) | **なし → simctl で撮る** | EN あり / JA なし |
| 3 | My Path | **なし → simctl で撮る** | **なし → simctl で撮る** | EN/JA 両方なし |
| 4 | Nudge カード | `assets/card-screenshots/en/staying_up_late_0.png` (780x1688) | `assets/card-screenshots/ja/staying_up_late_0.png` (780x1688) | **あるからコピーするだけ** |

**結論: 8枚中 5枚は既存。simctl で撮るのは 3枚（Screen 2 JA、Screen 3 EN、Screen 3 JA）。**

### simctl での raw キャプチャ方法（Maestro 不使用）

```bash
# 1. シミュレータ起動
xcrun simctl boot 1D9F5D85-7C93-447F-A62E-1DA07A490E93  # iPhone16ProMax-69

# 2. アプリをビルド＆インストール
cd /Users/anicca/anicca-project/aniccaios
xcodebuild build -scheme aniccaios -configuration Debug \
  -destination "id=1D9F5D85-7C93-447F-A62E-1DA07A490E93" \
  -derivedDataPath ./build/DerivedData ONLY_ACTIVE_ARCH=YES -quiet
xcrun simctl install 1D9F5D85-7C93-447F-A62E-1DA07A490E93 \
  ./build/DerivedData/Build/Products/Debug-iphonesimulator/aniccaios.app

# 3. EN 用: アプリ起動 → 手動で画面遷移 → スクショ
xcrun simctl launch 1D9F5D85-7C93-447F-A62E-1DA07A490E93 ai.anicca.app.ios -UITESTING true
# → Simulator.app で手動操作: Welcome → Struggle選択 → Next → LiveDemo → Skip → My Path
xcrun simctl io booted screenshot /tmp/screen3-en.png  # My Path 画面

# 4. JA 用: 言語変更 → アプリ再起動 → 手動で画面遷移 → スクショ
xcrun simctl spawn booted defaults write -g AppleLanguages -array ja
xcrun simctl terminate booted ai.anicca.app.ios
xcrun simctl launch booted ai.anicca.app.ios -UITESTING true
# → Simulator.app で手動操作: 同じフロー（日本語 UI）
xcrun simctl io booted screenshot /tmp/screen2-ja.png  # 悩み選択画面
xcrun simctl io booted screenshot /tmp/screen3-ja.png  # マイパス画面

# 5. EN に戻す
xcrun simctl spawn booted defaults write -g AppleLanguages -array en
```

**出力サイズ:** 1320x2868（iPhone16ProMax-69 シミュレータ = 6.9" 相当）

---

## 4. ParthJadhav スキルの仕組み — 完成品の作り方

### スキルの範囲

```
┌─────────────────────────────────────────────┐
│ スキルがやること:                             │
│  raw スクショ → mockup.png にはめ込み        │
│  → ヘッドライン追加 → 背景追加               │
│  → 完成品 PNG 出力                           │
│                                              │
│ スキルがやらないこと:                         │
│  - アプリのスクショ撮影（自分でやる）        │
│  - ASC へのアップロード（asc CLI でやる）    │
│  - A/B テスト作成（asc CLI でやる）          │
└─────────────────────────────────────────────┘
```

### 完成品 1枚の構造（1320x2868）

```
┌──────────────────────────────────────────────┐
│               背景グラデーション                │
│            (#4FC3F7 → #0288D1)               │
│                                              │
│         ┌──────────────────────┐             │
│         │   ヘッドラインテキスト  │             │
│         │  "Gentle Words For   │             │
│         │   Your Hardest       │             │
│         │     Moments"         │             │
│         └──────────────────────┘             │
│                                              │
│       ┌──────────────────────────┐           │
│       │  mockup.png (iPhone枠)   │           │
│       │  ┌────────────────────┐  │           │
│       │  │                    │  │           │
│       │  │  raw スクショ       │  │           │
│       │  │  (カード or         │  │           │
│       │  │   アプリ画面)       │  │           │
│       │  │                    │  │           │
│       │  │  object-fit:cover  │  │           │
│       │  │  で画面エリアに     │  │           │
│       │  │  はめ込み           │  │           │
│       │  │                    │  │           │
│       │  └────────────────────┘  │           │
│       └──────────────────────────┘           │
│                                              │
└──────────────────────────────────────────────┘
```

### 各スクリーンの完成品イメージ（ASCII）

**Screen 1 — EN: "Gentle Words For Your Hardest Moments"**
```
┌──────────────────────────────────┐
│          青グラデーション背景       │
│                                  │
│    Gentle Words                  │
│    For Your Hardest              │
│    Moments                       │
│                                  │
│      ┌────────────────────┐      │
│      │ ╭────────────────╮ │      │
│      │ │                │ │      │
│      │ │     🤍          │ │      │
│      │ │ FORGIVE YOURSELF│ │      │
│      │ │                │ │      │
│      │ │ You're alive   │ │      │
│      │ │ today. That's  │ │      │
│      │ │ enough.        │ │      │
│      │ │                │ │      │
│      │ │ [Forgive Myself]│ │      │
│      │ │   👍   👎       │ │      │
│      │ ╰────────────────╯ │      │
│      └────────────────────┘      │
│                                  │
└──────────────────────────────────┘
raw = card-screenshots/en/self_loathing_0.png (780x1688)
```

**Screen 2 — EN: "What weighs on you? We'll be there."**
```
┌──────────────────────────────────┐
│          青グラデーション背景       │
│                                  │
│    What weighs on                │
│    you? We'll be                 │
│    there.                        │
│                                  │
│      ┌────────────────────┐      │
│      │ ╭────────────────╮ │      │
│      │ │ What are you   │ │      │
│      │ │ struggling with│ │      │
│      │ │ now?           │ │      │
│      │ │                │ │      │
│      │ │[Staying up late]│ │      │
│      │ │[Self-loathing] │ │      │
│      │ │[Procrastination]│ │      │
│      │ │[Anxiety]       │ │      │
│      │ │                │ │      │
│      │ │    [Next]       │ │      │
│      │ ╰────────────────╯ │      │
│      └────────────────────┘      │
│                                  │
└──────────────────────────────────┘
raw = raw/02-struggle-selection.png (1206x2622)
```

**Screen 3 — EN: "Your pain. We get it."**
```
┌──────────────────────────────────┐
│          青グラデーション背景       │
│                                  │
│    Your pain.                    │
│    We get it.                    │
│                                  │
│      ┌────────────────────┐      │
│      │ ╭────────────────╮ │      │
│      │ │ My Path     +  │ │      │
│      │ │                │ │      │
│      │ │ Current Struggles│ │     │
│      │ │ 🌟 Can't wake up│ │     │
│      │ │ ⏰ Procrastination│ │   │
│      │ │ 🌀 Rumination   │ │     │
│      │ │ 💬 Bad-mouthing │ │     │
│      │ │ 💙 Loneliness   │ │     │
│      │ │ 🔮 Obsessive    │ │     │
│      │ ╰────────────────╯ │      │
│      └────────────────────┘      │
│                                  │
└──────────────────────────────────┘
raw = simctl でキャプチャ (1320x2868)
```

**Screen 4 — EN: "Protecting tomorrow's you."**
```
┌──────────────────────────────────┐
│          青グラデーション背景       │
│                                  │
│    Protecting                    │
│    tomorrow's you.               │
│                                  │
│      ┌────────────────────┐      │
│      │ ╭────────────────╮ │      │
│      │ │                │ │      │
│      │ │     🌙          │ │      │
│      │ │ PUT THE PHONE  │ │      │
│      │ │ DOWN           │ │      │
│      │ │                │ │      │
│      │ │ Breathe, don't │ │      │
│      │ │ scroll.        │ │      │
│      │ │                │ │      │
│      │ │[Protect Tomorrow]│ │    │
│      │ │   👍   👎       │ │      │
│      │ ╰────────────────╯ │      │
│      └────────────────────┘      │
│                                  │
└──────────────────────────────────┘
raw = card-screenshots/en/staying_up_late_0.png (780x1688)
```

**JA 版 — 同じレイアウト、ヘッドラインと raw が日本語に切り替わる:**

```
Screen 1 JA: "一番辛い時に優しい言葉を"  + ja/self_loathing_0.png
Screen 2 JA: "何が苦しい？そばにいるよ"  + simctl でキャプチャ
Screen 3 JA: "一人で抱え込まなくていい"  + simctl でキャプチャ
Screen 4 JA: "明日のあなたを守る"        + ja/staying_up_late_0.png
```

---

## 5. ツールスタック

| ツール | 役割 | 備考 |
|--------|------|------|
| ParthJadhav/app-store-screenshots | raw → 完成品 PNG 変換 | Next.js + html-to-image |
| xcrun simctl | シミュレータ起動 + 言語設定 + スクショ撮影 | Screen 2 JA, Screen 3 EN/JA |
| ASC CLI 0.48.0 | 実験 CRUD + スクショアップロード + 実験開始 | `--version`（`--version-id` ではない） |
| CardScreenshotGenerator | Nudge カード PNG レンダリング（189枚/言語） | 既に生成済み。再生成不要 |
| Playwright | cron 用ヘッドレスエクスポート | `npx playwright install chromium` |

### mockup.png の座標

```typescript
const MK_W = 1022;  // mockup 幅
const MK_H = 2082;  // mockup 高さ
const SC_L = (52 / MK_W) * 100;   // スクリーン左オフセット %
const SC_T = (46 / MK_H) * 100;   // スクリーン上オフセット %
const SC_W = (918 / MK_W) * 100;  // スクリーン幅 %
const SC_H = (1990 / MK_H) * 100; // スクリーン高さ %
```

### ASC CLI コマンド（E2E テストで確認済み）

| コマンド | フラグ | 注意 |
|---------|--------|------|
| `asc localizations list` | `--version $VER_ID`（`--version-id` ではない） | E2E で判明 |
| `asc product-pages experiments list` | `--v2 --app $APP_ID` | OK |
| `asc product-pages experiments create` | `--v2 --app $APP_ID --platform IOS --name "X" --traffic-proportion 50` | 未テスト |
| `asc screenshots upload` | `--version-localization $LOC_ID --path ./export/ --device-type APP_IPHONE_67 --replace` | Treatment loc 対応未テスト |

---

## 6. E2E フロー

```
STEP 1: simctl で raw スクショ撮影（3枚）
  Screen 2 JA, Screen 3 EN, Screen 3 JA
  Screen 1,4 = card-screenshots/ 既存
  Screen 2 EN = raw/02-struggle-selection.png 既存
    ↓
STEP 2: raw を public/screenshots/{en,ja}/ に配置
    ↓
STEP 3: Next.js スキャフォールド
  npx create-next-app → npm install html-to-image
  mockup.png → public/
    ↓
STEP 4: page.tsx 生成
  4スライド × 2ロケール
  Anicca テーマ（青グラデーション背景 + 黒テキスト）
  現在と同じヘッドライン（初回は Control と同じ素材で確認）
    ↓
STEP 5: ブラウザ or Playwright でエクスポート → 8 PNG
  export/{en,ja}/screen1~4.png (1320x2868)
    ↓
STEP 6: visual-qa → NG なら STEP 4 に戻る
    ↓
STEP 7: ASC 実験作成 + アップロード + 開始
  experiments create → treatments create
  → localizations create (en-US + ja)
  → screenshots upload --device-type APP_IPHONE_67
  → experiments update --started true --v2
    ↓
STEP 8: experiments.json 更新 + Slack レポート
    ↓
DONE
```

---

## 7. スキルフォルダ構造

```
~/.openclaw/skills/screenshot-ab/
├── SKILL.md
├── references/
│   ├── headline-gen.md
│   ├── visual-qa.md
│   ├── asc-commands.md
│   └── anicca-app-context.md
├── scripts/
│   ├── setup-workspace.sh
│   ├── export-screenshots.sh
│   ├── upload-treatment-screenshots.py
│   ├── update-experiments-json.py
│   └── slack-upload.sh
├── assets/
│   └── experiments-template.json
└── workspace/
    ├── screenshot-generator/
    │   ├── public/
    │   │   ├── mockup.png
    │   │   └── screenshots/{en,ja}/screen1~4.png
    │   └── src/app/page.tsx
    ├── export/{en,ja}/screen1~4.png
    └── experiments.json
```

### raw 素材の場所（プロジェクト内）

```
/Users/anicca/anicca-project/
├── assets/card-screenshots/
│   ├── en/   (189枚: Screen 1 = self_loathing_*, Screen 4 = staying_up_late_*)
│   └── ja/   (189枚: 同構成)
├── .cursor/plans/ios/1.6.3/screenshot-ab-pipeline/raw/
│   └── 02-struggle-selection.png  (Screen 2 EN)
└── .claude/skills/app-store-screenshots/
    └── mockup.png  (iPhone フレーム)
```

---

## 8. 利用可能なシミュレータ

| デバイス | UDID | 画面サイズ | 用途 |
|---------|------|----------|------|
| iPhone16ProMax-69 | 1D9F5D85-7C93-447F-A62E-1DA07A490E93 | 6.9" (1320x2868) | メイン撮影用 |

---

最終更新: 2026-04-01（Maestro 不使用、simctl のみ、素材テーブル確定）
