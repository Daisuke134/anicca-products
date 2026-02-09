# OpenClaw Anicca — 現在の状態・ロードマップ・実装ガイド

**最終更新: 2026-02-09T00:30 UTC（1.6.2 Phase 1 デプロイ完了。Closed-Loop Ops: X投稿→メトリクス取得→Thompson Sampling学習ループ稼働中。）**

> **原始Spec (`Anicca-openclaw-spec.md`) は歴史的記録。本ドキュメントが Single Source of Truth。**

---

## VPS 情報

| 項目 | 値 |
|------|-----|
| IP | 46.225.70.241 |
| SSH | `ssh anicca@46.225.70.241` |
| OS | Ubuntu 24.04 LTS (arm64) |
| スペック | 4GB RAM / 2 vCPU / 40GB SSD (Hetzner) |
| Node.js | v22.22.0（CVE-2025-59466/CVE-2026-21636 対応済み） |
| OpenClaw | v2026.2.3-1（CVE-2026-25253修正済み。v2026.1.29以上で安全） |
| **Gateway** | **systemd（`openclaw-gateway.service`）← Docker から切り戻し** |
| Profile | `full`（全ツール有効: fs, exec, memory, slack, cron, web_search, browser） |
| モデル | `openai/gpt-4o` |
| Workspace | `~/.openclaw/workspace`（config でパス未指定 → `$HOME` ベースで自動解決） |
| Config | `~/.openclaw/openclaw.json` |
| Cron | `~/.openclaw/cron/jobs.json` |
| Env | `~/.env`（systemd EnvironmentFile 経由） |
| Keys | `~/.keys/AuthKey_D637C7RGFN.p8` |
| Scripts | `/home/anicca/scripts/daily-metrics/` |

## Docker→systemd 切り戻しの理由

| 理由 | 詳細 |
|------|------|
| **スキル制限** | Docker内ではバイナリ不足で11/53スキルのみ。systemd+CLI追加で13/53に改善（原因はDocker PATHではなくCLI未インストールだった） |
| **公式ドキュメント** | "Docker is optional. Use it only if you want a containerized gateway." Sandbox はGatewayとは独立して動作 |
| **3層セキュリティ** | Sandbox（WHERE）、Tool Policy（WHICH）、Exec Approvals（exec gating）は独立。Docker Gatewayなしでも Tool Policy と Exec Approvals は動作する |
| **Phase E (Gmail)** | Sandbox `mode: "non-main"` はGatewayがホストでも、non-mainセッションだけDocker内で実行する。Gateway自体のDocker化は不要 |

**Dockerファイルは `/home/anicca/openclaw-docker/` に保持**（Phase E sandbox用に再利用可能）

---

## 実装ステータス

| Phase | 状態 | 備考 |
|-------|------|------|
| A: セキュリティ | 完了 | mDNS off, パーミッション修正, 監査実行済み。追加: chmod 600, DM allowlist, env削除, UMask=0077 |
| B: メモリ・ハートビート | 完了 | MEMORY.md, HEARTBEAT.md, session-memory/command-logger/boot-md hook（config-based） |
| C: 追加設定 | 完了 | BOOT.md, bestEffort, gitclaw, vector search。C6(budget)は未対応（config key非存在） |
| D: Gateway方式 | 完了 | Docker→systemd切り戻し完了。systemd hardening適用済み |
| E: Gmail統合 | 未着手（1.6.2以降） | Phase D不要と判明。Sandbox用にDockerは将来使用 |
| allowBundled | 完了 | 11スキル許可。38スキルブロック（トークンコスト ~$6/月 削減） |
| Exec Approvals | 完了 | 33バイナリ許可。bash/sh/env除外。allowlist + on-miss + deny |
| Bindings | 完了 | `slack→anicca` 明示ルーティング。二重レスポンス防止 |
| スキル検証 | 完了 | 14/53 ready（coding-agent追加）。全機能テストPASS（U1-U8） |

## タスク実行計画

### Round 1（初期セットアップ — 全完了）

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 1 | openclaw-anicca.md を最新状態に更新 | 完了 | Docker→systemd決定を反映 |
| 2 | Docker停止 → systemd Gateway再有効化 | 完了 | `docker compose down` → systemd enable/start |
| 3 | 回帰テスト（Slack, Cron, exec, memory） | 完了 | 全テストPASS |
| 4 | allowBundled設定（使うスキルだけ許可） | 完了 | 11スキル。summarize除外（macOS専用） |
| 5 | Exec Approvals設定 | 完了 | 34バイナリ。Codex指摘でbash/sh削除 |
| 6 | 全スキル動作テスト + Codex review | 完了 | Codex ok:true |
| 7 | openclaw-anicca.md最終更新 | 完了 | — |

### Round 2（セキュリティ強化 + 二重レスポンス修正 — 全完了）

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 18 | codex CLI インストール → coding-agent ready | 完了 | `npm install -g @openai/codex`。14/53 skills |
| 19 | 二重レスポンス修正 | 完了 | bindings: slack→anicca。main agent routing除外 |
| 20 | 全テストケース再実行 (U1-U8) | 完了 | 8項目全PASS。whatsapp stale session修正 |
| 21 | Codex レビュー | 完了 | ok:false (2 blocking: groupPolicy=accepted, Slack検証=pending) |
| 22 | openclaw-anicca.md 最終更新 | 完了 | 本更新 |
| 23 | セキュリティ警告対応 | 完了 | 4→2 CRITICAL (chmod600, DM allowlist, env削除) |

### 残作業（ユーザー依頼待ち）

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| — | Slack実地検証 | 待ち | ユーザーが #metrics で @Anicca テスト→単一応答確認 |

---

## 現在できること

