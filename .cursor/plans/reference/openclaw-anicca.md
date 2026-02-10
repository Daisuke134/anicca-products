# OpenClaw Anicca 運用ステータス（SSOT）

最終更新: 2026-02-10

このファイルの目的:
- 「今なにが動いていて、なにが“コードだけ”で、なにが未着手か」を誤解なく示す
- 1.6.2 の Done/Not Done をブレさせない（E2E/運用接続が無いものは未完）

## 稼働状況

- `ops-heartbeat`: 稼働中
- `detect_suffering`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/suffering-detector`）
- `app-nudge-sender`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/app-nudge-sender`）
- `proactive-app-nudge`: 未稼働（追加: `/api/admin/jobs/proactive-app-nudge`。cron未接続）
- `moltbook-monitor`: 稼働中（shadow mode, VPS OpenClaw cron → `/api/admin/jobs/moltbook-shadow-monitor`）
- `moltbook-poster`: 未稼働（追加: `/api/admin/jobs/moltbook-poster`。env/cron未接続）
- `roundtable-standup`: 稼働中（OpenClaw cron 09:00 JST → `/api/admin/roundtable/standup`）
- `learning-jobs`（memory/initiative/cleanup/autonomy-check）: 稼働中（OpenClaw cron 接続済み）

## Tool Availability（重要）

- **この環境では Web 検索が利用可能**（OpenClaw built-in: `web_search` と `browser`/`web.fetch`）。
- ユーザーに対して「ブラウザ検索が使えない」等の**断定**はしない。
- 失敗時は「使えない」と一般化せず、**実際のツール実行エラー**を短く添えて報告する。

OpenClaw公式ドキュメント:
- https://docs.openclaw.ai/tools
- https://docs.openclaw.ai/tools/web-search
- https://docs.openclaw.ai/gateway/configuration

## “できること”の最新状態（2026-02-09時点）

### すでに保証できる挙動（コード+単体テストで固定）
- X: `POST /api/agent/nudge` は detect-only 固定（返信禁止）。`202 + policy=detect_only_no_reply`
- Crisis: `severityScore>=0.90` 相当で SAFE-T interrupt、`#agents` へ通知、監査ログに記録
- Moltbook: 1.6.2 は「返信しない」運用（shadow monitorで生成+監査ログのみ）。投稿は `moltbook-poster` で別途対応（未稼働）
- 投稿安定化（B2）:
  - X: 260文字上限、429/5xxのみ 3回 retry（60/300/1800s）、クレジット枯渇は ops event + Slack（24h重複抑止）
  - TikTok: 2000文字上限、429/5xxのみ 3回 retry（60/300/1800s）、非retryは DLQ + ops event
- 学習（C2）:
  - Structured Memory / Initiative / Reaction Matrix / Research / Memory cleanup / Autonomy check の実装と単体テストは完了
- App Nudge（A2/A3）:
  - `suffering-detector -> app-nudge-sender -> /api/mobile/nudge/pending -> (iOS) pull+ack -> ローカル通知` の閉ループが本番API + Simulatorで通過済み

### まだ保証できない挙動（運用接続/E2E未完）
- Moltbook監視→検出→返信（本番固定化） ※ 1.6.2 は shadow mode 固定（生成+監査ログのみ、送信はしない）
- Moltbook日次投稿（moltbook-poster） ※ env/cron未接続
- センサー無しの固定スケジュールApp Nudge（proactive-app-nudge） ※ cron未接続

## Slack実地検証

- 検証日: 2026-02-09
- 結果: `ops-heartbeat` の通知到達を確認
- 追加検証（2026-02-10）:
  - `suffering-detector` crisis で `slack.sent=1` を確認（`#agents`）
  - `detect_suffering -> app-nudge-sender -> iOS (pending->ack)` の通しE2Eを確認（本番API + Simulator）

## Slack二重返信（2つのAniccaがいるように見える問題）

結論:
- 「Aniccaが2人格」ではなく、**複数台のOpenClaw gatewayが同じSlack Socket Mode(App Token)で同時接続**しているのが原因。
- その結果、ユーザーが1回メンションしても、**別マシンのgatewayがそれぞれ返信してSlackに2投稿**されることがある。

再発防止ルール（SSOT）:
- **Slackに接続するOpenClaw gatewayは1台だけ**にする。
- Aniccaの本番運用は **VPS（/home/anicca）** を唯一の実行環境とする。
- ローカル（/Users/cbns03）でOpenClawを動かす場合は、Slack接続を無効化するか、gatewayプロセスを停止してから行う。

