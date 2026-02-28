# Spec: x402 サービス分離（Strangler Fig パターン）

## 開発環境

| 項目 | 値 |
|------|-----|
| **ブランチ** | `dev` |
| **ベースブランチ** | `dev` |
| **作業状態** | Spec 作成完了 |
| **対象** | API + iOS |

---

## 1. 概要（What & Why）

### What

x402 エージェント向け API（emotion-detector, buddhist-counsel）を既存 API サーバーから分離し、Railway 上に独立サービスとしてデプロイする。加えて、iOS アプリの API タイムアウトを短縮し、サーバー障害時にアプリが固まらないようにする。

### Why

2026-02-28 に x402 の CDP 鍵エラーが API サーバー全体をクラッシュさせた。**お金を払っているユーザーへの通知が丸1日止まった。** x402 と iOS 通知は無関係なのに、同じプロセスにいるせいで巻き添えで死んだ。**二度と起こしてはいけない。**

### ベストプラクティス

ソース: [AWS Prescriptive Guidance - Strangler Fig Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/strangler-fig.html) / 核心の引用: 「incrementally transform a monolithic application into microservices by replacing a particular functionality with a new service」

ソース: [Railway Monorepo Guide](https://docs.railway.com/guides/deploying-a-monorepo) / 核心の引用: 「set root directory for each service, configure watch paths to prevent code changes in one service from triggering a rebuild of other services」

ソース: [microservices.io - Strangler Application](https://microservices.io/patterns/refactoring/strangler-application.html) / 核心の引用: 「gradually replace specific pieces of functionality with new applications and services」

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
│   │   ├── index.js           ← x402Router をマウント
│   │   └── ...
│   └── server.js
└── package.json
```

**To-Be:**

```
apps/api/                          ← 既存 API（x402 を削除）
├── src/
│   ├── routes/
│   │   ├── index.js              ← x402Router のマウントを削除
│   │   └── ...（x402/ ディレクトリ削除）
│   └── server.js
└── package.json

apps/x402-agents/                  ← 新サービス
├── src/
│   ├── routes/
│   │   ├── emotionDetector.js    ← apps/api から移動
│   │   └── buddhistCounsel.js    ← apps/api から移動
│   ├── services/
│   │   └── buddhistCounselService.js  ← apps/api から移動
│   ├── lib/
│   │   └── prisma.js             ← DB 接続（同じ PostgreSQL）
│   └── server.js                 ← 新規: Express + x402 paymentMiddleware
├── prisma/
│   └── schema.prisma             ← 既存と同じスキーマ（読み取り + agentAuditLog 書き込み）
├── package.json                  ← x402 依存 + openai + prisma
└── Dockerfile                    ← Railway 用（start: node src/server.js）
```

**Railway 設定:**

| 項目 | Service 1: API（既存） | Service 2: x402-agents（新規） |
|------|----------------------|------------------------------|
| Root Directory | `apps/api/` | `apps/x402-agents/` |
| Watch Paths | `apps/api/**` | `apps/x402-agents/**` |
| 環境変数 | 既存のまま（CDP_* を削除） | `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `X402_WALLET_ADDRESS`, `X402_NETWORK`, `OPENAI_API_KEY`, `DATABASE_URL` |
| ドメイン | `anicca-proxy-production.up.railway.app` | Railway が自動生成（例: `anicca-x402-agents.up.railway.app`） |
| 内部通信 | 不要（独立） | 不要（独立） |

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

---

## 5. 境界

### やること

| やること |
|---------|
| `apps/x402-agents/` を新規作成（Express + x402 + Prisma） |
| `apps/api/src/routes/x402/` を削除 |
| `apps/api/src/routes/index.js` から x402Router を削除 |
| Railway に新サービス「x402-agents」を追加 |
| 新サービスに環境変数を設定 |
| 既存 API から CDP 関連の環境変数を削除 |
| iOS の `NetworkSessionManager` と `AppState` を修正 |

### やらないこと

| やらないこと | 理由 |
|-------------|------|
| DB スキーマ変更 | 同じ PostgreSQL を共有。agentAuditLog テーブルは既存 |
| Prisma migration | スキーマは同じ。migration は既存 API 側で管理 |
| x402 のビジネスロジック変更 | 移動するだけ。ロジックは変えない |
| `buddhistCounselService.js` の変更 | 移動するだけ |

### 触るファイル

| ファイル | 変更 |
|---------|------|
| `apps/x402-agents/` 全体 | 新規作成 |
| `apps/api/src/routes/x402/` | 削除 |
| `apps/api/src/routes/index.js` | x402Router のマウントを削除 |
| `aniccaios/aniccaios/Services/NetworkSessionManager.swift` | 1行変更 |
| `aniccaios/aniccaios/AppState.swift` | 1行追加 |

### 触らないファイル

| ファイル | 理由 |
|---------|------|
| `apps/api/src/server.js` | 変更不要 |
| `apps/api/prisma/` | 変更不要 |
| iOS の他のファイル | スコープ外 |

---

## 6. 実行手順

```
Step 1:  apps/x402-agents/ を作成（server.js, package.json, routes, prisma）
Step 2:  apps/api/src/routes/x402/ を削除、index.js から x402Router を外す
Step 3:  dev に commit & push
Step 4:  Railway に新サービス「x402-agents」を追加
         - Root Directory: apps/x402-agents/
         - Watch Paths: apps/x402-agents/**
         - 環境変数: CDP_API_KEY_ID, CDP_API_KEY_SECRET, X402_WALLET_ADDRESS, X402_NETWORK, OPENAI_API_KEY, DATABASE_URL
Step 5:  既存 API の環境変数から CDP_API_KEY_ID, CDP_API_KEY_SECRET を削除
Step 6:  両サービスのデプロイ確認
Step 7:  iOS の NetworkSessionManager + AppState を修正
Step 8:  fastlane test
Step 9:  main に push → Production デプロイ
Step 10: 動作確認（AC-1 〜 AC-7）
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
*根拠: Strangler Fig Pattern (AWS/microservices.io) + Railway Monorepo Guide*