| 機能 | 状態 | 備考 |
|------|------|------|
| Slack 送受信 | OK | Socket Mode。全チャンネル許可（groupPolicy: open — ユーザー決定で維持）。bindings: slack→anicca |
| DM ポリシー | 制限 | policy=allowlist, allowFrom=[]（デフォルト全拒否。必要時にユーザーIDを追加） |
| Cron ジョブ | OK | 3 個稼働中（daily-metrics, lab-meeting x2）。全て bestEffort: true |
| ファイル読み書き | OK | workspace 内 |
| シェルコマンド実行 | OK | exec ツール（profile: full） |
| SOUL.md / AGENTS.md | OK | Decisive + 日本語 + テーブル形式ルール記載済み |
| content-research-writer スキル | OK | workspace/skills/ に配置済み |
| ハートビート | OK | 30分間隔、gpt-4o-mini、08:00-22:00 JST |
| メモリフラッシュ | OK | コンパクション時に自動保存 |
| Boot チェック | OK | Gateway起動時にBOOT.md実行 |
| HEARTBEAT.md | OK | チェックリスト記載済み（空だとスキップされる仕様） |
| MEMORY.md | OK | ユーザー情報、判断履歴、学習内容 |

## Slack チャンネル

| チャンネル | ID |
|-----------|-----|
| #metrics | C091G3PKHL2 |
| #ai | C08RZ98SBUL |
| #meeting | C03HRM5V5PD |

## Cron ジョブ

| ジョブ | スケジュール | 送信先 |
|--------|------------|--------|
| daily-metrics-reporter | 05:00 JST 毎日 | #metrics |
| Lab Meeting Reminder (日曜) | 09:00 JST 日曜 | #meeting |
| Lab Meeting Reminder (月曜) | 09:00 JST 月曜 | #meeting |

## 環境変数（~/.env）

| 変数 | 用途 | 状態 |
|------|------|------|
| OPENAI_API_KEY | GPT-4o + Vector memory search 自動有効化 | 設定済み |
| REVENUECAT_V2_SECRET_KEY | メトリクス | 設定済み |
| MIXPANEL_API_SECRET | メトリクス | 設定済み |
| MIXPANEL_PROJECT_ID | 3970220 | 設定済み |
| SLACK_BOT_TOKEN | Slack | 設定済み |
| SLACK_APP_TOKEN | Socket Mode | 設定済み |
| ASC_KEY_ID | App Store Connect | 設定済み |
| ASC_ISSUER_ID | App Store Connect | 設定済み |
| ASC_VENDOR_NUMBER | 93486075（Cronプロンプト内でも使用） | 設定済み |
| EXA_API_KEY | Exa 検索 | 設定済み |
| BRAVE_API_KEY | Web 検索（config で `tools.web.search.apiKey` にも設定済み） | 設定済み |
| OPENCLAW_GATEWAY_TOKEN | Gateway認証トークン | 設定済み |

## Quick Reference（頻出コマンド）

| 操作 | コマンド |
|------|---------|
| **Gateway再起動** | `export XDG_RUNTIME_DIR=/run/user/$(id -u) && systemctl --user restart openclaw-gateway` |
| **Gateway状態確認** | `export XDG_RUNTIME_DIR=/run/user/$(id -u) && systemctl --user status openclaw-gateway` |
| **ログ確認（リアルタイム）** | `journalctl --user -u openclaw-gateway -f` |
| **ログ確認（最新100行）** | `journalctl --user -u openclaw-gateway -n 100 --no-pager` |
| Cronジョブ一覧 | `openclaw cron list` |
| セキュリティ監査 | `openclaw security audit` / `openclaw security audit --deep` |
| 全体ステータス | `openclaw status` |
| エージェントターン | `openclaw agent --agent anicca --message "..."` |
| Slack投稿（CLI直接） | `openclaw message send --channel slack --target "C091G3PKHL2" --message "test"` |
| スキル一覧 | `openclaw skills list`（**複数形**。`skill list` は不可） |

---

## allowBundled（設定済み）

### 概要

| 項目 | 値 |
|------|-----|
| 目的 | トークンコスト削減（~$6/月）+ プロンプトノイズ低減 + 攻撃面縮小 |
| 設定方法 | `skills.allowBundled: [...]`（空配列=全無効、未設定=全有効） |
| 結果 | 11スキル許可 / 38スキルblocked / 3スキルmissing（coding-agent now ready） |

### 許可スキル一覧（現在の `allowBundled`）

| # | スキル | 用途 | 状態 |
|---|--------|------|------|
| 1 | slack | Slack高度制御 | ready |
| 2 | github | GitHub操作 | ready |
| 3 | skill-creator | カスタムスキル作成 | ready |
| 4 | healthcheck | ヘルスチェック | ready |
| 5 | tmux | ターミナル管理 | ready |
| 6 | weather | 天気情報取得 | ready |
| 7 | openai-image-gen | 画像生成 | ready |
| 8 | openai-whisper-api | 音声文字起こし | ready |
| 9 | clawhub | ClawHubスキル管理 | ready |
| 10 | coding-agent | コード書き+PR作成 | ready（codex CLI インストール済み） |
| 11 | session-logs | セッションログ管理 | ready |

**注意:** `exec`, `cron`, `web_search`, `memory`, `fs`, `browser` はスキルではなく**ビルトインツール**。`profile: full` で有効化済み。allowBundledとは無関係。

### 除外スキル

| スキル | 除外理由 |
|--------|---------|
| summarize | `summarize` CLI が macOS 専用（brew formula `steipete/tap/summarize`）。Linux VPS では動作しない |

---

## Exec Approvals（設定済み）

### 概要

