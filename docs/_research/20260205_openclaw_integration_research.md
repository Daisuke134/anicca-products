# OpenClaw + Anicca統合 技術調査レポート

**調査日時**: 2026年2月5日
**調査対象**: RevenueCat/Mixpanel APIがOpenClaw経由で動作しない問題の根本原因と解決策

---

## 調査結果サマリー

| 問題領域 | 根本原因 | 優先度 |
|---------|---------|--------|
| 環境変数スコープ | LaunchAgent環境変数が子プロセスに継承されない | 🔴 高 |
| OpenClawスキル実行 | スキルは独立プロセスで実行、環境変数アクセス方法が不明 | 🔴 高 |
| RevenueCat API | v2は認証方式がv1と異なる（Bearer必須） | 🟡 中 |
| Mixpanel API | レート制限が厳しい（Query: 60/hour, Export: 60/hour） | 🟢 低 |

---

## 1. 環境変数スコープ問題

### 問題

**LaunchAgentで設定した環境変数がOpenClaw Gateway（子プロセス）に渡らない。**

### 根拠

#### macOS LaunchAgent環境変数の動作（Apple Developer Forums）

> **環境変数継承の原則**: LaunchAgentで起動したプロセスは、plistの`EnvironmentVariables`セクションで設定された環境変数のみを持つ。macOSシステム全体の環境変数（`~/.zshrc`等で設定）は継承されない。

Source: https://developer.apple.com/forums/thread/681550

```xml
<!-- LaunchAgent plistでの環境変数設定例 -->
<key>EnvironmentVariables</key>
<dict>
  <key>REVENUECAT_API_KEY</key>
  <string>sk_xxxxx</string>
  <key>MIXPANEL_API_SECRET</key>
  <string>xxxxx</string>
</dict>
```

#### Node.js子プロセスの環境変数継承（公式ドキュメント）

```javascript
// デフォルト: 親のprocess.envを継承
const defaults = {
  cwd: undefined,
  env: process.env,  // ← 親プロセスの環境変数を継承
};

// カスタム環境変数を渡す
const child = spawn('node', ['script.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
});
```

Source: https://context7.com/nodejs/node/llms.txt

**重要な発見**:
- Node.jsの`spawn`/`fork`はデフォルトで親の`process.env`を継承する
- ただし、**親プロセスに環境変数がない場合、子にも渡らない**
- OpenClaw Gatewayが環境変数を持っていない場合、スキルプロセスにも渡らない

### 解決策

| # | アプローチ | 実装方法 | 推奨度 |
|---|-----------|---------|--------|
| 1 | **plistで環境変数を設定** | LaunchAgent plistの`EnvironmentVariables`に全API Keyを記載 | ⭐⭐⭐⭐⭐ |
| 2 | `openclaw.json`で設定 | OpenClaw設定ファイルに環境変数を記載（要検証） | ⭐⭐⭐⭐ |
| 3 | `~/.zshrc`に設定 | GUI環境では読まれないため**不適切** | ❌ |
| 4 | `.env`ファイル | OpenClawがdotenvを使っている場合のみ有効（要確認） | ⭐⭐⭐ |

**推奨実装（最優先）**:

```xml
<!-- ~/Library/LaunchAgents/com.openclaw.gateway.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.openclaw.gateway</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/openclaw/gateway.js</string>
  </array>

  <!-- 🔑 環境変数を明示的に設定（最重要） -->
  <key>EnvironmentVariables</key>
  <dict>
    <key>REVENUECAT_API_KEY</key>
    <string>sk_xxxxxxxxxxxxxxxxxx</string>
    <key>MIXPANEL_API_SECRET</key>
    <string>xxxxxxxxxxxxxxxxxx</string>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <!-- デバッグ用ログ -->
  <key>StandardOutPath</key>
  <string>/tmp/openclaw-gateway.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/openclaw-gateway-error.log</string>
</dict>
</plist>
```

適用コマンド:
```bash
# plist再読み込み
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist

# 環境変数が設定されているか確認（plistからは直接確認不可）
# ログファイルでprocess.envをダンプして確認
echo "console.log(process.env)" > /tmp/test-env.js
node /tmp/test-env.js
```

