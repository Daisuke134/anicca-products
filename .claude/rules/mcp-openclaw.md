# MCP & OpenClaw 運用ルール

## MCP プロジェクトID

| サービス | ID | 用途 |
|---------|---|------|
| **Mixpanel** | `3970220` (integer) | 分析クエリ |
| **RevenueCat** | `projbb7b9d1b` (string) | 課金・Offering管理 |

## Mixpanel MCP

```
# イベント一覧取得
user-mixpanel-get_events: {"project_id": 3970220}

# セグメンテーションクエリ（イベント数取得）
user-mixpanel-run_segmentation_query: {
  "project_id": 3970220,
  "event": "rc_trial_started_event",
  "from_date": "2026-01-04",
  "to_date": "2026-02-04",
  "unit": "month"
}

# ファネルクエリ
user-mixpanel-run_funnels_query: {"project_id": 3970220, ...}
```

## RevenueCat（API v2 curl — MCP不使用）

新規アプリの RC セットアップは MCP ではなく API v2 curl で行う。
レシピ全文: `.claude/skills/mobileapp-builder/references/us-005-infra.md` の Step 7 を参照。

認証: `Authorization: Bearer <SK Key v2>`（WAITING_FOR_HUMAN で Slack から受信）

| 操作 | エンドポイント |
|------|--------------|
| Project ID 取得 | `GET /v2/projects` |
| App 作成 | `POST /v2/projects/{pid}/apps` |
| Offering 作成 | `POST /v2/projects/{pid}/offerings` |
| Package 作成 | `POST /v2/projects/{pid}/offerings/{oid}/packages` |
| Product 作成 | `POST /v2/projects/{pid}/products` |
| Product→Package 紐付け | `POST /v2/projects/{pid}/packages/{pkgid}/actions/attach_products` |
| Entitlement 作成 | `POST /v2/projects/{pid}/entitlements` |
| Product→Entitlement 紐付け | `POST /v2/projects/{pid}/entitlements/{eid}/actions/attach_products` |

Anicca 本体の既存プロジェクト (`projbb7b9d1b`) への操作（A/Bテスト等）は引き続き RC MCP を使用可能。

## 正しいデータソース

| 目的 | 使うイベント | ソース |
|-----|------------|-------|
| トライアル開始数 | `rc_trial_started_event` | RevenueCat→Mixpanel（正確） |
| Paywall表示数 | `onboarding_paywall_viewed` | iOS SDK |

**注意:** `onboarding_paywall_purchased`は使わない（DEBUG/サンドボックス含む）

## Slack Tokens（OpenClaw/Anicca用）

**シークレットは `.env` ファイルに保存済み（gitignored）:**
- `SLACK_BOT_TOKEN` - Anicca Bot Token
- `SLACK_APP_TOKEN` - Socket Mode Token

## OpenClaw（Anicca）— Mac Mini 稼働中

**現状（2026-02-23 更新）:**
- Gateway: Mac Mini (anicca-mac-mini-1) で24時間稼働中
- Profile: **full**（全ツール有効: fs, exec, memory, slack, cron, web_search, browser等）
- エージェント: Claude (Anthropic)
- Slack: 全チャンネル許可（groupPolicy: open）

**VPS (46.225.70.241) は使わない。2026-02-18 に Mac Mini に移行完了済み。**

| 項目 | 値 |
|------|-----|
| **Mac Mini** | anicca-mac-mini-1（Tailscale: `100.99.82.95`） |
| **MacBook SSH** | `ssh cbns03@100.108.140.123` |
| Config | `/Users/anicca/.openclaw/openclaw.json` |
| Skills | OpenClaw インストール先の `skills/` |
| Cron | `/Users/anicca/.openclaw/cron/jobs.json` |

**Anicca への指示方法（2種類）:**

| 方法 | コマンド | 用途 |
|------|---------|------|
| **エージェントターン** | `openclaw agent --message "..." --deliver` | Aniccaの脳を通す（思考→行動） |
| **直接投稿** | `openclaw message send --channel slack --target "C091G3PKHL2" --message "..."` | Slack直接投稿（脳を通さない） |

**Gateway 再起動（設定変更後のみ必要）:**
```bash
# Mac Mini 上で
openclaw gateway restart
```

**重要ルール:**
- **Gateway再起動は `openclaw.json` や `.env` 変更時のみ**
- **MCP ツール（`mcp__*`）は OpenClaw では使えない**（Claude Code専用）
- **Slack投稿は `slack` ツール（profile:full で有効）または `exec` + CLI**

**参照:**
- **Spec:** `.cursor/plans/ios/1.6.1/openclaw/anicca-openclaw-spec.md`
- **学び:** `.cursor/plans/reference/openclaw-learnings.md`
