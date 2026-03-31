# Spec: screenshot-ab — App Store スクリーンショット A/B テスト

**Status:** 設計確定 → V1 スキル作成中
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
| 実行環境 | Mac Mini（OpenClaw cron） |

---

## 2. ツールスタック

| ツール | 役割 | インストール |
|--------|------|------------|
| ASC CLI 0.48.0 | 実験 CRUD + スクショアップロード + 実験開始 | `brew install asc`（0.48.0 確認済み） |
| ParthJadhav/app-store-screenshots | 広告スタイル PNG 生成（Next.js + html-to-image） | `npx skills add ParthJadhav/app-store-screenshots` |
| Playwright | cron 用ヘッドレス PNG エクスポート | `npx playwright install chromium` |
| Node.js 18+ | Next.js 実行 | 既存 |

### ParthJadhav/app-store-screenshots の仕組み

```
1. Next.js プロジェクトをスキャフォールド（page.tsx 1ファイル）
2. public/mockup.png（iPhone フレーム同梱）
3. public/screenshots/{locale}/screen1~4.png（raw キャプチャ配置）
4. ブラウザで各スライドをレンダリング（広告スタイル — スクショは広告、ドキュメントではない）
5. html-to-image で PNG エクスポート
6. 1320x2868 (6.9") でデザイン → 自動リサイズ 4サイズ
```

**出力サイズ:**

| Display | Resolution |
|---------|-----------|
| 6.9" | 1320 x 2868 |
| 6.5" | 1284 x 2778 |
| 6.3" | 1206 x 2622 |
| 6.1" | 1125 x 2436 |

**キー原則（ParthJadhav README より）:**
- スクショは**広告**。ドキュメントではない。各スライドは1つのアイデアを売る
- コピーは「1秒ルール」。App Store のサムネイルサイズで読める
- 隣接スライドは同じレイアウトを繰り返さない
- スタイルはユーザー駆動。ハードコードしない

### ASC CLI 0.48.0 新機能

| 旧（0.37.2） | 新（0.48.0） |
|-------------|-------------|
| 実験開始は ASC Web UI 手動 | **`--started true` で CLI から開始** |
| `screenshots upload` に `--replace` なし | **`--replace` で既存全削除 + アップロード** |
| `view` なし | `experiments view`, `treatments view` |
| `delete` なし | `experiments delete`, `treatments delete` |

---

## 3. スキルフォルダ構造

### メイン（OpenClaw — Anicca が使う）

```
~/.openclaw/skills/screenshot-ab/
├── SKILL.md                              ← メインフロー（7 PHASE）~400-500行
├── references/
│   ├── headline-gen.md                   ← ヘッドライン生成→採点→改善ループ ~150行
│   ├── visual-qa.md                      ← 50点 QA 採点プロンプト ~80行
│   ├── asc-commands.md                   ← ASC CLI 0.48.0 PPO コマンド全集 ~120行
│   └── anicca-app-context.md             ← アプリ概要 + 4画面説明 + ペルソナ ~100行
├── scripts/
│   ├── setup-workspace.sh                ← 初回ワークスペースセットアップ ~40行
│   ├── export-screenshots.sh             ← Playwright ヘッドレスエクスポート ~60行
│   ├── upload-treatment-screenshots.py   ← Apple API 直接アップロード（フォールバック）~100行
│   └── update-experiments-json.py        ← experiments.json CRUD ~80行
├── assets/
│   └── experiments-template.json         ← experiments.json 初期テンプレート
└── workspace/                            ← .gitignore、実行時生成
    ├── screenshot-generator/             ← ParthJadhav スキャフォールド先
    │   ├── public/
    │   │   ├── mockup.png               ← iPhone フレーム（ParthJadhav 同梱）
    │   │   ├── app-icon.png             ← Anicca アイコン
    │   │   └── screenshots/
    │   │       ├── en/screen1~4.png     ← raw キャプチャ（EN）
    │   │       └── ja/screen1~4.png     ← raw キャプチャ（JA）
    │   ├── src/app/
    │   │   ├── layout.tsx
    │   │   └── page.tsx                 ← 全スライド + ロケール切替 + テーマ
    │   └── package.json
    ├── export/
    │   ├── en/screen1~4.png             ← 最終 PNG（1284x2778 = IPHONE_65）
    │   └── ja/screen1~4.png
    └── experiments.json                  ← 状態管理
```

### コピー（CC — 俺自身が使う）

