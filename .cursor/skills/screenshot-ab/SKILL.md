---
name: screenshot-ab
description: App Store スクリーンショット A/B テスト自動クローズドループ。メトリクス確認 → 勝者判定 → ヘッドライン生成（生成→採点→改善ループ）→ l.md Bible（make generate-store-screenshots）でPNG生成 → visual-qa採点 → Slackにダイスへ送る → ASCアップロード → PPO実験作成。Use when running screenshot-ab, App Store screenshot experiment, screenshot loop, スクショA/Bテスト, screenshot closed loop, screenshot automation, A/B test screenshots.
---

# screenshot-ab

App Store スクリーンショット A/B テストを自動で回すクローズドループスキル。
**外部スキル依存ゼロ。このスキル1つで完結。**

## 初回セットアップ（新規ユーザー）

→ `references/setup.md` を読む

---

## パス（環境によって切り替え）

| 環境 | experiments.json |
|------|-----------------|
| **MacBook（ローカルテスト）** | `/Users/cbns03/Downloads/anicca-project/.cursor/plans/ios/1.6.3/screenshot-ab-pil/experiments.json` |
| **Mac Mini（Anicca 本番）** | `/Users/anicca/.openclaw/workspace/screenshot-ab/experiments.json` |
| **screenshots.yaml** | `docs/screenshots/config/screenshots.yaml` |
| **raw PNG 出力先** | `docs/screenshots/raw/` |
| **processed PNG 出力先** | `docs/screenshots/processed/` |

---

## PHASE 1: メトリクス確認

```bash
cat <experiments.json のパス>
```

`current.experiment_id` を取得して CVR を確認する。

```bash
asc product-pages experiments treatments list --experiment-id "{experiment_id}"
```

**判断:**

| 条件 | アクション |
|------|-----------|
| experiment_id なし | → PHASE 3（新実験を始める） |
| 経過 < 7日 | → EXIT（今日はスキップ） |
| Treatment CVR > Control CVR × 1.2 かつ 7日+ | → WINNER → PHASE 2 |
| Treatment CVR <= Control CVR かつ 14日+ | → NULL → PHASE 2 |
| 90日経過 | → NULL → PHASE 2 |

---

## PHASE 2: 実験ログ更新

`experiments.json` の `history` に追記する。

```json
{
  "current": {},
  "history": [
    {
      "experiment_id": "ppo_abc123",
      "headline": "6 Years. 10 Apps. Still Nothing Changed.",
      "result": "WINNER",
      "control_cvr": 2.1,
      "treatment_cvr": 3.2,
      "days_ran": 9,
      "ended_at": "2026-02-23"
    }
  ]
}
```

勝ちパターン・負けパターンを `winning_patterns` / `losing_patterns` に追記して PHASE 3 に渡す。

---

## PHASE 3: ヘッドライン生成

→ `references/headline-gen.md` を読んでループを実行する

**入力:** `winning_patterns`, `losing_patterns`, ペルソナ定義
**出力:** screen1/screen2/screen3 の確定ヘッドライン（8/10 以上）

---

## PHASE 4: スクショ生成（l.md Bible）

**Step 4-1: screenshots.yaml を更新する**

→ `references/pipeline.md` の「screenshots.yaml 完全版」を参照
確定ヘッドラインを `caption.title` / `caption.subtitle` に書き込む。

**Step 4-2: l.md パイプラインを走らせる**

→ `references/pipeline.md` の「Makefile l.md Step5 完全版」を参照

```bash
cd /Users/cbns03/Downloads/anicca-project
make generate-store-screenshots
```

内部処理（l.md の全4ステップ）:
1. `xcodebuild test -only-testing:ScreenshotTests` → `output.xcresult`
2. `extract_screenshots.py` → `docs/screenshots/raw/screen1.png` 等
3. `process_screenshots.py` → `docs/screenshots/processed/screen1.png` 等

**出力:**
```
docs/screenshots/processed/
├── screen1.png  （1290×2796）
├── screen2.png
└── screen3.png
```

---

## PHASE 5: visual-qa 採点

→ `references/visual-qa.md` を読んで採点プロンプトを使う

`processed/` の PNG 3枚を vision model で採点する。

| 結果 | アクション |
|------|-----------|
| PASS（40/50+） | → PHASE 6 へ |
| FAIL（39/50以下） | → PHASE 3 に戻る（最大3回） |
| 3回連続 FAIL | → Slack に警告 → EXIT |

---

## PHASE 6: Slack に送る（ダイスが確認）

→ `references/slack-approval.md` を読んでコマンドを実行する

| ダイスの返答 | アクション |
|------------|-----------|
| OK | → PHASE 7 へ |
| NG | → PHASE 3 に戻る |

---

## PHASE 7: ASC アップロード・実験開始

```bash
# スクショをアップロード
asc screenshots upload \
  --app-id "1771826223384" \
  --platform IOS \
  --files docs/screenshots/processed/screen1.png \
           docs/screenshots/processed/screen2.png \
           docs/screenshots/processed/screen3.png

# PPO 実験作成（50/50 split）
asc product-pages experiments create \
  --app-id "1771826223384" \
  --name "screenshot-ab-v{N}"
```

**experiments.json を更新する:**

```json
{
  "current": {
    "experiment_id": "ppo_xyz456",
    "start_date": "2026-02-23",
    "headline": "6 Years. 10 Apps. Still Nothing Changed.",
    "before_cvr": 3.2
  }
}
```

---

## experiments.json 完全フォーマット

```json
{
  "current": {
    "experiment_id": "ppo_abc123",
    "start_date": "2026-02-21",
    "queue_position": 0,
    "phase": "PIL",
    "headline": "6 Years. 10 Apps. Still Nothing Changed.",
    "before_cvr": 2.1,
    "analytics_request_id": ""
  },
  "history": [],
  "winning_patterns": [],
  "losing_patterns": []
}
```

---

## references/

| ファイル | 内容 |
|---------|------|
| `references/setup.md` | 初回セットアップ（DebugManager.swift・XCUITest テンプレート） |
| `references/pipeline.md` | Makefile + screenshots.yaml + extract/process スクリプト全文 |
| `references/headline-gen.md` | ヘッドライン生成→採点→改善ループ |
| `references/visual-qa.md` | App Store visual QA 50点採点プロンプト |
| `references/slack-approval.md` | Slack 承認コマンド |
