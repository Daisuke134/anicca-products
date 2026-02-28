# Spec: x402 サービス分離（Strangler Fig パターン）

## 開発環境

| 項目 | 値 |
|------|-----|
| **ブランチ** | `dev` |
| **ベースブランチ** | `dev` |
| **作業状態** | Spec v2（ベストプラクティス深掘り済み） |
| **対象** | API + iOS |

---

## 1. 概要（What & Why）

### What

x402 エージェント向け API（emotion-detector, buddhist-counsel）を既存 API サーバーから分離し、Railway 上に独立サービスとしてデプロイする。加えて、iOS アプリの API タイムアウトを短縮し、サーバー障害時にアプリが固まらないようにする。

### Why

2026-02-28 に x402 の CDP 鍵エラーが API サーバー全体をクラッシュさせた。**お金を払っているユーザーへの通知が丸1日止まった。** x402 と iOS 通知は無関係なのに、同じプロセスにいるせいで巻き添えで死んだ。**二度と起こしてはいけない。**

### ベストプラクティス根拠

| # | ソース | URL | 核心の引用 |
|---|--------|-----|-----------|
| BP-1 | AWS Prescriptive Guidance - Strangler Fig | https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/strangler-fig.html | 「incrementally transform a monolithic application into microservices by replacing a particular functionality with a new service」 |
| BP-2 | Microsoft Azure - Strangler Fig Pattern | https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig | 「A façade (proxy) intercepts requests that go to the back-end legacy system. The façade routes these requests either to the legacy application or to the new services.」 |
| BP-3 | microservices.io - Strangler Application | https://microservices.io/patterns/refactoring/strangler-application.html | 「gradually replace specific pieces of functionality with new applications and services」 |
| BP-4 | Railway Monorepo Guide | https://docs.railway.com/guides/deploying-a-monorepo | 「Setting this means that Railway will only pull down files from that directory when creating new deployments.」 |
| BP-5 | Railway Blog - Deploying Monorepos | https://blog.railway.com/p/deploying-monorepos | 「Isolated monorepo components are 100% contained in the folder they reside in」 |
| BP-6 | Express.js - Health Checks and Graceful Shutdown | https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html | 「Once the application gets this signal, it should stop accepting new requests, finish all the ongoing requests, clean up the resources it used, including database connections and file locks then exit.」 |
| BP-7 | Prisma - Configure with PgBouncer | https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer | 「For Prisma Client to work reliably, PgBouncer must run in Transaction mode.」 |
| BP-8 | Prisma - Working With Data in Large Teams | https://www.prisma.io/blog/working-with-data-in-large-teams | 「Version every schema change in Git. Review schema changes through pull requests. Use diff tools like Prisma Migrate to visualize changes before they go live.」 |
| BP-9 | Render - Connecting Multiple Services to Shared DB | https://render.com/articles/connecting-multiple-services-to-a-shared-database | 「Total Service Pools ≤ Database Connection Limit - Reserved Connections (approx. 3)」 |
| BP-10 | goldbergyoni/nodebestpractices - Docker | https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/multi_stage_builds.md | 「Multi-stage builds allow to separate build- and runtime-specific environment details」 |

---

## 2. 受け入れ条件

| # | 条件 | 確認方法 |
|---|------|---------|
| AC-1 | x402-agents サービスが Railway で独立して動作する | `curl -X POST https://<x402-agents-domain>/emotion-detector` が 402（未払い）を返す |
| AC-2 | 既存 API から x402 ルートが完全に削除されている | `curl -X POST https://anicca-proxy-production.up.railway.app/api/x402/emotion-detector` が 404 |
| AC-3 | 既存 API の `/health` が 200 を返す | `curl https://anicca-proxy-production.up.railway.app/health` → 200 |
| AC-4 | 通知送信ジョブが正常動作する | Railway ログで `problemNudgeApnsSender` が出力される |
| AC-5 | x402-agents がクラッシュしても既存 API に影響なし | x402-agents を停止 → 既存 API の `/health` が 200 |
| AC-6 | iOS アプリが API 不在でも 10秒以内にメイン画面表示 | 実機 Cold start 計測 ≤ 10秒 |
| AC-7 | x402-agents のログに `💰 x402 payment middleware active` が出る | Railway ログ確認 |
| AC-8 | x402-agents の `/health` が 200 を返す | `curl https://<x402-agents-domain>/health` → 200 |
| AC-9 | x402-agents が SIGTERM で graceful shutdown する | Railway ログで `Shutting down gracefully...` + `Prisma disconnected` 確認 |

