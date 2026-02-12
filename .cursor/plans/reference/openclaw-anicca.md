# OpenClaw Anicca 運用ステータス（SSOT）

最終更新: 2026-02-10

<<<<<<< HEAD
## 現状（2026-02-10）

| 項目 | 状態 |
|------|------|
| **Anicca（Slack / 会話）** | **VPS** の OpenClaw（gateway）で運用中。Slack に返信するのは VPS 1 台のみ。 |
| **ローカル gateway** | **停止済み**。設定・環境は **残してある**（Mac mini 等でローカル運用に戻す可能性があるため）。 |
| **VPS の cron** | ジョブ定義・実行とも VPS 上で動作。 |

## ローカルと VPS のフォルダ構造（どこに何があるか）

OpenClaw の「状態」は **1 台につき 1 つのルート** に全部入る。**相対的なフォルダ構造はローカルも VPS も同じ**で、違うのは **ルートのフルパスだけ**。

---

### ローカル（Mac）

**メインのルート（フルパス）:**
```
/Users/cbns03/.openclaw
```

**ルートからのフォルダ構造:**
```text
/Users/cbns03/.openclaw/
├── openclaw.json          # 設定本体（モデル・Slack・cron・ツール等）
├── .env                   # APIキー等の環境変数
├── exec-approvals.json
├── logs/
│   ├── gateway.log
│   └── gateway.err.log
├── agents/
│   ├── anicca/
│   │   ├── agent/
│   │   │   └── auth-profiles.json   # OAuth/トークン
│   │   └── sessions/
│   │       └── sessions.json
│   └── main/
│       └── agent/
│           └── auth-profiles.json
├── cron/
│   ├── jobs.json          # ジョブ定義
│   └── runs/              # 実行履歴
├── skills/
│   └── slack-mention-handler/
├── workspace/
│   ├── anicca.ai/         # プロジェクト等の作業場
│   ├── skills/
│   │   └── daily-metrics-reporter/
│   ├── scripts/
│   └── temp/
├── browser/
│   ├── chrome-extension/
│   └── openclaw/
├── canvas/
├── completions/
├── credentials/
├── devices/
├── identity/
├── media/
└── memory/
```

---

### VPS

**メインのルート（フルパス）:**
```
/home/anicca/.openclaw
```

（VPS にログインしたときの `~` が `/home/anicca` なので、`~/.openclaw` = `/home/anicca/.openclaw`）

**ルートからのフォルダ構造（相対構造はローカルと同じ）:**
```text
/home/anicca/.openclaw/
├── openclaw.json
├── .env
├── exec-approvals.json
├── logs/
│   ├── gateway.log
│   └── gateway.err.log
├── agents/
│   ├── anicca/
│   │   ├── agent/
│   │   │   └── auth-profiles.json
│   │   └── sessions/
│   │       └── sessions.json
│   └── main/
│       └── agent/
│           └── auth-profiles.json
├── cron/
│   ├── jobs.json
│   └── runs/
├── skills/
│   └── （同期したスキル、例: slack-mention-handler）
├── workspace/
│   ├── （同期した作業場。anicca.ai や skills 等）
│   ├── skills/
│   │   └── （例: daily-metrics-reporter）
│   └── ...
├── browser/
├── canvas/
├── completions/
├── credentials/
├── devices/
├── identity/
├── media/
└── memory/
```

**違いのまとめ:**

| 項目 | ローカル | VPS |
|------|----------|-----|
| ルート | `/Users/cbns03/.openclaw` | `/home/anicca/.openclaw` |
| 構造 | 上記ツリー | **同じ相対構造**（中身は同期した分だけ） |
| 設定のパス | openclaw.json に書く workspace は `/Users/cbns03/.openclaw/workspace` | openclaw.json に書く workspace は `/home/anicca/.openclaw/workspace` |

---

## OpenClaw のデフォルト（バンドル）スキル

**OpenClaw 本体に同梱されているスキル**は、npm パッケージ内にある。**VPS** では `npm install openclaw` した環境の `node_modules/openclaw/skills/`、**ローカル Mac** では `/opt/homebrew/lib/node_modules/openclaw/skills/`。

| 項目 | 値 |
|------|-----|
| **数** | **52 個**（公式では 53 Skills と書かれる場合あり） |
| **有効化** | デフォルトで **バンドルスキルはオートロード**。制限する場合は `openclaw.json` の `skills.allowBundled` でホワイトリスト指定。 |
| **追加スキル** | `~/.openclaw/skills/`（managed）と `~/.openclaw/workspace/skills/`（workspace）に置いたスキルが **追加** で読み込まれる。 |

**バンドルスキル一覧（52 個・1行1スキル）:**

```
1password
apple-notes
apple-reminders
bear-notes
blogwatcher
blucli
bluebubbles
camsnap
canvas
clawhub
coding-agent
discord
eightctl
food-order
gemini
gifgrep
github
gog
goplaces
healthcheck
himalaya
imsg
local-places
mcporter
model-usage
nano-banana-pro
nano-pdf
notion
obsidian
openai-image-gen
openai-whisper
openai-whisper-api
openhue
oracle
ordercli
peekaboo
sag
session-logs
sherpa-onnx-tts
skill-creator
slack
songsee
sonoscli
spotify-player
summarize
things-mac
tmux
trello
video-frames
voice-call
wacli
weather
```