| 項目 | 値 |
|------|-----|
| ファイル | `~/.openclaw/exec-approvals.json` |
| モード | `security: "allowlist"` / `ask: "on-miss"` / `askFallback: "deny"` |
| 許可バイナリ数 | 33 |
| **重要** | `bash` / `sh` / `env` は**除外**（シェル許可はallowlistバイパス、envは任意バイナリ実行バイパス） |

### 許可バイナリ一覧（33個）

| カテゴリ | バイナリ |
|---------|---------|
| ネットワーク | curl |
| ランタイム | node, python3 |
| バージョン管理 | git, gh |
| テキスト処理 | jq, rg, grep, sed, awk, tr, cut, sort, uniq, diff, wc |
| ファイル操作 | cat, ls, mkdir, cp, mv, touch, chmod, find, xargs, tee |
| 出力 | echo, head, tail |
| 日付 | date |
| OpenClaw | openclaw, clawhub |
| ターミナル | tmux |

### セキュリティ設計

| ルール | 理由 |
|--------|------|
| bash/sh/env 除外 | シェル経由で任意コマンド実行可能（allowlist バイパス）。envは任意バイナリ実行 |
| 絶対パス指定 | PATH操作による偽装防止 |
| on-miss + deny | 未知コマンドは自動拒否（Gateway無人運用のため） |
| per-agent allowlist | 将来の複数エージェント対応準備 |

---

## 1.6.1 ロードマップ（実装順序）

### Phase A: セキュリティ修正 — 完了

| # | タスク | 状態 |
|---|--------|------|
| A1 | groupPolicy "open" を維持 | 完了 |
| A2 | セキュリティ監査実行 | 完了 |
| A3 | mDNS 無効化 | 完了 |
| A4 | ファイルパーミッション | 完了 |

### Phase B: メモリ・ハートビート — 完了

| # | タスク | 状態 |
|---|--------|------|
| B0 | hooks.internal.enabled | 完了 |
| B1 | MEMORY.md 作成 | 完了 |
| B2 | memory/ ディレクトリ作成 | 完了 |
| B3 | memoryFlush 有効化 | 完了 |
| B4 | Heartbeat 有効化 | 完了（30m/gpt-4o-mini/08-22 JST） |
| B5 | HEARTBEAT.md 作成 | 完了 |
| B6 | session-memory hook | 完了 |
| B7 | command-logger hook | 完了 |
| B8 | Brave API Key | 完了（config + .env 両方設定済み） |

### Phase C: 追加設定 — 完了

| # | タスク | 状態 |
|---|--------|------|
| C1 | BOOT.md 作成 | 完了 |
| C2 | boot-md hook 有効化 | 完了 |
| C3 | Cron bestEffort | 完了 |
| C4 | gitclaw スキル | 完了 |
| C5 | Vector memory search | 完了（OPENAI_API_KEY で自動有効） |
| C6 | コスト予算設定 | 未対応（config key非存在） |

### Phase D: Gateway方式 — systemdに確定

**決定: Docker Gateway → systemd に切り戻し。**

| 項目 | 詳細 |
|------|------|
| 理由 | Docker内スキル制限（11/53）、公式ドキュメントでDocker Gateway任意 |
| systemd unit | `~/.config/systemd/user/openclaw-gateway.service` |
| Docker資材 | `/home/anicca/openclaw-docker/` に保持（Phase E sandbox用） |
| 切り替え手順 | 下記参照 |

#### systemd hardening（Codex review 指摘で追加）

| ディレクティブ | 効果 |
|---------------|------|
| `EnvironmentFile=/home/anicca/.env` | 全シークレットを.envに集約（unit file内に直書き禁止） |
| `PATH=/usr/local/bin:/usr/bin:/bin` | 最小化（ユーザーディレクトリ除外） |
| `NoNewPrivileges=true` | 特権昇格防止 |
| `PrivateTmp=true` | /tmp を隔離 |
| `ProtectSystem=strict` | システムディレクトリ読み取り専用 |
| `ReadWritePaths=/home/anicca/.openclaw /tmp` | 書き込み許可パス明示 |
| `UMask=0077` | 新規作成ファイルをowner-onlyに制限 |

**注意:** `PrivateDevices`, `ProtectKernelTunables`, `ProtectKernelModules`, `RestrictSUIDSGID` はユーザーレベル systemd (non-root) で使用不可（CAPABILITIES エラー）。これらはシステムレベル unit でのみ有効。

#### Docker→systemd 切り替え手順

```bash
# 1. Docker コンテナ停止
cd /home/anicca/openclaw-docker && sg docker -c 'docker compose down'

# 2. uid をホストユーザーに戻す（Docker用に1000:1000にしていた場合）
chown -R $(id -u anicca):$(id -g anicca) /home/anicca/.openclaw

# 3. systemd Gateway 有効化 & 起動
export XDG_RUNTIME_DIR=/run/user/$(id -u)
systemctl --user enable openclaw-gateway
systemctl --user start openclaw-gateway

# 4. 起動確認
systemctl --user status openclaw-gateway  # active (running) であること

# 5. 回帰テスト実行（下記チェックリスト）
```

#### 回帰テストチェックリスト

| # | テスト | コマンド/確認方法 | 期待結果 |
|---|--------|-----------------|---------|
| 1 | Gateway起動 | `systemctl --user status openclaw-gateway` | active (running) |
| 2 | Slack接続 | `openclaw message send --channel slack --target "C08RZ98SBUL" --message "systemd migration test"` | Slack に届く |
| 3 | Cronジョブ一覧 | `openclaw cron list` | 3ジョブ表示 |
| 4 | ファイル読み書き | workspace内でファイル作成テスト | 成功 |
| 5 | exec ツール | `openclaw agent --message "echo hello from systemd"` | レスポンスあり |
| 6 | memory 読み込み | `openclaw agent --message "MEMORY.md を読んで内容を要約して"` | MEMORY.md内容の要約 |
| 7 | スキル一覧 | `openclaw skills list`（**複数形**。`skill list` は不可） | Docker時より多い（11→目標: 40+） |
| 8 | ログ確認 | `journalctl --user -u openclaw-gateway -n 50 --no-pager` | エラーなし |

