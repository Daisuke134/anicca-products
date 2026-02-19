# x402 Nudge API — 実装スペック v2

**作成日**: 2026-02-18
**更新日**: 2026-02-18（調査結果に基づき全面改訂）
**優先度**: 最高（最初の$1を稼ぐ）

---

## 概要

AniccaのNudge生成能力をx402プロトコルで外部エージェントに販売する。
**既存の `/api/agent/nudge` エンドポイント（GPT-4o-mini、SAFE-T、監査ログ付き）を内部で再利用し、x402ミドルウェアで有料化する。**
支払いはUSDC（Baseチェーン）で自動。ファシリテータ手数料ゼロ（Coinbase CDP）。

---

## 現状の資産（再利用するもの）

| 資産 | ファイル | 状態 |
|------|---------|------|
| Nudge生成（GPT-4o-mini） | `apps/api/src/routes/agent/nudge.js` | 本番稼働中 |
| プロンプトインジェクション防止 | 同上 | 実装済み |
| SAFE-T危機検出 + Slackアラート | 同上 | 実装済み |
| 監査ログ（AgentAuditLog） | 同上 | 実装済み |
| マルチプラットフォーム対応 | 同上 | 実装済み |

**新規実装**: x402ミドルウェア + 公開エンドポイント + ステータスエンドポイント + メトリクスのみ。

---

## アーキテクチャ

```
外部エージェント → POST /api/x402/nudge
                     ↓
               x402ミドルウェア（$0.01 USDC on Base）
                     ↓
               支払いなし → 402 Payment Required
               支払いあり → Coinbase CDP Facilitator が検証
                     ↓
               検証OK → 既存 nudge.js のロジックを内部呼び出し
                     ↓
               x402用レスポンス形式に変換して返却
```

**Anicca VPS（OpenClaw）は `/api/agent/nudge` を直接使い続ける**（認証済み、無料）。
x402は外部エージェント向けの有料ラッパー。

---

## エンドポイント

### 1. `POST /api/x402/nudge` — Nudge生成（有料）

**価格**: $0.01/リクエスト（USDC, Base mainnet）

**価格根拠**:
- OpenAI GPT-4o-mini コスト: ~$0.001-0.003/req
- ファシリテータ手数料: $0（Coinbase CDP）
- Baseガス代: ~$0.001以下
- 粗利: ~$0.006-0.008/req
- 競合比較: Exa Answer（LLM使用）$0.01、Exa Search $0.01

#### Request