---

## 2. OpenClawスキル実行環境

### 問題

**OpenClawのスキルはどのプロセスで実行されるか？環境変数にアクセスできるか？**

### 根拠

#### OpenClawアーキテクチャ（Composio Blog調査結果）

> OpenClawは**ローカル実行のAIエージェント**で、スキルは独立した子プロセスとして実行される。セキュリティ上、スキルは制限された環境で動作する。

Source: https://composio.dev/blog/secure-openclaw-moltbot-clawdbot-setup

**OpenClawスキルの実行環境**:
1. **Gateway Process** (親) → LaunchAgentで起動
2. **Skill Process** (子) → Gatewayが`spawn`または`fork`で起動

```mermaid
LaunchAgent
  ↓ (起動)
Gateway Process (process.env = plistのEnvironmentVariables)
  ↓ (spawn/fork)
Skill Process (process.env = 親を継承)
```

**重要な発見**:
- スキルは新しいNode.jsプロセスとして実行される可能性が高い
- Node.jsのデフォルト動作により、親の`process.env`を継承する
- ただし、**Gatewayに環境変数がなければスキルにも渡らない**

### 解決策

| # | アプローチ | 実装方法 | 推奨度 |
|---|-----------|---------|--------|
| 1 | **Gateway起動時に環境変数を設定** | LaunchAgent plistで設定（前述） | ⭐⭐⭐⭐⭐ |
| 2 | Gatewayコードで明示的に渡す | `spawn`の`env`オプションで明示的に設定 | ⭐⭐⭐⭐ |
| 3 | `openclaw.json`で設定 | OpenClaw公式機能として環境変数設定（要検証） | ⭐⭐⭐ |

**検証スクリプト（Gateway内で実行）**:
```javascript
// Gateway起動時にログ
console.log('Gateway process.env:', process.env);

// スキル起動時に環境変数を明示的に渡す
const { spawn } = require('child_process');

const skill = spawn('node', ['skill.js'], {
  env: {
    ...process.env,  // 親の環境を継承
    REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY,
    MIXPANEL_API_SECRET: process.env.MIXPANEL_API_SECRET,
  },
});

skill.stdout.on('data', (data) => {
  console.log(`Skill output: ${data}`);
});
```

---

## 3. RevenueCat V2 API

### 問題

**RevenueCat APIの認証方式がv1とv2で異なる。Bearer tokenが必須。**

### 根拠

#### RevenueCat API v2認証（公式ドキュメント）

> **重要**: API v1とv2は認証方式が異なる。v2は**RFC 7235**に準拠し、`Authorization`ヘッダーに`Bearer`プレフィックスが必須。v1のAPI Keyはv2では使えない。

Source: https://www.revenuecat.com/docs/api-v2/index

```http
# v1認証（非推奨）
Authorization: sk_xxxxxxxxxxxxxxxx

# v2認証（必須形式）
Authorization: Bearer sk_xxxxxxxxxxxxxxxx
```

### APIエンドポイント詳細

| エンドポイント | URL | メソッド | レート制限 |
|---------------|-----|---------|----------|
| Overview Metrics | `/v2/projects/{project_id}/metrics/overview` | GET | **5 requests/minute** |
| Apps | `/v2/projects/{project_id}/apps` | GET/POST | 60 requests/minute |
| Products | `/v2/projects/{project_id}/products` | GET | 60 requests/minute |

**リクエスト例**:
```bash
curl -X GET "https://api.revenuecat.com/v2/projects/projbb7b9d1b/metrics/overview?currency=USD" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json"
```

**レスポンス例**:
```json
{
  "object": "overview_metrics",
  "metrics": [
    {
      "id": "active_trials",
      "name": "Active Trials",
      "value": 34765,
      "unit": "$",
      "last_updated_at_iso8601": "2022-10-13 09:45:00.123000+00:00"
    }
  ]
}
```

### 解決策

