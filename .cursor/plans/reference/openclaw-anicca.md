# OpenClaw Anicca 運用ステータス（SSOT）

最終更新: 2026-02-10

## 現状（2026-02-10）

| 項目 | 状態 |
|------|------|
| **Slack / 会話** | **ローカル**の OpenClaw（gateway）で運用中。モデルは openai-codex/gpt-5.3-codex。 |
| **VPS gateway** | **停止済み**（二重防止のため）。再開するまで Slack に返信するのはローカル1台だけ。 |
| **VPS の cron** | ジョブ定義は VPS に残っているが、gateway が止まっているため Slack 投稿はローカル経由。 |

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

---

## VPS gateway は一旦停止（二重防止）

**運用方針:** Slack に繋ぐ OpenClaw gateway は **1台だけ**にする。紛らわしいので **VPS 側の gateway は停止しておく**。

**VPS で gateway を止めるとき（ローカルから叩く）:**
```bash
ssh anicca@46.225.70.241 'systemctl --user stop openclaw-gateway.service'
```

**再開したいとき:** `systemctl --user start openclaw-gateway.service` を VPS で実行。

---

このファイルの目的:
- 「今なにが動いていて、なにが“コードだけ”で、なにが未着手か」を誤解なく示す
- 1.6.2 の Done/Not Done をブレさせない（E2E/運用接続が無いものは未完）

## 稼働状況

- `ops-heartbeat`: 稼働中
- `detect_suffering`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/suffering-detector`）
- `app-nudge-sender`: 稼働中（VPS OpenClaw cron → `/api/admin/jobs/app-nudge-sender`）
- `moltbook-monitor`: 稼働中（shadow mode, VPS OpenClaw cron → `/api/admin/jobs/moltbook-shadow-monitor`）
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
- Moltbook: opt-in無しは禁止。返信は `hook+content` 合計 400文字上限に自動トリム
- 投稿安定化（B2）:
  - X: 260文字上限、429/5xxのみ 3回 retry（60/300/1800s）、クレジット枯渇は ops event + Slack（24h重複抑止）
  - TikTok: 2000文字上限、429/5xxのみ 3回 retry（60/300/1800s）、非retryは DLQ + ops event
- 学習（C2）:
  - Structured Memory / Initiative / Reaction Matrix / Research / Memory cleanup / Autonomy check の実装と単体テストは完了
- App Nudge（A2/A3）:
  - `suffering-detector -> app-nudge-sender -> /api/mobile/nudge/pending -> (iOS) pull+ack -> ローカル通知` の閉ループが本番API + Simulatorで通過済み

### まだ保証できない挙動（運用接続/E2E未完）
- Moltbook監視→検出→返信（本番固定化） ※ 1.6.2 は shadow mode 固定（生成+監査ログのみ、送信はしない）

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