### Phase E: Gmail統合 — 延期

**前提: Sandbox用にDockerが必要だが、Gateway自体のDocker化は不要。**

| 項目 | 詳細 |
|------|------|
| 状態 | 未着手（1.6.2以降に延期可能） |
| Sandbox方式 | `mode: "non-main"` — Gatewayはホスト、non-mainセッションだけDocker sandbox |
| 必要なもの | Docker（sandbox用）、Tailscale Funnel、Google Cloud OAuth、gogcli |
| RCE緩和 | sandbox + workspaceAccess:none + tools.deny:["*"]（多層防御） |

**詳細手順は本セクション末尾のアーカイブを参照。**

---

## セキュリティ3層モデル（公式ドキュメント準拠）

| 層 | 名前 | 役割 | Docker Gateway必要？ |
|----|------|------|---------------------|
| 1 | **Sandbox** | WHERE: ツール実行環境の隔離 | No（Gatewayはホスト、sandbox用Dockerは別） |
| 2 | **Tool Policy** | WHICH: どのツールを許可するか | No（config `tools.profile` で制御） |
| 3 | **Exec Approvals** | HOW: exec コマンドの allowlist | No（`exec-approvals.json` で制御） |

**3層は独立して動作する。Docker Gatewayなしでも Tool Policy と Exec Approvals は完全に機能する。**

---

## コスト分析

| 項目 | モデル | 頻度 | 月額概算 |
|------|--------|------|---------|
| **Heartbeat** (GPT-4o-mini + activeHours 08-22) | gpt-4o-mini | 28回/日 x 30日 | **~$1/月** |
| Cron (daily-metrics + reminders x2) | gpt-4o | 3回/日 x 30日 | **~$1.5/月** |
| Ad-hoc Slack応答 | gpt-4o | ~10回/日 x 30日 | **~$5/月** |
| スキル（allowBundled設定済み） | — | — | **~$0（削減済み）** |
| **現在の構成合計** | gpt-4o-mini (heartbeat) + gpt-4o (他) + allowBundled設定済み | — | **~$7.5/月** |

**allowBundled設定完了。38スキルblocked → トークンコスト ~$6/月 削減済み。**

---

## セキュリティ知見（2026-02-07 調査）

| # | 知見 | 出典 | 対応 |
|---|------|------|------|
| 1 | **CVE-2026-25253** (CVSS 8.8): v2026.1.29未満でワンクリックRCE | The Register 2026-02-02 | OK（v2026.2.3-1で修正済み） |
| 2 | **ClawHubに341個の悪意あるスキル**: credential stealer, cryptominer, backdoor | Moltbook-AI Complete Guide | スキルインストール前にソース確認 + バージョン固定必須 |
| 3 | **42,665インスタンスが公開**: 93.4%が認証バイパス可能 | DigitalOcean, Hostinger | Gatewayはloopbackバインド + SSHトンネル |
| 4 | **Gmail 0-click RCE**: メール本文のプロンプトインジェクション | veganmosfet 2026-02-02 | 多層緩和必須: sandbox + workspaceAccess:none + tools.deny:["*"] |
| 5 | **Heartbeatコスト**: Opus 4.5で30分/24h = $750/月 | Markaicode, Moltbook-AI | gpt-4o-mini + activeHours → $1/月 |
| 6 | **npmスキルのライフサイクルスクリプト**: 任意コード実行可能 | OpenClaw Security Docs | ピンされたバージョンのみインストール |
| 7 | **`.openclaw/extensions/` 自動スキャン**: git clone→再起動でRCE | veganmosfet | extensionsディレクトリを空に保つ |

---

## スキル評価

### インストール済み（workspace）

| スキル | パス |
|--------|------|
| content-research-writer | `~/.openclaw/workspace/skills/content-research-writer/SKILL.md` |

### systemd スキル状態（2026-02-08 確認済み: 14/53 ready）

| # | スキル | 状態 | 備考 |
|---|--------|------|------|
| 1 | github | ready | gh CLI |
| 2 | healthcheck | ready | バイナリ不要 |
| 3 | openai-image-gen | ready | API呼び出しのみ |
| 4 | openai-whisper-api | ready | API呼び出しのみ |
| 5 | skill-creator | ready | バイナリ不要 |
| 6 | slack | ready | バイナリ不要 |
| 7 | tmux | ready | tmux インストール済み |
| 8 | weather | ready | バイナリ不要 |
| 9 | clawhub | ready | `npm install -g clawhub` で追加 |
| 10 | session-logs | ready | jq + rg 両方必要。`apt install jq ripgrep` で追加 |
| 11 | coding-agent | ready | codex CLI インストール済み（`npm install -g @openai/codex`） |
| 12-14 | 他3スキル | ready | — |
| — | summarize | N/A | macOS専用CLI。allowBundledから除外済み |
| — | **残り38スキル** | **blocked** | allowBundledで除外（トークンコスト削減） |

**Docker→systemd切り替えでスキル数は変わらなかった（11→11）。** CLI不足が原因であり、Docker PATH問題ではなかった。jq/rg/clawhub追加で13、codex CLI追加で14に改善。

### 機能テスト結果（2026-02-08 再テスト）