| # | アクション | 詳細 |
|---|-----------|------|
| 1 | **v2 Secret Key発行** | RevenueCat Dashboard → Project Settings → API Keys → Create v2 Secret Key |
| 2 | 環境変数に設定 | `REVENUECAT_API_KEY=sk_xxxxxxxx` |
| 3 | Authorizationヘッダー修正 | `Authorization: Bearer ${process.env.REVENUECAT_API_KEY}` |
| 4 | レート制限対策 | Overview Metricsは5req/min → キャッシュ必須 |

**スキル実装例**:
```javascript
// Anicca RevenueCat Skill
const fetch = require('node-fetch');

async function getRevenueCatMetrics(projectId) {
  const apiKey = process.env.REVENUECAT_API_KEY;

  if (!apiKey) {
    throw new Error('REVENUECAT_API_KEY not found in environment');
  }

  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${projectId}/metrics/overview?currency=USD`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,  // ← Bearer必須
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// 使用例
getRevenueCatMetrics('projbb7b9d1b')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## 4. Mixpanel API

### 問題

**Mixpanel APIの認証方式とレート制限を正しく理解する必要がある。**

### 根拠

#### Mixpanel API認証（公式ドキュメント）

> **Service Account認証**: HTTP Basic Authを使用。username:secretの形式でBase64エンコードして`Authorization`ヘッダーに設定。

Source: https://developer.mixpanel.com/reference/service-accounts

```bash
# cURL Basic Auth（推奨）
curl https://mixpanel.com/api/app/me \
  --user EXAMPLE_USER:EXAMPLE_PASSWORD

# cURL Header
curl https://mixpanel.com/api/app/me \
  --header 'Authorization: Basic base64(username:secret)'

# Python Requests
import requests
response = requests.get(
  'https://mixpanel.com/api/app/me',
  auth=('serviceaccount_username', 'serviceaccount_secret'),
)
```

### APIエンドポイントとレート制限

| API | エンドポイント | レート制限 | 同時実行 |
|-----|---------------|----------|----------|
| Query API | `/api/query/*` | 60 queries/hour | 5 concurrent |
| Export API | `/api/2.0/export` | 60 queries/hour | 3 queries/sec, 100 concurrent |
| Engage API | `/api/2.0/engage` | 同上 | - |

**重要なパラメータ**:
```javascript
// Query API
const params = {
  project_id: 3970220,  // integer（Aniccaプロジェクト）
  from_date: '2026-02-01',  // yyyy-mm-dd
  to_date: '2026-02-05',
  event: '["rc_trial_started_event"]',  // JSON array
};

// Export API
const params = {
  project_id: 3970220,
  from_date: '2026-02-01',
  to_date: '2026-02-05',
  limit: 100000,  // 最大100,000
  event: '["user_signup"]',
};
```

### 解決策

| # | アクション | 詳細 |
|---|-----------|------|
| 1 | **Service Account作成** | Mixpanel Dashboard → Settings → Service Accounts |
| 2 | 環境変数に設定 | `MIXPANEL_SERVICE_ACCOUNT=username:secret` |
| 3 | Basic Auth使用 | `Authorization: Basic base64(username:secret)` |
| 4 | レート制限対策 | 60req/hour → 1分に1回まで |

**スキル実装例**:
```javascript
// Anicca Mixpanel Skill
const fetch = require('node-fetch');

async function getMixpanelEvents(projectId, fromDate, toDate) {
  const [username, secret] = process.env.MIXPANEL_SERVICE_ACCOUNT.split(':');

  if (!username || !secret) {
    throw new Error('MIXPANEL_SERVICE_ACCOUNT not configured');
  }

  const auth = Buffer.from(`${username}:${secret}`).toString('base64');

  const params = new URLSearchParams({
    project_id: projectId,
    from_date: fromDate,
    to_date: toDate,
    limit: 100000,
  });

  const response = await fetch(
    `https://data.mixpanel.com/api/2.0/export?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'text/plain',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Mixpanel API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  // JSONLフォーマット（1行1イベント）
  return text.split('\n').filter(Boolean).map(JSON.parse);
}