- 参照: [OpenClaw Setup Guide: 25 Tools + 53 Skills](https://yu-wenhao.com/en/blog/openclaw-tools-skills-tutorial)（`allowBundled` の説明あり）。

---

## ローカル（Mac）の OpenClaw 状態ディレクトリ構造（実測・詳細）

ROOT（フルパス）:
- `/Users/cbns03/.openclaw/`

相対ツリー（ROOT から）:
```text
.
├── openclaw.json
├── .env
├── logs/
│   ├── gateway.log
│   └── gateway.err.log
├── agents/
│   ├── anicca/
│   │   ├── agent/
│   │   │   └── auth-profiles.json
│   │   └── sessions/
│   │       └── sessions.json
│   └── main/
│       └── agent/
│           └── auth-profiles.json
├── cron/
│   ├── jobs.json
│   └── runs/
├── skills/
│   └── slack-mention-handler/
├── workspace/
├── browser/
│   └── chrome-extension/
└── canvas/
```

役割（最低限）:
- `openclaw.json`: 設定の本体（モデル、Slack、cron、Anicca の tools.allow など）
- `.env`: APIキー等の環境変数（OpenClawが読む）
- `logs/`: Gateway のログ（Slack接続、返信、`agent model:`、`Unknown model` 等）
- `agents/<agentId>/agent/auth-profiles.json`: OAuth/トークンの格納（例: `openai-codex` OAuth）
- `agents/<agentId>/sessions/sessions.json`: セッション状態・履歴（ルーティング/状態）
- `cron/jobs.json`: cron ジョブ定義（「いつ」「何を」実行するか）。Gateway が常時起動している限り動く
- `cron/runs/`: cron 実行履歴
- `skills/`: managed skill（インストール済みスキル）
- `workspace/`: エージェントの作業場（生成物、スキル開発、作業ファイル）
- `browser/`: ブラウザ制御の補助データ（Chrome 拡張 relay 等）
- `canvas/`: Control UI向けのデータ置き場

VPS の場合:
- ROOT は基本 `~/.openclaw/` で同じだが、`~` が `/home/anicca`（または `/root`）になるだけ。

**VPS が止まっているか確認する（ローカルから）:**
```bash
ssh anicca@46.225.70.241 'systemctl --user status openclaw-gateway.service'
```
→ `Active: inactive (dead)` なら停止済み。

**GUI（Tools タブ）:** 「Status: unsaved」が出ていたら **Save** を押す。ツールの allowlist は Config タブで管理。

### slack-mention-handler が blocked になる場合（Missing: env:OPENAI_API_KEY, env:REVENUECAT_V2_SECRET_KEY）

OpenClaw は **`~/.openclaw/.env`** を読む（[Environment Variables](https://docs.openclaw.ai/help/environment)）。このファイルに次の2行があればスキルは unblock される。

- `OPENAI_API_KEY=...`
- `REVENUECAT_V2_SECRET_KEY=...`

**手順:** プロジェクトルートの `.env` に同じキーがあるなら、その2行を `~/.openclaw/.env` にコピーする。Gateway を**再起動**すると読み込まれる。

```bash
grep -E '^(OPENAI_API_KEY|REVENUECAT_V2_SECRET_KEY)=' /path/to/anicca-project/.env > ~/.openclaw/.env
# その後 gateway 再起動（ローカルなら OpenClaw GUI から、VPS なら systemctl --user restart openclaw-gateway.service）
```

### Opus（Anthropic）が configured, missing のとき（APIキー/認証が無い）

Opus を使うには **Anthropic の認証情報**を OpenClaw に登録する必要がある（「ブラウザでポチ」だけでは解決しない）。

**いま入れる必要があるもの（どちらか一方）:**

| 方法 | 入れるもの | どこで入れるか |
|------|------------|----------------|
| **A. Setup-token（Claude Pro/Max 購読）** | `claude setup-token` で取得したトークン文字列 | 下記「ポチポチ手順」の「Paste token for anthropic」の欄 |
| **B. API キー** | Anthropic Console で発行した API キー | `~/.openclaw/.env` に `ANTHROPIC_API_KEY=sk-ant-...` を1行で追加し、Gateway 再起動 |

**ポチポチ手順（A: setup-token で進める場合）**

1. **トークンを取得する（任意のマシンで可）**
   ```bash
   claude setup-token
   ```
   - ブラウザが開いたら **あなたが** ログインして表示されたトークンをコピーする。

2. **OpenClaw にトークンを登録する**
   ```bash
   openclaw models auth paste-token --provider anthropic
   ```
   - プロンプト **「Paste token for anthropic」** が出たら、そこに **さきほどコピーしたトークン** を貼り付けて Enter。
   - これだけ（最小限は「そのトークン文字列を貼る」）。

**B のとき（API キー）:**  
`~/.openclaw/.env` に `ANTHROPIC_API_KEY=sk-ant-...` を追加して保存し、Gateway を再起動する。

---

## 運用方針: Anicca は VPS、ローカルは停止（環境は残す）

**現在の運用:** Slack に繋ぐ OpenClaw gateway は **VPS 1台だけ**。**ローカル gateway は停止済み**。ローカル側の `~/.openclaw/` は **そのまま残してある**（Mac mini 等でローカル運用に戻す可能性があるため）。

**VPS で gateway を止めるとき（ローカルから）:**
```bash
ssh anicca@46.225.70.241 'systemctl --user stop openclaw-gateway.service'
```

**VPS で gateway を起動するとき:**
```bash
ssh anicca@46.225.70.241 'systemctl --user start openclaw-gateway.service'
```

---

=======
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
このファイルの目的:
- 「今なにが動いていて、なにが“コードだけ”で、なにが未着手か」を誤解なく示す
- 1.6.2 の Done/Not Done をブレさせない（E2E/運用接続が無いものは未完）

## 稼働状況

- `ops-heartbeat`: 稼働中
- `detect_suffering`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/suffering-detector`）
- `app-nudge-sender`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/app-nudge-sender`）
<<<<<<< HEAD
- `moltbook-monitor`: 稼働中（shadow mode, VPS OpenClaw cron → `/api/admin/jobs/moltbook-shadow-monitor`）
=======
- `proactive-app-nudge`: 未稼働（追加: `/api/admin/jobs/proactive-app-nudge`。cron未接続）
- `moltbook-monitor`: 稼働中（shadow mode, VPS OpenClaw cron → `/api/admin/jobs/moltbook-shadow-monitor`）
- `moltbook-poster`: 未稼働（追加: `/api/admin/jobs/moltbook-poster`。env/cron未接続）
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
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
<<<<<<< HEAD
- Moltbook: opt-in無しは禁止。返信は `hook+content` 合計 400文字上限に自動トリム
=======
- Moltbook: 1.6.2 は「返信しない」運用（shadow monitorで生成+監査ログのみ）。投稿は `moltbook-poster` で別途対応（未稼働）
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
- 投稿安定化（B2）:
  - X: 260文字上限、429/5xxのみ 3回 retry（60/300/1800s）、クレジット枯渇は ops event + Slack（24h重複抑止）
  - TikTok: 2000文字上限、429/5xxのみ 3回 retry（60/300/1800s）、非retryは DLQ + ops event
- 学習（C2）:
  - Structured Memory / Initiative / Reaction Matrix / Research / Memory cleanup / Autonomy check の実装と単体テストは完了
- App Nudge（A2/A3）:
  - `suffering-detector -> app-nudge-sender -> /api/mobile/nudge/pending -> (iOS) pull+ack -> ローカル通知` の閉ループが本番API + Simulatorで通過済み

### まだ保証できない挙動（運用接続/E2E未完）
- Moltbook監視→検出→返信（本番固定化） ※ 1.6.2 は shadow mode 固定（生成+監査ログのみ、送信はしない）
<<<<<<< HEAD
=======
- Moltbook日次投稿（moltbook-poster） ※ env/cron未接続
- センサー無しの固定スケジュールApp Nudge（proactive-app-nudge） ※ cron未接続
>>>>>>> origin/codex/1.6.2-ssot-skills-crons

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

<<<<<<< HEAD
## 進捗チェックリスト（Slack二重返信解消 + VPSモデル統一）

- [x] ローカル(Mac)で `openclaw-gateway` がSlackに接続しないよう停止する
- [x] ローカル(Mac)の `ai.openclaw.gateway` launchd（`~/Library/LaunchAgents/ai.openclaw.gateway.plist`）を無効化し、LaunchAgents外へ退避する
- [ ] Slackで二重返信が止まったことを確認（1メンション=1返信）
- [ ] VPSで `openai-codex` OAuthを完了（`~/.openclaw/agents/anicca/agent/auth-profiles.json` に `openai-codex` が入る）
- [ ] VPSの `~/.openclaw/openclaw.json` を `openai-codex/gpt-5.3-codex` に統一
- [ ] VPSの `openclaw-gateway` を再起動し、ログで `agent model: openai-codex/gpt-5.3-codex` を確認
- [ ] Aniccaの回答ルール固定（モデル自己申告禁止、`models status`/設定参照のみ）

## GPT-5.3 Codex 運用化（クイック手順）

**目的:** Anicca を `openai-codex/gpt-5.3-codex` で確実に動かす。

| 順 | やること | どこで |
|----|----------|--------|
| 0 | ローカルで gateway が動いていないことを確認 | ローカル |
| 1 | VPS で gateway を一時停止 | VPS |
| 2 | **openai-codex OAuth**（`ssh -tt` でログイン → 表示URLをブラウザで開く → リダイレクトURLを貼り付け） | ローカル→VPS |
| 3 | **切替スクリプトを VPS で実行**（allowlist + primary 設定 + gateway 再起動） | VPS |
| 4 | Slack で 1 メンション = 1 返信・モデル表示を確認 | Slack |

**スクリプト:** `scripts/openclaw-vps/switch-to-gpt53codex.sh`（README: `scripts/openclaw-vps/README.md`）

```bash
# 0) ローカル
pgrep -fl openclaw-gateway || echo "OK"
# 1) VPS で gateway 停止
ssh anicca@46.225.70.241 'systemctl --user stop openclaw-gateway.service'
# 2) OAuth（TTY必須）
ssh -tt anicca@46.225.70.241 'openclaw models auth login --provider openai-codex'
# 3) スクリプト送付・実行
scp scripts/openclaw-vps/switch-to-gpt53codex.sh anicca@46.225.70.241:~/
ssh anicca@46.225.70.241 'bash ~/switch-to-gpt53codex.sh'
```

### ローカルで gpt-5.3-codex を使う（あと1ステップ）

- **OpenClaw:** `npm install -g openclaw@latest` で **2026.2.9** に更新済み。
- **設定:** `~/.openclaw/openclaw.json` の primary は **openai-codex/gpt-5.3-codex**、allowlist に **openai-codex/gpt-5.3-codex** を追加済み。
- **やること:** ローカルで **openai-codex の OAuth を1回だけ**実行する。

```bash
openclaw models auth login --provider openai-codex
```

- 表示された URL をブラウザで開く → 許可 → リダイレクト先の URL をターミナルに貼り付けて完了。
- その後、gateway を使う場合は **gateway を再起動**する（Slack 二重防止のため、通常はローカル gateway は止めたまま運用可）。

## Unknown model のトラブルシュート

- **Unknown model: anthropic/claude-opus-4.5**（ドット表記）が出る場合:
  - Anthropic API の正しいモデルIDは **ハイフン** `anthropic/claude-opus-4-5`。ドット `4.5` は無効。
  - **対処:** primary をエイリアス **opus45** に設定する（解決後は `anthropic/claude-opus-4-5` になる）。  
    `openclaw config set agents.defaults.model.primary opus45` のあと、**gateway を再起動**する。
  - Control UI やセッションで「Opus 4.5」を選ぶとドット表記が渡ることがあるため、**primary は必ず opus45（エイリアス）** にしておくこと。

- **Unknown model: openai-codex/gpt-5.3-codex** または **Unknown model: openai/gpt-5.3-codex** が出る場合:
  - **ローカル:** `openai/gpt-5.3-codex` は OAuth（openai-codex）なしだと **missing** のため使えない。primary が **openai-codex/gpt-5.3-codex** のときは **OAuth 未完了**だと Unknown になる。
  - **ローカルで gpt-5.3-codex を使う:** 上記「ローカルで gpt-5.3-codex を使う」のとおり `openclaw models auth login --provider openai-codex` を実行し、gateway を再起動する。
  - **ローカルで一旦解消するだけ:** primary を **openai/gpt-5.2-codex** に戻す。`openclaw config set agents.defaults.model.primary 'openai/gpt-5.2-codex'` のあと、**gateway を再起動**する。
- **VPS で openai-codex/gpt-5.3-codex を使う場合:** OAuth 完了後に `switch-to-gpt53codex.sh` を実行。未完了なら primary を `openai/gpt-4o` などに戻す。

## Runbook: VPSでopenai-codex OAuth→gpt-5.3-codexへ切替（コマンドSSOT）

目的:
- VPS上のAniccaが **`openai-codex/gpt-5.3-codex`** を使えるようにする（ChatGPT ProのCodex OAuth）。
- Slack二重返信を防ぐため、Slack接続Gatewayは **VPS 1台のみ**に固定する。

前提（事故防止）:
- OpenClawはデフォルトで `~/.openclaw/openclaw.json` を読む（VPSの `~` は `/home/anicca`）。
- OAuthは `http://127.0.0.1:1455/auth/callback` を捕捉しに行く。VPS/ヘッドレスの場合は **redirect URL を貼り付け**て完了できる。
- 複数Gateway/複数state-dirは、`OPENCLAW_CONFIG_PATH` と `OPENCLAW_STATE_DIR`、または `openclaw --profile <name>` / `openclaw --dev` で分離可能。今回の運用SSOTは **VPS default profile** とする。

### 0) ローカルがSlackに繋がっていないことを確認（毎回）
- [ ] ローカルでgatewayが動いていない
```bash
pgrep -fl openclaw-gateway || echo "OK: local gateway not running"
```
- [ ] launchdが無効化されている
```bash
launchctl list | rg -n 'ai\\.openclaw\\.gateway' && echo "NG: still registered" || echo "OK: not registered"
ls -la ~/Library/LaunchAgents | rg -n 'ai\\.openclaw\\.gateway\\.plist' && echo "NG: plist still in LaunchAgents" || echo "OK"
ls -la ~/Library/LaunchAgents.disabled | rg -n 'ai\\.openclaw\\.gateway\\.plist' || echo "NG: missing backup plist"
```

### 1) VPSの“現状”を記録（変更前スナップショット）
- [ ] SSH
```bash
ssh anicca@46.225.70.241
```
- [ ] Gateway状態 + 直近ログ
```bash
systemctl --user --no-pager status openclaw-gateway.service
journalctl --user -u openclaw-gateway.service -n 120 --no-pager
```
- [ ] 設定SSOT + モデル
```bash
ls -la ~/.openclaw/openclaw.json
python3 - <<'PY'
import json, os
p=os.path.expanduser("~/.openclaw/openclaw.json")
d=json.load(open(p))
print("primary =", d["agents"]["defaults"]["model"]["primary"])
print("allowlist keys =", list((d["agents"]["defaults"].get("models") or {}).keys()))
PY
```
- [ ] auth-profiles.json の有無（中身は貼らない）
```bash
ls -la ~/.openclaw/agents/anicca/agent/auth-profiles.json || echo "No auth-profiles.json yet"
```

### 2) OAuth前の止血（CLI暴走/OOM防止）
- [ ] gateway以外の `openclaw` CLIプロセスを殺す
```bash
pkill -9 -x openclaw || true
pkill -9 -x script || true
```
- [ ] リソース確認（余裕が無いならOAuth中はgatewayを止める）
```bash
uptime
free -m
ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 15
```

### 3) OAuth中はVPS gatewayを一時停止（推奨）
狙い: Slack常駐接続と同時にCLIを回すとOOMしやすい。OAuth中は止める。
- [ ] 停止
```bash
systemctl --user stop openclaw-gateway.service
```
- [ ] 確認
```bash
systemctl --user --no-pager status openclaw-gateway.service
ps aux | rg -n 'openclaw-gateway' || echo "OK: gateway stopped"
```

### 4) openai-codex OAuth（TTY必須）
- [ ] ローカル端末からTTY付きで実行
```bash
ssh -tt anicca@46.225.70.241 'openclaw models auth login --provider openai-codex'
```

期待フロー:
- 表示された `https://auth.openai.com/oauth/authorize?...` をローカルブラウザで開く
- ログイン/許可後、ブラウザが `http://127.0.0.1:1455/auth/callback?...` にリダイレクト
- VPS側のプロンプトに **redirect URLを丸ごと貼り付け**てEnter

失敗時（30秒以上無反応は止める）:
```bash
# Ctrl+C
pkill -9 -x openclaw || true
```

### 5) OAuth成功の機械検証（自己申告禁止）
- [ ] token sink ファイルができた
```bash
ls -la ~/.openclaw/agents/anicca/agent/auth-profiles.json
```
- [ ] `openai-codex` が入っているかだけ確認（中身は貼らない）
```bash
python3 - <<'PY'
import json, os
p=os.path.expanduser("~/.openclaw/agents/anicca/agent/auth-profiles.json")
d=json.load(open(p))
s=json.dumps(d)
print("has openai-codex =", ("openai-codex" in s))
PY
```

### 6) allowlist追加 + primary切替（VPS SSOT）
- **省略可:** クイック手順の `scripts/openclaw-vps/switch-to-gpt53codex.sh` を実行すれば 6〜7 を一括実行できる。
- [ ] 現状確認
```bash
openclaw config get agents.defaults.model.primary
openclaw config get agents.defaults.models
```
- [ ] allowlistに追加（aliasは任意。例: gpt53codex）
```bash
openclaw config set agents.defaults.models.\"openai-codex/gpt-5.3-codex\" '{\"alias\":\"gpt53codex\"}'
```
- [ ] primary切替
```bash
openclaw config set agents.defaults.model.primary 'openai-codex/gpt-5.3-codex'
```
- [ ] 確認
```bash
openclaw config get agents.defaults.model.primary
openclaw config get agents.defaults.models.\"openai-codex/gpt-5.3-codex\"
```

### 7) gateway再起動 + 証跡ログ確認
- [ ] 起動
```bash
systemctl --user start openclaw-gateway.service
```
- [ ] 起動ログ（最重要証跡）
```bash
journalctl --user -u openclaw-gateway.service -n 120 --no-pager | rg -n 'agent model:'
journalctl --user -u openclaw-gateway.service -n 120 --no-pager | rg -n 'socket mode connected'
```
期待:
- `agent model: openai-codex/gpt-5.3-codex`
- `socket mode connected`

### 8) Slack最終検証（人間が1回メンション）
- [ ] Slackで1回だけ確認メンション（例）
  - `@Anicca あなたのベースモデルと設定ファイルの完全パスを教えてください`
- [ ] 返信が1回だけ
- [ ] `openai-codex/gpt-5.3-codex` と `/home/anicca/.openclaw/openclaw.json` が一致

### 9) 完了ごとにこのファイルのチェックリストへ反映（必須）
- [ ] 進捗チェックリストの該当項目を `[x]` にする
- [ ] 証跡（journalctlの行、lsの存在確認など）を短く添える（トークン等は書かない）

=======
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
## モデルのSSOT（Slackで嘘を言わせない）

ルール:
- Aniccaは「使っているモデル」を**自己申告しない**（推測禁止）。
- モデル回答は `openclaw models status --agent anicca` と `~/.openclaw/openclaw.json` の参照結果のみを返す。
- 参照できない場合は `N/A + 理由` を返す（例: 権限、コマンド失敗、設定不整合）。

モデルIDの注意（重要）:
- Codex（ChatGPT OAuth）を使う場合、OpenClawドキュメントの例は `openai-codex/gpt-5.3-codex`。
- `openai/gpt-5.3-codex` は「別系統」で、環境によっては存在しても**VPS側のUnknown modelの原因**になり得るため、VPSでは使わない。

<<<<<<< HEAD
## ローカル運用 vs VPS運用（現在はVPS）

結論:
- **現在は VPS 運用**。Anicca（Slack）は VPS の gateway 1 台で稼働。ローカル gateway は停止済み（環境は Mac mini 復帰用に残している）。
=======
## ローカル運用 vs VPS運用（推奨はVPS）

結論:
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
- **VPS運用を推奨**（常時稼働、cron、ネットワークが安定、Slack接続の単一化が容易）。

VPSが良い理由:
- 05:00 JSTの定時投稿が「PCのスリープ/再起動/ネットワーク断」の影響を受けにくい
- Slack Socket Modeの常時接続に向く（接続が切れにくい）
- 監査ログ、cron runs、systemdログで「実行証跡」を取りやすい

ローカルが悪い理由:
- うっかりローカルgatewayがSlackに接続すると、**二重返信/二重投稿**を発生させる
- スリープで切断、ネットワーク切替で切断しやすく、安定運用に向かない

<<<<<<< HEAD
## 役割の整理：Control UI / CLI / Slack

「どこで何が動いているか」を混同しやすいので、3つの入口を整理する。

| 入口 | 正体 | 役割 | どこで動くか |
|------|------|------|--------------|
| **Control UI** | `http://127.0.0.1:18789/chat?session=...` | Gateway に接続する Web UI。会話・Config・Tools タブ・スキル管理・cron 確認など。 | **Gateway が動いているマシン**の localhost:18789。ローカルで gateway を動かせばローカルで開く。VPS で gateway を動かすと VPS の 18789 になる（ローカルから見るには SSH port forward が必要）。 |
| **CLI** | `openclaw` コマンド | 設定・モデル認証・cron 定義・`openclaw gateway` 起動など。読むのは**そのコマンドを実行したマシン**の `~/.openclaw/`。 | ローカルで叩けばローカル設定、VPS で叩けば VPS 設定。 |
| **Slack** | Slack の @Anicca メンション | **Gateway が 1 台だけ** Slack Socket Mode で接続して、メンションに返信する「チャネル」。 | Slack に繋いでいる Gateway が動いているマシン（本番なら VPS 1 台のみ）。 |

**まとめ:**  
- **Gateway** = 常駐プロセス（`openclaw-gateway`）。Slack 接続・cron 実行・Control UI の裏側。  
- **Control UI** = その Gateway の「操作画面」。  
- **CLI** = 同じマシンの `~/.openclaw/` を読んで設定したり gateway を起動したりする道具。  
- **Slack** = Gateway が接続している「出先」のひとつ。Gateway が 1 台なら、Slack に返信するのも 1 台だけ。

---

## VPS の Control UI（ダッシュボード）をローカルから開く

Gateway を VPS で動かしているとき、**同じダッシュボード（`http://127.0.0.1:18789/chat?session=agent:anicca:main`）をローカルのブラウザで見る**には、**SSH のポートフォワード**を使う。

### 手順（毎回やること）

1. **ローカルでターミナルを1つ開き、以下を実行してつなぎっぱなしにする**
   ```bash
   ssh -L 18789:127.0.0.1:18789 anicca@46.225.70.241
   ```
   - `-L 18789:127.0.0.1:18789` = 「ローカルの 18789 へのアクセスを、VPS の 127.0.0.1:18789 に転送する」という意味。
   - このターミナルは**閉じない**。閉じると port forward が切れてダッシュボードに繋がらなくなる。

2. **ブラウザで開く**
   - いつも通り: **http://127.0.0.1:18789/chat?session=agent%3Aanicca%3Amain**
   - ローカルは「自分の 18789」にアクセスしているが、SSH が VPS の gateway に転送するので、**VPS の Control UI** が表示される。

3. **使い終わったら**
   - SSH のターミナルで `exit` または Ctrl+D で切断すればよい。

### 認証（token が有効な場合）

VPS の `openclaw.json` で `gateway.auth.mode: "token"` になっている場合、Control UI を開いたときに **token を聞かれることがある**。そのときは、VPS の `~/.openclaw/openclaw.json` の `gateway.auth.token` の値を入力する（ローカルの openclaw と同じ token を VPS にコピーしてあるなら同じ値でよい）。

### まとめ

| やりたいこと | やること |
|--------------|----------|
| VPS のダッシュボードを GUI で見る | ローカルで `ssh -L 18789:127.0.0.1:18789 anicca@46.225.70.241` を実行したまま、ブラウザで http://127.0.0.1:18789/chat?session=agent%3Aanicca%3Amain を開く |
| つなぎっぱなしにしたい | 上記 SSH セッションをターミナルで維持するか、`autossh` などで永続化する（任意）。 |

CLI はエージェント（僕）がログや設定を確認するときに使い、**あなたはこの GUI で会話・Config・Tools・cron を把握する**、という役割分担で問題ない。

---

## ローカルで入れたスキル・設定を VPS でそのまま使う

**結論:** ローカルで追加したスキルやツールの allowlist は、**VPS の `~/.openclaw/` に同じ中身を用意すれば VPS でもそのまま使える**。OpenClaw は「そのマシンの `~/.openclaw/`」だけを読むので、VPS で動かすなら VPS 側に揃える必要がある。

### 同期するもの（VPS に揃えたいもの）

| 対象 | ローカル | VPS にやること |
|------|----------|----------------|
| **managed スキル** | `~/.openclaw/skills/`（例: slack-mention-handler） | このフォルダごと rsync またはコピー |
| **workspace スキル** | `~/.openclaw/workspace/skills/`（例: daily-metrics-reporter） | 同じく rsync / コピー。VPS の `workspace` が同じ構成になるようにする |
| **設定** | `~/.openclaw/openclaw.json` | VPS 用にコピーし、**`agents.defaults.workspace` と `agents.list[].workspace` を VPS のパス**（例: `/home/anicca/.openclaw/workspace`）に書き換える |
| **環境変数** | `~/.openclaw/.env` | 必要なキーを VPS の `~/.openclaw/.env` にコピー（API キー・REVENUECAT 等）。**中身は貼り付けない・コミットしない** |
| **cron 定義** | `~/.openclaw/cron/jobs.json` | ローカルと揃えたいならコピー |
| **OAuth 等** | `~/.openclaw/agents/anicca/agent/auth-profiles.json` | マシンごとなので VPS では VPS 用に OAuth をやり直す（openai-codex 等）。ファイルのコピーは認証の仕様次第で失敗することがある |

### 同期コマンド例（スキル＋cron のみ。設定・.env は手で調整）

```bash
# スキル（managed）
rsync -avz ~/.openclaw/skills/ anicca@46.225.70.241:~/.openclaw/skills/

# workspace 内スキル
ssh anicca@46.225.70.241 'mkdir -p ~/.openclaw/workspace/skills'
rsync -avz ~/.openclaw/workspace/skills/ anicca@46.225.70.241:~/.openclaw/workspace/skills/

# cron 定義（上書き注意）
# rsync -avz ~/.openclaw/cron/jobs.json anicca@46.225.70.241:~/.openclaw/cron/
```

**openclaw.json について:**  
- コピーする場合は、**workspace のパスを VPS 用に書き換える**（`/Users/cbns03/...` → `/home/anicca/.openclaw/workspace`）。  
- Slack のトークン等はすでに openclaw.json に入っているなら、そのまま VPS 用に持っていっても動く（本番は VPS 1 台だけが接続する前提）。

### VPS スキル状態（確認済み・2026-02-10）

| 種類 | スキル名 | 備考 |
|------|----------|------|
| managed | moltbook, slack-mention-handler | 両方 `skills.entries` に `enabled: true` で登録済み |
| workspace | content-research-writer, daily-metrics-reporter, gitclaw | 同上。計 5 つが Anicca から利用可能 |

- **同期:** ローカルの `~/.openclaw/skills/` と `~/.openclaw/workspace/skills/` を VPS に rsync 済み。ローカルには OpenClaw 用スキルがこの 2 フォルダにしかないため、**これ以上ローカルから持ってくる OpenClaw スキルはない**。`.claude/skills/` は Cursor/Claude 用で、OpenClaw とは別。
- **設定:** VPS の `openclaw.json` の `skills.entries` に上記 5 つを明示し、gateway 再起動済み。

---

## 現状確認（TODO を始める前にやること）

**目的:** TODO を実行する前に「いま何が動いていて、何が止まっているか」を把握する。実装はせず、**確認コマンドを実行して結果を記録する**だけ。

### ローカル（Mac）で確認すること

| 確認項目 | コマンド | 期待する状態（運用: VPS 稼働・ローカル停止） |
|----------|----------|--------------------------------------|
| gateway プロセスが動いているか | `pgrep -fl openclaw-gateway || echo "OK: プロセスなし"` | **プロセスなし**。ローカルは止めておく（動いていたら Slack 二重の原因になり得る）。 |
| launchd に gateway が登録されていないか | `launchctl list \| grep -i openclaw || echo "OK: 未登録"` | **未登録**。登録されていると Mac 起動時に gateway が立ち上がる可能性がある。 |
| LaunchAgents に plist が残っていないか | `ls ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null && echo "あり" \|\| echo "OK: なし"` | **なし**（または退避済み）。 |

**メモ欄（自分で埋める）:**  
- ローカル gateway: 動いている / 止まっている → ________  
- launchd: 登録あり / なし → ________  

### VPS で確認すること

| 確認項目 | コマンド | 意味 |
|----------|----------|------|
| gateway の稼働状態 | `ssh anicca@46.225.70.241 'systemctl --user --no-pager status openclaw-gateway.service'` | `Active: active (running)` なら起動中、`inactive (dead)` なら停止中。 |
| 直近の gateway ログ（モデル・Slack） | `ssh anicca@46.225.70.241 'journalctl --user -u openclaw-gateway.service -n 50 --no-pager'` | `agent model: ...` でどのモデルで動いているか、`socket mode connected` で Slack 接続有無を確認。 |
| 現在の primary モデル設定 | `ssh anicca@46.225.70.241 'openclaw config get agents.defaults.model.primary'` | いま VPS でどのモデルが default か。Opus 4.5 なら `opus45` または `anthropic/claude-opus-4-5`。 |

**メモ欄（自分で埋める）:**  
- VPS gateway: 起動中 / 停止中 → ________  
- VPS の primary モデル: ________  
- ログに socket mode connected: あり / なし → ________  

### 確認結果の解釈

- **運用方針: VPS 稼働・ローカル停止**。
- **VPS は起動中・ローカルは停止中** → 正しい本番状態。Slack に返信するのは VPS 1 台だけ。
- **VPS が停止中** → Slack に返信する Anicca はいない。VPS で `systemctl --user start openclaw-gateway.service` して起動する。
- **ローカルが動いていて VPS も動いている** → 二重返信の可能性あり。ローカル gateway を止める。

このセクションは**実装しない**。上記コマンドを実行し、結果をメモしてから次の「今からやるべきこと TODO」に進む。

### 現状確認メモ（実行日: 2026-02-10・運用はVPSに切り替え済み）

| 項目 | 結果 |
|------|------|
| **運用** | **VPS 稼働・ローカル停止**。Anicca（Slack）は VPS 1 台のみ。 |
| **ローカル gateway** | 停止済み（環境は Mac mini 復帰用に残す）。 |
| **VPS gateway** | 起動中が本番。停止中なら `systemctl --user start openclaw-gateway.service` で起動。 |
| **VPS の primary モデル** | Opus 4.5（opus45）推奨。必要なら `openclaw config set ...` で変更。 |

**解釈:** 本番は **VPS 1 台だけ** Slack に接続。ローカルは使わない（戻す可能性があるので設定は残している）。

---

## 今からやるべきこと TODO（VPS 本番化＋Opus 4.5 デフォルト＋ローカルスキルを効かせる）

**前提:** VPS のデフォルトモデルは **Opus 4.5（opus45 / anthropic/claude-opus-4-5）** とする。Codex は使わない。現状確認は済んでいる前提。

---

### 誰がやるか・指示（Anicca 用 / Cursor エージェント用）

この TODO の**実行者**は次のどちらか。ユーザー（人間）は実行しない。

| 実行者 | 説明 |
|--------|------|
| **Anicca（Slack / VPS）** | このドキュメントの手順とパスに従って実行する。権限や環境でできないことがあれば、Slack でユーザーに「〇〇ができない／〇〇をやってほしい」と報告・依頼してよい。 |
| **Cursor のエージェント** | このチャットで応答している AI。同じ手順をローカル／VPS 向けに実行する。必要ならユーザーに確認を取る。 |

- **困ったとき:** Anicca はユーザーに報告する。Cursor で進めている場合は、Cursor のエージェントがユーザーに確認を求めるか、Anicca に任せる旨を伝える。

- **ローカル Mac 上の作業:** スキル一覧の確認、gateway の起動/停止、rsync の送り元での実行など、**ローカルで必要な確認・コマンド実行は Cursor のエージェントが担当する**。VPS の Anicca はローカルに直接アクセスできない。

どちらの実行者でも同じ結果になるように、以下に **ローカル用のパス** と **VPS 用のパス** をそれぞれ示す。

---

### パス一覧（参照用）

| 用途 | ローカル（Mac） | VPS |
|------|-----------------|-----|
| **OpenClaw ルート** | `/Users/cbns03/.openclaw` | `/home/anicca/.openclaw` |
| 設定ファイル | `/Users/cbns03/.openclaw/openclaw.json` | `/home/anicca/.openclaw/openclaw.json` |
| 環境変数 | `/Users/cbns03/.openclaw/.env` | `/home/anicca/.openclaw/.env` |
| managed スキル | `/Users/cbns03/.openclaw/skills/` | `/home/anicca/.openclaw/skills/` |
| workspace スキル | `/Users/cbns03/.openclaw/workspace/skills/` | `/home/anicca/.openclaw/workspace/skills/` |
| workspace ルート | `/Users/cbns03/.openclaw/workspace` | `/home/anicca/.openclaw/workspace` |
| cron 定義 | `/Users/cbns03/.openclaw/cron/jobs.json` | `/home/anicca/.openclaw/cron/jobs.json` |
| launchd plist（ローカルのみ） | `/Users/cbns03/Library/LaunchAgents/ai.openclaw.gateway.plist` | （なし） |

---

### TODO リスト（1 から 7・パス付き）

やる順で揃えたチェックリスト。上から順に行う。

| # | やること | 関係するパス（ローカル / VPS） | 補足 |
|---|----------|--------------------------------|------|
| 1 | **ローカルで gateway が動いていないことを確認（必要なら止める）** | **ローカル:** プロセス確認はローカル Mac。plist は `/Users/cbns03/Library/LaunchAgents/ai.openclaw.gateway.plist` | ローカルで `pgrep -fl openclaw-gateway \|\| echo OK`。動いていたら止める。launchd に登録されていれば無効化・plist を LaunchAgents 外へ退避。 |
| 2 | **VPS にローカルで入れたスキル・cron・設定を同期** | **ローカル:** `/Users/cbns03/.openclaw/skills/`, `workspace/skills/`, `openclaw.json`, `.env`, `cron/jobs.json` → **VPS:** `/home/anicca/.openclaw/` の同階層 | 「同期するもの」の表と rsync 例のとおり。openclaw.json をコピーする場合は workspace パスを **`/home/anicca/.openclaw/workspace`** に書き換える。.env は手で VPS に必要なキーを入れる。 |
| 3 | **VPS の primary を Opus 4.5（opus45）に統一** | **VPS:** `/home/anicca/.openclaw/openclaw.json`, `/home/anicca/.openclaw/.env` | VPS で `openclaw config set agents.defaults.model.primary opus45`。allowlist に opus45 が無ければ openclaw.json に追加。Anthropic 認証を VPS の .env または `openclaw models auth paste-token --provider anthropic` で済ませる。 |
| 4 | **VPS で gateway を起動（停止中なら）** | **VPS:** systemd ユーザーサービス。作業ディレクトリは `/home/anicca/.openclaw/` | `ssh anicca@46.225.70.241 'systemctl --user start openclaw-gateway.service'` |
| 5 | **VPS のログで Slack 接続・モデルを確認** | **VPS:** journalctl のログ。設定は `/home/anicca/.openclaw/openclaw.json` | `ssh anicca@46.225.70.241 'journalctl --user -u openclaw-gateway.service -n 80 --no-pager'` で `agent model: anthropic/claude-opus-4-5`（または opus45）と `socket mode connected` を確認。 |
| 6 | **Slack で 1 メンション = 1 返信を確認** | **VPS:** 返信時の設定パス表示が `/home/anicca/.openclaw/...` になっていること | 二重返信がなくなっていること。Slack の返信内容に出る設定パスが VPS のパスであること。 |
| 7 | **Control UI をローカルから使う** | **ローカル:** ブラウザ `http://127.0.0.1:18789/...`。**VPS:** gateway は `127.0.0.1:18789` で待ち受け | ローカルで `ssh -L 18789:127.0.0.1:18789 anicca@46.225.70.241` を実行したまま、ブラウザで `http://127.0.0.1:18789/chat?session=agent%3Aanicca%3Amain` を開く。VPS のダッシュボードが表示される。 |

以上が完了すれば、「Slack は VPS 1 台だけ」「VPS のデフォルトは Opus 4.5」「ローカルで入れたスキルは VPS で使える」「24x7 は VPS の gateway＋cron で運用」という状態になる。

---

=======
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
## 参照

- 実装TODO: `../ios/1.6.2/implementation/TODO-NEXT-2026-02-09.md`
- デプロイTODO: `../ios/1.6.2/deployment-todo.md`

<<<<<<< HEAD
---

## VPS で今すぐ使えるスキル一覧（2026-02-10 更新）

### API キー不要 + CLI インストール済み = 🟢

| スキル | 用途 |
|--------|------|
| weather | 天気取得 |
| github | Git操作、PR、Issue |
| tmux | ターミナル制御 |
| session-logs | 過去ログ検索 |
| skill-creator | 新スキル作成 |
| healthcheck | セキュリティ診断 |
| slack | メッセージ送信・リアクション |
| coding-agent | Codex / Claude Code 操作 |
| clawhub | スキル検索・インストール |
| canvas | UI 制御 |
| discord | Discord 操作 |

### API キー設定済み = 🟢

| スキル | API キー |
|--------|---------|
| nano-banana-pro | GEMINI_API_KEY ✅ |
| openai-whisper-api | OPENAI_API_KEY ✅ |
| openai-image-gen | OPENAI_API_KEY ✅ |

### VPS にインストール済み CLI

- Codex CLI: `/usr/bin/codex` (v0.98.0)
- Claude Code: `~/.local/bin/claude` (v2.1.37)
- uv: `~/.local/bin/uv` (v0.10.0)
- gh: `/usr/bin/gh`

---

## anicca.ai リポジトリ（VPS クローン）

```
/home/anicca/.openclaw/workspace/anicca.ai/
├── aniccaios/          # iOS アプリ本体
├── .claude/            # Claude Code 設定
├── .codex/             # Codex 設定
├── .cursor/            # Cursor 設定（このファイル含む）
├── docs/
├── scripts/
├── openclaw-skills/
└── ...
```

- ブランチ: `dev`
- Git 同期: `git pull` / `git push` で Mac と同期可能

---

## Tailscale（検討中）

**目的:** VPS から Mac のローカルファイルに直接アクセスする

**現状:** 未設定

**設定手順（予定）:**
1. VPS に Tailscale インストール: `curl -fsSL https://tailscale.com/install.sh | sh && tailscale up --ssh`
2. Mac に Tailscale インストール: https://tailscale.com/download
3. 同じ Tailscale アカウントでログイン
4. VPS から Mac に SSH: `tailscale ssh <mac-name>`

**メリット:**
- Mac が起動中なら VPS からローカルファイルに直接アクセス可能
- Git 同期不要でリアルタイム編集
- セキュア（公開ポート不要）

=======
## Moltbook投稿（env SSOT）

`moltbook-poster` が外部投稿するために必要:
- `MOLTBOOK_BASE_URL`（例: `https://<instance>`）
- `MOLTBOOK_ACCESS_TOKEN`（Mastodon互換のアクセストークン）

運用検証（外部投稿無し）:
- `MOLTBOOK_DRY_RUN=true` で dry-run（監査ログのみ）
>>>>>>> origin/codex/1.6.2-ssot-skills-crons
