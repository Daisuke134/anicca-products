# Headline Generation Loop

ソース: recursive-improver / 核心の引用: 「生成→自己採点→診断→改善→再採点を全基準合格まで反復するスキル」

---

## 入力

| 項目 | 内容 |
|------|------|
| 勝ちパターン | experiments.json の `winning_patterns`（例: `["問いかけ型"]`） |
| 負けパターン | experiments.json の `losing_patterns`（例: `["数字型", "断言型"]`） |
| ペルソナ | 25〜35歳、6〜7年間主体性の欠如と自己嫌悪のループから抜け出せていない。習慣アプリ10個以上試して全部3日坊主 |
| 出力数 | 3画面分（screen1/screen2/screen3） |

---

## ループプロトコル（最大5回）

```
GENERATE（3画面分のヘッドライン生成）
    ↓
EVALUATE（下記採点基準で採点）
    ↓
全基準 8/10 以上？ → Yes → SHIP（screenshots.yaml に書き込む）
    ↓ No
DIAGNOSE（不合格理由を特定）
    ↓
IMPROVE（弱点を修正した新版を生成）
    ↓
RE-EVALUATE → ループ先頭に戻る（最大5回）
```

---

## 採点基準（App Storeスクショ用）

| # | 基準 | 閾値 | 説明 |
|---|------|------|------|
| 1 | ペインの直撃度 | 8/10 | 「6年間変われなかった」層に刺さるか |
| 2 | 具体性 | 8/10 | 数字・年数・具体的な状況があるか |
| 3 | 独自性 | 8/10 | 競合（Habitica/Calm/Streaks）と被らないか |
| 4 | 改行の自然さ | 8/10 | `\n` の位置が読みやすいか（2〜3行構成） |
| 5 | 3秒スクロール耐性 | 8/10 | スクロール中に目が止まるか |

---

## 出力フォーマット（各イテレーション）

```
## Iteration N

### 生成物
screen1: "HEADLINE\nLINE2\nLINE3"  subtitle: "Subtitle text."
screen2: "HEADLINE\nLINE2\nLINE3"  subtitle: "Subtitle text."
screen3: "HEADLINE\nLINE2\nLINE3"  subtitle: "Subtitle text."

### スコアカード
| # | 基準 | screen1 | screen2 | screen3 | 判定 |
|---|------|---------|---------|---------|------|
| 1 | ペインの直撃度 | 9 | 8 | 7 | FAIL(s3) |
| 2 | 具体性 | 8 | 9 | 8 | PASS |
...

### 総合: FAIL → IMPROVE へ（screen3 の具体性を強化）
```

---

## SHIP 後のアクション

確定したヘッドラインを `docs/screenshots/config/screenshots.yaml` の `caption.title` / `caption.subtitle` に書き込む。