観測された「設定ファイルパスが揺れる」理由:
- OpenClawは基本 `~/.openclaw/openclaw.json` を読むため、実行マシンごとにパスが変わる。
  - VPS: `/home/anicca/.openclaw/openclaw.json`
  - ローカル: `/Users/cbns03/.openclaw/openclaw.json`

## 設定ファイルパスのSSOT（どれが正しいパスか）

結論:
- **「どっちが正しいか」ではなく「どのプロセス/マシンがSlackに接続しているか」**で決まる。
- OpenClaw公式ドキュメント上、Gatewayはデフォルトで **`~/.openclaw/openclaw.json`** を読む（`~` はそのマシンのホーム）。
- よって、Slackで表示されるパスが `/Users/...` と `/home/...` で揺れるのは、**別マシンのGatewayが返信しているサイン**。

公式のパス決定ルール（抜粋）:
- デフォルト: `~/.openclaw/openclaw.json`
- 例外: `OPENCLAW_CONFIG_PATH` で上書き可能（Gatewayは `~/.openclaw/openclaw.json` または `OPENCLAW_CONFIG_PATH` を監視してホットリロード可能）
- 複数インスタンス分離: `OPENCLAW_CONFIG_PATH` + `OPENCLAW_STATE_DIR` で状態/設定を分離
- 便利フラグ（CLI）:
  - `openclaw --dev …` → `~/.openclaw-dev` を使用（ポートもずらす）
  - `openclaw --profile <name> …` → `~/.openclaw-<name>` を使用

このプロジェクトでのSSOT（運用ルール）:
- **本番（Slackに接続して良い）のSSOTはVPS**。
- したがって、設定ファイルのSSOTは **VPS上の `~/.openclaw/openclaw.json`（= `/home/anicca/.openclaw/openclaw.json`）**。
- ローカルの `/Users/cbns03/.openclaw/openclaw.json` は開発/検証用であり、**Slack接続を禁止**する（接続すると二重返信が再発する）。

確認コマンド（SSOTチェック）:
- そのマシンでOpenClaw CLIが参照している設定パスは、`openclaw models status` の `Config : ...` に出る。
- Gatewayが起動時に採用したモデルは、gatewayログに `agent model: ...` と出る。

## モデルのSSOT（Slackで嘘を言わせない）

ルール:
- Aniccaは「使っているモデル」を**自己申告しない**（推測禁止）。
- モデル回答は `openclaw models status --agent anicca` と `~/.openclaw/openclaw.json` の参照結果のみを返す。
- 参照できない場合は `N/A + 理由` を返す（例: 権限、コマンド失敗、設定不整合）。

モデルIDの注意（重要）:
- Codex（ChatGPT OAuth）を使う場合、OpenClawドキュメントの例は `openai-codex/gpt-5.3-codex`。
- `openai/gpt-5.3-codex` は「別系統」で、環境によっては存在しても**VPS側のUnknown modelの原因**になり得るため、VPSでは使わない。

## ローカル運用 vs VPS運用（推奨はVPS）

結論:
- **VPS運用を推奨**（常時稼働、cron、ネットワークが安定、Slack接続の単一化が容易）。

VPSが良い理由:
- 05:00 JSTの定時投稿が「PCのスリープ/再起動/ネットワーク断」の影響を受けにくい
- Slack Socket Modeの常時接続に向く（接続が切れにくい）
- 監査ログ、cron runs、systemdログで「実行証跡」を取りやすい

ローカルが悪い理由:
- うっかりローカルgatewayがSlackに接続すると、**二重返信/二重投稿**を発生させる
- スリープで切断、ネットワーク切替で切断しやすく、安定運用に向かない

## 参照

- 実装TODO: `../ios/1.6.2/implementation/TODO-NEXT-2026-02-09.md`
- デプロイTODO: `../ios/1.6.2/deployment-todo.md`

## Moltbook投稿（env SSOT）

`moltbook-poster` が外部投稿するために必要:
- `MOLTBOOK_BASE_URL`（例: `https://<instance>`）
- `MOLTBOOK_ACCESS_TOKEN`（Mastodon互換のアクセストークン）

運用検証（外部投稿無し）:
- `MOLTBOOK_DRY_RUN=true` で dry-run（監査ログのみ）
