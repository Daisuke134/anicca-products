---
name: screenshot-ab
description: App Store スクリーンショット A/B テスト自動クローズドループ。メトリクス確認 → 勝者判定 → ヘッドライン生成 → l.md Bible（make generate-store-screenshots）でPNG生成 → visual-qa採点 → Slackにダイスへ送る → ASCアップロード → PPO実験作成。Use when running screenshot-ab, App Store screenshot experiment, screenshot loop, スクショA/Bテスト, screenshot closed loop.
---

# screenshot-ab

App Store スクリーンショット A/B テストを自動で回すクローズドループスキル。

## 実行方法

```
screenshot-ab を実行して
```

---

## パス（環境によって切り替え）

| 環境 | experiments.json |
|------|-----------------|
| **MacBook（ローカルテスト）** | `/Users/cbns03/Downloads/anicca-project/.cursor/plans/ios/1.6.3/screenshot-ab-pil/experiments.json` |
| **Mac Mini（Anicca 本番）** | `/Users/anicca/.openclaw/workspace/screenshot-ab/experiments.json` |
| **screenshots.yaml** | `/Users/cbns03/Downloads/anicca-project/docs/screenshots/config/screenshots.yaml` |
| **raw PNG 出力先** | `/Users/cbns03/Downloads/anicca-project/docs/screenshots/raw/` |
| **processed PNG 出力先** | `/Users/cbns03/Downloads/anicca-project/docs/screenshots/processed/` |

---

## フロー

### PHASE 1: メトリクス確認

```bash
# experiments.json を読む
cat /Users/cbns03/Downloads/anicca-project/.cursor/plans/ios/1.6.3/screenshot-ab-pil/experiments.json
```

`current.experiment_id` を取得して PPO 実験の CVR を確認する。

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

### PHASE 2: 実験ログ更新

`experiments.json` の `history` に今回の結果を追記する。

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

勝ちパターン・負けパターンを抽出して PHASE 3 に渡す。

---

### PHASE 3: ヘッドライン生成

`recursive-improver` スキルを使う。

**入力:**
- 勝ちパターン（例: `["問いかけ型"]`）
- 負けパターン（例: `["数字型", "断言型"]`）
- ペルソナ: 25〜35歳、6〜7年間主体性の欠如と自己嫌悪のループから抜け出せていない
- 3画面分のヘッドライン（screen1/screen2/screen3）

**ループ:** 生成 → 採点 → 改善（最大5回）→ 8/10 以上で確定

**出力例:**
```
screen1: "Why Do You Keep\nFailing The Same Habit?"
screen2: "3,000+ People Finally\nBroke The Loop."
screen3: "This Is What\nChange Actually Looks Like."
```

---

### PHASE 4: スクショ生成（l.md Bible 全体）

**Step 4-1: screenshots.yaml を更新する**

```yaml
# /Users/cbns03/Downloads/anicca-project/docs/screenshots/config/screenshots.yaml
screens:
  - id: "screen1"
    caption:
      title: "Why Do You Keep\nFailing The Same Habit?"
      subtitle: "Finally, an app that fights back."
    layout:
      text_x: 100
      text_y: 200
      device_x: center
      device_y: 1200

  - id: "screen2"
    caption:
      title: "3,000+ People Finally\nBroke The Loop."
      subtitle: "Join them. Start free today."
    layout:
      text_x: 100
      text_y: 200
      device_x: center
      device_y: 1200

  - id: "screen3"
    caption:
      title: "This Is What\nChange Actually Looks Like."
      subtitle: "AI that nudges you before you quit."
    layout:
      text_x: 100
      text_y: 200
      device_x: center
      device_y: 1200
```

**Step 4-2: l.md パイプラインを走らせる**

```bash
cd /Users/cbns03/Downloads/anicca-project
make generate-store-screenshots
```

内部処理（l.md の全4ステップ）:
1. XCUITest でシミュレータ起動 → アプリ実画面撮影 → `.xcresult`
2. `python3 docs/screenshots/scripts/extract_screenshots.py` → `docs/screenshots/raw/`
3. `python3 docs/screenshots/scripts/process_screenshots.py` → `docs/screenshots/processed/`

**出力:**
```
docs/screenshots/processed/
├── screen1.png  （1290×2796, bg=#F5F5F7, テキスト at (100,200)）
├── screen2.png
└── screen3.png
```

---

### PHASE 5: visual-qa 採点

`visual-qa` スキルを使って `processed/` の PNG 3枚を採点する。

**採点基準:**
- 1枚目はコア価値を伝えているか
- キャプションは2行以内でベネフィット型か
- フォントは読みやすいか（30pt 以上相当）
- First 3 Rule を満たしているか

| 結果 | アクション |
|------|-----------|
| 8/10 以上 | → PHASE 6 へ |
| 7/10 以下 | → PHASE 3 に戻る（最大3回） |
| 3回連続 FAIL | → Slack に警告 → EXIT |

---

### PHASE 6: Slack に送る（ダイスが確認）

`processed/` の PNG 3枚を Slack `#metrics` チャンネルに投稿する。

```
[screenshot-ab] 新候補 ready 🖼️
ヘッドライン: "Why Do You Keep Failing The Same Habit?"
visual-qa: 8.5/10 PASS
→ 確認して OK か NG を返してください。
```

| ダイスの返答 | アクション |
|------------|-----------|
| OK | → PHASE 7 へ |
| NG | → PHASE 3 に戻る |

---

### PHASE 7: ASC アップロード・実験開始

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
    "queue_position": 1,
    "phase": "PIL",
    "headline": "Why Do You Keep Failing The Same Habit?",
    "before_cvr": 3.2,
    "analytics_request_id": "..."
  }
}
```

**Slack 通知:**
```
[screenshot-ab] 新実験開始 🔬
Queue 1 / "Why Do You Keep Failing The Same Habit?"
実験ID: ppo_xyz456 | Control: 前回勝者スクショ | Treatment: 新スクショ
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
    "analytics_request_id": "04c74879-547f-4e35-b231-1fafd485801d"
  },
  "history": [],
  "winning_patterns": [],
  "losing_patterns": []
}
```
