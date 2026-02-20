# Mac Mini移行 — 進捗ステータス

**最終更新**: 2026-02-21 JST

---

## Phase 1: Daisがやる ✅ 完了
- [x] Mac Mini初期設定（アカウント: anicca / Dukkha2026!）
- [x] WiFi接続: xg100n-16fdcd-3
- [x] リモートログインON
- [x] スリープ無効
- [x] Homebrewインストール

## Phase 2: 移行作業 ✅ ほぼ完了

### CLI (11/11) ✅
- [x] node, npm, bun, openclaw, gh, firecrawl, tailscale, gog, git, python3, brew

### State Dir転送 ✅
- [x] openclaw.json, .env, cron/jobs.json, skills/, workspace/, agents/, memory/*.sqlite, devices/, identity/

### 外部設定 ✅
- [x] moltbook credentials, gog client secret, gh config

### 動作確認済み ✅
- [x] Slack → trend-hunterがcronで自動送信成功
- [x] cron → 35ジョブ全部Miniで動作
- [x] x-research, moltbook, app-metrics(RC), app-reviews(os修正), larry, Playwright, firecrawl

### VPS ✅
- [x] VPS Gateway停止・disabled完了（いつでも戻れる）

---

## 残タスク（優先順）

| # | タスク | 担当 | 方法 | 状態 |
|---|--------|------|------|------|
| A | **Gateway自動起動登録** | **Daisがミニのターミナルで** | Miniを開いてTerminalから `openclaw gateway install` | ❌ 未完了 |
| B | Slack/Telegram `/home/anicca` バグ | 調査中 | OpenClawバグ。bible読んだが回避策なし。Discordに報告必要 | 🚨 ブロッカー |
| C | TOOLS.md / IDENTITY.md更新 | AniccaにTUIで頼む | 移行完了を伝えてMiniの情報に更新させる | ❌ 未完了 |
| D | cron自動実行の最終確認 | 待つだけ | 次のcron実行時にSlack来るか確認（Bが解決後） | ⏳ 待機中 |
| E | Telegramテスト | Bが解決後 | Bのバグが直れば自動的に解決 | ⏳ Bに依存 |

---

## 🚨 `/home/anicca` バグ詳細

**症状**: Slack/Telegram送信時に `ENOENT: no such file or directory, mkdir '/home/anicca'` でクラッシュ

**原因**: OpenClawのmessage toolがmacOSで `/home/<user>` をハードコード。macOSは `/Users/<user>` なのに。

**試した修正（全部NG）**:

| 方法 | 結果 |
|------|------|
| `sudo ln -s /Users/anicca /home/anicca` | Operation not supported（SIP保護） |
| `/etc/synthetic.conf` | macOSのautomountで上書きできない |
| plistに `HOME=/Users/anicca` | 既に設定済みだが効果なし |

**結論**: OpenClawのバグ。ユーザー側では直せない。**OpenClaw Discordに報告必要。**

---

## タスクA：Gateway自動起動（Daisが実行）

**SSHからはできない（macOSのGUIセッション制限）。Miniのキーボードで直接：**

```bash
# MiniのTerminalを開く（Spotlight: Cmd+Space → Terminal）
/opt/homebrew/bin/openclaw gateway install
```

---

## 構成図

```
ダイス（どこでも）
    ↓
MacBook Pro（手元）
    ↓ openclaw tui
Mac Mini（家）← Aniccaが動いてる（35 cronジョブ稼働）
```

| 機能 | 場所 |
|------|------|
| gog | Mac Mini上で実行 |
| Playwright | Mac Mini上で実行 |
| cron（35ジョブ） | Mac Mini上で実行 |
| Slack/Telegram | ❌ `/home/anicca`バグで現在送信不可 |

**ProからMiniに繋ぐ:** `openclaw tui`
**VPSに戻りたい時:** `openclaw tui --url ws://46.225.70.241:18789`

---

## 接続情報

| 項目 | 値 |
|------|-----|
| Tailscale IP | 100.99.82.95 |
| Tailscaleホスト名 | aniccanomac-mini-1 |
| ローカルIP | 192.168.1.12 |
| macOS | 15.6 (arm64, T8132) |
| アカウント | anicca / Dukkha2026! |
| Gateway token | efdd345a619e1e54f41f615325754511a165091790dba919 |
