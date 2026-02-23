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

## PHASE 4: スクショ生成（screenshot-creator / Pencil）

**Step 4-1: screenshots.yaml のヘッドラインを更新する**

→ `references/pipeline.md` の「screenshots.yaml 完全版」を参照
確定ヘッドラインを `caption.title` / `caption.subtitle` に書き込む。

**Step 4-2: raw スクリーンショット確認**

```
docs/screenshots/raw/screen1.png, screen2.png, screen3.png が存在するか確認。
なければ: make capture-only で XCUITest 撮影だけ実行（UI は変えない）。
```

**Step 4-3: pencil_export.py で合成**

→ `.claude/skills/screenshot-creator/SKILL.md` を読んで Japanese Swiss スタイルを確認した上で実行する

```bash
python3 docs/screenshots/scripts/pencil_export.py
```

内部処理:
1. `raw/screen1~3.png` を PhoneMockup に配置（LANCZOS リサイズ）
2. CaptionArea にヒラギノ角ゴシックでヘッドライン・サブテキストを描画
3. PhoneMockup に角丸ボーダー追加

**出力:**
```
docs/screenshots/processed/
├── screen1.png  （780×1688 @2x）
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

## PHASE 6: Slack 承認（ダイスが確認）

**Step 6-1: processed/ の PNG 3枚を Slack C091G3PKHL2 にアップロード**

Slack Files v2 API（BOT_TOKEN は `.env` の `SLACK_BOT_TOKEN`）:
```
1. files.getUploadURLExternal（GET, query params: filename, length）
2. PUT upload_url にファイルバイナリ送信
3. files.completeUploadExternal（POST, JSON: files=[{id, title}], channel_id）
```

**Step 6-2: slack-approval スキルで ✅/❌ 承認ボタン送信**

→ `.claude/skills/slack-approval/SKILL.md` を読んで `requestApproval()` を実行する

```javascript
const result = await requestApproval({
  channel: 'C091G3PKHL2',
  title:   '📸 App Store スクリーンショット確認',
  detail:  `ヘッドライン: {headline}\nvisual-qa: {score}/50\nASCアップロードに進みますか？`
});
```

| 返答 | アクション |
|------|-----------|
| `approved` | → PHASE 7 へ |
| `denied`   | → PHASE 3（ヘッドライン生成）に戻る |

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
