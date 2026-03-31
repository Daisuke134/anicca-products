# Spec: screenshot-ab — App Store スクリーンショット A/B テスト

**Status:** 設計完了 → パイプラインセットアップ待ち
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
| ASC CLI 0.48.0 | 実験 CRUD + スクショアップロード + 実験開始 | `brew install asc` |
| ParthJadhav/app-store-screenshots | 広告スタイル PNG 生成 | `npx skills add ParthJadhav/app-store-screenshots` |
| Next.js + html-to-image | スクショレンダリング + エクスポート | ParthJadhav がスキャフォールド |
| Node.js 18+ | Next.js 実行 | 既存 |
| Pillow（フォールバック） | リサイズが必要な場合のみ | `pip3 install Pillow` |

### ParthJadhav/app-store-screenshots の仕組み

```
1. Next.js プロジェクトをスキャフォールド
2. page.tsx 1ファイルに全ロジック
3. public/mockup.png（iPhone フレーム同梱）
4. public/screenshots/{locale}/screen1~4.png（raw キャプチャ配置）
5. ブラウザで各スライドをレンダリング
6. html-to-image で PNG エクスポート（1320x2868 → 自動リサイズ 4サイズ）
```

**出力サイズ:**

| Display | Resolution |
|---------|-----------|
| 6.9" | 1320 x 2868 |
| 6.5" | 1284 x 2778 |
| 6.3" | 1206 x 2622 |
| 6.1" | 1125 x 2436 |

### ASC CLI 0.48.0 新機能（旧スキルから変更）

| 旧（0.37.2） | 新（0.48.0） |
|-------------|-------------|
| 実験開始は ASC Web UI 手動 | `--started true` で CLI から開始 |
| `screenshots upload` に `--replace` なし | `--replace` で既存全削除 + アップロード |
| `view` サブコマンドなし | `experiments view`, `treatments view` 追加 |
| `delete` なし | `experiments delete`, `treatments delete` 追加 |

---

## 3. スキルフォルダ構造

```
~/.openclaw/skills/screenshot-ab/
├── SKILL.md                          ← メインスキル（7 PHASE フロー）
├── references/
│   ├── headline-gen.md               ← ヘッドライン生成ループ（採点基準含む）
│   ├── visual-qa.md                  ← 50点 QA 採点プロンプト
│   ├── pipeline.md                   ← ParthJadhav セットアップ + エクスポート手順
│   ├── asc-commands.md               ← ASC CLI 0.48.0 全コマンドリファレンス
│   └── setup.md                      ← 初回セットアップ（raw キャプチャ取得方法）
├── examples/
│   ├── experiments.json              ← 状態管理ファイルテンプレート
│   └── sample-report.json            ← Slack レポートサンプル
├── scripts/
│   └── export-screenshots.sh         ← Next.js → PNG 一括エクスポート
└── workspace/                        ← 実行時ワークスペース（.gitignore）
    ├── screenshot-generator/         ← ParthJadhav スキャフォールド先
    │   ├── public/
    │   │   ├── mockup.png
    │   │   ├── app-icon.png
    │   │   └── screenshots/
    │   │       ├── en/screen1~4.png
    │   │       └── ja/screen1~4.png
    │   └── src/app/page.tsx
    ├── export/                       ← エクスポート済み PNG
    │   ├── en/screen1~4.png
    │   └── ja/screen1~4.png
    └── experiments.json              ← 状態管理
```

---

## 4. E2E フロー（7 PHASE）

### PHASE 0: アプリ情報取得（毎回実行 — ハードコード禁止）

```bash
# App ID 確認
APP_ID=$(asc apps list --output json | python3 -c "
import json,sys
for a in json.load(sys.stdin)['data']:
    if a['attributes']['bundleId']=='ai.anicca.app.ios':
        print(a['id']); break
")

# 現行バージョン ID
VERSION_ID=$(asc versions list --app $APP_ID --output json | python3 -c "
import json,sys
versions = json.load(sys.stdin)['data']
ready = [v for v in versions if v['attributes']['appStoreState']=='READY_FOR_SALE']
print(ready[0]['id'])
")

# ロケール一覧 + localization ID 取得
asc localizations list --version-id $VERSION_ID --output json
# → en-US と ja の localization ID を記録
```

### PHASE 1: 前回実験結果チェック

```bash
# 全実験一覧
asc product-pages experiments list --v2 --app $APP_ID --output json --pretty

# experiments.json の current を確認
cat workspace/experiments.json
```

**判定ロジック:**

| 条件 | アクション |
|------|-----------|
| `current.experiment_id` なし | → PHASE 3（初回） |
| 経過 < 7日 | → EXIT（データ不足） |
| Treatment CVR > Control CVR × 1.2 かつ 7日+ | → WINNER → PHASE 2 |
| Treatment CVR <= Control CVR かつ 14日+ | → NULL → PHASE 2 |
| 90日経過 | → 強制終了 → PHASE 2 |

```bash
# Treatment 一覧で CVR 確認
asc product-pages experiments treatments list --experiment-id $EXP_ID --output json --pretty
```

