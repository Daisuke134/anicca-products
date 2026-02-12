# OpenClaw Node + Tailscale セットアップ（Mac を VPS の Node として登録）

**最終更新**: 2026-02-11

---

## 現状

| 項目 | 状態 |
|------|------|
| **Mac Node ペアリング** | ✅ 済み（VPS に `mac` として登録済み） |
| **Node 接続** | disconnected（node run を起動すると connected になる） |
| **Tailscale** | VPS ↔ Mac 同一 tailnet ✅ |
| **Gateway** | VPS (loopback)、Tailscale Serve は off |

---

## Tailscale IP（同一 tailnet）

| ホスト | Tailscale IP | 備考 |
|--------|--------------|------|
| **VPS** | 100.73.121.4 | Anicca Gateway 稼働 |
| **Mac** | 100.108.140.123 | Node として登録可能 |

**接続確認:**
```bash
# Mac から VPS へ
ping 100.73.121.4

# VPS から Mac へ
ssh anicca@46.225.70.241 'ping -c 1 100.108.140.123'
```

---

## Mac を Node として接続する（2 ターミナル）

**前提:** VPS Gateway は loopback バインドのため、SSH トンネル経由で接続する。

### Terminal 1: SSH トンネル（常時維持）

```bash
ssh -N -L 18790:127.0.0.1:18789 anicca@100.73.121.4
# または（Tailscale が繋がらない場合）
ssh -N -L 18790:127.0.0.1:18789 anicca@46.225.70.241
```

### Terminal 2: Node 起動

```bash
# gateway token を取得して node を起動
TOKEN=$(ssh anicca@46.225.70.241 "python3 -c \"
import json, os
d = json.load(open(os.path.expanduser('~/.openclaw/openclaw.json')))
print(d.get('gateway', {}).get('auth', {}).get('token', ''))
\"")
export OPENCLAW_GATEWAY_TOKEN="$TOKEN"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "mac"
```

接続後、VPS で `openclaw nodes list` を実行すると `mac` が **connected** になる。

---

## ワンライナー（トンネル起動済み前提）

```bash
OPENCLAW_GATEWAY_TOKEN=$(ssh anicca@46.225.70.241 "python3 -c \"import json,os;d=json.load(open(os.path.expanduser('~/.openclaw/openclaw.json')));print(d.get('gateway',{}).get('auth',{}).get('token',''))\"") openclaw node run --host 127.0.0.1 --port 18790 --display-name "mac"
```

---

## VPS での確認コマンド

```bash
# ペアリング済み Node 一覧
ssh anicca@46.225.70.241 'openclaw nodes list'

# pending があれば approve
ssh anicca@46.225.70.241 'openclaw nodes pending'
ssh anicca@46.225.70.241 'openclaw nodes approve <requestId>'
```

---

## Node として使える機能（接続中のみ）

| ツール | 説明 |
|--------|------|
| `nodes run` | Mac でコマンド実行（`codex exec` 等） |
| `nodes camera snap` | Mac のカメラで撮影 |
| `nodes screen record` | Mac の画面録画 |
| `nodes canvas *` | Canvas 制御 |
| `nodes notify` | Mac に通知 |

---

## 起動スクリプト

`scripts/openclaw-vps/start-mac-node.sh` を参照。

---

## system.run / exec 設定（2026-02-11）

| 項目 | 内容 |
|------|------|
| **VPS tools.exec** | `host=node`, `node=mac` に設定済み（Gateway 再起動で反映） |
| **Mac exec-approvals** | `~/.openclaw/exec-approvals.json` に `.*` パターンあり（全コマンド許可） |
| **codex パス** | `/opt/homebrew/bin/codex` |
| **重要** | Mac Node が **接続されていないと** exec は失敗する。事前に Node を起動すること |