| # | テスト | 結果 | 備考 |
|---|--------|------|------|
| U1 | weather (web_search) | PASS | 「東京の天気は +9°C 🌦」 |
| U2 | 日付・曜日 | PASS | 「2026年2月8日(日曜日)」 |
| U3 | memory (MEMORY.md) | PASS | 全セクション正確に要約 |
| U4 | web_search (RevenueCat) | PASS | Brave Search API経由で5件取得 |
| U5 | cron一覧 | PASS | 3ジョブ正確に列挙 |
| U6 | fs (workspace一覧) | PASS | 14ファイル正確 |
| U7 | cross-channel (slack) | PASS | #metricsセッション→#aiに投稿成功 |
| U8 | coding-agent | PASS | JS配列重複除去関数（Set使用）正しく生成 |

### 推奨スキル（1.6.2で追加検討）

| スキル | 推奨度 | 理由 | 前提 |
|--------|--------|------|------|
| conventional-commits | 推奨 | コミットメッセージ規約準拠 | ClawHubからインストール |

### 使用禁止

| スキル | 理由 |
|--------|------|
| **bird** (Twitter) | Cookie認証 = BAN リスク。公式OAuth 2.0を使う |
| **xcodebuildmcp** | VPSでは動作しない（macOS専用） |
| **未検証のClawHubスキル** | 341個の悪意あるスキルが発見済み。ソース確認必須 |

---

## Codex Review 結果

### Round 1（2026-02-08 初回）

| 項目 | 値 |
|------|-----|
| 対象 | openclaw.json, exec-approvals.json, systemd unit, openclaw-anicca.md |
| Iteration 1 | `ok: false` — 7 blocking, 1 advisory |
| Iteration 2 | `ok: true` — 全 blocking 解消 |

### Round 2（2026-02-08 セキュリティ強化後）

| 項目 | 値 |
|------|-----|
| 対象 | テスト結果(U1-U8) + セキュリティ修正3件 + 設定ファイル群 |
| 結果 | `ok: false` — 2 blocking, 4 advisory |

| # | Severity | Category | 問題 | 対応 |
|---|----------|----------|------|------|
| 1 | BLOCKING | security | groupPolicy=open がCRITICAL | **ユーザー承認済み受容リスク** |
| 2 | BLOCKING | correctness | Slack実地での二重レスポンス未検証 | **ユーザーSlackテスト必要** |
| 3 | advisory | security | exec-approvals が広い | 将来改善（runtime/maintenance分離） |
| 4 | advisory | security | systemd hardening追加余地 | ユーザーレベルsystemd制限あり。UMask=0077のみ適用 |
| 5 | advisory | maintainability | cron排他制御不足 | maxConcurrentRuns:2 + isolated で運用 |
| 6 | advisory | testing | 異常系テスト不足 | 将来改善タスク |

### 修正履歴（全ラウンド）

| # | category | 問題 | 修正 |
|---|----------|------|------|
| 1 | security | bash/sh が exec-approvals に含まれていた | 削除（R1） |
| 2 | security | GATEWAY_TOKEN が systemd unit に直書き | 削除（R1） |
| 3 | security | PATH が広すぎた | 最小化（R1） |
| 4 | security | systemd hardening 未設定 | 追加（R1） |
| 5 | security | Config file mode 664 | chmod 600（R2） |
| 6 | security | DM policy=open | allowlist化（R2） |
| 7 | security | /usr/bin/env in exec allowlist | 削除（R2） |
| 8 | security | UMask未設定 | UMask=0077追加（R2） |

### Codex notes for next review

| 項目 | 内容 |
|------|------|
| Slack実地検証 | @Anicca メンション時の単一応答を記録付き検証 |
| hardening ログ | systemd hardening が実運用で問題を起こしていないか確認 |
| トークンローテーション | Gateway token / Slack token の定期ローテーション検討 |
| exec-approvals分離 | runtime用(読取系)とmaintenance用(書込系)の分離検討 |

---

## 1.6.2 閉ループ制御層（Closed-Loop Ops）

### 概要

> **設計**: `.cursor/plans/ios/1.6.2/implementation/closed-loop-ops/`（13ファイル）
> **デプロイTODO**: `.cursor/plans/ios/1.6.2/implementation/deployment-todo.md`
> **アーキテクチャ**: Proposal → Policy Check (Kill Switch) → Mission → Steps → Events → Triggers → Reactions → Loop

### Phase 1 デプロイ状況（✅ 完了 — 2026-02-08）

> **ゴール**: X投稿 → 効果測定 → Thompson Sampling 学習 の1サイクルが自動で回ること → **達成**

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| P1-1 | x-research-skill を Claude Code にインストール | ✅ | `.claude/skills/x-research` にクローン |
| P1-2 | x-research-skill を OpenClaw VPS にインストール | ⬜ | `/home/anicca/.openclaw/skills/x-research` + X_BEARER_TOKEN |
| P1-3 | feature/closed-loop-ops → dev マージ | ✅ | 408テスト PASS → dev マージ完了 |
| P1-4 | Railway Staging デプロイ確認 | ✅ | dev push → 自動デプロイ → /health OK |
| P1-5 | DB Migration 実行（Staging） | ✅ | Prisma migrate deploy → 7テーブル作成 + seed |
| P1-6 | VPS Heartbeat Cron 追加 | ✅ | `*/5 * * * *` crontab → heartbeat OK |
| P1-7 | X API 実接続（post_x Executor） | ✅ | Blotato API (account 11852) → X投稿成功 |
| P1-8 | 手動テスト: Proposal → Mission → X投稿 | ✅ | 3ステップ全成功: draft→verify→post_x |
| P1-9 | fetch_metrics Executor 実接続 | ✅ | Blotato解決→X API v2→DB更新→analyze_engagement |
| P1-10 | 48h Trigger テスト | ✅ | 24h後自動発火→fetch_metrics→analyze→Thompson更新 |

