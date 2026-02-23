# to-agents-learning.md — x402 スキル量産の学び

**目的**: buddhist-counsel を作る過程で得た全ての学びを記録し、to-agents-skill（工場）の型にする。

---

## Phase 1: buddhist-counsel 構築ログ

### Step 1+2: 5スキル圧縮 + Mega Prompt 組立（統合実行）

| # | 学び |
|---|------|
| 1 | skill-condenser と prompt-assemble は別々にやる必要なし。5スキルの SKILL.md を全部読んで、buddhist-counsel の Output 構造に合わせて必要な要素だけ抽出→1つの system prompt に直接組み立てる方が速い |
| 2 | elicitation は「2,500行」と言われていたが SKILL.md 本体は 476行。リファレンスファイル込みの数字だった。リファレンスは読まなくてOK — SKILL.md だけで十分な知識密度がある |
| 3 | 5スキル合計 1,523行 → 約120行の system prompt に圧縮。圧縮率 92%。捨てたのは: 例示の繰り返し、著者紹介、参考文献リスト、スコアリング指示、製品設計パターン（buddhist-counsel には不要） |
| 4 | therapist (96行) はほぼそのまま使えた。短くて密度が高いスキルは圧縮不要 |
| 5 | lotus-wisdom の「STOP HERE」インタラクティブ対話パターンは API レスポンスでは使えない。概念（upaya, 非二元）だけ抽出してプロンプトに埋め込んだ |
| 6 | drive-motivation の「7つの外的報酬の致命的欠陥」は直接使わないが、「指示的アドバイスは逆効果」の根拠として禁止事項セクションに統合した |
| 7 | improve-retention の B=MAP と Tiny Habits Recipe はそのまま guidance セクションの設計指針になった。最も直接的に使えたスキル |
| 8 | Mega Prompt のセクション順序: WHO → HOW → NEVER → TOOLKIT → LANGUAGE → OUTPUT。ネガティブ制約（NEVER）を TOOLKIT の前に置くことで、ツール適用時に禁止事項が先に頭に入る |
| 9 | Output は JSON only で返させる。自然言語で返すと後処理が必要になる。JSON schema を system prompt 末尾に明示するのが Anthropic 推奨パターン |
| 10 | counsel_id は Sonnet に生成させる（`csl_<random8chars>`）。サーバー側で上書きしてもいいが、LLM に生成させることでレスポンス内の一貫性が保たれる |

### Step 3: SKILL.md 完成（skillcraft）

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

### Step 4: Railway エンドポイント実装

| # | 学び |
|---|------|
| 1 | Top-level `await` を x402/index.js 内で使うと、routes/index.js 経由で全 API ルートのインポートチェーンが壊れる。`@x402/express` パッケージが解決できない場合、try-catch があっても ESM モジュール評価自体が失敗し、**全ルートが 404 になる** |
| 2 | 解決策: `initX402Middleware()` を通常の async 関数にして、モジュール末尾で `.catch()` 付きで呼ぶ。Router は同期的にエクスポートされ、middleware は非同期で後から追加される |
| 3 | AgentAuditLog の Prisma スキーマは `eventType`/`executedBy`/`requestPayload`/`responsePayload`。`action`/`agentId`/`details` は存在しない。**既存スキーマを必ず読んでからコードを書く** |
| 4 | sanitizeInput は `routes/agent/nudge.js` にコピーがある。DRY にするより、x402 は独立モジュールとして自己完結させた方が安全（依存先変更の影響を受けない） |
| 5 | Anthropic API の `ANTHROPIC_API_KEY` は Railway staging に設定済みだったが、**クレジット残高不足**で 400 エラー。env 変数の存在確認だけでなく、実際に API を叩いてレスポンスを確認するまでテスト完了としない |
| 6 | x402 テストでは supertest + vitest でルート・バリデーション・サニタイズを検証。generateCounsel を vi.mock で差し替えるので ANTHROPIC_API_KEY 不要 |
| 7 | Railway にリンクされている environment を必ず確認（`railway status`）。production にリンクされた状態で `railway logs` を見ると staging のログが出ない |
| 8 | **Anthropic API はサブスク（Pro/Max）では使えない。** claude.ai チャットと Console API は完全に別製品。サーバーから `@anthropic-ai/sdk` を使うにはクレジット購入が必要 |
| 9 | **OpenAI に切り替えるのが最安。** Railway に `OPENAI_API_KEY` が既にあれば変更は15行。Mega Prompt は LLM 非依存で設計してあるから model 名を変えるだけ |
| 10 | OpenAI の `response_format: { type: 'json_object' }` を使えば regex で JSON を抽出する必要がない。Anthropic SDK にはこの機能がない |

