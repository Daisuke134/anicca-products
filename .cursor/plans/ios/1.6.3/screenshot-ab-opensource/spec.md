# screenshot-ab オープンソース化 スペック

## 開発環境

| 項目 | 値 |
|------|-----|
| **作業ブランチ** | `dev` |
| **スペックパス** | `.cursor/plans/ios/1.6.3/screenshot-ab-opensource/spec.md` |
| **作業状態** | 設計中 |

---

## 1. 概要（What & Why）

### What

`screenshot-ab` を独立した GitHub リポジトリとして公開する。
App Store スクリーンショット A/B テストを自動化するスキルで、OpenClaw（primary）と Claude Code の両方で動作する。

### Why

- スクリーンショット A/B テストをやっている iOS 開発者は多いが、自動化ツールが存在しない
- Pencil MCP + ASC CLI + RevenueCat の組み合わせは独自の価値がある
- OpenClaw コミュニティへの貢献、X Japanese (aniccaxxx) でのビルドインパブリック

### ポスト先

X アカウント: **aniccaxxx**（日本語）

---

## 2. 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|---------|
| 1 | 別 GitHub リポジトリが存在し、README がある | GitHub URL 確認 |
| 2 | OpenClaw で `screenshot-ab` スキルが動作する（cron 経由） | Mac Mini で `openclaw agent --message "screenshot-ab run"` |
| 3 | Claude Code でも動作する（手動実行） | ローカルで SKILL.md 読み込み確認 |
| 4 | 毎朝 5:00 JST に自動実行され Slack に結果が届く | Mac Mini cron ログ確認 |
| 5 | ASC 実験開始は「手動のみ」と README に明記されている | README 目視確認 |
| 6 | screenshot-creator / visual-qa / slack-approval の依存関係がセットアップ手順に書かれている | README 目視確認 |

---

## 3. As-Is / To-Be

### As-Is（現状）

| 項目 | 現状 |
|------|------|
| スキル場所 | `Daisuke134/anicca-products` の `.cursor/skills/screenshot-ab/` |
| 利用環境 | Anicca プロジェクト内のみ |
| 公開状況 | 非公開（private repo） |
| ドキュメント | SKILL.md のみ（外部向けではない） |
| 依存関係の明示 | なし |

### To-Be（変更後）

| 項目 | To-Be |
|------|-------|
| スキル場所 | `Daisuke134/screenshot-ab` (public repo) |
| 利用環境 | OpenClaw (primary) + Claude Code |
| 公開状況 | **Public** |
| ドキュメント | README.md（外部向け） + SKILL.md |
| 依存関係の明示 | セットアップガイドに全依存を記載 |

### 新リポジトリ構造

```
screenshot-ab/
├── README.md                    ← 外部向けドキュメント（英語 + 日本語）
├── SKILL.md                     ← OpenClaw / Claude Code 共通スキル定義
├── references/
│   ├── pipeline.md              ← パイプライン詳細（既存）
│   ├── setup.md                 ← セットアップ手順（既存 + 更新）
│   ├── headline-gen.md          ← キャッチコピー生成ロジック（既存）
│   └── visual-qa.md             ← Visual QA ガイド（既存）
├── scripts/
│   └── daily-report.sh          ← cron 用ラッパースクリプト（新規）
└── examples/
    ├── openclaw-cron.json        ← OpenClaw cron 設定例（新規）
    └── experiment-result.json   ← 出力例（新規）
```

---

## 4. 機能仕様

### 4.1 日次自動実行フロー（OpenClaw cron — primary）

```
毎朝 5:00 JST
    ↓
[PHASE 1] ASC から実験ステータス取得
    - asc product-pages experiments list
    - 実験が「Running」か確認
    ↓
[PHASE 2] RevenueCat から CVR データ取得（7日間）
    - Offering A vs B のトライアル開始率比較
    ↓
[PHASE 3] 判定
    - CVR 差異 > 5% かつ 統計的有意 → 勝者を Slack 報告
    - CVR 差異 ≤ 5% → 継続報告
    - 実験が「Paused/Ended」→ 手動確認を Slack に通知
    ↓
[PHASE 4] 新スクリーンショット生成（オプション: 週1回）
    - screenshot-creator スキルを呼び出し
    - Pencil MCP で新デザイン生成
    - visual-qa スキルで品質確認
    ↓
[PHASE 5] Slack 報告（slack-approval で承認フロー）
    - 新スクリーンショット候補を見せる
    - ✅ 承認 → asc screenshots upload（自動）
    - ❌ 却下 → そのまま終了
```

### 4.2 ASC 実験に関する絶対制約

**ASC 実験の開始は Claude/エージェントがプログラムで実行することは不可能。**

| 操作 | 自動化可否 | 理由 |
|------|-----------|------|
| 実験作成 | ✅ 可 | `asc product-pages experiments create` |
| スクリーンショット設定 | ✅ 可 | `asc screenshots upload` |
| **実験開始** | **❌ 不可** | Apple Review 必須 → その後 ASC Web UI で "Start Test" を手動クリック |
| 実験停止 | ✅ 可（要確認） | `asc product-pages experiments update --stopped` |
| ステータス取得 | ✅ 可 | `asc product-pages experiments list` |
| 結果取得 | ✅ 可 | ASC Analytics |

**README にこの制約を必ず明記する。**

### 4.3 Claude Code 手動実行フロー

```
ユーザー: "screenshot-ab run"
    ↓
SKILL.md が読み込まれる
    ↓
インタラクティブに各フェーズを選択
- [1] 実験ステータス確認のみ
- [2] CVR データ取得 + 分析
- [3] 新スクリーンショット生成
- [4] フルパイプライン
```

