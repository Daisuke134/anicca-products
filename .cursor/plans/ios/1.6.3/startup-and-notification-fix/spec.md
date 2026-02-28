# Spec: 起動ハング & 通知ゼロ & API クラッシュ 修正

## 開発環境

| 項目 | 値 |
|------|-----|
| **ブランチ** | `feature/startup-notification-fix` |
| **ベースブランチ** | `dev` |
| **作業状態** | Spec作成中 |
| **対象バージョン** | 1.6.3 |

---

## 1. 何が起きているか（原因）

### 症状

| 問題 | 症状 |
|------|------|
| 🔴 起動ハング | App Store版がずっとローディング画面のまま |
| 🔴 通知ゼロ | 昨日は大量に届いた通知が今日は1件もない |

### 原因は1つ: API サーバーがクラッシュループ中

Railway で確認済み: **API deployment status = CRASHED**（2026-02-28T13:58 JST以降）

`apps/api/src/routes/x402/index.js:21` の `new x402ResourceServer(facilitatorClient)` が、モジュール読み込み時に**同期 throw** する:

```javascript
const server = new x402ResourceServer(facilitatorClient);
// ↑ コンストラクタが同期的に throw（Promise rejection ではない）
// エラーメッセージ: "Invalid key format - must be either PEM EC key or base64 Ed25519 key"
// → throw が if ブロック外に伝播 → Node.js プロセスが死ぬ
// → Railway が再起動 → また死ぬ → ループ
```

**失敗モードの全件確定:**

| 処理 | 失敗タイプ | 捕捉方法 |
|------|----------|---------|
| `new x402ResourceServer(facilitatorClient)` | **同期 throw** | `try/catch` で完全捕捉 |
| `server.register(network, new ExactEvmScheme())` | 同期 throw（登録失敗時）| 同一 try ブロック内で捕捉 |
| `router.use(paymentMiddleware(..., server))` | 同期（ミドルウェア登録） | 同一 try ブロック内で捕捉 |
| ミドルウェア内でのリクエスト時エラー | Express Error Middleware が処理 | 別途 error handler で 500 応答（既存実装） |
| `process.on('unhandledRejection')` | `server.js` 既存ハンドラーが処理 | 既存実装（変更不要） |

→ **結論:** `try/catch` のスコープを上記3行全体に掛ければ、起動時のクラッシュは防止できる。リクエスト時の非同期エラーは既存 Express error middleware が処理する。

**これによって2つの症状が発生する:**

```
API が死んでいる
    ↓
┌───────────────────────────────────┬───────────────────────────────────┐
│ アプリ起動時に API を呼ぶ          │ 毎分の通知送信ジョブも              │
│ → 応答がない → 30秒待つ           │   API プロセスの中にある            │
│ → 「ローディング画面が30秒続く」   │ → API が死んでいる = ジョブも死亡   │
│                                   │ → 「通知が届かない」                │
└───────────────────────────────────┴───────────────────────────────────┘
```

### Railway 確認済み事実

| 項目 | 値 |
|------|-----|
| 最新デプロイ ID | `373b2143-03d6-49b8-82d7-2067bc039147` |
| デプロイ status | **CRASHED** |
| クラッシュ日時 | 2026-02-28T13:58:48 UTC（22:58 JST） |
| 再起動ポリシー | `ON_FAILURE`, max 10 retries → クラッシュループ |
| `PROBLEM_NUDGE_APNS_SENDER_ENABLED` | `true`（正常） |
| `NUDGE_SEND_KILL_SWITCH` | `false`（正常） |
| `X402_NETWORK` | `eip155:8453`（mainnet） |

---

## 2. 直った後の姿

| 状態 | 直前（今） | 直後（修正後） |
|------|-----------|--------------|
| Railway API | CRASHED、クラッシュループ | SUCCESS、安定稼働 |
| アプリ起動 | ローディングが30秒続く | 10秒以内にメイン画面が表示される |
| 通知 | 1件も届かない | デプロイ後15分以内に APNs 送信ジョブが動き始める |
| x402 保護ルート | API が死んでいるので全部不可 | x402 初期化失敗時は 503 を返す（API 自体は生きている） |

---

## 3. 受け入れ条件