### Step 4.5: v2.4 API 移行（staging 502 修復）

| # | 学び |
|---|------|
| 11 | `@x402/evm` をインストールすると `ethers` が peer dependency として必要。`npm install @x402/evm` だけでは `Cannot find module 'ethers'` エラー。`npm install ethers` も必要 |
| 12 | `x402ResourceServer` と `x402HTTPResourceServer` は別クラス。`x402HTTPResourceServer` は `register()` メソッドがない（高レベルラッパー）。`x402ResourceServer` の方を使う |
| 13 | `x402ResourceServer` は `@x402/express` からも `@x402/core/server` からもインポートできる。`HTTPFacilitatorClient` は `@x402/core/server` からのみ |
| 14 | `paymentMiddleware` の引数は4つ: `(routes, server, paywallConfig, paywall, syncFacilitatorOnStart)`。`undefined, undefined, false` で paywall なし + 手動初期化 |
| 15 | `server.initialize()` を try-catch 内で先に呼び、`syncFacilitatorOnStart = false` を渡す。これで unhandled rejection を完全に防げる。staging 502→200 復帰を確認済み |
| 16 | v2.4 の `routes` 設定は Express のルートパスではなく `METHOD /path` 形式。例: `'POST /buddhist-counsel'` |
| 17 | `@coinbase/x402` は package.json に残っていても v2 では使わない。削除しなくても害はないが、次のスキルでは最初から入れない |
| 18 | **`paymentMiddleware()` は同期関数。** Promise を返さない。Express ミドルウェア関数を同期的に返す。非同期初期化（facilitator 同期、bazaar 拡張）はミドルウェア内部でリクエスト到着時に lazy 実行される。だから **dynamic import は不要** — static import で問題ない |
| 19 | **dynamic import + router.use() の順序バグ。** `await import('@x402/express')` を async 関数内でやると、`router.use('/route', handler)` が先に同期的に登録される。Express はミドルウェアを追加順に実行するから、ルートハンドラが先に実行されて payment gate を素通りする |
| 20 | **公式パターン: トップレベル import + app.use() でルートの前に登録。** coinbase/x402 の E2E サーバー（`e2e/servers/express/index.ts`）がそのまま正解。`app.use(paymentMiddleware(routes, server))` → `app.get('/route', handler)` の順 |

### Step 5: テスト（testnet E2E）

| # | 学び |
|---|------|
| — | （作業開始後に記録） |

### Step 6: 公開（ClawHub + Moltbook）

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

---

## 失敗パターン（再現防止）

| # | 何が起きたか | 原因 | 対策 |
|---|-------------|------|------|
| 1 | x402/index.js の top-level await が全 API ルートを 404 に | ESM の import chain で 1 モジュールの評価失敗が上流に波及 | dynamic import は async 関数内に閉じ込め、.catch() で握りつぶす |
| 2 | Anthropic API が 400 で返る | Railway staging の ANTHROPIC_API_KEY のアカウントにクレジットがない | env 変数の存在だけでなく、API の実応答を確認するまで完了としない |
| 3 | staging 502 無限クラッシュ。`TypeError: this.ResourceServer.initialize is not a function` | `@x402/express` v2.4 は v1 と API が完全に異なる。v1: `paymentMiddleware(facilitator, config)`、v2: `paymentMiddleware(routes, server)`。`@coinbase/x402` の facilitator を第1引数に渡すと、v2 は第2引数を `x402ResourceServer` として扱い、config オブジェクトに `.initialize()` を呼ぼうとして TypeError | v2 API を使う: `x402ResourceServer` + `HTTPFacilitatorClient` + `ExactEvmScheme`。`@coinbase/x402` は v1 用で v2 では不要 |
| 4 | try-catch で囲んでいるのにプロセスクラッシュ | `paymentMiddleware()` は middleware 関数を **返すだけ**。`initialize()` は Express がリクエスト受信時に非同期で実行される。その時点では factory 側の try-catch の外 | `syncFacilitatorOnStart = false` にして、`server.initialize()` を try-catch 内で明示的に先に呼ぶ |
| 5 | payment gate が素通り（200 が返る、402 にならない） | `paymentMiddleware()` を `async function initX402Middleware()` 内で dynamic import → `router.use()` していた。`router.use('/buddhist-counsel', handler)` は同期的に先に登録されるため、ルートハンドラが payment middleware より先に実行される | **static import** でトップレベルに `paymentMiddleware` を取得し、`router.use()` でルートハンドラの **前** に同期的に登録する。公式パターン（coinbase/x402 E2E server）に従う |

