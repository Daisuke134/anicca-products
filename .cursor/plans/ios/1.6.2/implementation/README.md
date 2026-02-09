# 1.6.2 Implementation Spec — 歩き方ガイド

> **目的**: このディレクトリにある設計文書の関係性と読み方を示す。初見のエージェントがここから始める。
> **最終更新**: 2026-02-08

---

## 開発環境（実装完了 — レビュー待ち）

| 項目 | 値 |
|------|-----|
| **ワークツリーパス** | `/Users/cbns03/Downloads/anicca-closed-loop-ops` |
| **ブランチ** | `feature/closed-loop-ops` |
| **ベースブランチ** | `dev` |
| **作業状態** | 実装完了・レビュー待ち |
| **Codexレビュー（Spec）** | ok: true（10 iterations, 2026-02-08） |
| **テスト結果** | 396/396 PASS（54テストファイル） |

### チーム構成（3エージェント並列）

| エージェント | 担当 | 対象ファイル/ディレクトリ |
|-------------|------|----------------------|
| **data-layer** | Prisma schema + API routes + services | `apps/api/prisma/`, `apps/api/src/routes/agent/`, `apps/api/src/services/ops/` |
| **executors** | Step executors + Event/Trigger system + Heartbeat | `apps/api/src/services/ops/executors/`, `apps/api/src/services/ops/eventEmitter.js`, `apps/api/src/jobs/` |
| **trend-hunter** | trend-hunter VPS skill (OpenClaw) | VPS: `/usr/lib/node_modules/openclaw/skills/trend-hunter/` |

### レビューエージェントへの注意