| # | 条件 | 確認方法 | しきい値 |
|---|------|---------|---------|
| AC-1 | Railway API deployment status が SUCCESS になる | Railway MCP `list-deployments` | status = `SUCCESS` |
| AC-2 | ログに x402 クラッシュが出ない | Railway ログ | `Invalid key format` が出現しない |
| AC-3 | `/health` が 200 を返す | `curl https://anicca-proxy-production.up.railway.app/health` | HTTP 200 |
| AC-4 | アプリ起動が 10秒以内に完了する | 実機1回計測（起動タップ〜メイン画面表示まで） | ≤ 10秒 |
| AC-5 | APNs 送信ジョブがデプロイ後15分以内に動き始める | Railway ログで `problemNudgeApnsSender` が 15件以上出力 | ≥ 15 件 / 15分 |
| AC-6 | x402 初期化失敗時、`/emotion-detector` が 503 を返す | `curl -X POST /api/x402/emotion-detector` | HTTP 503 + `PAYMENT_GATE_UNAVAILABLE` |
| AC-7 | x402 初期化失敗時、`/buddhist-counsel` が 503 を返す | `curl -X POST /api/x402/buddhist-counsel` | HTTP 503 + `PAYMENT_GATE_UNAVAILABLE` |
| AC-8 | デプロイ後 5分間、Railway で再起動発生なし | Railway MCP `list-deployments` | restart count = 0 |

---

## 4. As-Is / To-Be

### 修正1: x402 クラッシュを封じる（API 側）

#### x402 ルートポリシーマトリクス

| `PAY_TO` 設定 | x402 初期化 | ルート種別 | 期待レスポンス |
|-------------|------------|----------|-------------|
| なし（未設定） | スキップ | `/health` | 200 |
| なし（未設定） | スキップ | `/api/x402/*` | ルーター通常動作（payment gate なし） |
| あり | **成功** | `/health` | 200 |
| あり | **成功** | `/api/x402/emotion-detector` | payment gate 通過後 200/402 |
| あり | **失敗** | `/health` | 200（API は生きている） |
| あり | **失敗** | `/api/x402/emotion-detector` | **503 `PAYMENT_GATE_UNAVAILABLE`** |
| あり | **失敗** | `/api/x402/buddhist-counsel` | **503 `PAYMENT_GATE_UNAVAILABLE`** |

**As-Is（クラッシュする）:**

```javascript
// apps/api/src/routes/x402/index.js:14-105
if (PAY_TO) {
  const facilitatorClient = isMainnet
    ? new HTTPFacilitatorClient(cdpFacilitator)
    : new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' });
  const server = new x402ResourceServer(facilitatorClient); // ← 同期 throw → API 死亡
  server.register(network, new ExactEvmScheme());
  router.use(paymentMiddleware({ ... }, server));
}

// ↓ payment gate なしで常に動く（fail-open 状態）
router.use('/buddhist-counsel', buddhistCounselRouter);
router.use('/emotion-detector', emotionDetectorRouter);
```

**To-Be（クラッシュしない + fail-closed）:**

```javascript
// apps/api/src/routes/x402/index.js:14-115
let x402Active = false;

if (PAY_TO) {
  try {
    const facilitatorClient = isMainnet
      ? new HTTPFacilitatorClient(cdpFacilitator)
      : new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' });
    const server = new x402ResourceServer(facilitatorClient); // 同期 throw → catch で捕捉
    server.register(network, new ExactEvmScheme());           // 同期 → catch 範囲内
    router.use(paymentMiddleware({ ... }, server));            // 同期登録 → catch 範囲内
    x402Active = true;
    console.log(`💰 x402 payment middleware active (${isMainnet ? 'MAINNET' : 'testnet'}, network: ${network})`);
  } catch (err) {
    // x402 が失敗してもサーバーは死なない。保護ルートは fail-closed（503）で応答する。
    console.error('⚠️ x402 initialization failed, protected routes will return 503:', err.message);
  }
}

// PAY_TO あり かつ 初期化失敗 → 保護対象ルートは 503（fail-closed）
if (!x402Active && PAY_TO) {
  router.use(['/buddhist-counsel', '/emotion-detector'], (_req, res) => {
    res.status(503).json({
      error: { code: 'PAYMENT_GATE_UNAVAILABLE', message: 'x402 payment gate is temporarily unavailable' }
    });
  });
}

router.use('/buddhist-counsel', buddhistCounselRouter);
router.use('/emotion-detector', emotionDetectorRouter);
```

**変更ファイル:** `apps/api/src/routes/x402/index.js`

---

### 修正2: iOS 側の API タイムアウトを短縮（iOS 側）

**起動 SLO 定義:**

| 項目 | 値 |
|------|-----|
| 計測開始点 | アプリアイコンタップ（Cold start） |
| 計測終了点 | メイン画面（ContentView のメインコンテンツ）が表示される瞬間 |
| 計測回数 | 1回（緊急修正確認）|
| 合格基準 | ≤ 10秒 |
| API 不在時の最大待機 | 8s（timeout） + iOS URLSession オーバーヘッド（≤2s） |
| タイムアウト後 | `isBootstrappingProfile = false` に遷移し必ずメイン画面へ |