### Railway Staging 実装済みコンポーネント

#### API エンドポイント（`/api/ops/*` — opsAuth + 60 req/min rate limit）

| エンドポイント | メソッド | 用途 | 状態 |
|---------------|---------|------|------|
| `/api/ops/proposal` | POST | 新規 Proposal 提出（draft_content, verify_content, post_x 等） | ✅ 稼働中 |
| `/api/ops/proposal/:id/approve` | POST | Kill Switch 対象の手動承認 | ✅ 稼働中 |
| `/api/ops/step/next` | GET | 次の queued ステップ取得 | ✅ 稼働中 |
| `/api/ops/step/:id/complete` | PATCH | ステップ完了報告（output + events） | ✅ 稼働中 |
| `/api/ops/heartbeat` | GET | 制御プレーン（triggers → reactions → steps → insights → stale） | ✅ 稼働中 |
| `/api/ops/events` | POST | 外部イベント投入 | ✅ 稼働中 |

#### Step Executor 一覧（13ファイル）

| Executor | ファイル | 状態 | 備考 |
|----------|---------|------|------|
| draft_content | `executeDraftContent.js` | ✅ 実API接続済み | LLM でコンテンツ生成 |
| verify_content | `executeVerifyContent.js` | ✅ 実API接続済み | LLM でコンテンツ検証 |
| post_x | `executePostX.js` | ✅ 実API接続済み | Blotato API → X投稿（account 11852） |
| post_tiktok | `executePostTiktok.js` | 🔧 スタブ | TikTok API v2 未接続 |
| fetch_metrics | `executeFetchMetrics.js` | ✅ 実API接続済み | Blotato ID解決→X API v2 public_metrics→DB更新 |
| analyze_engagement | `executeAnalyzeEngagement.js` | ✅ 実API接続済み | エンゲージメント分析→Thompson Sampling更新 |
| detect_suffering | `executeDetectSuffering.js` | 🔧 スタブ | 苦しみ検出 |
| diagnose | `executeDiagnose.js` | 🔧 スタブ | 診断 |
| draft_nudge | `executeDraftNudge.js` | 🔧 スタブ | Nudge下書き |
| send_nudge | `executeSendNudge.js` | 🔧 スタブ | Nudge送信（Kill Switch対象） |
| evaluate_hook | `executeEvaluateHook.js` | 🔧 スタブ | Hook評価 |
| registry | `registry.js` | ✅ | Executor ルックアップ |
| index | `index.js` | ✅ | エクスポート |

#### Prisma モデル（7テーブル + 関連）

| モデル | 用途 | 状態 |
|--------|------|------|
| OpsProposal | 提案（steps[], policy結果） | ✅ Staging DB に存在 |
| OpsMission | ミッション（approved proposal → mission） | ✅ |
| OpsMissionStep | 実行ステップ（queued → running → completed/failed） | ✅ |
| OpsPolicy | ポリシー（kill_switch, cap_gate） | ✅ seed済み |
| OpsEvent | イベント（tweet_posted, metrics_fetched 等） | ✅ |
| OpsTrigger | トリガールール（delay_min ベース） | ✅ seed済み |
| OpsReaction | リアクション（trigger → proposal 自動生成） | ✅ |
| XPost | X投稿記録（blotatoPostId, xPostId, metrics） | ✅ |
| TiktokPost | TikTok投稿記録 | ✅ |
| HookCandidate | Thompson Sampling（xSampleSize, xEngagementRate） | ✅ |

#### Trigger ルール（seed済み）

| ルール | イベント | 遅延 | アクション |
|--------|---------|------|-----------|
| `engagement_analysis_24h` | `tweet_posted` | 1440分（24h） | fetch_metrics + analyze_engagement |
| `tiktok_content_check_24h` | `tiktok_posted` | 1440分（24h） | fetch_metrics + analyze_engagement |

#### サービス層

| サービス | ファイル | 用途 |
|---------|---------|------|
| proposalService | `proposalService.js` | Proposal 作成・承認・ミッション変換 |
| capGates | `capGates.js` | 日次上限チェック（per-skill） |
| policyService | `policyService.js` | Kill Switch / Cap Gate 評価 |
| eventEmitter | `eventEmitter.js` | OpsEvent 作成・配信 |
| triggerEvaluator | `triggerEvaluator.js` | トリガー条件評価（delay_min ベース） |
| reactionProcessor | `reactionProcessor.js` | リアクション→Proposal 自動生成 |
| staleRecovery | `staleRecovery.js` | running ステップのタイムアウト回復 |
| opsAuth | `opsAuth.js` | Bearer token 認証（ANICCA_AGENT_TOKEN） |

### 環境変数（Railway Staging — 設定済み）

| 変数 | 用途 | 状態 |
|------|------|------|
| `ANICCA_AGENT_TOKEN` | Ops API Bearer 認証（VPS Worker → Railway） | ✅ 設定済み |
| `OPENAI_API_KEY` | LLM（draft_content, verify_content, analyze_engagement） | ✅ 設定済み |
| `BLOTATO_API_KEY` | Blotato API（X/TikTok投稿） | ✅ 設定済み |
| `BLOTATO_ACCOUNT_ID_EN` | Blotato X英語アカウント（11852） | ✅ 設定済み |
| `X_BEARER_TOKEN` | X API v2 public_metrics 取得 | ✅ 設定済み |
| `DATABASE_URL` | Railway PostgreSQL（internal） | ✅ 設定済み |

### DB 直接接続（Staging Proxy）