```
/Users/anicca/anicca-project/.claude/skills/screenshot-ab/
├── SKILL.md                              ← 同一内容
├── references/                           ← 同一内容
├── scripts/                              ← 同一内容
└── assets/                               ← 同一内容
```

workspace は OpenClaw 側にのみ存在。CC が実行する時も同じ workspace を使う。

---

## 4. SKILL.md の構造

```markdown
---
name: screenshot-ab
description: "App Store スクリーンショット A/B テスト自動クローズドループ。
  前回 PPO 結果チェック → ヘッドライン生成 → ParthJadhav/app-store-screenshots で
  PNG 生成 → visual-qa → Slack 承認 → ASC CLI 0.48.0 でアップロード + 実験開始。
  Anicca iOS (ai.anicca.app.ios) 専用。EN + JA 両ロケール対応。
  Use when: screenshot A/B, スクショA/B, PPO experiment, screenshot iteration,
  App Store screenshot test, スクリーンショットテスト"
---

# screenshot-ab

## Purpose
[3行: 何をするスキルか]

## When to Use
[トリガー条件: cron 毎週月曜 / 手動 "screenshot-ab を実行"]

## Prerequisites
[ASC CLI 0.48.0, Node.js 18+, ParthJadhav skill installed]

## PHASE 0: アプリ情報取得
  → 毎回 asc CLI で動的取得。ハードコード禁止
  → APP_ID, VERSION_ID, EN_LOC_ID, JA_LOC_ID

## PHASE 1: 前回実験結果チェック
  → workspace/experiments.json 読み込み
  → scripts/update-experiments-json.py
  → 判定テーブル（WINNER / NULL / SKIP / 初回）

## PHASE 2: experiments.json 更新
  → history 追記 + winning/losing patterns

## PHASE 3: ヘッドライン生成
  → references/headline-gen.md 参照
  → references/anicca-app-context.md 参照
  → 4画面 × EN + JA = 8ヘッドライン
  → 生成→採点→改善ループ（8/10+）

## PHASE 4: スクショ生成
  → raw キャプチャ確認（workspace/screenshot-generator/public/screenshots/）
  → ParthJadhav スキルで page.tsx 生成/更新
  → scripts/export-screenshots.sh でヘッドレスエクスポート
  → 出力: workspace/export/{en,ja}/screen1~4.png

## PHASE 5: visual-qa
  → references/visual-qa.md の 50点採点
  → 40+ PASS / 39以下 → PHASE 3 に戻る（max 3）

## PHASE 6: Slack 承認
  → PNG 8枚 Slack にアップ
  → slack-approval ✅/❌
  → ❌ → PHASE 3

## PHASE 7: ASC アップロード + 実験開始
  → references/asc-commands.md 参照
  → 7-1: experiments create --v2
  → 7-2: treatments create
  → 7-3: treatments localizations create ×2
  → 7-4: screenshots upload --replace ×2
  →       (フォールバック: scripts/upload-treatment-screenshots.py)
  → 7-5: experiments update --started true --v2
  → 7-6: experiments.json 更新
  → 7-7: Slack レポート
```

---

## 5. E2E フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    cron: 毎週月曜 10:00 JST                    │
│                    OpenClaw → screenshot-ab                   │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
         ┌── PHASE 0 ──┐
         │ asc apps list │ → APP_ID=6755129214
         │ asc versions  │ → VERSION_ID
         │ localizations │ → EN_LOC, JA_LOC
         └──────┬───────┘
                ▼
         ┌── PHASE 1 ──┐
         │ experiments  │ → experiments.json 読む
         │ .json check  │ → current.experiment_id あるか？
         └──────┬───────┘
                ▼
         ┌─────────────────────┐
         │ experiment_id なし?  │──Yes──→ PHASE 3（初回）
         │ 経過 < 7日?         │──Yes──→ EXIT
         │ CVR +20% & 7日+?   │──Yes──→ WINNER → PHASE 2
         │ CVR 変化なし & 14日+│──Yes──→ NULL → PHASE 2
         └─────────┬───────────┘
                   ▼
         ┌── PHASE 2 ──┐
         │ history 追記 │
         │ patterns更新 │
         └──────┬───────┘
                ▼
         ┌── PHASE 3 ──────────────────┐
         │ references/headline-gen.md   │
         │ references/anicca-app-context│
         │ LLM → 10案 → 自己採点      │
         │ 8/10+ 採用 × 4画面 × EN+JA │
         └──────┬──────────────────────┘
                ▼
         ┌── PHASE 4 ──────────────────────────┐
         │ raw キャプチャ確認                      │
         │   └ なければ: 手動 or asc capture      │
         │ ParthJadhav → page.tsx 生成/更新       │
         │ scripts/export-screenshots.sh          │
         │   └ Playwright ヘッドレス → PNG 4枚×2  │
         │ 出力: workspace/export/en/ + ja/       │
         └──────┬──────────────────────────────────┘
                ▼
         ┌── PHASE 5 ──┐
         │ visual-qa    │ → 50点採点
         │ 40+ = PASS   │
         │ 39- = PHASE 3│（max 3回）
         └──────┬───────┘
                ▼
         ┌── PHASE 6 ──┐
         │ Slack アップ  │ → PNG 8枚送信
         │ ✅ = 続行    │
         │ ❌ = PHASE 3 │
         └──────┬───────┘
                ▼
         ┌── PHASE 7 ──────────────────────────────┐
         │ 7-1: experiments create --v2              │
         │ 7-2: treatments create                    │
         │ 7-3: treatments localizations create ×2   │
         │ 7-4: screenshots upload --replace ×2      │
         │      (fallback: upload-treatment.py)       │
         │ 7-5: experiments update --started true ★   │
         │ 7-6: experiments.json 更新                 │
         │ 7-7: Slack レポート                        │
         └─────────────────────────────────────────────┘