**As-Is:**
```swift
// NetworkSessionManager.swift:19
config.httpMaximumConnectionsPerHost = 1   // 並列リクエストが直列化される

// AppState.swift:bootstrapProfileFromServerIfAvailable()
var request = URLRequest(url: AppConfig.profileSyncURL)
// タイムアウト指定なし → セッション global timeout 30秒が適用される
```

**To-Be:**
```swift
// NetworkSessionManager.swift:19
config.httpMaximumConnectionsPerHost = 4   // 並列接続を許可

// AppState.swift:bootstrapProfileFromServerIfAvailable()
var request = URLRequest(url: AppConfig.profileSyncURL)
request.timeoutInterval = 8.0              // 8秒でタイムアウト → defer で isBootstrappingProfile = false
```

**変更ファイル:**
- `aniccaios/aniccaios/Services/NetworkSessionManager.swift:19`
- `aniccaios/aniccaios/AppState.swift`（bootstrapProfileFromServerIfAvailable 内）

---

## 5. テストマトリックス

| # | 何をテストするか | テスト名 / 確認方法 | 種別 |
|---|----------------|-------------------|------|
| 1 | x402 初期化エラーでもサーバーが落ちない | `test_x402InitErrorDoesNotCrashServer()` | Unit |
| 2 | x402 失敗後に `/health` が 200 を返す | `curl /health` → HTTP 200 | Manual |
| 3 | x402 失敗時 `/emotion-detector` が 503+契約ボディを返す | `curl -X POST /api/x402/emotion-detector` → `{"error":{"code":"PAYMENT_GATE_UNAVAILABLE",...}}` | Manual |
| 4 | x402 失敗時 `/buddhist-counsel` が 503+契約ボディを返す | `curl -X POST /api/x402/buddhist-counsel` → 同上 | Manual |
| 5 | `PAY_TO` 未設定時、保護ルートが通常動作する（503 なし） | `PAY_TO=` 状態で `curl /api/x402/emotion-detector` → 503 以外 | Manual |
| 6 | bootstrap が 8秒でタイムアウトする | `test_bootstrapTimesOutIn8Seconds()` | Unit |
| 7 | タイムアウト後に isBootstrappingProfile が false になる | `test_bootstrapFlagClearedAfterTimeout()` | Unit |
| 8 | デプロイ後 5分間で再起動が発生しない | Railway MCP で restart count = 0 を確認 | Manual |
| 9 | APNs sender が15分で15回以上実行される | Railway ログで `problemNudgeApnsSender` ≥ 15件 / 15分 | Manual |
| 10 | 実機起動が10秒以内に完了する | 実機Cold start 1回計測 ≤ 10秒 | Manual |

---

## 6. 境界（やらないこと）

| 項目 | 理由 |
|------|------|
| x402 の鍵フォーマット問題の根本修正 | まず API を生かすことが目的。鍵の修正は別タスク |
| generateNudges の手動実行 | API が復活すれば毎分 APNs sender が動く。再実行不要 |
| AppDelegate の Task リアーキテクチャ | 影響範囲が広い。タイムアウト短縮で十分 |
| 起動 SLO の反復統計計測（p95/p99） | 緊急修正の受け入れに1回確認で十分。統計計測は別タスク |

---

## 7. 実行手順

```
Step 1: apps/api/src/routes/x402/index.js に try/catch + fail-closed middleware を追加
Step 2: dev にコミット & push → Railway staging で確認
Step 3: main に push → Railway production に自動デプロイ
Step 4: curl /health で 200 確認（AC-3）
Step 5: curl -X POST /api/x402/emotion-detector → 503 確認（AC-6）
Step 6: curl -X POST /api/x402/buddhist-counsel → 503 確認（AC-7）
Step 7: Railway MCP で restart count = 0 確認（AC-8）
Step 8: 15分後、Railway ログで problemNudgeApnsSender ≥ 15件 確認（AC-5）
Step 9: aniccaios の NetworkSessionManager + AppState を修正
Step 10: fastlane test でテスト実行（test #6, #7）
Step 11: 実機 Cold start 計測（AC-4、≤10秒）
```

---

## E2E 判定

| 項目 | 値 |
|------|-----|
| UI 変更 | なし |
| 新画面 | なし |
| 結論 | Maestro E2E: **不要**（`/health` curl + 実機起動時間計測で代替） |

---

## ユーザー作業

**なし。** 全て Claude が実行する。

---

*作成: 2026-02-28*
*Railway 確認済み: API status=CRASHED, x402 crash loop, PROBLEM_NUDGE_APNS_SENDER_ENABLED=true, NUDGE_SEND_KILL_SWITCH=false*
*Codex review iter 1: ok: false (5 blocking) → 修正済み*
*Codex review iter 2: ok: false (5 blocking) → 修正済み（SLO定義・ポリシーマトリクス・通知定量化・失敗モード確定・テスト拡張）*