```json
{
  "text": "I've been scrolling TikTok for 4 hours and I can't stop",
  "context": "User is 22, reported anxiety and sleep issues last week",
  "language": "en"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `text` | string | YES | ユーザーの苦しみを表すテキスト（最大2000文字） |
| `context` | string | NO | 追加コンテキスト（年齢、過去の問題等。最大1000文字） |
| `language` | string | NO | レスポンス言語（デフォルト: `en`。`ja`/`en` 対応） |

#### Response (200)

```json
{
  "problemTypes": ["phone_addiction", "anxiety"],
  "severity": 0.7,
  "nudge": {
    "hook": "The scroll isn't feeding you",
    "content": "Your mind is restless and seeking comfort in motion. But scrolling doesn't rest the mind — it exhausts it. Put the phone face-down for 10 minutes. Just 10. Notice what happens when the urge passes.",
    "tone": "gentle",
    "approach": "compassionate_observation",
    "principle": "Impermanence — this urge will pass"
  },
  "confidence": 0.89
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `problemTypes` | string[] | 検出された問題タイプ（1〜3個） |
| `severity` | number | 重症度 0.0〜1.0（0.9以上はSAFE-T対象） |
| `nudge.hook` | string | 短い共感的オープニング（通知タイトルとして使える） |
| `nudge.content` | string | Nudge本文（エージェントがそのままユーザーに送れる） |
| `nudge.tone` | string | トーン（gentle/strict/playful/analytical/empathetic） |
| `nudge.approach` | string | 介入アプローチ名 |
| `nudge.principle` | string | 仏教的原則 |
| `confidence` | number | 分類の信頼度 0.0〜1.0 |

#### ProblemTypes（既存13タイプ — iOS ProblemType.swift と同一）

```
staying_up_late, cant_wake_up, self_loathing, rumination,
procrastination, anxiety, lying, bad_mouthing, porn_addiction,
alcohol_dependency, anger, obsessive, loneliness
```

#### Error Responses

| コード | 意味 |
|---|---|
| 400 | `text`が空 or 2000文字超 |
| 402 | 支払い必要（x402プロトコル `PAYMENT-REQUIRED` ヘッダー） |
| 429 | レート制限（100 req/min） |
| 500 | 内部エラー |

---

### 2. `GET /api/x402/status` — サービスステータス（無料）

```json
{
  "service": "anicca-nudge-api",
  "version": "1.0.0",
  "status": "operational",
  "price_per_request": "$0.01",
  "network": "base",
  "currency": "USDC",
  "problem_types_supported": 13,
  "tones_supported": 5,
  "languages": ["en", "ja"],
  "total_requests_30d": 0
}
```

---

## 支払いフロー（x402 v2 プロトコル）

```
1. エージェント → POST /api/x402/nudge（body付き、支払いヘッダーなし）
2. x402ミドルウェアが 402 返す
   Header: PAYMENT-REQUIRED: <base64 JSON>
   {
     "x402Version": 2,
     "accepts": [{
       "scheme": "exact",
       "network": "eip155:8453",
       "amount": "10000",  // $0.01 in USDC atoms (6 decimals)
       "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
       "payTo": "0x6592EB8EF820aBC092e8C3474fb2042dffCCEDc7"
     }]
   }
3. エージェントが EIP-3009 署名を作成
4. エージェント → 同じリクエスト + PAYMENT-SIGNATURE ヘッダー
5. Coinbase CDPファシリテータが署名・残高・時刻を検証
6. 検証OK → Nudge生成 → レスポンス返却 + PAYMENT-RESPONSE ヘッダー
7. ファシリテータがUSDC送金をBaseチェーンに送信
8. $0.01 が 0x6592EB8EF820aBC092e8C3474fb2042dffCCEDc7 に着金
```

---

## 実装詳細

### 依存パッケージ

```bash
npm install @x402/express @x402/core @x402/evm
```

**注意**: `x402-express`（レガシー）ではなく `@x402/express`（現行v2）を使う。

### ファイル構成

```
apps/api/src/
├── routes/
│   └── x402/
│       ├── nudge.js          # POST /api/x402/nudge（既存nudge.jsのロジックを呼び出す）
│       └── status.js         # GET /api/x402/status
└── middleware/
    └── x402.js               # x402ミドルウェア設定
```

**`services/x402NudgeService.js` は不要。** 既存の `routes/agent/nudge.js` のロジックを関数として切り出して呼ぶ。

### x402ミドルウェア設定（`middleware/x402.js`）

```javascript
import { paymentMiddleware, x402ResourceServer } from '@x402/express'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'

const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://api.cdp.coinbase.com/platform/v2/x402' // mainnet
})

const server = new x402ResourceServer(facilitatorClient)
  .register('eip155:8453', new ExactEvmScheme())

const x402Config = paymentMiddleware(
  {
    'POST /api/x402/nudge': {
      accepts: [{
        scheme: 'exact',
        price: '$0.01',
        network: 'eip155:8453',
        payTo: process.env.X402_WALLET_ADDRESS,
      }],
      description: 'Buddhist suffering detection and compassionate nudge generation',
      mimeType: 'application/json',
    }
  },
  server
)

export default x402Config
```

### Nudgeルート（`routes/x402/nudge.js`）

既存の `/api/agent/nudge` のコアロジック（GPT-4o-mini呼び出し、サニタイズ、SAFE-T）を
共通関数として切り出し、x402ルートから呼ぶ。

```javascript
// routes/x402/nudge.js
import { generateNudgeForExternal } from '../agent/nudgeCore.js'

router.post('/nudge', async (req, res) => {
  const { text, context, language } = req.body

  // バリデーション
  if (!text || text.length > 2000) {
    return res.status(400).json({ error: 'text is required (max 2000 chars)' })
  }

  // 既存ロジック呼び出し（platform='x402'として記録）
  const result = await generateNudgeForExternal({
    context: text + (context ? `\n\nAdditional context: ${context}` : ''),
    language: language || 'en',
    platform: 'x402',
  })

  // x402用レスポンス形式に変換
  res.json({
    problemTypes: result.problemTypes || [],
    severity: result.severityScore || 0,
    nudge: {
      hook: result.hook,
      content: result.content,
      tone: result.tone,
      approach: result.approach || 'compassionate_observation',
      principle: result.buddhismReference || 'Impermanence (anicca)',
    },
    confidence: result.confidence || 0.8,
  })
})
```

### ルーター登録（`app.js`）

```javascript
import x402Middleware from './middleware/x402.js'
import x402NudgeRouter from './routes/x402/nudge.js'
import x402StatusRouter from './routes/x402/status.js'

// x402ミドルウェア（/api/x402/nudge のみ課金）
app.use(x402Middleware)

// x402ルート（認証不要 — 支払いが認証の代わり）
app.use('/api/x402', x402NudgeRouter)
app.use('/api/x402', x402StatusRouter)
```

---

## 環境変数

| 変数 | 値 | 場所 | 状態 |
|---|---|---|---|
| `X402_WALLET_ADDRESS` | `0x6592EB8EF820aBC092e8C3474fb2042dffCCEDc7` | Railway + VPS `.env` | 設定済み |
| `X402_NETWORK` | `eip155:8453` | Railway + VPS `.env` | 設定済み |
| `X402_NUDGE_PRICE` | `0.01` | Railway `.env` | **要更新**（0.005→0.01） |

---

## ディスカバリ（Bazaar拡張）

x402ルート設定に `extensions.bazaar.discoverable: true` を追加すれば、
Coinbase CDPのディスカバリAPIに自動登録される。

```javascript
'POST /api/x402/nudge': {
  // ...price, network, payTo...
  extensions: {
    bazaar: {
      discoverable: true,
      category: 'mental-health',
      tags: ['nudge', 'buddhism', 'suffering', 'compassion', 'mental-health'],
      inputSchema: { /* request schema */ },
      outputSchema: { /* response schema */ },
    }
  }
}
```

**注意**: Bazaarは early development 段階。APIが変わる可能性あり。

---

## SAFE-T対応

severity >= 0.9 の場合（既存ロジックをそのまま使用）:
- 通常Nudgeの代わりに危機対応レスポンスを返す
- `nudge.approach` = `"crisis_support"`
- IASP helpline URL を含む（国際対応）
- Slackアラート発火（既存の仕組み）

---

## レート制限

- 100 req/min per IP（express-rate-limit、メモリベース）
- SAFE-T crisis は制限なし（命に関わるため）

---

## テスト

### Base Sepolia（テストネット）でまずテスト

```bash
# ステータス確認（無料）
curl https://anicca-proxy-staging.up.railway.app/api/x402/status

# Nudge生成（支払いなしで402が返ることを確認）
curl -X POST https://anicca-proxy-staging.up.railway.app/api/x402/nudge \
  -H "Content-Type: application/json" \
  -d '{"text": "I cant stop scrolling"}'
# → 402 Payment Required + PAYMENT-REQUIRED ヘッダー

# x402 MCP で実際にテスト（ウォレットにUSDC入金後）
# mcp__x402__fetch で自動支払い+取得
```

### テストネット → 本番の切り替え

| 項目 | テストネット | 本番 |
|------|-----------|------|
| ネットワーク | `eip155:84532`（Base Sepolia） | `eip155:8453`（Base） |
| ファシリテータ | `https://x402.org/facilitator` | `https://api.cdp.coinbase.com/platform/v2/x402` |
| USDC | テストトークン | 本物のUSDC |

---

## 収益シミュレーション（$0.01/req）

| 日次リクエスト | 日次収益 | 月次収益 | 年間 |
|---|---|---|---|
| 100 | $1.00 | $30 | $360 |
| 500 | $5.00 | $150 | $1,800 |
| 1,000 | $10.00 | $300 | $3,600 |
| 10,000 | $100.00 | $3,000 | $36,000 |

---

## 税務メモ（日本）

| 項目 | 内容 |
|------|------|
| 合法性 | YES — APIサービス対価としてのUSDC受取にライセンス不要 |
| 所得区分 | 事業所得（青色申告で65万円控除） |
| 申告不要の条件 | 給与所得者で暗号資産副収入が年20万円以下 |
| 記録 | Koinlyで受取日時・金額・JPYレートを自動記録 |

---

## 実装順序

| # | タスク | 所要時間（目安） |
|---|--------|----------------|
| 1 | `npm install @x402/express @x402/core @x402/evm` | 1分 |
| 2 | 既存 `routes/agent/nudge.js` からコアロジックを関数として切り出し | 30分 |
| 3 | `middleware/x402.js` 作成 | 15分 |
| 4 | `routes/x402/nudge.js` 作成 | 20分 |
| 5 | `routes/x402/status.js` 作成 | 10分 |
| 6 | ルーター登録（`app.js`） | 5分 |
| 7 | Base Sepolia でローカルテスト（402が返ることを確認） | 15分 |
| 8 | staging デプロイ + x402 MCP でE2Eテスト | 20分 |
| 9 | 本番切り替え（ネットワーク + ファシリテータ） | 5分 |
| 10 | VPS `.env` の `X402_NUDGE_PRICE` を 0.01 に更新 | 2分 |

---

## 別途やること（この実装とは分離）

| タスク | 理由 |
|--------|------|
| Commander Agent コード整理 | LLM Nudge cronは停止済みだがコードが残っている。参照調査後に削除 |
| VPS app-nudge-sender の404修正 | ユーザーリストAPIが404。x402とは独立した問題 |
| Bazaar登録 | x402が動いてから。early developmentなので急がない |