### PHASE 2: experiments.json 更新

```json
{
  "current": {},
  "history": [
    {
      "experiment_id": "xxx",
      "name": "screenshot-ab-v3",
      "headlines": {"en": ["H1","H2","H3","H4"], "ja": ["H1","H2","H3","H4"]},
      "result": "WINNER",
      "control_cvr": 2.1,
      "treatment_cvr": 3.2,
      "days_ran": 12,
      "ended_at": "2026-04-01"
    }
  ],
  "winning_patterns": ["感情的2人称", "数字+結果"],
  "losing_patterns": ["機能リスト", "一般的な動詞"]
}
```

### PHASE 3: ヘッドライン生成（EN + JA 別々）

**入力:** winning_patterns, losing_patterns, アプリ概要
**出力:** 4画面分のヘッドライン × 2言語

```
Screen 1（Hero）: コアバリュー → ストップ・ザ・スクロール
Screen 2（差別化）: 競合との違い
Screen 3（人気機能）: ユーザーが最も愛する機能
Screen 4（社会的証明）: 結果 / 数字 / レビュー
```

**生成ループ:**
1. LLM で 10案生成
2. 自己採点（1-10）
3. 8/10+ のみ採用
4. 不足なら再生成（最大3回）

**EN と JA は別々のコピー。翻訳ではない。各言語のネイティブコピーライティング。**

### PHASE 4: スクショ生成（ParthJadhav/app-store-screenshots）

**Step 4-1: raw キャプチャ確認**

```bash
# workspace/screenshot-generator/public/screenshots/ に raw キャプチャがあるか
ls workspace/screenshot-generator/public/screenshots/en/
ls workspace/screenshot-generator/public/screenshots/ja/
# なければ: シミュレータ起動 → 手動 or XCUITest で 4画面キャプチャ
# asc screenshots capture も実験的に使える
```

**Step 4-2: page.tsx にヘッドライン + テーマ設定**

ParthJadhav スキルが `page.tsx` を生成。ヘッドライン・カラー・フォントはここで設定。

```typescript
// テーマプリセット例
const THEMES = {
  "anicca-light": { bg: "#F5F0EB", fg: "#1D1D1F", accent: "#6B4CE6" },
  "anicca-dark":  { bg: "#1A1A2E", fg: "#F8FAFC", accent: "#A78BFA" },
} as const;

// ロケール別コピー
const COPY = {
  "en": {
    screen1: { headline: "Your Mind Deserves Better", sub: "Daily self-care powered by AI" },
    screen2: { headline: "Not Another Meditation App", sub: "Proactive nudges that actually work" },
    // ...
  },
  "ja": {
    screen1: { headline: "あなたの心にもっと優しく", sub: "AIがあなたに寄り添うセルフケア" },
    // ...
  }
};
```

**Step 4-3: エクスポート**

```bash
cd workspace/screenshot-generator
npm run dev  # or bun dev
# ブラウザで各スライドを開く → html-to-image で PNG エクスポート
# 自動: 1320x2868 (6.9") → リサイズ 1284x2778 (6.5"), 1206x2622 (6.3"), 1125x2436 (6.1")

# エクスポート先
ls workspace/export/en/   # screen1.png ~ screen4.png (1284x2778 = IPHONE_65)
ls workspace/export/ja/   # screen1.png ~ screen4.png
```

**注意:** ASC にアップロードするのは **IPHONE_65 (1284x2778)** サイズ。これが必須。

### PHASE 5: visual-qa 採点

```
各 PNG を vision model に送信:
- Clarity (10pt): ヘッドラインが1秒で読めるか
- Hierarchy (10pt): テキスト→デバイス→背景の視覚階層
- Consistency (10pt): 4枚のトーン統一
- Conversion (10pt): "ダウンロード" を促す訴求力
- Technical (10pt): 解像度 / 切り抜き / アライメント

40/50+ → PASS
39以下 → PHASE 3 に戻る（最大3回）
3回連続 FAIL → Slack 警告 → EXIT
```

### PHASE 6: Slack 承認

```bash
# PNG を Slack にアップロード（Files v2 API）
# slack-approval スキルで ✅/❌ ボタン送信
# ✅ → PHASE 7 / ❌ → PHASE 3 に戻る
```

### PHASE 7: ASC アップロード + 実験作成 + 開始

**Step 7-1: 実験作成**
```bash
EXP_ID=$(asc product-pages experiments create \
  --v2 --app $APP_ID --platform IOS \
  --name "screenshot-ab-v$(date +%Y%m%d)" \
  --traffic-proportion 50 \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
```

**Step 7-2: Treatment 作成**
```bash
TREAT_ID=$(asc product-pages experiments treatments create \
  --experiment-id $EXP_ID \
  --name "New Screenshots $(date +%Y%m%d)" \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
```

**Step 7-3: Treatment localization 作成**
```bash
EN_LOC_ID=$(asc product-pages experiments treatments localizations create \
  --treatment-id $TREAT_ID --locale en-US \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")

JA_LOC_ID=$(asc product-pages experiments treatments localizations create \
  --treatment-id $TREAT_ID --locale ja \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
```

