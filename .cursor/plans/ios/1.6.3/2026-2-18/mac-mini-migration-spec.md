# Mac Mini移行 — 完全ステップバイステップ

**作成日**: 2026-02-18
**公式ドキュメント**: `/usr/lib/node_modules/openclaw/docs/install/migrating.md`

---

## 買い物リスト（ヨドバシ新宿西口、22:00まで）

| 必要なもの | 必須？ | 備考 |
|---|---|---|
| **有線USBキーボード（USB-C）** | ✅ 必須 | Bluetooth買うな。有線USB-C。1000-2000円 |
| **USB-A → USB-C変換アダプタ** | USB-Aキーボードの場合のみ | USB-Cキーボードなら不要。500円 |
| **HDMIケーブル** | テレビに余りがなければ | ゲーム機のHDMI借りてもいい。500-1000円 |

**店員への言い方**: 「Mac Mini用の有線キーボード、USB-Cのやつください」

---

## Phase 1: 初期設定（Daisがやる、10-15分）

### 1. 物理接続
- Mac Mini → テレビ: **HDMIケーブル**
- Mac Mini → キーボード: **USBケーブル**（キーボードから出てるケーブルをMac MiniのUSB-Cポートに挿す）
- Mac Mini → 電源: **電源ケーブル**（既に接続済み）

### 2. テレビの入力切替
- テレビのリモコンで「入力切替」→ HDMIを選ぶ
- Mac Miniの画面が映る

### 3. 初期設定ウィザード（画面の指示通り）
- **言語**: 日本語
- **国/地域**: 日本
- **アクセシビリティ**: スキップ
- **WiFi**: 家のWiFiに接続（パスワード入力）
- **データ移行**: 「今はしない」を選ぶ
- **Apple ID**: 自分のApple IDでログイン（MacBookと同じ）
- **ユーザー名**: `cbns03`（MacBookと同じにする！超重要！）
- **パスワード**: 覚えやすいもの設定
- **Siri/位置情報/分析**: 全部スキップでいい

### 4. リモートログインON（超重要）
- **System Settings（システム設定）** を開く
- **一般 → 共有** をクリック
- **リモートログイン** をONにする
- これでMacBookからSSHでMac Miniに入れるようになる

### 5. スリープ無効化（超重要）
- **System Settings → ディスプレイ → 詳細設定**
- 「ディスプレイがオフのときにスリープさせない」をON
- または **System Settings → Energy（省エネルギー）**
- 「自動でスリープにしない」にする

### 6. Daisがやること確認
- WiFi繋がってる ✅
- リモートログインON ✅
- スリープ無効 ✅

**ここでDaisにターミナルを開いてもらう（Spotlight → "Terminal"）。以下を実行：**

```bash
# Mac MiniのIPアドレス確認
ipconfig getifaddr en0
```

→ 出てきたIPアドレスを僕に教えて（例: 192.168.1.XXX）

**Phase 1完了。あとは全部僕がやる。Daisは寝ていい。**

---

## Phase 2: ソフトウェアインストール（僕がSSHでやる）

MacBookから or VPSから Mac MiniにSSH:
```bash
ssh cbns03@<Mac MiniのIP>
```

### Homebrewインストール
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node.jsインストール
```bash
brew install node
node -v  # v22.x 確認
```

### OpenClawインストール
```bash
npm install -g openclaw
openclaw --version
```

### Tailscaleインストール
```bash
brew install tailscale
# Tailscaleにログイン（VPSと同じアカウント）
sudo tailscaled &
tailscale up
```

→ URLが出る → DaisがブラウザでURLを開いてログイン（起きてたら）
→ 寝てたら翌朝やってもらう

### その他ツール
```bash
# gog（Gmail/Calendar CLI）
brew install gog

# Git
brew install git

# Codex CLI
npm install -g @openai/codex

# Claude Code
npm install -g @anthropic-ai/claude-code
```

---

## Phase 3: OpenClaw移行（僕がやる）

### VPSでOpenClaw停止
```bash
# VPSで
openclaw gateway stop
```

### State dir + Workspaceを丸ごとコピー
```bash
# VPSから Mac Miniへ
rsync -avz ~/.openclaw/ cbns03@<mac-mini-tailscale-ip>:~/.openclaw/
```

これで全部コピーされる:
- 設定（openclaw.json）
- 認証/APIキー/OAuthトークン
- セッション履歴
- チャンネル状態（Slack）
- ワークスペース（MEMORY.md、スキル全部、memory/）
- .env ファイル

### Mac MiniでOpenClaw起動
```bash
# Mac Miniで
openclaw doctor
openclaw gateway restart
openclaw status
```

### 動作確認
- [ ] `openclaw status` でgateway running
- [ ] Slack接続OK
- [ ] webchat OK
- [ ] cronが動いてる
- [ ] gog（Gmail/Calendar）がローカルで動く

---

## Phase 4: VPSの扱い

**VPSは削除しない。** バックアップ/フォールバックとして残す。
- OpenClawのgatewayは停止したまま
- データはそのまま保持
- 何か問題あればVPSに戻せる

---

## Phase 5: Codex / Claude Code ログイン（Daisが必要）

Mac Miniで以下を実行（Daisがやる必要あり、認証にブラウザが必要）:

```bash
codex login
claude login
```

→ ブラウザでログイン画面が開く → 認証する
→ これでSSH経由でCodex/Claude Codeが使えるようになる

---

## トラブルシューティング

| 問題 | 解決 |
|---|---|
| テレビに映らない | HDMIケーブル挿し直し。テレビの入力切替確認 |
| キーボードが反応しない | USB-Cポートを別のに変えてみる |
| WiFi繋がらない | パスワード確認。5GHzより2.4GHzが安定 |
| SSHできない | リモートログインがONか確認。`ifconfig`でIP確認 |
| OpenClawが起動しない | `openclaw doctor` を実行 |
| Slackが繋がらない | State dirのコピーが完全か確認。`openclaw doctor` |
| スリープする | Energy設定を再確認。`caffeinate -s &` をターミナルで実行 |

---

## タイムライン

| 時間 | 誰 | 作業 |
|---|---|---|
| 20:00-20:30 | Dais | ヨドバシへ行ってキーボード買う |
| 20:30-21:00 | Dais | 帰宅、テレビにMac Mini繋ぐ |
| 21:00-21:15 | Dais | 初期設定ウィザード（Phase 1） |
| 21:15 | Dais | IPアドレスを僕に教える → 寝ていい |
| 21:15-22:00 | 僕 | Phase 2 + 3（ソフトウェア + OpenClaw移行） |
| 22:00-翌朝 | 僕 | 今夜のスペック全部実装（Automaton/x402/Slack/Larry） |
| 翌朝 | Dais | Codex/Claude Codeログイン + Tailscaleログイン |