---

## 3. As-Is / To-Be

### 修正1: x402 を独立サービスに分離（API 側）

**As-Is:**

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── x402/              ← API サーバーの中にいる
│   │   │   ├── index.js       ← paymentMiddleware + CDP 鍵依存
│   │   │   ├── emotionDetector.js
│   │   │   ├── buddhistCounsel.js
│   │   │   └── __tests__/
│   │   ├── index.js           ← x402Router をマウント（L34, L71）
│   │   └── ...
│   ├── services/
│   │   └── buddhistCounselService.js  ← x402 専用サービス
│   └── server.js
└── package.json               ← x402 依存パッケージも含む
```

**To-Be:**

```
apps/api/                          ← 既存 API（x402 を完全削除）
├── src/
│   ├── routes/
│   │   ├── index.js              ← x402Router のマウント削除（L34, L70-71 削除）
│   │   └── ...（x402/ ディレクトリ削除）
│   ├── services/                 ← buddhistCounselService.js 削除
│   └── server.js
└── package.json                  ← @x402/*, @coinbase/x402, ethers を削除

apps/x402-agents/                  ← 新サービス（完全独立）
├── src/
│   ├── routes/
│   │   ├── emotionDetector.js    ← apps/api から移動（import パス修正）
│   │   └── buddhistCounsel.js    ← apps/api から移動（import パス修正）
│   ├── services/
│   │   └── buddhistCounselService.js  ← apps/api から移動
│   ├── lib/
│   │   └── prisma.js             ← DB 接続（同じ PostgreSQL）
│   └── server.js                 ← 新規（下記設計）
├── prisma/
│   └── schema.prisma             ← 既存 API と同じスキーマ（コピー）
├── package.json                  ← x402 依存 + openai + prisma + zod + express
└── railway.toml                  ← Railway 設定ファイル
```

### x402-agents/src/server.js 設計

ソース: [Express.js - Health Checks and Graceful Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html) / 核心の引用: 「it should stop accepting new requests, finish all the ongoing requests, clean up the resources it used, including database connections and file locks then exit.」

```
server.js の責務:
─────────────────────────────
1. Express app 作成
2. /health エンドポイント（ヘルスチェック）
3. x402 paymentMiddleware 初期化（syncFacilitatorOnStart: false）
4. ルートマウント（/emotion-detector, /buddhist-counsel）
5. SIGTERM ハンドラ（graceful shutdown）
   → server.close() → prisma.$disconnect() → process.exit(0)
6. ポート: process.env.PORT || 3001
```

### Railway 設定

| 項目 | Service 1: API（既存） | Service 2: x402-agents（新規） |
|------|----------------------|------------------------------|
| Root Directory | `apps/api/` | `apps/x402-agents/` |
| Watch Paths | `apps/api/**` | `apps/x402-agents/**` |
| Start Command | `prisma migrate deploy && prisma generate && node src/server.js` | `npx prisma generate && node src/server.js` |
| 環境変数（削除） | `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` を削除 | — |
| 環境変数（設定） | 既存のまま | 下記テーブル |
| ドメイン | `anicca-proxy-production.up.railway.app` | Railway 自動生成 |
| 内部通信 | 不要（独立） | 不要（独立） |

**x402-agents 環境変数:**

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `CDP_API_KEY_ID` | `organizations/ebca6893-.../apiKeys/c3e01f63-...` | x402 CDP 認証 |
| `CDP_API_KEY_SECRET` | PEM 秘密鍵 | x402 CDP 認証 |
| `X402_WALLET_ADDRESS` | 既存と同じ | x402 支払い先 |
| `X402_NETWORK` | `eip155:8453` | Base Mainnet |
| `OPENAI_API_KEY` | 既存と同じ | GPT-4o 呼び出し |
| `DATABASE_URL` | 既存と同じ PostgreSQL URL | agentAuditLog 書き込み |
| `PORT` | Railway 自動設定 | Express ポート |

### railway.toml（x402-agents）

ソース: [Railway Docs - Monorepo](https://docs.railway.com/guides/monorepo) / 核心の引用: 「The Railway Config File does not follow the Root Directory path. You have to specify the absolute path.」

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npx prisma generate && node src/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 10
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### DB 接続管理（共有 PostgreSQL）

ソース: [Render - Connecting Multiple Services to Shared DB](https://render.com/articles/connecting-multiple-services-to-a-shared-database) / 核心の引用: 「Total Service Pools ≤ Database Connection Limit - Reserved Connections (approx. 3)」

```
接続プール設計
─────────────────────────────
Railway PostgreSQL 接続上限: 100（8GB 未満インスタンス）
  → API サービス: connection_limit=10（Prisma デフォルト）
  → x402-agents: connection_limit=5（トラフィック少）
  → 合計: 15 / 100 = 余裕あり

x402-agents の prisma.js:
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  })
  ※ connection_limit は DATABASE_URL の ?connection_limit=5 で制御
```

ソース: [Prisma - Working With Data in Large Teams](https://www.prisma.io/blog/working-with-data-in-large-teams) / 核心の引用: 「When multiple teams share a database, things break. Migrations conflict, queries start to bloat, or ownership gets murky.」

```
マイグレーション管理
─────────────────────────────
所有者: apps/api/ が唯一のマイグレーション管理者
x402-agents: マイグレーション実行しない（npx prisma generate のみ）
理由: 2サービスが migrate deploy を競合実行すると壊れる
```

### x402-agents の package.json 依存関係

```
既存 API から移動する依存:
─────────────────────────────
@coinbase/x402        → x402-agents へ
@x402/evm             → x402-agents へ
@x402/express         → x402-agents へ
@x402/extensions      → x402-agents へ
ethers                → x402-agents へ

既存 API から削除:
─────────────────────────────
@coinbase/x402, @x402/evm, @x402/express, @x402/extensions, ethers
（buddhistCounselService.js も削除されるので x402 関連は完全にゼロになる）

x402-agents に必要な全依存:
─────────────────────────────
express, cors, express-rate-limit, zod,
openai, @prisma/client, prisma,
@coinbase/x402, @x402/evm, @x402/express, @x402/extensions, ethers,
dotenv
```

### 修正2: iOS 側の API タイムアウト短縮

**As-Is:**

| ファイル | 現状 |
|---------|------|
| `NetworkSessionManager.swift:19` | `config.httpMaximumConnectionsPerHost = 1` |
| `AppState.swift` の `bootstrapProfileFromServerIfAvailable` | タイムアウト指定なし（デフォルト 30秒） |

**To-Be:**

| ファイル | 変更後 |
|---------|--------|
| `NetworkSessionManager.swift:19` | `config.httpMaximumConnectionsPerHost = 4` |
| `AppState.swift` の `bootstrapProfileFromServerIfAvailable` | `request.timeoutInterval = 8.0` |

---

## 4. テストマトリックス

| # | To-Be | テスト名 | カバー |
|---|-------|----------|--------|
| 1 | x402-agents が独立して起動する | `curl /health` on x402-agents → 200 | OK |
| 2 | emotion-detector が x402 課金ゲート付きで動く | `curl -X POST /emotion-detector`（未払い）→ 402 | OK |
| 3 | buddhist-counsel が x402 課金ゲート付きで動く | `curl -X POST /buddhist-counsel`（未払い）→ 402 | OK |
| 4 | 既存 API から x402 ルートが消えている | `curl /api/x402/emotion-detector` → 404 | OK |
| 5 | 既存 API の `/health` が 200 | `curl /health` → 200 | OK |
| 6 | 通知送信ジョブが動作する | Railway ログで `problemNudgeApnsSender` 確認 | OK |
| 7 | x402-agents 停止時に既存 API に影響なし | x402-agents 停止 → API `/health` 200 | OK |
| 8 | iOS bootstrap が 8秒でタイムアウトする | `test_bootstrapTimesOutIn8Seconds()` | OK |
| 9 | タイムアウト後に isBootstrappingProfile が false | `test_bootstrapFlagClearedAfterTimeout()` | OK |
| 10 | 実機起動が 10秒以内 | 実機 Cold start 計測 ≤ 10秒 | OK |
| 11 | x402-agents が SIGTERM で graceful shutdown | Railway ログ確認 | OK |
| 12 | 既存 API の package.json から x402 依存が消えている | `grep @x402 apps/api/package.json` → 0件 | OK |

---

## 5. 境界

### やること

| やること |
|---------|
| `apps/x402-agents/` を新規作成（Express + x402 + Prisma + graceful shutdown） |
| `apps/x402-agents/railway.toml` を作成（healthcheck + restart policy） |
| `apps/api/src/routes/x402/` を削除 |
| `apps/api/src/services/buddhistCounselService.js` を削除 |
| `apps/api/src/routes/index.js` から x402Router のマウントを削除（L34, L70-71） |
| `apps/api/package.json` から x402 関連依存を削除 |
| Railway に新サービス「x402-agents」を追加（CLI: `railway service create`） |
| 新サービスに環境変数を設定（CLI: `railway variables --set`） |
| 既存 API から CDP 関連の環境変数を削除 |
| iOS の `NetworkSessionManager` と `AppState` を修正 |

### やらないこと

| やらないこと | 理由 |
|-------------|------|
| DB スキーマ変更 | 同じ PostgreSQL を共有。agentAuditLog テーブルは既存 |
| Prisma migration | x402-agents は `prisma generate` のみ。migration は既存 API 側が所有 |
| x402 のビジネスロジック変更 | 移動するだけ。ロジックは変えない |
| `buddhistCounselService.js` の変更 | 移動するだけ（import パスのみ修正） |
| PgBouncer 導入 | 現時点で接続数は余裕あり（15/100）。将来の最適化タスク |
| API Gateway / Facade | x402-agents は独立ドメイン。プロキシ不要 |

### 触るファイル

| ファイル | 変更 |
|---------|------|
| `apps/x402-agents/` 全体 | 新規作成 |
| `apps/api/src/routes/x402/` | 削除 |
| `apps/api/src/services/buddhistCounselService.js` | 削除 |
| `apps/api/src/routes/index.js` | x402Router のマウント削除（L34, L70-71） |
| `apps/api/package.json` | x402 関連依存の削除 |
| `aniccaios/aniccaios/Services/NetworkSessionManager.swift` | 1行変更 |
| `aniccaios/aniccaios/AppState.swift` | 1行追加 |

### 触らないファイル

| ファイル | 理由 |
|---------|------|
| `apps/api/src/server.js` | 変更不要 |
| `apps/api/prisma/` | 変更不要（schema は x402-agents にコピーするだけ） |
| iOS の他のファイル | スコープ外 |

---

## 6. 実行手順

```
Step 1:  apps/x402-agents/ を作成
         - package.json（x402 依存 + express + prisma + openai + zod）
         - prisma/schema.prisma（apps/api/prisma/ からコピー）
         - src/lib/prisma.js（connection_limit=5 付き）
         - src/services/buddhistCounselService.js（apps/api から移動）
         - src/routes/emotionDetector.js（apps/api から移動、import パス修正）
         - src/routes/buddhistCounsel.js（apps/api から移動、import パス修正）
         - src/server.js（Express + x402 + /health + graceful shutdown）
         - railway.toml（healthcheck + restart policy）

Step 2:  apps/api から x402 を完全削除
         - src/routes/x402/ ディレクトリ削除
         - src/services/buddhistCounselService.js 削除
         - src/routes/index.js から x402Router のマウント削除
         - package.json から @x402/*, @coinbase/x402, ethers を削除

Step 3:  dev に commit & push

Step 4:  Railway に新サービス「x402-agents」を追加
         - railway service create x402-agents
         - Root Directory: apps/x402-agents/
         - Watch Paths: apps/x402-agents/**
         - 環境変数設定（railway variables --set）

Step 5:  既存 API の環境変数から CDP_API_KEY_ID, CDP_API_KEY_SECRET を削除

Step 6:  両サービスのデプロイ確認
         - x402-agents: /health → 200, 💰 ログ確認
         - 既存 API: /health → 200, /api/x402/* → 404

Step 7:  iOS の NetworkSessionManager + AppState を修正

Step 8:  fastlane test

Step 9:  main に push → Production デプロイ

Step 10: 動作確認（AC-1 〜 AC-9）
```

---

## E2E 判定

| 項目 | 値 |
|------|-----|
| UI 変更 | なし |
| 新画面 | なし |
| 新ボタン/操作 | なし |
| 結論 | Maestro E2E: **不要**（バックエンド分離 + タイムアウト変更のみ。curl + 実機起動計測で確認） |

---

## ユーザー作業

**なし。** 全て Claude が実行する。

---

*作成: 2026-02-28*
*v2: 2026-02-28（ベストプラクティス深掘り: 10ソース引用追加、graceful shutdown、DB接続管理、パッケージ整理、railway.toml 追加）*
*根拠: Strangler Fig Pattern (AWS/Azure/microservices.io) + Railway Monorepo Guide + Express.js Graceful Shutdown + Prisma Multi-Service BP*