---

## 5. 依存関係（セットアップで必須）

| 依存 | 種別 | インストール方法 | 用途 |
|------|------|----------------|------|
| **OpenClaw** | Runtime | `npm install -g openclaw` | primary 実行環境 |
| **Pencil app** | macOS app | Mac App Store | スクリーンショットデザイン |
| **`asc` CLI** | CLI | `brew install asc-cli` (要確認) | App Store Connect 操作 |
| **`screenshot-creator` skill** | Skill | 同リポジトリに同梱予定 | Pencil MCP ラッパー |
| **`visual-qa` skill** | Skill | 同リポジトリに同梱予定 | スクリーンショット品質確認 |
| **`slack-approval` skill** | Skill | 別途インストール | Slack 承認フロー |
| **RevenueCat MCP** | MCP | `openclaw mcp add revenuecat` | CVR データ取得 |
| **ASC MCP** | MCP | `openclaw mcp add app-store-connect` | 実験ステータス取得 |

### 同梱するスキル（リポジトリ内 `skills/` ディレクトリ）

| スキル | 同梱方法 |
|--------|---------|
| `screenshot-creator` | `skills/screenshot-creator/SKILL.md` としてコピー同梱 |
| `visual-qa` | `skills/visual-qa/SKILL.md` としてコピー同梱 |
| `slack-approval` | README に別途インストール手順を記載（同梱しない） |

---

## 6. テストマトリックス

| # | To-Be | テスト名 | カバー |
|---|-------|----------|--------|
| 1 | ASC 実験ステータス取得 | `test_fetch_experiment_status()` | OK |
| 2 | CVR 差異計算（5%閾値） | `test_cvr_diff_calculation()` | OK |
| 3 | 勝者判定ロジック | `test_winner_detection()` | OK |
| 4 | Slack 報告フォーマット | `test_slack_report_format()` | OK |
| 5 | ASC 実験開始が手動のみであることの警告出力 | `test_start_experiment_warning()` | OK |
| 6 | cron 設定ファイルの正確性 | JSON スキーマ検証 | OK |

---

## 7. 境界（やらないこと）

| やらないこと | 理由 |
|-------------|------|
| ASC 実験の自動開始 | Apple Review 必須のため技術的に不可能 |
| 他アプリへの汎用化 | Anicca 固有の RevenueCat 設定に依存 |
| Web ダッシュボード作成 | Slack 報告で十分 |
| CI/CD への組み込み | cron で十分 |
| anicca-products からのコード削除 | 既存 Anicca は引き続き使用 |

---

## 8. 実行手順

### フェーズ 1: リポジトリ作成

```bash
# 新リポジトリを GitHub に作成
gh repo create Daisuke134/screenshot-ab --public --description "App Store screenshot A/B testing automation for OpenClaw & Claude Code"

# ローカルにクローン
cd ~/Downloads
git clone https://github.com/Daisuke134/screenshot-ab.git
cd screenshot-ab
```

### フェーズ 2: ファイルコピー & 更新

```bash
# Anicca プロジェクトからスキルをコピー
ANICCA=~/Downloads/anicca-project

cp $ANICCA/.cursor/skills/screenshot-ab/SKILL.md ./SKILL.md
cp -r $ANICCA/.cursor/skills/screenshot-ab/references/ ./references/

# screenshot-creator と visual-qa もコピー
mkdir -p skills/screenshot-creator skills/visual-qa
cp $ANICCA/.cursor/skills/screenshot-creator/SKILL.md ./skills/screenshot-creator/SKILL.md
cp $ANICCA/.claude/skills/visual-qa/SKILL.md ./skills/visual-qa/SKILL.md
```

### フェーズ 3: README 作成

`README.md` を日英バイリンガルで作成（詳細は references/setup.md を参照）

### フェーズ 4: cron 設定例の作成

`examples/openclaw-cron.json` に 5:00 JST 実行の cron 設定例を作成

### フェーズ 5: X 投稿（aniccaxxx）

日本語で以下を投稿:
- App Store スクリーンショット A/B テストの自動化を OSS で公開
- OpenClaw + Claude Code 対応
- GitHub リンク

---

## 9. E2E 判定

| 項目 | 値 |
|------|-----|
| UI 変更 | なし（スキル/ドキュメントのみ） |
| 新画面 | なし |
| 結論 | Maestro E2E 不要（スキルのドキュメント化作業のため） |

---

## 10. 実装順序

| # | タスク | 完了基準 |
|---|--------|---------|
| 1 | GitHub リポジトリ作成 | `gh repo view Daisuke134/screenshot-ab` が成功 |
| 2 | 既存スキルファイルをコピー | `SKILL.md` と `references/` が存在 |
| 3 | screenshot-creator / visual-qa を `skills/` に同梱 | `skills/*/SKILL.md` が存在 |
| 4 | SKILL.md を外部向けに更新（Anicca 固有設定を変数化） | bundle_id, app_id, slack_channel を設定可能に |
| 5 | README.md 作成（日英） | 外部の人が読んでセットアップできる水準 |
| 6 | `examples/openclaw-cron.json` 作成 | OpenClaw cron に貼り付けて動く |
| 7 | ASC 実験手動開始の制約を README に明記 | 「Start Test は手動」の記述あり |
| 8 | 初回コミット & push | `git push origin main` 成功 |
| 9 | X (aniccaxxx) に日本語で投稿 | ツイート URL 確認 |

---

最終更新: 2026-02-24