## 成功パターン（再利用）

| # | 何がうまくいったか | なぜ | 再利用方法 |
|---|-------------------|------|-----------|
| 1 | Mega Prompt を LLM 非依存で設計 | JSON schema を system prompt 末尾に置く。LLM 固有の機能に依存しない | 新スキルでも同じパターンで設計すれば、LLM を自由に切り替えられる |
| 2 | supertest + vi.mock で LLM なしテスト | generateCounsel をモックするので API キー不要 | 全 x402 スキルで同じテストパターンを使える |
| 3 | x402 middleware を条件付き初期化 | env 変数なしでも動く = dev/staging で payment gate なしでテスト可能 | 全 x402 エンドポイントで同じ index.js パターンを使える |
| 4 | npm パッケージのソースコードを直接読んで API を確認 | ドキュメントが v1 のまま更新されていない。`node_modules/` の `.mjs` を読むのが最も信頼できる | 新しいパッケージを使う前に必ず `node -e "import('pkg').then(m => console.log(Object.keys(m)))"` でエクスポートを確認 |
| 5 | staging 502 修復後に `.well-known/x402.json` と `/health` の両方を確認 | health だけだと x402 固有の問題を見逃す。`.well-known/x402.json` が正しい JSON を返すことで middleware 初期化成功を確認 | デプロイ後のヘルスチェックは必ず2つ: `/health` + サービス固有エンドポイント |

---

## リサーチ段階の学び（Phase 1 開始前に記録）

| # | 学び | ソース |
|---|------|--------|
| 1 | x402-layer は SUSPICIOUS。api.x402layer.cc という第三者プロキシを経由する。Coinbase 3-skill set を使え | x402-layer 25ファイル分析 |
| 2 | `/.well-known/x402.json` は x402 公式仕様に存在しない。Zapper も 404 を返す | GitHub tree 全検索 + 実サービス確認 |
| 3 | Bazaar 登録は declareDiscoveryExtension で自動。ただし最初の取引後に初めてカタログ化される | Bazaar API 調査 |
| 4 | Facilitator 手数料: 月1,000無料、以降 $0.001/取引 | Coinbase 公式ドキュメント |
| 5 | Base mainnet タイムアウト問題（Issue #1062）: ファシリテーター 5-10秒 < ブロック確認 10-28秒 → testnet-first 必須 | GitHub Issues |
| 6 | settle 成功率 ~40%（Issue #1065）→ リトライ + 返金フロー必須 | GitHub Issues |
| 7 | 公式ドキュメントの facilitatorUrl は嘘。`import { facilitator } from '@coinbase/x402'` が正解（Issue #933） | GitHub Issues |
| 8 | CORS → express.json() → x402 middleware の順序が CRITICAL（Issue #236 + #752） | GitHub Issues |
| 9 | `@x402/extensions` は別パッケージ。ESM インポートバグあり（Issue #876） | GitHub Issues |
| 10 | CDP API Key は mainnet のみ必須。testnet は不要 | GitHub Issues |
| 11 | 新規セラーの Month 1 収益: $0〜$30 が現実。12,559件中アクティブ 612件（4.9%） | x402scan.com リアルタイムデータ |
| 12 | Mega Prompt が最安・最速。Prompt Chaining（5回 API call）はコスト負け | OpenAI + Anthropic 公式 |
| 13 | `@x402/express` v2.4 の `paymentMiddleware` は `(routes, x402ResourceServer)` を取る。v1 の `(facilitator, config)` は **完全に壊れる**。`@coinbase/x402` は v1 用パッケージ | `node_modules/@x402/express/dist/esm/index.mjs` ソース直読み |
| 14 | v2 では `@x402/evm` パッケージが必須。`ExactEvmScheme` を `server.register(network, scheme)` で登録する。未インストールだと `import` で失敗する | `@x402/express` の依存ツリー確認 |
| 15 | `HTTPFacilitatorClient` はデフォルトで `https://x402.org/facilitator` に接続する。URL 指定不要（コンストラクタ引数なし） | `@x402/core/dist/esm/server/index.mjs` ソース直読み |
| 16 | `paymentMiddleware()` の第5引数 `syncFacilitatorOnStart`（デフォルト true）が true だと、最初のリクエスト受信時に `httpServer.initialize()` が呼ばれる。これが factory 呼び出し側の try-catch の外で実行されるため、エラーが unhandled rejection になりプロセスがクラッシュする | `@x402/express/dist/esm/index.mjs` L111 確認 |