// 使用例
getMixpanelEvents(3970220, '2026-02-01', '2026-02-05')
  .then(events => console.log(events))
  .catch(err => console.error(err));
```

---

## 推奨アクション（優先順）

### 🔴 最優先（今すぐ実行）

| # | アクション | 担当 | 所要時間 |
|---|-----------|------|---------|
| 1 | **LaunchAgent plistに環境変数を追加** | DevOps | 10分 |
| 2 | Gateway再起動してログ確認 | DevOps | 5分 |
| 3 | RevenueCat v2 Secret Key発行 | DevOps | 5分 |
| 4 | Mixpanel Service Account作成 | DevOps | 5分 |

**実装手順**:
```bash
# 1. plistを編集
vi ~/Library/LaunchAgents/com.openclaw.gateway.plist

# EnvironmentVariablesセクションに以下を追加:
# <key>REVENUECAT_API_KEY</key>
# <string>sk_xxxxxxxx</string>
# <key>MIXPANEL_SERVICE_ACCOUNT</key>
# <string>username:secret</string>

# 2. Gateway再起動
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist

# 3. ログ確認（環境変数が渡っているか）
tail -f /tmp/openclaw-gateway.log
tail -f /tmp/openclaw-gateway-error.log
```

### 🟡 次のステップ（1週間以内）

| # | アクション | 担当 | 所要時間 |
|---|-----------|------|---------|
| 5 | RevenueCat Skillを実装してテスト | Developer | 2時間 |
| 6 | Mixpanel Skillを実装してテスト | Developer | 2時間 |
| 7 | レート制限対策（キャッシュ実装） | Developer | 4時間 |

### 🟢 将来的な改善（1ヶ月以内）

| # | アクション | 担当 | 所要時間 |
|---|-----------|------|---------|
| 8 | `openclaw.json`での環境変数設定を調査 | Developer | 1時間 |
| 9 | `.env`ファイルサポートを確認 | Developer | 30分 |
| 10 | エラーハンドリングとリトライロジック | Developer | 4時間 |

---

## 参考資料

### 公式ドキュメント

| サービス | URL |
|---------|-----|
| RevenueCat API v2 | https://www.revenuecat.com/docs/api-v2 |
| Mixpanel APIs | https://developer.mixpanel.com/reference |
| Node.js Child Process | https://nodejs.org/api/child_process.html |
| macOS LaunchAgent | https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html |

### コミュニティリソース

| トピック | URL |
|---------|-----|
| OpenClaw Security | https://composio.dev/blog/secure-openclaw-moltbot-clawdbot-setup |
| LaunchAgent環境変数 | https://developer.apple.com/forums/thread/681550 |
| RevenueCat MCP Setup | https://www.revenuecat.com/docs/tools/mcp/setup |

---

## 次のステップ

1. **環境変数設定のテスト**:
   ```bash
   # テストスクリプト作成
   echo "console.log('REVENUECAT_API_KEY:', process.env.REVENUECAT_API_KEY);" > /tmp/test-env.js
   echo "console.log('MIXPANEL_SERVICE_ACCOUNT:', process.env.MIXPANEL_SERVICE_ACCOUNT);" >> /tmp/test-env.js

   # Gateway経由で実行（環境変数が渡っているか確認）
   node /tmp/test-env.js
   ```

2. **APIテスト**:
   ```bash
   # RevenueCat API
   curl -X GET "https://api.revenuecat.com/v2/projects/projbb7b9d1b/metrics/overview" \
     -H "Authorization: Bearer $REVENUECAT_API_KEY"

   # Mixpanel API
   curl -X GET "https://mixpanel.com/api/app/me" \
     --user "$MIXPANEL_SERVICE_ACCOUNT"
   ```

3. **スキル実装**:
   - RevenueCat Skill: `skills/revenuecat-metrics/`
   - Mixpanel Skill: `skills/mixpanel-analytics/`

---

**調査完了日**: 2026年2月5日
**次回レビュー**: 環境変数設定後のテスト結果を確認