**Step 7-4: スクショアップロード**
```bash
# EN スクショ
asc screenshots upload \
  --version-localization $EN_LOC_ID \
  --path workspace/export/en/ \
  --device-type IPHONE_65 \
  --replace

# JA スクショ
asc screenshots upload \
  --version-localization $JA_LOC_ID \
  --path workspace/export/ja/ \
  --device-type IPHONE_65 \
  --replace
```

**注意:** `--version-localization` に Treatment localization ID を渡せるかは要テスト。
ダメなら Apple API 直接の Python スクリプト（旧スキルの `upload_treatment_screenshots.py`）。

**Step 7-5: 実験開始 ★ ASC CLI 0.48.0 NEW**
```bash
asc product-pages experiments update \
  --experiment-id $EXP_ID \
  --started true \
  --v2
```

**Step 7-6: experiments.json 更新**
```bash
# current に新実験情報を書き込む
python3 -c "
import json
with open('workspace/experiments.json', 'r+') as f:
    data = json.load(f)
    data['current'] = {
        'experiment_id': '$EXP_ID',
        'name': 'screenshot-ab-v$(date +%Y%m%d)',
        'treatment_id': '$TREAT_ID',
        'en_localization_id': '$EN_LOC_ID',
        'ja_localization_id': '$JA_LOC_ID',
        'started_at': '$(date +%Y-%m-%d)',
        'headlines': {'en': [...], 'ja': [...]}
    }
    f.seek(0); json.dump(data, f, indent=2); f.truncate()
"
```

**Step 7-7: Slack レポート**
```bash
curl -s -X POST "$SLACK_WEBHOOK_AGENTS" \
  -H 'Content-type: application/json' \
  -d "{\"text\":\"📸 screenshot-ab-v$(date +%Y%m%d) 開始\\nTraffic: 50/50\\nEN: 4枚 + JA: 4枚\\n実験ID: $EXP_ID\"}"
```

---

## 5. 要テスト（実行時に確認）

| # | テスト項目 | 代替案 |
|---|-----------|--------|
| 1 | `asc screenshots upload` に Treatment localization ID を渡せるか | Apple API 直接 Python スクリプト |
| 2 | `--started true` で PPO が実際に開始されるか（reviewRequired の場合） | ASC Web UI から手動開始 |
| 3 | ParthJadhav のヘッドレスエクスポート（cron 用 — ブラウザ不要にできるか） | Playwright で自動エクスポート |
| 4 | 6.1" シミュレータで撮った raw が全デバイスサイズに正しくマッピングされるか | 6.5" シミュレータ使用 |

---

## 6. 初回セットアップ手順

```bash
# 1. ParthJadhav スキルは既にインストール済み
ls /Users/anicca/anicca-project/.agents/skills/app-store-screenshots/

# 2. workspace セットアップ
mkdir -p ~/.openclaw/skills/screenshot-ab/workspace
cd ~/.openclaw/skills/screenshot-ab/workspace

# 3. ParthJadhav でスキャフォールド
# Claude Code に "Build App Store screenshots for Anicca" と言う
# → screenshot-generator/ が生成される

# 4. raw キャプチャ配置
# シミュレータで 4画面キャプチャ → public/screenshots/en/ + ja/

# 5. experiments.json 初期化
cat > experiments.json << 'EOF'
{
  "current": {},
  "history": [],
  "winning_patterns": [],
  "losing_patterns": []
}
EOF

# 6. ASC CLI 確認
asc --version  # 0.48.0+
asc apps list  # App ID: 6755129214
```

---

## 7. cron 設定（jobs.json）

```json
{
  "name": "screenshot-ab",
  "schedule": "0 10 * * 1",
  "tz": "Asia/Tokyo",
  "enabled": true,
  "payload": {
    "skill": "screenshot-ab",
    "message": "screenshot-ab を実行。PHASE 0 から順番に。experiments.json を読んで前回結果をチェック。ParthJadhav/app-store-screenshots で新スクショ生成。ASC CLI 0.48.0 で実験作成 + 開始（--started true）。全ロケール（en-US + ja）で実行。"
  }
}
```

**隔週にする方法:** PHASE 1 で「前回開始から14日未満なら EXIT」で制御。cron 自体は毎週月曜。

---

## 8. Spec 内の旧情報修正

| 旧 | 新 |
|-----|-----|
| App ID `6738663505` | `6755129214` |
| ASC CLI 0.37.2 | 0.48.0 |
| 実験開始は手動 ASC Web UI | `--started true` で CLI 開始 |
| PIL/pencil_export.py パイプライン | ParthJadhav（Next.js + html-to-image） |
| 3画面 | 4画面 |
| `APP_IPHONE_67` | `IPHONE_65`（1284x2778 — ASC デフォルト必須サイズ） |
| `asc screenshots upload` は Treatment に使えない | 0.48.0 で要テスト |

---

最終更新: 2026-04-01