- **このワークツリーで作業すること**（devブランチを直接触らない）
- Spec は `.cursor/plans/ios/1.6.2/implementation/` 配下
- テストマトリックス: `closed-loop-ops/10-test-matrix-checklist.md` (T1-T67) + `trend-hunter/06-test-matrix.md` (#1-#49)
- コード品質レビューは `feature/closed-loop-ops` ブランチの差分に対して実行

---

## 実装結果（完了）

> **完了日時**: 2026-02-08

### エージェント別ステータス

| エージェント | 担当 | 状態 | 実装ファイル | テストファイル |
|-------------|------|------|------------|-------------|
| **data-layer** | Prisma + API routes + Core services | ✅ 完了 | 15 | 8 |
| **executors** | Step executors + Heartbeat | ✅ 完了 | 13 | 13 |
| **trend-hunter** | trend-hunter パイプライン | ✅ 完了 | 13 | 11 |

### テスト結果

| 項目 | 値 |
|------|-----|
| テストファイル数 | 54（既存 + 新規） |
| テスト総数 | 396 |
| 通過 | 396 |
| 失敗 | 0 |
| 実行時間 | 3.47s |

### 実装ファイル一覧

#### Prisma Schema + Migration

| ファイル | 内容 |
|---------|------|
| `apps/api/prisma/schema.prisma` | 7 ops テーブル + HookCandidate拡張 |
| `apps/api/sql/` | Seed data (ops_policy) |

#### Core Services (`apps/api/src/services/ops/`)

| ファイル | 機能 |
|---------|------|
| `proposalService.js` | createProposalAndMaybeAutoApprove() |
| `capGates.js` | checkCapGate() — per-skill日次制限 |
| `eventEmitter.js` | emitEvent(source, kind, tags, payload, missionId) |
| `policyService.js` | getPolicy() / updatePolicy() — キャッシュ付き |
| `reactionProcessor.js` | processReactionQueue() — cooldown制御 |
| `triggerEvaluator.js` | evaluateTriggers() — delay_min / 二重発火防止 |
| `staleRecovery.js` | recoverStaleSteps() — 30分タイムアウト |
| `insightPromoter.js` | promoteInsights() |

#### API Routes (`apps/api/src/routes/ops/`)

| ファイル | エンドポイント |
|---------|-------------|
| `index.js` | POST proposals, GET step/next, PATCH step/:id/complete |
| `heartbeat.js` | GET /api/ops/heartbeat (5分間隔) |
| `events.js` | POST /api/ops/events |

#### Step Executors (`apps/api/src/services/ops/stepExecutors/`)

| ファイル | Step Kind |
|---------|----------|
| `registry.js` | 12 executor マッピング |
| `executeDraftContent.js` | draft_content |
| `executeVerifyContent.js` | verify_content |
| `executePostX.js` | post_x |
| `executePostTiktok.js` | post_tiktok |
| `executeFetchMetrics.js` | fetch_metrics |
| `executeAnalyzeEngagement.js` | analyze_engagement |
| `executeDetectSuffering.js` | detect_suffering |
| `executeDiagnose.js` | diagnose |
| `executeDraftNudge.js` | draft_nudge |
| `executeSendNudge.js` | send_nudge |
| `executeEvaluateHook.js` | evaluate_hook |
| `executeRunTrendScan.js` | run_trend_scan |

#### trend-hunter (`apps/api/src/services/ops/trend-hunter/`)

| ファイル | 機能 |
|---------|------|
| `config.js` | ProblemType辞書 + データソース設定 |
| `index.js` | エントリポイント |
| `orchestrator.js` | メインパイプライン: collect → filter → generate → save |
| `queryBuilder.js` | ProblemType → 検索クエリ変換 |
| `rotationSelector.js` | 3グループ固定ローテーション |
| `thompsonSampling.js` | Beta分布サンプリング (Jöhnk's algorithm) |
| `textSimilarity.js` | Jaccard bi-gram >= 0.7 重複検出 |
| `viralityFilter.js` | バイラリティスコアフィルター |
| `twitterResponseParser.js` | X/Twitter レスポンス正規化 |
| `redditResponseParser.js` | Reddit レスポンス正規化 |
| `tiktokResponseParser.js` | TikTok レスポンス正規化 |
| `slackFormatter.js` | Slack Block Kit フォーマッター |
| `dlqHandler.js` | DLQ (max_retries=3, exponential backoff) |

#### Middleware + Utilities

| ファイル | 機能 |
|---------|------|
| `apps/api/src/middleware/opsAuth.js` | OPS_AUTH_TOKEN 認証 |
| `apps/api/src/services/verifier.js` | コンテンツ品質検証 |
| `apps/api/src/services/hookSelector.js` | platform-aware Thompson Sampling (更新) |
| `apps/api/src/lib/llm.js` | OpenAI wrapper |
| `apps/api/src/lib/logger.js` | ロガー |
| `apps/api/src/routes/agent/hooks.js` | POST /api/agent/hooks (HookSaveSchema) |

### 次のステップ

| # | タスク | 状態 |
|---|--------|------|
| 1 | codex-review（実装コード GATE 3） | 次に実行 |
| 2 | dev にマージ | レビュー後 |
| 3 | Prisma migration 実行（Staging） | マージ後 |
| 4 | VPS Worker 設定 + OpenClaw skill デプロイ | マージ後 |

---

## ディレクトリ構成

```
implementation/
├── README.md                          ← 今読んでいるファイル
├── 1.6.2-ultimate-spec.md             ← マスター設計書（~3600行）
├── 1.6.2-ultimate-spec2.md            ← スキル詳細設計（~1920行）
├── closed-loop-ops.md                 ← 閉ループ制御層・アーカイブ（~3670行）
├── trendposter.md                     ← trend-hunter・アーカイブ（~1836行）
├── closed-loop-ops/                   ← 閉ループ制御層・分割版（13ファイル）
│   ├── README.md                      ← 閉ループ歩き方ガイド
│   ├── 01-overview-adr.md
│   ├── ...
│   └── 13-gui-prerequisites.md
└── trend-hunter/                      ← trend-hunter・分割版（11ファイル）
    ├── README.md                      ← trend-hunter歩き方ガイド
    ├── 01-overview-prerequisites.md
    ├── ...
    └── 11-dlq-checklist.md
```

## ファイル一覧と役割

| ファイル/フォルダ | 行数 | 役割 | 一言で言うと |
|-----------------|------|------|-------------|
| `1.6.2-ultimate-spec.md` | ~3600 | **マスター設計書** | 「全体の骨格」 — アーキテクチャ、フェーズ計画、コアアルゴリズム |
| `1.6.2-ultimate-spec2.md` | ~1920 | **スキル詳細設計** | 「各スキルの中身」 — ultimate-specから分離したスキル実装の詳細 |
| `closed-loop-ops/` | 13ファイル | **閉ループ制御層** | 「神経系」 — スキル間を繋ぐイベント駆動循環システム |
| `trend-hunter/` | 11ファイル | **trend-hunter 完全設計** | 「感覚器官」 — 外部からバイラルコンテンツを検出する仕組み |

> **重要**: `closed-loop-ops.md` と `trendposter.md` は分割前のアーカイブ。実装時は各サブフォルダ内のファイルを参照すること。

---

## 関係図

```
┌─────────────────────────────────────────────────────────┐
│                 1.6.2-ultimate-spec.md                    │
│            （マスター設計 — 全体の骨格）                   │
│                                                          │
│  ・Phase 1-4 マスタータスクリスト                         │
│  ・Gateway 制御プレーン + VPS アーキテクチャ              │
│  ・hookSelector.js (Thompson Sampling)                    │
│  ・verifier.js (content品質検証)                          │
│  ・errorHandler.js (Circuit Breaker)                      │
│  ・schedule.yaml (Cron定義)                               │
│  ・ONE FLESH 統合思想                                     │
│  ・セキュリティレイヤー、レート制限                       │
├──────────────┬──────────────┬─────────────────────────────┤
│              │              │                             │
│              ▼              ▼                             ▼
│   ultimate-spec2.md    closed-loop-ops/          trend-hunter/
│   （スキル詳細）       （閉ループ制御）           （トレンド取得）
│                         13ファイル                 11ファイル
│   x-poster 全Python    Proposal→Mission→Step      4データソース
│   tiktok-poster        7テーブル Prisma            ProblemType辞書
│   suffering-detector   Executor Registry           59テスト
│   app-nudge-sender     Slack承認フロー             Thompson Sampling
│   memU サービス        監視/アラート               DLQリトライ
│   評価フレームワーク   テスト61本                   コスト~$22/月
└─────────────────────────────────────────────────────────┘
```

---

## 読む順序（推奨）

### パターン A: 全体を理解したい場合

| 順番 | ファイル | 読む範囲 | 所要時間(目安) |
|------|---------|---------|-------------|
| 1 | `1.6.2-ultimate-spec.md` | Section 0 (Executive Summary) + MASTER TASK LIST | 5分 |
| 2 | `closed-loop-ops/README.md` | ファイル一覧 + 関係図 | 3分 |
| 3 | `1.6.2-ultimate-spec2.md` | スキル一覧テーブル（冒頭） | 3分 |
| 4 | `trend-hunter/README.md` | ファイル一覧 + 関係図 | 2分 |

### パターン B: 特定スキルを実装する場合

| やりたいこと | 読むファイル | 読む箇所 |
|-------------|------------|---------|
| x-poster を実装 | `ultimate-spec2.md` → `closed-loop-ops/` | spec2のx-posterセクション → `05-step-executors.md` |
| trend-hunter を実装 | `trend-hunter/README.md` → 各ファイル | README のパターンB/Cに従う |
| 閉ループ基盤を実装 | `closed-loop-ops/README.md` → 各ファイル | README のパターンB/Cに従う |
| テストを書く | `closed-loop-ops/10-test-matrix-checklist.md` + `trend-hunter/06-test-matrix.md` | テストマトリックス |
| Cron / スケジュール設定 | `ultimate-spec.md` | schedule.yaml セクション |
| hookSelector (Thompson Sampling) | `ultimate-spec.md` + `trend-hunter/10-thompson-sampling.md` | spec の hookSelector.js + trend-hunter の v2設計 |
| memU (メモリサービス) | `ultimate-spec2.md` | memU Integration セクション |

### パターン C: TDDで実装を進める場合

| ステップ | 参照先 |
|---------|-------|
| 1. テストマトリックス確認 | `closed-loop-ops/10-test-matrix-checklist.md` (T1〜T67) + `trend-hunter/06-test-matrix.md` (#1〜#40) |
| 2. テスト基盤セットアップ | `closed-loop-ops/10-test-matrix-checklist.md` (Vitest + Prisma Mock) |
| 3. RED: テスト作成 | テスト名とカバー対象がマトリックスに記載済み |
| 4. GREEN: 実装 | 各コンポーネントファイル参照 |
| 5. REFACTOR | テストが GREEN のまま改善 |
| 6. GUI前提タスク確認 | `closed-loop-ops/13-gui-prerequisites.md` + `trend-hunter/01-overview-prerequisites.md` |

---

## なぜ2つのultimate-specがあるのか

| ファイル | 経緯 | 内容の性質 |
|---------|------|-----------|
| `ultimate-spec.md` | 最初に作成。アーキテクチャ全体 + コアアルゴリズム | **What（何を作るか）** + **How（コアロジック）** |
| `ultimate-spec2.md` | spec が長大になりすぎたため分離 | **How（各スキルの具体実装）** |

**使い分けルール:**

| 探しているもの | 読むファイル |
|--------------|------------|
| アーキテクチャ判断、ADR、フェーズ計画 | `ultimate-spec.md` |
| hookSelector / verifier / errorHandler の JS実装 | `ultimate-spec.md` |
| schedule.yaml、セキュリティ、レート制限 | `ultimate-spec.md` |
| 各スキルの SKILL.md / Python 全文 | `ultimate-spec2.md` |
| memU サービスの具体コード | `ultimate-spec2.md` |
| 評価フレームワーク (pass@k, pass^k) | `ultimate-spec2.md` |

---

## サブフォルダの位置づけ

| サブフォルダ | 分割元 | 何を定義するか |
|-------------|-------|---------------|
| `closed-loop-ops/` | `closed-loop-ops.md` | スキルが **いつ・なぜ** 動くか（トリガー、リアクション、フィードバック） |
| `trend-hunter/` | `trendposter.md` | 外部バイラルコンテンツを **何から・どう** 検出するか |

**核心**: ultimate-spec/spec2 のスキルは「部品」、closed-loop-ops は「部品を動かす仕組み」、trend-hunter は「外部情報を取り込むセンサー」。

---

## 確定事項（全ファイル共通）

| 項目 | 決定 | 根拠 |
|------|------|------|
| DB | Railway PostgreSQL（Supabase不使用） | ADR-004 |
| 実行者 | VPS (46.225.70.241) のみ | ADR-005 (Pitfall 1 回避) |
| 提案経路 | `createProposalAndMaybeAutoApprove()` 単一エントリ | ADR-006 (Pitfall 2 回避) |
| キュー制御 | Cap Gate で事前拒否 | ADR-007 (Pitfall 3 回避) |
| X API | 公式 OAuth 2.0（Cookie/Bird禁止） | BAN リスク回避 |
| TikTok API | 公式 Content Posting API | 公式のみ |
| 直接返信 | 禁止（投稿のみ） | Bot 扱い + BAN リスク |
| テスト基盤 | Vitest + vitest-mock-extended (Node.js) / pytest (Python) | 2026年ベストプラクティス |

---

## 残タスク（設計段階）

| # | タスク | 関連ファイル | Task ID |
|---|--------|------------|---------|
| 1 | 仏教コミュニケーション原則の追記 | ultimate-spec.md | #1 |
| 2 | Sangha ロードマップ独立化 | 新規ファイル | #5 |
| 3 | iOS 側変更仕様（あれば） | ultimate-spec.md | — |
| 4 | スキル間E2E統合テストシナリオ | closed-loop-ops/ | — |
| 5 | 全スキルのLLMコスト見積もり統合 | ultimate-spec.md | — |