```

---

## 6. 各ファイルの内容詳細

### references/headline-gen.md (~150行)

| セクション | 内容 |
|-----------|------|
| Screen ロール定義 | Screen 1=Hero, 2=差別化, 3=人気機能, 4=社会的証明 |
| 採点基準 | 1-10スケール。Emotional hook(3), Specificity(2), Brevity(2), Curiosity gap(2), Locale fit(1) |
| 生成ループ | 10案生成 → 自己採点 → 8+採用 → 不足なら再生成（max 3） |
| EN/JA ルール | 翻訳禁止。各言語ネイティブコピーライティング |
| 過去の勝ちパターン | experiments.json の winning_patterns から参照 |
| 過去の負けパターン | losing_patterns から回避 |

### references/visual-qa.md (~80行)

| カテゴリ | 配点 | チェック内容 |
|---------|------|------------|
| Clarity | 10 | ヘッドラインが1秒で読めるか |
| Hierarchy | 10 | テキスト→デバイス→背景の視覚階層 |
| Consistency | 10 | 4枚のトーン統一 |
| Conversion | 10 | ダウンロード訴求力 |
| Technical | 10 | 解像度/切り抜き/アライメント |

### references/asc-commands.md (~120行)

```
# PHASE 0 コマンド
asc apps list --output json
asc versions list --app $APP_ID --output json
asc localizations list --version-id $VERSION_ID --output json

# PHASE 1 コマンド
asc product-pages experiments list --v2 --app $APP_ID --output json
asc product-pages experiments view --experiment-id $EXP_ID --v2 --output json
asc product-pages experiments treatments list --experiment-id $EXP_ID --output json

# PHASE 7 コマンド
asc product-pages experiments create --v2 --app $APP_ID --platform IOS --name "X" --traffic-proportion 50
asc product-pages experiments treatments create --experiment-id $EXP_ID --name "X"
asc product-pages experiments treatments localizations create --treatment-id $TREAT_ID --locale en-US
asc product-pages experiments treatments localizations create --treatment-id $TREAT_ID --locale ja
asc screenshots upload --version-localization $LOC_ID --path ./export/en/ --device-type IPHONE_65 --replace
asc product-pages experiments update --experiment-id $EXP_ID --started true --v2

# クリーンアップ
asc product-pages experiments delete --experiment-id $EXP_ID --confirm
```

### references/anicca-app-context.md (~100行)

| セクション | 内容 |
|-----------|------|
| アプリ概要 | プロアクティブ行動変容エージェント。デジタル・ブッダ |
| ターゲット | 25-45歳、セルフケアに興味があるが習慣化できない人 |
| 4画面の説明 | Screen 1: メインタブ（Today）, 2: Nudge通知, 3: Insights, 4: Onboarding |
| 競合との差別化 | 瞑想アプリではない。AIが能動的に介入する |
| ブランドカラー | Accent: #6B4CE6, BG: #F5F0EB（light）/ #1A1A2E（dark） |
| 過去の実験履歴 | banana vs appscreen / appscreen vs nanobanana / screenshot-ab-v1 |

### scripts/setup-workspace.sh (~40行)

```bash
#!/bin/bash
# 初回ワークスペースセットアップ
WORKSPACE="$HOME/.openclaw/skills/screenshot-ab/workspace"
mkdir -p "$WORKSPACE/export/en" "$WORKSPACE/export/ja"
cp "$HOME/.openclaw/skills/screenshot-ab/assets/experiments-template.json" \
   "$WORKSPACE/experiments.json"
