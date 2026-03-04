# OpenClaw 認証トークン移行手順（2026-03-04 確定）

## 問題

新しい Claude Code サブスクリプションに切り替えた後、OpenClaw TUI で `HTTP 429 rate_limit_error` が出続ける。

## 根本原因

**OpenClaw は エージェントごとに別の `auth-profiles.json` を持つ。**

| パス | 用途 |
|------|------|
| `~/.openclaw/agents/main/agent/auth-profiles.json` | `main` エージェント用 |
| `~/.openclaw/agents/anicca/agent/auth-profiles.json` | `anicca` エージェント用（**こっちが実際に使われる**） |

`openclaw models auth setup-token` や `paste-token` は `main` の方しか更新しない。`anicca` エージェント（実際に使うデフォルトエージェント）の auth-profiles は**手動で更新が必要**。

## 正しい移行手順

### Step 1: MacBook で setup-token を生成

```bash
claude setup-token
```

1年間有効な OAuth トークン（`sk-ant-oat01-...`）が出力される。

### Step 2: Mac Mini の OpenClaw に設定

```bash
ssh -t anicca@100.99.82.95 "openclaw models auth setup-token --provider anthropic"
```

プロンプトで Step 1 のトークンを貼り付ける。

### Step 3: 全エージェントの auth-profiles を更新（CRITICAL）

**Step 2 だけでは不十分。** 以下の全ファイルを同じトークンに更新する:

```bash
# 対象ファイル一覧
~/.openclaw/agents/main/agent/auth-profiles.json
~/.openclaw/agents/anicca/agent/auth-profiles.json
# 他にエージェントがあれば、そのディレクトリも
```

古いプロファイル（`anthropic:old`, `anthropic:manual`）は削除し、`anthropic:default` に新トークンを統一する。

```json
{
  "version": 1,
  "profiles": {
    "anthropic:default": {
      "type": "token",
      "provider": "anthropic",
      "token": "sk-ant-oat01-NEW_TOKEN_HERE"
    }
  },
  "lastGood": { "anthropic": "anthropic:default" },
  "usageStats": {}
}
```

### Step 4: openclaw.json から古いプロファイル参照を削除

`~/.openclaw/openclaw.json` の `auth.profiles` セクションも `anthropic:default` だけにする。

### Step 5: Gateway 再起動 + secrets reload

```bash
openclaw gateway restart
openclaw secrets reload
```

### Step 6: 動作確認

```bash
# 直接 API テスト（トークンが有効か）
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: NEW_TOKEN" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# OpenClaw 経由テスト
openclaw agent --agent anicca --session-id "test-$(date +%s)" --message "say hello"
```

## 一般化された原則

| 原則 | 詳細 |
|------|------|
| **設定は全箇所を更新する** | ツールが「設定しました」と言っても、実際に使われるファイルが別の場所にある可能性がある |
| **直接テストで切り分ける** | curl で直接 API を叩いてトークンが有効か確認 → 有効なら問題はツール側の設定 |
| **エージェントごとに auth が分離** | OpenClaw は `agents/{id}/agent/auth-profiles.json` でエージェント単位で認証を管理 |
| **ログで実行パスを確認** | `agent/embedded` = 内蔵モード。どのエージェント設定が使われるか確認必須 |

## 参照ドキュメント

- [OpenClaw Anthropic Provider](https://docs.openclaw.ai/providers/anthropic) — Option B: Claude setup-token
- [OpenClaw CLI models](https://docs.openclaw.ai/cli/models) — auth profiles 管理
- [OpenClaw Gateway Troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting) — 429 対処