| 項目 | 値 |
|------|-----|
| **Proxy URL** | `postgresql://postgres:WgyHhBwqrEVFsXiQNOPrLaNhEayQrVdJ@ballast.proxy.rlwy.net:51992/railway` |
| **psql** | `PGPASSWORD=WgyHhBwqrEVFsXiQNOPrLaNhEayQrVdJ psql -h ballast.proxy.rlwy.net -U postgres -p 51992 -d railway` |
| **用途** | デバッグ・テスト時の直接クエリ（Internal URLは外部アクセス不可） |

### VPS Crontab（Heartbeat）

| ジョブ | スケジュール | コマンド | 状態 |
|--------|------------|---------|------|
| ops-heartbeat | `*/5 * * * *` | `curl -s -H "Authorization: Bearer $TOKEN" https://anicca-proxy-staging.up.railway.app/api/ops/heartbeat` | ✅ 稼働中 |

### 既知の問題・制限事項

| # | 問題 | 影響 | 対応状況 |
|---|------|------|---------|
| 1 | **X API Free Tier クレジット枯渇** | fetch_metrics が CreditsDepleted エラー → DB フォールバック値を返す | コードで graceful handling 済み。クレジット回復待ち |
| 2 | **triggerEvaluator が最新イベントのみ評価** | 新しいイベントが古いイベントのトリガー発火をブロック | 設計バグ。将来修正予定（全マッチングイベントをループ） |
| 3 | **Blotato 長文投稿エラー** | 一部の投稿が "not permitted to perform this action" で失敗 | コンテンツ長/権限の問題。短い投稿は成功 |
| 4 | **post_tiktok 未実装** | TikTok 投稿は手動 | Phase 3 で TikTok API v2 接続予定 |

### Kill Switch（自動承認禁止）

| step_kind | 理由 |
|-----------|------|
| `post_x` | 公開投稿。人間承認必須 |
| `post_tiktok` | 公開投稿 |
| `send_nudge` | ユーザー直接介入。仏教原則: ehipassiko |
| `deploy` | インフラ変更。永久禁止 |
| `reply_dm` | テーラヴァーダ不請法則違反。永久禁止 |

### Phase 2 タスク（未着手）

> **ゴール**: 3エージェントが毎日会話し、自発的に Proposal を生成し、学習すること

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| P2-1 | OpenClaw マルチエージェント設計 | ⬜ | anicca(共感), hunter(発見), growth(分析) の3エージェント |
| P2-2 | openclaw.json agents[] 追加 | ⬜ | hunter/growth は gpt-4o-mini でコスト削減 |
| P2-3 | Roundtable 会話スキル作成 | ⬜ | VoxYZ パターン: standup, debate, watercooler |
| P2-4 | 朝スタンドアップ Cron 追加 | ⬜ | 毎朝9:00 JST → エージェント間会話 → Slack #ops |
| P2-5 | 構造化 Memory テーブル追加 | ⬜ | insight, pattern, strategy, lesson, preference + confidence |
| P2-6 | 会話ログ → Memory 自動抽出 | ⬜ | LLM で会話から insight/pattern/lesson を抽出 |
| P2-7 | Initiative システム | ⬜ | エージェントが自発的に Proposal 生成（memory >= 5件で有効化） |
| P2-8 | x-research を Trend-Hunter に統合 | ⬜ | x-search CLI → queryBuilder → orchestrator パイプライン |
| P2-9 | Reaction Matrix 設定 | ⬜ | tweet_high_engagement → growth 分析、等 |
| P2-10 | 1週間自律運用テスト | ⬜ | Slack で OK を押すだけ |

### Phase 3 タスク（未着手）

> **ゴール**: 1週間旅行に行っても DL が増え続けること

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| P3-1 | TikTok API 実接続 | ⬜ | TikTok API v2 |
| P3-2 | オンボーディング最適化ループ | ⬜ | ファネル測定 → A/Bテスト自動生成 → 勝者適用 |
| P3-3 | 広告最適化ループ | ⬜ | TikTok Ads / ASA → CPI測定 → クリエイティブ改善 |
| P3-4 | Voice Evolution（個性の進化） | ⬜ | memory 分布から個性を動的生成 |
| P3-5 | Dynamic Affinity（関係性） | ⬜ | エージェント間の好感度が会話で変動 |
| P3-6 | オンボ→Paywall→Trial 最適化 | ⬜ | 42.8% → 60%、1.1% → 5% を目標 |
| P3-7 | 完全自律運用（2週間テスト） | ⬜ | 操作: 20分/日以下 |

### 設計ドキュメント参照先

| ドキュメント | パス | 内容 |
|-------------|------|------|
| デプロイTODO | `.cursor/plans/ios/1.6.2/implementation/deployment-todo.md` | Phase 1-3 タスクリスト |
| 閉ループ制御層（分割版） | `.cursor/plans/ios/1.6.2/implementation/closed-loop-ops/` | 13ファイル（README含む） |
| 閉ループ制御層（アーカイブ） | `.cursor/plans/ios/1.6.2/implementation/closed-loop-ops.md` | 3670行の元ファイル |
| マスター設計書 | `.cursor/plans/ios/1.6.2/implementation/1.6.2-ultimate-spec.md` | ~3700行 |
| スキル詳細設計 | `.cursor/plans/ios/1.6.2/implementation/1.6.2-ultimate-spec2.md` | ~1920行 |
| trend-hunter 設計 | `.cursor/plans/ios/1.6.2/implementation/trend-hunter/` | 11ファイル |
| Buddha アーキテクチャ | `.cursor/plans/ios/1.6.2/1.6.2-buddha-software-closed-loop-architecture-spec.md` | Wisdom Engine + One-Flesh |