echo "✅ Workspace ready: $WORKSPACE"
```

### scripts/export-screenshots.sh (~60行)

```bash
#!/bin/bash
# Playwright ヘッドレスエクスポート
# ParthJadhav の page.tsx をヘッドレスブラウザでレンダリング → PNG エクスポート
GENERATOR="$HOME/.openclaw/skills/screenshot-ab/workspace/screenshot-generator"
EXPORT_DIR="$HOME/.openclaw/skills/screenshot-ab/workspace/export"

cd "$GENERATOR"
npm run build 2>/dev/null || bun run build
npx playwright screenshot http://localhost:3000 \
  --device "iPhone 14 Pro Max" \
  --full-page \
  --output "$EXPORT_DIR/en/screen1.png"
# ... 各スライド + 各ロケール
```

### scripts/upload-treatment-screenshots.py (~100行)

```python
# Apple API 直接アップロード（asc screenshots upload が Treatment に対応しない場合のフォールバック）
# 1. screenshotSet 取得 or 作成
# 2. 既存スクショ全削除
# 3. reserve → PUT binary → commit
```

### scripts/update-experiments-json.py (~80行)

```python
# experiments.json の CRUD ユーティリティ
# - read_current(): 現在の実験情報
# - archive_current(result, cvr_data): history に移動
# - set_current(experiment_data): 新実験セット
# - add_pattern(type, pattern): winning/losing 追記
```

### assets/experiments-template.json

```json
{
  "current": {},
  "history": [],
  "winning_patterns": [],
  "losing_patterns": []
}
```

---

## 7. 要テスト（実行時に確認）

| # | テスト項目 | 代替案 |
|---|-----------|--------|
| 1 | `asc screenshots upload --version-localization` に Treatment localization ID を渡せるか | scripts/upload-treatment-screenshots.py |
| 2 | `--started true` で PPO が実際に開始されるか（reviewRequired の場合） | ASC Web UI から手動開始 |
| 3 | ParthJadhav の Playwright ヘッドレスエクスポートが安定するか | 手動ブラウザエクスポート |
| 4 | `asc screenshots capture` でシミュレータからキャプチャできるか | 手動シミュレータスクショ |

---

## 8. cron 設定（jobs.json に追加）

```json
{
  "name": "screenshot-ab",
  "schedule": "0 10 * * 1",
  "tz": "Asia/Tokyo",
  "enabled": true,
  "payload": {
    "skill": "screenshot-ab",
    "message": "screenshot-ab を実行。PHASE 0 から順番に。experiments.json を読んで前回結果をチェック。ParthJadhav/app-store-screenshots で新スクショ生成。ASC CLI 0.48.0 で実験作成 + 開始（--started true）。全ロケール（en-US + ja）で実行。Slack #metrics にレポート。"
  }
}
```

**隔週制御:** cron は毎週月曜。PHASE 1 で「前回 started_at から14日未満なら EXIT」。

---

## 9. 旧スキルからの変更点

| 旧 screenshot-ab | 新 screenshot-ab |
|------------------|-----------------|
| PIL/pencil_export.py | ParthJadhav（Next.js + html-to-image） |
| XCUITest + Makefile | `asc screenshots capture` or 手動 raw |
| 3画面 | 4画面 |
| 手動 ASC Web UI で実験開始 | `--started true` CLI |
| KOE app ベース | **Anicca 専用**（ai.anicca.app.ios） |
| `APP_IPHONE_67` | `IPHONE_65`（1284x2778） |
| ASC CLI 0.37.2 | **0.48.0** |
| examples/ + workspace 混在 | scripts/ + assets/ + workspace 分離 |
| Slack 承認後に手動 | 全自動（承認 → アップロード → 開始） |

---

## 10. 配置先

| 配置先 | パス | 用途 |
|--------|------|------|
| OpenClaw（メイン） | `~/.openclaw/skills/screenshot-ab/` | Anicca cron 実行 |
| CC（コピー） | `/Users/anicca/anicca-project/.claude/skills/screenshot-ab/` | CC 自身が実行 |

workspace は OpenClaw 側にのみ存在。CC 実行時も同じ workspace を参照。

---

最終更新: 2026-04-01