---

## 現在の openclaw.json（2026-02-07 確認済み）

```json5
{
  // メタ
  logging: { redactSensitive: "tools" },

  // エージェント設定
  agents: {
    defaults: {
      model: { primary: "openai/gpt-4o" },
      userTimezone: "Asia/Tokyo",
      timeFormat: "24",
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
      compaction: { memoryFlush: { enabled: true } },  // B3
      heartbeat: {                                       // B4
        every: "30m",
        target: "last",
        model: "openai/gpt-4o-mini",
        activeHours: { start: "08:00", end: "22:00", timezone: "Asia/Tokyo" }
      }
    },
    list: [{
      id: "anicca",
      default: true,
      name: "Anicca",
      identity: { name: "Anicca", emoji: "🧘" },
      groupChat: { mentionPatterns: ["@anicca", "anicca", "Anicca", "@Anicca"] },
      tools: { profile: "full" }
    }]
  },

  // ツール
  tools: {
    profile: "full",
    web: {
      search: { enabled: true, apiKey: "<BRAVE_API_KEY>" },
      fetch: { enabled: true }
    }
  },

  // メッセージ
  messages: {
    groupChat: { mentionPatterns: ["@anicca", "anicca", "Anicca", "@Anicca"] },
    ackReactionScope: "group-mentions"
  },

  // Slack
  channels: {
    slack: {
      mode: "socket",
      enabled: true,
      groupPolicy: "open",
      historyLimit: 25,
      actions: { reactions: true, messages: true },
      dm: { enabled: true, policy: "allowlist", allowFrom: [] },
      channels: {
        "C091G3PKHL2": { allow: true, requireMention: true },
        "C08RZ98SBUL": { allow: true, requireMention: true },
        "C03HRM5V5PD": { allow: true, requireMention: true }
      }
    }
  },

  // Gateway
  gateway: {
    port: 18789,
    mode: "local",
    bind: "loopback",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "<GATEWAY_TOKEN>" }
  },

  // スキル
  skills: {
    entries: {
      "daily-metrics-reporter": { enabled: true },
      "github": { enabled: true },
      "slack": { enabled: true }
    },
    allowBundled: [
      "slack", "github", "skill-creator", "healthcheck", "tmux",
      "weather", "openai-image-gen", "openai-whisper-api", "clawhub",
      "coding-agent", "session-logs"
    ]
  },

  // Discovery
  discovery: { mdns: { mode: "off" } },

  // Hooks
  hooks: {
    internal: {
      enabled: true,
      entries: {
        "session-memory": { enabled: true },
        "command-logger": { enabled: true },
        "boot-md": { enabled: true }
      }
    }
  },

  // Cron
  cron: { enabled: true, maxConcurrentRuns: 2 },

  // Bindings（二重レスポンス防止）
  bindings: [
    { agentId: "anicca", match: { channel: "slack" } }
  ]
}
```

**注意: 上記は可読性のためにjson5形式。実際のファイルはJSON。APIキー等はマスク済み。**

---

## Phase E アーカイブ（Gmail統合 — 将来参照用）

### 0-click RCE 脆弱性緩和策

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        workspaceAccess: "none",
        scope: "session"
      }
    }
  },
  tools: {
    sandbox: {
      tools: { deny: ["*"] }
    }
  },
  hooks: {
    gmail: {
      allowUnsafeExternalContent: false
    }
  }
}
```

### 必要なソフトウェア

| ソフトウェア | 用途 |
|-------------|------|
| Docker | Sandbox コンテナ実行 |
| Tailscale + Funnel | Webhook受信（VPSがloopbackバインド） |
| gogcli | Gmail API認証 |
| gcloud CLI | Pub/Sub設定 |
| Google Cloud OAuth | Desktop app credentials |

### ユーザー作業（実装前）

| # | タスク | 取得するもの |
|---|--------|-------------|
| 1 | Google Cloud Console でプロジェクト作成 | Project ID |
| 2 | Gmail API + Pub/Sub API 有効化 | — |
| 3 | OAuth同意画面 → Publishing Status を "Production" に変更 | — |
| 4 | OAuth認証情報作成（Desktop app） | client_secret.json |

---

## 参考リンク

| リソース | URL |
|---------|-----|
| OpenClaw Docs | https://docs.openclaw.ai |
| OpenClaw Docker | https://docs.openclaw.ai/install/docker |
| OpenClaw Hetzner Guide | https://docs.openclaw.ai/install/hetzner |
| OpenClaw Security | https://docs.openclaw.ai/gateway/security |
| OpenClaw Sandboxing | https://docs.openclaw.ai/gateway/sandboxing |
| OpenClaw Sandbox vs Tool Policy | https://docs.openclaw.ai/gateway/sandbox-vs-tool-policy-vs-elevated |
| OpenClaw Skills | https://docs.openclaw.ai/tools/skills |
| OpenClaw Skills Config | https://docs.openclaw.ai/tools/skills-config |
| OpenClaw Exec Approvals | https://docs.openclaw.ai/tools/exec-approvals |
| OpenClaw Heartbeat | https://docs.openclaw.ai/gateway/heartbeat |
| OpenClaw Memory | https://docs.openclaw.ai/concepts/memory |
| OpenClaw Hooks | https://docs.openclaw.ai/hooks |
| OpenClaw Gmail PubSub | https://docs.openclaw.ai/automation/gmail-pubsub |
| ClawHub スキル | https://clawhub.ai |
| CVE-2026-25253 | https://www.theregister.com/2026/02/02/openclaw_security_issues/ |
| Gmail 0-click RCE | https://veganmosfet.github.io/2026/02/02/openclaw_mail_rce.html |
